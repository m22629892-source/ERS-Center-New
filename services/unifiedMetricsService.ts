import { Emergency, EmergencyStatus, IncidentTask } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export interface UnifiedMetrics {
  activeIncidentsCount: number;
  totalOperationalIncidents: number;
  todayIncidentsCount: number;
  closedIncidentsCount: number;
  drillIncidentsCount: number;
  resolutionRate: number;
  avgResponseSeconds: number;
  medianResponseSeconds: number;
  p90ResponseSeconds: number;
  complianceRate: number;
  activeTasksMetrics: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
}

export interface UnifiedMetricsState {
  status: 'loading' | 'ready' | 'empty' | 'error';
  data: UnifiedMetrics;
  error?: string;
  lastCalculatedAt: number;
}

const DEFAULT_METRICS: UnifiedMetrics = {
  activeIncidentsCount: 0,
  totalOperationalIncidents: 0,
  todayIncidentsCount: 0,
  closedIncidentsCount: 0,
  drillIncidentsCount: 0,
  resolutionRate: 0,
  avgResponseSeconds: 0,
  medianResponseSeconds: 0,
  p90ResponseSeconds: 0,
  complianceRate: 100,
  activeTasksMetrics: {
    total: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
  },
};

export class UnifiedMetricsService {
  private static instance: UnifiedMetricsService;
  private cachedState: UnifiedMetricsState = {
    status: 'loading',
    data: { ...DEFAULT_METRICS },
    lastCalculatedAt: Date.now(),
  };

  private constructor() {}

  public static getInstance(): UnifiedMetricsService {
    if (!UnifiedMetricsService.instance) {
      UnifiedMetricsService.instance = new UnifiedMetricsService();
    }
    return UnifiedMetricsService.instance;
  }

  /**
   * Computes operational metrics with strict isolation of training drills (isDrill)
   */
  public computeMetrics(
    emergencies: Emergency[],
    activeTasks: IncidentTask[] = []
  ): UnifiedMetrics {
    if (!emergencies || emergencies.length === 0) {
      return { ...DEFAULT_METRICS };
    }

    // Separate operational production incidents from drills
    const operationalList = emergencies.filter(e => !e.isDrill);
    const drillList = emergencies.filter(e => !!e.isDrill);

    const activeList = operationalList.filter(e => e.status === EmergencyStatus.ACTIVE);
    const closedList = operationalList.filter(e => e.status === EmergencyStatus.CLOSED);

    // Today's boundaries (midnight local time)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    const todayList = operationalList.filter(e => (e.createdAt || 0) >= todayMs);

    // Calculate response durations (in seconds)
    const responseDurations: number[] = [];
    operationalList.forEach(e => {
      const start = e.createdAt || 0;
      const respTime = e.firstAcknowledgedAt || e.firstResponseAt || 0;
      if (start > 0 && respTime > start) {
        const diffSec = Math.round((respTime - start) / 1000);
        if (diffSec > 0 && diffSec < 86400) {
          responseDurations.push(diffSec);
        }
      }
    });

    responseDurations.sort((a, b) => a - b);

    let avgResponseSeconds = 0;
    let medianResponseSeconds = 0;
    let p90ResponseSeconds = 0;
    let complianceRate = 100;

    const SLA_TARGET_SECONDS = 300; // Standard 5-minute response target

    if (responseDurations.length > 0) {
      const sum = responseDurations.reduce((acc, v) => acc + v, 0);
      avgResponseSeconds = Math.round(sum / responseDurations.length);

      // Median (P50)
      const mid = Math.floor(responseDurations.length / 2);
      medianResponseSeconds = responseDurations.length % 2 !== 0
        ? responseDurations[mid]
        : Math.round((responseDurations[mid - 1] + responseDurations[mid]) / 2);

      // P90
      const p90Index = Math.min(
        responseDurations.length - 1,
        Math.floor(responseDurations.length * 0.9)
      );
      p90ResponseSeconds = responseDurations[p90Index];

      const withinSla = responseDurations.filter(d => d <= SLA_TARGET_SECONDS).length;
      complianceRate = Math.round((withinSla / responseDurations.length) * 100);
    }

    const totalOps = operationalList.length;
    const resolutionRate = totalOps > 0
      ? Math.round((closedList.length / totalOps) * 100)
      : 0;

    // Active tasks aggregation
    let tasksTotal = 0;
    let tasksCompleted = 0;
    let tasksOverdue = 0;
    const now = Date.now();

    activeTasks.forEach(task => {
      tasksTotal++;
      if (task.status === 'completed') tasksCompleted++;
      if (task.status === 'in_progress' && task.startedAt) {
        const targetMs = (task.targetDurationSeconds || 300) * 1000;
        if (now - task.startedAt > targetMs) tasksOverdue++;
      } else if (task.status === 'pending') {
        const targetMs = (task.targetDurationSeconds || 300) * 1000;
        const em = activeList.find(e => e.id === task.emergencyId);
        if (em && (now - em.createdAt > targetMs)) tasksOverdue++;
      }
    });

    const taskCompletionRate = tasksTotal > 0
      ? Math.round((tasksCompleted / tasksTotal) * 100)
      : 0;

    return {
      activeIncidentsCount: activeList.length,
      totalOperationalIncidents: totalOps,
      todayIncidentsCount: todayList.length,
      closedIncidentsCount: closedList.length,
      drillIncidentsCount: drillList.length,
      resolutionRate,
      avgResponseSeconds,
      medianResponseSeconds,
      p90ResponseSeconds,
      complianceRate,
      activeTasksMetrics: {
        total: tasksTotal,
        completed: tasksCompleted,
        overdue: tasksOverdue,
        completionRate: taskCompletionRate,
      },
    };
  }

  /**
   * Realtime reactive subscription to unified operational metrics
   */
  public subscribeUnifiedMetrics(
    callback: (state: UnifiedMetricsState) => void
  ): () => void {
    const q = collection(db, 'emergencies');

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allEmergencies = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as Emergency)
        );

        const computed = this.computeMetrics(allEmergencies);
        const status = allEmergencies.length === 0 ? 'empty' : 'ready';

        this.cachedState = {
          status,
          data: computed,
          lastCalculatedAt: Date.now(),
        };

        callback(this.cachedState);
      },
      (error) => {
        console.error('UnifiedMetrics subscription error:', error);
        this.cachedState = {
          status: 'error',
          data: { ...DEFAULT_METRICS },
          error: error.message,
          lastCalculatedAt: Date.now(),
        };
        callback(this.cachedState);
      }
    );

    return unsubscribe;
  }
}

export const unifiedMetricsService = UnifiedMetricsService.getInstance();

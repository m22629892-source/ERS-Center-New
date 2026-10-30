import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Emergency, EmergencyStatus, ResponsePerformanceTargets, IncidentResponseMetrics } from '../types';

export const DEFAULT_RESPONSE_TARGETS: ResponsePerformanceTargets = {
  targetTimeToAcknowledgeSeconds: 60,   // 1 minute
  targetTimeToArriveSeconds: 300,       // 5 minutes
  targetTimeToResolveSeconds: 1800,     // 30 minutes
};

export interface ResponseAnalyticsSummary {
  totalIncidents: number;
  completedIncidents: number;
  inProgressIncidents: number;

  // Time to Acknowledge (TTA)
  avgTimeToAcknowledgeSec: number;
  medianTimeToAcknowledgeSec: number;
  p90TimeToAcknowledgeSec: number;
  metAcknowledgeCount: number;
  metAcknowledgePercent: number;

  // Time to Arrive (TTR)
  avgTimeToArriveSec: number;
  medianTimeToArriveSec: number;
  p90TimeToArriveSec: number;
  metArrivalCount: number;
  metArrivalPercent: number;

  // Resolution Duration
  avgResolutionDurationSec: number;
  medianResolutionDurationSec: number;
  p90ResolutionDurationSec: number;
  metResolutionCount: number;
  metResolutionPercent: number;

  // Groupings
  byCategory: Record<string, { count: number; avgAcknowledge: number; avgArrival: number; complianceRate: number }>;
  byFloor: Record<string, { count: number; avgAcknowledge: number; avgArrival: number; complianceRate: number }>;
  byShift: {
    morning: { count: number; avgArrival: number; complianceRate: number };
    evening: { count: number; avgArrival: number; complianceRate: number };
    night: { count: number; avgArrival: number; complianceRate: number };
  };

  // Raw calculated incident metrics
  incidentMetrics: IncidentResponseMetrics[];
}

export class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;
  private targets: ResponsePerformanceTargets = { ...DEFAULT_RESPONSE_TARGETS };

  private constructor() {
    this.initTargetsListener();
  }

  public static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  private initTargetsListener() {
    try {
      const docRef = doc(db, 'system', 'responseTargets');
      onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          this.targets = { ...DEFAULT_RESPONSE_TARGETS, ...snap.data() };
        }
      }, (err) => {
        console.warn('Notice listening to responseTargets:', err);
      });
    } catch (e) {}
  }

  public getTargets(): ResponsePerformanceTargets {
    return this.targets;
  }

  public async updateTargets(newTargets: Partial<ResponsePerformanceTargets>, userId?: string): Promise<boolean> {
    try {
      const updated: ResponsePerformanceTargets = {
        ...this.targets,
        ...newTargets,
        updatedAt: Date.now(),
        updatedBy: userId || 'admin',
      };
      await setDoc(doc(db, 'system', 'responseTargets'), updated, { merge: true });
      this.targets = updated;
      return true;
    } catch (e) {
      console.error('Error saving response targets:', e);
      return false;
    }
  }

  /**
   * Computes comprehensive operational metrics from incident dataset
   */
  public computeAnalytics(
    emergencies: Emergency[],
    filterRange?: { startMs: number; endMs: number },
    customTargets?: ResponsePerformanceTargets,
    excludeDrills: boolean = true
  ): ResponseAnalyticsSummary {
    const targets = customTargets || this.targets;

    // Filter out drills if requested
    let list = excludeDrills ? emergencies.filter(e => !e.isDrill) : emergencies;

    // Filter by date range if provided
    if (filterRange) {
      list = list.filter(
        (e) => e.createdAt >= filterRange.startMs && e.createdAt <= filterRange.endMs
      );
    }

    const incidentMetrics: IncidentResponseMetrics[] = [];
    const ttaValues: number[] = [];
    const ttrValues: number[] = [];
    const resolutionValues: number[] = [];

    const categoryMap: Record<string, { count: number; totalAck: number; ackCount: number; totalArr: number; arrCount: number; metTarget: number }> = {};
    const floorMap: Record<string, { count: number; totalAck: number; ackCount: number; totalArr: number; arrCount: number; metTarget: number }> = {};
    const shiftMap = {
      morning: { count: 0, totalArr: 0, arrCount: 0, metTarget: 0 },
      evening: { count: 0, totalArr: 0, arrCount: 0, metTarget: 0 },
      night: { count: 0, totalArr: 0, arrCount: 0, metTarget: 0 },
    };

    let completedCount = 0;
    let inProgressCount = 0;
    let metAcknowledgeCount = 0;
    let metArrivalCount = 0;
    let metResolutionCount = 0;

    list.forEach((em) => {
      if (em.status === EmergencyStatus.CLOSED) completedCount++;
      else inProgressCount++;

      // TTA: Time to first human acknowledgment
      let ttaSec: number | undefined;
      if (em.firstAcknowledgedAt && em.firstAcknowledgedAt >= em.createdAt) {
        ttaSec = Math.round((em.firstAcknowledgedAt - em.createdAt) / 1000);
        ttaValues.push(ttaSec);
      }

      // TTR: Time to first confirmed arrival
      let ttrSec: number | undefined;
      if (em.firstArrivalAt && em.firstArrivalAt >= em.createdAt) {
        ttrSec = Math.round((em.firstArrivalAt - em.createdAt) / 1000);
        ttrValues.push(ttrSec);
      }

      // Response started (en-route)
      let ttrResponseSec: number | undefined;
      if (em.firstResponseAt && em.firstResponseAt >= em.createdAt) {
        ttrResponseSec = Math.round((em.firstResponseAt - em.createdAt) / 1000);
      }

      // Resolution time
      let resSec: number | undefined;
      if (em.closedAt && em.closedAt >= em.createdAt) {
        resSec = Math.round((em.closedAt - em.createdAt) / 1000);
        resolutionValues.push(resSec);
      }

      const metAck = ttaSec !== undefined && ttaSec <= targets.targetTimeToAcknowledgeSeconds;
      const metArr = ttrSec !== undefined && ttrSec <= targets.targetTimeToArriveSeconds;
      const metRes = resSec !== undefined && resSec <= targets.targetTimeToResolveSeconds;

      if (metAck) metAcknowledgeCount++;
      if (metArr) metArrivalCount++;
      if (metRes) metResolutionCount++;

      // Determine Floor & Wing
      const floor = this.extractFloor(em.locationName);
      const category = em.typeName || 'General';

      // Determine Shift
      const date = new Date(em.createdAt);
      const hour = date.getHours();
      let shiftKey: 'morning' | 'evening' | 'night' = 'morning';
      if (hour >= 7 && hour < 15) shiftKey = 'morning';
      else if (hour >= 15 && hour < 23) shiftKey = 'evening';
      else shiftKey = 'night';

      // Category grouping
      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, totalAck: 0, ackCount: 0, totalArr: 0, arrCount: 0, metTarget: 0 };
      }
      categoryMap[category].count++;
      if (ttaSec !== undefined) {
        categoryMap[category].totalAck += ttaSec;
        categoryMap[category].ackCount++;
      }
      if (ttrSec !== undefined) {
        categoryMap[category].totalArr += ttrSec;
        categoryMap[category].arrCount++;
      }
      if (metArr) categoryMap[category].metTarget++;

      // Floor grouping
      if (!floorMap[floor]) {
        floorMap[floor] = { count: 0, totalAck: 0, ackCount: 0, totalArr: 0, arrCount: 0, metTarget: 0 };
      }
      floorMap[floor].count++;
      if (ttaSec !== undefined) {
        floorMap[floor].totalAck += ttaSec;
        floorMap[floor].ackCount++;
      }
      if (ttrSec !== undefined) {
        floorMap[floor].totalArr += ttrSec;
        floorMap[floor].arrCount++;
      }
      if (metArr) floorMap[floor].metTarget++;

      // Shift grouping
      shiftMap[shiftKey].count++;
      if (ttrSec !== undefined) {
        shiftMap[shiftKey].totalArr += ttrSec;
        shiftMap[shiftKey].arrCount++;
      }
      if (metArr) shiftMap[shiftKey].metTarget++;

      incidentMetrics.push({
        incidentId: em.id,
        typeName: em.typeName,
        locationName: em.locationName,
        floor,
        wing: 'Main',
        createdAt: em.createdAt,
        closedAt: em.closedAt,
        firstAcknowledgedAt: em.firstAcknowledgedAt,
        firstArrivalAt: em.firstArrivalAt,
        firstResponseAt: em.firstResponseAt,
        timeToAcknowledgeSeconds: ttaSec,
        timeToArriveSeconds: ttrSec,
        timeToRespondSeconds: ttrResponseSec,
        totalResolutionSeconds: resSec,
        metAcknowledgeTarget: metAck,
        metArrivalTarget: metArr,
        metResolutionTarget: metRes,
        status: em.status,
      });
    });

    // Compute Math Stats (Mean, Median, P90)
    const avgTTA = ttaValues.length ? Math.round(ttaValues.reduce((a, b) => a + b, 0) / ttaValues.length) : 0;
    const medianTTA = this.calculatePercentile(ttaValues, 50);
    const p90TTA = this.calculatePercentile(ttaValues, 90);

    const avgTTR = ttrValues.length ? Math.round(ttrValues.reduce((a, b) => a + b, 0) / ttrValues.length) : 0;
    const medianTTR = this.calculatePercentile(ttrValues, 50);
    const p90TTR = this.calculatePercentile(ttrValues, 90);

    const avgRes = resolutionValues.length ? Math.round(resolutionValues.reduce((a, b) => a + b, 0) / resolutionValues.length) : 0;
    const medianRes = this.calculatePercentile(resolutionValues, 50);
    const p90Res = this.calculatePercentile(resolutionValues, 90);

    const totalValidAck = ttaValues.length || 1;
    const totalValidArr = ttrValues.length || 1;
    const totalValidRes = resolutionValues.length || 1;

    // Format Groups
    const byCategory: Record<string, { count: number; avgAcknowledge: number; avgArrival: number; complianceRate: number }> = {};
    Object.keys(categoryMap).forEach((cat) => {
      const c = categoryMap[cat];
      byCategory[cat] = {
        count: c.count,
        avgAcknowledge: c.ackCount ? Math.round(c.totalAck / c.ackCount) : 0,
        avgArrival: c.arrCount ? Math.round(c.totalArr / c.arrCount) : 0,
        complianceRate: c.count ? Math.round((c.metTarget / c.count) * 100) : 0,
      };
    });

    const byFloor: Record<string, { count: number; avgAcknowledge: number; avgArrival: number; complianceRate: number }> = {};
    Object.keys(floorMap).forEach((fl) => {
      const f = floorMap[fl];
      byFloor[fl] = {
        count: f.count,
        avgAcknowledge: f.ackCount ? Math.round(f.totalAck / f.ackCount) : 0,
        avgArrival: f.arrCount ? Math.round(f.totalArr / f.arrCount) : 0,
        complianceRate: f.count ? Math.round((f.metTarget / f.count) * 100) : 0,
      };
    });

    const byShift = {
      morning: {
        count: shiftMap.morning.count,
        avgArrival: shiftMap.morning.arrCount ? Math.round(shiftMap.morning.totalArr / shiftMap.morning.arrCount) : 0,
        complianceRate: shiftMap.morning.count ? Math.round((shiftMap.morning.metTarget / shiftMap.morning.count) * 100) : 0,
      },
      evening: {
        count: shiftMap.evening.count,
        avgArrival: shiftMap.evening.arrCount ? Math.round(shiftMap.evening.totalArr / shiftMap.evening.arrCount) : 0,
        complianceRate: shiftMap.evening.count ? Math.round((shiftMap.evening.metTarget / shiftMap.evening.count) * 100) : 0,
      },
      night: {
        count: shiftMap.night.count,
        avgArrival: shiftMap.night.arrCount ? Math.round(shiftMap.night.totalArr / shiftMap.night.arrCount) : 0,
        complianceRate: shiftMap.night.count ? Math.round((shiftMap.night.metTarget / shiftMap.night.count) * 100) : 0,
      },
    };

    return {
      totalIncidents: list.length,
      completedIncidents: completedCount,
      inProgressIncidents: inProgressCount,

      avgTimeToAcknowledgeSec: avgTTA,
      medianTimeToAcknowledgeSec: medianTTA,
      p90TimeToAcknowledgeSec: p90TTA,
      metAcknowledgeCount,
      metAcknowledgePercent: Math.round((metAcknowledgeCount / totalValidAck) * 100),

      avgTimeToArriveSec: avgTTR,
      medianTimeToArriveSec: medianTTR,
      p90TimeToArriveSec: p90TTR,
      metArrivalCount,
      metArrivalPercent: Math.round((metArrivalCount / totalValidArr) * 100),

      avgResolutionDurationSec: avgRes,
      medianResolutionDurationSec: medianRes,
      p90ResolutionDurationSec: p90Res,
      metResolutionCount,
      metResolutionPercent: Math.round((metResolutionCount / totalValidRes) * 100),

      byCategory,
      byFloor,
      byShift,
      incidentMetrics,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private extractFloor(name: string): string {
    if (!name) return '1';
    const match = name.match(/(?:طابق|دور|Floor|Level|L)\s*([0-9]+|[A-Za-z]+)/i);
    return match ? match[1] : '1';
  }

  /**
   * Compares current period performance against previous period
   */
  public computePeriodComparison(
    emergencies: Emergency[],
    days: number,
    excludeDrills: boolean = true
  ): {
    current: { count: number; avgTTA: number; avgTTR: number; avgRes: number; complianceRate: number };
    previous: { count: number; avgTTA: number; avgTTR: number; avgRes: number; complianceRate: number };
    deltaPercent: { count: number; avgTTA: number; avgTTR: number; avgRes: number; complianceRate: number };
    sampleSize: { currentN: number; previousN: number };
  } {
    const now = Date.now();
    const periodMs = days * 86400000;

    const currentRange = { startMs: now - periodMs, endMs: now };
    const prevRange = { startMs: now - 2 * periodMs, endMs: now - periodMs };

    const currSummary = this.computeAnalytics(emergencies, currentRange, undefined, excludeDrills);
    const prevSummary = this.computeAnalytics(emergencies, prevRange, undefined, excludeDrills);

    const calcDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      current: {
        count: currSummary.totalIncidents,
        avgTTA: currSummary.avgTimeToAcknowledgeSec,
        avgTTR: currSummary.avgTimeToArriveSec,
        avgRes: currSummary.avgResolutionDurationSec,
        complianceRate: currSummary.metArrivalPercent,
      },
      previous: {
        count: prevSummary.totalIncidents,
        avgTTA: prevSummary.avgTimeToAcknowledgeSec,
        avgTTR: prevSummary.avgTimeToArriveSec,
        avgRes: prevSummary.avgResolutionDurationSec,
        complianceRate: prevSummary.metArrivalPercent,
      },
      deltaPercent: {
        count: calcDelta(currSummary.totalIncidents, prevSummary.totalIncidents),
        avgTTA: calcDelta(currSummary.avgTimeToAcknowledgeSec, prevSummary.avgTimeToAcknowledgeSec),
        avgTTR: calcDelta(currSummary.avgTimeToArriveSec, prevSummary.avgTimeToArriveSec),
        avgRes: calcDelta(currSummary.avgResolutionDurationSec, prevSummary.avgResolutionDurationSec),
        complianceRate: calcDelta(currSummary.metArrivalPercent, prevSummary.metArrivalPercent),
      },
      sampleSize: {
        currentN: currSummary.totalIncidents,
        previousN: prevSummary.totalIncidents,
      },
    };
  }

  /**
   * Generates Arabic CSV export with UTF-8 BOM for Microsoft Excel compatibility
   */
  public generateCsvExport(summary: ResponseAnalyticsSummary): string {
    const BOM = '\uFEFF';
    const headers = [
      'معرف البلاغ (Incident ID)',
      'نوع البلاغ (Emergency Type)',
      'الموقع (Location)',
      'الطابق (Floor)',
      'الحالة (Status)',
      'تاريخ البلاغ (Created Time)',
      'زمن الاستجابة والتأكيد بالثواني (TTA)',
      'زمن الوصول الميداني بالثواني (TTR)',
      'زمن الإغلاق التام بالثواني (Resolution)',
      'تحقيق معيار السرعة المعتمد (Met SLA Target)',
    ];

    const rows = summary.incidentMetrics.map((m) => [
      `"${m.incidentId}"`,
      `"${m.typeName}"`,
      `"${m.locationName}"`,
      `"${m.floor}"`,
      `"${m.status === EmergencyStatus.ACTIVE ? 'نشط' : 'مغلق'}"`,
      `"${new Date(m.createdAt).toLocaleString('ar-SA')}"`,
      m.timeToAcknowledgeSeconds ?? 'غير مسجل',
      m.timeToArriveSeconds ?? 'غير مسجل',
      m.totalResolutionSeconds ?? 'قيد المتابعة',
      m.metArrivalTarget ? 'نعم (مطابق)' : 'لا (متأخر)',
    ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const performanceAnalyticsService = PerformanceAnalyticsService.getInstance();

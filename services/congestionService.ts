import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Emergency, Location, CongestionLevel, CongestionThresholds, AreaCongestionStat } from '../types';

export const DEFAULT_CONGESTION_THRESHOLDS: CongestionThresholds = {
  normalMax: 0,
  elevatedMax: 2,
  highMax: 4,
  criticalMin: 5,
  highSeverityTriggersCritical: true,
};

export class CongestionService {
  private static instance: CongestionService;
  private currentThresholds: CongestionThresholds = { ...DEFAULT_CONGESTION_THRESHOLDS };

  private constructor() {
    this.initListener();
  }

  public static getInstance(): CongestionService {
    if (!CongestionService.instance) {
      CongestionService.instance = new CongestionService();
    }
    return CongestionService.instance;
  }

  private initListener() {
    try {
      const docRef = doc(db, 'system', 'congestionConfig');
      onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          this.currentThresholds = { ...DEFAULT_CONGESTION_THRESHOLDS, ...snap.data() };
        }
      }, (err) => {
        console.warn('Notice listening to congestionConfig:', err);
      });
    } catch (e) {}
  }

  public getThresholds(): CongestionThresholds {
    return this.currentThresholds;
  }

  public async updateThresholds(newThresholds: Partial<CongestionThresholds>, userId?: string): Promise<boolean> {
    try {
      const updated: CongestionThresholds = {
        ...this.currentThresholds,
        ...newThresholds,
        updatedAt: Date.now(),
        updatedBy: userId || 'admin',
      };
      await setDoc(doc(db, 'system', 'congestionConfig'), updated, { merge: true });
      this.currentThresholds = updated;
      return true;
    } catch (err) {
      console.error('Error saving congestion thresholds:', err);
      return false;
    }
  }

  /**
   * Evaluates congestion statistics for all floors/wings based on active emergencies.
   */
  public computeCongestion(
    activeEmergencies: Emergency[],
    locations: Location[],
    customThresholds?: CongestionThresholds
  ): {
    areaStats: AreaCongestionStat[];
    overallLevel: CongestionLevel;
    totalActiveIncidents: number;
  } {
    const thresholds = customThresholds || this.currentThresholds;

    // Build location lookup map for floor & wing
    const locMap = new Map<string, Location>();
    locations.forEach((loc) => {
      if (loc.id) locMap.set(loc.id, loc);
      if (loc.name) locMap.set(loc.name, loc);
    });

    const groups = new Map<string, {
      floor: string;
      wing: string;
      emergencies: Emergency[];
      high: number;
      medium: number;
      low: number;
    }>();

    activeEmergencies.forEach((em) => {
      const loc = locMap.get(em.locationId) || locMap.get(em.locationName);
      const floor = loc?.floor_number || this.extractFloor(em.locationName) || '1';
      const wing = (loc as any)?.wing || this.extractWing(em.locationName) || 'Main';
      const groupKey = `F${floor}_W${wing}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          floor,
          wing,
          emergencies: [],
          high: 0,
          medium: 0,
          low: 0,
        });
      }

      const g = groups.get(groupKey)!;
      g.emergencies.push(em);

      const sev = (em as any).severity || this.inferSeverity(em);
      if (sev === 'High') g.high++;
      else if (sev === 'Medium') g.medium++;
      else g.low++;
    });

    const areaStats: AreaCongestionStat[] = [];
    let overallScore = 0;

    groups.forEach((val, key) => {
      const total = val.emergencies.length;
      let level: CongestionLevel = 'normal';

      if (total <= thresholds.normalMax) {
        level = 'normal';
      } else if (thresholds.highSeverityTriggersCritical && val.high >= 2) {
        level = 'critical';
      } else if (total >= thresholds.criticalMin || val.high >= 3) {
        level = 'critical';
      } else if (total > thresholds.elevatedMax || val.high >= 1) {
        level = 'high';
      } else {
        level = 'elevated';
      }

      if (level === 'critical') overallScore = Math.max(overallScore, 4);
      else if (level === 'high') overallScore = Math.max(overallScore, 3);
      else if (level === 'elevated') overallScore = Math.max(overallScore, 2);
      else overallScore = Math.max(overallScore, 1);

      areaStats.push({
        key,
        floor: val.floor,
        wing: val.wing,
        totalActive: total,
        highCount: val.high,
        mediumCount: val.medium,
        lowCount: val.low,
        level,
        incidentIds: val.emergencies.map((e) => e.id),
      });
    });

    // Sort by most congested first
    areaStats.sort((a, b) => {
      const weight = { critical: 4, high: 3, elevated: 2, normal: 1 };
      return weight[b.level] - weight[a.level] || b.totalActive - a.totalActive;
    });

    let overallLevel: CongestionLevel = 'normal';
    if (overallScore === 4) overallLevel = 'critical';
    else if (overallScore === 3) overallLevel = 'high';
    else if (overallScore === 2) overallLevel = 'elevated';

    return {
      areaStats,
      overallLevel,
      totalActiveIncidents: activeEmergencies.length,
    };
  }

  private extractFloor(name: string): string {
    if (!name) return '1';
    const match = name.match(/(?:طابق|دور|Floor|Level|L)\s*([0-9]+|[A-Za-z]+)/i);
    return match ? match[1] : '1';
  }

  private extractWing(name: string): string {
    if (!name) return 'A';
    const match = name.match(/(?:جناح|قسم|Wing|Section|Zone|Block)\s*([A-Za-z0-9]+|شرقي|غربي|شمالي|جنوبي)/i);
    return match ? match[1] : 'Main';
  }

  private inferSeverity(em: Emergency): 'High' | 'Medium' | 'Low' {
    const text = `${em.typeName || ''} ${em.notes || ''}`.toLowerCase();
    if (text.includes('حريق') || text.includes('fire') || text.includes('انفجار') || text.includes('سقوط') || text.includes('كود احمر') || text.includes('red')) {
      return 'High';
    }
    if (text.includes('تسرب') || text.includes('دخان') || text.includes('smoke') || text.includes('ازدحام') || text.includes('amber') || text.includes('اصفر')) {
      return 'Medium';
    }
    return 'Low';
  }
}

export const congestionService = CongestionService.getInstance();

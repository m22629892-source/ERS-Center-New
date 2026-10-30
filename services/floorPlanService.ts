import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where 
} from 'firebase/firestore';
import { FloorPlan, FloorPlanMarker } from '../types';

export class FloorPlanService {
  private static instance: FloorPlanService;

  private constructor() {}

  public static getInstance(): FloorPlanService {
    if (!FloorPlanService.instance) {
      FloorPlanService.instance = new FloorPlanService();
    }
    return FloorPlanService.instance;
  }

  /**
   * Generates default realistic floor plan markers for safety protocols
   */
  public getDefaultFloorPlan(locationId: string, locationName: string, floorNumber: string = '1'): FloorPlan {
    const defaultMarkers: FloorPlanMarker[] = [
      {
        id: 'exit-north',
        type: 'exit',
        label: 'مخرج طوارئ رئيسي (شمال)',
        x: 50,
        y: 6,
        notes: 'مخرج إخلاء معتمد يؤدي مباشرة لسلالم النجاة الخارجية'
      },
      {
        id: 'exit-south',
        type: 'exit',
        label: 'مخرج طوارئ فرعي (جنوب)',
        x: 50,
        y: 94,
        notes: 'مخرج طوارئ مضاد للحريق'
      },
      {
        id: 'extinguisher-1',
        type: 'equipment',
        equipmentType: 'fire_extinguisher',
        label: 'مطفأة حريق بودرة CO2',
        x: 24,
        y: 42,
        notes: 'صلاحية مجددة - فحص دوري'
      },
      {
        id: 'extinguisher-2',
        type: 'equipment',
        equipmentType: 'fire_extinguisher',
        label: 'مطفأة حريق ماء مضغوط',
        x: 76,
        y: 42,
        notes: 'بجوار قاطع الكهرباء الرئيسي'
      },
      {
        id: 'firstaid-1',
        type: 'equipment',
        equipmentType: 'first_aid',
        label: 'حقيبة إسعافات أولية متكاملة',
        x: 48,
        y: 52,
        notes: 'تحتوي على أجهزة تضميد وضغط دم'
      },
      {
        id: 'aed-1',
        type: 'equipment',
        equipmentType: 'aed',
        label: 'جهاز صدمات القلب (AED)',
        x: 52,
        y: 52,
        notes: 'جهاز إنعاش قلبي آلي سريع'
      },
      {
        id: 'assembly-point-1',
        type: 'assembly_point',
        label: 'نقطة التجمع رقم (1)',
        x: 88,
        y: 88,
        notes: 'الساحة المفتوحة خارج المبنى'
      },
      {
        id: 'room-control',
        type: 'room',
        label: 'غرفة التحكم المركزية والمراقبة',
        x: 20,
        y: 20,
      },
      {
        id: 'room-operations',
        type: 'room',
        label: 'قاعة العمليات الرئيسية',
        x: 80,
        y: 20,
      },
      {
        id: 'room-offices',
        type: 'room',
        label: 'مكاتب الإدارة والمشرفين',
        x: 20,
        y: 75,
      },
    ];

    return {
      id: `fp_${locationId}_${floorNumber}`,
      locationId,
      floorNumber,
      title: `مخطط السلامة والطوارئ - ${locationName} (الطابق ${floorNumber})`,
      markers: defaultMarkers,
      updatedAt: Date.now(),
    };
  }

  /**
   * Retrieves floor plan by location ID and floor
   */
  public async getFloorPlan(locationId: string, locationName: string = '', floorNumber: string = '1'): Promise<FloorPlan> {
    try {
      const planId = `fp_${locationId}_${floorNumber}`;
      const snap = await getDoc(doc(db, 'floor_plans', planId));
      if (snap.exists()) {
        return snap.data() as FloorPlan;
      }

      // Return default blueprint
      const defaultPlan = this.getDefaultFloorPlan(locationId, locationName, floorNumber);
      // Save default for future persistence
      await setDoc(doc(db, 'floor_plans', planId), defaultPlan, { merge: true });
      return defaultPlan;
    } catch (err) {
      console.warn('Error fetching floor plan:', err);
      return this.getDefaultFloorPlan(locationId, locationName, floorNumber);
    }
  }

  /**
   * Saves updated floor plan and markers
   */
  public async saveFloorPlan(plan: FloorPlan): Promise<boolean> {
    try {
      const cleanPlan = {
        ...plan,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'floor_plans', plan.id), cleanPlan, { merge: true });
      return true;
    } catch (err) {
      console.error('Error saving floor plan:', err);
      return false;
    }
  }

  /**
   * Toggles blocked path status on a specific route or marker
   */
  public async toggleBlockedMarker(planId: string, markerId: string, isBlocked: boolean): Promise<boolean> {
    try {
      const planRef = doc(db, 'floor_plans', planId);
      const snap = await getDoc(planRef);
      if (!snap.exists()) return false;

      const plan = snap.data() as FloorPlan;
      const updatedMarkers = plan.markers.map(m => {
        if (m.id === markerId) {
          return { ...m, isBlocked };
        }
        return m;
      });

      await updateDoc(planRef, { markers: updatedMarkers, updatedAt: Date.now() });
      return true;
    } catch (err) {
      console.error('Error toggling blocked marker:', err);
      return false;
    }
  }
}

export const floorPlanService = FloorPlanService.getInstance();

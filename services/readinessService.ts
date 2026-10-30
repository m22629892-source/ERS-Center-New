import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, updateDoc, 
  query, where, onSnapshot, serverTimestamp, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { User, StaffAvailabilityStatus, UserRole } from '../types';
import { auditService } from './auditService';

export interface ReadinessSummary {
  totalStaff: number;
  availableCount: number;
  busyCount: number;
  respondingCount: number;
  offDutyCount: number;
  onlineHeartbeatCount: number;
  staleHeartbeatCount: number;
}

export class ReadinessService {
  private static instance: ReadinessService;

  private constructor() {}

  public static getInstance(): ReadinessService {
    if (!ReadinessService.instance) {
      ReadinessService.instance = new ReadinessService();
    }
    return ReadinessService.instance;
  }

  /**
   * Determine effective staff status taking into account heartbeat connectivity
   */
  public getEffectiveConnectivity(user: User): {
    isDeviceOnline: boolean;
    heartbeatAgeSeconds: number;
    effectiveDescription: string;
  } {
    const now = Date.now();
    const lastHb = user.lastHeartbeat || user.lastActiveAt || 0;
    const heartbeatAgeSeconds = Math.max(0, Math.floor((now - lastHb) / 1000));
    const isDeviceOnline = heartbeatAgeSeconds < 90; // Connected within 90s

    let effectiveDescription = '';
    const status = user.availabilityStatus || (user.shiftStatus === 'on-duty' ? 'available' : 'off-duty');

    if (status === 'responding') {
      effectiveDescription = isDeviceOnline ? 'في استجابة ميدانية (متصل)' : 'في استجابة ميدانية (انقطع الاتصال)';
    } else if (status === 'available') {
      effectiveDescription = isDeviceOnline ? 'متاح وجاهز (متصل)' : 'متاح (الجهاز غير متصل حالياً)';
    } else if (status === 'busy') {
      effectiveDescription = isDeviceOnline ? 'مشغول بمهمة (متصل)' : 'مشغول (غير متصل)';
    } else {
      effectiveDescription = 'خارج المناوبة (Off Duty)';
    }

    return {
      isDeviceOnline,
      heartbeatAgeSeconds,
      effectiveDescription
    };
  }

  /**
   * Update staff availability status
   */
  public async setStaffAvailability(params: {
    targetUserId: string;
    newStatus: StaffAvailabilityStatus;
    updatedByUser: User;
    reason?: string;
    currentEmergencyId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { targetUserId, newStatus, updatedByUser, reason, currentEmergencyId } = params;

    // Security check: cannot change another employee's status unless Admin or Super Admin
    if (targetUserId !== updatedByUser.id) {
      const isSupervisor = updatedByUser.role === UserRole.ADMIN || updatedByUser.role === UserRole.SUPER_ADMIN;
      if (!isSupervisor) {
        return {
          success: false,
          error: 'لا تملك الصلاحية لتغيير جاهزية موظف آخر. هذه الصلاحية مقصورة على المشرفين.'
        };
      }
    }

    try {
      const userDocRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return { success: false, error: 'المستخدم غير موجود' };

      const userData = userSnap.data() as User;
      const now = Date.now();

      const updates: any = {
        availabilityStatus: newStatus,
        availabilityUpdatedAt: now,
        availabilityUpdatedBy: updatedByUser.name,
        lastActiveAt: now
      };

      if (reason) updates.availabilityReason = reason;

      if (currentEmergencyId) {
        if (newStatus === 'responding') {
          updates.currentEmergencyIds = arrayUnion(currentEmergencyId);
        } else {
          updates.currentEmergencyIds = arrayRemove(currentEmergencyId);
        }
      }

      // If user sets to 'available' or 'busy', ensure shiftStatus is marked 'on-duty'
      if (newStatus === 'available' || newStatus === 'busy') {
        updates.shiftStatus = 'on-duty';
      } else if (newStatus === 'off-duty') {
        updates.shiftStatus = 'off-duty';
      }

      await updateDoc(userDocRef, updates);

      // Audit trail
      await auditService.logEvent({
        userId: updatedByUser.id,
        userName: updatedByUser.name,
        actionType: 'STAFF_AVAILABILITY_CHANGED',
        details: `Staff ${userData.name} availability set to "${newStatus}" by ${updatedByUser.name}. Reason: ${reason || 'Normal update'}`,
        metadata: { targetUserId, oldStatus: userData.availabilityStatus, newStatus, reason }
      });

      return { success: true };
    } catch (e: any) {
      console.error('Error updating staff availability:', e);
      return { success: false, error: e.message || 'فشل تحديث الجاهزية' };
    }
  }

  /**
   * Automatically transition staff to 'responding' status when joining an emergency
   */
  public async markRespondingToEmergency(user: User, emergencyId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        availabilityStatus: 'responding',
        availabilityUpdatedAt: Date.now(),
        availabilityUpdatedBy: 'System (Auto)',
        currentEmergencyIds: arrayUnion(emergencyId)
      });
    } catch (e) {
      console.warn('Failed auto transition to responding:', e);
    }
  }

  /**
   * Revert staff status when emergency closes or user finishes
   * Takes into account whether user has other active incidents or is off-duty
   */
  public async handleEmergencyClosedForStaff(userId: string, closedEmergencyId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const user = userSnap.data() as User;
      const currentEmergencies = (user.currentEmergencyIds || []).filter(id => id !== closedEmergencyId);

      let nextStatus: StaffAvailabilityStatus = 'available';

      if (currentEmergencies.length > 0) {
        // Still has another active emergency!
        nextStatus = 'responding';
      } else if (user.shiftStatus === 'off-duty') {
        nextStatus = 'off-duty';
      } else {
        nextStatus = 'available';
      }

      await updateDoc(userRef, {
        availabilityStatus: nextStatus,
        currentEmergencyIds: currentEmergencies,
        availabilityUpdatedAt: Date.now(),
        availabilityUpdatedBy: 'System (Auto Revert)'
      });
    } catch (e) {
      console.warn('Failed to revert staff availability:', e);
    }
  }

  /**
   * Realtime subscription for all users' readiness
   */
  public subscribeStaffReadiness(callback: (users: User[], summary: ReadinessSummary) => void): () => void {
    return onSnapshot(collection(db, 'users'), (snap) => {
      const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      const now = Date.now();

      let availableCount = 0;
      let busyCount = 0;
      let respondingCount = 0;
      let offDutyCount = 0;
      let onlineHeartbeatCount = 0;
      let staleHeartbeatCount = 0;

      usersList.forEach(u => {
        const status = u.availabilityStatus || (u.shiftStatus === 'on-duty' ? 'available' : 'off-duty');
        if (status === 'available') availableCount++;
        else if (status === 'busy') busyCount++;
        else if (status === 'responding') respondingCount++;
        else offDutyCount++;

        const isOnline = (now - (u.lastHeartbeat || u.lastActiveAt || 0)) < 90000;
        if (isOnline) onlineHeartbeatCount++;
        else staleHeartbeatCount++;
      });

      const summary: ReadinessSummary = {
        totalStaff: usersList.length,
        availableCount,
        busyCount,
        respondingCount,
        offDutyCount,
        onlineHeartbeatCount,
        staleHeartbeatCount
      };

      callback(usersList, summary);
    });
  }

  /**
   * Evaluates task delegation suitability and returns warnings or readiness advice
   */
  public evaluateTaskAssignment(targetUser: User, requiredRoles?: string[]): {
    canAssign: boolean;
    warningLevel: 'none' | 'warning' | 'critical';
    message: string;
    requiresSupervisorOverride: boolean;
  } {
    const status = targetUser.availabilityStatus || (targetUser.shiftStatus === 'on-duty' ? 'available' : 'off-duty');
    const { isDeviceOnline } = this.getEffectiveConnectivity(targetUser);

    if (status === 'responding') {
      return {
        canAssign: true,
        warningLevel: 'critical',
        message: `الموظف ${targetUser.name} في حالة استجابة ميدانية لحادث طوارئ نشط حالياً. التكليف يتطلب تجاوزاً إدارياً موثقاً.`,
        requiresSupervisorOverride: true
      };
    }

    if (status === 'busy') {
      return {
        canAssign: true,
        warningLevel: 'warning',
        message: `الموظف ${targetUser.name} بحالة "مشغول" في مهمة سابقة. يفضل تكليف موظف متاح ما لم تكن هناك حاجة طارئة.`,
        requiresSupervisorOverride: true
      };
    }

    if (status === 'off-duty') {
      return {
        canAssign: true,
        warningLevel: 'critical',
        message: `الموظف ${targetUser.name} خارج المناوبة الرسمية (Off Duty). يتطلب التكليف تأكيد المشرف واستدعاء الطوارئ.`,
        requiresSupervisorOverride: true
      };
    }

    if (!isDeviceOnline) {
      return {
        canAssign: true,
        warningLevel: 'warning',
        message: `الموظف ${targetUser.name} متاح لكن جهازه لم يرسل إشارة اتصال خلال الدقائق الأخيرة. تأكد من تواصلك الصوتي المباشر معه.`,
        requiresSupervisorOverride: false
      };
    }

    return {
      canAssign: true,
      warningLevel: 'none',
      message: `الموظف ${targetUser.name} متاح وجهازه متصل ومؤهل لتنفيذ المهمة.`,
      requiresSupervisorOverride: false
    };
  }
}

export const readinessService = ReadinessService.getInstance();

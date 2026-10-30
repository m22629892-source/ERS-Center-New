import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, doc, setDoc, query, 
  orderBy, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { User, QuickMessageTemplate } from '../types';
import { timelineService } from './timelineService';
import { emergencyWorkflowService } from './emergencyWorkflowService';

export const DEFAULT_QUICK_MESSAGES: QuickMessageTemplate[] = [
  { id: 'qm_1', key: 'quick_msg_on_my_way', defaultText: 'أنا في طريقي إلى موقع الحادث', category: 'status', icon: 'Navigation', order: 1 },
  { id: 'qm_2', key: 'quick_msg_arrived', defaultText: 'وصلت إلى موقع الحادث وأبدأ المعاينة', category: 'status', icon: 'MapPinCheck', order: 2 },
  { id: 'qm_3', key: 'quick_msg_need_backup', defaultText: 'أحتاج إلى دعم وإسناد إضافي عاجل', category: 'assistance', icon: 'AlertTriangle', order: 3 },
  { id: 'qm_4', key: 'quick_msg_area_secured', defaultText: 'تم تأمين الموقع وعزل منطقة الخطر', category: 'safety', icon: 'ShieldCheck', order: 4 },
  { id: 'qm_5', key: 'quick_msg_need_medical', defaultText: 'أحتاج إلى مساعدة وإسعاف طبي فوري', category: 'assistance', icon: 'HeartPulse', order: 5 },
  { id: 'qm_6', key: 'quick_msg_under_control', defaultText: 'الموقف الميداني تحت السيطرة التامة', category: 'safety', icon: 'CheckCircle2', order: 6 },
  { id: 'qm_7', key: 'quick_msg_unable_respond', defaultText: 'غير قادر على الاستجابة لهذا البلاغ حالياً', category: 'status', icon: 'UserX', order: 7 },
  { id: 'qm_8', key: 'quick_msg_awaiting_instructions', defaultText: 'بانتظار التعليمات والتوجيهات الإضافية', category: 'tactical', icon: 'Radio', order: 8 },
];

// Contradictory groups: mutually exclusive status messages
export const MUTUALLY_EXCLUSIVE_STATUS_KEYS = [
  'quick_msg_on_my_way',
  'quick_msg_arrived',
  'quick_msg_unable_respond'
];

export interface BatchSendResult {
  success: boolean;
  successfulKeys: string[];
  failedKeys: string[];
  errors: Record<string, string>;
  conflictError?: string;
}

export class QuickMessageService {
  private static instance: QuickMessageService;
  private templates: QuickMessageTemplate[] = [...DEFAULT_QUICK_MESSAGES];
  // Idempotency tracking cache with 30-second TTL
  private processedOperationCache = new Map<string, number>();

  private constructor() {
    this.initTemplatesListener();
  }

  public static getInstance(): QuickMessageService {
    if (!QuickMessageService.instance) {
      QuickMessageService.instance = new QuickMessageService();
    }
    return QuickMessageService.instance;
  }

  private initTemplatesListener() {
    try {
      const q = query(collection(db, 'quick_message_templates'), orderBy('order', 'asc'));
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: QuickMessageTemplate[] = [];
          snapshot.forEach((d) => {
            loaded.push({ id: d.id, ...(d.data() as QuickMessageTemplate) });
          });
          this.templates = loaded;
        } else {
          this.templates = [...DEFAULT_QUICK_MESSAGES];
        }
      }, (err) => {
        console.warn('Notice loading quick_message_templates:', err);
      });
    } catch (e) {}
  }

  public getTemplates(): QuickMessageTemplate[] {
    return this.templates;
  }

  /**
   * Validates whether a combination of message keys contains contradictory statuses.
   * e.g., Combining "On my way" with "Unable to respond" or "Arrived" is blocked.
   * Compatible combinations (e.g. "Arrived" + "Need Backup" + "Need Medical") are allowed.
   */
  public checkContradictions(keys: string[]): { hasConflict: boolean; reason?: string } {
    const statusMatches = keys.filter(k => MUTUALLY_EXCLUSIVE_STATUS_KEYS.includes(k));
    if (statusMatches.length > 1) {
      return {
        hasConflict: true,
        reason: 'لا يمكن الجمع بين حالات متناقضة في نفس الدفعة (مثل «في طريقي» و«غير قادر على الاستجابة» أو «وصلت»). يرجى تحديد حالة واحدة متوافقة.'
      };
    }
    return { hasConflict: false };
  }

  /**
   * Sends a batch of selected quick messages with idempotency, partial failure handling,
   * chat logging, timeline recording, and workflow synchronization.
   */
  public async sendQuickMessagesBatch(
    emergencyId: string,
    user: User,
    selectedTemplates: QuickMessageTemplate[],
    localizedTexts: Record<string, string>,
    batchOperationId?: string
  ): Promise<BatchSendResult> {
    if (!emergencyId || !user?.id || selectedTemplates.length === 0) {
      return {
        success: false,
        successfulKeys: [],
        failedKeys: selectedTemplates.map(t => t.key),
        errors: { general: 'بيانات غير صالحة أو قائمة رسائل فارغة' }
      };
    }

    // 1. Check for contradictory statuses in the batch
    const keys = selectedTemplates.map(t => t.key);
    const conflictCheck = this.checkContradictions(keys);
    if (conflictCheck.hasConflict) {
      return {
        success: false,
        successfulKeys: [],
        failedKeys: keys,
        errors: { conflict: conflictCheck.reason! },
        conflictError: conflictCheck.reason
      };
    }

    const opId = batchOperationId || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const successfulKeys: string[] = [];
    const failedKeys: string[] = [];
    const errors: Record<string, string> = {};

    // 2. Clean up expired operations from idempotency cache (> 30s)
    const now = Date.now();
    for (const [key, ts] of this.processedOperationCache.entries()) {
      if (now - ts > 30000) {
        this.processedOperationCache.delete(key);
      }
    }

    // 3. Process each template in sequence
    for (const template of selectedTemplates) {
      const idempotencyKey = `${emergencyId}_${user.id}_${template.key}_${opId}`;

      // Idempotency: skip re-transmitting if already handled for this batch operation
      if (this.processedOperationCache.has(idempotencyKey)) {
        successfulKeys.push(template.key);
        continue;
      }

      const textToSend = localizedTexts[template.key] || template.defaultText;

      try {
        // Record in chat
        await addDoc(collection(db, 'emergencies', emergencyId, 'chat'), {
          text: textToSend,
          templateKey: template.key,
          isQuickMessage: true,
          category: template.category,
          sender: user.name || user.username,
          senderId: user.id,
          role: user.role,
          batchId: opId,
          timestamp: Date.now(),
          serverTimestamp: serverTimestamp(),
        });

        // Record in incident timeline
        await timelineService.recordEvent({
          incidentId: emergencyId,
          eventType: 'QUICK_MESSAGE',
          actorId: user.id,
          actorName: user.name || user.username,
          actorRole: user.role,
          descriptionKey: 'timeline_event_quick_message',
          metadata: {
            key: template.key,
            messageText: textToSend,
            category: template.category,
            batchId: opId
          },
          source: 'quick_message',
        });

        // Operational workflow synchronization where applicable
        if (template.key === 'quick_msg_arrived') {
          emergencyWorkflowService.markOnScene(emergencyId, user).catch(() => {});
        } else if (template.key === 'quick_msg_on_my_way') {
          emergencyWorkflowService.startResponding(emergencyId, user, textToSend).catch(() => {});
        } else if (template.key === 'quick_msg_unable_respond') {
          emergencyWorkflowService.declineEmergency(emergencyId, user, textToSend).catch(() => {});
        } else if (template.key === 'quick_msg_need_backup') {
          emergencyWorkflowService.requestBackup(emergencyId, user, textToSend).catch(() => {});
        }

        this.processedOperationCache.set(idempotencyKey, Date.now());
        successfulKeys.push(template.key);
      } catch (err: any) {
        console.error(`Failed to send quick message ${template.key}:`, err);
        failedKeys.push(template.key);
        errors[template.key] = err.message || 'فشل إرسال هذه الرسالة';
      }
    }

    return {
      success: failedKeys.length === 0,
      successfulKeys,
      failedKeys,
      errors
    };
  }

  /**
   * Backwards compatible single-message sender
   */
  public async sendQuickMessage(
    emergencyId: string,
    user: User,
    template: QuickMessageTemplate,
    localizedText: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const res = await this.sendQuickMessagesBatch(
      emergencyId,
      user,
      [template],
      { [template.key]: localizedText }
    );
    return {
      success: res.success,
      error: res.errors[template.key] || res.errors.conflict || res.errors.general
    };
  }

  /**
   * Save or update custom quick message template (Admin only)
   */
  public async saveTemplate(template: QuickMessageTemplate): Promise<boolean> {
    try {
      const docRef = doc(db, 'quick_message_templates', template.id);
      await setDoc(docRef, template, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving template:', e);
      return false;
    }
  }
}

export const quickMessageService = QuickMessageService.getInstance();

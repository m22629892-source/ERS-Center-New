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

export class QuickMessageService {
  private static instance: QuickMessageService;
  private templates: QuickMessageTemplate[] = [...DEFAULT_QUICK_MESSAGES];

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
   * Sends a quick message into the incident chat and records timeline event.
   * Auto-links state transitions (e.g., arrived -> ON_SCENE, on_way -> RESPONDING, unable -> DECLINED).
   */
  public async sendQuickMessage(
    emergencyId: string,
    user: User,
    template: QuickMessageTemplate,
    localizedText: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!emergencyId || !user?.id) {
      return { success: false, error: 'بيانات غير صالحة' };
    }

    try {
      const chatDocRef = await addDoc(collection(db, 'emergencies', emergencyId, 'chat'), {
        text: localizedText || template.defaultText,
        templateKey: template.key,
        isQuickMessage: true,
        category: template.category,
        sender: user.name || user.username,
        senderId: user.id,
        role: user.role,
        timestamp: Date.now(),
        serverTimestamp: serverTimestamp(),
      });

      // Also record in incident timeline
      await timelineService.recordEvent({
        incidentId: emergencyId,
        eventType: 'QUICK_MESSAGE',
        actorId: user.id,
        actorName: user.name || user.username,
        actorRole: user.role,
        descriptionKey: 'timeline_event_quick_message',
        metadata: {
          key: template.key,
          messageText: localizedText || template.defaultText,
          category: template.category,
        },
        source: 'quick_message',
      });

      // Synchronize operational state where applicable
      if (template.key === 'quick_msg_arrived') {
        emergencyWorkflowService.markOnScene(emergencyId, user).catch(() => {});
      } else if (template.key === 'quick_msg_on_my_way') {
        emergencyWorkflowService.startResponding(emergencyId, user, localizedText || template.defaultText).catch(() => {});
      } else if (template.key === 'quick_msg_unable_respond') {
        emergencyWorkflowService.declineEmergency(emergencyId, user, localizedText || template.defaultText).catch(() => {});
      } else if (template.key === 'quick_msg_need_backup') {
        emergencyWorkflowService.requestBackup(emergencyId, user, localizedText || template.defaultText).catch(() => {});
      }

      return { success: true, messageId: chatDocRef.id };
    } catch (err: any) {
      console.error('Error sending quick message:', err);
      return { success: false, error: err.message };
    }
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

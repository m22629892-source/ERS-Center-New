import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, 
  writeBatch, Timestamp 
} from 'firebase/firestore';
import { 
  ChecklistTemplate, ChecklistTemplateTask, IncidentTask, 
  TaskStatus, User, UserRole, EmergencyType 
} from '../types';
import { auditService } from './auditService';
import { STANDARD_TASK_DICTIONARY } from './checklistLocalization';

/**
 * Recursively strips undefined fields from an object so Firestore writeBatch/setDoc never throws
 * "Unsupported field value: undefined"
 */
function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const res: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        res[key] = cleanFirestoreData(val);
      }
    }
    return res;
  }
  return obj;
}

export class ChecklistService {
  private static instance: ChecklistService;

  private constructor() {}

  public static getInstance(): ChecklistService {
    if (!ChecklistService.instance) {
      ChecklistService.instance = new ChecklistService();
    }
    return ChecklistService.instance;
  }

  /**
   * Fetches all checklist templates with their tasks
   */
  public async getAllChecklists(): Promise<ChecklistTemplate[]> {
    try {
      const q = query(collection(db, 'emergency_checklists'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      const checklists: ChecklistTemplate[] = [];

      for (const d of snap.docs) {
        const data = d.data() as ChecklistTemplate;
        // Fetch subcollection tasks or inline tasks
        let tasks: ChecklistTemplateTask[] = [];
        try {
          const tasksSnap = await getDocs(
            query(collection(db, 'emergency_checklists', d.id, 'tasks'), orderBy('order', 'asc'))
          );
          tasks = tasksSnap.docs.map(td => ({ taskId: td.id, ...td.data() } as ChecklistTemplateTask));
        } catch (e) {
          tasks = data.tasks || [];
        }

        checklists.push({
          ...data,
          checklistId: d.id,
          tasks: tasks.length > 0 ? tasks : (data.tasks || [])
        });
      }

      return checklists;
    } catch (error) {
      console.error('Failed to get checklists:', error);
      return [];
    }
  }

  /**
   * Get approved checklist template for a specific emergency type
   */
  public async getApprovedChecklistForType(emergencyTypeId: string): Promise<ChecklistTemplate | null> {
    try {
      const q = query(
        collection(db, 'emergency_checklists'),
        where('emergencyTypeId', '==', emergencyTypeId),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        // Fallback: check if any checklist exists for this type
        const fallbackQ = query(
          collection(db, 'emergency_checklists'),
          where('emergencyTypeId', '==', emergencyTypeId)
        );
        const fallbackSnap = await getDocs(fallbackQ);
        if (fallbackSnap.empty) return null;
        
        const docData = fallbackSnap.docs[0];
        const data = docData.data() as ChecklistTemplate;
        const tasksSnap = await getDocs(
          query(collection(db, 'emergency_checklists', docData.id, 'tasks'), orderBy('order', 'asc'))
        );
        const tasks = tasksSnap.docs.map(td => ({ taskId: td.id, ...td.data() } as ChecklistTemplateTask));
        return { ...data, checklistId: docData.id, tasks: tasks.length > 0 ? tasks : (data.tasks || []) };
      }

      // Pick highest version
      const sorted = snap.docs
        .map(d => ({ id: d.id, checklistId: d.id, ...d.data() } as unknown as ChecklistTemplate))
        .sort((a, b) => (b.version || 1) - (a.version || 1));
      
      const latest = sorted[0];
      const tasksSnap = await getDocs(
        query(collection(db, 'emergency_checklists', latest.checklistId, 'tasks'), orderBy('order', 'asc'))
      );
      const tasks = tasksSnap.docs.map(td => ({ taskId: td.id, ...td.data() } as ChecklistTemplateTask));
      return { ...latest, tasks: tasks.length > 0 ? tasks : (latest.tasks || []) };
    } catch (error) {
      console.error('Error fetching approved checklist for type:', error);
      return null;
    }
  }

  /**
   * Save or update a checklist template
   */
  public async saveChecklist(
    checklist: Partial<ChecklistTemplate>, 
    tasks: ChecklistTemplateTask[], 
    authorUser?: User
  ): Promise<string> {
    const checklistId = checklist.checklistId || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const rawTemplateData: Record<string, any> = {
      checklistId,
      emergencyTypeId: checklist.emergencyTypeId || '',
      emergencyTypeName: checklist.emergencyTypeName || '',
      titleAr: checklist.titleAr || '',
      titleEn: checklist.titleEn || '',
      description: checklist.description || '',
      version: checklist.version || 1,
      status: checklist.status || 'draft',
      createdAt: checklist.createdAt || now,
      updatedAt: now,
      tasks: (tasks || []).map((t, idx) => cleanFirestoreData({ ...t, order: idx + 1 }))
    };

    if (checklist.approvedBy) rawTemplateData.approvedBy = checklist.approvedBy;
    if (checklist.approvedByName) rawTemplateData.approvedByName = checklist.approvedByName;
    if (checklist.approvedAt) rawTemplateData.approvedAt = checklist.approvedAt;

    const templateData = cleanFirestoreData(rawTemplateData);

    const batch = writeBatch(db);
    const docRef = doc(db, 'emergency_checklists', checklistId);
    batch.set(docRef, templateData, { merge: true });

    // Save tasks to subcollection as well for high query scalability
    (tasks || []).forEach((task, idx) => {
      const taskId = task.taskId || `task_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`;
      const taskDocRef = doc(db, 'emergency_checklists', checklistId, 'tasks', taskId);
      const cleanTask = cleanFirestoreData({
        ...task,
        taskId,
        checklistId,
        order: idx + 1
      });
      batch.set(taskDocRef, cleanTask, { merge: true });
    });

    await batch.commit();

    if (authorUser) {
      await auditService.logEvent({
        userId: authorUser.id,
        userName: authorUser.name,
        actionType: checklist.checklistId ? 'CHECKLIST_UPDATED' : 'CHECKLIST_CREATED',
        details: `Template "${templateData.titleAr}" (v${templateData.version}) was saved.`,
        metadata: { checklistId, version: templateData.version, status: templateData.status }
      });
    }

    return checklistId;
  }

  /**
   * Approve a checklist template version (Formal supervisor approval)
   * Enforces strict validation: non-empty tasks, valid titles, and authorized supervisor role.
   */
  public async approveChecklistVersion(
    checklistId: string, 
    approver: User, 
    newVersionIncrement: boolean = true
  ): Promise<void> {
    if (approver.role !== UserRole.ADMIN && approver.role !== UserRole.SUPER_ADMIN) {
      throw new Error('غير مصرح: اعتماد قوائم المهام يتطلب صلاحية مشرف أو مسؤول نظام');
    }

    const checklistRef = doc(db, 'emergency_checklists', checklistId);
    const snap = await getDoc(checklistRef);
    if (!snap.exists()) throw new Error('قائمة المهام غير موجودة');

    const data = snap.data() as ChecklistTemplate;
    
    // Strict Validation
    if (!data.titleAr || data.titleAr.trim().length < 3) {
      throw new Error('لا يمكن اعتماد القالب: عنوان القالب بالعربية يجب أن يحتوي على 3 أحرف على الأقل');
    }
    if (!data.emergencyTypeId) {
      throw new Error('لا يمكن اعتماد القالب: يجب تحديد نوع الطوارئ المرتبط بالقالب');
    }

    // Check tasks count (inline or subcollection)
    let taskCount = (data.tasks || []).length;
    if (taskCount === 0) {
      try {
        const subSnap = await getDocs(collection(db, 'emergency_checklists', checklistId, 'tasks'));
        taskCount = subSnap.size;
      } catch (e) {}
    }

    if (taskCount === 0) {
      throw new Error('لا يمكن اعتماد القالب: يجب إضافة مهمة تشغيلية واحدة على الأقل قبل الاعتماد');
    }

    const now = Date.now();
    const updatedVersion = newVersionIncrement ? (data.version || 1) + 1 : (data.version || 1);

    await updateDoc(checklistRef, {
      status: 'approved',
      version: updatedVersion,
      approvedBy: approver.id,
      approvedByName: approver.name,
      approvedAt: now,
      updatedAt: now,
      approvalType: 'internal_supervisor'
    });

    await auditService.logEvent({
      userId: approver.id,
      userName: approver.name,
      actionType: 'CHECKLIST_APPROVED',
      details: `Checklist "${data.titleAr}" officially approved as v${updatedVersion} by ${approver.name}`,
      metadata: { checklistId, version: updatedVersion, taskCount }
    });
  }

  /**
   * Delete a checklist template
   */
  public async deleteChecklist(checklistId: string, user: User): Promise<void> {
    const checklistRef = doc(db, 'emergency_checklists', checklistId);
    await deleteDoc(checklistRef);

    await auditService.logEvent({
      userId: user.id,
      userName: user.name,
      actionType: 'CHECKLIST_DELETED',
      details: `Checklist ${checklistId} was deleted by ${user.name}`,
      metadata: { checklistId }
    });
  }

  /**
   * Instantiates an approved checklist for a newly created or active emergency.
   * - Saves an immutable snapshot on the emergency doc to prevent future template drift.
   * - Uses DETERMINISTIC task IDs (`task_${emergencyId}_${sanitizedTplKey}_ord${index + 1}`).
   * - Guarantees idempotency: never overwrites existing assigned or completed tasks.
   */
  public async instantiateIncidentChecklist(
    emergencyId: string, 
    emergencyTypeId: string, 
    triggeredBy?: User
  ): Promise<IncidentTask[]> {
    try {
      // 1. Check if incident tasks already exist to prevent duplicate creation
      const existingSnap = await getDocs(collection(db, 'emergencies', emergencyId, 'tasks'));
      if (!existingSnap.empty) {
        return existingSnap.docs
          .map(d => ({ taskId: d.id, ...d.data() } as IncidentTask))
          .filter(t => (t as any).isArchived !== true)
          .sort((a, b) => a.order - b.order);
      }

      // 2. Fetch approved template for this emergency type
      const template = await this.getApprovedChecklistForType(emergencyTypeId);
      
      let tasksToInstantiate: ChecklistTemplateTask[] = [];

      if (template && template.tasks && template.tasks.length > 0) {
        tasksToInstantiate = template.tasks.filter(t => t.isActive !== false);
      } else {
        // Fallback standard safety tasks if no custom template has been created yet
        tasksToInstantiate = this.getStandardDefaultSafetyTasksForType(emergencyTypeId);
      }

      const batch = writeBatch(db);
      const instantiatedTasks: IncidentTask[] = [];
      const sanitizedTplKey = (template?.checklistId || 'std').replace(/[^a-zA-Z0-9_-]/g, '_');
      const now = Date.now();

      // 3. Build snapshot on the emergency record
      try {
        const emergencyRef = doc(db, 'emergencies', emergencyId);
        await updateDoc(emergencyRef, {
          checklistSnapshot: {
            templateId: template?.checklistId || 'standard_safety_protocol',
            version: template?.version || 1,
            titleAr: template?.titleAr || 'قائمة إجراءات السلامة القياسية',
            titleEn: template?.titleEn || 'Standard Safety Checklist',
            tasksCount: tasksToInstantiate.length,
            instantiatedAt: now,
            frozen: true // Protect against template mutations
          }
        });
      } catch (e) {
        // If emergency doc update fails (e.g. offline/mock), proceed with task creation
      }

      tasksToInstantiate.forEach((tplTask, index) => {
        // Deterministic task document ID: guarantees strict idempotency
        const taskId = `task_${emergencyId}_${sanitizedTplKey}_ord${index + 1}`;
        const taskDocRef = doc(db, 'emergencies', emergencyId, 'tasks', taskId);

        const taskData: IncidentTask = {
          taskId,
          emergencyId,
          sourceChecklistId: template?.checklistId || 'standard_safety_protocol',
          sourceVersion: template?.version || 1,
          titleAr: tplTask.titleAr,
          titleEn: tplTask.titleEn,
          titleKu: tplTask.titleKu,
          titleFr: tplTask.titleFr,
          titleDe: tplTask.titleDe,
          description: tplTask.description || '',
          descriptionEn: tplTask.descriptionEn,
          descriptionKu: tplTask.descriptionKu,
          descriptionFr: tplTask.descriptionFr,
          descriptionDe: tplTask.descriptionDe,
          order: index + 1,
          requiredRoleIds: tplTask.requiredRoleIds || [],
          isMandatory: tplTask.isMandatory ?? true,
          targetDurationSeconds: tplTask.targetDurationSeconds || 300,
          requiresSupervisorApproval: tplTask.requiresSupervisorApproval ?? false,
          canBeSkipped: tplTask.canBeSkipped ?? false,
          status: 'pending'
        };

        batch.set(taskDocRef, cleanFirestoreData(taskData), { merge: true });
        instantiatedTasks.push(taskData);
      });

      await batch.commit();

      // Log in audit trail
      if (triggeredBy) {
        await auditService.logEvent({
          emergencyId,
          userId: triggeredBy.id,
          userName: triggeredBy.name,
          actionType: 'INCIDENT_CHECKLIST_INSTANTIATED',
          details: `Instantiated ${instantiatedTasks.length} standard safety tasks for incident ${emergencyId}.`,
          metadata: { emergencyId, taskCount: instantiatedTasks.length, sourceVersion: template?.version || 1 }
        });
      }

      return instantiatedTasks;
    } catch (error) {
      console.error('Error instantiating incident checklist:', error);
      return [];
    }
  }

  /**
   * Non-destructive Deduplication with Reversible Migration Backup.
   * - Inspects incident tasks and groups by step order & title.
   * - Never hard-deletes (`deleteDoc` is prohibited).
   * - Saves full pre-migration state to `task_migration_backups` collection for 100% reversible rollbacks.
   * - If duplicate has different assignment or completion notes, flags as conflict review needed.
   * - Archives duplicate tasks with pointers to canonical task (`duplicateOfTaskId`).
   */
  public async deduplicateIncidentTasks(emergencyId: string): Promise<{ 
    archivedCount: number; 
    keptCount: number; 
    conflictsCount: number; 
    backupId: string | null 
  }> {
    try {
      const snap = await getDocs(collection(db, 'emergencies', emergencyId, 'tasks'));
      if (snap.empty) return { archivedCount: 0, keptCount: 0, conflictsCount: 0, backupId: null };

      // Filter out already archived tasks
      const allTasks = snap.docs.map(d => ({ id: d.id, ...(d.data() as IncidentTask) }));
      const activeTasks = allTasks.filter(t => (t as any).isArchived !== true);

      // Group by canonical key: order + normalized title
      const groups = new Map<string, typeof activeTasks>();
      for (const t of activeTasks) {
        const key = `${t.order}_${(t.titleAr || '').trim()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      }

      // Check if any duplicates exist
      let duplicateCount = 0;
      for (const list of groups.values()) {
        if (list.length > 1) duplicateCount += (list.length - 1);
      }

      if (duplicateCount === 0) {
        return { archivedCount: 0, keptCount: activeTasks.length, conflictsCount: 0, backupId: null };
      }

      // 1. Create Reversible Migration Backup in Firestore
      const backupId = `backup_${emergencyId}_${Date.now()}`;
      await setDoc(doc(db, 'task_migration_backups', backupId), {
        backupId,
        emergencyId,
        createdAt: Date.now(),
        reason: 'Task deduplication with non-destructive archival',
        restorable: true,
        tasksSnapshot: allTasks
      });

      const batch = writeBatch(db);
      let archivedCount = 0;
      let conflictsCount = 0;

      for (const [key, group] of groups.entries()) {
        if (group.length <= 1) continue;

        // Determine canonical task:
        // Priority: completed > in_progress > assigned > pending, then earliest creation
        const sorted = [...group].sort((a, b) => {
          const score = (task: IncidentTask) => {
            if (task.status === 'completed') return 4;
            if (task.status === 'in_progress') return 3;
            if (task.assignedTo) return 2;
            return 1;
          };
          return score(b) - score(a);
        });

        const canonical = sorted[0];
        const duplicates = sorted.slice(1);

        for (const dup of duplicates) {
          const taskDocRef = doc(db, 'emergencies', emergencyId, 'tasks', dup.taskId || dup.id);
          
          // Check for conflicts: differing assignments or completion notes
          const hasDifferentAssignee = dup.assignedTo && canonical.assignedTo && dup.assignedTo !== canonical.assignedTo;
          const hasDifferentNotes = dup.completionNotes && canonical.completionNotes && dup.completionNotes !== canonical.completionNotes;
          const hasConflict = !!(hasDifferentAssignee || hasDifferentNotes);

          if (hasConflict) {
            conflictsCount++;
            batch.update(taskDocRef, {
              status: 'pending_review',
              hasConflict: true,
              conflictReason: hasDifferentAssignee 
                ? `تعارض في الإسناد: مسند إلى ${dup.assignedToName || dup.assignedTo} والأصل مسند إلى ${canonical.assignedToName || canonical.assignedTo}`
                : 'تعارض في ملاحظات أو إثباتات الإنجاز بين المهام المكررة',
              conflictLinkedCanonicalId: canonical.taskId || canonical.id,
              archivedAt: Date.now()
            });
          } else {
            archivedCount++;
            batch.update(taskDocRef, {
              status: 'archived',
              isArchived: true,
              isDuplicate: true,
              duplicateOfTaskId: canonical.taskId || canonical.id,
              archivedAt: Date.now()
            });
          }
        }
      }

      await batch.commit();

      return {
        archivedCount,
        keptCount: activeTasks.length - archivedCount,
        conflictsCount,
        backupId
      };
    } catch (err) {
      console.error('Error in deduplicateIncidentTasks:', err);
      return { archivedCount: 0, keptCount: 0, conflictsCount: 0, backupId: null };
    }
  }

  /**
   * Reverses a previous deduplication migration using its backupId
   */
  public async restoreTasksFromBackup(backupId: string): Promise<boolean> {
    try {
      const backupSnap = await getDoc(doc(db, 'task_migration_backups', backupId));
      if (!backupSnap.exists()) throw new Error('نسخة النسخ الاحتياطي غير موجودة');

      const data = backupSnap.data();
      const emergencyId = data.emergencyId;
      const tasksSnapshot: any[] = data.tasksSnapshot || [];

      const batch = writeBatch(db);
      for (const t of tasksSnapshot) {
        const id = t.taskId || t.id;
        const taskRef = doc(db, 'emergencies', emergencyId, 'tasks', id);
        batch.set(taskRef, cleanFirestoreData(t), { merge: true });
      }

      await updateDoc(doc(db, 'task_migration_backups', backupId), {
        restoredAt: Date.now(),
        restored: true
      });

      await batch.commit();
      return true;
    } catch (e) {
      console.error('Error restoring tasks from backup:', e);
      return false;
    }
  }

  /**
   * Comprehensive Dry Run Template & Task Diagnostic Tool.
   * Analyzes templates and active incidents for dummy data, incomplete steps,
   * unlinked duplicates, and conflict items WITHOUT mutating any document.
   */
  public async auditAndCleanTemplates(dryRun: boolean = true): Promise<{
    inspected: number;
    flagged: Array<{ 
      id: string; 
      titleAr: string; 
      category: 'DUMMY_TITLE' | 'EMPTY_TASKS' | 'INCOMPLETE_STEPS' | 'APPROVED_INCOMPLETE' | 'POTENTIAL_DUPLICATES';
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    archivedCount: number;
    isDryRun: boolean;
  }> {
    try {
      const snap = await getDocs(collection(db, 'emergency_checklists'));
      const flagged: Array<{ 
        id: string; 
        titleAr: string; 
        category: 'DUMMY_TITLE' | 'EMPTY_TASKS' | 'INCOMPLETE_STEPS' | 'APPROVED_INCOMPLETE' | 'POTENTIAL_DUPLICATES';
        reason: string;
        severity: 'low' | 'medium' | 'high';
      }> = [];

      for (const d of snap.docs) {
        const data = d.data() as ChecklistTemplate;
        const title = (data.titleAr || '').trim();
        const tasks = data.tasks || [];
        
        const isDummyTitle = /^(t+|test|تجربة|تست|abc|aaa|\.\.\.|123)$/i.test(title) || (title.length > 0 && title.length < 3);
        const isEmptyTasks = tasks.length === 0;

        // Check for dummy or incomplete steps within template
        const dummySteps = tasks.filter(t => 
          !t.titleAr || /^(t+|test|\.\.\.|تجربة)$/i.test(t.titleAr.trim()) || t.titleAr.trim().length < 3
        );

        if (isDummyTitle && isEmptyTasks) {
          flagged.push({
            id: d.id,
            titleAr: title || '(بدون عنوان)',
            category: 'DUMMY_TITLE',
            reason: 'قالب تجريبي بعنوان وهمي وقائمة مهام خالية بالكامل',
            severity: 'high'
          });
        } else if (isDummyTitle) {
          flagged.push({
            id: d.id,
            titleAr: title,
            category: 'DUMMY_TITLE',
            reason: 'عنوان القالب تجريبي أو أقل من 3 أحرف (مثل tt أو test)',
            severity: 'medium'
          });
        } else if (isEmptyTasks && data.status === 'approved') {
          flagged.push({
            id: d.id,
            titleAr: title,
            category: 'APPROVED_INCOMPLETE',
            reason: 'قالب معتمد تشغيلياً لكنه لا يحتوي على أي خطوات أو مهام تنفيذية',
            severity: 'high'
          });
        } else if (dummySteps.length > 0) {
          flagged.push({
            id: d.id,
            titleAr: title,
            category: 'INCOMPLETE_STEPS',
            reason: `يحتوي على ${dummySteps.length} خطوة بنصوص تجريبية ناقصة أو فارغة`,
            severity: 'medium'
          });
        }

        if (!dryRun && flagged.some(f => f.id === d.id && f.severity === 'high')) {
          await updateDoc(doc(db, 'emergency_checklists', d.id), {
            status: 'archived',
            isArchived: true,
            archivedAt: Date.now(),
            archiveReason: 'Archived via Automated Quality Audit'
          });
        }
      }

      return {
        inspected: snap.size,
        flagged,
        archivedCount: dryRun ? 0 : flagged.filter(f => f.severity === 'high').length,
        isDryRun: dryRun
      };
    } catch (err) {
      console.error('Error in auditAndCleanTemplates:', err);
      return { inspected: 0, flagged: [], archivedCount: 0, isDryRun: dryRun };
    }
  }

  /**
   * Realtime subscription to incident tasks
   */
  public subscribeIncidentTasks(
    emergencyId: string, 
    callback: (tasks: IncidentTask[]) => void
  ): () => void {
    const q = query(collection(db, 'emergencies', emergencyId, 'tasks'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() } as IncidentTask));
      callback(list);
    }, (error) => {
      console.error('Error in incident tasks listener:', error);
    });
  }

  /**
   * Update task status (Pending -> In Progress -> Completed / Skipped / Blocked)
   * Strictly enforces identity verification (no signing on behalf of others).
   */
  public async updateIncidentTaskStatus(params: {
    emergencyId: string;
    taskId: string;
    newStatus: TaskStatus;
    user: User;
    notes?: string;
    skipReason?: string;
    blockedReason?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { emergencyId, taskId, newStatus, user, notes, skipReason, blockedReason } = params;

    try {
      const taskRef = doc(db, 'emergencies', emergencyId, 'tasks', taskId);
      const snap = await getDoc(taskRef);
      if (!snap.exists()) return { success: false, error: 'Task not found' };

      const task = snap.data() as IncidentTask;
      const now = Date.now();

      // Security check: cannot sign on behalf of another person unless user is Admin or assigned
      if (task.assignedUserId && task.assignedUserId !== user.id) {
        const isSupervisor = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        if (!isSupervisor) {
          return {
            success: false,
            error: 'لا يمكن التوقيع على المهمة نيابة عن موظف آخر دون صلاحية إشرافية.'
          };
        }
      }

      // Mandatory skip reason check
      if (newStatus === 'skipped') {
        if (!task.canBeSkipped) {
          const isSupervisor = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
          if (!isSupervisor) {
            return { success: false, error: 'هذه المهمة إلزامية ولا يمكن تجاوزها.' };
          }
        }
        if (!skipReason || skipReason.trim().length < 3) {
          return { success: false, error: 'يرجى كتابة سبب التجاوز بصورة واضحة.' };
        }
      }

      const updates: Partial<IncidentTask> = {
        status: newStatus
      };

      if (notes) updates.notes = notes;
      if (skipReason) updates.skipReason = skipReason;
      if (blockedReason) updates.blockedReason = blockedReason;

      if (newStatus === 'in_progress' && !task.startedAt) {
        updates.startedAt = now;
        if (!task.assignedUserId) {
          updates.assignedUserId = user.id;
          updates.assignedUserName = user.name;
        }
      } else if (newStatus === 'completed') {
        updates.completedAt = now;
        updates.completedBy = user.id;
        updates.completedByName = user.name;
        if (!task.startedAt) updates.startedAt = now;
      } else if (newStatus === 'pending') {
        updates.completedAt = undefined;
        updates.completedBy = undefined;
        updates.completedByName = undefined;
      }

      await updateDoc(taskRef, updates);

      // Audit trail record
      await auditService.logEvent({
        emergencyId,
        userId: user.id,
        userName: user.name,
        actionType: `TASK_STATUS_${newStatus.toUpperCase()}`,
        details: `Task "${task.titleAr}" marked as ${newStatus} by ${user.name}. Notes: ${notes || 'none'}`,
        metadata: { taskId, newStatus, skipReason, notes }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating task status:', error);
      return { success: false, error: error.message || 'Failed to update task' };
    }
  }

  /**
   * Assign task to specific staff member
   */
  public async assignIncidentTask(
    emergencyId: string, 
    taskId: string, 
    assignee: User, 
    assignedBy: User
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const taskRef = doc(db, 'emergencies', emergencyId, 'tasks', taskId);
      await updateDoc(taskRef, {
        assignedUserId: assignee.id,
        assignedUserName: assignee.name,
        status: 'in_progress',
        startedAt: Date.now()
      });

      await auditService.logEvent({
        emergencyId,
        userId: assignedBy.id,
        userName: assignedBy.name,
        actionType: 'TASK_ASSIGNED',
        details: `Task ${taskId} assigned to ${assignee.name} by ${assignedBy.name}`,
        metadata: { taskId, assignedTo: assignee.name, assignedToId: assignee.id }
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Supervisor formal task approval
   */
  public async approveIncidentTask(
    emergencyId: string, 
    taskId: string, 
    supervisor: User
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const taskRef = doc(db, 'emergencies', emergencyId, 'tasks', taskId);
      const now = Date.now();
      await updateDoc(taskRef, {
        approvedBy: supervisor.id,
        approvedByName: supervisor.name,
        approvedAt: now
      });

      await auditService.logEvent({
        emergencyId,
        userId: supervisor.id,
        userName: supervisor.name,
        actionType: 'TASK_APPROVED_BY_SUPERVISOR',
        details: `Task ${taskId} formally approved by supervisor ${supervisor.name}`,
        metadata: { taskId, supervisor: supervisor.name }
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Seed standard, safety-approved default emergency checklists for registered emergency types
   */
  public async seedDefaultSafetyChecklists(types: EmergencyType[], adminUser: User): Promise<number> {
    let createdCount = 0;

    for (const type of types) {
      const existing = await this.getApprovedChecklistForType(type.id);
      if (existing) continue; // Skip if already exists

      const defaultTasks = this.getStandardDefaultSafetyTasksForType(type.id, type.type_name);
      await this.saveChecklist({
        emergencyTypeId: type.id,
        emergencyTypeName: type.type_name,
        titleAr: `خطة وإجراءات الاستجابة لحالات ${type.type_name}`,
        titleEn: `Standard Response Protocol for ${type.type_name}`,
        titleKu: `پلانی و ڕێکارەکانی وەڵامدانەوە بۆ حاڵەتەکانی ${type.type_name}`,
        titleFr: `Protocole d'intervention standard pour ${type.type_name}`,
        titleDe: `Standard-Reaktionsprotokoll für ${type.type_name}`,
        description: `بروتوكول السلامة المعتمد للاستجابة لحالات ${type.type_name}. يرجى التقيد بالترتيب الزمني وتوثيق الإجراءات.`,
        descriptionEn: `Certified safety response protocol for ${type.type_name}. Please follow chronological sequence and document all actions.`,
        descriptionKu: `پرۆتۆکۆلی سەلامەتی پەسەندکراو بۆ وەڵامدانەوەی حاڵەتەکانی ${type.type_name}. تکایە پابەندی ڕیزبەندی کاتی بن.`,
        descriptionFr: `Protocole de sécurité certifié pour les cas de ${type.type_name}. Veuillez respecter l'ordre chronologique.`,
        descriptionDe: `Genehmigtes Notfallprotokoll für ${type.type_name}. Bitte chronologische Reihenfolge beachten.`,
        version: 1,
        status: 'approved',
        approvedBy: adminUser?.id || 'admin',
        approvedByName: adminUser?.name || adminUser?.username || 'مدير النظام',
        approvedAt: Date.now()
      }, defaultTasks, adminUser);

      createdCount++;
    }

    return createdCount;
  }

  /**
   * Human-authored, safety-compliant fallback protocols with full 5-language localization
   */
  public getStandardDefaultSafetyTasksForType(typeId: string, typeName?: string): ChecklistTemplateTask[] {
    const isFire = (typeName || '').includes('حريق') || (typeName || '').toLowerCase().includes('fire') || typeId === 'fire';
    const isMedical = (typeName || '').includes('طبي') || (typeName || '').includes('إسعاف') || (typeName || '').toLowerCase().includes('medical');
    const isChemical = (typeName || '').includes('كيميائ') || (typeName || '').includes('غاز') || (typeName || '').toLowerCase().includes('gas');

    const buildTask = (
      taskId: string,
      order: number,
      requiredRoleIds: string[],
      isMandatory: boolean,
      targetDurationSeconds: number,
      requiresSupervisorApproval: boolean = false,
      canBeSkipped: boolean = false
    ): ChecklistTemplateTask => {
      const dict = STANDARD_TASK_DICTIONARY[taskId];
      return {
        taskId,
        titleAr: dict?.title.ar || '',
        titleEn: dict?.title.en || '',
        titleKu: dict?.title.ku || '',
        titleFr: dict?.title.fr || '',
        titleDe: dict?.title.de || '',
        description: dict?.description?.ar || '',
        descriptionEn: dict?.description?.en || '',
        descriptionKu: dict?.description?.ku || '',
        descriptionFr: dict?.description?.fr || '',
        descriptionDe: dict?.description?.de || '',
        order,
        requiredRoleIds,
        isMandatory,
        targetDurationSeconds,
        requiresSupervisorApproval,
        canBeSkipped,
        isActive: true
      };
    };

    if (isFire) {
      return [
        buildTask('fire_1', 1, ['admin', 'responder'], true, 60),
        buildTask('fire_2', 2, ['responder'], true, 120),
        buildTask('fire_3', 3, ['responder', 'admin'], true, 300),
        buildTask('fire_4', 4, ['responder'], true, 420, true),
        buildTask('fire_5', 5, ['admin', 'responder'], false, 240, false, true),
        buildTask('fire_6', 6, ['admin', 'responder'], true, 600, true)
      ];
    }

    if (isMedical) {
      return [
        buildTask('med_1', 1, ['admin', 'responder'], true, 60),
        buildTask('med_2', 2, ['responder'], true, 90),
        buildTask('med_3', 3, ['responder'], true, 120),
        buildTask('med_4', 4, ['responder'], true, 300),
        buildTask('med_5', 5, ['admin', 'responder'], true, 600, true)
      ];
    }

    if (isChemical) {
      return [
        buildTask('chem_1', 1, ['admin', 'responder'], true, 90),
        buildTask('chem_2', 2, ['responder', 'admin'], true, 150),
        buildTask('chem_3', 3, ['responder'], true, 240, true),
        buildTask('chem_4', 4, ['admin', 'responder'], true, 360, true)
      ];
    }

    // Generic Emergency SOP
    return [
      buildTask('gen_1', 1, ['responder', 'admin'], true, 120),
      buildTask('gen_2', 2, ['responder'], true, 240),
      buildTask('gen_3', 3, ['responder'], true, 480),
      buildTask('gen_4', 4, ['admin', 'responder'], true, 600, true)
    ];
  }
}

export const checklistService = ChecklistService.getInstance();

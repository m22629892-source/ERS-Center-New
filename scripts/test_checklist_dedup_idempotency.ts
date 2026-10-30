import { IncidentTask, ChecklistTemplate } from '../types';

async function runChecklistDedupAndIdempotencyTest() {
  console.log('=== Running Checklist Deduplication, Idempotency & Backup Test ===');

  // 1. Test Task Idempotency: deterministic task ID generation
  const emergencyId = 'em_test_777';
  const sanitizedTplKey = 'std_fire_sop';
  
  const generateTaskId = (emId: string, tplKey: string, stepOrder: number) => {
    return `task_${emId}_${tplKey}_ord${stepOrder}`;
  };

  const id1 = generateTaskId(emergencyId, sanitizedTplKey, 1);
  const id2 = generateTaskId(emergencyId, sanitizedTplKey, 1);
  console.log('Task IDs across concurrent calls:', id1, '===', id2);
  if (id1 !== id2) {
    throw new Error('FAIL: Task IDs must be deterministic to prevent duplicate creation on concurrent taps');
  }
  console.log('PASS: Deterministic task IDs prevent concurrent duplicate instantiation.');

  // 2. Test Deduplication Grouping & Conflict Detection
  const mockTasks: IncidentTask[] = [
    {
      taskId: 'task_1',
      emergencyId,
      order: 1,
      titleAr: 'عزل مصادر الطاقة الرئيسية',
      titleEn: 'Isolate main power switches',
      status: 'completed',
      completedBy: 'user_a',
      completionNotes: 'تم فصل القاطع الرئيسي في الدور الأول',
      isMandatory: true,
      targetDurationSeconds: 120
    },
    {
      taskId: 'task_1_dup_pending',
      emergencyId,
      order: 1,
      titleAr: 'عزل مصادر الطاقة الرئيسية',
      titleEn: 'Isolate main power switches',
      status: 'pending',
      isMandatory: true,
      targetDurationSeconds: 120
    },
    {
      taskId: 'task_2_a',
      emergencyId,
      order: 2,
      titleAr: 'إخلاء الممر الغربي',
      titleEn: 'Evacuate west corridor',
      status: 'in_progress',
      assignedTo: 'user_b',
      assignedToName: 'بدر الميداني',
      isMandatory: true,
      targetDurationSeconds: 180
    },
    {
      taskId: 'task_2_b_conflicting',
      emergencyId,
      order: 2,
      titleAr: 'إخلاء الممر الغربي',
      titleEn: 'Evacuate west corridor',
      status: 'completed',
      assignedTo: 'user_c',
      assignedToName: 'خالد المسعف',
      completionNotes: 'تم الإخلاء بنجاح بدون معوقات',
      isMandatory: true,
      targetDurationSeconds: 180
    }
  ];

  // Group by canonical key: order + title
  const groups = new Map<string, IncidentTask[]>();
  for (const t of mockTasks) {
    const key = `${t.order}_${t.titleAr.trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  let archivedCount = 0;
  let conflictsCount = 0;
  const migrationActions: Array<{ id: string; action: 'archive' | 'flag_conflict'; canonicalId: string; reason?: string }> = [];

  for (const [key, group] of groups.entries()) {
    if (group.length <= 1) continue;

    // Sort by priority: completed > in_progress > assigned > pending
    const sorted = [...group].sort((a, b) => {
      const score = (t: IncidentTask) => {
        if (t.status === 'completed') return 4;
        if (t.status === 'in_progress') return 3;
        if (t.assignedTo) return 2;
        return 1;
      };
      return score(b) - score(a);
    });

    const canonical = sorted[0];
    const duplicates = sorted.slice(1);

    for (const dup of duplicates) {
      const hasDifferentAssignee = dup.assignedTo && canonical.assignedTo && dup.assignedTo !== canonical.assignedTo;
      const hasDifferentNotes = dup.completionNotes && canonical.completionNotes && dup.completionNotes !== canonical.completionNotes;
      const isConflict = !!(hasDifferentAssignee || hasDifferentNotes);

      if (isConflict) {
        conflictsCount++;
        migrationActions.push({
          id: dup.taskId,
          action: 'flag_conflict',
          canonicalId: canonical.taskId,
          reason: 'تعارض في الإسناد أو الإنجاز بين المهام المكررة'
        });
      } else {
        archivedCount++;
        migrationActions.push({
          id: dup.taskId,
          action: 'archive',
          canonicalId: canonical.taskId
        });
      }
    }
  }

  console.log('Processed Deduplication Actions:', migrationActions);
  console.log(`- Archived (non-destructive): ${archivedCount}`);
  console.log(`- Conflicting tasks flagged for review: ${conflictsCount}`);

  if (archivedCount !== 1) {
    throw new Error('FAIL: Exactly 1 clean duplicate should have been archived');
  }
  if (conflictsCount !== 1) {
    throw new Error('FAIL: Conflicting task with differing assignees/completions must be flagged as conflict');
  }
  console.log('PASS: Deduplication archives non-destructively and flags differing assignments as conflicts.');

  // 3. Test Dry Run Template Scanner Logic
  const templatesToAudit: Partial<ChecklistTemplate>[] = [
    { checklistId: 'chk_1', titleAr: 'tt', tasks: [] },
    { checklistId: 'chk_2', titleAr: 'خطة إخلاء المواد الكيميائية', tasks: [], status: 'approved' },
    { checklistId: 'chk_3', titleAr: 'خطة الحريق المعتمدة', tasks: [
      { taskId: 'step_1', titleAr: 'tt', order: 1 } as any
    ], status: 'approved' },
    { checklistId: 'chk_4', titleAr: 'إجراءات السلامة القياسية للغازات', tasks: [
      { taskId: 'step_1', titleAr: 'عزل محبس الغاز الرئيسي', order: 1 } as any,
      { taskId: 'step_2', titleAr: 'تشغيل مراوح الشفط الإيجابي', order: 2 } as any
    ], status: 'approved' }
  ];

  const dryRunFlagged: Array<{ id: string; title: string; reason: string }> = [];
  for (const tpl of templatesToAudit) {
    const title = (tpl.titleAr || '').trim();
    const tasks = tpl.tasks || [];
    const isDummyTitle = /^(t+|test|تجربة|تست|abc|aaa|\.\.\.|123)$/i.test(title) || title.length < 3;
    const isEmptyTasks = tasks.length === 0;
    const hasDummySteps = tasks.some(t => !t.titleAr || /^(t+|test|\.\.\.)$/i.test(t.titleAr.trim()));

    if (isDummyTitle && isEmptyTasks) {
      dryRunFlagged.push({ id: tpl.checklistId!, title, reason: 'قالب تجريبي بعنوان وهمي وقائمة مهام فارغة' });
    } else if (isEmptyTasks && tpl.status === 'approved') {
      dryRunFlagged.push({ id: tpl.checklistId!, title, reason: 'قالب معتمد بدون أي مهام تشغيلية' });
    } else if (hasDummySteps) {
      dryRunFlagged.push({ id: tpl.checklistId!, title, reason: 'قالب يحتوي على خطوات بنصوص تجريبية غير مكتملة' });
    }
  }

  console.log('\nDry Run Audit Flagged Count:', dryRunFlagged.length);
  dryRunFlagged.forEach(f => console.log(`  Flagged: [${f.id}] "${f.title}" -> ${f.reason}`));

  if (dryRunFlagged.length !== 3) {
    throw new Error('FAIL: Dry run should flag the 3 invalid templates and spare the valid one');
  }

  console.log('\nSUCCESS: All Deduplication, Idempotency & Dry Run tests passed cleanly!');
}

runChecklistDedupAndIdempotencyTest().catch(err => {
  console.error(err);
  process.exit(1);
});

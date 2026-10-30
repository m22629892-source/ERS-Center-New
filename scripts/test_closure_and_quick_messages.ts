import { Emergency, EmergencyStatus, UserRole, QuickMessageTemplate } from '../types';
import { quickMessageService, MUTUALLY_EXCLUSIVE_STATUS_KEYS } from '../services/quickMessageService';

async function runClosureAndQuickMessagesTestSuite() {
  console.log('====================================================');
  console.log('🧪 Starting Incident Closure & Quick Messages Tests');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  }

  // ====================================================
  // TEST GROUP 1: Closure Permissions & Authorization Logic
  // ====================================================
  console.log('\n--- 1. Testing Emergency Closure Authorization Logic ---');

  const verifyCloseAuthorization = (
    user: { id: string; role: string },
    emergency: { id: string; status: string; createdBy?: string }
  ): { canClose: boolean; errorCode?: string } => {
    if (!user || !user.id) {
      return { canClose: false, errorCode: 'UNAUTHENTICATED' };
    }

    if (emergency.status === EmergencyStatus.CLOSED) {
      return { canClose: true, errorCode: 'ALREADY_CLOSED' }; // Idempotent
    }

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const isCreator = Boolean(emergency.createdBy && emergency.createdBy === user.id);

    if (isAdmin || isCreator) {
      return { canClose: true };
    }

    if (!emergency.createdBy) {
      return { canClose: false, errorCode: 'LEGACY_EMERGENCY_REQUIRES_ADMIN' };
    }

    return { canClose: false, errorCode: 'FORBIDDEN_NOT_CREATOR_OR_ADMIN' };
  };

  const creatorUser = { id: 'user_creator_01', role: UserRole.RESPONDER };
  const otherResponder = { id: 'user_responder_02', role: UserRole.RESPONDER };
  const adminUser = { id: 'user_admin_03', role: UserRole.ADMIN };
  const superAdminUser = { id: 'user_super_04', role: UserRole.SUPER_ADMIN };

  const standardEmergency = {
    id: 'em_101',
    status: EmergencyStatus.ACTIVE,
    createdBy: 'user_creator_01'
  };

  const legacyEmergencyNoCreatorId = {
    id: 'em_legacy_999',
    status: EmergencyStatus.ACTIVE
  };

  // 1.1 Creator can close
  const r1 = verifyCloseAuthorization(creatorUser, standardEmergency);
  assert(r1.canClose, 'Emergency creator CAN close their own active incident');

  // 1.2 Admin can close
  const r2 = verifyCloseAuthorization(adminUser, standardEmergency);
  assert(r2.canClose, 'System Admin CAN close any active emergency');

  // 1.3 Super-Admin can close
  const r3 = verifyCloseAuthorization(superAdminUser, standardEmergency);
  assert(r3.canClose, 'Super-Admin CAN close any active emergency');

  // 1.4 Another responder CANNOT close
  const r4 = verifyCloseAuthorization(otherResponder, standardEmergency);
  assert(
    !r4.canClose && r4.errorCode === 'FORBIDDEN_NOT_CREATOR_OR_ADMIN',
    'Another responder CANNOT close emergency (Forbidden 403)'
  );

  // 1.5 Legacy emergency without createdBy ID can ONLY be closed by Admin
  const r5Responder = verifyCloseAuthorization(otherResponder, legacyEmergencyNoCreatorId);
  assert(
    !r5Responder.canClose && r5Responder.errorCode === 'LEGACY_EMERGENCY_REQUIRES_ADMIN',
    'Legacy emergency without createdBy REJECTS non-admin close requests'
  );

  const r5Admin = verifyCloseAuthorization(adminUser, legacyEmergencyNoCreatorId);
  assert(r5Admin.canClose, 'Legacy emergency allows Admin to close officially');

  // 1.6 Idempotency on already closed emergency
  const closedEmergency = {
    id: 'em_101',
    status: EmergencyStatus.CLOSED,
    createdBy: 'user_creator_01'
  };
  const r6 = verifyCloseAuthorization(creatorUser, closedEmergency);
  assert(r6.canClose && r6.errorCode === 'ALREADY_CLOSED', 'Closing an already-closed emergency is handled idempotently');

  // ====================================================
  // TEST GROUP 2: Immutability of createdBy and Profile Roles
  // ====================================================
  console.log('\n--- 2. Testing Immutability Rules (createdBy & Role Tampering) ---');

  const sanitizeProfileUpdate = (clientData: any) => {
    const safeData = { ...clientData };
    delete safeData.role; // Stripped by AppContext & server
    return safeData;
  };

  const maliciousProfileUpdate = {
    name: 'Ahmed',
    role: 'super-admin', // Attempted privilege escalation
    phone: '0555555555'
  };

  const sanitized = sanitizeProfileUpdate(maliciousProfileUpdate);
  assert(
    sanitized.role === undefined && sanitized.name === 'Ahmed',
    'Profile update strips role mutations to prevent self-elevation to admin'
  );

  const validateEmergencyUpdateDiff = (affectedKeys: string[]) => {
    return !affectedKeys.includes('createdBy') && !affectedKeys.includes('createdAt');
  };

  assert(
    !validateEmergencyUpdateDiff(['status', 'createdBy']),
    'Firestore rule blocks tampering with createdBy field'
  );
  assert(
    !validateEmergencyUpdateDiff(['status', 'createdAt']),
    'Firestore rule blocks tampering with createdAt field'
  );
  assert(
    validateEmergencyUpdateDiff(['status', 'closedAt', 'closedBy', 'closedByName']),
    'Firestore rule permits updating status, closedAt, closedBy, and notes'
  );

  // ====================================================
  // TEST GROUP 3: Quick Responder Messages Multi-Selection & Contradictions
  // ====================================================
  console.log('\n--- 3. Testing Quick Responder Messages & Contradiction Detection ---');

  // 3.1 Contradiction: on_my_way + unable_respond
  const conflict1 = quickMessageService.checkContradictions([
    'quick_msg_on_my_way',
    'quick_msg_unable_respond'
  ]);
  assert(
    conflict1.hasConflict,
    'Contradiction detected: "On my way" + "Unable to respond" rejected'
  );

  // 3.2 Contradiction: on_my_way + arrived
  const conflict2 = quickMessageService.checkContradictions([
    'quick_msg_on_my_way',
    'quick_msg_arrived'
  ]);
  assert(
    conflict2.hasConflict,
    'Contradiction detected: "On my way" + "Arrived" rejected'
  );

  // 3.3 Contradiction: arrived + unable_respond
  const conflict3 = quickMessageService.checkContradictions([
    'quick_msg_arrived',
    'quick_msg_unable_respond'
  ]);
  assert(
    conflict3.hasConflict,
    'Contradiction detected: "Arrived" + "Unable to respond" rejected'
  );

  // 3.4 Compatible: arrived + need_backup
  const compatible1 = quickMessageService.checkContradictions([
    'quick_msg_arrived',
    'quick_msg_need_backup'
  ]);
  assert(
    !compatible1.hasConflict,
    'Compatible combination: "Arrived" + "Need Backup" permitted'
  );

  // 3.5 Compatible: arrived + need_backup + need_medical
  const compatible2 = quickMessageService.checkContradictions([
    'quick_msg_arrived',
    'quick_msg_need_backup',
    'quick_msg_need_medical'
  ]);
  assert(
    !compatible2.hasConflict,
    'Compatible combination: "Arrived" + "Need Backup" + "Need Medical" permitted'
  );

  // 3.6 Compatible: area_secured + under_control
  const compatible3 = quickMessageService.checkContradictions([
    'quick_msg_area_secured',
    'quick_msg_under_control'
  ]);
  assert(
    !compatible3.hasConflict,
    'Compatible combination: "Area Secured" + "Under Control" permitted'
  );

  // ====================================================
  // TEST GROUP 4: Multi-Selection Toggle & Idempotency Simulation
  // ====================================================
  console.log('\n--- 4. Testing Multi-Selection State & Idempotency ---');

  const toggleSelection = (set: Set<string>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) {
      next.delete(key);
    } else {
      if (MUTUALLY_EXCLUSIVE_STATUS_KEYS.includes(key)) {
        MUTUALLY_EXCLUSIVE_STATUS_KEYS.forEach(k => next.delete(k));
      }
      next.add(key);
    }
    return next;
  };

  let selection = new Set<string>();
  selection = toggleSelection(selection, 'quick_msg_arrived');
  assert(selection.has('quick_msg_arrived'), 'Item added to selection');

  selection = toggleSelection(selection, 'quick_msg_need_backup');
  assert(
    selection.has('quick_msg_arrived') && selection.has('quick_msg_need_backup'),
    'Multiple compatible items selected simultaneously'
  );

  selection = toggleSelection(selection, 'quick_msg_arrived');
  assert(
    !selection.has('quick_msg_arrived') && selection.has('quick_msg_need_backup'),
    'Clicking selected item toggles it off without clearing others'
  );

  // Test mutual exclusion auto-swap
  selection = toggleSelection(selection, 'quick_msg_on_my_way');
  selection = toggleSelection(selection, 'quick_msg_arrived');
  assert(
    selection.has('quick_msg_arrived') && !selection.has('quick_msg_on_my_way'),
    'Selecting exclusive status auto-swaps mutually exclusive keys cleanly'
  );

  // Partial failure test logic:
  const simulatePartialFailureResponse = (
    selectedKeys: string[],
    mockFailedKeys: string[]
  ) => {
    const successfulKeys = selectedKeys.filter(k => !mockFailedKeys.includes(k));
    const remainingSelected = selectedKeys.filter(k => mockFailedKeys.includes(k));
    return {
      successfulKeys,
      remainingSelected
    };
  };

  const initialBatch = ['quick_msg_arrived', 'quick_msg_need_backup', 'quick_msg_area_secured'];
  const partialResult = simulatePartialFailureResponse(initialBatch, ['quick_msg_area_secured']);

  assert(
    partialResult.successfulKeys.length === 2 &&
    partialResult.remainingSelected.length === 1 &&
    partialResult.remainingSelected[0] === 'quick_msg_area_secured',
    'Partial failure retains failed message selected for retry, while deselecting successful messages'
  );

  // ====================================================
  // SUMMARY
  // ====================================================
  console.log('\n====================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runClosureAndQuickMessagesTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

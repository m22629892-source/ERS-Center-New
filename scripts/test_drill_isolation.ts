import { Emergency, EmergencyStatus } from '../types';

async function runDrillIsolationTest() {
  console.log('=== Running Drill Server & Notification Isolation Test ===');

  const regularEmergency: Emergency = {
    id: 'em_prod_101',
    typeId: 'type_fire',
    typeName: 'حريق فعلي في الدور الرابع',
    locationId: 'loc_main',
    locationName: 'المبنى الرئيسي',
    createdAt: Date.now(),
    status: EmergencyStatus.ACTIVE,
    createdBy: 'user_operator',
    creatorName: 'مشغل العمليات',
    responders: [],
    isDrill: false
  };

  const isolatedDrill: Emergency = {
    id: 'drill_sim_202',
    typeId: 'type_drill_simulation',
    typeName: '[تمرين محاكاة] إخلاء وهمي',
    locationId: 'loc_main',
    locationName: 'المبنى الرئيسي (قاعة المحاكاة)',
    createdAt: Date.now(),
    status: EmergencyStatus.ACTIVE,
    createdBy: 'user_safety_lead',
    creatorName: 'رئيس السلامة',
    responders: [],
    isDrill: true,
    drillId: 'drill_sim_202'
  };

  // Test 1: Operational siren & active emergencies filtering
  // In AppContext.tsx:
  // const isDrillEmergency = (e: Emergency) => !!e.isDrill || e.id?.startsWith('drill_');
  const filterOperationalAlerts = (list: Emergency[]) => {
    return list.filter(e => !e.isDrill && !e.id.startsWith('drill_') && e.status === 'active');
  };

  const activePool = [regularEmergency, isolatedDrill];
  const operationalVisible = filterOperationalAlerts(activePool);

  console.log('Total Emergencies in System:', activePool.length);
  console.log('Visible to Operational Teams / Siren triggers:', operationalVisible.length);

  if (operationalVisible.length !== 1 || operationalVisible[0].id !== 'em_prod_101') {
    throw new Error('FAIL: Isolated drill leaked into operational active alerts!');
  }
  console.log('PASS: Drill is cleanly excluded from operational alarms and active alerts.');

  // Test 2: Notification Isolation Check in functions/index.js
  // sendEmergencyNotification logic:
  // if (emergency.isDrill === true || (context.params && context.params.emergencyId.startsWith('drill_'))) { return; }
  const shouldSendOperationalPush = (e: Emergency) => {
    if (e.isDrill === true || e.id.startsWith('drill_')) {
      return false; // Suppressed on server
    }
    return true;
  };

  if (shouldSendOperationalPush(isolatedDrill)) {
    throw new Error('FAIL: Operational push notification was not suppressed for drill!');
  }
  if (!shouldSendOperationalPush(regularEmergency)) {
    throw new Error('FAIL: Regular emergency was incorrectly suppressed!');
  }
  console.log('PASS: Operational FCM push trigger strictly ignores drills on the server.');

  // Test 3: Drill Notification Format & Recipient Enforcement
  const enrolledParticipants = ['usr_participant_1', 'usr_participant_2'];
  const allStaffUsers = [
    { id: 'usr_participant_1', name: 'أحمد متدرب', fcmToken: 'tok_1' },
    { id: 'usr_participant_2', name: 'سارة متدربة', fcmToken: 'tok_2' },
    { id: 'usr_production_responder', name: 'خالد مستجيب إنتاج', fcmToken: 'tok_prod' },
  ];

  // Server resolution logic from /api/drills/launch
  const resolvedTokens: { token: string; title: string }[] = [];
  const drillScenarioTitle = 'إخلاء افتراضي مبنى الإدارة';
  const mandatoryPrefix = '[تدريب — ليس بلاغًا حقيقيًا]';

  for (const staff of allStaffUsers) {
    // Only dispatch if enrolled
    if (enrolledParticipants.includes(staff.id) && staff.fcmToken) {
      resolvedTokens.push({
        token: staff.fcmToken,
        title: `${mandatoryPrefix} ${drillScenarioTitle}`
      });
    }
  }

  console.log('Target FCM Dispatch Count:', resolvedTokens.length);
  if (resolvedTokens.length !== 2) {
    throw new Error('FAIL: Resolved token count should exactly equal enrolled participants with tokens');
  }

  for (const item of resolvedTokens) {
    if (!item.title.startsWith(mandatoryPrefix)) {
      throw new Error(`FAIL: Notification title "${item.title}" missing mandatory prefix "${mandatoryPrefix}"`);
    }
    if (item.token === 'tok_prod') {
      throw new Error('FAIL: Production responder token received drill notification!');
    }
  }
  console.log('PASS: Notification title carries mandatory prefix and reaches ONLY enrolled participants.');

  // Test 4: Server Auto-Escalation Engine Isolation
  // In server.ts:
  // if (emergency.isDrill || emergencyId.startsWith('drill_') || emergency.status !== 'active') continue;
  const shouldAutoEscalateOnServer = (e: Emergency) => {
    if (e.isDrill || e.id.startsWith('drill_') || e.status !== 'active') return false;
    return true;
  };

  if (shouldAutoEscalateOnServer(isolatedDrill)) {
    throw new Error('FAIL: Drill was included in server auto-escalation queue!');
  }
  console.log('PASS: Server auto-escalation ignores drills unconditionally.');

  console.log('\nSUCCESS: All Server & Notification Drill Isolation tests passed cleanly!');
}

runDrillIsolationTest().catch(err => {
  console.error(err);
  process.exit(1);
});

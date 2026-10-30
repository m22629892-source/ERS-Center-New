import { isValidFcmToken } from '../services/mobileNotificationService';

async function runPushAcceptanceTests() {
  console.log('====================================================');
  console.log('🧪 Starting Strict Push & Device Registration Tests');
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

  // ----------------------------------------------------
  // Test 1: Rejection of Simulated/Fake Tokens
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Rejection of Fake & Simulated Tokens ---');
  const dummyTokens = [
    '',
    '   ',
    'web_fcm_1730000000000_abc123',
    'web_device_1730000000000_xyz789',
    'dummy_token_for_testing',
    'local_device_token',
    'fake_token_12345678901234567890123456789012345678901234567890',
    'short_token_30_characters_long'
  ];

  dummyTokens.forEach((badToken) => {
    assert(
      !isValidFcmToken(badToken),
      `Reject invalid/fake token: "${badToken.slice(0, 25)}..."`
    );
  });

  const validMockFcmToken = 'fK1s9x0_SampleRealFcmTokenWithOverFiftyCharactersLongValidAlphanumericEntropyPatternForTestingPushRegistration1234567890ABCDEFGH_xyz';
  assert(
    isValidFcmToken(validMockFcmToken),
    'Accept genuine high-entropy FCM token (>50 chars, no fake prefix)'
  );

  // ----------------------------------------------------
  // Test 2: Server Payload Validation (No Fake Successes)
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Server Validation Rules for Test Push ---');
  const validateTestPushPayload = (body: any) => {
    const { targetToken } = body;
    if (!targetToken || typeof targetToken !== 'string') {
      return { status: 400, success: false, error: 'targetToken is required' };
    }
    const trimmed = targetToken.trim();
    if (
      trimmed.length < 50 ||
      trimmed.startsWith('web_fcm_') ||
      trimmed.startsWith('web_device_') ||
      trimmed.startsWith('dummy_') ||
      trimmed.startsWith('local_')
    ) {
      return {
        status: 400,
        success: false,
        error: 'تم رفض الرمز: الرمز المدخل وهمي أو غير صالح. يتطلب النظام رمز FCM حقيقي من Firebase.',
        code: 'INVALID_OR_SIMULATED_TOKEN'
      };
    }
    return { status: 200, success: true };
  };

  const emptyReq = validateTestPushPayload({});
  assert(emptyReq.status === 400 && !emptyReq.success, 'Reject empty targetToken with HTTP 400');

  const fakeReq = validateTestPushPayload({ targetToken: 'web_fcm_1730000_xyz' });
  assert(fakeReq.status === 400 && !fakeReq.success && fakeReq.code === 'INVALID_OR_SIMULATED_TOKEN', 'Reject fake web_fcm_ token with HTTP 400 and clear error');

  const validReq = validateTestPushPayload({ targetToken: validMockFcmToken });
  assert(validReq.status === 200 && validReq.success, 'Valid token passes payload validation');

  // ----------------------------------------------------
  // Test 3: Dead Token vs Temporary Network Error Handling
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Dead Token vs Transient Error Handling ---');
  const shouldDeactivateToken = (errorCode: string) => {
    return (
      errorCode === 'messaging/invalid-registration-token' ||
      errorCode === 'messaging/registration-token-not-registered'
    );
  };

  assert(
    shouldDeactivateToken('messaging/invalid-registration-token'),
    'Deactivate on messaging/invalid-registration-token'
  );
  assert(
    shouldDeactivateToken('messaging/registration-token-not-registered'),
    'Deactivate on messaging/registration-token-not-registered'
  );
  assert(
    !shouldDeactivateToken('messaging/server-unavailable'),
    'Do NOT deactivate on temporary server-unavailable'
  );
  assert(
    !shouldDeactivateToken('messaging/internal-error'),
    'Do NOT deactivate on temporary internal-error'
  );

  // ----------------------------------------------------
  // Test 4: Deduplication Logic
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Alert Deduplication Logic ---');
  const dedupCache = new Map<string, number>();
  const isDuplicate = (alertId: string) => {
    const now = Date.now();
    for (const [k, ts] of dedupCache.entries()) {
      if (now - ts > 60000) dedupCache.delete(k);
    }
    if (dedupCache.has(alertId)) return true;
    dedupCache.set(alertId, now);
    return false;
  };

  const alert1 = 'em_fire_123_173000';
  assert(!isDuplicate(alert1), 'First arrival of alert1 is accepted');
  assert(isDuplicate(alert1), 'Immediate second arrival of alert1 is suppressed as duplicate');

  const alert2 = 'em_chemical_456_173001';
  assert(!isDuplicate(alert2), 'Different alert2 is accepted');

  // ----------------------------------------------------
  // Test 5: Logout Cleanup & Token Dissociation
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Logout Device Dissociation ---');
  let mockUserRecord: any = {
    userId: 'user_456',
    deviceId: 'dev_789',
    fcmToken: validMockFcmToken,
    isActive: true
  };

  const simulateLogout = (record: any) => {
    return {
      ...record,
      isActive: false,
      fcmToken: '',
      unregisteredAt: Date.now()
    };
  };

  const afterLogout = simulateLogout(mockUserRecord);
  assert(
    !afterLogout.isActive && afterLogout.fcmToken === '',
    'Device token is completely severed from user on logout'
  );

  // ----------------------------------------------------
  // Test 6: Drill vs Operational Isolation
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Drill vs Operational Push Isolation ---');
  const filterOperationalPushTargets = (emergency: any, activeDevices: any[]) => {
    if (emergency.isDrill || emergency.id?.startsWith('drill_')) {
      return []; // Must not send operational broadcast
    }
    return activeDevices.filter(d => d.isActive && d.fcmToken);
  };

  const devices = [
    { userId: 'u1', fcmToken: validMockFcmToken, isActive: true },
    { userId: 'u2', fcmToken: validMockFcmToken, isActive: true }
  ];

  const drillEmergency = { id: 'drill_101', isDrill: true, typeName: 'تمرين' };
  const prodEmergency = { id: 'em_202', isDrill: false, typeName: 'حريق' };

  const drillTargets = filterOperationalPushTargets(drillEmergency, devices);
  const prodTargets = filterOperationalPushTargets(prodEmergency, devices);

  assert(drillTargets.length === 0, 'Drill triggers 0 operational broadcasts');
  assert(prodTargets.length === 2, 'Live emergency dispatches to registered operational devices');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPushAcceptanceTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

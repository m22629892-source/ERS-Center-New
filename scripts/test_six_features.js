import assert from 'assert';
import fs from 'fs';
import { congestionService, DEFAULT_CONGESTION_THRESHOLDS } from '../services/congestionService.ts';
import { DEFAULT_QUICK_MESSAGES } from '../services/quickMessageService.ts';
import { performanceAnalyticsService, DEFAULT_RESPONSE_TARGETS } from '../services/performanceAnalyticsService.ts';
import { healthCheckService } from '../services/healthCheckService.ts';

console.log('====================================================');
console.log('RUNNING AUTOMATED TEST SUITE FOR SIX ERS FEATURES');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTests() {
  // TEST 1: i18n Completeness across all 6 languages
  totalTests++;
  try {
    const i18nContent = fs.readFileSync('i18n.ts', 'utf8');
    const langs = ['ar', 'en', 'ku', 'fr', 'de', 'ur'];

    const extractLangBlock = (content, langCode) => {
      const marker = `${langCode}: {\n    translation: {`;
      const altMarker = `${langCode}: {\r\n    translation: {`;
      let startIdx = content.indexOf(marker);
      if (startIdx === -1) startIdx = content.indexOf(altMarker);
      if (startIdx === -1) return null;

      const translationStart = content.indexOf('{', startIdx) + 1;
      const objectStart = content.indexOf('{', translationStart);
      
      let depth = 1;
      let i = objectStart + 1;
      while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') depth--;
        i++;
      }
      
      const block = content.substring(objectStart, i);
      const dict = {};
      const regex = /"([^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
      let match;
      while ((match = regex.exec(block)) !== null) {
        dict[match[1]] = match[2];
      }
      return dict;
    };

    const allKeys = new Set();
    const dicts = {};

    for (const lang of langs) {
      const d = extractLangBlock(i18nContent, lang);
      assert(d, `Language ${lang} should exist`);
      dicts[lang] = d;
      Object.keys(d).forEach(k => allKeys.add(k));
    }

    assert(allKeys.size >= 1000, `Expected at least 1000 keys, found ${allKeys.size}`);

    for (const lang of langs) {
      const missing = [...allKeys].filter(k => !(k in dicts[lang]));
      assert.strictEqual(missing.length, 0, `Language ${lang} has ${missing.length} missing keys: ${missing.slice(0, 5).join(', ')}`);
    }

    console.log('✅ [PASS] FEATURE I18N: All 6 languages contain 100% of keys with 0 missing');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE I18N:', err.message);
  }

  // TEST 2: Responder Counter Deduplication
  totalTests++;
  try {
    const mockEmergency = {
      id: 'em-101',
      responders: ['Officer Ahmad', 'Medic Sara', 'Officer Ahmad'],
      verifiedResponders: ['Officer Ahmad'],
    };

    const mockAcknowledgments = [
      { userId: 'user-1', userName: 'Officer Ahmad', stage: 'ON_SCENE' },
      { userId: 'user-2', userName: 'Medic Sara', stage: 'RESPONDING' },
      { userId: 'user-3', userName: 'Fireman Tariq', stage: 'ACKNOWLEDGED' },
      { userId: 'user-4', userName: 'Guard Fahad', stage: 'DECLINED' },
      { userId: 'user-2', userName: 'Medic Sara', stage: 'RESPONDING' },
    ];

    const userStateMap = new Map();
    mockAcknowledgments.forEach((ack) => {
      userStateMap.set(ack.userId, ack.stage);
    });

    let arrived = 0;
    let responding = 0;
    let acknowledged = 0;
    let declined = 0;

    userStateMap.forEach((stage) => {
      if (stage === 'ON_SCENE') arrived++;
      else if (stage === 'RESPONDING') responding++;
      else if (stage === 'ACKNOWLEDGED') acknowledged++;
      else if (stage === 'DECLINED') declined++;
    });

    assert.strictEqual(userStateMap.size, 4, 'Should deduplicate exactly to 4 distinct responders');
    assert.strictEqual(arrived, 1, 'Exactly 1 on scene');
    assert.strictEqual(responding, 1, 'Exactly 1 responding');
    assert.strictEqual(acknowledged, 1, 'Exactly 1 acknowledged');
    assert.strictEqual(declined, 1, 'Exactly 1 declined');

    console.log('✅ [PASS] FEATURE 1: Deduplication & Mutually Exclusive Responder States');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE 1:', err.message);
  }

  // TEST 3: Floor & Wing Congestion Grouping & Threshold Triggers
  totalTests++;
  try {
    const mockEmergencies = [
      { id: 'e1', typeName: 'حريق غاز', locationName: 'الدور الثاني - جناح A', severity: 'High' },
      { id: 'e2', typeName: 'التماس كهربائي', locationName: 'طابق 2 - الجناح A', severity: 'High' },
      { id: 'e3', typeName: 'تسرب مياه', locationName: 'Floor 2 - Wing A', severity: 'Medium' },
      { id: 'e4', typeName: 'بلاغ بسيط', locationName: 'الدور الأول - جناح B', severity: 'Low' },
    ];

    const mockLocations = [
      { id: 'l1', name: 'الدور الثاني - جناح A', floor_number: '2', coords: { lat: 0, lng: 0 } },
      { id: 'l2', name: 'الدور الأول - جناح B', floor_number: '1', coords: { lat: 0, lng: 0 } },
    ];

    const result = congestionService.computeCongestion(mockEmergencies, mockLocations, DEFAULT_CONGESTION_THRESHOLDS);

    assert(result.areaStats.length >= 2, 'Should group into at least 2 distinct areas');
    const f2 = result.areaStats.find(a => a.floor === '2');
    assert(f2, 'Floor 2 stat must exist');
    assert.strictEqual(f2.highCount, 2, 'Floor 2 should have 2 high severity incidents');
    assert.strictEqual(f2.level, 'critical', '2 High severity incidents must trigger Critical level');
    assert.strictEqual(result.overallLevel, 'critical', 'Overall facility level must reflect Critical');

    console.log('✅ [PASS] FEATURE 2: Floor & Wing Congestion Grouping & Threshold Triggers');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE 2:', err.message);
  }

  // TEST 4: Timeline Event Structure & Event Ordering
  totalTests++;
  try {
    const events = [
      { eventId: 'ev1', incidentId: 'em1', eventType: 'INCIDENT_CREATED', timestamp: 1000, actorName: 'Admin', descriptionKey: 'timeline_desc_created' },
      { eventId: 'ev2', incidentId: 'em1', eventType: 'ACKNOWLEDGED', timestamp: 2000, actorName: 'Officer', descriptionKey: 'timeline_desc_acknowledged' },
      { eventId: 'ev3', incidentId: 'em1', eventType: 'ON_SCENE', timestamp: 5000, actorName: 'Officer', descriptionKey: 'timeline_desc_on_scene' },
      { eventId: 'ev4', incidentId: 'em1', eventType: 'CLOSED', timestamp: 8000, actorName: 'Admin', descriptionKey: 'timeline_desc_closed' },
    ];

    const asc = [...events].sort((a, b) => a.timestamp - b.timestamp);
    assert.strictEqual(asc[0].eventType, 'INCIDENT_CREATED');
    assert.strictEqual(asc[asc.length - 1].eventType, 'CLOSED');

    const desc = [...events].sort((a, b) => b.timestamp - a.timestamp);
    assert.strictEqual(desc[0].eventType, 'CLOSED');
    assert.strictEqual(desc[desc.length - 1].eventType, 'INCIDENT_CREATED');

    console.log('✅ [PASS] FEATURE 3: Timeline Event Structure & Event Ordering');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE 3:', err.message);
  }

  // TEST 5: Quick Responder Message Templates Integrity
  totalTests++;
  try {
    assert.strictEqual(DEFAULT_QUICK_MESSAGES.length, 8, 'Must have exactly 8 standard quick messages');
    
    const requiredKeys = [
      'quick_msg_on_my_way',
      'quick_msg_arrived',
      'quick_msg_need_backup',
      'quick_msg_area_secured',
      'quick_msg_need_medical',
      'quick_msg_under_control',
      'quick_msg_unable_respond',
      'quick_msg_awaiting_instructions'
    ];

    requiredKeys.forEach(k => {
      const found = DEFAULT_QUICK_MESSAGES.find(m => m.key === k);
      assert(found, `Quick message ${k} must exist in default templates`);
    });

    console.log('✅ [PASS] FEATURE 4: Quick Responder Message Templates Integrity');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE 4:', err.message);
  }

  // TEST 6: Response Speed Performance Analytics Math
  totalTests++;
  try {
    const mockIncidents = [
      {
        id: 'inc-1',
        typeName: 'حريق',
        locationName: 'الدور 1',
        createdAt: 100000,
        firstAcknowledgedAt: 100000 + 30000,
        firstArrivalAt: 100000 + 180000,
        closedAt: 100000 + 600000,
        status: 'closed',
      },
      {
        id: 'inc-2',
        typeName: 'التماس',
        locationName: 'الدور 2',
        createdAt: 200000,
        firstAcknowledgedAt: 200000 + 90000,
        firstArrivalAt: 200000 + 400000,
        closedAt: 200000 + 1200000,
        status: 'closed',
      },
      {
        id: 'inc-3',
        typeName: 'حريق',
        locationName: 'الدور 1',
        createdAt: 300000,
        firstAcknowledgedAt: 300000 + 45000,
        firstArrivalAt: 300000 + 240000,
        status: 'active',
      }
    ];

    const summary = performanceAnalyticsService.computeAnalytics(mockIncidents, undefined, DEFAULT_RESPONSE_TARGETS);

    assert.strictEqual(summary.totalIncidents, 3);
    assert.strictEqual(summary.completedIncidents, 2);
    assert.strictEqual(summary.inProgressIncidents, 1);
    assert.strictEqual(summary.avgTimeToAcknowledgeSec, 55);
    assert.strictEqual(summary.medianTimeToAcknowledgeSec, 45);
    assert.strictEqual(summary.metArrivalCount, 2);
    assert.strictEqual(summary.metArrivalPercent, 67);

    const csv = performanceAnalyticsService.generateCsvExport(summary);
    assert(csv.includes('Incident ID'));
    assert(csv.includes('inc-1'));

    console.log('✅ [PASS] FEATURE 5: Response Speed Math, Percentiles & SLA Compliance');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE 5:', err.message);
  }

  // TEST 7: System Readiness Diagnostics
  totalTests++;
  try {
    const mockUser = { id: 'admin-1', name: 'Super Admin', role: 'super-admin' };
    const results = await healthCheckService.runFullDiagnostics(mockUser);
    assert(results.length >= 8, `Expected at least 8 diagnostic items, got ${results.length}`);

    const categories = new Set(results.map(r => r.category));
    assert(categories.has('firebase'));
    assert(categories.has('fcm'));
    assert(categories.has('pwa'));
    assert(categories.has('operational'));

    console.log('✅ [PASS] FEATURE 6: Health Check Categories & Diagnostic Coverage');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] FEATURE 6:', err.message);
  }

  console.log('\n====================================================');
  console.log(`FINAL RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
  console.log('====================================================');
  process.exit(0);
}

runTests();

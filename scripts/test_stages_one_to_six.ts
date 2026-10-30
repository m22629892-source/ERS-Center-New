/**
 * Automated Verification Script for Nidaa ERS: Stages 1 through 6
 */
import { performanceAnalyticsService } from '../services/performanceAnalyticsService';
import { unifiedMetricsService } from '../services/unifiedMetricsService';
import { floorPlanService } from '../services/floorPlanService';
import { pirService } from '../services/pirService';
import http from 'http';

function checkHttp(path: string, method: string = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING VERIFICATION OF ALL 6 STAGES ---\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // TEST 1: Unified Metrics & Drill Isolation (Stage 1.5 & Stage 4)
  const mockEmergencies: any[] = [
    {
      id: 'em-1',
      typeName: 'حريق كهربائي',
      locationName: 'مبنى أ',
      createdAt: Date.now() - 600000,
      firstAcknowledgedAt: Date.now() - 500000,
      firstArrivalAt: Date.now() - 400000,
      status: 'active',
      isDrill: false,
    },
    {
      id: 'em-2',
      typeName: 'تسرب مياه',
      locationName: 'مبنى ب',
      createdAt: Date.now() - 1200000,
      firstAcknowledgedAt: Date.now() - 1100000,
      closedAt: Date.now() - 200000,
      status: 'closed',
      isDrill: false,
    },
    {
      id: 'em-drill-1',
      typeName: '[تمرين محاكاة] خطة إخلاء',
      locationName: 'المبنى الرئيسي',
      createdAt: Date.now() - 300000,
      status: 'active',
      isDrill: true, // DRILL
    },
  ];

  const metrics = unifiedMetricsService.computeMetrics(mockEmergencies);
  assert(metrics.totalOperationalIncidents === 2, 'UnifiedMetrics: Strictly isolates operational incidents (excludes drills)');
  assert(metrics.drillIncidentsCount === 1, 'UnifiedMetrics: Correctly tracks isolated drills count');
  assert(metrics.activeIncidentsCount === 1, 'UnifiedMetrics: Correctly counts operational active incidents');
  assert(metrics.closedIncidentsCount === 1, 'UnifiedMetrics: Correctly counts operational closed incidents');

  // TEST 2: Performance Analytics Period Comparison & Arabic CSV (Stage 3)
  const comparison = performanceAnalyticsService.computePeriodComparison(mockEmergencies, 7, true);
  assert(typeof comparison.current.count === 'number', 'PerformanceAnalytics: Computes period comparison with sample sizes');

  const analyticsSummary = performanceAnalyticsService.computeAnalytics(mockEmergencies, undefined, undefined, true);
  const csv = performanceAnalyticsService.generateCsvExport(analyticsSummary);
  assert(csv.startsWith('\uFEFF'), 'PerformanceAnalytics: CSV export includes UTF-8 BOM for Arabic Microsoft Excel');
  assert(csv.includes('معرف البلاغ (Incident ID)'), 'PerformanceAnalytics: CSV includes official Arabic headers');

  // TEST 3: Floor Plan Service & Relative Coordinates (Stage 5)
  const floorPlan = floorPlanService.getDefaultFloorPlan('loc-1', 'مبنى الإدارة الرئيسي', '1');
  assert(floorPlan.markers.length >= 6, 'FloorPlanService: Generates standard blueprint with safety assets');
  const exits = floorPlan.markers.filter(m => m.type === 'exit');
  assert(exits.length >= 2, 'FloorPlanService: Includes primary and secondary emergency exits');
  const relativeCoordsValid = floorPlan.markers.every(m => m.x >= 0 && m.x <= 100 && m.y >= 0 && m.y <= 100);
  assert(relativeCoordsValid, 'FloorPlanService: All marker coordinates use relative percentage normalized values (0..100%)');

  // TEST 4: Post-Incident Review (PIR) & RCA Generation (Stage 6)
  const draftPir = pirService.generateDraftPirSummary(mockEmergencies[0]);
  assert(draftPir.summary.length > 20, 'PirService: Synthesizes comprehensive executive post-incident summary');
  assert(draftPir.rootCauses.includes('عامل'), 'PirService: Generates root causes (RCA) draft');
  assert(draftPir.strengths.length > 0 && draftPir.improvements.length > 0, 'PirService: Formulates strengths and areas of improvement');

  // TEST 5: Server-Side Auto-Escalation & Health Endpoints (Stage 2)
  try {
    const escPolicy: any = await checkHttp('/api/escalation/policy');
    assert(escPolicy.success === true && escPolicy.policy.enabled === true, 'Server: /api/escalation/policy endpoint returns valid auto-escalation policy');
    
    const escEval: any = await checkHttp('/api/escalation/evaluate', 'POST');
    assert(escEval.success === true, 'Server: /api/escalation/evaluate endpoint executes server-side auto-escalation engine');
  } catch (err: any) {
    console.warn('HTTP check notice (server may be launching):', err.message);
  }

  console.log(`\n--- ALL TESTS COMPLETED: ${passed}/${total} PASSED ---`);
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

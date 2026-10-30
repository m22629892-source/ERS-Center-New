import { pirService } from '../services/pirService';
import { Emergency, EmergencyStatus } from '../types';

async function runPirGroundingTest() {
  console.log('=== Running PIR Fact-Grounding Test ===');

  // Test Case: Incident with NO arrival timestamp, NO casualty records, NO containment timestamp
  const unverifiedIncident: Emergency = {
    id: 'test_inc_unverified_99',
    typeId: 'type_fire',
    typeName: 'حريق في المستودع ب',
    locationId: 'loc_b',
    locationName: 'مستودع المواد الكيميائية',
    createdAt: Date.now() - 3600000,
    status: EmergencyStatus.CLOSED,
    closedAt: Date.now(),
    createdBy: 'user_1',
    creatorName: 'أحمد مراقب',
    // Deliberately missing: firstArrivalAt, containedAt, casualties, responseTimeSeconds
    responders: [],
    notes: 'تمت ملاحظة أدخنة متصاعدة من الجهة الغربية.',
  };

  const draft = pirService.generateDraftPirSummary(unverifiedIncident, []);

  console.log('Generated Draft Assessments:');
  console.log('- Casualties:', draft.casualtyAssessment.details);
  console.log('- Arrival:', draft.arrivalAssessment.details);
  console.log('- Containment:', draft.containmentAssessment.details);
  console.log('- Root Cause Status:', draft.rootCauseStatus);

  // Assertions against forbidden hallucinated phrases
  const hallucinations = [
    'تمت السيطرة بنجاح',
    'انعدام الخسائر',
    'خلو الموقع من الخسائر',
    'عدم وجود إصابات',
    'سرعة استجابة قياسية',
    'الالتزام التام بالإجراءات'
  ];

  for (const h of hallucinations) {
    if (draft.summary.includes(h)) {
      throw new Error(`FAIL: Hallucinated phrase detected in draft summary: "${h}"`);
    }
  }

  // Verify non-documented flags
  if (!draft.casualtyAssessment.details.includes('غير موثق')) {
    throw new Error('FAIL: Casualty assessment must explicitly state "غير موثق" when unverified');
  }

  if (!draft.arrivalAssessment.details.includes('غير موثق')) {
    throw new Error('FAIL: Arrival assessment must explicitly state "غير موثق" when unverified');
  }

  if (!draft.containmentAssessment.details.includes('غير موثق')) {
    throw new Error('FAIL: Containment assessment must explicitly state "غير موثق" when unverified');
  }

  if (draft.rootCauseStatus !== 'preliminary_hypothesis') {
    throw new Error('FAIL: Root cause status must be "preliminary_hypothesis" until confirmed');
  }

  if (!draft.evidenceItems || draft.evidenceItems.length === 0) {
    throw new Error('FAIL: Evidence items must be extracted and classified');
  }

  console.log('\nEvidence Items Classification:');
  draft.evidenceItems.forEach((ev, i) => {
    console.log(`  [${i + 1}] Type: ${ev.type} | Source: ${ev.sourceType} | Text: "${ev.text}"`);
  });

  // Verify AI Draft anti-hallucination validator
  const hallucinatedAiText = 'تمت السيطرة بنجاح على الحريق وحدث انعدام تام للخسائر مع وصول قياسي للفرق.';
  const validation = pirService.validateAiDraftAgainstSources(
    hallucinatedAiText,
    false, // No arrival
    false, // No control
    false  // No casualties
  );

  console.log('\nAI Draft Validation result for hallucinated text:');
  console.log('- isValid:', validation.isValid);
  console.log('- Warnings generated:', validation.warnings);

  if (validation.isValid) {
    throw new Error('FAIL: Validator should have rejected hallucinated claims of success/zero-casualties');
  }

  if (validation.warnings.length < 3) {
    throw new Error('FAIL: Validator should generate warnings for control, casualties, and arrival');
  }

  console.log('\nSUCCESS: All PIR Grounding, Evidence Classification & Anti-Hallucination tests passed cleanly!');
}

runPirGroundingTest().catch(err => {
  console.error(err);
  process.exit(1);
});

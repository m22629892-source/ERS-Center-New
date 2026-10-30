import fs from 'fs';
import i18n from '../i18n.ts';

const content = fs.readFileSync('i18n.ts', 'utf8');

const extractLangBlock = (src, langCode) => {
  const marker = langCode + ': {';
  let startIdx = src.indexOf(marker);
  if (startIdx === -1) return null;
  const objectStart = src.indexOf('{', startIdx + marker.length);
  let depth = 1;
  let i = objectStart + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  const block = src.substring(objectStart, i);
  return JSON.parse(block);
};

const languages = ['ar', 'ku', 'ur', 'en', 'fr', 'de'];
const report = {
  timestamp: new Date().toISOString(),
  totalLanguages: languages.length,
  languagesChecked: languages,
  languageStats: {},
  criticalKeysVerification: {},
  languageSwitchTests: [],
  rtlLtrTests: [],
  allPassed: true
};

// 1. Check all languages and key completeness
const arDict = extractLangBlock(content, 'ar');
const baseKeys = Object.keys(arDict);
console.log(`[TEST 1] Base language (AR) contains ${baseKeys.length} keys.`);

for (const lang of languages) {
  const dict = extractLangBlock(content, lang);
  const keys = Object.keys(dict);
  const missingFromBase = baseKeys.filter(k => dict[k] === undefined || dict[k] === null || dict[k] === '');
  const emptyKeys = keys.filter(k => !dict[k] || dict[k].trim() === '');
  
  const completionRate = Math.round(((keys.length - missingFromBase.length) / baseKeys.length) * 100);

  report.languageStats[lang] = {
    totalKeys: keys.length,
    missingKeysCount: missingFromBase.length,
    emptyKeysCount: emptyKeys.length,
    completionPercentage: `${completionRate}%`,
    status: (missingFromBase.length === 0 && emptyKeys.length === 0) ? 'PASSED' : 'FAILED'
  };

  if (missingFromBase.length > 0 || emptyKeys.length > 0) {
    report.allPassed = false;
  }
  console.log(`- ${lang.toUpperCase()}: ${keys.length} keys | Missing: ${missingFromBase.length} | Completion: ${completionRate}% [${report.languageStats[lang].status}]`);
}

// 2. Check the specific keys from the user screenshot
const screenshotKeys = [
  'start_task_action',
  'complete_task_action',
  'skip_task_action',
  'block_task_action',
  'assign_employee',
  'status_pending',
  'mandatory_badge',
  'unassigned_task',
  'supervisor_approval_badge'
];

console.log('\n[TEST 2] Verifying Critical Screenshot Keys across ALL 6 languages:');
screenshotKeys.forEach(k => {
  report.criticalKeysVerification[k] = {};
  for (const lang of languages) {
    const dict = extractLangBlock(content, lang);
    const val = dict[k];
    report.criticalKeysVerification[k][lang] = val;
    if (!val || val === k) {
      report.allPassed = false;
      console.error(`ERROR: Key "${k}" in "${lang}" is invalid or leaked raw: "${val}"`);
    }
  }
  console.log(`  ✓ Key "${k}":`);
  console.log(`      AR: ${report.criticalKeysVerification[k].ar}`);
  console.log(`      KU: ${report.criticalKeysVerification[k].ku}`);
  console.log(`      UR: ${report.criticalKeysVerification[k].ur}`);
  console.log(`      EN: ${report.criticalKeysVerification[k].en}`);
  console.log(`      FR: ${report.criticalKeysVerification[k].fr}`);
  console.log(`      DE: ${report.criticalKeysVerification[k].de}`);
});

// 3. Test i18n instance language switching
console.log('\n[TEST 3] Testing sequential language switching on i18next runtime:');
for (const targetLang of languages) {
  i18n.changeLanguage(targetLang);
  const currentLang = i18n.language;
  const sampleText = i18n.t('start_task_action');
  const isRTL = targetLang === 'ar' || targetLang === 'ku' || targetLang === 'ur';
  const expectedDir = isRTL ? 'rtl' : 'ltr';

  const testResult = {
    targetLang,
    currentLang,
    direction: expectedDir,
    sampleResolvedText: sampleText,
    passed: currentLang === targetLang && sampleText !== 'start_task_action' && sampleText.length > 0
  };

  report.languageSwitchTests.push(testResult);
  if (!testResult.passed) report.allPassed = false;
  console.log(`  ✓ Switched to ${targetLang} -> current: ${currentLang} | dir: ${expectedDir} | sample: "${sampleText}" [${testResult.passed ? 'PASSED' : 'FAILED'}]`);
}

// 4. Test repeated rapid switching
console.log('\n[TEST 4] Testing rapid repeated switching:');
const cycle = ['ar', 'en', 'ku', 'de', 'ur', 'fr', 'ar', 'ur', 'en'];
let cyclePassed = true;
cycle.forEach((l, idx) => {
  i18n.changeLanguage(l);
  const resolved = i18n.t('status_pending');
  if (resolved === 'status_pending' || !resolved) {
    cyclePassed = false;
  }
});
console.log(`  ✓ Rapid cycle of 9 switches completed without regression: [${cyclePassed ? 'PASSED' : 'FAILED'}]`);

fs.writeFileSync('scripts/automated_i18n_test_results.json', JSON.stringify(report, null, 2), 'utf8');
console.log('\n[FINAL VERDICT]: ' + (report.allPassed && cyclePassed ? 'ALL TESTS PASSED 100%' : 'SOME TESTS FAILED'));

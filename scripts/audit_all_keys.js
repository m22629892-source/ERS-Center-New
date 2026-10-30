import fs from 'fs';
import path from 'path';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    if (['node_modules', '.git', 'dist', 'android', 'functions', 'scripts'].includes(dirent.name)) continue;
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) results.push(full);
  }
  return results;
};

const files = walk('.');
const keysFound = new Set();
for (const file of files) {
  if (file === 'i18n.ts' || file.includes('scripts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const regex = /t\(\s*(['"`])([^'"`]+)\1\s*[,)]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!match[2].includes('${')) {
      keysFound.add(match[2]);
    }
  }
}
console.log('Total non-dynamic keys in code:', keysFound.size);

// Read current i18n.ts
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
const report = {};

for (const lang of languages) {
  const dict = extractLangBlock(content, lang) || {};
  const missing = [];
  for (const k of keysFound) {
    if (!dict[k]) {
      missing.push(k);
    }
  }
  report[lang] = {
    totalKeysInI18n: Object.keys(dict).length,
    missingUsedKeysCount: missing.length,
    missingKeys: missing
  };
  console.log(`Lang: ${lang} | In i18n: ${Object.keys(dict).length} | Missing used keys: ${missing.length}`);
}

fs.writeFileSync('scripts/audit_report.json', JSON.stringify(report, null, 2), 'utf8');

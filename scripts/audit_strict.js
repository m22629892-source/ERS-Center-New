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
const strictKeys = new Map();

for (const file of files) {
  if (file === 'i18n.ts' || file.includes('scripts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  // strictly match standalone t('...') or i18n.t('...')
  const regex = /(?:^|[^a-zA-Z0-9_$])(?:t|i18n\.t)\(\s*['"]([a-zA-Z0-9_\-]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (!strictKeys.has(key)) strictKeys.set(key, new Set());
    strictKeys.get(key).add(file);
  }
}

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
  for (const [k, fileSet] of strictKeys.entries()) {
    if (!dict[k]) {
      missing.push({ key: k, files: Array.from(fileSet) });
    }
  }
  report[lang] = missing;
  console.log(`Lang: ${lang} | Strict missing keys count: ${missing.length}`);
}

console.log('\nStrict Missing Keys:');
report.ar.forEach((m, idx) => {
  console.log(`${idx + 1}. "${m.key}" -> in [${m.files.join(', ')}]`);
});

fs.writeFileSync('scripts/strict_missing.json', JSON.stringify(report, null, 2), 'utf8');

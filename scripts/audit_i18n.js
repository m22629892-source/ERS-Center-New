import fs from 'fs';
import path from 'path';

// Load i18n file and parse the resources object
const i18nContent = fs.readFileSync('i18n.ts', 'utf8');

// Simple regex or evaluate to extract translation objects
const extractLangBlock = (content, langCode) => {
  const marker = `${langCode}: {\n    translation: {`;
  const altMarker = `${langCode}: {\r\n    translation: {`;
  let startIdx = content.indexOf(marker);
  if (startIdx === -1) startIdx = content.indexOf(altMarker);
  if (startIdx === -1) return null;

  const translationStart = content.indexOf('{', startIdx) + 1;
  const objectStart = content.indexOf('{', translationStart);
  
  // Find matching closing brace
  let depth = 1;
  let i = objectStart + 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  
  const block = content.substring(objectStart, i);
  // Parse lines like "key": "value",
  const dict = {};
  const regex = /"([^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = regex.exec(block)) !== null) {
    dict[match[1]] = match[2];
  }
  return dict;
};

const languages = ['ar', 'en', 'ku', 'fr', 'de', 'ur'];
const data = {};
const allKeys = new Set();

for (const lang of languages) {
  const dict = extractLangBlock(i18nContent, lang);
  if (!dict) {
    console.error(`Failed to extract block for ${lang}`);
    continue;
  }
  data[lang] = dict;
  Object.keys(dict).forEach(k => allKeys.add(k));
}

console.log(`--- TOTAL UNIQUE KEYS IN i18n.ts: ${allKeys.size} ---`);

for (const lang of languages) {
  const keys = Object.keys(data[lang] || {});
  const missing = [...allKeys].filter(k => !(k in (data[lang] || {})));
  console.log(`Language [${lang}]: ${keys.length} keys. Missing: ${missing.length}`);
  if (missing.length > 0) {
    console.log(`  Missing in ${lang}: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
  }
}

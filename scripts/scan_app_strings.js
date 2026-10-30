import fs from 'fs';
import path from 'path';

function findFiles(dir, exts, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'android') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, exts, fileList);
    } else if (exts.some(ext => file.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const tsxFiles = [
  ...findFiles('./pages', ['.tsx', '.ts']),
  ...findFiles('./components', ['.tsx', '.ts']),
  ...findFiles('./context', ['.tsx', '.ts']),
  './App.tsx'
];

console.log(`Scanning ${tsxFiles.length} files...`);

// Regex for Arabic characters
const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const findings = [];

for (const file of tsxFiles) {
  if (file.includes('i18n.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Ignore comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    // Check if line contains Arabic
    if (arabicRegex.test(line)) {
      // Exclude predefined dummy seed data in services if any, but catch UI JSX strings
      findings.push({
        file,
        lineNum: idx + 1,
        text: trimmed
      });
    }
  });
}

console.log(`Total occurrences with Arabic text in source code: ${findings.length}`);
// Group by file
const byFile = {};
findings.forEach(f => {
  byFile[f.file] = (byFile[f.file] || 0) + 1;
});

console.log('Occurrences by file:');
Object.entries(byFile).sort((a,b) => b[1] - a[1]).forEach(([file, count]) => {
  console.log(`  ${file}: ${count}`);
});

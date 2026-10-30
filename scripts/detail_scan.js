import fs from 'fs';

const targetFiles = [
  'components/EmergencyVoiceNotesSection.tsx',
  'pages/admin/EmergencyChecklistsManagement.tsx',
  'components/EmergencyChecklistSection.tsx',
  'pages/admin/StaffReadinessManagement.tsx',
  'pages/admin/ConnectedDevicesMap.tsx',
  'pages/admin/IncidentPlayback.tsx',
  'pages/Settings.tsx'
];

const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

targetFiles.forEach(file => {
  console.log(`\n=================== FILE: ${file} ===================`);
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
    if (arabicRegex.test(line)) {
      console.log(`L${idx + 1}: ${trimmed}`);
    }
  });
});

import fs from 'fs';

// 1. Patch CaseReports.tsx
let caseReports = fs.readFileSync('pages/admin/CaseReports.tsx', 'utf8');

caseReports = caseReports
  .replace('>غير المعنيين<', '>{t("dismissed_responders")}<')
  .replace('>أغلق بواسطة<', '>{t("closed_by_header")}<')
  .replace('>التوثيق والملاحظات<', '>{t("documentation_notes_header")}<')
  .replace('>فرد<', '>{t("person_unit")}<')
  .replace('>نشطة حالياً<', '>{t("currently_active")}<')
  .replace('<span>المهام والتسجيلات</span>', '<span>{t("tasks_and_recordings")}</span>')
  .replace('>لا توجد بلاغات تطابق معايير البحث<', '>{t("no_cases_matching_search")}<')
  .replace('title={`توثيق وسجل الحادث: ${inspectingEmergency?.typeName || \'\'} (${inspectingEmergency?.locationName || \'\'})`}', 'title={`${t("incident_record_title")} ${inspectingEmergency?.typeName || \'\'} (${inspectingEmergency?.locationName || \'\'})`}')
  .replace('>جاري تحميل سجل المهام والملاحظات الصوتية الموثقة...<', '>{t("loading_incident_tasks_and_voice")}<')
  .replace('سجل المهام والبروتوكول الميداني ({inspectingTasks.length})', '{t("field_protocol_tasks_log")} ({inspectingTasks.length})')
  .replace('{inspectingTasks.filter(t => t.status === \'completed\').length} منجزة', '{inspectingTasks.filter(t => t.status === \'completed\').length} {t("status_completed")}')
  .replace('>لا توجد مهام مسجلة لهذا الحادث.<', '>{t("no_tasks_for_incident")}<')
  .replace('<span>في {new Date(task.completedAt).toLocaleTimeString(\'ar-SA\')}</span>', '<span>{t("at_time")} {new Date(task.completedAt).toLocaleTimeString()}</span>')
  .replace('<span>معتمد من المشرف: {task.approvedByName}</span>', '<span>{t("supervisor_approved")} {task.approvedByName}</span>')
  .replace('ملاحظة: {task.notes}', '{t("notes")}: {task.notes}')
  .replace('سبب التجاوز: {task.skipReason}', '{t("skip_reason_label")} {task.skipReason}')
  .replace('الملاحظات الصوتية الموثقة ({inspectingVoiceNotes.length})', '{t("voice_notes_list_title")} ({inspectingVoiceNotes.length})')
  .replace('>لا توجد تسجيلات صوتية مرتبطة بهذا الحادث.<', '>{t("voice_notes_empty")}<')
  .replace('{vn.durationSeconds} ثانية', '{vn.durationSeconds} {t("seconds")}')
  .replace('<span>{playingVoiceId === vn.noteId ? \'إيقاف\' : \'استماع\'}</span>', '<span>{playingVoiceId === vn.noteId ? t("pause") : t("play")}</span>')
  .replace('>إغلاق<', '>{t("close")}<');

fs.writeFileSync('pages/admin/CaseReports.tsx', caseReports, 'utf8');
console.log('Patched CaseReports.tsx');

// 2. Patch CrisisSimulator.tsx
let crisis = fs.readFileSync('pages/admin/CrisisSimulator.tsx', 'utf8');

crisis = crisis
  .replace('<Settings2 size={16} /> تخصيص محتوى المحاكي', '<Settings2 size={16} /> {t("customize_simulator_content")}')
  .replace('أدخل أنواع الحوادث أو المواقف التي تريد أن يركز عليها الذكاء الاصطناعي عند التوليد:', '{t("custom_simulator_prompt")}')
  .replace('placeholder="مثال: تسريب غاز في المعمل الكيميائي، حريق في غرفة الخوادم بالدور الثالث..."', 'placeholder={t("custom_situations_placeholder")}')
  .replace('حفظ المواقف المخصصة', '{t("save_custom_situations")}')
  .replace('توليد سيناريو مؤسسي', '{t("generate_corporate_scenario")}')
  .replace('تقوم وحدة ERS الذكية بربط بيانات منشأتك والمواقف المخصصة أعلاه لإنشاء تجربة تدريبية دقيقة ومتقدمة.', '{t("simulator_smart_desc")}')
  .replace("{scenario ? 'توليد سيناريو مختلف' : 'بدء المحاكاة الآن'}", '{scenario ? t("generate_different_scenario") : t("start_simulation_now")}')
  .replace('مستوى الصعوبة: {scenario.difficulty}', '{t("difficulty_level")}: {scenario.difficulty}')
  .replace('<AlertTriangle size={18} className="text-orange-500"/> تفاصيل الأزمة الميدانية', '<AlertTriangle size={18} className="text-orange-500"/> {t("field_crisis_details")}')
  .replace('title="طباعة"', 'title={t("print")}')
  .replace('title="تصدير PDF"', 'title={t("export_pdf")}');

fs.writeFileSync('pages/admin/CrisisSimulator.tsx', crisis, 'utf8');
console.log('Patched CrisisSimulator.tsx');

// 3. Patch AiReports.tsx
let aiReports = fs.readFileSync('pages/AiReports.tsx', 'utf8');

aiReports = aiReports
  .replace('>آخر 24 ساعة</button>', '>{t("last_24h")}</button>')
  .replace('>آخر أسبوع</button>', '>{t("last_week")}</button>')
  .replace('>آخر شهر</button>', '>{t("last_month")}</button>')
  .replace('>فترة مخصصة</button>', '>{t("custom_period")}</button>')
  .replace('>من تاريخ</label>', '>{t("from_date")}</label>')
  .replace('>إلى تاريخ</label>', '>{t("to_date")}</label>')
  .replace('البلاغات المطابقة ({filteredEmergencies.length})', '{t("matching_alerts_count", { count: filteredEmergencies.length })}')
  .replace('(report ? "تحديث التقرير" : "توليد التقرير الآن")', '(report ? t("update_report") : t("generate_now"))')
  .replace('title="مشاركة PDF"', 'title={t("share_report")}')
  .replace('title="طباعة"', 'title={t("print")}')
  .replace('title="تصدير PDF"', 'title={t("export_pdf")}');

fs.writeFileSync('pages/AiReports.tsx', aiReports, 'utf8');
console.log('Patched AiReports.tsx');

// 4. Patch LiveMap.tsx
let liveMap = fs.readFileSync('components/LiveMap.tsx', 'utf8');
liveMap = liveMap
  .replace(": 'غير متوفر'}", ": t('not_available')}")
  .replace('<span>البلد</span>', '<span>{t("country")}</span>');

fs.writeFileSync('components/LiveMap.tsx', liveMap, 'utf8');
console.log('Patched LiveMap.tsx');

// 5. Patch NewEmergency.tsx
let newEmergency = fs.readFileSync('pages/NewEmergency.tsx', 'utf8');
newEmergency = newEmergency
  .replace("typeName: selectedType?.type_name || 'طوارئ عامة',", "typeName: selectedType?.type_name || t('general_emergency'),")
  .replace("locationName: selectedLocation?.name || 'غير محدد',", "locationName: selectedLocation?.name || t('unspecified'),");

fs.writeFileSync('pages/NewEmergency.tsx', newEmergency, 'utf8');
console.log('Patched NewEmergency.tsx');

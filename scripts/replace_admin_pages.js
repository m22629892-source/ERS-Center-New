import fs from 'fs';

// 1. CaseReports.tsx
let caseReports = fs.readFileSync('pages/admin/CaseReports.tsx', 'utf8');
caseReports = caseReports.replace(
  '<h2 style="text-align:center; color:#1976d2;">سجل بلاغات الطوارئ ERS System</h2>',
  '<h2 style="text-align:center; color:#1976d2;">\' + t("case_reports_log_title") + \'</h2>'
);
caseReports = caseReports.replace(
  '<p style="text-align:center;">تاريخ الاستخراج: ${new Date().toLocaleString(\'ar-EG\')}</p>',
  '<p style="text-align:center;">\' + t("export_date") + \': \' + new Date().toLocaleString() + \'</p>'
);
caseReports = caseReports.replace(
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Search size={10}/> بحث باسم الحالة</label>',
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Search size={10}/> {t("search_case_name")}</label>'
);
caseReports = caseReports.replace(
  'placeholder="مثلاً: حريق، تسريب..."',
  'placeholder={t("case_name_placeholder")}'
);
caseReports = caseReports.replace(
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Filter size={10}/> فلترة الحالة</label>',
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Filter size={10}/> {t("filter_status")}</label>'
);
caseReports = caseReports.replace('<option value="all">الكل</option>', '<option value="all">{t("all_cases")}</option>');
caseReports = caseReports.replace('<option value="closed">مغلقة فقط</option>', '<option value="closed">{t("closed_only")}</option>');
caseReports = caseReports.replace('<option value="active">نشطة فقط</option>', '<option value="active">{t("active_only")}</option>');
caseReports = caseReports.replace(
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> من تاريخ</label>',
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> {t("from_date")}</label>'
);
caseReports = caseReports.replace(
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> إلى تاريخ</label>',
  '<label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> {t("to_date")}</label>'
);
caseReports = caseReports.replace(
  '<th className="px-4 sm:px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">نوع الطوارئ</th>',
  '<th className="px-4 sm:px-6 py-4 text-right rtl:text-right ltr:text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("emergency_type")}</th>'
);
fs.writeFileSync('pages/admin/CaseReports.tsx', caseReports, 'utf8');
console.log('Updated CaseReports.tsx');

// 2. RolesManagement.tsx
let roles = fs.readFileSync('pages/admin/RolesManagement.tsx', 'utf8');
roles = roles.replace('alert("فشل الحذف");', 'alert(t("delete_failed"));');
roles = roles.replace('setModalError("اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر.");', 'setModalError(t("username_already_exists"));');
roles = roles.replace('`حذف ${selectedUsers.length} مستخدم`', '`Deleted ${selectedUsers.length} users`');
roles = roles.replace('`حذف المستخدم: ${deleteId}`', '`Deleted user: ${deleteId}`');
roles = roles.replace('`تحديث بيانات المستخدم: ${currentUser.username}`', '`Updated user: ${currentUser.username}`');
roles = roles.replace('`إنشاء مستخدم جديد: ${newUser.name}`', '`Created user: ${newUser.name}`');
fs.writeFileSync('pages/admin/RolesManagement.tsx', roles, 'utf8');
console.log('Updated RolesManagement.tsx');

// 3. CrisisSimulator.tsx
let sim = fs.readFileSync('pages/admin/CrisisSimulator.tsx', 'utf8');
sim = sim.replace('alert("فشل حفظ الإعدادات");', 'alert(t("settings_save_failed"));');
sim = sim.replace('تقرير محاكي الأزمات الذكي ERS System', '\' + t("crisis_simulator_report_title") + \'');
sim = sim.replace('تاريخ التوليد: ${new Date().toLocaleString(\'ar-EG\')}', '\' + t("generation_date") + \': \' + new Date().toLocaleString() + \'');
sim = sim.replace('alert("أداة PDF غير محملة بعد، يرجى المحاولة مرة أخرى.");', 'alert(t("pdf_not_loaded_error"));');
sim = sim.replace('alert(`فشل توليد السيناريو: ${e.message}`);', 'alert(t("scenario_generation_failed", { error: e.message }));');
fs.writeFileSync('pages/admin/CrisisSimulator.tsx', sim, 'utf8');
console.log('Updated CrisisSimulator.tsx');

// 4. ApiSettings.tsx
let api = fs.readFileSync('pages/admin/ApiSettings.tsx', 'utf8');
api = api.replace('<Crown className="text-amber-500" /> بروتوكول حماية المفاتيح (Dual Key Failover)', '<Crown className="text-amber-500" /> {t("dual_key_failover_title")}');
api = api.replace('تأمين استمرارية الذكاء الاصطناعي بنسبة 99.9%', '{t("dual_key_failover_sub")}');
api = api.replace('نظام التبديل التلقائي (Smart Routing)', '{t("smart_routing_title")}');
api = api.replace('عند حدوث أي فشل في المفتاح "الأساسي"، سيقوم النظام فوراً وبدون تدخل بشري بالتحويل للمفتاح "الاحتياطي" لضمان عدم توقف التقارير الميدانية.', '{t("smart_routing_desc")}');
api = api.replace('<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> المفتاح الأساسي (Primary)', '<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> {t("primary_key_label")}');
api = api.replace('<div className="w-2 h-2 rounded-full bg-amber-500"></div> المفتاح الاحتياطي (Secondary Failover)', '<div className="w-2 h-2 rounded-full bg-amber-500"></div> {t("secondary_key_label")}');
api = api.replace('<span>جاري تحديث البروتوكول الآمن...</span>', '<span>{t("updating_secure_protocol")}</span>');
api = api.replace('<span>تفعيل وحفظ بروتوكول الحماية المزدوج</span>', '<span>{t("save_protection_protocol")}</span>');
api = api.replace('تم حفظ وتفعيل بروتوكول حماية المفاتيح بنجاح!', '{t("keys_saved_success")}');
fs.writeFileSync('pages/admin/ApiSettings.tsx', api, 'utf8');
console.log('Updated ApiSettings.tsx');

// 5. LocationsManagement.tsx
let loc = fs.readFileSync('pages/admin/LocationsManagement.tsx', 'utf8');
loc = loc.replace('setModalError("فشل الحفظ.");', 'setModalError(t("save_failed"));');
loc = loc.replace('<p>الطابق: ${selectedLocationForQr.floor_number}</p>', '<p>\' + t("floor_number") + \': \' + selectedLocationForQr.floor_number + \'</p>');
loc = loc.replace('<div class="footer">نظام ERS - تأكيد الوصول للموقع</div>', '<div class="footer">\' + t("qr_print_footer") + \'</div>');
loc = loc.replace('header: "رمز QR",', 'header: t("qr_code"),');
loc = loc.replace('title="عرض وطباعة رمز QR"', 'title={t("view_and_print_qr")}');
fs.writeFileSync('pages/admin/LocationsManagement.tsx', loc, 'utf8');
console.log('Updated LocationsManagement.tsx');

// 6. PresentationAssets.tsx
let pres = fs.readFileSync('pages/admin/PresentationAssets.tsx', 'utf8');
pres = pres.replace('title: "شاشة الدخول الذكية",', 'title: t("slide_login_title"),');
pres = pres.replace('description: "واجهة دخول مستقبلية مع بصمة إصبع وتصميم Minimalist ضوئي.",', 'description: t("slide_login_desc"),');
pres = pres.replace('title: "لوحة العمليات الحية",', 'title: t("slide_dashboard_title"),');
pres = pres.replace('description: "غرفة تحكم مركزية بشاشات ضخمة تعرض خرائط وبيانات حية.",', 'description: t("slide_dashboard_desc"),');
pres = pres.replace('title: "الرؤية العميقة للذكاء الاصطناعي",', 'title: t("slide_vision_title"),');
pres = pres.replace('description: "تحليل مشهد حريق باستخدام عيون روبوتية وبيانات HUD.",', 'description: t("slide_vision_desc"),');
pres = pres.replace('title: "الملاحة بالواقع المعزز",', 'title: t("slide_ar_nav_title"),');
pres = pres.replace('description: "أسهم توجيه ذكية تظهر في ممر بناية مشتعلة.",', 'description: t("slide_ar_nav_desc"),');
pres = pres.replace('title: "التواصل والترجمة الفورية",', 'title: t("slide_comm_title"),');
pres = pres.replace('description: "مسعفون يتواصلون عبر أجهزة معصم ذكية وهولوجرام.",', 'description: t("slide_comm_desc"),');
fs.writeFileSync('pages/admin/PresentationAssets.tsx', pres, 'utf8');
console.log('Updated PresentationAssets.tsx');

// 7. AdvancedAnalytics.tsx
let adv = fs.readFileSync('pages/admin/AdvancedAnalytics.tsx', 'utf8');
adv = adv.replace('تقرير التحليلات الاستراتيجية ERS System', '\' + t("strategic_analytics_report") + \' ERS System');
adv = adv.replace('تاريخ الاستخراج: ${new Date().toLocaleString(\'ar-EG\')}', '\' + t("export_date") + \': \' + new Date().toLocaleString() + \'');
adv = adv.replace("datasets: [{ label: 'دقائق',", "datasets: [{ label: t('minutes_unit'),");
adv = adv.replace("datasets: [{ label: 'عدد البلاغات',", "datasets: [{ label: t('alerts_count'),");
adv = adv.replace('label="إجمالي المستبعدين"', 'label={t("total_dismissals")}');
fs.writeFileSync('pages/admin/AdvancedAnalytics.tsx', adv, 'utf8');
console.log('Updated AdvancedAnalytics.tsx');

// 8. LoginLogs.tsx
let logs = fs.readFileSync('pages/admin/LoginLogs.tsx', 'utf8');
logs = logs.replace('<span className="text-green-500 font-bold text-xs animate-pulse">متصل الآن</span>', '<span className="text-green-500 font-bold text-xs animate-pulse">{t("connected_now")}</span>');
logs = logs.replace('return `${hours}س ${minutes}د`;', 'return t("time_hours_mins", { hours, minutes });');
logs = logs.replace('header: "توقيت الدخول",', 'header: t("login_time"),');
logs = logs.replace('<RefreshCw size={12} className="mr-1" /> إعادة تعيين', '<RefreshCw size={12} className="mr-1" /> {t("reset_filter")}');
fs.writeFileSync('pages/admin/LoginLogs.tsx', logs, 'utf8');
console.log('Updated LoginLogs.tsx');

// 9. ActiveUsersReport.tsx
let usersRep = fs.readFileSync('pages/admin/ActiveUsersReport.tsx', 'utf8');
usersRep = usersRep.replace('header: "الجهاز",', 'header: t("device"),');
usersRep = usersRep.replace('header: "الموقع (IP)",', 'header: `${t("location")} (IP)`,');
usersRep = usersRep.replace('placeholder="ابحث عن اسم الناشط..."', 'placeholder={t("search_active_user_placeholder")}');
fs.writeFileSync('pages/admin/ActiveUsersReport.tsx', usersRep, 'utf8');
console.log('Updated ActiveUsersReport.tsx');

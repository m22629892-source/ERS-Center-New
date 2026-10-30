import fs from 'fs';

// 1. AiReports.tsx
let aiReports = fs.readFileSync('pages/AiReports.tsx', 'utf8');
aiReports = aiReports.replace('throw new Error("يرجى اختيار بلاغ من القائمة أولاً لتوليد التقرير عليه.");', 'throw new Error(t("select_case_for_report_error"));');
fs.writeFileSync('pages/AiReports.tsx', aiReports, 'utf8');
console.log('Updated AiReports.tsx');

// 2. Alarm.tsx
let alarm = fs.readFileSync('pages/Alarm.tsx', 'utf8');
alarm = alarm.replace('<h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter italic">تنبيه عام</h1>', '<h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter italic">{t("general_alert")}</h1>');
alarm = alarm.replace('<span className="text-xl font-black tracking-widest uppercase">النداء الميداني الذكي</span>', '<span className="text-xl font-black tracking-widest uppercase">{t("ai_field_announcement")}</span>');
alarm = alarm.replace('<span className="text-[10px] font-black text-red-600 uppercase tracking-widest">بث ذكاء اصطناعي فوري</span>', '<span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{t("instant_ai_broadcast")}</span>');
alarm = alarm.replace('<StatBox icon={<Clock className="text-orange-500" size={16}/>} label="الزمن" value={elapsedTime} />', '<StatBox icon={<Clock className="text-orange-500" size={16}/>} label={t("elapsed_time")} value={elapsedTime} />');
alarm = alarm.replace('placeholder="صف الإجراءات التي قمت بها هنا..."', 'placeholder={t("action_notes_placeholder")}');
alarm = alarm.replace('<Loader2 className="animate-spin" /> جاري الإرسال وتأمين الموقع...', '<Loader2 className="animate-spin" /> {t("sending_and_securing")}');
alarm = alarm.replace('إرسال الاستجابة وإيقاف كافة الإنذارات', '{t("send_response_stop_sirens")}');
alarm = alarm.replace('إغلاق البلاغ نهائياً', '{t("permanently_close_case")}');
alarm = alarm.replace('title="ماسح رمز تأكيد الوصول"', 'title={t("qr_scanner_title")}');
alarm = alarm.replace('<Button variant="outline" fullWidth onClick={stopScanner} className="rounded-xl font-black py-3">إلغاء</Button>', '<Button variant="outline" fullWidth onClick={stopScanner} className="rounded-xl font-black py-3">{t("cancel")}</Button>');
fs.writeFileSync('pages/Alarm.tsx', alarm, 'utf8');
console.log('Updated Alarm.tsx');

// 3. NewEmergency.tsx
let newEm = fs.readFileSync('pages/NewEmergency.tsx', 'utf8');
newEm = newEm.replace("if (result.notes) setNotes(prev => `${prev}\\n[صوت]: ${result.notes}`);", "if (result.notes) setNotes(prev => `${prev}\\n${t('voice_prefix')}: ${result.notes}`);");
newEm = newEm.replace('setMicError("إذن الميكروفون مطلوب.");', 'setMicError(t("mic_permission_required"));');
newEm = newEm.replace('if (!typeId || !locationId) { alert("يرجى اختيار النوع والموقع"); return; }', 'if (!typeId || !locationId) { alert(t("select_type_and_location_error")); return; }');
newEm = newEm.replace('alert("حدث خطأ أثناء إرسال البلاغ");', 'alert(t("emergency_dispatch_error"));');
newEm = newEm.replace('<span className="font-bold text-center">ارفع صورة الحادث (اختياري)</span>', '<span className="font-bold text-center">{t("upload_incident_photo")}</span>');
newEm = newEm.replace('{analyzingImage ? <Loader2 className="animate-spin" /> : <><Bot className="mr-2" /> تحليل الذكاء الاصطناعي للمشهد</>}', '{analyzingImage ? <Loader2 className="animate-spin" /> : <><Bot className="mr-2" /> {t("ai_scene_analysis")}</>}');
newEm = newEm.replace('<option value="">اختر الموقع من القائمة</option>', '<option value="">{t("select_location_placeholder")}</option>');
newEm = newEm.replace('placeholder="اكتب أي تفاصيل إضافية عن المشهد..."', 'placeholder={t("incident_notes_placeholder")}');
newEm = newEm.replace("{isSubmitting ? <Loader2 className=" + '"animate-spin" /> : \'تفعيل الإنذار والنداء الموحد\'}', '{isSubmitting ? <Loader2 className="animate-spin" /> : t("activate_alarm_unified")}');
fs.writeFileSync('pages/NewEmergency.tsx', newEm, 'utf8');
console.log('Updated NewEmergency.tsx');

// 4. ActiveAlerts.tsx
let alerts = fs.readFileSync('pages/ActiveAlerts.tsx', 'utf8');
alerts = alerts.replace('alert("حدث خطأ أثناء الحذف");', 'alert(t("delete_error"));');
alerts = alerts.replace('إدارة ومتابعة حالات الطوارئ القائمة حالياً', '{t("active_alerts_page_desc")}');
alerts = alerts.replace('تحديد الكل ({filteredEmergencies.length})', '{t("select_all_with_count", { count: filteredEmergencies.length })}');
alerts = alerts.replace('<Trash2 size={14}/> حذف المحدد ({selectedIds.length})', '<Trash2 size={14}/> {t("delete_selected_with_count", { count: selectedIds.length })}');
alerts = alerts.replace('title="تأكيد الحذف الجماعي"', 'title={t("bulk_delete_confirm_title")}');
alerts = alerts.replace('message={`هل أنت متأكد من حذف ${selectedIds.length} بلاغ نشط؟ سيؤدي هذا لإزالة البلاغات من النظام تماماً.`}', 'message={t("bulk_delete_confirm_msg", { count: selectedIds.length })}');
fs.writeFileSync('pages/ActiveAlerts.tsx', alerts, 'utf8');
console.log('Updated ActiveAlerts.tsx');

// 5. Dashboard.tsx
let dash = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
dash = dash.replace('صوت الإنذار غير مفعل حالياً على جهازك', '{t("audio_siren_disabled_warning")}');
dash = dash.replace('تنشيط محرك الإنذار الآن', '{t("activate_audio_engine_now")}');
dash = dash.replace('title="الموظفون المتاحون"', 'title={t("available_staff_card")}');
dash = dash.replace('title="في استجابة ميدانية"', 'title={t("on_field_response_card")}');
dash = dash.replace('title="نسبة إنجاز المهام"', 'title={t("task_completion_rate_card")}');
dash = dash.replace('title="المهام المتأخرة"', 'title={t("delayed_tasks_card")}');
fs.writeFileSync('pages/Dashboard.tsx', dash, 'utf8');
console.log('Updated Dashboard.tsx');

// 6. Login.tsx
let login = fs.readFileSync('pages/Login.tsx', 'utf8');
login = login.replace('setError("تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.");', 'setError(t("network_connection_error"));');
login = login.replace('جاري استعادة الجلسة...', '{t("restoring_session_title")}');
login = login.replace('يرجى الانتظار، يتم تسجيل الدخول تلقائياً', '{t("restoring_session_desc")}');
login = login.replace('<WifiOff size={14} /> أنت حالياً في وضع عدم الاتصال', '<WifiOff size={14} /> {t("offline_login_badge")}');
fs.writeFileSync('pages/Login.tsx', login, 'utf8');
console.log('Updated Login.tsx');

// 7. MobileAppDownload.tsx
let dl = fs.readFileSync('pages/MobileAppDownload.tsx', 'utf8');
dl = dl.replace('<Smartphone size={18} /> تشخيص واختبار الجهاز', '<Smartphone size={18} /> {t("diagnostics_and_test_device")}');
fs.writeFileSync('pages/MobileAppDownload.tsx', dl, 'utf8');
console.log('Updated MobileAppDownload.tsx');

// 8. EmergencyChecklistsManagement.tsx
let chk = fs.readFileSync('pages/admin/EmergencyChecklistsManagement.tsx', 'utf8');
chk = chk.replace("titleAr: presetTypeId ? `قائمة مهام ${matchedType?.type_name}` : '',", "titleAr: presetTypeId ? t('default_checklist_title', { typeName: matchedType?.type_name }) : '',");
chk = chk.replace("description: 'بروتوكول السلامة المعتمد للاستجابة. يرجى توثيق كافة الخطوات بدقة.',", "description: t('default_checklist_desc'),");
chk = chk.replace("titleAr: 'التحقق الأولي من منطقة الخطر وتحديد المسار الآمن',", "titleAr: t('default_task_hazard_assessment'),");
chk = chk.replace("description: 'تقييم بيئة الحادث والتأكد من عدم وجود مخاطر غير متوقعة.',", "description: t('default_task_hazard_desc'),");
chk = chk.replace("setActionMessage({ type: 'error', text: 'يرجى إدخال عنوان القائمة وتحديد نوع الطوارئ' });", "setActionMessage({ type: 'error', text: t('checklist_validation_error') });");
chk = chk.replace("setActionMessage({ type: 'error', text: 'يجب إضافة مهمة واحدة على الأقل داخل القائمة' });", "setActionMessage({ type: 'error', text: t('checklist_tasks_required_error') });");
chk = chk.replace("setActionMessage({ type: 'success', text: 'تم حفظ القائمة بنجاح' });", "setActionMessage({ type: 'success', text: t('checklist_saved_success') });");
chk = chk.replace("setActionMessage({ type: 'error', text: e.message || 'فشل حفظ القائمة' });", "setActionMessage({ type: 'error', text: e.message || t('checklist_save_failed') });");
fs.writeFileSync('pages/admin/EmergencyChecklistsManagement.tsx', chk, 'utf8');
console.log('Updated EmergencyChecklistsManagement.tsx');

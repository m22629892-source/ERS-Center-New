import fs from 'fs';

// 1. Add missing keys to i18n.ts
const newKeys = {
  user_management: {
    ar: 'إدارة المستخدمين',
    en: 'User Management',
    ku: 'بەڕێوەبردنی بەکارهێنەران',
    fr: 'Gestion des utilisateurs',
    de: 'Benutzerverwaltung'
  },
  add_new_user: {
    ar: 'إضافة مستخدم جديد',
    en: 'Add New User',
    ku: 'زیادکردنی بەکارهێنەری نوێ',
    fr: 'Ajouter un utilisateur',
    de: 'Neuen Benutzer hinzufügen'
  },
  delete_selected: {
    ar: 'حذف المحدد',
    en: 'Delete Selected',
    ku: 'سڕینەوەی دیاریکراوەکان',
    fr: 'Supprimer la sélection',
    de: 'Ausgewählte löschen'
  },
  search_users_placeholder: {
    ar: 'بحث بالاسم أو اسم المستخدم...',
    en: 'Search by name or username...',
    ku: 'گەڕان بەپێی ناو یان ناوی بەکارهێنەر...',
    fr: 'Recherche par nom ou nom d\'utilisateur...',
    de: 'Suche nach Name oder Benutzername...'
  },
  all_roles: {
    ar: 'كل الأدوار',
    en: 'All Roles',
    ku: 'هەموو ڕۆڵەکان',
    fr: 'Tous les rôles',
    de: 'Alle Rollen'
  },
  edit_user_data: {
    ar: 'تعديل بيانات المستخدم',
    en: 'Edit User Details',
    ku: 'دەستکاریکردنی زانیاری بەکارهێنەر',
    fr: 'Modifier les données de l\'utilisateur',
    de: 'Benutzerdaten bearbeiten'
  },
  create_new_account: {
    ar: 'إنشاء حساب جديد',
    en: 'Create New Account',
    ku: 'دروستکردنی هەژماری نوێ',
    fr: 'Créer un nouveau compte',
    de: 'Neues Konto erstellen'
  },
  enter_real_name: {
    ar: 'أدخل الاسم الحقيقي',
    en: 'Enter full real name',
    ku: 'ناوی ڕاستەقینە بنووسە',
    fr: 'Entrez le nom réel',
    de: 'Vollständigen Namen eingeben'
  },
  username_login: {
    ar: 'اسم دخول النظام',
    en: 'System Login Username',
    ku: 'ناوی چوونەژوورەوەی سیستم',
    fr: 'Identifiant système',
    de: 'System-Anmeldename'
  },
  password_login: {
    ar: 'كلمة مرور الدخول',
    en: 'Login Password',
    ku: 'تێپەڕەوشەی چوونەژوورەوە',
    fr: 'Mot de passe',
    de: 'Anmeldepasswort'
  },
  select_role: {
    ar: 'تحديد الدور (Role)',
    en: 'Select Role',
    ku: 'دیاریکردنی ڕۆڵ',
    fr: 'Sélectionner le rôle',
    de: 'Rolle auswählen'
  },
  role_user: {
    ar: 'مستخدم عادي (User)',
    en: 'Standard User (User)',
    ku: 'بەکارهێنەری ئاسایی',
    fr: 'Utilisateur standard (User)',
    de: 'Standard-Benutzer (User)'
  },
  role_responder: {
    ar: 'مستجيب ميداني (Responder)',
    en: 'Field Responder',
    ku: 'وەڵامدەرەوەی مەیدانی',
    fr: 'Intervenant terrain (Responder)',
    de: 'Einsatzkraft (Responder)'
  },
  role_admin: {
    ar: 'مسؤول نظام (Admin)',
    en: 'System Administrator (Admin)',
    ku: 'بەڕێوەبەری سیستم',
    fr: 'Administrateur système (Admin)',
    de: 'Systemadministrator (Admin)'
  },
  add_user_now: {
    ar: 'إضافة المستخدم الآن',
    en: 'Add User Now',
    ku: 'زیادکردنی بەکارهێنەر ئێستا',
    fr: 'Ajouter l\'utilisateur maintenant',
    de: 'Benutzer jetzt hinzufügen'
  },
  confirm_bulk_delete: {
    ar: 'تأكيد الحذف الجماعي',
    en: 'Confirm Bulk Deletion',
    ku: 'دڵنیابوون لە سڕینەوەی بەکۆمەڵ',
    fr: 'Confirmer la suppression groupée',
    de: 'Massenlöschung bestätigen'
  },
  confirm_bulk_delete_msg: {
    ar: 'هل أنت متأكد من حذف {{count}} مستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
    en: 'Are you sure you want to delete {{count}} users? This action cannot be undone.',
    ku: 'دڵنیایت لە سڕینەوەی {{count}} بەکارهێنەر؟ ئەم کردارە پاشگەزبوونەوەی نییە.',
    fr: 'Êtes-vous sûr de vouloir supprimer {{count}} utilisateurs ? Cette action est irréversible.',
    de: 'Möchten Sie wirklich {{count}} Benutzer löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
  },
  delete_user: {
    ar: 'حذف المستخدم',
    en: 'Delete User',
    ku: 'سڕینەوەی بەکارهێنەر',
    fr: 'Supprimer l\'utilisateur',
    de: 'Benutzer löschen'
  },
  confirm_single_delete_user_msg: {
    ar: 'هل أنت متأكد من حذف هذا المستخدم نهائياً من النظام؟',
    en: 'Are you sure you want to permanently delete this user from the system?',
    ku: 'دڵنیایت لە سڕینەوەی هەمیشەیی ئەم بەکارهێنەرە لە سیستم؟',
    fr: 'Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur du système ?',
    de: 'Sind Sie sicher, dass Sie diesen Benutzer dauerhaft aus dem System löschen möchten?'
  },
  save_data_failed: {
    ar: 'فشل في حفظ البيانات، يرجى المحاولة لاحقاً.',
    en: 'Failed to save data, please try again later.',
    ku: 'پاشەکەوتکردنی داتا سەرکەوتوو نەبوو، تکایە دواتر هەوڵبدەرەوە.',
    fr: 'Échec de l\'enregistrement des données, veuillez réessayer plus tard.',
    de: 'Daten konnten nicht gespeichert werden, bitte versuchen Sie es später erneut.'
  },
  operations_chat: {
    ar: 'دردشة العمليات',
    en: 'Operations Chat',
    ku: 'چاتی ئۆپەراسیۆنەکان',
    fr: 'Chat des opérations',
    de: 'Einsatz-Chat'
  },
  type_message: {
    ar: 'اكتب رسالة...',
    en: 'Type a message...',
    ku: 'پەیامێک بنووسە...',
    fr: 'Écrivez un message...',
    de: 'Nachricht eingeben...'
  },
  processing_file_upload: {
    ar: 'جاري معالجة ورفع الملف...',
    en: 'Processing and uploading file...',
    ku: 'پرۆسەکردن و بارکردنی پەڕگە...',
    fr: 'Traitement et téléversement du fichier...',
    de: 'Datei wird verarbeitet und hochgeladen...'
  },
  verification_code: {
    ar: 'كود التحقق',
    en: 'Verification Code',
    ku: 'کۆدی پشتڕاستکردنەوە',
    fr: 'Code de vérification',
    de: 'Bestätigungscode'
  },
  auto_generated: {
    ar: 'سيتم توليده تلقائياً',
    en: 'Will be auto-generated',
    ku: 'خۆکارانە دروست دەکرێت',
    fr: 'Généré automatiquement',
    de: 'Wird automatisch generiert'
  },
  qr_modal_title: {
    ar: 'رمز الاستجابة السريعة (QR)',
    en: 'Quick Response Code (QR)',
    ku: 'کۆدی وەڵامدانەوەی خێرا (QR)',
    fr: 'Code QR',
    de: 'QR-Code'
  },
  print_qr_location: {
    ar: 'طباعة الرمز للموقع',
    en: 'Print QR for Location',
    ku: 'چاپکردنی کۆد بۆ شوێن',
    fr: 'Imprimer le code pour le lieu',
    de: 'QR-Code für Standort drucken'
  },
  ignored_unconcerned: {
    ar: 'تجاهل (غير معني)',
    en: 'Ignored (Not concerned)',
    ku: 'پشتگوێخراو (پەیوەندیدار نییە)',
    fr: 'Ignoré (Non concerné)',
    de: 'Ignoriert (Nicht betroffen)'
  },
  ai_call_prompt: {
    ar: 'اتصل بوحدة الاستجابة الذكية ERS للحصول على ملخص الحالة وتوجيهات الاستجابة الفورية.',
    en: 'Call the ERS Smart Response unit for situation summary and immediate guidance.',
    ku: 'پەیوەندی بە یەکەی وەڵامدانەوەی زیرەکی ERS بکە بۆ کورتەی دۆخەکە و ڕێنمایی خێرا.',
    fr: 'Appelez l\'unité d\'intervention intelligente ERS pour un résumé et des directives immédiates.',
    de: 'Rufen Sie die intelligente ERS-Einsatzeinheit für Lageübersicht und Sofortmaßnahmen an.'
  },
  connecting_call: {
    ar: 'جاري الربط...',
    en: 'Connecting...',
    ku: 'پەیوەستبوون...',
    fr: 'Connexion en cours...',
    de: 'Verbinde...'
  },
  start_call_now: {
    ar: 'بدء المكالمة الآن',
    en: 'Start Call Now',
    ku: 'دەستپێکردنی پەیوەندی ئێستا',
    fr: 'Démarrer l\'appel',
    de: 'Anruf jetzt starten'
  },
  active_call: {
    ar: 'مكالمة نشطة',
    en: 'Active Call',
    ku: 'پەیوەندی چالاک',
    fr: 'Appel en cours',
    de: 'Aktiver Anruf'
  },
  waiting_support_summary: {
    ar: 'بانتظار ملخص الدعم الفني...',
    en: 'Waiting for technical support summary...',
    ku: 'چاوەڕوانی کورتەی پشتیوانی تەکنیکی...',
    fr: 'En attente du résumé du support...',
    de: 'Warte auf Zusammenfassung...'
  },
  end_call: {
    ar: 'إنهاء المكالمة',
    en: 'End Call',
    ku: 'کۆتاییهێنان بە پەیوەندی',
    fr: 'Mettre fin à l\'appel',
    de: 'Anruf beenden'
  },
  update_keys_in_db: {
    ar: 'تحديث المفاتيح في قاعدة البيانات',
    en: 'Update keys in database',
    ku: 'نوێکردنەوەی کلیلەکان لە بنکەدراوەدا',
    fr: 'Mettre à jour les clés dans la base',
    de: 'Schlüssel in Datenbank aktualisieren'
  },
  api_sync_success: {
    ar: 'تمت المزامنة بنجاح - النظام يعمل بالوضعية الثنائية الآن.',
    en: 'Synced successfully - System is operating in dual mode now.',
    ku: 'هاوکاتکردن سەرکەوتوو بوو - سیستم ئێستا بە شێوازی دووانی کار دەکات.',
    fr: 'Synchronisé avec succès - Le système fonctionne en mode double.',
    de: 'Erfolgreich synchronisiert - System arbeitet nun im Dual-Modus.'
  },
  api_sync_fail: {
    ar: 'خطأ: فشل الوصول لقاعدة البيانات لتحديث البروتوكول.',
    en: 'Error: Failed to reach database to update protocol.',
    ku: 'هەڵە: دەستگەیشتن بە بنکەدراوە بۆ نوێکردنەوەی پرۆتۆکۆڵ سەرکەوتوو نەبوو.',
    fr: 'Erreur : Impossible d\'accéder à la base pour mettre à jour le protocole.',
    de: 'Fehler: Datenbankzugriff zur Protokollaktualisierung fehlgeschlagen.'
  },
  secure_connection_verified: {
    ar: 'تم التحقق: بيئة اتصال مشفرة ومؤمنة',
    en: 'Verified: Encrypted and secure connection environment',
    ku: 'پشتڕاستکرایەوە: ژینگەی پەیوەندی شفرەکراو و پارێزراوە',
    fr: 'Vérifié : Environnement de connexion chiffré et sécurisé',
    de: 'Verifiziert: Verschlüsselte und sichere Verbindungsumgebung'
  },
  strategic_brain_reports: {
    ar: 'العقل الاستراتيجي والتقارير',
    en: 'Strategic Brain & Reports',
    ku: 'مێشکی ستراتیژی و ڕاپۆرتەکان',
    fr: 'Cerveau stratégique & Rapports',
    de: 'Strategisches Gehirn & Berichte'
  },
  strategic_brain_desc: {
    ar: 'دماغ رقمي يولد تقارير وبيانات قانونية معقدة.',
    en: 'Digital brain that generates complex legal reports and insights.',
    ku: 'مێشکێکی دیجیتاڵی کە ڕاپۆرت و داتای یاسایی ئاڵۆز دروست دەکات.',
    fr: 'Cerveau numérique générant des rapports légaux complexes.',
    de: 'Digitales Gehirn zur Erstellung komplexer Berichte.'
  },
  generate_high_res_slides: {
    ar: 'قم بتوليد صور احترافية عالية الدقة لشرائح العرض التقديمي',
    en: 'Generate high-resolution professional visuals for presentation slides',
    ku: 'وێنەی پیشەیی بە ڕوونی بەرز بۆ سلایدەکانی پێشکەشکردن دروست بکە',
    fr: 'Générez des visuels professionnels haute résolution pour vos diapositives',
    de: 'Professionelle hochauflösende Grafiken für Präsentationsfolien generieren'
  },
  ai_drawing_in_progress: {
    ar: 'جاري الرسم بالذكاء الاصطناعي...',
    en: 'AI generation in progress...',
    ku: 'کێشانی وێنە بە ژیری دەستکرد...',
    fr: 'Génération IA en cours...',
    de: 'KI-Generierung läuft...'
  },
  regenerate_pro: {
    ar: 'إعادة توليد (Pro)',
    en: 'Regenerate (Pro)',
    ku: 'دووبارە دروستکردنەوە (Pro)',
    fr: 'Régénérer (Pro)',
    de: 'Neu generieren (Pro)'
  },
  presentation_assets_notice: {
    ar: 'ملاحظة: هذه العملية تتطلب مفتاح API مدفوع. الصور المولدة هنا هي أصول بصرية لتصميم شرائحك.',
    en: 'Note: This operation requires a paid API key. Generated images are visual assets for your slides.',
    ku: 'تێبینی: ئەم کردارە پێویستی بە کلیلی API پارەپێدراوە. وێنە دروستکراوەکان بەهای بینراون بۆ سلایدەکانت.',
    fr: 'Remarque : Nécessite une clé API payante. Les images générées sont des ressources visuelles pour vos diapositives.',
    de: 'Hinweis: Erfordert einen kostenpflichtigen API-Schlüssel. Die generierten Bilder sind visuelle Assets für Ihre Folien.'
  },
  select_filters_and_generate: {
    ar: 'حدد معايير الفلترة واضغط توليد',
    en: 'Select filter criteria and click generate',
    ku: 'پێوەرەکانی پاڵاوتن دیاری بکە و داگرتنی دروستکردن بکە',
    fr: 'Sélectionnez les filtres et cliquez sur générer',
    de: 'Filterkriterien auswählen und auf Generieren klicken'
  },
  update_report: {
    ar: 'تحديث التقرير',
    en: 'Update Report',
    ku: 'نوێکردنەوەی ڕاپۆرت',
    fr: 'Mettre à jour le rapport',
    de: 'Bericht aktualisieren'
  },
  checklist_version_approved: {
    ar: 'تم اعتماد الإصدار الجديد للقائمة وتثبيته رسمياً',
    en: 'New checklist version officially approved and deployed',
    ku: 'وەشانی نوێی لیستەکە پەسەند کرا و بە فەرمی جێگیرکرا',
    fr: 'Nouvelle version de la liste approuvée et déployée',
    de: 'Neue Checklistenversion offiziell genehmigt und bereitgestellt'
  },
  checklist_approval_failed: {
    ar: 'فشل الاعتماد',
    en: 'Approval failed',
    ku: 'پەسەندکردن سەرکەوتوو نەبوو',
    fr: 'Échec de l\'approbation',
    de: 'Genehmigung fehlgeschlagen'
  },
  checklist_deleted_success: {
    ar: 'تم حذف القائمة بنجاح',
    en: 'Checklist deleted successfully',
    ku: 'لیستەکە بە سەرکەوتوویی سڕایەوە',
    fr: 'Liste supprimée avec succès',
    de: 'Checkliste erfolgreich gelöscht'
  },
  checklist_delete_failed: {
    ar: 'فشل الحذف',
    en: 'Deletion failed',
    ku: 'سڕینەوە سەرکەوتوو نەبوو',
    fr: 'Échec de la suppression',
    de: 'Löschen fehlgeschlagen'
  },
  checklists_imported_count: {
    ar: 'تم استيراد واعتماد {{count}} بروتوكولات سلامة رسمية مطابقة لمعايير الاستجابة الطارئة.',
    en: 'Imported and approved {{count}} official safety protocols matching emergency response standards.',
    ku: 'هاوردەکردن و پەسەندکردنی {{count}} پرۆتۆکۆڵی سەلامەتی فەرمی کە هاوتایە لەگەڵ ستانداردەکانی وەڵامدانەوەی لەناکاو.',
    fr: 'Importé et approuvé {{count}} protocoles de sécurité officiels conformes aux normes d\'urgence.',
    de: '{{count}} offizielle Sicherheitsprotokolle gemäß Notfallstandards importiert und genehmigt.'
  },
  generate_checklists_failed: {
    ar: 'فشل توليد القوائم المعتمدة',
    en: 'Failed to generate approved checklists',
    ku: 'دروستکردنی لیستە پەسەندکراوەکان سەرکەوتوو نەبوو',
    fr: 'Échec de la génération des listes approuvées',
    de: 'Erstellung der genehmigten Checklisten fehlgeschlagen'
  },
  response_call_for_type: {
    ar: 'نداء استجابة حالة {{type}}',
    en: 'Response call for {{type}} emergency',
    ku: 'بانگی وەڵامدانەوە بۆ باری {{type}}',
    fr: 'Appel d\'intervention pour {{type}}',
    de: 'Einsatzruf für {{type}}'
  },
  image_generation_failed: {
    ar: 'فشل توليد الصورة',
    en: 'Failed to generate image',
    ku: 'دروستکردنی وێنە سەرکەوتوو نەبوو',
    fr: 'Échec de la génération de l\'image',
    de: 'Bildgenerierung fehlgeschlagen'
  }
};

let i18nContent = fs.readFileSync('i18n.ts', 'utf8');
const langs = ['ar', 'en', 'ku', 'fr', 'de'];

langs.forEach(lang => {
  const marker = `${lang}: {\n    translation: {`;
  if (i18nContent.includes(marker)) {
    let additions = '';
    for (const [key, valObj] of Object.entries(newKeys)) {
      if (!i18nContent.includes(`"${key}":`)) {
        additions += `\n      "${key}": ${JSON.stringify(valObj[lang])},`;
      }
    }
    if (additions) {
      i18nContent = i18nContent.replace(marker, marker + additions);
    }
  }
});

fs.writeFileSync('i18n.ts', i18nContent, 'utf8');
console.log('Appended additional keys to i18n.ts');

// 2. Patch RolesManagement.tsx
let roles = fs.readFileSync('pages/admin/RolesManagement.tsx', 'utf8');
roles = roles.replace("header: 'الحالة',", "header: t('status'),");
roles = roles.replace("{isOnline ? 'متصل' : 'أوفلاين'}", "{isOnline ? t('online') : t('offline')}");
roles = roles.replace('<Shield size={24} className="text-blue-500" /> إدارة المستخدمين', '<Shield size={24} className="text-blue-500" /> {t("user_management")}');
roles = roles.replace('<Plus size={18} /> إضافة مستخدم جديد', '<Plus size={18} /> {t("add_new_user")}');
roles = roles.replace('<Trash2 size={18} className="mr-2"/> حذف المحدد ({selectedUsers.length})', '<Trash2 size={18} className="mr-2"/> {t("delete_selected")} ({selectedUsers.length})');
roles = roles.replace('placeholder="بحث بالاسم أو اسم المستخدم..."', 'placeholder={t("search_users_placeholder")}');
roles = roles.replace('<option value="all">كل الأدوار</option>', '<option value="all">{t("all_roles")}</option>');
roles = roles.replace('title={currentUser ? "تعديل بيانات المستخدم" : "إنشاء حساب جديد"}', 'title={currentUser ? t("edit_user_data") : t("create_new_account")}');
roles = roles.replace('setModalError("فشل في حفظ البيانات، يرجى المحاولة لاحقاً.");', 'setModalError(t("save_data_failed"));');
roles = roles.replace('<label className="block text-xs font-bold text-gray-400 mb-1">الاسم الكامل</label>', '<label className="block text-xs font-bold text-gray-400 mb-1">{t("full_name")}</label>');
roles = roles.replace('placeholder="أدخل الاسم الحقيقي"', 'placeholder={t("enter_real_name")}');
roles = roles.replace('<label className="block text-xs font-bold text-gray-400 mb-1">اسم المستخدم</label>', '<label className="block text-xs font-bold text-gray-400 mb-1">{t("username")}</label>');
roles = roles.replace('placeholder="اسم دخول النظام"', 'placeholder={t("username_login")}');
roles = roles.replace('<label className="block text-xs font-bold text-gray-400 mb-1">كلمة المرور</label>', '<label className="block text-xs font-bold text-gray-400 mb-1">{t("password")}</label>');
roles = roles.replace('placeholder="كلمة مرور الدخول"', 'placeholder={t("password_login")}');
roles = roles.replace('<label className="block text-xs font-bold text-gray-400 mb-1">تحديد الدور (Role)</label>', '<label className="block text-xs font-bold text-gray-400 mb-1">{t("select_role")}</label>');
roles = roles.replace('<option value={UserRole.USER}>مستخدم عادي (User)</option>', '<option value={UserRole.USER}>{t("role_user")}</option>');
roles = roles.replace('<option value={UserRole.RESPONDER}>مستجيب ميداني (Responder)</option>', '<option value={UserRole.RESPONDER}>{t("role_responder")}</option>');
roles = roles.replace('<option value={UserRole.ADMIN}>مسؤول نظام (Admin)</option>', '<option value={UserRole.ADMIN}>{t("role_admin")}</option>');
roles = roles.replace('{isSaving ? <Loader2 className="animate-spin mx-auto" /> : (currentUser ? "حفظ التعديلات" : "إضافة المستخدم الآن")}', '{isSaving ? <Loader2 className="animate-spin mx-auto" /> : (currentUser ? t("save_changes") : t("add_user_now"))}');
roles = roles.replace('title="تأكيد الحذف الجماعي"', 'title={t("confirm_bulk_delete")}');
roles = roles.replace('message={`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟ لا يمكن التراجع عن هذا الإجراء.`}', 'message={t("confirm_bulk_delete_msg", { count: selectedUsers.length })}');
roles = roles.replace('title="حذف المستخدم"', 'title={t("delete_user")}');
roles = roles.replace('message="هل أنت متأكد من حذف هذا المستخدم نهائياً من النظام؟"', 'message={t("confirm_single_delete_user_msg")}');
fs.writeFileSync('pages/admin/RolesManagement.tsx', roles, 'utf8');
console.log('Patched RolesManagement.tsx');

// 3. Patch PrivateChat.tsx
let chat = fs.readFileSync('components/PrivateChat.tsx', 'utf8');
chat = chat.replace('"دردشة العمليات"', 't("operations_chat")');
chat = chat.replace('placeholder="اكتب رسالة..."', 'placeholder={t("type_message")}');
chat = chat.replace('جاري معالجة ورفع الملف...', '{t("processing_file_upload")}');
fs.writeFileSync('components/PrivateChat.tsx', chat, 'utf8');
console.log('Patched PrivateChat.tsx');

// 4. Patch LocationsManagement.tsx
let loc = fs.readFileSync('pages/admin/LocationsManagement.tsx', 'utf8');
loc = loc.replace('<label className="w-1/3 text-xs font-black text-gray-400 uppercase tracking-widest">كود التحقق</label>', '<label className="w-1/3 text-xs font-black text-gray-400 uppercase tracking-widest">{t("verification_code")}</label>');
loc = loc.replace('placeholder="سيتم توليده تلقائياً"', 'placeholder={t("auto_generated")}');
loc = loc.replace('title="رمز الاستجابة السريعة (QR)"', 'title={t("qr_modal_title")}');
loc = loc.replace('كود التحقق:', '{t("verification_code")}:');
loc = loc.replace('<Printer size={20} /> طباعة الرمز للموقع', '<Printer size={20} /> {t("print_qr_location")}');
fs.writeFileSync('pages/admin/LocationsManagement.tsx', loc, 'utf8');
console.log('Patched LocationsManagement.tsx');

// 5. Patch AdvancedAnalytics.tsx
let adv = fs.readFileSync('pages/admin/AdvancedAnalytics.tsx', 'utf8');
adv = adv.replace('<th className="p-4 text-center">تجاهل (غير معني)</th>', '<th className="p-4 text-center">{t("ignored_unconcerned")}</th>');
fs.writeFileSync('pages/admin/AdvancedAnalytics.tsx', adv, 'utf8');
console.log('Patched AdvancedAnalytics.tsx');

// 6. Patch AiLiveAssistant.tsx
let live = fs.readFileSync('components/AiLiveAssistant.tsx', 'utf8');
live = live.replace('اتصل بوحدة الاستجابة الذكية ERS للحصول على ملخص الحالة وتوجيهات الاستجابة الفورية.', '{t("ai_call_prompt")}');
live = live.replace("{isProcessing ? 'جاري الربط...' : 'بدء المكالمة الآن'}", "{isProcessing ? t('connecting_call') : t('start_call_now')}");
live = live.replace('<span className="text-[10px] font-black text-green-600 uppercase">مكالمة نشطة</span>', '<span className="text-[10px] font-black text-green-600 uppercase">{t("active_call")}</span>');
live = live.replace('<p className="italic text-center">بانتظار ملخص الدعم الفني...</p>', '<p className="italic text-center">{t("waiting_support_summary")}</p>');
live = live.replace('إنهاء المكالمة', '{t("end_call")}');
fs.writeFileSync('components/AiLiveAssistant.tsx', live, 'utf8');
console.log('Patched AiLiveAssistant.tsx');

// 7. Patch PresentationAssets.tsx
let pres = fs.readFileSync('pages/admin/PresentationAssets.tsx', 'utf8');
pres = pres.replace('title: "العقل الاستراتيجي والتقارير",', 'title: t("strategic_brain_reports"),');
pres = pres.replace('description: "دماغ رقمي يولد تقارير وبيانات قانونية معقدة.",', 'description: t("strategic_brain_desc"),');
pres = pres.replace("throw new Error(errData.error || 'فشل توليد الصورة');", "throw new Error(errData.error || t('image_generation_failed'));");
pres = pres.replace('alert("فشل توليد الصورة: " + error.message);', 'alert(t("image_generation_failed") + ": " + error.message);');
pres = pres.replace('قم بتوليد صور احترافية عالية الدقة لشرائح العرض التقديمي', '{t("generate_high_res_slides")}');
pres = pres.replace('جاري الرسم بالذكاء الاصطناعي...', '{t("ai_drawing_in_progress")}');
pres = pres.replace('{generatedImages[slide.id] ? "إعادة توليد (Pro)" : t(\'generate_slide_img\')}', '{generatedImages[slide.id] ? t("regenerate_pro") : t("generate_slide_img")}');
pres = pres.replace('ملاحظة: هذه العملية تتطلب مفتاح API مدفوع (GCP Paid Project). الصور المولدة هنا هي أصول بصرية (Marketing Visuals) لتستخدمها في تصميم شرائحك لتبهر الجمهور بمدى تطور النظام.', '{t("presentation_assets_notice")}');
fs.writeFileSync('pages/admin/PresentationAssets.tsx', pres, 'utf8');
console.log('Patched PresentationAssets.tsx');

// 8. Patch ApiSettings.tsx
let apiSet = fs.readFileSync('pages/admin/ApiSettings.tsx', 'utf8');
apiSet = apiSet.replace('<span>تحديث المفاتيح في قاعدة البيانات</span>', '<span>{t("update_keys_in_db")}</span>');
apiSet = apiSet.replace('<CheckCircle size={18} /> تمت المزامنة بنجاح - النظام يعمل بالوضعية الثنائية الآن.', '<CheckCircle size={18} /> {t("api_sync_success")}');
apiSet = apiSet.replace('<AlertCircle size={18} /> خطأ: فشل الوصول لقاعدة البيانات لتحديث البروتوكول.', '<AlertCircle size={18} /> {t("api_sync_fail")}');
apiSet = apiSet.replace('<ShieldCheck size={12} className="text-green-500"/> تم التحقق: بيئة اتصال مشفرة ومؤمنة', '<ShieldCheck size={12} className="text-green-500"/> {t("secure_connection_verified")}');
fs.writeFileSync('pages/admin/ApiSettings.tsx', apiSet, 'utf8');
console.log('Patched ApiSettings.tsx');

// 9. Patch EmergencyChecklistsManagement.tsx
let chk = fs.readFileSync('pages/admin/EmergencyChecklistsManagement.tsx', 'utf8');
chk = chk.replace("text: 'تم اعتماد الإصدار الجديد للقائمة وتثبيته رسمياً'", "text: t('checklist_version_approved')");
chk = chk.replace("text: e.message || 'فشل الاعتماد'", "text: e.message || t('checklist_approval_failed')");
chk = chk.replace("text: 'تم حذف القائمة بنجاح'", "text: t('checklist_deleted_success')");
chk = chk.replace("text: e.message || 'فشل الحذف'", "text: e.message || t('checklist_delete_failed')");
chk = chk.replace("text: `تم استيراد واعتماد ${created} بروتوكولات سلامة رسمية مطابقة لمعايير الاستجابة الطارئة.`", "text: t('checklists_imported_count', { count: created })");
chk = chk.replace("text: e.message || 'فشل توليد القوائم المعتمدة'", "text: e.message || t('generate_checklists_failed')");
fs.writeFileSync('pages/admin/EmergencyChecklistsManagement.tsx', chk, 'utf8');
console.log('Patched EmergencyChecklistsManagement.tsx');

// 10. Patch Alarm.tsx
let alarm = fs.readFileSync('pages/Alarm.tsx', 'utf8');
alarm = alarm.replace("const raw = (typeName || 'الطوارئ').trim();", "const raw = (typeName || t('emergency')).trim();");
alarm = alarm.replace("return `نداء استجابة ${raw}`;", "return t('response_call_for_type', { type: raw });");
alarm = alarm.replace("return `نداء استجابة حالة ${raw}`;", "return t('response_call_for_type', { type: raw });");
fs.writeFileSync('pages/Alarm.tsx', alarm, 'utf8');
console.log('Patched Alarm.tsx');

// 11. Patch AiReports.tsx
let aiRep = fs.readFileSync('pages/AiReports.tsx', 'utf8');
aiRep = aiRep.replace('{generating ? <Loader2 className="animate-spin" size={16} /> : (report ? "تحديث التقرير" : "توليد التقرير")}', '{generating ? <Loader2 className="animate-spin" size={16} /> : (report ? t("update_report") : t("generate_report"))}');
aiRep = aiRep.replace('<p className="text-xs font-black mt-4 uppercase tracking-widest">حدد معايير الفلترة واضغط توليد</p>', '<p className="text-xs font-black mt-4 uppercase tracking-widest">{t("select_filters_and_generate")}</p>');
fs.writeFileSync('pages/AiReports.tsx', aiRep, 'utf8');
console.log('Patched AiReports.tsx');

// 12. Patch NewEmergency.tsx
let newEmerg = fs.readFileSync('pages/NewEmergency.tsx', 'utf8');
newEmerg = newEmerg.replace("<AlertCircle size={32} className=\"text-primary\" /> بلاغ طوارئ جديد", "<AlertCircle size={32} className=\"text-primary\" /> {t('new_emergency')}");
newEmerg = newEmerg.replace("<label className=\"block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-widest px-2\">نوع الطوارئ</label>", "<label className=\"block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-widest px-2\">{t('emergency_type')}</label>");
newEmerg = newEmerg.replace("<label className=\"block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest px-2\">الموقع المحدد</label>", "<label className=\"block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-widest px-2\">{t('selected_location')}</label>");
fs.writeFileSync('pages/NewEmergency.tsx', newEmerg, 'utf8');
console.log('Patched NewEmergency.tsx');

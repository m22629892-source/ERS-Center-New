import fs from 'fs';

// 1. Read current i18n.ts (which has 706 keys)
const content = fs.readFileSync('i18n.ts', 'utf8');

const extractLangBlock = (src, langCode) => {
  const marker = `${langCode}: {\n    translation: `;
  let startIdx = src.indexOf(marker);
  if (startIdx === -1) return null;

  const objectStart = src.indexOf('{', startIdx + marker.length - 2);
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

const languages = ['ar', 'en', 'ku', 'fr', 'de'];
const data = {};
for (const lang of languages) {
  data[lang] = extractLangBlock(content, lang) || {};
}

// 2. Additional 53 keys
const extraKeys = {
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

for (const [key, transObj] of Object.entries(extraKeys)) {
  for (const lang of languages) {
    if (transObj[lang]) {
      data[lang][key] = transObj[lang];
    }
  }
}

// Ensure total parity
const allKeys = Object.keys(data.ar);
for (const key of allKeys) {
  for (const lang of languages) {
    if (!data[lang][key]) {
      data[lang][key] = data.en[key] || data.ar[key] || key;
    }
  }
}

console.log(`Final key count per language: ${allKeys.length}`);

const code = `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: ${JSON.stringify(data.ar, null, 6)}
  },
  en: {
    translation: ${JSON.stringify(data.en, null, 6)}
  },
  ku: {
    translation: ${JSON.stringify(data.ku, null, 6)}
  },
  fr: {
    translation: ${JSON.stringify(data.fr, null, 6)}
  },
  de: {
    translation: ${JSON.stringify(data.de, null, 6)}
  }
};

const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem('esr_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.language) return parsed.language;
    }
    const savedLng = localStorage.getItem('i18nextLng');
    if (savedLng && resources[savedLng as keyof typeof resources]) {
      return savedLng;
    }
  } catch (e) {}
  return 'ar';
};

const initialLanguage = getInitialLanguage();
const isRTL = initialLanguage === 'ar' || initialLanguage === 'ku';
if (typeof document !== 'undefined') {
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
`;

fs.writeFileSync('i18n.ts', code, 'utf8');
console.log('Successfully wrote pristine i18n.ts!');

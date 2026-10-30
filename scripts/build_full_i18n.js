import fs from 'fs';

const current = JSON.parse(fs.readFileSync('scripts/current_resources.json', 'utf8'));

// The 18 keys missing in FR and DE
const missingInFrDe = {
  initialize_db_desc: {
    fr: "Créer les collections par défaut dans Firebase (à utiliser si Firestore est vide).",
    de: "Standard-Sammlungen in Firebase erstellen (verwenden, wenn Firestore leer ist)."
  },
  generate_scenario: {
    fr: "Générer un nouveau scénario",
    de: "Neues Szenario generieren"
  },
  scenario_details: {
    fr: "Détails du scénario de crise",
    de: "Krisenszenario-Details"
  },
  critical_challenges: {
    fr: "Défis critiques",
    de: "Kritische Herausforderungen"
  },
  success_kpis: {
    fr: "Indicateurs de succès (KPI)",
    de: "Erfolgsindikatoren (KPIs)"
  },
  difficulty_level: {
    fr: "Niveau de difficulté",
    de: "Schwierigkeitsgrad"
  },
  api_key_settings: {
    fr: "Paramètres de clé API",
    de: "API-Schlüsseleinstellungen"
  },
  appearance_and_lang: {
    fr: "Apparence et langue",
    de: "Erscheinungsbild & Sprache"
  },
  mute_global_siren: {
    fr: "Couper la sirène globale",
    de: "Globale Sirene stummschalten"
  },
  siren_mute_desc: {
    fr: "Le son strident de la sirène sera désactivé pour les nouvelles alertes",
    de: "Der schrille Sirenenton wird bei neuen Alarmen deaktiviert"
  },
  system_theme_color: {
    fr: "Couleur du thème système",
    de: "System-Designfarbe"
  },
  time_range: {
    fr: "Plage horaire",
    de: "Zeitbereich"
  },
  all_time: {
    fr: "Tout le temps",
    de: "Gesamter Zeitraum"
  },
  status_reports: {
    fr: "Rapports de statut",
    de: "Statusberichte"
  },
  site_statistics: {
    fr: "Statistiques du site",
    de: "Standortstatistiken"
  },
  users: {
    fr: "Utilisateurs",
    de: "Benutzer"
  },
  user: {
    fr: "Utilisateur",
    de: "Benutzer"
  },
  emergencies: {
    fr: "Urgences",
    de: "Notfälle"
  }
};

for (const [k, v] of Object.entries(missingInFrDe)) {
  if (!current.fr[k]) current.fr[k] = v.fr;
  if (!current.de[k]) current.de[k] = v.de;
}

// New unified keys across all 5 languages
const newKeys = {
  // Voice Notes
  voice_notes_title: {
    ar: "الملاحظات الصوتية الميدانية",
    en: "Field Voice Notes",
    ku: "تێبینییە دەنگییە مەیدانییەکان",
    fr: "Notes vocales de terrain",
    de: "Feld-Sprachnotizen"
  },
  voice_notes_desc: {
    ar: "تسجيل وتوثيق البلاغات الصوتية الفورية لمستجيبي الحادث (بحد أقصى 60 ثانية).",
    en: "Record and document instant encrypted voice memos for incident responders (max 60s).",
    ku: "تۆمارکردن و بەڵگەنامەکردنی دەنگی بۆ وەڵامدەرەوەکان (زۆرترین ٦٠ چرکە).",
    fr: "Enregistrez et documentez les notes vocales instantanées (max 60s).",
    de: "Aufzeichnung verschlüsselter Sprachmemos für Einsatzkräfte (max 60s)."
  },
  voice_notes_count: {
    ar: "{{count}} تسجيلات موثقة",
    en: "{{count}} Documented recordings",
    ku: "{{count}} تۆماری بەڵگەدار",
    fr: "{{count}} enregistrements documentés",
    de: "{{count}} dokumentierte Sprachmemos"
  },
  voice_notes_record_new: {
    ar: "تسجيل ملاحظة صوتية جديدة للحادث",
    en: "Record New Incident Voice Note",
    ku: "تۆمارکردنی تێبینییەکی دەنگی نوێ بۆ ئەم ڕووداوە",
    fr: "Enregistrer une nouvelle note vocale d'incident",
    de: "Neue Einsatz-Sprachnotiz aufnehmen"
  },
  voice_notes_click_to_start: {
    ar: "التسجيل لا يبدأ إلا بعد الضغط الصريح على الزر، بحد أقصى 60 ثانية.",
    en: "Recording only starts upon button click, up to 60 seconds maximum.",
    ku: "تۆمارکردن دەستپێناکات تا کلیک لە دوگمەکە نەکەیت، تا ٦٠ چرکە.",
    fr: "L'enregistrement ne démarre qu'après clic, maximum 60 secondes.",
    de: "Aufnahme startet erst nach Klick, maximal 60 Sekunden."
  },
  voice_notes_start_recording: {
    ar: "بدء التسجيل الصوتي",
    en: "Start Voice Recording",
    ku: "دەستپێکردنی تۆماری دەنگی",
    fr: "Démarrer l'enregistrement",
    de: "Sprachaufnahme starten"
  },
  voice_notes_recording_in_progress: {
    ar: "جاري التسجيل:",
    en: "Recording:",
    ku: "تۆماردەکرێت:",
    fr: "Enregistrement en cours :",
    de: "Aufnahme läuft:"
  },
  voice_notes_speak_clearly: {
    ar: "تحدث بوضوح قرب الميكروفون",
    en: "Speak clearly near the microphone",
    ku: "بەڕوونی لە نزیک مایکرۆفۆنەکە قسە بکە",
    fr: "Parlez clairement près du micro",
    de: "Sprechen Sie deutlich ins Mikrofon"
  },
  voice_notes_stop_and_save: {
    ar: "إيقاف وحفظ المقطع",
    en: "Stop & Save Clip",
    ku: "ڕاگرتن و پاشەکەوتکردن",
    fr: "Arrêter et sauvegarder",
    de: "Stoppen & Speichern"
  },
  voice_notes_preview_title: {
    ar: "معاينة التسجيل الصوتي قبل الرفع",
    en: "Preview Voice Recording Before Upload",
    ku: "پێشبینینی تۆمار پێش بارکردن",
    fr: "Aperçu de la note vocale avant téléversement",
    de: "Sprachaufnahme vor dem Hochladen überprüfen"
  },
  voice_notes_duration_size: {
    ar: "المدة: {{duration}} ثانية • الحجم: {{size}} كيلوبايت",
    en: "Duration: {{duration}}s • Size: {{size}} KB",
    ku: "ماوە: {{duration}} چرکە • قەبارە: {{size}} کیلۆبایت",
    fr: "Durée : {{duration}}s • Taille : {{size}} Ko",
    de: "Dauer: {{duration}}s • Größe: {{size}} KB"
  },
  voice_notes_cancel_and_delete: {
    ar: "إلغاء وحذف المقطع",
    en: "Cancel & Delete Clip",
    ku: "پاشگەزبوونەوە و سڕینەوە",
    fr: "Annuler et supprimer",
    de: "Verwerfen und löschen"
  },
  voice_notes_confirm_upload: {
    ar: "تأكيد الإرسال والرفع",
    en: "Confirm & Upload",
    ku: "پشتڕاستکردنەوە و ناردن",
    fr: "Confirmer et téléverser",
    de: "Bestätigen und hochladen"
  },
  voice_notes_uploading: {
    ar: "جاري الرفع",
    en: "Uploading",
    ku: "باردەکرێت",
    fr: "Téléversement en cours",
    de: "Wird hochgeladen"
  },
  voice_notes_description_label: {
    ar: "وصف نصي أو ملخص سريع للتسجيل (اختياري)",
    en: "Text description or quick summary (optional)",
    ku: "وەسفی دەقی یان پوختەی خێرا (ئارەزوومەندانە)",
    fr: "Description textuelle ou résumé rapide (facultatif)",
    de: "Textbeschreibung oder kurze Zusammenfassung (optional)"
  },
  voice_notes_desc_placeholder: {
    ar: "مثال: نداء إخلاء الطابق الثاني، أو توجيهات المسعفين...",
    en: "e.g. 2nd floor evacuation call or paramedic instructions...",
    ku: "نموونە: داوای چۆڵکردنی نهۆمی دووەم، یان ڕێنمایی فریاگوزاری...",
    fr: "ex: appel d'évacuation 2e étage, directives secours...",
    de: "z.B. Evakuierung 2. OG, Sanitäter-Anweisungen..."
  },
  voice_notes_list_title: {
    ar: "التسجيلات الصوتية المسجلة للحادث",
    en: "Incident Recorded Voice Notes",
    ku: "تۆمارە دەنگییەکانی ئەم ڕووداوە",
    fr: "Notes vocales enregistrées pour l'incident",
    de: "Für diesen Einsatz aufgezeichnete Sprachmemos"
  },
  voice_notes_loading: {
    ar: "جاري تحميل التسجيلات الصوتية...",
    en: "Loading voice notes...",
    ku: "بارکردنی تۆمارە دەنگییەکان...",
    fr: "Chargement des enregistrements vocaux...",
    de: "Sprachmemos werden geladen..."
  },
  voice_notes_empty: {
    ar: "لم يتم تسجيل ملاحظات صوتية لهذا الحادث بعد.",
    en: "No voice notes recorded for this incident yet.",
    ku: "هیچ تۆمارێکی دەنگی بۆ ئەم ڕووداوە تۆمار نەکراوە.",
    fr: "Aucune note vocale enregistrée pour le moment.",
    de: "Bislang keine Sprachmemos für diesen Fall aufgezeichnet."
  },
  voice_notes_seconds: {
    ar: "ثانية",
    en: "sec",
    ku: "چرکە",
    fr: "sec",
    de: "Sek"
  },
  voice_notes_delete_btn: {
    ar: "حذف التسجيل",
    en: "Delete Recording",
    ku: "سڕینەوەی تۆمار",
    fr: "Supprimer l'enregistrement",
    de: "Aufzeichnung löschen"
  },
  voice_notes_delete_title: {
    ar: "حذف الملاحظة الصوتية",
    en: "Delete Voice Note",
    ku: "سڕینەوەی تێبینی دەنگی",
    fr: "Supprimer la note vocale",
    de: "Sprachnotiz löschen"
  },
  voice_notes_delete_msg: {
    ar: "هل أنت متأكد من رغبتك في حذف هذا التسجيل الصوتي نهائياً من سجل الحادث؟",
    en: "Are you sure you want to permanently delete this voice recording from the incident record?",
    ku: "ئایا دڵنیایت لە سڕینەوەی یەکجارەکی ئەم تۆمارە دەنگییە لە تۆماری ڕووداوەکە؟",
    fr: "Voulez-vous vraiment supprimer définitivement cet enregistrement vocal de l'incident ?",
    de: "Möchten Sie diese Sprachaufzeichnung wirklich dauerhaft aus dem Einsatzprotokoll löschen?"
  },
  voice_notes_mic_required: {
    ar: "إذن الميكروفون مطلوب لتسجيل الملاحظات الصوتية.",
    en: "Microphone permission is required to record voice notes.",
    ku: "مۆڵەتی مایکرۆفۆن پێویستە بۆ تۆمارکردنی دەنگ.",
    fr: "L'autorisation du microphone est requise pour enregistrer.",
    de: "Mikrofonberechtigung für Sprachaufnahme erforderlich."
  },
  voice_notes_start_failed: {
    ar: "فشل بدء التسجيل",
    en: "Failed to start recording",
    ku: "دەستپێکردنی تۆمارکردن سەرکەوتوو نەبوو",
    fr: "Échec du démarrage de l'enregistrement",
    de: "Fehler beim Starten der Aufnahme"
  },
  voice_notes_stop_failed: {
    ar: "فشل إيقاف التسجيل الصوتي",
    en: "Failed to stop recording",
    ku: "ڕاگرتنی تۆمارکردن سەرکەوتوو نەبوو",
    fr: "Échec de l'arrêt de l'enregistrement",
    de: "Fehler beim Stoppen der Aufnahme"
  },
  voice_notes_upload_success: {
    ar: "تم رفع الملاحظة الصوتية وتوثيقها في سجل الحادث بنجاح.",
    en: "Voice note successfully uploaded and documented in incident log.",
    ku: "تێبینییە دەنگییەکە بە سەرکەوتوویی بارکرا و لە تۆماری ڕووداوەکەدا جێگیرکرا.",
    fr: "Note vocale téléversée et enregistrée avec succès.",
    de: "Sprachmemo erfolgreich hochgeladen und protokolliert."
  },
  voice_notes_upload_failed: {
    ar: "فشل رفع التسجيل.",
    en: "Failed to upload recording.",
    ku: "بارکردنی تۆمارەکە سەرکەوتوو نەبوو.",
    fr: "Échec du téléversement de l'enregistrement.",
    de: "Fehler beim Hochladen der Aufnahme."
  },
  voice_notes_delete_success: {
    ar: "تم حذف الملاحظة الصوتية بنجاح.",
    en: "Voice note successfully deleted.",
    ku: "تێبینییە دەنگییەکە بە سەرکەوتوویی سڕایەوە.",
    fr: "Note vocale supprimée avec succès.",
    de: "Sprachmemo erfolgreich gelöscht."
  },
  voice_notes_delete_failed: {
    ar: "فشل حذف الملاحظة الصوتية",
    en: "Failed to delete voice note",
    ku: "سڕینەوەی تێبینییە دەنگییەکە سەرکەوتوو نەبوو",
    fr: "Échec de la suppression de la note vocale",
    de: "Fehler beim Löschen der Sprachnotiz"
  },
  voice_notes_offline_warning: {
    ar: "يوجد {{count}} تسجيل صوتي محفوظ محلياً بأمان لم يتم رفعه بعد بسبب انقطاع الشبكة.",
    en: "There is {{count}} voice note safely saved offline, pending upload upon connection.",
    ku: "ژمارەی {{count}} تۆماری دەنگی بە سەلامەتی بە ئۆفلاین پاشەکەوت کراوە بەهۆی بڕانی هێڵ.",
    fr: "Il y a {{count}} note vocale stockée hors ligne en attente de connexion.",
    de: "Es gibt {{count}} offline gespeicherte Sprachnotizen, die auf Netzverbindung warten."
  },
  voice_notes_retry_now: {
    ar: "إعادة المحاولة الآن",
    en: "Retry Now",
    ku: "دووبارە هەوڵدانەوە ئێستا",
    fr: "Réessayer maintenant",
    de: "Jetzt erneut versuchen"
  },

  // Checklists Management & Operational Details
  officially_approved: {
    ar: "معتمدة رسمياً",
    en: "Officially Approved",
    ku: "بە فەرمی پەسەندکراو",
    fr: "Officiellement approuvé",
    de: "Offiziell genehmigt"
  },
  draft_in_review: {
    ar: "مسودة قيد المراجعة",
    en: "Draft in Review",
    ku: "ڕەشنووس لە پێداچوونەوەدایە",
    fr: "Brouillon en révision",
    de: "Entwurf in Prüfung"
  },
  archived_status: {
    ar: "مؤرشفة",
    en: "Archived",
    ku: "ئەرشیڤکراو",
    fr: "Archivé",
    de: "Archiviert"
  },
  supervisor_approval: {
    ar: "اعتماد المشرف:",
    en: "Supervisor Approval:",
    ku: "پەسەندکردنی سەرپەرشتیار:",
    fr: "Approbation superviseur :",
    de: "Vorgesetzten-Genehmigung:"
  },
  tactical_steps_list: {
    ar: "قائمة الخطوات التكتيكية",
    en: "Tactical Steps List",
    ku: "لیستی هەنگاوە تێکتیکییەکان",
    fr: "Liste des étapes tactiques",
    de: "Taktische Schrittliste"
  },
  estimated_duration: {
    ar: "الزمن التقديري",
    en: "Estimated Duration",
    ku: "کاتی خەمڵێنراو",
    fr: "Durée estimée",
    de: "Geschätzte Dauer"
  },
  mandatory: {
    ar: "إلزامي",
    en: "Mandatory",
    ku: "پێویست و ئیجباری",
    fr: "Obligatoire",
    de: "Verpflichtend"
  },
  supervisor_approval_required: {
    ar: "موافقة مشرف",
    en: "Supervisor Approval Required",
    ku: "ڕەزامەندی سەرپەرشتیار پێویستە",
    fr: "Accord superviseur requis",
    de: "Vorgesetzten-Freigabe erforderlich"
  },
  justified_override: {
    ar: "تجاوز مبرر",
    en: "Justified Override",
    ku: "تێپەڕاندنی پاساودار",
    fr: "Dérogation justifiée",
    de: "Begründete Auslassung"
  },
  official_approval: {
    ar: "اعتماد رسمي",
    en: "Official Approval",
    ku: "پەسەندکردنی فەرمی",
    fr: "Approbation officielle",
    de: "Offizielle Freigabe"
  },
  upgrade_and_approve: {
    ar: "ترقية واعتماد",
    en: "Upgrade & Approve",
    ku: "بەرزکردنەوە و پەسەندکردن",
    fr: "Mettre à niveau & approuver",
    de: "Hochstufen & Freigeben"
  },
  no_tasks_entered: {
    ar: "لا توجد مهام مدخلة بعد.",
    en: "No tasks entered yet.",
    ku: "هێشتا هیچ ئەرکێک تۆمار نەکراوە.",
    fr: "Aucune tâche saisie pour l'instant.",
    de: "Bislang keine Aufgaben hinterlegt."
  },
  general_emergency: {
    ar: "طوارئ عامة",
    en: "General Emergency",
    ku: "باری لەناوی گشتی",
    fr: "Urgence générale",
    de: "Allgemeiner Notfall"
  },
  create_new_checklist_title: {
    ar: "إنشاء قائمة مهام طوارئ جديدة",
    en: "Create New Emergency Checklist",
    ku: "دروستکردنی لیستی ئەرکی لەناکاوی نوێ",
    fr: "Créer une nouvelle liste de contrôle d'urgence",
    de: "Neue Notfall-Checkliste erstellen"
  },
  edit_checklist_title: {
    ar: "تعديل قائمة مهام: {{title}}",
    en: "Edit Checklist: {{title}}",
    ku: "دەستکاریکردنی لیستی ئەرک: {{title}}",
    fr: "Modifier la liste de contrôle : {{title}}",
    de: "Checkliste bearbeiten: {{title}}"
  },
  linked_emergency_type: {
    ar: "نوع الطوارئ المرتبط *",
    en: "Linked Emergency Type *",
    ku: "جۆری باری لەناوی پەیوەندیدار *",
    fr: "Type d'urgence associé *",
    de: "Verknüpfter Notfalltyp *"
  },
  regulatory_status: {
    ar: "الحالة التنظيمية",
    en: "Regulatory Status",
    ku: "باری یاسایی و ڕێکخستن",
    fr: "Statut réglementaire",
    de: "Regulatorischer Status"
  },
  checklist_title_ar: {
    ar: "عنوان القائمة بالعربية *",
    en: "Checklist Title (Arabic) *",
    ku: "ناونیشانی لیست بە عەرەبی *",
    fr: "Titre de la liste (arabe) *",
    de: "Checklisten-Titel (Arabisch) *"
  },
  checklist_title_en: {
    ar: "العنوان بالإنجليزية (Title En)",
    en: "Title in English (Title En)",
    ku: "ناونیشان بە ئینگلیزی (Title En)",
    fr: "Titre en anglais (Title En)",
    de: "Titel auf Englisch (Title En)"
  },
  title_ar_placeholder: {
    ar: "مثال: خطة وإجراءات إخلاء حالات الحريق",
    en: "e.g. Fire Evacuation & Response Protocol",
    ku: "نموونە: پلانی چۆڵکردن لە کاتی ئاگرکەوتنەوە",
    fr: "ex: Protocole d'évacuation incendie",
    de: "z.B. Brandschutz- & Evakuierungsplan"
  },
  version_label: {
    ar: "رقم الإصدار (Version)",
    en: "Version Number",
    ku: "ژمارەی وەشان",
    fr: "Numéro de version",
    de: "Versionsnummer"
  },
  description_label: {
    ar: "الوصف والهدف التشغيلي للمهام",
    en: "Description & Operational Objective",
    ku: "وەسف و ئامانجی ئۆپەراسیۆنی ئەرکەکان",
    fr: "Description et objectif opérationnel",
    de: "Beschreibung & operatives Einsatzziel"
  },
  tasks_management_header: {
    ar: "إدارة الخطوات والمهام التكتيكية",
    en: "Tactical Steps & Tasks Management",
    ku: "بەڕێوەبردنی هەنگاوە تێکتیکییەکان و ئەرکەکان",
    fr: "Gestion des étapes et tâches tactiques",
    de: "Verwaltung taktischer Einsatzschritte"
  },
  add_task_step: {
    ar: "إضافة خطوة جديدة",
    en: "Add New Step",
    ku: "زیادکردنی هەنگاوی نوێ",
    fr: "Ajouter une nouvelle étape",
    de: "Neuen Schritt hinzufügen"
  },
  task_number: {
    ar: "خطوة رقم",
    en: "Step No.",
    ku: "هەنگاوی ژمارە",
    fr: "Étape n°",
    de: "Schritt Nr."
  },
  task_title_ar: {
    ar: "عنوان الخطوة بالعربية *",
    en: "Step Title (Arabic) *",
    ku: "ناونیشانی هەنگاو بە عەرەبی *",
    fr: "Titre de l'étape (arabe) *",
    de: "Schritt-Titel (Arabisch) *"
  },
  task_title_en: {
    ar: "عنوان الخطوة بالإنجليزية (En)",
    en: "Step Title in English (En)",
    ku: "ناونیشانی هەنگاو بە ئینگلیزی (En)",
    fr: "Titre de l'étape en anglais (En)",
    de: "Schritt-Titel auf Englisch (En)"
  },
  step_details_placeholder: {
    ar: "وصف تفصيلي للخطوة التكتيكية...",
    en: "Detailed description of the tactical step...",
    ku: "وەسفی وردی هەنگاوە تێکتیکییەکە...",
    fr: "Description détaillée de l'étape tactique...",
    de: "Detaillierte Beschreibung des Einsatzschritts..."
  },
  responsible_role: {
    ar: "الدور المسؤول عن التنفيذ",
    en: "Responsible Role",
    ku: "ڕۆڵی بەرپرسیار لە جێبەجێکردن",
    fr: "Rôle responsable",
    de: "Zuständige Einsatzrolle"
  },
  target_duration_minutes: {
    ar: "الزمن المستهدف (بالدقائق)",
    en: "Target Duration (minutes)",
    ku: "کاتی دیاریکراو (بە خولەک)",
    fr: "Durée cible (minutes)",
    de: "Zielzeit (Minuten)"
  },
  mandatory_task_option: {
    ar: "مهمة إلزامية لا يمكن إنهاء البلاغ بدونها",
    en: "Mandatory task; case cannot close without it",
    ku: "ئەرکێکی ئیجبارییە و ناکرێت کەیس دابخرێت بێ ئەوە",
    fr: "Tâche obligatoire, incident impossible à clore sans elle",
    de: "Pflichtaufgabe; Einsatz kann ohne sie nicht abgeschlossen werden"
  },
  requires_supervisor_approval_option: {
    ar: "تتطلب اعتماد وتوقيع إلكتروني من المشرف",
    en: "Requires electronic sign-off from supervisor",
    ku: "پێویستی بە پەسەندکردنی ئەلیکترۆنیی سەرپەرشتیار هەیە",
    fr: "Nécessite la validation électronique d'un superviseur",
    de: "Erfordert elektronische Abzeichnung durch Einsatzleiter"
  },
  can_be_skipped_option: {
    ar: "يمكن تجاوزها في الميدان مع ذكر مبرر موثق",
    en: "Can be skipped in the field with logged justification",
    ku: "دەکرێت تێپەڕێنرێت بە هۆکارێکی بەڵگەدار",
    fr: "Peut être ignorée sur le terrain avec justification consignée",
    de: "Kann im Feld mit dokumentierter Begründung übersprungen werden"
  },
  save_changes: {
    ar: "حفظ التغييرات",
    en: "Save Changes",
    ku: "پاشەکەوتکردنی گۆڕانکارییەکان",
    fr: "Enregistrer les modifications",
    de: "Änderungen speichern"
  },
  save_and_approve_official: {
    ar: "حفظ واعتماد رسمي",
    en: "Save & Approve Officially",
    ku: "پاشەکەوتکردن و پەسەندکردنی فەرمی",
    fr: "Enregistrer et approuver officiellement",
    de: "Speichern & offiziell freigeben"
  },
  delete_checklist_title: {
    ar: "حذف قائمة المهام",
    en: "Delete Checklist",
    ku: "سڕینەوەی لیستی ئەرکەکان",
    fr: "Supprimer la liste de contrôle",
    de: "Checkliste löschen"
  },
  delete_checklist_msg: {
    ar: "هل أنت متأكد من حذف قائمة المهام هذه نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
    en: "Are you sure you want to delete this checklist permanently? This action cannot be undone.",
    ku: "ئایا دڵنیایت لە سڕینەوەی یەکجارەکی ئەم لیستە؟ ئەم کردارە ناگەڕێندرێتەوە.",
    fr: "Voulez-vous vraiment supprimer cette liste ? Cette action est irréversible.",
    de: "Möchten Sie diese Checkliste wirklich dauerhaft löschen? Dies kann nicht rückgängig gemacht werden."
  },
  minutes: {
    ar: "دقيقة",
    en: "min",
    ku: "خولەک",
    fr: "min",
    de: "Min"
  },

  // Incident Tasks Section (Live Execution)
  approved_safety_checklist: {
    ar: "قائمة مهام السلامة المعتمدة",
    en: "Approved Safety Checklist",
    ku: "لیستی ئەرکەکانی سەلامەتی پەسەندکراو",
    fr: "Liste de contrôle de sécurité approuvée",
    de: "Genehmigte Sicherheits-Checkliste"
  },
  completed_tasks_count: {
    ar: "{{completed}} من {{total}} مكتملة",
    en: "{{completed}} of {{total}} completed",
    ku: "{{completed}} لە {{total}} تەواوکراوە",
    fr: "{{completed}} sur {{total}} terminées",
    de: "{{completed}} von {{total}} abgeschlossen"
  },
  incident_readiness_progress: {
    ar: "نسبة إنجاز مهام الحادث",
    en: "Incident Tasks Progress",
    ku: "ڕێژەی ئەنجامدانی ئەرکەکانی ڕووداو",
    fr: "Progression des tâches d'incident",
    de: "Fortschritt der Einsatzaufgaben"
  },
  assignee: {
    ar: "المكلف:",
    en: "Assignee:",
    ku: "سپێردراو بە:",
    fr: "Assigné à :",
    de: "Zugewiesen an:"
  },
  unassigned_staff: {
    ar: "غير مكلف بموظف محدد",
    en: "Unassigned",
    ku: "نەسپێردراوە بە کارمەندێکی دیاریکراو",
    fr: "Non assigné",
    de: "Nicht zugewiesen"
  },
  completed_by: {
    ar: "تم الإنجاز بواسطة:",
    en: "Completed by:",
    ku: "جێبەجێکراوە لەلایەن:",
    fr: "Complété par :",
    de: "Abgeschlossen durch:"
  },
  target_duration: {
    ar: "الهدف:",
    en: "Target:",
    ku: "ئامانج:",
    fr: "Objectif :",
    de: "Zielzeit:"
  },
  approved_by_supervisor: {
    ar: "معتمد من المشرف:",
    en: "Approved by Supervisor:",
    ku: "پەسەندکراوە لەلایەن سەرپەرشتیار:",
    fr: "Approuvé par le superviseur :",
    de: "Vom Vorgesetzten freigegeben:"
  },
  awaiting_supervisor_approval: {
    ar: "بانتظار اعتماد المشرف",
    en: "Awaiting Supervisor Approval",
    ku: "چاوەڕوانی پەسەندکردنی سەرپەرشتیارە",
    fr: "En attente d'approbation",
    de: "Wartet auf Vorgesetzten-Freigabe"
  },
  field_execution_notes: {
    ar: "ملاحظات التنفيذ الميداني:",
    en: "Field Execution Notes:",
    ku: "تێبینییەکانی جێبەجێکردنی مەیدانی:",
    fr: "Notes d'exécution sur le terrain :",
    de: "Feld-Ausführungshinweise:"
  },
  justified_override_reason: {
    ar: "مبرر التجاوز الموثق:",
    en: "Documented Override Justification:",
    ku: "پاساوی بەڵگەداری تێپەڕاندن:",
    fr: "Justification de dérogation :",
    de: "Begründung für Auslassung:"
  },
  field_obstruction_reason: {
    ar: "سبب التعذر الميداني:",
    en: "Field Obstruction Reason:",
    ku: "هۆکاری ناتوانایی مەیدانی:",
    fr: "Raison du blocage sur le terrain :",
    de: "Ursache für Feld-Blockierung:"
  },
  change_assignee: {
    ar: "تغيير المكلف",
    en: "Change Assignee",
    ku: "گۆڕینی کەسی سپێردراو",
    fr: "Changer d'assigné",
    de: "Zuweisung ändern"
  },
  assign_staff: {
    ar: "تكليف موظف",
    en: "Assign Staff",
    ku: "سپاردنی ئەرک بە کارمەند",
    fr: "Assigner personnel",
    de: "Personal zuweisen"
  },
  approve_as_supervisor: {
    ar: "اعتماد كمشرف",
    en: "Approve as Supervisor",
    ku: "پەسەندکردن وەک سەرپەرشتیار",
    fr: "Valider (Superviseur)",
    de: "Als Vorgesetzter freigeben"
  },
  start_execution: {
    ar: "بدء التنفيذ",
    en: "Start Execution",
    ku: "دەستپێکردنی جێبەجێکردن",
    fr: "Démarrer l'exécution",
    de: "Ausführung starten"
  },
  complete_task: {
    ar: "إنجاز المهمة",
    en: "Complete Task",
    ku: "تەواوکردنی ئەرک",
    fr: "Terminer la tâche",
    de: "Aufgabe abschließen"
  },
  inability_to_execute: {
    ar: "تعذر التنفيذ",
    en: "Unable to Execute",
    ku: "ناتوانرێت جێبەجێ بکرێت",
    fr: "Impossible d'exécuter",
    de: "Nicht ausführbar"
  },
  task_action_title: {
    ar: "توثيق إجراء المهمة: {{title}}",
    en: "Document Task Action: {{title}}",
    ku: "بەڵگەنامەکردنی کرداری ئەرک: {{title}}",
    fr: "Consigner l'action de la tâche : {{title}}",
    de: "Aufgabenmaßnahme dokumentieren: {{title}}"
  },
  task_action_notes_label: {
    ar: "ملاحظات وتوثيق الميدان (اختياري)",
    en: "Field Notes & Documentation (Optional)",
    ku: "تێبینییە مەیدانییەکان و بەڵگەنامەکردن (ئارەزوومەندانە)",
    fr: "Notes de terrain et documentation (facultatif)",
    de: "Feldnotizen & Dokumentation (optional)"
  },
  task_action_notes_placeholder: {
    ar: "أدخل تفاصيل ما تم تنفيذه على أرض الواقع...",
    en: "Enter details of what was implemented in the field...",
    ku: "وردەکاری ئەو کارەی کە ئەنجامدرا بنووسە...",
    fr: "Détaillez ce qui a été exécuté sur le terrain...",
    de: "Details der tatsächlichen Durchführung eingeben..."
  },
  override_reason_label: {
    ar: "سبب ومبرر تجاوز المهمة الميدانية *",
    en: "Reason for Skipping Task *",
    ku: "هۆکاری تێپەڕاندنی ئەرکەکە *",
    fr: "Raison de la dérogation de la tâche *",
    de: "Begründung für das Auslassen der Aufgabe *"
  },
  override_reason_placeholder: {
    ar: "اذكر مبرر عدم تنفيذ هذه الخطوة لتوثيقه في السجل...",
    en: "State the justification for not executing this step...",
    ku: "هۆکاری جێبەجێنەکردنی ئەم هەنگاوە بنووسە بۆ تۆمارکردن...",
    fr: "Indiquez la raison pour laquelle cette étape n'a pas été réalisée...",
    de: "Begründung für die Nicht-Ausführung angeben..."
  },
  obstruction_reason_label: {
    ar: "سبب التعذر والعائق الميداني *",
    en: "Field Obstruction Reason *",
    ku: "هۆکاری ڕێگری و لەربەستە مەیدانییەکە *",
    fr: "Raison du blocage de terrain *",
    de: "Ursache der Blockierung im Einsatz *"
  },
  obstruction_reason_placeholder: {
    ar: "اذكر العائق أو الظرف الذي منع التنفيذ...",
    en: "State the obstacle that prevented execution...",
    ku: "ئەو لەربەستەی کە ڕێگری کرد لە جێبەجێکردن بنووسە...",
    fr: "Indiquez l'obstacle ayant empêché l'exécution...",
    de: "Hindernis beschreiben, das die Durchführung verhinderte..."
  },
  confirm_action: {
    ar: "تأكيد الإجراء",
    en: "Confirm Action",
    ku: "پشتڕاستکردنەوەی کردارەکە",
    fr: "Confirmer l'action",
    de: "Maßnahme bestätigen"
  },
  assign_task_title: {
    ar: "تكليف موظف بمهمة: {{title}}",
    en: "Assign Task to Staff: {{title}}",
    ku: "سپاردنی ئەرک بە کارمەند: {{title}}",
    fr: "Assigner la tâche : {{title}}",
    de: "Aufgabe Personal zuweisen: {{title}}"
  },
  select_field_responder: {
    ar: "اختر المستجيب الميداني",
    en: "Select Field Responder",
    ku: "وەڵامدەرەوەی مەیدانی هەڵبژێرە",
    fr: "Sélectionnez l'intervenant de terrain",
    de: "Einsatzkraft auswählen"
  },
  busy_override_warning: {
    ar: "تنبيه: هذا الموظف مسجل كـ 'مشغول' أو 'في استجابة أخرى'. هل تود تأكيد التكليف رغم ذلك؟",
    en: "Warning: Staff is marked Busy or Responding elsewhere. Override anyway?",
    ku: "ئاگاداری: ئەم کارمەندە وەک سەرقاڵ تۆمارکراوە. دەتەوێت سەرەڕای ئەمە سپاردنی پێبکەیت؟",
    fr: "Attention : Cet agent est marqué occupé. Confirmer l'assignation quand même ?",
    de: "Achtung: Personal ist als beschäftigt markiert. Dennoch zuweisen?"
  },
  accept_override_checkbox: {
    ar: "نعم، أقر بتجاوز حالة الانشغال وتكليفه بالمهمة",
    en: "Yes, I acknowledge busy state and assign task anyway",
    ku: "بەڵێ، ڕازی دەبم بە تێپەڕاندنی دۆخی سەرقاڵی و سپاردنی ئەرکەکە",
    fr: "Oui, je valide l'assignation malgré l'occupation",
    de: "Ja, ich bestätige die Zuweisung trotz Beschäftigungsstatus"
  },
  confirm_assignment: {
    ar: "تأكيد التكليف",
    en: "Confirm Assignment",
    ku: "پشتڕاستکردنەوەی سپاردن",
    fr: "Confirmer l'assignation",
    de: "Zuweisung bestätigen"
  },
  cannot_edit_other_task: {
    ar: "لا يمكنك تعديل مهمة مكلف بها موظف آخر دون صلاحية إشرافية.",
    en: "You cannot edit another user's task without supervisor privileges.",
    ku: "ناتوانیت ئەرکی کارمەندێکی تر دەستکاری بکەیت بێ دەسەڵاتی سەرپەرشتیاری.",
    fr: "Vous ne pouvez pas modifier la tâche d'un autre sans rôle superviseur.",
    de: "Sie können die Aufgabe eines anderen ohne Vorgesetztenrechte nicht bearbeiten."
  },
  must_provide_skip_reason: {
    ar: "يرجى ذكر سبب التجاوز بشكل موثق.",
    en: "Please provide a documented justification for skipping.",
    ku: "تکایە هۆکاری بەڵگەداری تێپەڕاندن بنووسە.",
    fr: "Veuillez fournir une justification documentée.",
    de: "Bitte dokumentieren Sie die Begründung für die Auslassung."
  },
  must_provide_blocked_reason: {
    ar: "يرجى ذكر سبب التعذر أو العائق الميداني.",
    en: "Please state the field obstruction reason.",
    ku: "تکایە هۆکاری لەربەستە مەیدانییەکە بنووسە.",
    fr: "Veuillez indiquer la cause du blocage sur le terrain.",
    de: "Bitte Ursache für die Feld-Blockierung angeben."
  },
  task_status_update_failed: {
    ar: "فشل تحديث حالة المهمة",
    en: "Failed to update task status",
    ku: "نوێکردنەوەی دۆخی ئەرکەکە سەرکەوتوو نەبوو",
    fr: "Échec de la mise à jour du statut",
    de: "Aufgabenstatus konnte nicht aktualisiert werden"
  },
  assignment_failed: {
    ar: "فشل التكليف",
    en: "Assignment failed",
    ku: "سپاردنەکە سەرکەوتوو نەبوو",
    fr: "Échec de l'assignation",
    de: "Zuweisung fehlgeschlagen"
  },

  // Staff Readiness Management
  network_connectivity_status: {
    ar: "حالة الاتصال بالشبكة:",
    en: "Network Connectivity Status:",
    ku: "باری پەیوەندی بە تۆڕ:",
    fr: "Statut de connexion réseau :",
    de: "Netzwerk-Verbindungsstatus:"
  },
  connected_live: {
    ar: "متصل لحظياً",
    en: "Live Connected",
    ku: "پەیوەستکراو ڕاستەوخۆ",
    fr: "Connecté en direct",
    de: "Live verbunden"
  },
  offline_since_minutes: {
    ar: "غير متصل ({{count}} دقيقة)",
    en: "Offline ({{count}}m)",
    ku: "پەیوەست نییە ({{count}} خولەک)",
    fr: "Hors ligne ({{count}} min)",
    de: "Offline ({{count}} Min)"
  },
  linked_incident: {
    ar: "الحادث المرتبط:",
    en: "Linked Incident:",
    ku: "ڕووداوی پەیوەندیدار:",
    fr: "Incident associé :",
    de: "Verknüpfter Einsatz:"
  },
  active_alerts_count: {
    ar: "{{count}} بلاغ نشط",
    en: "{{count}} active alert(s)",
    ku: "{{count}} ئاگاداری چالاک",
    fr: "{{count}} alerte(s) active(s)",
    de: "{{count}} aktive Einsätze"
  },
  status_reason: {
    ar: "سبب الحالة:",
    en: "Status Reason:",
    ku: "هۆکاری دۆخەکە:",
    fr: "Raison du statut :",
    de: "Grund für Status:"
  },
  last_updated_by: {
    ar: "آخر تعديل بواسطة:",
    en: "Last Updated By:",
    ku: "دوایین نوێکردنەوە لەلایەن:",
    fr: "Dernière modif par :",
    de: "Zuletzt geändert durch:"
  },
  manual_readiness_change: {
    ar: "تغيير الجاهزية يدوياً",
    en: "Change Readiness Manually",
    ku: "گۆڕینی دەستیی ئامادەیی",
    fr: "Changer disponibilité manuellement",
    de: "Bereitschaft manuell ändern"
  },
  responder_member: {
    ar: "عضو استجابة",
    en: "Response Member",
    ku: "ئەندامی وەڵامدانەوە",
    fr: "Membre d'intervention",
    de: "Einsatzkraft"
  },
  general_dept: {
    ar: "عام",
    en: "General",
    ku: "گشتی",
    fr: "Général",
    de: "Allgemein"
  },
  edit_staff_readiness_title: {
    ar: "تعديل جاهزية: {{name}}",
    en: "Edit Readiness: {{name}}",
    ku: "دەستکاریکردنی ئامادەیی: {{name}}",
    fr: "Modifier disponibilité : {{name}}",
    de: "Bereitschaft bearbeiten: {{name}}"
  },
  audit_trail_note: {
    ar: "اختر الحالة الجديدة واذكر السبب لتوثيق الإجراء في السجل الأمني المعتمد (Audit Trail):",
    en: "Select new status and state reason for audit logging:",
    ku: "دۆخی نوێ دیاریبکە و هۆکارەکەی بنووسە بۆ تۆماری پشکنینی ئاسایش:",
    fr: "Sélectionnez le nouveau statut et indiquez la raison pour le journal d'audit :",
    de: "Wählen Sie den neuen Status und begründen Sie die Änderung für das Audit-Protokoll:"
  },
  availability_status_label: {
    ar: "حالة التفرغ والاستعداد *",
    en: "Availability & Readiness Status *",
    ku: "باری بەردەستبوون و ئامادەیی *",
    fr: "Statut de disponibilité *",
    de: "Verfügbarkeits- & Bereitschaftsstatus *"
  },
  change_reason_label: {
    ar: "سبب تغيير الحالة (توثيق أمني إلزامي للإشراف)",
    en: "Reason for Change (Mandatory Audit Documentation)",
    ku: "هۆکاری گۆڕینی دۆخەکە (بەڵگەی ئاسایشی پێویست)",
    fr: "Raison du changement (document d'audit obligatoire)",
    de: "Grund für Statusänderung (Pflichtangabe für Audit)"
  },
  change_reason_placeholder: {
    ar: "مثال: مكلف بمهمة خارجية، أو إجازة طارئة، أو انتهاء المناوبة...",
    en: "e.g. Assigned to external task, emergency leave, or shift ended...",
    ku: "نموونە: ئەرکی دەرەکی، مۆڵەتی کتوپڕ، یان کۆتایی دەوام...",
    fr: "ex: Mission externe, congé d'urgence ou fin de service...",
    de: "z.B. Außenauftrag, Notfallurlaub oder Schichtende..."
  },
  save_and_update_status: {
    ar: "حفظ وتحديث الحالة",
    en: "Save & Update Status",
    ku: "پاشەکەوتکردن و نوێکردنەوەی دۆخەکە",
    fr: "Enregistrer et mettre à jour le statut",
    de: "Status speichern & aktualisieren"
  },
  status_update_success: {
    ar: "تم تحديث حالة جاهزية {{name}} بنجاح إلى \"{{status}}\"",
    en: "Readiness status for {{name}} updated to \"{{status}}\"",
    ku: "دۆخی ئامادەیی {{name}} بە سەرکەوتوویی گۆڕدرا بۆ \"{{status}}\"",
    fr: "Statut de disponibilité de {{name}} mis à jour vers \"{{status}}\"",
    de: "Bereitschaftsstatus für {{name}} erfolgreich auf „{{status}}“ aktualisiert"
  },
  status_update_failed: {
    ar: "فشل تحديث الحالة",
    en: "Failed to update status",
    ku: "نوێکردنەوەی دۆخەکە سەرکەوتوو نەبوو",
    fr: "Échec de mise à jour du statut",
    de: "Status-Aktualisierung fehlgeschlagen"
  },

  // Connected Devices & Global Map
  connected_devices_global_map: {
    ar: "مراقبة الأجهزة والمواقع العالمية",
    en: "Connected Devices & Global Locations",
    ku: "چاودێری ئامێرەکان و شوێنە جیهانییەکان",
    fr: "Surveillance des appareils et localisations globales",
    de: "Globale Geräte- & Standortüberwachung"
  },
  live_stream_active: {
    ar: "بث لحظي نشط",
    en: "Live Stream Active",
    ku: "پەخشی ڕاستەوخۆ چالاکە",
    fr: "Flux direct actif",
    de: "Live-Stream aktiv"
  },
  unauthorized_access: {
    ar: "غير مصرح لك بالوصول",
    en: "Unauthorized Access",
    ku: "دەسەڵاتی چوونەژوورەوەت نییە",
    fr: "Accès non autorisé",
    de: "Zugriff nicht autorisiert"
  },
  admin_only_map_desc: {
    ar: "هذه اللوحة مخصصة لمدراء النظام فقط لمراقبة الأجهزة العالمية.",
    en: "This panel is restricted to system administrators to monitor global devices.",
    ku: "ئەم پانێڵە تەنها بۆ بەڕێوەبەرانی سیستەمە بۆ چاودێری ئامێرە جیهانییەکان.",
    fr: "Ce panneau est réservé aux administrateurs pour la surveillance globale.",
    de: "Diese Konsole ist Administratoren zur globalen Geräteüberwachung vorbehalten."
  },
  detection_method: {
    ar: "طريقة الرصد:",
    en: "Detection Method:",
    ku: "شێوازی دەستنیشانکردن:",
    fr: "Méthode de détection :",
    de: "Erfassungsmethode:"
  },
  accurate_gps_icon: {
    ar: "🛰️ نظام GPS دقيق",
    en: "🛰️ High Accuracy GPS",
    ku: "🛰️ سیستەمی GPSی ورد",
    fr: "🛰️ GPS haute précision",
    de: "🛰️ Präzises GPS"
  },
  approx_ip_icon: {
    ar: "🌐 تقريبي عبر IP",
    en: "🌐 Approximate via IP",
    ku: "🌐 نزیکەیی لەڕێگەی IP",
    fr: "🌐 Approximatif via IP",
    de: "🌐 Ungefähr via IP"
  },
  location_version: {
    ar: "إصدار الموقع:",
    en: "Location Version:",
    ku: "وەشانی شوێن:",
    fr: "Version de position :",
    de: "Standort-Version:"
  },
  last_connection: {
    ar: "آخر اتصال:",
    en: "Last Seen:",
    ku: "دوایین پەیوەندی:",
    fr: "Dernière vue :",
    de: "Zuletzt gesehen:"
  },
  view_details_and_history: {
    ar: "عرض كافة التفاصيل والسجل",
    en: "View Details & History",
    ku: "پیشاندانی وردەکارییەکان و مێژوو",
    fr: "Voir détails et historique",
    de: "Alle Details & Verlauf anzeigen"
  },
  search_device_placeholder: {
    ar: "بحث بالجهاز، المستخدم، عنوان IP، المدينة...",
    en: "Search device, user, IP, city...",
    ku: "گەڕان بەپێی ئامێر، بەکارهێنەر، IP، شار...",
    fr: "Recherche appareil, utilisateur, IP, ville...",
    de: "Nach Gerät, Benutzer, IP, Stadt suchen..."
  },
  all_users: {
    ar: "جميع المستخدمين",
    en: "All Users",
    ku: "هەموو بەکارهێنەران",
    fr: "Tous les utilisateurs",
    de: "Alle Benutzer"
  },
  all_countries: {
    ar: "جميع الدول",
    en: "All Countries",
    ku: "هەموو دەوڵەتەکان",
    fr: "Tous les pays",
    de: "Alle Länder"
  },
  all_statuses: {
    ar: "كافة الحالات",
    en: "All Statuses",
    ku: "هەموو دۆخەکان",
    fr: "Tous les statuts",
    de: "Alle Status"
  },
  all_sources: {
    ar: "كافة المصادر",
    en: "All Sources",
    ku: "هەموو سەرچاوەکان",
    fr: "Toutes les sources",
    de: "Alle Quellen"
  },
  accurate_gps: {
    ar: "نظام GPS دقيق",
    en: "Accurate GPS",
    ku: "سیستەمی GPSی ورد",
    fr: "GPS précis",
    de: "Präzises GPS"
  },
  approx_ip: {
    ar: "تقريبي عبر IP",
    en: "Approximate via IP",
    ku: "نزیکەیی لەڕێگەی IP",
    fr: "Approximatif via IP",
    de: "Ungefähr via IP"
  },
  interactive_map_title: {
    ar: "الخريطة التفاعلية المباشرة (OpenStreetMap + Leaflet)",
    en: "Live Interactive Map (OpenStreetMap + Leaflet)",
    ku: "نەخشەی کارلێککاری ڕاستەوخۆ (OpenStreetMap + Leaflet)",
    fr: "Carte interactive en direct (OpenStreetMap + Leaflet)",
    de: "Interaktive Live-Karte (OpenStreetMap + Leaflet)"
  },
  connected_devices_list: {
    ar: "قائمة الأجهزة المتصلة",
    en: "Connected Devices List",
    ku: "لیستی ئامێرە پەیوەستکراوەکان",
    fr: "Liste des appareils connectés",
    de: "Liste verbundener Geräte"
  },
  click_to_focus_device: {
    ar: "اضغط على الجهاز للتركيز أو فحص التفاصيل",
    en: "Click device to focus or inspect details",
    ku: "کلیک لە ئامێرەکە بکە بۆ سەرنجدان یان پشکنینی وردەکاری",
    fr: "Cliquez sur l'appareil pour cibler ou inspecter",
    de: "Klicken für Zentrierung oder Detailinspektion"
  },
  no_matching_devices: {
    ar: "لا توجد أجهزة مطابقة للفلاتر المحددة.",
    en: "No devices match the selected filters.",
    ku: "هیچ ئامێرێک لەگەڵ فلتەرە دیاریکراوەکان ناگونجێت.",
    fr: "Aucun appareil ne correspond aux filtres sélectionnés.",
    de: "Keine Geräte entsprechen den ausgewählten Filtern."
  },
  locate_on_map: {
    ar: "تحديد على الخريطة",
    en: "Locate on Map",
    ku: "دیاریکردن لەسەر نەخشە",
    fr: "Localiser sur la carte",
    de: "Auf Karte anzeigen"
  },
  details_and_history: {
    ar: "التفاصيل والسجل",
    en: "Details & History",
    ku: "وردەکاری و مێژوو",
    fr: "Détails et historique",
    de: "Details & Verlauf"
  },
  simulate_travel_egypt: {
    ar: "محاكاة السفر إلى مصر (القاهرة)",
    en: "Simulate Travel to Egypt (Cairo)",
    ku: "هاوشێوەکردنی گەشت بۆ میسر (قاهیرە)",
    fr: "Simuler voyage en Égypte (Le Caire)",
    de: "Reise nach Ägypten (Kairo) simulieren"
  },
  simulate_return_saudi: {
    ar: "محاكاة العودة إلى السعودية (الرياض)",
    en: "Simulate Return to Saudi (Riyadh)",
    ku: "هاوشێوەکردنی گەڕانەوە بۆ سعودیە (ڕیاز)",
    fr: "Simuler retour en Arabie (Riyad)",
    de: "Rückkehr nach Saudi-Arabien (Riad) simulieren"
  },
  close: {
    ar: "إغلاق",
    en: "Close",
    ku: "داخستن",
    fr: "Fermer",
    de: "Schließen"
  },

  // Incident Playback
  loading_blackbox_data: {
    ar: "جاري تحميل بيانات الصندوق الأسود...",
    en: "Loading incident black-box data...",
    ku: "بارکردنی زانیارییەکانی سندووقی ڕەش...",
    fr: "Chargement des données de la boîte noire...",
    de: "Lade Blackbox-Einsatzdaten..."
  },
  task_completed_event: {
    ar: "إنجاز مهمة: {{title}}",
    en: "Task Completed: {{title}}",
    ku: "ئەرک تەواوکرا: {{title}}",
    fr: "Tâche accomplie : {{title}}",
    de: "Aufgabe abgeschlossen: {{title}}"
  },
  voice_note_event: {
    ar: "🎙️ ملاحظة صوتية ({{duration}} ث): {{desc}}",
    en: "🎙️ Voice Note ({{duration}}s): {{desc}}",
    ku: "🎙️ تێبینی دەنگی ({{duration}} چ): {{desc}}",
    fr: "🎙️ Note vocale ({{duration}}s) : {{desc}}",
    de: "🎙️ Sprachnotiz ({{duration}} Sek): {{desc}}"
  },
  responder_name_fallback: {
    ar: "مستجيب",
    en: "Responder",
    ku: "وەڵامدەرەوە",
    fr: "Intervenant",
    de: "Einsatzkraft"
  },
  field_recording_fallback: {
    ar: "تسجيل ميداني",
    en: "Field Recording",
    ku: "تۆماری مەیدانی",
    fr: "Enregistrement de terrain",
    de: "Feldaufnahme"
  },
  replay_incident: {
    ar: "إعادة تشغيل الحادث:",
    en: "Incident Playback:",
    ku: "دووبارە لێدانی ڕووداوەکە:",
    fr: "Relecture d'incident :",
    de: "Einsatz-Wiedergabe:"
  },
  elapsed_time: {
    ar: "الوقت المنقضي",
    en: "Elapsed Time",
    ku: "کاتی بەسەرچوو",
    fr: "Temps écoulé",
    de: "Verstrichene Zeit"
  },
  real_data: {
    ar: "بيانات حقيقية",
    en: "REAL DATA",
    ku: "داتای ڕاستەقینە",
    fr: "DONNÉES RÉELLES",
    de: "ECHTDATEN"
  },
  no_telemetry: {
    ar: "لا توجد بيانات تتبع",
    en: "NO TELEMETRY",
    ku: "هیچ داتایەکی شوێنپێهەڵگرتن نییە",
    fr: "PAS DE TÉLÉMÉTRIE",
    de: "KEINE TELEMETRIE"
  },
  switch_to_satellite: {
    ar: "قمر صناعي",
    en: "Satellite",
    ku: "مانگی دەستکرد",
    fr: "Satellite",
    de: "Satellit"
  },
  switch_to_street_map: {
    ar: "خريطة",
    en: "Streets Map",
    ku: "نەخشەی شەقامەکان",
    fr: "Carte routière",
    de: "Straßenkarte"
  },
  switch_to_satellite_tooltip: {
    ar: "التحويل إلى القمر الصناعي (مجاني 100%)",
    en: "Switch to Satellite Layer (100% Free)",
    ku: "گۆڕین بۆ مانگی دەستکرد (١٠٠٪ بێبەرامبەر)",
    fr: "Basculer vers satellite (100% gratuit)",
    de: "Auf Satellitenansicht umschalten (100% kostenlos)"
  },
  switch_to_streets_tooltip: {
    ar: "التحويل إلى الخريطة التخطيطية (مجاني 100%)",
    en: "Switch to Street Map (100% Free)",
    ku: "گۆڕین بۆ نەخشەی شەقامەکان (١٠٠٪ بێبەرامبەر)",
    fr: "Basculer vers carte routière (100% gratuit)",
    de: "Auf Straßenkarte umschalten (100% kostenlos)"
  },
  zoom_in: {
    ar: "تكبير الخريطة",
    en: "Zoom In",
    ku: "گەورەکردنی نەخشە",
    fr: "Zoom avant",
    de: "Vergrößern"
  },
  zoom_out: {
    ar: "تصغير الخريطة",
    en: "Zoom Out",
    ku: "بچووککردنەوەی نەخشە",
    fr: "Zoom arrière",
    de: "Verkleinern"
  },
  recenter_incident: {
    ar: "إعادة التمركز على موقع الحادث",
    en: "Recenter on Incident",
    ku: "سەنتەرکردنەوە لەسەر شوێنی ڕووداو",
    fr: "Recentrer sur l'incident",
    de: "Auf Einsatzort zentrieren"
  },
  free_live_tracking_badge: {
    ar: "تتبع مباشر مجاني 100% بدون أي مفتاح API",
    en: "100% Free Live Tracking without API Key",
    ku: "شوێنپێهەڵگرتنی ڕاستەوخۆ بەخۆڕایی بەبێ کلیلی API",
    fr: "Suivi en direct 100% gratuit sans clé API",
    de: "100% kostenlose Live-Verfolgung ohne API-Schlüssel"
  },
  stats: {
    ar: "الإحصائيات",
    en: "Stats",
    ku: "ئامارەکان",
    fr: "Statistiques",
    de: "Statistiken"
  },
  forensic_replay_module: {
    ar: "وحدة التحقيق الجنائي وإعادة محاكاة الحوادث - ERS",
    en: "ERS System Forensic Replay Module",
    ku: "مۆدیۆلی لێکۆڵینەوە و دووبارە لێدانەوەی ڕووداوەکان - ERS",
    fr: "Module d'analyse médico-légale et de relecture ERS",
    de: "ERS Forensisches Einsatz-Replay-Modul"
  },

  // Settings & Localization Options
  country_egypt: {
    ar: "مصر (Egypt)",
    en: "Egypt",
    ku: "میسر (Egypt)",
    fr: "Égypte",
    de: "Ägypten"
  },
  country_saudi_arabia: {
    ar: "السعودية (KSA)",
    en: "Saudi Arabia (KSA)",
    ku: "عەرەبستانی سعوودی (KSA)",
    fr: "Arabie Saoudite (KSA)",
    de: "Saudi-Arabien (KSA)"
  },
  country_kuwait: {
    ar: "الكويت (Kuwait)",
    en: "Kuwait",
    ku: "کوەیت (Kuwait)",
    fr: "Koweït",
    de: "Kuwait"
  },
  country_uae: {
    ar: "الإمارات (UAE)",
    en: "United Arab Emirates (UAE)",
    ku: "ئیمارات (UAE)",
    fr: "Émirats Arabes Unis (EAU)",
    de: "Vereinigte Arabische Emirate (VAE)"
  },
  country_qatar: {
    ar: "قطر (Qatar)",
    en: "Qatar",
    ku: "قەتەر (Qatar)",
    fr: "Qatar",
    de: "Katar"
  },
  color_blue: {
    ar: "أزرق",
    en: "Blue",
    ku: "شین",
    fr: "Bleu",
    de: "Blau"
  },
  color_red: {
    ar: "أحمر",
    en: "Red",
    ku: "سوور",
    fr: "Rouge",
    de: "Rot"
  },
  color_green: {
    ar: "أخضر",
    en: "Green",
    ku: "سەوز",
    fr: "Vert",
    de: "Grün"
  },
  color_purple: {
    ar: "بنفسجي",
    en: "Purple",
    ku: "مۆر",
    fr: "Violet",
    de: "Lila"
  },
  color_indigo: {
    ar: "نيلي",
    en: "Indigo",
    ku: "نیلی",
    fr: "Indigo",
    de: "Indigo"
  },
  color_orange: {
    ar: "برتقالي",
    en: "Orange",
    ku: "پرتەقاڵی",
    fr: "Orange",
    de: "Orange"
  },
  color_teal: {
    ar: "سماوي",
    en: "Teal",
    ku: "شینی ئاسمانی",
    fr: "Sarcelle",
    de: "Blaugrün"
  },
  color_pink: {
    ar: "وردي",
    en: "Pink",
    ku: "پەمەیی",
    fr: "Rose",
    de: "Rosa"
  },
  color_amber: {
    ar: "عنبري",
    en: "Amber",
    ku: "عەنبەری",
    fr: "Ambre",
    de: "Bernstein"
  },
  work_country_label: {
    ar: "دولة العمل (للتمركز على الخريطة)",
    en: "Work Country (for Map Centering)",
    ku: "دەوڵەتی کارکردن (بۆ سەنتەرکردنی نەخشە)",
    fr: "Pays d'affectation (centrage carte)",
    de: "Einsatzland (für Kartenzentrierung)"
  },
  save_data_error: {
    ar: "حدث خطأ أثناء حفظ البيانات",
    en: "An error occurred while saving data",
    ku: "هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردنی داتاکاندا",
    fr: "Une erreur est survenue lors de l'enregistrement",
    de: "Beim Speichern ist ein Fehler aufgetreten"
  },
  move_up: {
    ar: "تحريك لأعلى",
    en: "Move Up",
    ku: "جووڵان بۆ سەرەوە",
    fr: "Monter",
    de: "Nach oben verschieben"
  },
  move_down: {
    ar: "تحريك لأسفل",
    en: "Move Down",
    ku: "جووڵان بۆ خوارەوە",
    fr: "Descendre",
    de: "Nach unten verschieben"
  },
  mobile_diagnostics_title: {
    ar: "تشخيص واختبار خدمات الموبايل",
    en: "Mobile Services Diagnostics & Testing",
    ku: "پشکنین و تاقیکردنەوەی خزمەتگوزارییەکانی مۆبایل",
    fr: "Diagnostics et tests des services mobiles",
    de: "Mobile Dienste - Diagnose & Tests"
  },
  mobile_diagnostics_sub: {
    ar: "فحص شامل لتكامل الإشعارات، تسجيل الأجهزة، والـ GPS الميداني",
    en: "Comprehensive test for notifications, device registration & field GPS",
    ku: "پشکنینی گشتگیر بۆ ئاگادارییەکان، تۆمارکردنی ئامێر، و GPSی مەیدانی",
    fr: "Vérification complète des notifications, enregistrement d'appareils et GPS",
    de: "Umfassende Prüfung für Benachrichtigungen, Geräteregistrierung & Feld-GPS"
  },
  recheck: {
    ar: "إعادة الفحص",
    en: "Re-run Diagnostics",
    ku: "دووبارە پشکنینەوە",
    fr: "Réanalyser",
    de: "Erneut prüfen"
  },
  hardware_platform_info: {
    ar: "معلومات الجهاز والبيئة",
    en: "Hardware & Platform Information",
    ku: "زانیاری ئامێر و ژینگە",
    fr: "Informations sur le matériel et la plateforme",
    de: "Geräte- & Plattforminformationen"
  },
  device_model: {
    ar: "طراز الجهاز",
    en: "Device Model",
    ku: "مۆدێلی ئامێر",
    fr: "Modèle de l'appareil",
    de: "Gerätemodell"
  },
  operating_system: {
    ar: "نظام التشغيل",
    en: "Operating System",
    ku: "سیستەمی کارپێکردن",
    fr: "Système d'exploitation",
    de: "Betriebssystem"
  },
  network_status: {
    ar: "حالة الشبكة",
    en: "Network Status",
    ku: "باری تۆڕ",
    fr: "État du réseau",
    de: "Netzwerkstatus"
  },
  device_id_label: {
    ar: "معرّف الجهاز (Device ID)",
    en: "Device ID",
    ku: "ناسێنەری ئامێر (Device ID)",
    fr: "Identifiant de l'appareil (Device ID)",
    de: "Geräte-ID (Device ID)"
  },
  push_notif_diagnostics: {
    ar: "تشخيص إشعارات الإنذار الفورية (Push Notifications)",
    en: "Push Notifications Diagnostics",
    ku: "پشکنینی ئاگادارییە خێراکان (Push)",
    fr: "Diagnostics des notifications push",
    de: "Push-Benachrichtigungsdiagnose"
  },
  fcm_token_label: {
    ar: "رمز FCM الميداني",
    en: "FCM Device Token",
    ku: "تۆکنی FCMی مەیدانی",
    fr: "Jeton FCM de l'appareil",
    de: "FCM-Geräte-Token"
  },
  send_test_push: {
    ar: "إرسال إشعار فحص تجريبي",
    en: "Send Test Push Notification",
    ku: "ناردنی ئاگاداری تاقیکاری",
    fr: "Envoyer notification de test",
    de: "Test-Push-Nachricht senden"
  },
  sending: {
    ar: "جاري الإرسال...",
    en: "Sending...",
    ku: "دەنێردرێت...",
    fr: "Envoi en cours...",
    de: "Wird gesendet..."
  },
  gps_field_diagnostics: {
    ar: "تشخيص نظام تحديد المواقع (Field GPS)",
    en: "Field GPS Diagnostics",
    ku: "پشکنینی سیستەمی GPSی مەیدانی",
    fr: "Diagnostics GPS de terrain",
    de: "Feld-GPS-Diagnose"
  },
  current_coordinates: {
    ar: "الإحداثيات الحالية",
    en: "Current Coordinates",
    ku: "پۆتانە ئێستاییەکان",
    fr: "Coordonnées actuelles",
    de: "Aktuelle Koordinaten"
  },
  accuracy: {
    ar: "دقة التحديد",
    en: "Accuracy",
    ku: "وردی دیاریکردن",
    fr: "Précision",
    de: "Genauigkeit"
  },
  speed: {
    ar: "السرعة",
    en: "Speed",
    ku: "خێرایی",
    fr: "Vitesse",
    de: "Geschwindigkeit"
  },
  altitude: {
    ar: "الارتفاع",
    en: "Altitude",
    ku: "بەرزایی",
    fr: "Altitude",
    de: "Höhe"
  },
  refresh_gps: {
    ar: "تحديث إحداثيات GPS",
    en: "Refresh GPS Coordinates",
    ku: "نوێکردنەوەی GPS",
    fr: "Actualiser coordonnées GPS",
    de: "GPS-Koordinaten aktualisieren"
  },
  unspecified: {
    ar: "غير محدد",
    en: "Unspecified",
    ku: "دیارینەکراو",
    fr: "Non spécifié",
    de: "Nicht angegeben"
  },
  testing: {
    ar: "فحص...",
    en: "Testing...",
    ku: "پشکنین...",
    fr: "Test...",
    de: "Wird geprüft..."
  },
  meters: {
    ar: "متر",
    en: "meters",
    ku: "مەتر",
    fr: "mètres",
    de: "Meter"
  },
  km_h: {
    ar: "كم/س",
    en: "km/h",
    ku: "کم/ک",
    fr: "km/h",
    de: "km/h"
  },
  browser_env: {
    ar: "متصفح ويب (Web Browser)",
    en: "Web Browser",
    ku: "وێبگەڕ (Web Browser)",
    fr: "Navigateur Web",
    de: "Webbrowser"
  },
  copied: {
    ar: "تم النسخ!",
    en: "Copied!",
    ku: "کۆپیکرا!",
    fr: "Copié !",
    de: "Kopiert!"
  },
  copy_token: {
    ar: "نسخ الرمز",
    en: "Copy Token",
    ku: "کۆپیکردنی تۆکن",
    fr: "Copier le jeton",
    de: "Token kopieren"
  },
  native_app_env: {
    ar: "تطبيق أصلي (Native APK / Capacitor)",
    en: "Native App (APK / Capacitor)",
    ku: "ئەپی بنەڕەتی (Native APK / Capacitor)",
    fr: "Application native (APK / Capacitor)",
    de: "Native App (APK / Capacitor)"
  },
  web_browser_env: {
    ar: "بيئة الويب / متصفح (PWA)",
    en: "Web / Browser Environment (PWA)",
    ku: "ژینگەی وێب / وێبگەڕ (PWA)",
    fr: "Environnement Web / Navigateur (PWA)",
    de: "Web- / Browser-Umgebung (PWA)"
  },
  copied_to_clipboard: {
    ar: "تم النسخ إلى الحافظة بنجاح",
    en: "Copied to clipboard successfully",
    ku: "بە سەرکەوتوویی لە کلیپبۆرد کۆپیکرا",
    fr: "Copié dans le presse-papiers avec succès",
    de: "Erfolgreich in die Zwischenablage kopiert"
  },
  incident_details: {
    ar: "تفاصيل الحادث",
    en: "Incident Details",
    ku: "وردەکارییەکانی ڕووداو",
    fr: "Détails de l'incident",
    de: "Einsatzdetails"
  },
  incident_severity: {
    ar: "درجة الخطورة",
    en: "Incident Severity",
    ku: "ئاستی مەترسی",
    fr: "Gravité de l'incident",
    de: "Schweregrad des Einsatzes"
  },
  high_priority: {
    ar: "أولوية قصوى",
    en: "High Priority",
    ku: "ئەولەویەتی بەرز",
    fr: "Haute priorité",
    de: "Hohe Priorität"
  },
  medium_priority: {
    ar: "أولوية متوسطة",
    en: "Medium Priority",
    ku: "ئەولەویەتی ناوەند",
    fr: "Priorité moyenne",
    de: "Mittlere Priorität"
  },
  low_priority: {
    ar: "أولوية عادية",
    en: "Low Priority",
    ku: "ئەولەویەتی نزم",
    fr: "Faible priorité",
    de: "Niedrige Priorität"
  },
  send_emergency_now: {
    ar: "إرسال بلاغ الطوارئ الآن",
    en: "Dispatch Emergency Alert Now",
    ku: "ناردنی ئاگاداری باری لەناکاو ئێستا",
    fr: "Déclencher l'alerte d'urgence maintenant",
    de: "Notfallalarm jetzt auslösen"
  },
  emergency_dispatched: {
    ar: "تم إرسال البلاغ بنجاح",
    en: "Emergency Dispatched Successfully",
    ku: "بلاغەکە بە سەرکەوتوویی نێردرا",
    fr: "Alerte d'urgence envoyée avec succès",
    de: "Notfall erfolgreich alarmiert"
  },
  incident_log: {
    ar: "سجل الحادث",
    en: "Incident Log",
    ku: "تۆماری ڕووداو",
    fr: "Journal de l'incident",
    de: "Einsatzprotokoll"
  },
  responder_chat: {
    ar: "دردشة المستجيبين",
    en: "Responder Chat",
    ku: "چاتی وەڵامدەرەوەکان",
    fr: "Discussion des intervenants",
    de: "Einsatzkräfte-Chat"
  },
  type_message_placeholder: {
    ar: "اكتب رسالة للفرق الميدانية...",
    en: "Type a message for field teams...",
    ku: "پەیامێک بنووسە بۆ تیمە مەیدانییەکان...",
    fr: "Tapez un message pour les équipes de terrain...",
    de: "Nachricht an die Einsatzkräfte verfassen..."
  }
};

// Merge all new keys
const languages = ['ar', 'en', 'ku', 'fr', 'de'];
for (const [key, trans] of Object.entries(newKeys)) {
  for (const lang of languages) {
    if (trans[lang]) {
      current[lang][key] = trans[lang];
    }
  }
}

// Generate the new pristine i18n.ts
const code = `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: ${JSON.stringify(current.ar, null, 6)}
  },
  en: {
    translation: ${JSON.stringify(current.en, null, 6)}
  },
  ku: {
    translation: ${JSON.stringify(current.ku, null, 6)}
  },
  fr: {
    translation: ${JSON.stringify(current.fr, null, 6)}
  },
  de: {
    translation: ${JSON.stringify(current.de, null, 6)}
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
console.log('Successfully wrote i18n.ts with 100% complete resources for all 5 languages!');

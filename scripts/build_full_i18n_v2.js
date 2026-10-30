import fs from 'fs';

// Complete dictionary of all 56 missing keys + newly required keys for CaseReports, CrisisSimulator, AiReports
export const allNewKeys = {
  // --- Missing Keys from EmergencyChecklistSection ---
  cannot_edit_others_task: {
    ar: 'لا يمكنك تعديل مهمة مستخدم آخر بدون صلاحيات إشرافية',
    ku: 'ناتوانی ئەرکی بەکارهێنەرێکی تر دەستکاری بکەیت بەبێ دەسەڵاتی سەرپەرشتیاری',
    ur: 'آپ سپروائزر کے اختیارات کے بغیر کسی دوسرے صارف کے ٹاسک میں ترمیم نہیں کر سکتے',
    en: 'You cannot edit another user\'s task without supervisor privileges',
    fr: 'Vous ne pouvez pas modifier la tâche d\'un autre utilisateur sans privilèges de superviseur',
    de: 'Sie können die Aufgabe eines anderen Benutzers nicht ohne Vorgesetztenrechte bearbeiten'
  },
  enter_skip_reason_required: {
    ar: 'يرجى كتابة سبب التخطي لتوثيق الإجراء الميداني',
    ku: 'تکایە هۆکاری پەڕاندن بنووسە بۆ بەڵگەدارکردنی ڕێکارە مەیدانییەکە',
    ur: 'براہ کرم فیلڈ کارروائی کو ریکارڈ کرنے کے لیے ٹاسک چھوڑنے کی وجہ درج کریں',
    en: 'Please provide a documented justification for skipping this task',
    fr: 'Veuillez fournir une justification documentée pour ignorer cette tâche',
    de: 'Bitte geben Sie eine dokumentierte Begründung für das Überspringen an'
  },
  enter_blocked_reason_required: {
    ar: 'يرجى كتابة سبب التعثر أو العائق الميداني',
    ku: 'تکایە هۆکاری پەککەوتن یان بەربەستی مەیدانی بنووسە',
    ur: 'براہ کرم فیلڈ میں پیش آنے والی رکاوٹ کی وجہ درج کریں',
    en: 'Please specify the field obstacle preventing task execution',
    fr: 'Veuillez préciser l\'obstacle sur le terrain empêchant l\'exécution',
    de: 'Bitte geben Sie das Vor-Ort-Hindernis an, das die Ausführung verhindert'
  },
  failed_update_task_status: {
    ar: 'فشل في تحديث حالة المهمة، يرجى المحاولة لاحقاً',
    ku: 'نوێکردنەوەی دۆخی ئەرکەکە سەرکەوتوو نەبوو، دواتر هەوڵ بدەرەوە',
    ur: 'ٹاسک کی حالت اپ ڈیٹ کرنے میں ناکامی، براہ کرم بعد میں کوشش کریں',
    en: 'Failed to update task status, please try again',
    fr: 'Échec de la mise à jour du statut de la tâche, veuillez réessayer',
    de: 'Aktualisierung des Aufgabenstatus fehlgeschlagen, bitte erneut versuchen'
  },
  failed_assignment: {
    ar: 'فشل في تعيين الموظف للمهمة',
    ku: 'دیاریکردنی کارمەند بۆ ئەرکەکە سەرکەوتوو نەبوو',
    ur: 'اہلکار کو ٹاسک تفویض کرنے میں ناکامی',
    en: 'Failed to assign staff to task',
    fr: 'Échec de l\'affectation du personnel à la tâche',
    de: 'Zuweisung des Mitarbeiters zur Aufgabe fehlgeschlagen'
  },
  checklist_sop_badge: {
    ar: 'إجراءات السلامة القياسية (SOPs)',
    ku: 'ڕێکارە ستانداردەکانی سەلامەتی (SOPs)',
    ur: 'معیاری حفاظتی طریقہ کار (SOPs)',
    en: 'Standard Operating Procedures (SOPs)',
    fr: 'Procédures Opérationnelles Normalisées (SOP)',
    de: 'Standardbetriebsverfahren (SOPs)'
  },
  checklist_sop_title: {
    ar: 'قائمة مهام الاستجابة الطارئة المعتمدة',
    ku: 'لیستی ئەرکە پەسەندکراوەکانی وەڵامدانەوەی فریاگوزاری',
    ur: 'منظور شدہ ہنگامی ردعمل کی چیک لسٹ',
    en: 'Certified Emergency Response Task Checklist',
    fr: 'Protocole certifié des tâches d\'intervention d\'urgence',
    de: 'Zertifizierte Notfalleinsatz-Aufgaben-Checkliste'
  },
  checklist_sop_desc: {
    ar: 'خطوات تكتيكية متتالية معتمدة لضمان أمان الموقع وتقليل المخاطر الميدانية.',
    ku: 'هەنگاوی تەکتیکی یەک لەدوای یەکی پەسەندکراو بۆ دڵنیابوون لە پاراستنی شوێنەکە و کەمکردنەوەی مەترسییەکان.',
    ur: 'جائے وقوعہ کو محفوظ بنانے اور فیلڈ خطرات کم کرنے کے لیے منظور شدہ تسلسلی ٹیکٹیکل اقدامات۔'
  },
  field_completion_rate: {
    ar: 'معدل الإنجاز الميداني',
    ku: 'ڕێژەی تەواوکردنی مەیدانی',
    ur: 'فیلڈ تکمیل کی شرح',
    en: 'Field Execution Rate',
    fr: 'Taux de réalisation sur le terrain',
    de: 'Vor-Ort-Abschlussrate'
  },
  tasks_completed_count: {
    ar: '{{completed}} من {{total}} مهمة منجزة',
    ku: '{{completed}} لە {{total}} ئەرک تەواوکراوە',
    ur: '{{total}} میں سے {{completed}} ٹاسکس مکمل',
    en: '{{completed}} of {{total}} tasks completed',
    fr: '{{completed}} sur {{total}} tâches terminées',
    de: '{{completed}} von {{total}} Aufgaben abgeschlossen'
  },
  safety_notice_title: {
    ar: 'تنبيه أمني ملزم:',
    ku: 'ئاگادارییەکی ئەمنی پێویست:',
    ur: 'لازمی حفاظتی انتباہ:',
    en: 'Mandatory Safety Directive:',
    fr: 'Consigne de sécurité obligatoire :',
    de: 'Verbindliche Sicherheitsanweisung:'
  },
  safety_notice_body: {
    ar: 'يجب توثيق الإجراءات الميدانية بدقة وتجنب أي تجاوز للمهام الإلزامية دون موافقة المشرف المعتمد.',
    ku: 'پێویستە ڕێکارە مەیدانییەکان بە وردی بەڵگەدار بکرێن و لە پەڕاندنی ئەرکە زۆرەملێکان بەبێ ڕەزامەندی سەرپەرشتیار دووربکەونەوە.',
    ur: 'فیلڈ کارروائیوں کا درست اندراج ضروری ہے اور مجاز سپروائزر کی اجازت کے بغیر لازمی ٹاسکس چھوڑنے سے گریز کریں۔',
    en: 'Field actions must be thoroughly documented. Mandatory tasks cannot be bypassed without authorized supervisor approval.',
    fr: 'Les actions de terrain doivent être rigoureusement documentées. Aucune tâche obligatoire ne peut être contournée sans approbation du superviseur.',
    de: 'Einsatzmaßnahmen müssen sorgfältig dokumentiert werden. Pflichtaufgaben dürfen nicht ohne Genehmigung des Vorgesetzten übersprungen werden.'
  },
  loading_sop_tasks: {
    ar: 'جارِ تحميل إجراءات السلامة المعتمدة...',
    ku: 'بارکردنی ڕێکارە پەسەندکراوەکانی سەلامەتی...',
    ur: 'منظور شدہ حفاظتی طریقہ کار لوڈ ہو رہا ہے...',
    en: 'Loading certified response checklist...',
    fr: 'Chargement des procédures de sécurité certifiées...',
    de: 'Zertifizierte Sicherheitsverfahren werden geladen...'
  },
  no_tasks_for_incident: {
    ar: 'لا توجد مهام مسجلة لهذا الحادث حالياً.',
    ku: 'هیچ ئەرکێک بۆ ئەم ڕووداوە تۆمار نەکراوە لە ئێستادا.',
    ur: 'فی الوقت اس واقعے کے لیے کوئی ٹاسک درج نہیں ہے۔',
    en: 'No operational tasks registered for this incident.',
    fr: 'Aucune tâche opérationnelle enregistrée pour cet incident.',
    de: 'Für diesen Einsatz sind derzeit keine Aufgaben registriert.'
  },
  status_completed: {
    ar: 'مكتمل',
    ku: 'تەواوکراو',
    ur: 'مکمل',
    en: 'Completed',
    fr: 'Terminé',
    de: 'Abgeschlossen'
  },
  status_in_progress: {
    ar: 'قيد التنفيذ',
    ku: 'لە جێبەجێکردندایە',
    ur: 'جاری ہے',
    en: 'In Progress',
    fr: 'En cours',
    de: 'In Bearbeitung'
  },
  status_skipped: {
    ar: 'تم التخطي',
    ku: 'پەڕێندراو',
    ur: 'چھوڑ دیا گیا',
    en: 'Skipped',
    fr: 'Ignoré',
    de: 'Übersprungen'
  },
  status_blocked: {
    ar: 'متعثر / معاق',
    ku: 'پەککەوتوو / بەربەستکراو',
    ur: 'روک دیا گیا / رکاوٹ',
    en: 'Blocked',
    fr: 'Bloqué',
    de: 'Blockiert'
  },
  status_pending: {
    ar: 'قيد الانتظار',
    ku: 'چاوەڕوانکراو',
    ur: 'زیر التواء',
    en: 'Pending',
    fr: 'En attente',
    de: 'Ausstehend'
  },
  mandatory_badge: {
    ar: 'إلزامي',
    ku: 'زۆرەملێ',
    ur: 'لازمی',
    en: 'Mandatory',
    fr: 'Obligatoire',
    de: 'Pflicht'
  },
  supervisor_approval_badge: {
    ar: 'يتطلب اعتماد المشرف',
    ku: 'پێویستی بە پەسەندکردنی سەرپەرشتیارە',
    ur: 'سپروائزر کی منظوری درکار ہے',
    en: 'Requires Supervisor Approval',
    fr: 'Approbation du superviseur requise',
    de: 'Vorgesetzten-Genehmigung erforderlich'
  },
  assigned_to_label: {
    ar: 'المكلّف:',
    ku: 'ڕاسپێردراو:',
    ur: 'تفویض کردہ:',
    en: 'Assigned to:',
    fr: 'Assigné à :',
    de: 'Zugewiesen an:'
  },
  unassigned_task: {
    ar: 'غير مكلّف لأحد',
    ku: 'بە کەس نەسپێردراوە',
    ur: 'غیر تفویض شدہ',
    en: 'Unassigned',
    fr: 'Non assigné',
    de: 'Nicht zugewiesen'
  },
  completed_by_label: {
    ar: 'أنجز بواسطة:',
    ku: 'تەواوکرا لەلایەن:',
    ur: 'مکمل کنندہ:',
    en: 'Completed by:',
    fr: 'Complété par :',
    de: 'Abgeschlossen von:'
  },
  supervisor_approved: {
    ar: 'معتمد من المشرف:',
    ku: 'پەسەندکراوە لەلایەن سەرپەرشتیار:',
    ur: 'سپروائزر کی طرف سے منظور شدہ:',
    en: 'Approved by supervisor:',
    fr: 'Approuvé par le superviseur :',
    de: 'Vom Vorgesetzten genehmigt:'
  },
  field_action_notes_label: {
    ar: 'ملاحظات وتوثيق الإجراء الميداني:',
    ku: 'تێبینی و بەڵگەنامەی ڕێکاری مەیدانی:',
    ur: 'فیلڈ کارروائی کے نوٹس اور دستاویزات:',
    en: 'Field execution documentation notes:',
    fr: 'Notes de documentation d\'intervention de terrain :',
    de: 'Dokumentationshinweise zur Vor-Ort-Durchführung:'
  },
  skip_reason_label: {
    ar: 'مبرر التخطي الميداني:',
    ku: 'هۆکاری پەڕاندنی مەیدانی:',
    ur: 'ٹاسک چھوڑنے کا دستاویزی جواز:',
    en: 'Documented field skip reason:',
    fr: 'Justification documentée de l\'omission :',
    de: 'Dokumentierte Begründung für das Überspringen:'
  },
  blocked_reason_label: {
    ar: 'سبب التعثر الميداني:',
    ku: 'هۆکاری پەککەوتنی مەیدانی:',
    ur: 'فیلڈ میں رکاوٹ کی وجہ:',
    en: 'Field obstacle / blockage reason:',
    fr: 'Cause de l\'obstacle / blocage sur le terrain :',
    de: 'Ursache der Vor-Ort-Blockade:'
  },
  assign_employee: {
    ar: 'تكليف موظف',
    ku: 'ڕاسپاردنی کارمەند',
    ur: 'ملازم کو تفویض کریں',
    en: 'Assign Staff',
    fr: 'Assigner un membre',
    de: 'Mitarbeiter zuweisen'
  },
  supervisor_approve_action: {
    ar: 'اعتماد رسمي كمشرف',
    ku: 'پەسەندکردنی فەرمی وەک سەرپەرشتیار',
    ur: 'بطور سپروائزر باضابطہ منظوری',
    en: 'Official Supervisor Sign-off',
    fr: 'Validation officielle du superviseur',
    de: 'Offizielle Vorgesetzten-Genehmigung'
  },
  start_task_action: {
    ar: 'بدء التنفيذ',
    ku: 'دەستپێکردنی جێبەجێکردن',
    ur: 'عمل شروع کریں',
    en: 'Start Execution',
    fr: 'Démarrer l\'exécution',
    de: 'Ausführung starten'
  },
  complete_task_action: {
    ar: 'إتمام المهمة',
    ku: 'تەواوکردنی ئەرک',
    ur: 'ٹاسک مکمل کریں',
    en: 'Complete Task',
    fr: 'Terminer la tâche',
    de: 'Aufgabe abschließen'
  },
  skip_task_action: {
    ar: 'تخطي بمبرر',
    ku: 'پەڕاندن بە هۆکار',
    ur: 'جواز کے ساتھ چھوڑیں',
    en: 'Skip with Reason',
    fr: 'Ignorer avec motif',
    de: 'Mit Begründung überspringen'
  },
  block_task_action: {
    ar: 'إبلاغ عن تعثر',
    ku: 'ڕاپۆرتکردنی پەککەوتن',
    ur: 'رکاوٹ کی اطلاع دیں',
    en: 'Report Obstacle',
    fr: 'Signaler un obstacle',
    de: 'Hindernis melden'
  },
  task_update_modal_title: {
    ar: 'توثيق إجراء المهمة التكتيكية',
    ku: 'بەڵگەدارکردنی ڕێکاری ئەرکە تەکتیکییەکە',
    ur: 'ٹیکٹیکل ٹاسک کی کارروائی کی دستاویز',
    en: 'Document Tactical Task Execution',
    fr: 'Documenter l\'exécution de la tâche tactique',
    de: 'Taktische Aufgabenabwicklung dokumentieren'
  },
  current_performing_user: {
    ar: 'الموثّق الحالي:',
    ku: 'بەڵگەکاری ئێستا:',
    ur: 'موجودہ توثیق کنندہ:',
    en: 'Executing responder:',
    fr: 'Intervenant déclarant :',
    de: 'Ausführender Einsatzkraft:'
  },
  field_action_notes_input_label: {
    ar: 'ملاحظات التنفيذ وتفاصيل الإجراء المتخذ:',
    ku: 'تێبینییەکانی جێبەجێکردن و وردەکاری ڕێکارە گیراوەکان:',
    ur: 'عملدرآمد کے نوٹس اور کیے گئے اقدامات کی تفصیل:',
    en: 'Field notes and action details:',
    fr: 'Notes de terrain et détails de l\'action prise :',
    de: 'Einsatznotizen und Details der durchgeführten Maßnahme:'
  },
  field_action_notes_placeholder: {
    ar: 'اكتب تفاصيل ما قمت بتنفيذه ميدانياً بدقة...',
    ku: 'وردەکاری ئەوەی کە لە مەیداندا جێبەجێت کردووە بنووسە بە وردی...',
    ur: 'فیلڈ میں جو کارروائی کی اس کی تفاصیل یہاں درج کریں...',
    en: 'Document field observations, actions, and readings...',
    fr: 'Consignez précisément les observations, actions et relevés de terrain...',
    de: 'Dokumentieren Sie Vor-Ort-Beobachtungen, Maßnahmen und Messwerte...'
  },
  skip_reason_input_label: {
    ar: 'مبرر التخطي الميداني (إلزامي للتوثيق):'
  },
  skip_reason_placeholder: {
    ar: 'وضح الأسباب التشغيلية التي دعت لعدم تنفيذ هذا الإجراء...',
    ku: 'هۆکارە کارگێڕییەکان ڕوونبکەرەوە کە بوونە هۆی جێبەجێنەکردنی ئەم ڕێکارە...',
    ur: 'وہ آپریشنل وجوہات بیان کریں جن کی بنا پر یہ اقدام نہیں کیا گیا...',
    en: 'Detail the operational reason why this step was bypassed...',
    fr: 'Détaillez les raisons opérationnelles justifiant le contournement de cette étape...',
    de: 'Erläutern Sie die betrieblichen Gründe für das Überspringen dieses Schritts...'
  },
  blocked_reason_input_label: {
    ar: 'سبب التعثر أو العائق الميداني (إلزامي للتوثيق):',
    ku: 'هۆکاری پەککەوتن یان بەربەستی مەیدانی (پێویستە بۆ بەڵگەنامەکردن):',
    ur: 'فیلڈ میں رکاوٹ کی وجہ (لازمی دستاویز):',
    en: 'Mandatory description of field obstruction:',
    fr: 'Description obligatoire de l\'obstacle sur le terrain :',
    de: 'Verbindliche Beschreibung des Hindernisses vor Ort:'
  },
  blocked_reason_placeholder: {
    ar: 'صف العائق الذي منعك من إتمام المهمة (مثل: باب مغلق، حطام، خطر كهربائي)...',
    ku: 'وەسفی ئەو بەربەستە بکە کە ڕێگری لێکردیت لە تەواوکردنی ئەرکەکە (وەک: دەرگای داخراو، وێرانە، مەترسی کارەبا)...',
    ur: 'اس رکاوٹ کی وضاحت کریں جس نے کام کو روکا (مثلاً: بند دروازہ، ملبہ، بجلی کا خطرہ)...',
    en: 'Describe what hindered execution (e.g. locked blast door, debris, severe hazard)...',
    fr: 'Décrivez l\'obstacle (ex. porte verrouillée, débris, risque électrique grave)...',
    de: 'Beschreiben Sie das Hindernis (z. B. verschlossene Brandschutztür, Trümmer, Stromgefahr)...'
  },
  confirm_save_action: {
    ar: 'تأكيد وحفظ الإجراء',
    ku: 'پشتڕاستکردنەوە و پاشەکەوتکردنی ڕێکار',
    ur: 'اقدام کی تصدیق کریں اور محفوظ کریں',
    en: 'Confirm & Save Action',
    fr: 'Confirmer et enregistrer l\'action',
    de: 'Maßnahme bestätigen und speichern'
  },
  assign_task_modal_title: {
    ar: 'تكليف موظف بالمهمة',
    ku: 'ڕاسپاردنی کارمەند بۆ ئەرکەکە',
    ur: 'اہلکار کو ٹاسک تفویض کریں',
    en: 'Assign Staff to Task',
    fr: 'Assigner un membre à la tâche',
    de: 'Mitarbeiter der Aufgabe zuweisen'
  },
  assign_task_modal_desc: {
    ar: 'اختر المستجيب الميداني الأنسب بناءً على موقعه وجاهزيته الحالية.',
    ku: 'شیاوترین وەڵامدەرەوەی مەیدانی هەڵبژێرە لەسەر بنەمای شوێن و ئامادەیی ئێستای.',
    ur: 'اہلکار کے مقام اور موجودہ تیاری کی بنیاد پر موزوں ترین رسپانڈر منتخب کریں۔',
    en: 'Select the optimal field responder based on live location and readiness status.',
    fr: 'Sélectionnez l\'intervenant le plus adapté selon sa localisation et sa disponibilité.',
    de: 'Wählen Sie die am besten geeignete Einsatzkraft basierend auf Standort und Verfügbarkeit aus.'
  },
  candidate_employee_label: {
    ar: 'الموظف المرشح للتكليف:',
    ku: 'کارمەندی بەربژێر بۆ ڕاسپاردن:',
    ur: 'نامزد اہلکار برائے تفویض:',
    en: 'Candidate Responder:',
    fr: 'Intervenant candidat :',
    de: 'Kandidat für die Zuweisung:'
  },
  select_employee_from_list: {
    ar: '-- اختر موظفاً من قائمة الفريق --',
    ku: '-- کارمەندێک لە لیستی تیمەکە هەڵبژێرە --',
    ur: '-- ٹیم کی فہرست میں سے اہلکار منتخب کریں --',
    en: '-- Select responder from team roster --',
    fr: '-- Sélectionner un membre dans la liste d\'équipe --',
    de: '-- Einsatzkraft aus Teamliste auswählen --'
  },
  auto_readiness_eval: {
    ar: 'التقييم التلقائي للجاهزية',
    ku: 'هەڵسەنگاندنی خۆکاری ئامادەیی',
    ur: 'تیاری کا خودکار جائزہ',
    en: 'Automated Readiness Assessment',
    fr: 'Évaluation automatique de la disponibilité',
    de: 'Automatische Verfügbarkeitsbewertung'
  },
  supervisor_override_acknowledgement: {
    ar: 'نعم، أقر كمسؤول بصحة التكليف رغم انشغال الموظف، وأتحمل المتابعة.',
    ku: 'بەڵێ، وەک بەرپرسیار دان بە دروستی ڕاسپاردنەکە دادەنێم سەرەڕای سەرقاڵی کارمەندەکە.',
    ur: 'ہاں، میں بطور سپروائزر مصروفیت کے باوجود اس تفویض کی تصدیق کرتا ہوں اور ذمہ داری لیتا ہوں۔',
    en: 'Yes, as a supervisor I acknowledge the busy state and override assignment.',
    fr: 'Oui, en tant que superviseur, j\'outrepasse le statut occupé et confirme l\'assignation.',
    de: 'Ja, als Vorgesetzter bestätige ich die Zuweisung trotz des Beschäftigt-Status.'
  },
  emergency: {
    ar: 'حالة طوارئ',
    ku: 'باری لەناکاو',
    ur: 'ہنگامی صورتحال',
    en: 'Emergency',
    fr: 'Urgence',
    de: 'Notfall'
  },
  generating: {
    ar: 'جارِ التوليد...',
    ku: 'دروستکردن لە کاردایە...',
    ur: 'تیار کیا جا رہا ہے...',
    en: 'Generating...',
    fr: 'Génération en cours...',
    de: 'Generierung läuft...'
  },
  connected_device: {
    ar: 'جهاز متصل',
    ku: 'ئامێری بەستراوە',
    ur: 'منسلک ڈیوائس',
    en: 'Connected Device',
    fr: 'Appareil connecté',
    de: 'Verbundenes Gerät'
  },
  total_devices: {
    ar: 'إجمالي الأجهزة',
    ku: 'کۆی ئامێرەکان',
    ur: 'کل آلات',
    en: 'Total Devices',
    fr: 'Total des appareils',
    de: 'Geräte gesamt'
  },
  devices: {
    ar: 'الأجهزة',
    ku: 'ئامێرەکان',
    ur: 'آلات',
    en: 'Devices',
    fr: 'Appareils',
    de: 'Geräte'
  },
  checklist_title_ur: {
    ar: 'عنوان قائمة المهام (الأردية)',
    ku: 'ناونیشانی لیستی ئەرکەکان (ئۆردوو)',
    ur: 'چیک لسٹ کا عنوان (اردو)',
    en: 'Checklist Title (Urdu)',
    fr: 'Titre de la liste de contrôle (Ourdou)',
    de: 'Checklistentitel (Urdu)'
  },
  task_title_ur: {
    ar: 'عنوان المهمة (الأردية)',
    ku: 'ناونیشانی ئەرک (ئۆردوو)',
    ur: 'ٹاسک کا عنوان (اردو)',
    en: 'Task Title (Urdu)',
    fr: 'Titre de la tâche (Ourdou)',
    de: 'Aufgabentitel (Urdu)'
  },

  // --- Additional keys for CaseReports & CrisisSimulator ---
  dismissed_responders: {
    ar: 'غير المعنيين',
    ku: 'پەیوەندیدار نەبووان',
    ur: 'غیر متعلقہ اہلکار',
    en: 'Dismissed Responders',
    fr: 'Intervenants non concernés',
    de: 'Nicht beteiligte Einsatzkräfte'
  },
  closed_by_header: {
    ar: 'أغلق بواسطة',
    ku: 'داخرا لەلایەن',
    ur: 'بند کنندہ',
    en: 'Closed By',
    fr: 'Fermé par',
    de: 'Geschlossen von'
  },
  documentation_notes_header: {
    ar: 'التوثيق والملاحظات',
    ku: 'بەڵگەنامە و تێبینییەکان',
    ur: 'دستاویزات اور نوٹس',
    en: 'Documentation & Notes',
    fr: 'Documentation et notes',
    de: 'Dokumentation & Notizen'
  },
  person_unit: {
    ar: 'فرد',
    ku: 'کەس',
    ur: 'افراد',
    en: 'responder(s)',
    fr: 'personne(s)',
    de: 'Person(en)'
  },
  currently_active: {
    ar: 'نشطة حالياً',
    ku: 'ئێستا چالاکە',
    ur: 'فی الوقت فعال ہے',
    en: 'Currently Active',
    fr: 'Actuellement actif',
    de: 'Derzeit aktiv'
  },
  tasks_and_recordings: {
    ar: 'المهام والتسجيلات',
    ku: 'ئەرک و تۆمارەکان',
    ur: 'ٹاسکس اور ریکارڈنگز',
    en: 'Tasks & Recordings',
    fr: 'Tâches et enregistrements',
    de: 'Aufgaben & Aufzeichnungen'
  },
  no_cases_matching_search: {
    ar: 'لا توجد بلاغات تطابق معايير البحث',
    ku: 'هیچ ڕاپۆرتێک لەگەڵ پێوەرەکانی گەڕان یەکناگرێتەوە',
    ur: 'تلاش کے معیار سے مماثل کوئی کیس نہیں ملا',
    en: 'No incident reports match search criteria',
    fr: 'Aucun rapport d\'incident ne correspond aux critères',
    de: 'Keine Einsatzberichte entsprechen den Suchkriterien'
  },
  incident_record_title: {
    ar: 'توثيق وسجل الحادث:',
    ku: 'بەڵگەنامە و تۆماری ڕووداوەکە:',
    ur: 'حادثے کی دستاویز اور ریکارڈ:',
    en: 'Incident Record & Documentation:',
    fr: 'Dossier et documentation d\'incident :',
    de: 'Einsatzprotokoll & Dokumentation:'
  },
  loading_incident_tasks_and_voice: {
    ar: 'جاري تحميل سجل المهام والملاحظات الصوتية الموثقة...',
    ku: 'بارکردنی تۆماری ئەرک و تێبینییە دەنگییە بەڵگەدارکراوەکان...',
    ur: 'ٹاسک لاگ اور صوتی نوٹس لوڈ ہو رہے ہیں...',
    en: 'Loading documented incident tasks and voice notes...',
    fr: 'Chargement des tâches et mémos vocaux de l\'incident...',
    de: 'Einsatzaufgaben und Sprachnotizen werden geladen...'
  },
  field_protocol_tasks_log: {
    ar: 'سجل المهام والبروتوكول الميداني',
    ku: 'تۆماری ئەرک و پرۆتۆکۆلی مەیدانی',
    ur: 'فیلڈ پروٹوکول اور ٹاسکس کا لاگ',
    en: 'Field Protocol & Task Log',
    fr: 'Protocole de terrain et journal des tâches',
    de: 'Einsatzprotokoll & Aufgabenjournal'
  },
  at_time: {
    ar: 'في',
    ku: 'لە',
    ur: 'بوقت',
    en: 'at',
    fr: 'à',
    de: 'um'
  },
  customize_simulator_content: {
    ar: 'تخصيص محتوى المحاكي',
    ku: 'تایبەتکردنی ناوەڕۆکی هاوشێوەساز',
    ur: 'سمیلیٹر کا مواد حسب ضرورت بنائیں',
    en: 'Customize Simulator Scenarios',
    fr: 'Personnaliser le contenu du simulateur',
    de: 'Simulator-Inhalte anpassen'
  },
  custom_simulator_prompt: {
    ar: 'أدخل أنواع الحوادث أو المواقف التي تريد أن يركز عليها الذكاء الاصطناعي عند التوليد:',
    ku: 'جۆری ئەو ڕووداو یان بارودۆخانە بنووسە کە دەتەوێت ژیری دەستکرد سەرنجی بخاتە سەر لەکاتی دروستکردندا:',
    ur: 'وہ ہنگامی واقعات یا حالات درج کریں جن پر آپ AI کی توجہ مرکوز کروانا چاہتے ہیں:',
    en: 'Enter incident types or specific risks for AI scenario generation:',
    fr: 'Saisissez les types d\'incidents ciblés pour la génération de scénarios :',
    de: 'Geben Sie Vorfallarten oder Schwerpunkte für die Szenariengenerierung ein:'
  },
  custom_situations_placeholder: {
    ar: 'مثال: تسريب غاز في المعمل الكيميائي، حريق في غرفة الخوادم بالدور الثالث...',
    ku: 'نموونە: دزەکردنی گاز لە تاقیگەی کیمیایی، ئاگرکەوتنەوە لە ژووری سێرڤەرەکان لە نهۆمی سێیەم...',
    ur: 'مثال: کیمیائی لیبارٹری میں گیس کا اخراج، تیسری منزل کے سرور روم میں آگ...',
    en: 'e.g. chemical lab gas leak, third floor data center electrical fire...',
    fr: 'ex. fuite de gaz dans le laboratoire chimique, incendie salle serveurs au 3e étage...',
    de: 'z. B. Gasleck im Chemielabor, Brand im Serverraum im 3. Stock...'
  },
  save_custom_situations: {
    ar: 'حفظ المواقف المخصصة',
    ku: 'پاشەکەوتکردنی بارودۆخە دیاریکراوەکان',
    ur: 'حسب ضرورت حالات محفوظ کریں',
    en: 'Save Custom Situations',
    fr: 'Enregistrer les situations personnalisées',
    de: 'Benutzerdefinierte Situationen speichern'
  },
  generate_corporate_scenario: {
    ar: 'توليد سيناريو مؤسسي',
    ku: 'دروستکردنی سیناریۆی دامەزراوەیی',
    ur: 'تنظیمی بحرانی منظرنامہ تیار کریں',
    en: 'Generate Enterprise Crisis Scenario',
    fr: 'Générer un scénario de crise d\'entreprise',
    de: 'Unternehmens-Krisenszenario generieren'
  },
  simulator_smart_desc: {
    ar: 'تقوم وحدة ERS الذكية بربط بيانات منشأتك والمواقف المخصصة أعلاه لإنشاء تجربة تدريبية دقيقة ومتقدمة.',
    ku: 'یەکەی زیرەکی ERS داتاکانی دامەزراوەکەت و بارودۆخە تایبەتەکان دەبەستێتەوە بۆ ئەزموونێکی مەشقی پێشکەوتوو.',
    ur: 'ERS اسمارٹ یونٹ سہولت کے ڈیٹا اور مخصوص حالات کو یکجا کر کے جدید ترین تربیتی مشق تیار کرتا ہے۔',
    en: 'The ERS Intelligence engine cross-references facility profile and custom hazards for realistic drill simulation.',
    fr: 'Le moteur ERS croise le profil de votre site et les risques ciblés pour un exercice d\'entraînement immersif.',
    de: 'Das ERS-System verknüpft Standortprofil und spezifische Gefahren zu einer präzisen Übungserfahrung.'
  },
  generate_different_scenario: {
    ar: 'توليد سيناريو مختلف',
    ku: 'دروستکردنی سیناریۆیەکی جیاواز',
    ur: 'مختلف منظرنامہ تیار کریں',
    en: 'Generate Different Scenario',
    fr: 'Générer un autre scénario',
    de: 'Anderes Szenario generieren'
  },
  start_simulation_now: {
    ar: 'بدء المحاكاة الآن',
    ku: 'دەستپێکردنی هاوشێوەسازی ئێستا',
    ur: 'ابھی سمولیشن شروع کریں',
    en: 'Start Simulation Now',
    fr: 'Démarrer la simulation maintenant',
    de: 'Simulation jetzt starten'
  },
  field_crisis_details: {
    ar: 'تفاصيل الأزمة الميدانية',
    ku: 'وردەکارییەکانی قەیرانی مەیدانی',
    ur: 'فیلڈ بحران کی تفصیلات',
    en: 'Field Crisis Description',
    fr: 'Détails de la crise sur le terrain',
    de: 'Einsatzdetails der Krisenlage'
  },
  matching_alerts_count: {
    ar: 'البلاغات المطابقة ({{count}})',
    ku: 'ڕاپۆرتە هاوتاکان ({{count}})',
    ur: 'مماثل انتباہات ({{count}})',
    en: 'Matching Alerts ({{count}})',
    fr: 'Alertes correspondantes ({{count}})',
    de: 'Übereinstimmende Alarme ({{count}})'
  }
};

// Insert into i18n.ts
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
const updatedResources = {};

for (const lang of languages) {
  const existing = extractLangBlock(content, lang) || {};
  // Add all new keys
  for (const [key, transObj] of Object.entries(allNewKeys)) {
    const val = transObj[lang] || transObj['en'] || transObj['ar'];
    existing[key] = val;
  }
  updatedResources[lang] = existing;
  console.log(`Lang: ${lang} -> Total keys now: ${Object.keys(existing).length}`);
}

// Reconstruct i18n.ts cleanly
const lines = [];
lines.push("import i18n from 'i18next';");
lines.push("import { initReactI18next } from 'react-i18next';");
lines.push("");
lines.push("const resources = {");

languages.forEach((lang, langIdx) => {
  lines.push(`  ${lang}: {`);
  lines.push("    translation: {");
  const keys = Object.keys(updatedResources[lang]);
  keys.forEach((k, kIdx) => {
    const isLast = kIdx === keys.length - 1;
    lines.push(`      ${JSON.stringify(k)}: ${JSON.stringify(updatedResources[lang][k])}${isLast ? '' : ','}`);
  });
  lines.push("    }");
  lines.push(`  }${langIdx === languages.length - 1 ? '' : ','}`);
});

lines.push("};");
lines.push("");
lines.push("const getInitialLanguage = (): string => {");
lines.push("  try {");
lines.push("    const saved = localStorage.getItem('esr_settings');");
lines.push("    if (saved) {");
lines.push("      const parsed = JSON.parse(saved);");
lines.push("      if (parsed.language) return parsed.language;");
lines.push("    }");
lines.push("    const savedLng = localStorage.getItem('i18nextLng');");
lines.push("    if (savedLng && resources[savedLng as keyof typeof resources]) {");
lines.push("      return savedLng;");
lines.push("    }");
lines.push("  } catch (e) {}");
lines.push("  return 'ar';");
lines.push("};");
lines.push("");
lines.push("const initialLanguage = getInitialLanguage();");
lines.push("const isRTL = initialLanguage === 'ar' || initialLanguage === 'ku' || initialLanguage === 'ur';");
lines.push("if (typeof document !== 'undefined') {");
lines.push("  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';");
lines.push("  document.documentElement.lang = initialLanguage;");
lines.push("}");
lines.push("");
lines.push("i18n");
lines.push("  .use(initReactI18next)");
lines.push("  .init({");
lines.push("    resources,");
lines.push("    lng: initialLanguage,");
lines.push("    fallbackLng: 'en',");
lines.push("    interpolation: {");
lines.push("      escapeValue: false");
lines.push("    }");
lines.push("  });");
lines.push("");
lines.push("export default i18n;");

fs.writeFileSync('i18n.ts', lines.join('\n'), 'utf8');
console.log('Successfully wrote updated i18n.ts with ALL keys across all 6 languages!');

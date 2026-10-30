/**
 * Comprehensive Localization Engine for Emergency Checklists & Standard Operating Procedures (SOPs)
 * Provides professional translations in Arabic (ar), Kurdish (ku), English (en), French (fr), German (de), and Urdu (ur).
 */

export interface MultilingualText {
  ar: string;
  en: string;
  ku: string;
  fr: string;
  de: string;
  ur?: string;
}

/**
 * Normalizes text for robust fuzzy key matching (removes diacritics, unified Alef/Yaa/Haa, lowercase, trimmed)
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // Arabic tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/\s+/g, ' ');
}

// Canonical Translations for Standard Emergency Checklist Tasks
export const STANDARD_TASK_DICTIONARY: Record<string, { title: MultilingualText; description?: MultilingualText }> = {
  // --- Generic / Standard Incident Tasks ---
  'gen_1': {
    title: {
      ar: 'التحقق الأولي من البلاغ وحجم الخطر',
      en: 'Initial incident verification & hazard assessment',
      ku: 'پشکنینی سەرەتایی بۆ ڕاپۆرتەکە و قەبارەی مەترسییەکە',
      fr: 'Vérification initiale du signalement et évaluation des risques',
      de: 'Erste Überprüfung der Meldung und Gefahrenbewertung',
      ur: 'ابتدائی تصدیق اور خطرات کا جائزہ'
    },
    description: {
      ar: 'الوصول الآمن وتحديد الاحتياجات الفورية من أفراد ومعدات.',
      en: 'Safe arrival and immediate determination of required personnel and equipment.',
      ku: 'گەیشتنی پارێزراو و دیاریکردنی پێداویستییە دەستبەجێیەکان لە کەسایەتی و کەرەستە.',
      fr: 'Arrivée sécurisée et détermination immédiate du personnel et du matériel requis.',
      de: 'Sicheres Eintreffen und sofortige Ermittlung des Personal- und Materialbedarfs.',
      ur: 'محفوظ آمد اور مطلوبہ عملے و آلات کا فوری تعین۔'
    }
  },
  'gen_2': {
    title: {
      ar: 'تأمين محيط الحادث وتوجيه الأفراد إلى المناطق الآمنة',
      en: 'Secure incident perimeter & route personnel safely',
      ku: 'پاراستنی دەوروبەری ڕووداوەکە و ڕێنماییکردنی کەسەکان بۆ ناوچە ئارامەکان',
      fr: 'Sécuriser le périmètre de l\'incident et orienter les personnes vers des zones sûres',
      de: 'Sicherung des Unfallbereichs und Weiterleitung von Personen in sichere Bereiche',
      ur: 'حادثے کا گھیراؤ اور افراد کو محفوظ مقام پر منتقل کرنا'
    },
    description: {
      ar: 'تطويق الموقع وتوجيه الحركة بعيداً عن منطقة الخطر.',
      en: 'Cordon off the site and redirect traffic away from the hazard zone.',
      ku: 'گەمارۆدانی شوێنەکە و دوورخستنەوەی هاتووچۆ لە ناوچەی مەترسی.',
      fr: 'Boucler la zone et détourner la circulation hors du secteur dangereux.',
      de: 'Den Standort absperren und Personen vom Gefahrenbereich wegleiten.',
      ur: 'مقام کی ناکہ بندی اور آمدورفت کو خطرے والے زون سے دور رکھنا۔'
    }
  },
  'gen_3': {
    title: {
      ar: 'تنفيذ الإجراءات التكتيكية الميدانية وتقديم الدعم المطلوب',
      en: 'Execute field mitigation & provide emergency support',
      ku: 'جێبەجێکردنی ڕێوشوێنە تەکتیکییە مەیدانییەکان و پێشکەشکردنی پاڵپشتی پێویست',
      fr: 'Exécuter les mesures tactiques sur le terrain et fournir l\'assistance requise',
      de: 'Durchführung taktischer Vor-Ort-Maßnahmen und Bereitstellung erforderlicher Unterstützung',
      ur: 'فیلڈ ٹیکٹیکل اقدامات کا نفاذ اور ہنگامی معاونت'
    },
    description: {
      ar: 'تطبيق البروتوكول التكتيكي والتعامل المباشر مع مسببات الحادث.',
      en: 'Apply tactical protocol and deal directly with incident causes.',
      ku: 'جێبەجێکردنی پرۆتۆکۆلی تەکتیکی و مامەڵەی ڕاستەوخۆ لەگەڵ هۆکارەکانی ڕووداوەکە.',
      fr: 'Appliquer le protocole tactique et traiter directement les causes de l\'incident.',
      de: 'Anwendung des taktischen Protokolls und direkte Bewältigung der Ursachen.',
      ur: 'ٹیکٹیکل پروٹوکول کا اطلاق اور حادثے کی وجوہات پر براہ راست قابو پانا۔'
    }
  },
  'gen_4': {
    title: {
      ar: 'التنسيق مع قائد الطوارئ وتأكيد السيطرة على الموقف',
      en: 'Coordinate with incident supervisor & confirm all-clear',
      ku: 'هەماهەنگی لەگەڵ فەرماندەی فریاگوزاری و دڵنیابوونەوە لە کۆنتڕۆڵکردنی دۆخەکە',
      fr: 'Coordonner avec le commandant des opérations et confirmer la maîtrise de la situation',
      de: 'Koordination mit dem Einsatzleiter und Bestätigung der Lagekontrolle',
      ur: 'ایمرجنسی کمانڈر سے رابطہ اور صورتحال پر مکمل قابو کی تصدیق'
    },
    description: {
      ar: 'رفع تقرير ميداني موجز والتأكد من إتمام كافة اشتراطات السلامة.',
      en: 'Submit field brief and verify all safety requirements are fulfilled.',
      ku: 'بەرزکردنەوەی ڕاپۆرتی کورتی مەیدانی و دڵنیابوون لە تەواوبوونی سەرجەم مەرجەکانی سەلامەتی.',
      fr: 'Transmettre le compte-rendu de terrain et confirmer le respect de toutes les consignes de sécurité.',
      de: 'Übermittlung des Lageberichts und Bestätigung aller Sicherheitsauflagen.',
      ur: 'مختصر فیلڈ رپورٹ پیش کرنا اور تمام حفاظتی تقاضوں کی تکمیل یقینی بنانا۔'
    }
  },

  // --- Fire Incident Tasks ---
  'fire_1': {
    title: {
      ar: 'إبلاغ غرفة العمليات وتأكيد موقع الإنذار',
      en: 'Notify Operations Control & verify alarm location',
      ku: 'ئاگادارکردنەوەی ژووری ئۆپەراسیۆنەکان و پشتڕاستکردنەوەی شوێنی زەنگەکە',
      fr: 'Notifier la salle de contrôle et vérifier l\'emplacement de l\'alarme',
      de: 'Leitstelle benachrichtigen und Alarmort verifizieren',
      ur: 'آپریشن روم کو مطلع کرنا اور الارم کے مقام کی تصدیق'
    },
    description: {
      ar: 'التحقق من تفعيل أجهزة الإنذار وتحديد الطابق والمنطقة بدقة.',
      en: 'Verify alarm trigger and accurately locate floor and zone.',
      ku: 'پشکنینی چالاکبوونی ئامێرەکانی زەنگ و دیاریکردنی نهۆم و ناوچەکە بە وردی.',
      fr: 'Vérifier le déclenchement de l\'alarme et localiser précisément l\'étage et la zone.',
      de: 'Überprüfung der Alarmauslösung und genaue Lokalisierung von Etage und Zone.',
      ur: 'الارم کے فعال ہونے کی تصدیق اور منزل و زون کا درست تعین۔'
    }
  },
  'fire_2': {
    title: {
      ar: 'التأكد من موقع الخطر دون تعريض الموظفين للمجازفة',
      en: 'Verify hazard perimeter safely without personnel endangerment',
      ku: 'دڵنیابوونەوە لە شوێنی مەترسی بەبێ خستنە مەترسی کارمەندان',
      fr: 'Vérifier le périmètre dangereux sans mettre le personnel en danger',
      de: 'Gefahrenbereich sicher und ohne Gefährdung überprüfen',
      ur: 'عملے کو خطرے میں ڈالے بغیر آگ کی نوعیت کی جانچ'
    },
    description: {
      ar: 'فحص البصري الأولي والتأكد من توافر مسار آمن للانسحاب.',
      en: 'Initial visual inspection and confirmation of clear egress route.',
      ku: 'پشکنینی بینایی سەرەتایی و دڵنیابوون لە هەبوونی ڕێڕەوی ئارام بۆ کشانەوە.',
      fr: 'Inspection visuelle initiale et confirmation d\'un itinéraire de repli sûr.',
      de: 'Erste Sichtprüfung und Sicherstellung eines sicheren Rückzugswegs.',
      ur: 'ابتدائی معائنہ اور واپسی کے لیے محفوظ راستے کی تصدیق۔'
    }
  },
  'fire_3': {
    title: {
      ar: 'توجيه شاغلي المبنى عبر مخارج الطوارئ ومخارج الهروب والسلالم',
      en: 'Direct occupants via emergency exits, fire routes, and stairs',
      ku: 'ڕێنماییکردنی دانیشتووانی بیناکە لە ڕێگەی دەرچەکانی فریاگوزاری و قادرمەکان',
      fr: 'Guider les occupants vers les issues de secours et les escaliers protégés',
      de: 'Gebäudeinsassen über Notausgänge und Treppenhäuser leiten',
      ur: 'ہنگامی اخراج کے راستوں اور سیڑھیوں کے ذریعے انخلاء کی رہنمائی'
    },
    description: {
      ar: 'توجيه شاغلي المبنى عبر مخارج الطوارئ ومخارج الهروب والسلالم.',
      en: 'Direct occupants via emergency exits, fire routes, and stairs.',
      ku: 'ڕێنماییکردنی دانیشتووانی بیناکە لە ڕێگەی دەرچەکانی فریاگوزاری و قادرمەکان.',
      fr: 'Guider les occupants vers les issues de secours et les escaliers protégés.',
      de: 'Gebäudeinsassen über Notausgänge und Treppenhäuser leiten.',
      ur: 'ایمرجنسی دروازے کھلے رکھنے اور افراد کو محفوظ اسمبلی پوائنٹ لے جانا۔'
    }
  },
  'fire_4': {
    title: {
      ar: 'التأكد من عدم وجود محتجزين داخل الغرف والمرافق الصحية',
      en: 'Ensure no individuals remain inside rooms or restrooms',
      ku: 'دڵنیابوون لە نەبوونی کەسانی گیراو لە ناو ژوورەکان و شوێنە گشتییەکاندا',
      fr: 'S\'assurer qu\'aucune personne n\'est coincée dans les pièces ou sanitaires',
      de: 'Sicherstellen, dass sich keine Personen in Räumen oder Sanitärbereichen befinden',
      ur: 'کمروں اور باتھ رومز میں کسی فرد کے نہ پھنسے ہونے کی تصدیق'
    },
    description: {
      ar: 'التأكد من عدم وجود محتجزين داخل الغرف والمرافق الصحية.',
      en: 'Ensure no individuals remain inside rooms or restrooms.',
      ku: 'دڵنیابوون لە نەبوونی کەسانی گیراو لە ناو ژوورەکان و شوێنە گشتییەکاندا.',
      fr: 'S\'assurer qu\'aucune personne n\'est coincée dans les pièces ou sanitaires.',
      de: 'Sicherstellen, dass sich keine Personen in Räumen oder Sanitärbereichen befinden.',
      ur: 'تمام کمروں اور سہولیات کی مکمل اسکیننگ اور کلیئرنس۔'
    }
  },
  'fire_5': {
    title: {
      ar: 'تأمين قواطع الكهرباء وصمامات الغاز المركزية',
      en: 'Secure electrical breakers and main gas valves',
      ku: 'پاراستنی جۆزەکانی کارەبا و زمانەی سەرەکی گاز',
      fr: 'Sécuriser les disjoncteurs et vannes d\'arrêt de gaz principales',
      de: 'Hauptsicherungen und Gasabsperrventile sichern',
      ur: 'مرکزی بجلی کے بریکرز اور گیس والوز کو محفوظ و بند کرنا'
    },
    description: {
      ar: 'تأمين قواطع الكهرباء وصمامات الغاز المركزية.',
      en: 'Secure electrical breakers and main gas valves.',
      ku: 'پاراستنی جۆزەکانی کارەبا و زمانەی سەرەکی گاز.',
      fr: 'Sécuriser les disjoncteurs et vannes d\'arrêt de gaz principales.',
      de: 'Hauptsicherungen und Gasabsperrventile sichern.',
      ur: 'بجلی کے شارٹ سرکٹ اور گیس کے دھماکوں سے بچاؤ کے لیے سپلائی بند کرنا۔'
    }
  },
  'fire_6': {
    title: {
      ar: 'إبلاغ قائد الطوارئ بحالة الإخلاء وتأكيد انتهاء المهام',
      en: 'Report evacuation headcount to Incident Commander',
      ku: 'ئاگادارکردنەوەی فەرماندەی فریاگوزاری لە دۆخی چۆڵکردن و کۆتاییهاتنی ئەرکەکان',
      fr: 'Rapporter le bilan d\'évacuation au commandant et confirmer la fin des missions',
      de: 'Räumungsstatus an den Einsatzleiter melden und Abschluss bestätigen',
      ur: 'ایمرجنسی کمانڈر کو انخلاء کی گنتی اور تکمیل کی حتمی رپورٹ دینا'
    },
    description: {
      ar: 'توثيق حالة جميع المتواجدين وتقديم التقرير النهائي.',
      en: 'Document headcount status and submit the final briefing.',
      ku: 'بەڵگەدارکردنی دۆخی سەرجەم کەسەکان و پێشکەشکردنی ڕاپۆرتی کۆتایی.',
      fr: 'Documenter l\'état de tous les occupants et soumettre le rapport final.',
      de: 'Dokumentation aller Personen und Vorlage des Abschlussberichts.',
      ur: 'تمام افراد کی موجودگی کا اندراج اور اختتامی بریفنگ پیش کرنا۔'
    }
  },

  // --- Medical Emergency Tasks ---
  'med_1': {
    title: {
      ar: 'التحقق الأولي من طبيعة الإصابة ووعي المصاب',
      en: 'Initial triage & casualty consciousness verification',
      ku: 'پشکنینی سەرەتایی سروشتی برینەکە و هۆشیاری بریندارەکە',
      fr: 'Triage initial et évaluation de l\'état de conscience',
      de: 'Erste Triage und Überprüfung des Bewusstseinszustands',
      ur: 'مریض کی صورتحال اور بنیادی علامات کی فوری جانچ (ABC)'
    },
    description: {
      ar: 'تحديد موقع المصاب وطبيعة الحالة وعدد الإصابات التقريبي.',
      en: 'Specify casualty location, nature of injuries, and estimated count.',
      ku: 'دیاریکردنی شوێنی بریندار و سروشتی برینەکە و ژمارەی خەمڵێنراوی برینداران.',
      fr: 'Préciser la localisation des blessés, la nature des blessures et le nombre estimé.',
      de: 'Standort der Verletzten, Art der Verletzungen und geschätzte Anzahl angeben.',
      ur: 'ہوش، سانس اور نبض کا فوری معائنہ اور جائے وقوعہ محفوظ رکھنا۔'
    }
  },
  'med_2': {
    title: {
      ar: 'طلب فرقة الهلال الأحمر أو الإسعاف المعتمد فوراً',
      en: 'Dispatch Red Crescent or certified ambulance service immediately',
      ku: 'داواکردنی دەستبەجێی تیمی مانگی سوور یان ئامبوڵانسی باوەڕپێکراو',
      fr: 'Alerter immédiatement les services d\'urgence médicale / ambulance',
      de: 'Notarzt / Rettungsdienst unverzüglich alarmieren',
      ur: 'سرکاری ایمبولینس (Red Crescent / 997) کو فوری طلب کرنا'
    },
    description: {
      ar: 'التأكد من عدم وجود أسلاك كهربائية مكشوفة أو مخاطر ثانوية.',
      en: 'Ensure no exposed electrical cables or secondary hazards.',
      ku: 'دڵنیابوون لە نەبوونی وایەری کارەبای دانەپۆشراو یان مەترسی لاوەکی.',
      fr: 'S\'assurer de l\'absence de câbles électriques dénudés ou de dangers secondaires.',
      de: 'Sicherstellen, dass keine freiliegenden Elektrokabel oder Folgerisiken bestehen.',
      ur: 'ایمرجنسی کال سینٹر کو صورتحال، علامات اور درست لوکیشن بتانا۔'
    }
  },
  'med_3': {
    title: {
      ar: 'توفير حقيبة الإسعافات الأولية وجهاز الصدمات الكهربائية (AED)',
      en: 'Retrieve trauma first-aid kit & automated defibrillator (AED)',
      ku: 'دابینکردنی جانتای فریاگوزاری سەرەتایی و ئامێری شۆکی دڵ (AED)',
      fr: 'Apporter la trousse de secours d\'urgence et le défibrillateur (DAE)',
      de: 'Erste-Hilfe-Notfallkoffer und Defibrillator (AED) herbeischaffen',
      ur: 'ابتدائی طبی امداد (First Aid / CPR) اور AED کی تیاری'
    },
    description: {
      ar: 'جلب الحقيبة الإسعافية ونقالة المصابين وتجهيز جهاز الإنعاش القلبي الرئوي.',
      en: 'Bring first aid kit, stretcher, and prepare cardiopulmonary resuscitation AED.',
      ku: 'هێنانی جانتای فریاگوزاری و تەختی بریندار و ئامادەکردنی ئامێری بوژانەوەی دڵ AED.',
      fr: 'Apporter la trousse de premiers secours, le brancard et préparer le défibrillateur.',
      de: 'Erste-Hilfe-Koffer und Trage herbeiholen sowie Defibrillator (AED) vorbereiten.',
      ur: 'تربیت یافتہ فرسٹ ایڈ اہلکار کی طرف سے فوری طبی مداخلت۔'
    }
  },
  'med_4': {
    title: {
      ar: 'تقديم الرعاية الإسعافية الأولية والتحكم في النزيف',
      en: 'Administer emergency first aid & hemorrhage control',
      ku: 'پێشکەشکردنی فریاگوزاری سەرەتایی و کۆنتڕۆڵکردنی خوێنبەربوون',
      fr: 'Administrer les premiers soins d\'urgence et stopper les hémorragies',
      de: 'Erste-Hilfe-Maßnahmen leisten und Blutstillung durchführen',
      ur: 'ایمبولینس کے آنے تک مریض کی مسلسل نگرانی اور لاگ بنانا'
    },
    description: {
      ar: 'فحص التنفس ومجرى الهواء والنبض وإيقاف أي نزيف نشط.',
      en: 'Assess breathing, airway, pulse, and arrest active hemorrhage.',
      ku: 'پشکنینی هەناسەدان، ڕێڕەوی هەوا، لێدانی دڵ و ڕاگرتنی خوێنبەربوونی چالاک.',
      fr: 'Vérifier la respiration, les voies aériennes, le pouls et stopper les hémorragies.',
      de: 'Atmung, Atemwege und Puls prüfen und aktive Blutungen stillen.',
      ur: 'طبی پیرامیٹرز کو ریکارڈ کرنا اور ایمبولینس عملے کو ہینڈ اوور کرنا۔'
    }
  },
  'med_5': {
    title: {
      ar: 'توثيق الإجراءات وتسليم الحالة للمسعفين المعتمدين',
      en: 'Document interventions & handover to paramedics',
      ku: 'بەڵگەدارکردنی ڕێوشوێنەکان و ڕادەستکردنی دۆخەکە بە فریاگوزارە پسپۆڕەکان',
      fr: 'Documenter les interventions et transférer la prise en charge aux ambulanciers',
      de: 'Maßnahmen dokumentieren und Patient an Rettungsdienst übergeben',
      ur: 'اقدامات کا اندراج اور مریض کو ایمبولینس عملے کے حوالے کرنا'
    },
    description: {
      ar: 'تسجيل وقت الإصابة والملاحظات الحيوية وتسليم المصاب للإسعاف.',
      en: 'Log time of injury, vitals recorded, and transfer patient to paramedic team.',
      ku: 'تۆمارکردنی کاتی برینداربوون، تێبینییە سەرەکییەکان و ڕادەستکردنی بە تیمی ئامبوڵانس.',
      fr: 'Consigner l\'heure de l\'incident, les constantes et transmettre le dossier aux ambulanciers.',
      de: 'Verletzungszeit und Vitalwerte erfassen und Übergabe an Rettungskräfte durchführen.',
      ur: 'حادثے کا وقت اور اہم علامات کا ریکارڈ پیش کرنا۔'
    }
  },

  // --- Chemical / Hazmat Tasks ---
  'chem_1': {
    title: {
      ar: 'تحديد طبيعة المادة أو الغاز والابتعاد عكس اتجاه الرياح',
      en: 'Identify hazmat substance & evacuate upwind',
      ku: 'دیاریکردنی جۆری ماددە یان گازەکە و دوورکەوتنەوە بە پێچەوانەی ئاراستەی با',
      fr: 'Identifier la substance dangereuse et évacuer dans le sens contraire du vent',
      de: 'Gefahrstoff identifizieren und gegen die Windrichtung evakuieren',
      ur: 'خطرناک کیمیائی مواد کی شناخت اور ہوا کے رخ کے مخالف انخلاء'
    },
    description: {
      ar: 'مراجعة بطاقة بيانات السلامة (MSDS) وعدم استنشاق الغازات.',
      en: 'Consult Material Safety Data Sheet (MSDS) and avoid inhalation.',
      ku: 'پێداچوونەوە بە پەڕەی زانیاری سەلامەتی ماددە (MSDS) و هەڵنەمژینی گازەکان.',
      fr: 'Consulter la fiche de données de sécurité (FDS) et éviter toute inhalation.',
      de: 'Sicherheitsdatenblatt (SDB) prüfen und Einatmen von Dämpfen vermeiden.',
      ur: 'حفاظتی ڈیٹا شیٹ (MSDS) کا جائزہ لیں اور دھوئیں سے بچیں۔'
    }
  },
  'chem_2': {
    title: {
      ar: 'إغلاق صمامات العزل الرئيسية وإيقاف أنظمة التهوية والتكييف (HVAC)',
      en: 'Shut off isolation valves & stop HVAC air handling units',
      ku: 'داخستنی زمانە سەرەکییەکانی جیاکردنەوە و ڕاگرتنی سیستەمەکانی هەواگۆڕکێ و فێنککەرەوە (HVAC)',
      fr: 'Fermer les vannes d\'isolement et arrêter le système de ventilation (CVC)',
      de: 'Hauptabsperrventile schließen und Lüftungsanlagen (HVAC) abschalten',
      ur: 'آئسولیشن والوز بند کرنا اور مرکزی ایئر کنڈیشننگ (HVAC) روکنا'
    },
    description: {
      ar: 'منع انتشار الأبخرة الكيميائية عبر قنوات التكييف المركزي.',
      en: 'Prevent chemical vapor dispersion through central air ducts.',
      ku: 'ڕێگریکردن لە بڵاوبوونەوەی هەڵمی کیمیایی لە ڕێگەی کەناڵەکانی تەبریدی ناوەندی.',
      fr: 'Empêcher la dispersion des vapeurs chimiques par les conduits d\'aération.',
      de: 'Ausbreitung chemischer Dämpfe über zentrale Lüftungskanäle verhindern.',
      ur: 'کیمیائی بخارات کو ایئر ڈکٹس کے ذریعے پھیلنے سے روکنا۔'
    }
  },
  'chem_3': {
    title: {
      ar: 'عزل المنطقة ووضع أشرطة التحذير ومنع الدخول لغير المزودين بـ PPE',
      en: 'Establish hot zone perimeter with warning barriers',
      ku: 'جیاکردنەوەی ناوچەکە و دانانی شریتی ئاگادارکردنەوە و قەدەغەکردنی چوونەژوورەوە بێ جلوبەرگی پارێزەر PPE',
      fr: 'Isoler la zone, poser un périmètre de sécurité et interdire l\'accès sans EPI',
      de: 'Gefahrenbereich absperren, Warnbänder anbringen und Zutritt nur mit PSA erlauben',
      ur: 'خطرناک زون کی ناکہ بندی اور حفاظتی کٹ (PPE) کے بغیر داخلے پر پابندی'
    },
    description: {
      ar: 'حظر دخول المشاة والآليات حتى اكتمال التطهير وتأكيد الأمان.',
      en: 'Bar pedestrians and unauthorized traffic until decontamination is complete.',
      ku: 'قەدەغەکردنی هاتووچۆی پیادە و ئۆتۆمبێلەکان تا پاککردنەوەی تەواو.',
      fr: 'Interdire l\'accès aux piétons et véhicules jusqu\'à la décontamination complète.',
      de: 'Zutritt für Fußgänger und Fahrzeuge bis zum Abschluss der Dekontamination sperren.',
      ur: 'ڈی کنٹامینیشن اور ماحول محفوظ ہونے تک رسائی سختی سے روکنا۔'
    }
  },
  'chem_4': {
    title: {
      ar: 'تأكيد إخلاء جميع العاملين نحو نقطة التجمع الآمنة المخصصة',
      en: 'Confirm complete staff evacuation to designated safety zone',
      ku: 'پشتڕاستکردنەوەی چۆڵکردنی تەواوی کارمەندان بۆ خاڵی کۆبوونەوەی ئارام',
      fr: 'Confirmer l\'évacuation complète du personnel vers le point de rassemblement sécurisé',
      de: 'Vollständige Evakuierung aller Mitarbeiter zum Sicherheits-Sammelplatz bestätigen',
      ur: 'تمام اہلکاروں کے مخصوص محفوظ اسمبلی پوائنٹ پر انخلاء کی تصدیق'
    },
    description: {
      ar: 'مطابقة الكشوفات والتأكد من سلامة كافة الأفراد المتواجدين.',
      en: 'Reconcile rosters and ensure the safety of all accounted personnel.',
      ku: 'بەراوردکردنی لیستەکان و دڵنیابوون لە سەلامەتی سەرجەم کارمەندان.',
      fr: 'Pointeur les listes d\'appel et vérifier la sécurité de l\'ensemble du personnel.',
      de: 'Anwesenheitslisten abgleichen und Unversehrtheit aller Mitarbeiter überprüfen.',
      ur: 'حاضری رجسٹرز کی تصدیق اور تمام افراد کی حفاظت کو یقینی بنانا۔'
    }
  },

  // Additional Common Safety Tasks
  'default_task_hazard_assessment': {
    title: {
      ar: 'التحقق الأولي من منطقة الخطر وتحديد المسار الآمن',
      en: 'Initial hazard assessment & safe route clearance',
      ku: 'پشکنینی سەرەتایی ناوچەی مەترسی و دیاریکردنی ڕێڕەوی ئارام',
      fr: 'Évaluation initiale de la zone de danger et sécurisation de l\'itinéraire',
      de: 'Erste Gefahrenzonenbewertung und Freigabe sicherer Rettungswege',
      ur: 'ابتدائی خطرات کا جائزہ اور محفوظ راستے کی تصدیق'
    },
    description: {
      ar: 'معاينة الموقع والتأكد من خلو ممرات الطوارئ من العوائق.',
      en: 'Inspect site and ensure emergency egress corridors are clear.',
      ku: 'پشکنینی شوێنەکە و دڵنیابوون لە نەبوونی بەربەست لە ڕێڕەوەکانی فریاگوزاری.',
      fr: 'Inspecter les lieux et s\'assurer du dégagement des couloirs d\'évacuation.',
      de: 'Vor-Ort-Prüfung und Sicherstellung freier Rettungswege.',
      ur: 'مقام کا معائنہ کریں اور ایمرجنسی راہداریوں کو رکاوٹوں سے پاک رکھیں۔'
    }
  },
  'secure_exits': {
    title: {
      ar: 'تأمين مخارج الطوارئ ومسارات الإخلاء',
      en: 'Secure emergency exits and evacuation paths',
      ku: 'پاراستنی دەرچەکانی فریاگوزاری و ڕێڕەوەکانی چۆڵکردن',
      fr: 'Sécuriser les issues de secours et les voies d\'évacuation',
      de: 'Notausgänge und Fluchtwege sichern',
      ur: 'ہنگامی اخراج کے راستوں اور انخلاء کی گزرگاہوں کو محفوظ کرنا'
    }
  },
  'account_personnel': {
    title: {
      ar: 'حصر المتواجدين والتأكد من وصول الجميع لنقاط التجمع',
      en: 'Account for all personnel at assembly points',
      ku: 'ئامارکردنی ئامادەبووان و دڵنیابوون لە گەیشتنی هەمووان بۆ خاڵەکانی کۆبوونەوە',
      fr: 'Recenser les personnes présentes et vérifier l\'arrivée aux points de rassemblement',
      de: 'Erfassung aller Anwesenden und Vollzähligkeit an Sammelstellen prüfen',
      ur: 'اسمبلی پوائنٹ پر تمام ملازمین کی گنتی اور موجودگی کی تصدیق'
    }
  }
};

// Map normalized Arabic and English titles directly to their canonical entry
const TITLE_TO_CANONICAL_KEY: Map<string, string> = new Map();

for (const [key, item] of Object.entries(STANDARD_TASK_DICTIONARY)) {
  if (item.title.ar) {
    TITLE_TO_CANONICAL_KEY.set(normalizeText(item.title.ar), key);
  }
  if (item.title.en) {
    TITLE_TO_CANONICAL_KEY.set(normalizeText(item.title.en), key);
  }
  if (item.title.ku) {
    TITLE_TO_CANONICAL_KEY.set(normalizeText(item.title.ku), key);
  }
  if (item.title.fr) {
    TITLE_TO_CANONICAL_KEY.set(normalizeText(item.title.fr), key);
  }
  if (item.title.de) {
    TITLE_TO_CANONICAL_KEY.set(normalizeText(item.title.de), key);
  }
  if (item.title.ur) {
    TITLE_TO_CANONICAL_KEY.set(normalizeText(item.title.ur), key);
  }
}

/**
 * Returns the localized title of a checklist task for any of the 6 supported languages
 */
export function getChecklistTaskTitle(
  task: {
    taskId?: string;
    titleAr?: string;
    titleEn?: string;
    titleKu?: string;
    titleFr?: string;
    titleDe?: string;
    titleUr?: string;
    [key: string]: any;
  } | null | undefined,
  lang: string = 'ar'
): string {
  if (!task) return '';
  const currentLang = (lang || 'ar').toLowerCase().slice(0, 2);

  // 1. Direct property match
  if (currentLang === 'ur' && task.titleUr?.trim()) return task.titleUr.trim();
  if (currentLang === 'ku' && task.titleKu?.trim()) return task.titleKu.trim();
  if (currentLang === 'en' && task.titleEn?.trim()) return task.titleEn.trim();
  if (currentLang === 'fr' && task.titleFr?.trim()) return task.titleFr.trim();
  if (currentLang === 'de' && task.titleDe?.trim()) return task.titleDe.trim();
  if (currentLang === 'ar' && task.titleAr?.trim()) return task.titleAr.trim();

  // 2. Canonical dictionary lookup by taskId
  if (task.taskId && STANDARD_TASK_DICTIONARY[task.taskId]) {
    const entry = STANDARD_TASK_DICTIONARY[task.taskId];
    if (entry.title[currentLang as keyof MultilingualText]) {
      return entry.title[currentLang as keyof MultilingualText]!;
    }
  }

  // 3. Canonical dictionary lookup by fuzzy matching Arabic title
  const normAr = normalizeText(task.titleAr);
  if (normAr && TITLE_TO_CANONICAL_KEY.has(normAr)) {
    const canonicalKey = TITLE_TO_CANONICAL_KEY.get(normAr)!;
    const entry = STANDARD_TASK_DICTIONARY[canonicalKey];
    if (entry && entry.title[currentLang as keyof MultilingualText]) {
      return entry.title[currentLang as keyof MultilingualText]!;
    }
  }

  // 4. Canonical dictionary lookup by fuzzy matching English title
  const normEn = normalizeText(task.titleEn);
  if (normEn && TITLE_TO_CANONICAL_KEY.has(normEn)) {
    const canonicalKey = TITLE_TO_CANONICAL_KEY.get(normEn)!;
    const entry = STANDARD_TASK_DICTIONARY[canonicalKey];
    if (entry && entry.title[currentLang as keyof MultilingualText]) {
      return entry.title[currentLang as keyof MultilingualText]!;
    }
  }

  // 5. Intelligent Fallback
  if (currentLang === 'ar') {
    return task.titleAr || task.titleEn || task.titleKu || '';
  }
  if (currentLang === 'ur') {
    return task.titleUr || task.titleEn || task.titleAr || '';
  }
  if (currentLang === 'en') {
    return task.titleEn || task.titleAr || task.titleKu || '';
  }
  if (currentLang === 'ku') {
    return task.titleKu || task.titleEn || task.titleAr || '';
  }
  if (currentLang === 'fr') {
    return task.titleFr || task.titleEn || task.titleAr || '';
  }
  if (currentLang === 'de') {
    return task.titleDe || task.titleEn || task.titleAr || '';
  }

  return task.titleAr || task.titleEn || '';
}

/**
 * Returns the localized description of a checklist task
 */
export function getChecklistTaskDescription(
  task: {
    taskId?: string;
    description?: string;
    descriptionEn?: string;
    descriptionKu?: string;
    descriptionFr?: string;
    descriptionDe?: string;
    descriptionUr?: string;
    titleAr?: string;
    titleEn?: string;
    [key: string]: any;
  } | null | undefined,
  lang: string = 'ar'
): string {
  if (!task) return '';
  const currentLang = (lang || 'ar').toLowerCase().slice(0, 2);

  // 1. Direct property match
  if (currentLang === 'ur' && task.descriptionUr?.trim()) return task.descriptionUr.trim();
  if (currentLang === 'ku' && task.descriptionKu?.trim()) return task.descriptionKu.trim();
  if (currentLang === 'en' && task.descriptionEn?.trim()) return task.descriptionEn.trim();
  if (currentLang === 'fr' && task.descriptionFr?.trim()) return task.descriptionFr.trim();
  if (currentLang === 'de' && task.descriptionDe?.trim()) return task.descriptionDe.trim();
  if (currentLang === 'ar' && task.description?.trim()) return task.description.trim();

  // 2. Canonical dictionary lookup
  let canonicalKey = task.taskId && STANDARD_TASK_DICTIONARY[task.taskId] ? task.taskId : null;
  if (!canonicalKey && task.titleAr) {
    const norm = normalizeText(task.titleAr);
    if (TITLE_TO_CANONICAL_KEY.has(norm)) {
      canonicalKey = TITLE_TO_CANONICAL_KEY.get(norm)!;
    }
  }

  if (canonicalKey && STANDARD_TASK_DICTIONARY[canonicalKey]?.description) {
    const localized = STANDARD_TASK_DICTIONARY[canonicalKey].description![currentLang as keyof MultilingualText];
    if (localized) return localized;
  }

  // 3. Fallbacks
  if (currentLang === 'ar') return task.description || '';
  if (currentLang === 'ur') return task.descriptionUr || task.description || '';
  return task.descriptionEn || task.description || '';
}

/**
 * Returns the localized title of a checklist template or SOP
 */
export function getChecklistTitle(
  checklist: {
    checklistId?: string;
    emergencyTypeId?: string;
    emergencyTypeName?: string;
    titleAr?: string;
    titleEn?: string;
    titleKu?: string;
    titleFr?: string;
    titleDe?: string;
    titleUr?: string;
    [key: string]: any;
  } | null | undefined,
  lang: string = 'ar'
): string {
  if (!checklist) return '';
  const currentLang = (lang || 'ar').toLowerCase().slice(0, 2);

  // 1. Direct property match
  if (currentLang === 'ur' && checklist.titleUr?.trim()) return checklist.titleUr.trim();
  if (currentLang === 'ku' && checklist.titleKu?.trim()) return checklist.titleKu.trim();
  if (currentLang === 'en' && checklist.titleEn?.trim()) return checklist.titleEn.trim();
  if (currentLang === 'fr' && checklist.titleFr?.trim()) return checklist.titleFr.trim();
  if (currentLang === 'de' && checklist.titleDe?.trim()) return checklist.titleDe.trim();
  if (currentLang === 'ar' && checklist.titleAr?.trim()) return checklist.titleAr.trim();

  // 2. Format title if based on emergency type
  const typeName = checklist.emergencyTypeName || '';
  if (typeName) {
    if (currentLang === 'ar') return `خطة وإجراءات الاستجابة لحالات ${typeName}`;
    if (currentLang === 'ur') return `ہنگامی ردعمل پلان اور طریقہ کار برائے ${typeName}`;
    if (currentLang === 'en') return `Response Protocol & Checklist for ${typeName}`;
    if (currentLang === 'ku') return `پلان و ڕێکارەکانی وەڵامدانەوە بۆ حاڵەتەکانی ${typeName}`;
    if (currentLang === 'fr') return `Protocole et liste de contrôle d'intervention pour ${typeName}`;
    if (currentLang === 'de') return `Reaktionsplan und Checkliste für ${typeName}`;
  }

  // 3. Fallbacks
  if (currentLang === 'ar') return checklist.titleAr || checklist.titleEn || '';
  if (currentLang === 'ur') return checklist.titleUr || checklist.titleEn || checklist.titleAr || '';
  if (currentLang === 'en') return checklist.titleEn || checklist.titleAr || '';
  if (currentLang === 'ku') return checklist.titleKu || checklist.titleEn || checklist.titleAr || '';
  if (currentLang === 'fr') return checklist.titleFr || checklist.titleEn || checklist.titleAr || '';
  if (currentLang === 'de') return checklist.titleDe || checklist.titleEn || checklist.titleAr || '';

  return checklist.titleAr || checklist.titleEn || '';
}

/**
 * Returns the localized description of a checklist template
 */
export function getChecklistDescription(
  checklist: {
    checklistId?: string;
    emergencyTypeId?: string;
    emergencyTypeName?: string;
    description?: string;
    descriptionEn?: string;
    descriptionKu?: string;
    descriptionFr?: string;
    descriptionDe?: string;
    descriptionUr?: string;
    [key: string]: any;
  } | null | undefined,
  lang: string = 'ar'
): string {
  if (!checklist) return '';
  const currentLang = (lang || 'ar').toLowerCase().slice(0, 2);

  if (currentLang === 'ur' && checklist.descriptionUr?.trim()) return checklist.descriptionUr.trim();
  if (currentLang === 'ku' && checklist.descriptionKu?.trim()) return checklist.descriptionKu.trim();
  if (currentLang === 'en' && checklist.descriptionEn?.trim()) return checklist.descriptionEn.trim();
  if (currentLang === 'fr' && checklist.descriptionFr?.trim()) return checklist.descriptionFr.trim();
  if (currentLang === 'de' && checklist.descriptionDe?.trim()) return checklist.descriptionDe.trim();
  if (currentLang === 'ar' && checklist.description?.trim()) return checklist.description.trim();

  const typeName = checklist.emergencyTypeName || '';
  if (typeName) {
    if (currentLang === 'ar') {
      return `بروتوكول السلامة المعتمد للاستجابة لحالات ${typeName}. يرجى التقيد بالترتيب الزمني وتوثيق الإجراءات.`;
    }
    if (currentLang === 'ur') {
      return `${typeName} کے لیے تصدیق شدہ حفاظتی پروٹوکول۔ براہ کرم زمانی ترتیب پر عمل کریں اور کارروائیوں کو قلمبند کریں۔`;
    }
    if (currentLang === 'en') {
      return `Certified safety response protocol for ${typeName}. Please follow chronological order and document actions.`;
    }
    if (currentLang === 'ku') {
      return `پرۆتۆکۆلی سەلامەتی پەسەندکراو بۆ وەڵامدانەوەی حاڵەتەکانی ${typeName}. تکایە پابەندی ڕیزبەندی کاتی و بەڵگەدارکردن بن.`;
    }
    if (currentLang === 'fr') {
      return `Protocole de sécurité certifié pour les cas de ${typeName}. Veuillez respecter l'ordre chronologique et documenter les actions.`;
    }
    if (currentLang === 'de') {
      return `Zertifiziertes Notfallprotokoll für ${typeName}. Bitte chronologische Reihenfolge beachten und Maßnahmen dokumentieren.`;
    }
  }

  if (currentLang === 'ar') return checklist.description || '';
  if (currentLang === 'ur') return checklist.descriptionUr || checklist.description || '';
  return checklist.descriptionEn || checklist.description || '';
}

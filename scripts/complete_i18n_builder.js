import fs from 'fs';

// 1. Extract existing translations from i18n.ts
const content = fs.readFileSync('i18n.ts', 'utf8');

const extractLangBlock = (src, langCode) => {
  const marker = `${langCode}: {\n    translation: {`;
  const altMarker = `${langCode}: {\r\n    translation: {`;
  let startIdx = src.indexOf(marker);
  if (startIdx === -1) startIdx = src.indexOf(altMarker);
  if (startIdx === -1) return null;

  const translationStart = src.indexOf('{', startIdx) + 1;
  const objectStart = src.indexOf('{', translationStart);
  let depth = 1;
  let i = objectStart + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  const block = src.substring(objectStart, i);
  const dict = {};
  const regex = /"([^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = regex.exec(block)) !== null) {
    dict[match[1]] = match[2];
  }
  return dict;
};

const languages = ['ar', 'en', 'ku', 'fr', 'de'];
const data = {};
for (const lang of languages) {
  data[lang] = extractLangBlock(content, lang) || {};
}

// 2. New Keys across all 5 languages
const newKeys = {
  unauthorized_access: {
    "ar": "غير مصرح لك بالوصول",
    "en": "Unauthorized Access",
    "ku": "ڕێگەت پێ نەدراوە بۆ دەستڕاگەیشتن",
    "fr": "Accès non autorisé",
    "de": "Zugriff nicht autorisiert"
},
  unauthorized_access_desc: {
    "ar": "هذه اللوحة مخصصة لمدراء النظام فقط لمراقبة الأجهزة العالمية.",
    "en": "This dashboard is restricted to system administrators for global device monitoring.",
    "ku": "ئەم داشبۆردە تەنها بۆ بەڕێوەبەرانی سیستەمە بۆ چاودێریکردنی ئامێرە جیهانییەکان.",
    "fr": "Ce tableau de bord est réservé aux administrateurs pour la surveillance globale des appareils.",
    "de": "Dieses Dashboard ist Administratoren zur globalen Geräteüberwachung vorbehalten."
},
  back_to_home: {
    "ar": "العودة للرئيسية",
    "en": "Back to Dashboard",
    "ku": "گەڕانەوە بۆ سەرەکی",
    "fr": "Retour au tableau de bord",
    "de": "Zurück zur Übersicht"
},
  live_stream_active: {
    "ar": "بث لحظي نشط",
    "en": "Live Stream Active",
    "ku": "پەخشی ڕاستەوخۆ چالاکە",
    "fr": "Flux en direct actif",
    "de": "Live-Stream aktiv"
},
  devices_map_sub: {
    "ar": "تحديد دقيق عبر GPS و IP Geolocation مع إدارة النزاعات وحفظ السجل الزمني",
    "en": "Precise tracking via GPS & IP Geolocation with conflict resolution and history logging",
    "ku": "دیاریکردنی ورد لە ڕێگەی GPS و IP Geolocation لەگەڵ بەڕێوەبردنی ناکۆکییەکان و پاراستنی مێژوو",
    "fr": "Localisation précise via GPS et IP avec résolution de conflits et historique",
    "de": "Präzise Ortung über GPS & IP-Geolokalisierung mit Konfliktmanagement und Verlauf"
},
  check_my_location_now: {
    "ar": "فحص موقعي الآن",
    "en": "Check My Location Now",
    "ku": "پشکنینی شوێنەکەم ئێستا",
    "fr": "Vérifier ma position maintenant",
    "de": "Meinen Standort jetzt prüfen"
},
  back_to_admin: {
    "ar": "العودة للإدارة",
    "en": "Back to Admin Panel",
    "ku": "گەڕانەوە بۆ بەڕێوەبردن",
    "fr": "Retour à l'administration",
    "de": "Zurück zur Administration"
},
  location_version_label: {
    "ar": "إصدار الموقع: v{{version}}",
    "en": "Location Version: v{{version}}",
    "ku": "وەشانی شوێن: v{{version}}",
    "fr": "Version de localisation : v{{version}}",
    "de": "Standortversion: v{{version}}"
},
  installation_id_label: {
    "ar": "معرف التثبيت: {{instId}} | الجهاز: {{deviceId}}",
    "en": "Installation ID: {{instId}} | Device: {{deviceId}}",
    "ku": "ناسنامەی دامەزراندن: {{instId}} | ئامێر: {{deviceId}}",
    "fr": "ID d'installation : {{instId}} | Appareil : {{deviceId}}",
    "de": "Installations-ID: {{instId}} | Gerät: {{deviceId}}"
},
  firestore_registered_fields: {
    "ar": "الحقول المسجلة في Firestore",
    "en": "Firestore Registered Fields",
    "ku": "خانە تۆمارکراوەکان لە Firestore",
    "fr": "Champs enregistrés dans Firestore",
    "de": "In Firestore registrierte Felder"
},
  user_id_label: {
    "ar": "المستخدم (userId)",
    "en": "User ID (userId)",
    "ku": "بەکارهێنەر (userId)",
    "fr": "Identifiant utilisateur (userId)",
    "de": "Benutzer-ID (userId)"
},
  user_name_label: {
    "ar": "اسم المستخدم (userName)",
    "en": "User Name (userName)",
    "ku": "ناوی بەکارهێنەر (userName)",
    "fr": "Nom d'utilisateur (userName)",
    "de": "Benutzername (userName)"
},
  current_session_id: {
    "ar": "جلسة العمل الحالية (sessionId)",
    "en": "Current Session ID (sessionId)",
    "ku": "دانیشتنی ئێستا (sessionId)",
    "fr": "ID de session actuelle (sessionId)",
    "de": "Aktuelle Sitzungs-ID (sessionId)"
},
  active_session_id: {
    "ar": "الجلسة النشطة (activeSessionId)",
    "en": "Active Session ID (activeSessionId)",
    "ku": "دانیشتنی چالاک (activeSessionId)",
    "fr": "ID de session active (activeSessionId)",
    "de": "Aktive Sitzungs-ID (activeSessionId)"
},
  operating_system_label: {
    "ar": "نظام التشغيل (operatingSystem)",
    "en": "Operating System (operatingSystem)",
    "ku": "سیستەمی کارپێکردن (operatingSystem)",
    "fr": "Système d'exploitation (operatingSystem)",
    "de": "Betriebssystem (operatingSystem)"
},
  browser_label: {
    "ar": "المتصفح (browser)",
    "en": "Web Browser (browser)",
    "ku": "وێبگەڕ (browser)",
    "fr": "Navigateur (browser)",
    "de": "Webbrowser (browser)"
},
  device_type_label: {
    "ar": "نوع الجهاز (deviceType)",
    "en": "Device Type (deviceType)",
    "ku": "جۆری ئامێر (deviceType)",
    "fr": "Type d'appareil (deviceType)",
    "de": "Gerätetyp (deviceType)"
},
  ip_address_label: {
    "ar": "عنوان IP (ipAddress)",
    "en": "IP Address (ipAddress)",
    "ku": "ناونیشانی IP (ipAddress)",
    "fr": "Adresse IP (ipAddress)",
    "de": "IP-Adresse (ipAddress)"
},
  country_label: {
    "ar": "الدولة (country / countryCode)",
    "en": "Country (country / countryCode)",
    "ku": "وڵات (country / countryCode)",
    "fr": "Pays (country / countryCode)",
    "de": "Land (country / countryCode)"
},
  city_region_label: {
    "ar": "المدينة والمنطقة (city / region)",
    "en": "City & Region (city / region)",
    "ku": "شار و ناوچە (city / region)",
    "fr": "Ville et région (city / region)",
    "de": "Stadt & Region (city / region)"
},
  latitude_field_label: {
    "ar": "خط العرض (latitude)",
    "en": "Latitude (latitude)",
    "ku": "هێڵی پانی (latitude)",
    "fr": "Latitude (latitude)",
    "de": "Breitengrad (latitude)"
},
  longitude_field_label: {
    "ar": "خط الطول (longitude)",
    "en": "Longitude (longitude)",
    "ku": "هێڵی درێژی (longitude)",
    "fr": "Longitude (longitude)",
    "de": "Längengrad (longitude)"
},
  location_source_label: {
    "ar": "مصدر الموقع (locationSource)",
    "en": "Location Source (locationSource)",
    "ku": "سەرچاوەی شوێن (locationSource)",
    "fr": "Source de localisation (locationSource)",
    "de": "Standortquelle (locationSource)"
},
  location_accuracy_label: {
    "ar": "دقة الموقع (locationAccuracy)",
    "en": "Location Accuracy (locationAccuracy)",
    "ku": "وردبینی شوێن (locationAccuracy)",
    "fr": "Précision de position (locationAccuracy)",
    "de": "Standortgenauigkeit (locationAccuracy)"
},
  location_status_label: {
    "ar": "حالة الموقع (locationStatus)",
    "en": "Location Status (locationStatus)",
    "ku": "دۆخی شوێن (locationStatus)",
    "fr": "Statut de localisation (locationStatus)",
    "de": "Standortstatus (locationStatus)"
},
  location_observed_at_label: {
    "ar": "توقيت الرصد الفعلي (locationObservedAt)",
    "en": "Observed At (locationObservedAt)",
    "ku": "کاتی ڕوانین (locationObservedAt)",
    "fr": "Heure d'observation (locationObservedAt)",
    "de": "Erfassungszeit (locationObservedAt)"
},
  location_updated_at_label: {
    "ar": "توقيت التحديث بالخادم (locationUpdatedAt)",
    "en": "Server Updated At (locationUpdatedAt)",
    "ku": "کاتی نوێکردنەوە لە سێرڤەر (locationUpdatedAt)",
    "fr": "Mis à jour sur le serveur (locationUpdatedAt)",
    "de": "Server-Aktualisierungszeit (locationUpdatedAt)"
},
  last_ip_check_label: {
    "ar": "آخر فحص IP (lastIpCheckAt)",
    "en": "Last IP Check (lastIpCheckAt)",
    "ku": "دوایین پشکنینی IP (lastIpCheckAt)",
    "fr": "Dernière vérification IP (lastIpCheckAt)",
    "de": "Letzte IP-Prüfung (lastIpCheckAt)"
},
  last_known_country_label: {
    "ar": "آخر دولة معروفة (lastKnownCountry)",
    "en": "Last Known Country (lastKnownCountry)",
    "ku": "دوایین وڵاتی ناسراو (lastKnownCountry)",
    "fr": "Dernier pays connu (lastKnownCountry)",
    "de": "Zuletzt bekanntes Land (lastKnownCountry)"
},
  last_known_city_label: {
    "ar": "آخر مدينة معروفة (lastKnownCity)",
    "en": "Last Known City (lastKnownCity)",
    "ku": "دوایین شاری ناسراو (lastKnownCity)",
    "fr": "Dernière ville connue (lastKnownCity)",
    "de": "Zuletzt bekannte Stadt (lastKnownCity)"
},
  connection_status_label: {
    "ar": "حالة الاتصال (isOnline)",
    "en": "Connection Status (isOnline)",
    "ku": "دۆخی پەیوەندی (isOnline)",
    "fr": "Statut de connexion (isOnline)",
    "de": "Verbindungsstatus (isOnline)"
},
  first_seen_label: {
    "ar": "أول ظهور (firstSeen)",
    "en": "First Seen (firstSeen)",
    "ku": "یەکەم دەرکەوتن (firstSeen)",
    "fr": "Première apparition (firstSeen)",
    "de": "Erste Sichtung (firstSeen)"
},
  last_seen_label: {
    "ar": "آخر ظهور (lastSeen)",
    "en": "Last Seen (lastSeen)",
    "ku": "دوایین دەرکەوتن (lastSeen)",
    "fr": "Dernière apparition (lastSeen)",
    "de": "Zuletzt gesehen (lastSeen)"
},
  notification_permission_label: {
    "ar": "إذن الإشعارات (notificationEnabled)",
    "en": "Notifications Permission (notificationEnabled)",
    "ku": "مۆڵەتی ئاگادارکردنەوە (notificationEnabled)",
    "fr": "Autorisation de notification (notificationEnabled)",
    "de": "Benachrichtigungsberechtigung (notificationEnabled)"
},
  fcm_token_field_label: {
    "ar": "رمز FCM Token",
    "en": "FCM Device Token",
    "ku": "کۆدی ئامێری FCM",
    "fr": "Jeton d'appareil FCM",
    "de": "FCM-Gerätetoken"
},
  enabled: {
    "ar": "مفعل",
    "en": "Enabled",
    "ku": "چالاک",
    "fr": "Activé",
    "de": "Aktiviert"
},
  disabled: {
    "ar": "معطل",
    "en": "Disabled",
    "ku": "ناچالاک",
    "fr": "Désactivé",
    "de": "Deaktiviert"
},
  not_available: {
    "ar": "غير متوفر",
    "en": "N/A",
    "ku": "بەردەست نییە",
    "fr": "Non disponible",
    "de": "Nicht verfügbar"
},
  location_movement_history: {
    "ar": "سجل تحركات وتغيرات الموقع الجغرافي (locationHistory)",
    "en": "Geographic Movement & Location History (locationHistory)",
    "ku": "تۆماری جوڵە و گۆڕانکارییەکانی شوێن (locationHistory)",
    "fr": "Historique des déplacements géographiques (locationHistory)",
    "de": "Geografischer Bewegungs- & Standortverlauf (locationHistory)"
},
  records_count_label: {
    "ar": "{{count}} سجلات مسجلة",
    "en": "{{count}} records logged",
    "ku": "{{count}} تۆمار",
    "fr": "{{count}} enregistrements",
    "de": "{{count}} Einträge protokolliert"
},
  loading_history: {
    "ar": "جاري تحميل السجل...",
    "en": "Loading history...",
    "ku": "بارکردنی مێژوو...",
    "fr": "Chargement de l'historique...",
    "de": "Verlauf wird geladen..."
},
  no_history_yet: {
    "ar": "لا يوجد سجل تحركات مسجل لهذا الجهاز حتى الآن (يتم التسجيل تلقائياً عند تغيير الدولة أو المدينة أو الحركة).",
    "en": "No movement history recorded for this device yet (logged automatically upon location shifts).",
    "ku": "هیچ تۆمارێکی پێشووی جوڵە نییە (بە شێوەیەکی ئۆتۆماتیکی لە کاتی گۆڕینی شوێن تۆمار دەکرێت).",
    "fr": "Aucun historique de déplacement pour cet appareil (enregistré lors des changements de position).",
    "de": "Noch kein Bewegungsverlauf erfasst (wird bei Standortänderungen automatisch protokolliert)."
},
  periodic_location_update: {
    "ar": "تحديث دوري للموقع",
    "en": "Periodic Location Update",
    "ku": "نوێکردنەوەی خولیی شوێن",
    "fr": "Mise à jour périodique de position",
    "de": "Periodische Standortaktualisierung"
},
  accurate_gps_tag: {
    "ar": "🛰️ GPS دقيق",
    "en": "🛰️ Accurate GPS",
    "ku": "🛰️ GPSی ورد",
    "fr": "🛰️ GPS précis",
    "de": "🛰️ Präzises GPS"
},
  approx_ip_tag: {
    "ar": "🌐 تقريبي IP",
    "en": "🌐 Approx IP",
    "ku": "🌐 نزیکەیی IP",
    "fr": "🌐 IP approx.",
    "de": "🌐 Ungefähre IP"
},
  delete_error: {
    "ar": "حدث خطأ أثناء الحذف",
    "en": "An error occurred while deleting",
    "ku": "هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا",
    "fr": "Une erreur est survenue lors de la suppression",
    "de": "Fehler beim Löschen aufgetreten"
},
  reset_filter: {
    "ar": "إعادة تعيين",
    "en": "Reset Filter",
    "ku": "ڕێکخستنەوەی فلتەر",
    "fr": "Réinitialiser les filtres",
    "de": "Filter zurücksetzen"
},
  settings_save_failed: {
    "ar": "فشل حفظ الإعدادات",
    "en": "Failed to save settings",
    "ku": "پاشەکەوتکردنی ڕێکخستنەکان سەرکەوتوو نەبوو",
    "fr": "Échec de l'enregistrement des paramètres",
    "de": "Speichern der Einstellungen fehlgeschlagen"
},
  delete_failed: {
    "ar": "فشل الحذف",
    "en": "Deletion failed",
    "ku": "سڕینەوە سەرکەوتوو نەبوو",
    "fr": "Échec de la suppression",
    "de": "Löschen fehlgeschlagen"
},
  // Mobile diagnostics & push
  fcm_push_service: {
    ar: "خدمة الإشعارات الفورية (FCM Push)",
    en: "Push Notifications Service (FCM)",
    ku: "خزمەتگوزاری ئاگادارکردنەوەی خێرا (FCM Push)",
    fr: "Service de notifications push (FCM)",
    de: "Push-Benachrichtigungsdienst (FCM)"
  },
  fcm_push_desc: {
    ar: "استقبال التنبيهات في الخلفية والشاشة مقفلة",
    en: "Receive alerts in the background and on lock screen",
    ku: "وەرگرتنی ئاگادارکردنەوەکان لە پاشبنەما و لەسەر شاشەی قفڵکراو",
    fr: "Recevoir des alertes en arrière-plan et écran verrouillé",
    de: "Warnungen im Hintergrund und auf dem Sperrbildschirm empfangen"
  },
  status_granted: {
    ar: "مفعّل (Granted)",
    en: "Granted",
    ku: "ڕێگەپێدراو (Granted)",
    fr: "Autorisé",
    de: "Erteilt"
  },
  status_not_granted: {
    ar: "غير مفعّل",
    en: "Not Granted",
    ku: "ڕێگەنەدراو",
    fr: "Non autorisé",
    de: "Nicht erteilt"
  },
  request_notification_permission: {
    ar: "طلب وتفعيل إذن الإشعارات",
    en: "Request & Enable Notification Permission",
    ku: "داواکردن و چالاککردنی مۆڵەتی ئاگادارکردنەوە",
    fr: "Demander et activer l'autorisation de notification",
    de: "Benachrichtigungsberechtigung anfordern & aktivieren"
  },
  fcm_device_token: {
    ar: "رمز تسجيل الجهاز (FCM Token)",
    en: "Device Registration Token (FCM)",
    ku: "کۆدی تۆمارکردنی ئامێر (FCM Token)",
    fr: "Jeton d'enregistrement de l'appareil (FCM)",
    de: "Geräteregistrierungstoken (FCM)"
  },
  token_not_registered_hint: {
    ar: "لم يتم تسجيل توكن بعد. اضغط منح الصلاحية أدناه.",
    en: "No token registered yet. Click grant permission below.",
    ku: "هێشتا هیچ تۆکنێک تۆمار نەکراوە. لە خوارەوە کرتە لەسەر بەخشینی مۆڵەت بکە.",
    fr: "Aucun jeton enregistré. Cliquez sur autoriser ci-dessous.",
    de: "Noch kein Token registriert. Klicken Sie unten auf Erlauben."
  },
  android_channel_id: {
    ar: "قناة إنذارات أندرويد (Channel ID)",
    en: "Android Alert Channel (Channel ID)",
    ku: "کەناڵی ئاگادارکردنەوەی ئەندرۆید (Channel ID)",
    fr: "Canal d'alerte Android (Channel ID)",
    de: "Android-Alarmkanal (Channel ID)"
  },
  priority_level: {
    ar: "مستوى الأولوية (Priority)",
    en: "Priority Level",
    ku: "ئاستی گرنگی (Priority)",
    fr: "Niveau de priorité",
    de: "Prioritätsstufe"
  },
  high_max_priority: {
    ar: "High / Max (صوت + اهتزاز)",
    en: "High / Max (Sound + Vibration)",
    ku: "بەرز / ئەوپەڕ (دەنگ + لەرزین)",
    fr: "Élevé / Max (Son + Vibration)",
    de: "Hoch / Max (Ton + Vibration)"
  },
  send_test_push_btn: {
    ar: "إرسال إشعار فحص حقيقي لهذا الجهاز",
    en: "Send Real Test Notification to this Device",
    ku: "ناردنی ئاگادارکردنەوەی تاقیکاری ڕاستەقینە بۆ ئەم ئامێرە",
    fr: "Envoyer une vraie notification de test à cet appareil",
    de: "Echte Testbenachrichtigung an dieses Gerät senden"
  },
  notifications_denied_warning: {
    ar: "تم حظر إشعارات المتصفح لهذا الموقع. لإعادة التفعيل: انقر على أيقونة القفل أو إعدادات الموقع بجانب شريط العنوان واختر 'سماح' للإشعارات، ثم أعد الفحص.",
    en: "Browser notifications are blocked for this site. To re-enable: click the lock icon or site settings in the address bar, select 'Allow' for notifications, then recheck.",
    ku: "ئاگادارکردنەوەکانی وێبگەڕ بۆ ئەم ماڵپەڕە بلۆککراون. بۆ چالاککردنەوە: کرتە لەسەر قفڵ یان ڕێکخستنەکانی ماڵپەڕ لە تەنیشت ناونیشان بکە و 'ڕێگەپێدان' هەڵبژێرە، پاشان دووبارە پشکنین بکەرەوە.",
    fr: "Les notifications du navigateur sont bloquées pour ce site. Pour réactiver : cliquez sur l'icône de cadenas ou les paramètres du site dans la barre d'adresse, choisissez 'Autoriser' puis revérifiez.",
    de: "Browser-Benachrichtigungen sind für diese Website blockiert. Zum Reaktivieren: Klicken Sie auf das Schloss-Symbol oder die Website-Einstellungen in der Adressleiste, wählen Sie 'Zulassen' und prüfen Sie erneut."
  },
  gps_field_service: {
    ar: "خدمات الموقع الميداني (GPS Tracking)",
    en: "Field Location Services (GPS Tracking)",
    ku: "خزمەتگوزارییەکانی شوێنی مەیدانی (GPS Tracking)",
    fr: "Services de localisation sur le terrain (GPS)",
    de: "Feld-Ortungsdienste (GPS-Tracking)"
  },
  gps_field_desc: {
    ar: "تتبع المناوبة ومشاركة الموقع الحي على خريطة ERS",
    en: "Shift tracking and live location sharing on the ERS map",
    ku: "شوێنپێهەڵگرتنی ئێشکگری و بەشداریکردنی شوێنی ڕاستەوخۆ لەسەر نەخشەی ERS",
    fr: "Suivi des gardes et partage de localisation en direct sur la carte ERS",
    de: "Schichtverfolgung und Live-Standortfreigabe auf der ERS-Karte"
  },
  gps_granted: {
    ar: "GPS مصرح به",
    en: "GPS Authorized",
    ku: "GPS ڕێگەپێدراو",
    fr: "GPS autorisé",
    de: "GPS autorisiert"
  },
  shift_location_sharing_active: {
    ar: "مشاركة الموقع أثناء المناوبة: نشطة الآن",
    en: "Shift Location Sharing: Currently Active",
    ku: "بەشداریکردنی شوێن لە کاتی ئێشکگری: ئێستا چالاکە",
    fr: "Partage de position pendant la garde : Actuellement actif",
    de: "Standortfreigabe während der Schicht: Derzeit aktiv"
  },
  shift_location_sharing_inactive: {
    ar: "مشاركة الموقع أثناء المناوبة: متوقفة",
    en: "Shift Location Sharing: Inactive",
    ku: "بەشداریکردنی شوێن لە کاتی ئێشکگری: ڕاگیراوە",
    fr: "Partage de position pendant la garde : Inactif",
    de: "Standortfreigabe während der Schicht: Inaktiv"
  },
  shift_sharing_active_desc: {
    ar: "يتم تحديث موقعك الميداني ودقته تلقائياً على خريطة العمليات",
    en: "Your field location and accuracy are automatically updated on the ops map",
    ku: "شوێنی مەیدانی و وردبینییەکەت بە شێوەیەکی ئۆتۆماتیکی لەسەر نەخشەی ئۆپەراسیۆن نوێ دەکرێتەوە",
    fr: "Votre position et précision sur le terrain sont mises à jour sur la carte des opérations",
    de: "Ihr Feldstandort und Ihre Genauigkeit werden automatisch auf der Einsatzkarte aktualisiert"
  },
  shift_sharing_inactive_desc: {
    ar: "اضغط لتفعيل مشاركة موقعك المباشر مع غرفة العمليات",
    en: "Click to enable sharing your live location with the operations room",
    ku: "کرتە بکە بۆ چالاککردنی بەشداریکردنی شوێنی ڕاستەوخۆ لەگەڵ ژووری ئۆپەراسیۆن",
    fr: "Cliquez pour activer le partage de votre position en direct avec la salle des opérations",
    de: "Klicken Sie, um die Live-Standortfreigabe für die Einsatzzentrale zu aktivieren"
  },
  stop_location_sharing: {
    ar: "إيقاف مشاركة الموقع",
    en: "Stop Location Sharing",
    ku: "ڕاگرتنی بەشداریکردنی شوێن",
    fr: "Arrêter le partage de position",
    de: "Standortfreigabe beenden"
  },
  start_location_sharing: {
    ar: "بدء مشاركة الموقع أثناء المناوبة",
    en: "Start Location Sharing on Shift",
    ku: "دەستپێکردنی بەشداریکردنی شوێن لە کاتی ئێشکگری",
    fr: "Démarrer le partage de position pendant la garde",
    de: "Standortfreigabe während der Schicht starten"
  },
  latitude_label: {
    ar: "خط العرض (Latitude)",
    en: "Latitude",
    ku: "هێڵی پانی (Latitude)",
    fr: "Latitude",
    de: "Breitengrad (Latitude)"
  },
  longitude_label: {
    ar: "خط الطول (Longitude)",
    en: "Longitude",
    ku: "هێڵی درێژی (Longitude)",
    fr: "Longitude",
    de: "Längengrad (Longitude)"
  },
  accuracy_label: {
    ar: "دقة الموقع (Accuracy)",
    en: "Location Accuracy",
    ku: "وردبینی شوێن (Accuracy)",
    fr: "Précision de localisation",
    de: "Standortgenauigkeit"
  },
  measurement_time: {
    ar: "توقيت القياس",
    en: "Measurement Timestamp",
    ku: "کاتی پێوانەکردن",
    fr: "Heure de mesure",
    de: "Messzeitpunkt"
  },
  global_devices_map_card_title: {
    ar: "نظام مراقبة الأجهزة والخريطة العالمية (Leaflet)",
    en: "Global Device Tracking & Live Map System (Leaflet)",
    ku: "سیستەمی چاودێری ئامێرەکان و نەخشەی جیهانی (Leaflet)",
    fr: "Surveillance globale des appareils et cartographie (Leaflet)",
    de: "Globales Geräteüberwachungs- & Kartensystem (Leaflet)"
  },
  global_devices_map_card_desc: {
    ar: "لوحة الإدارة الشاملة لتتبع أجهزة المستخدمين عالمياً، وتحديد مصادر المواقع (GPS / IP)، ومراقبة الحضور والنزاعات.",
    en: "Comprehensive admin dashboard to monitor devices globally, detect location sources (GPS/IP), and oversee presence.",
    ku: "داشبۆردی بەڕێوەبردنی گشتگیر بۆ چاودێری ئامێرەکان لە جیهاندا و دیاریکردنی سەرچاوەی شوێن (GPS / IP).",
    fr: "Tableau de bord d'administration pour suivre les appareils dans le monde entier et détecter les sources de localisation.",
    de: "Umfassendes Dashboard zur weltweiten Überwachung von Benutzergeräten und Ortungsquellen."
  },
  open_global_map: {
    ar: "فتح الخريطة العالمية",
    en: "Open Global Map",
    ku: "کردنەوەی نەخشەی جیهانی",
    fr: "Ouvrir la carte globale",
    de: "Globale Karte öffnen"
  },
  mobile_testing_guide_title: {
    ar: "دليل اختبار الموبايل على الأجهزة الفعلية",
    en: "Mobile Testing Guide on Physical Devices",
    ku: "ڕێبەری تاقیکردنەوەی مۆبایل لەسەر ئامێرە ڕاستەقینەکان",
    fr: "Guide de test mobile sur appareils réels",
    de: "Leitfaden für mobile Tests auf echten Geräten"
  },
  mobile_guide_item_1_title: {
    ar: "التطبيق مغلق تماماً:",
    en: "App completely closed:",
    ku: "بەرنامەکە بە تەواوی داخراوە:",
    fr: "Application complètement fermée :",
    de: "App vollständig geschlossen:"
  },
  mobile_guide_item_1_desc: {
    ar: "عند إرسال بلاغ جديد من غرفة التحكم، يستقبل الهاتف إشعار FCM فوري برنين قناة الإنذار.",
    en: "When a new alert is dispatched, the phone receives an immediate FCM push ringing the emergency channel.",
    ku: "کاتێک ئاگادارکردنەوەیەکی نوێ دەنێردرێت، مۆبایلەکە یەکسەر ئاگادارکردنەوەی FCM وەردەگرێت بە زەنگی کەناڵی فریاگوزاری.",
    fr: "Lorsqu'une alerte est déclenchée, le téléphone reçoit une notification push FCM immédiate avec sonnerie.",
    de: "Beim Auslösen eines Alarms empfängt das Smartphone sofort eine FCM-Push-Nachricht mit Sirenenton."
  },
  mobile_guide_item_2_title: {
    ar: "الضغط على الإشعار:",
    en: "Tapping notification:",
    ku: "کرتەکردن لەسەر ئاگادارکردنەوە:",
    fr: "Appui sur la notification :",
    de: "Tippen auf die Benachrichtigung:"
  },
  mobile_guide_item_2_desc: {
    ar: "يفتح تطبيق ERS وينتقل مباشرة إلى تفاصيل البلاغ بعد التحقق من تسجيل الدخول.",
    en: "Opens the ERS app and navigates directly to the alarm details after authentication.",
    ku: "بەرنامەی ERS دەکرێتەوە و ڕاستەوخۆ دەچێتە سەر وردەکارییەکانی ئاگادارکردنەوەکە پاش چوونەژوورەوە.",
    fr: "Ouvre l'application ERS et redirige directement vers l'alerte après authentification.",
    de: "Öffnet die ERS-App und navigiert nach Authentifizierung direkt zu den Alarmdetails."
  },
  mobile_guide_item_3_title: {
    ar: "منع التكرار:",
    en: "Deduplication:",
    ku: "ڕێگری لە دووبارەبوونەوە:",
    fr: "Déduplication :",
    de: "Deduplizierung:"
  },
  mobile_guide_item_3_desc: {
    ar: "كل تنبيه يحمل alertId فريد يمنع تكرار صفارة الإنذار أو فتح الشاشة مرتين.",
    en: "Every alert has a unique alertId preventing duplicate sirens or double screen triggers.",
    ku: "هەر ئاگادارکردنەوەیەک خاوەنی alertId تایبەتە بۆ ڕێگریکردن لە دووبارەبوونەوەی زەنگ یان کردنەوەی دوو شاشە.",
    fr: "Chaque alerte possède un identifiant unique empêchant les sirènes en double.",
    de: "Jeder Alarm verfügt über eine eindeutige ID, um doppelte Sirenen oder Mehrfachanzeigen zu verhindern."
  },
  mobile_guide_item_4_title: {
    ar: "تسجيل الخروج:",
    en: "User logout:",
    ku: "چوونەدەرەوە:",
    fr: "Déconnexion :",
    de: "Abmeldung:"
  },
  mobile_guide_item_4_desc: {
    ar: "عند خروج المستخدم، يتم إلغاء ربط توكن الجهاز فوراً من user_devices لمنع وصول بلاغات حساسة.",
    en: "Upon logout, the device token is immediately deactivated from user_devices to prevent unauthorized alerts.",
    ku: "کاتی چوونەدەرەوەی بەکارهێنەر، یەکسەر تۆکنی ئامێر لەکار دەخرێت بۆ پاراستنی زانیارییە هەستیارەکان.",
    fr: "Lors de la déconnexion, le jeton de l'appareil est désactivé pour protéger les alertes sensibles.",
    de: "Beim Abmelden wird das Gerätetoken deaktiviert, um den unbefugten Empfang von Alarmen zu verhindern."
  },
  mobile_guide_item_5_title: {
    ar: "الموقع في الخلفية:",
    en: "Background location:",
    ku: "شوێن لە پاشبنەما:",
    fr: "Position en arrière-plan :",
    de: "Hintergrund-Standort:"
  },
  mobile_guide_item_5_desc: {
    ar: "زر بدء مشاركة الموقع أثناء المناوبة يحافظ على إرسال الإحداثيات كل 10-15 ثانية لتوفير البطارية.",
    en: "The shift location sharing button broadcasts coordinates every 10-15 seconds efficiently to conserve battery.",
    ku: "دوگمەی بەشداریکردنی شوێنی ئێشکگری هەموو ١٠-١٥ چرکە جارێک پۆوتان دەنێرێت بە شێوەیەکی کەممەسرەف بۆ باتری.",
    fr: "Le bouton de partage de position de garde diffuse les coordonnées toutes les 10 à 15 secondes pour économiser la batterie.",
    de: "Die Schicht-Standortfreigabe sendet Koordinaten batterieschonend alle 10-15 Sekunden."
  },

  // Case reports & Search
  search_case_name: {
    ar: "بحث باسم الحالة",
    en: "Search by Case Name",
    ku: "گەڕان بەپێی ناوی حاڵەت",
    fr: "Rechercher par nom de cas",
    de: "Nach Einsatzname suchen"
  },
  case_name_placeholder: {
    ar: "مثلاً: حريق، تسريب...",
    en: "e.g., Fire, Gas Leak...",
    ku: "بۆ نموونە: ئاگرکەوتنەوە، دزەکردن...",
    fr: "ex. Incendie, Fuite de gaz...",
    de: "z.B. Brand, Gasleck..."
  },
  filter_status: {
    ar: "فلترة الحالة",
    en: "Filter by Status",
    ku: "فلتەرکردنی دۆخ",
    fr: "Filtrer par statut",
    de: "Nach Status filtern"
  },
  all_cases: {
    ar: "الكل",
    en: "All",
    ku: "هەموو",
    fr: "Tous",
    de: "Alle"
  },
  closed_only: {
    ar: "مغلقة فقط",
    en: "Closed Only",
    ku: "تەنها داخراوەکان",
    fr: "Fermés uniquement",
    de: "Nur geschlossene"
  },
  active_only: {
    ar: "نشطة فقط",
    en: "Active Only",
    ku: "تەنها چالاکەکان",
    fr: "Actifs uniquement",
    de: "Nur aktive"
  },
  from_date: {
    ar: "من تاريخ",
    en: "From Date",
    ku: "لە بەرواری",
    fr: "Du",
    de: "Vom Datum"
  },
  to_date: {
    ar: "إلى تاريخ",
    en: "To Date",
    ku: "بۆ بەرواری",
    fr: "Au",
    de: "Bis Datum"
  },
  case_reports_log_title: {
    ar: "سجل بلاغات الطوارئ ERS System",
    en: "Emergency Incident Log - ERS System",
    ku: "تۆماری ئاگادارکردنەوەکانی فریاگوزاری ERS System",
    fr: "Journal des incidents d'urgence - Système ERS",
    de: "Notfalleinsatz-Protokoll - ERS System"
  },
  export_date: {
    ar: "تاريخ الاستخراج",
    en: "Export Date",
    ku: "بەرواری دەرهێنان",
    fr: "Date d'exportation",
    de: "Exportdatum"
  },

  // Active Alerts
  bulk_delete_confirm_title: {
    ar: "تأكيد الحذف الجماعي",
    en: "Confirm Bulk Deletion",
    ku: "دڵنیابوونەوە لە سڕینەوەی بەکۆمەڵ",
    fr: "Confirmer la suppression groupée",
    de: "Massenlöschung bestätigen"
  },
  bulk_delete_confirm_msg: {
    ar: "هل أنت متأكد من حذف {{count}} بلاغ نشط؟ سيؤدي هذا لإزالة البلاغات من النظام تماماً.",
    en: "Are you sure you want to delete {{count}} active alerts? This will permanently remove them from the system.",
    ku: "ئایا دڵنیایت لە سڕینەوەی {{count}} ئاگاداری چالاک؟ ئەمە بە تەواوی لە سیستەمەکە دەیسڕێتەوە.",
    fr: "Êtes-vous sûr de vouloir supprimer {{count}} alertes actives ? Elles seront définitivement supprimées.",
    de: "Möchten Sie wirklich {{count}} aktive Warnungen löschen? Diese werden dauerhaft entfernt."
  },
  select_all_with_count: {
    ar: "تحديد الكل ({{count}})",
    en: "Select All ({{count}})",
    ku: "دیاریکردنی هەموو ({{count}})",
    fr: "Tout sélectionner ({{count}})",
    de: "Alle auswählen ({{count}})"
  },
  delete_selected_with_count: {
    ar: "حذف المحدد ({{count}})",
    en: "Delete Selected ({{count}})",
    ku: "سڕینەوەی دیاریکراو ({{count}})",
    fr: "Supprimer la sélection ({{count}})",
    de: "Ausgewählte löschen ({{count}})"
  },
  active_alerts_page_desc: {
    ar: "إدارة ومتابعة حالات الطوارئ القائمة حالياً",
    en: "Manage and monitor currently active emergency cases",
    ku: "بەڕێوەبردن و چاودێری کردنی حاڵەتە چالاکەکانی فریاگوزاری",
    fr: "Gérer et surveiller les cas d'urgence actuellement actifs",
    de: "Aktuell laufende Notfalleinsätze verwalten und überwachen"
  },

  // Dashboard & Alerts
  audio_siren_disabled_warning: {
    ar: "صوت الإنذار غير مفعل حالياً على جهازك",
    en: "Alarm sound is currently disabled on your device",
    ku: "دەنگی زەنگ ئێستا لەسەر ئامێرەکەت ناچالاکە",
    fr: "Le son de l'alarme est actuellement désactivé sur votre appareil",
    de: "Der Alarmton ist auf Ihrem Gerät derzeit deaktiviert"
  },
  activate_audio_engine_now: {
    ar: "تنشيط محرك الإنذار الآن",
    en: "Activate Alarm Engine Now",
    ku: "چالاککردنی بزوێنەری دەنگ ئێستا",
    fr: "Activer le moteur d'alarme maintenant",
    de: "Alarm-Engine jetzt aktivieren"
  },
  available_staff_card: {
    ar: "الموظفون المتاحون",
    en: "Available Staff",
    ku: "کارمەندانی بەردەست",
    fr: "Personnel disponible",
    de: "Verfügbares Personal"
  },
  on_field_response_card: {
    ar: "في استجابة ميدانية",
    en: "Responding in Field",
    ku: "لە وەڵامدانەوەی مەیدانیدا",
    fr: "En intervention sur le terrain",
    de: "Im Feldeinsatz"
  },
  task_completion_rate_card: {
    ar: "نسبة إنجاز المهام",
    en: "Task Completion Rate",
    ku: "ڕێژەی تەواوکردنی ئەرکەکان",
    fr: "Taux d'accomplissement des tâches",
    de: "Aufgabenerfüllungsrate"
  },
  delayed_tasks_card: {
    ar: "المهام المتأخرة",
    en: "Overdue Tasks",
    ku: "ئەرکە دواکەوتووەکان",
    fr: "Tâches en retard",
    de: "Überfällige Aufgaben"
  },

  // Login & Session
  restoring_session_title: {
    ar: "جاري استعادة الجلسة...",
    en: "Restoring session...",
    ku: "گەڕاندنەوەی دانیشتن...",
    fr: "Restauration de la session...",
    de: "Sitzung wird wiederhergestellt..."
  },
  restoring_session_desc: {
    ar: "يرجى الانتظار، يتم تسجيل الدخول تلقائياً",
    en: "Please wait, signing in automatically",
    ku: "تکایە چاوەڕوان بن، بە شێوەیەکی ئۆتۆماتیکی دەچێتەژوورەوە",
    fr: "Veuillez patienter, connexion automatique en cours",
    de: "Bitte warten, Sie werden automatisch angemeldet"
  },
  offline_login_badge: {
    ar: "أنت حالياً في وضع عدم الاتصال",
    en: "You are currently offline",
    ku: "تۆ ئێستا لە دۆخی دابڕاو لە هێڵیت",
    fr: "Vous êtes actuellement hors ligne",
    de: "Sie sind derzeit offline"
  },
  network_connection_error: {
    ar: "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.",
    en: "Could not connect to server. Please check your internet connection.",
    ku: "پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو. تکایە هێڵی ئینتەرنێت بپشکنە.",
    fr: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet.",
    de: "Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung."
  },
  connected_now: {
    ar: "متصل الآن",
    en: "Connected Now",
    ku: "ئێستا پەیوەستە",
    fr: "Connecté actuellement",
    de: "Jetzt verbunden"
  },
  time_hours_mins: {
    ar: "{{hours}}س {{minutes}}د",
    en: "{{hours}}h {{minutes}}m",
    ku: "{{hours}}ک {{minutes}}خ",
    fr: "{{hours}}h {{minutes}}m",
    de: "{{hours}}Std. {{minutes}}Min."
  },
  search_active_user_placeholder: {
    ar: "ابحث عن اسم الناشط...",
    en: "Search active user name...",
    ku: "گەڕان بەدوای ناوی بەکارهێنەری چالاک...",
    fr: "Rechercher un utilisateur actif...",
    de: "Aktiven Benutzernamen suchen..."
  },
  diagnostics_and_test_device: {
    ar: "تشخيص واختبار الجهاز",
    en: "Device Diagnostics & Testing",
    ku: "پشکنین و تاقیکردنەوەی ئامێر",
    fr: "Diagnostic et test de l'appareil",
    de: "Gerätediagnose & Test"
  },

  // Toast & Notifications
  active_emergency_toast_title: {
    ar: "إنذار طوارئ نشط!",
    en: "Active Emergency Alert!",
    ku: "ئاگاداری فریاگوزاری چالاکە!",
    fr: "Alerte d'urgence active !",
    de: "Aktiver Notfallalarm!"
  },
  at_location: {
    ar: "في",
    en: "at",
    ku: "لە",
    fr: "à",
    de: "in"
  },
  dismiss_not_concerned: {
    ar: "لست من المعنيين بهذا البلاغ (إيقاف الإنذار)",
    en: "Not relevant to me (Dismiss Alert)",
    ku: "من پەیوەندیدار نیم بەم ئاگادارییە (ڕاگرتنی زەنگ)",
    fr: "Non concerné par cette alerte (Ignorer)",
    de: "Betrifft mich nicht (Alarm beenden)"
  },

  // Guided Tour
  tour_step_1_title: {
    ar: "مرحباً بك في نظام ERS",
    en: "Welcome to ERS System",
    ku: "بەخێربێن بۆ سیستەمی ERS",
    fr: "Bienvenue dans le système ERS",
    de: "Willkommen beim ERS-System"
  },
  tour_step_1_content: {
    ar: "نظام الاستجابة للطوارئ الذكي. دعنا نأخذك في جولة سريعة.",
    en: "Smart Emergency Response System. Let's take a quick tour.",
    ku: "سیستەمی وەڵامدانەوەی فریاگوزاری زیرەک. با گەشتێکی کورت بکەین.",
    fr: "Système intelligent d'intervention d'urgence. Faisons un tour rapide.",
    de: "Intelligentes Notfall-Einsatzsystem. Lassen Sie uns einen kurzen Rundgang machen."
  },
  tour_step_2_title: {
    ar: "الإبلاغ السريع",
    en: "Quick Report",
    ku: "ڕاپۆرتی خێرا",
    fr: "Signalement rapide",
    de: "Schnellmeldung"
  },
  tour_step_2_content: {
    ar: "اضغط هنا لفتح حالة طوارئ جديدة، يمكنك استخدام الذكاء الاصطناعي لتحليل الصور.",
    en: "Click here to open a new emergency; you can use AI to analyze incident scenes.",
    ku: "کرتە لێرە بکە بۆ کردنەوەی حاڵەتێکی نوێ، دەتوانیت زیرەکی دەستکرد بەکاربهێنیت بۆ شیکردنەوەی وێنەکان.",
    fr: "Cliquez ici pour signaler une urgence ; utilisez l'IA pour analyser les images.",
    de: "Klicken Sie hier, um einen Notfall zu melden; nutzen Sie KI zur Bildanalyse."
  },
  tour_step_3_title: {
    ar: "غرفة العمليات الحية",
    en: "Live Ops Room",
    ku: "ژووری ئۆپەراسیۆنی ڕاستەوخۆ",
    fr: "Salle des opérations en direct",
    de: "Live-Einsatzzentrale"
  },
  tour_step_3_content: {
    ar: "تتبع المستجيبين والحالات النشطة بشكل لحظي على الخريطة التفاعلية.",
    en: "Track responders and active cases in real-time on the interactive map.",
    ku: "شوێنپێهەڵگرتنی وەڵامدەرەوەکان و حاڵەتە چالاکەکان بە شێوەیەکی ڕاستەوخۆ لەسەر نەخشەکە.",
    fr: "Suivez les intervenants et les cas actifs en temps réel sur la carte interactive.",
    de: "Verfolgen Sie Einsatzkräfte und aktive Fälle in Echtzeit auf der interaktiven Karte."
  },
  tour_step_4_title: {
    ar: "وحدة التحليل الذكي ERS",
    en: "ERS Intelligence Hub",
    ku: "ناوەندی شیکاری زیرەکی ERS",
    fr: "Pôle d'intelligence ERS",
    de: "ERS-Intelligenzzentrum"
  },
  tour_step_4_content: {
    ar: "يقوم الذكاء الاصطناعي بتحليل الوضع وتقديم رؤى حرجة واستراتيجية هنا.",
    en: "AI analyzes the situation and provides critical strategic insights here.",
    ku: "زیرەکی دەستکرد بارودۆخەکە شیدەکاتەوە و تێڕوانینی گرنگ و ستراتیژی پێشکەش دەکات لێرەدا.",
    fr: "L'IA analyse la situation et fournit des informations stratégiques critiques ici.",
    de: "Die KI analysiert die Lage und liefert hier wichtige strategische Erkenntnisse."
  },

  // Live Map
  live_active_location: {
    ar: "موقع حي ومباشر (مناوبة نشطة)",
    en: "Live Active Location (On-Duty Shift)",
    ku: "شوێنی ڕاستەوخۆ (ئێشکگری چالاک)",
    fr: "Position en direct (Garde active)",
    de: "Live-Standort (Aktive Schicht)"
  },
  recent_inactive_location: {
    ar: "موقع حديث (غير نشط حالياً)",
    en: "Recent Location (Currently Inactive)",
    ku: "شوێنی نوێ (ئێستا ناچالاک)",
    fr: "Position récente (Actuellement inactive)",
    de: "Kürzlicher Standort (Derzeit inaktiv)"
  },
  older_recorded_location: {
    ar: "آخر موقع مسجل (قديم)",
    en: "Last Recorded Location (Older)",
    ku: "دوایین شوێنی تۆمارکراو (کۆن)",
    fr: "Dernière position enregistrée (Ancienne)",
    de: "Zuletzt erfasster Standort (Älter)"
  },
  gps_accuracy_label: {
    ar: "دقة تحديد الموقع (GPS)",
    en: "GPS Accuracy",
    ku: "وردبینی دیاریکردنی شوێن (GPS)",
    fr: "Précision de géolocalisation (GPS)",
    de: "GPS-Genauigkeit"
  },
  meters_accuracy: {
    ar: "± {{accuracy}} متر",
    en: "± {{accuracy}} meters",
    ku: "± {{accuracy}} مەتر",
    fr: "± {{accuracy}} mètres",
    de: "± {{accuracy}} Meter"
  },
  last_location_update: {
    ar: "آخر تحديث للموقع",
    en: "Last Location Update",
    ku: "دوایین نوێکردنەوەی شوێن",
    fr: "Dernière mise à jour de position",
    de: "Letzte Standortaktualisierung"
  },

  // AR Navigator
  ar_target_victim: {
    ar: "موقع المصاب",
    en: "Victim Location",
    ku: "شوێنی بریندار",
    fr: "Position de la victime",
    de: "Position des Verletzten"
  },
  ar_target_exit: {
    ar: "مخرج الطوارئ {{name}}",
    en: "Emergency Exit {{name}}",
    ku: "دەرچوونی فریاگوزاری {{name}}",
    fr: "Sortie de secours {{name}}",
    de: "Notausgang {{name}}"
  },
  ar_target_extinguisher: {
    ar: "طفائية حريق",
    en: "Fire Extinguisher",
    ku: "ئاگرکوژێنەوە",
    fr: "Extincteur d'incendie",
    de: "Feuerlöscher"
  },
  ar_target_gas_leak: {
    ar: "تسريب غاز مكتشف",
    en: "Detected Gas Leak",
    ku: "دزەکردنی گازی دۆزراوە",
    fr: "Fuite de gaz détectée",
    de: "Erkanntes Gasleck"
  },
  camera_required_for_ar: {
    ar: "الكاميرا مطلوبة لتشغيل الواقع المعزز.",
    en: "Camera permission is required for AR navigation.",
    ku: "مۆڵەتی کامێرا پێویستە بۆ کارپێکردنی ڕاستی زیادکراو (AR).",
    fr: "L'accès à la caméra est requis pour la réalité augmentée.",
    de: "Kameraberechtigung für AR-Navigation erforderlich."
  },

  // Live Assistant
  ai_live_assistant_title: {
    ar: "الدعم الفني الذكي (Live API)",
    en: "Smart Live AI Assistant (Live API)",
    ku: "پشتیوانی تەکنیکی زیرەک (Live API)",
    fr: "Assistant IA intelligent en direct (Live API)",
    de: "Intelligenter Live-KI-Assistent (Live API)"
  },
  ai_live_disconnect_error: {
    ar: "تم قطع الاتصال مع خادم الذكاء الاصطناعي.",
    en: "Connection to AI server was lost.",
    ku: "پەیوەندی لەگەڵ سێرڤەری زیرەکی دەستکرد پچڕا.",
    fr: "La connexion au serveur IA a été interrompue.",
    de: "Verbindung zum KI-Server unterbrochen."
  },
  ai_live_socket_error: {
    ar: "تعذر استقرار المكالمة الصوتية مع الخادم.",
    en: "Unable to establish voice session with server.",
    ku: "پەیوەندی دەنگی لەگەڵ سێرڤەر جێگیر نەبوو.",
    fr: "Impossible d'établir la session vocale avec le serveur.",
    de: "Sprachsitzung mit dem Server konnte nicht hergestellt werden."
  },
  ai_live_mic_error: {
    ar: "تعذر الوصول للميكروفون أو بدء المكالمة.",
    en: "Could not access microphone or initiate call.",
    ku: "دەستڕاگەیشتن بە مایکرۆفۆن یان دەستپێکردنی پەیوەندی سەرکەوتوو نەبوو.",
    fr: "Impossible d'accéder au microphone ou de démarrer l'appel.",
    de: "Mikrofonzugriff oder Anrufstart fehlgeschlagen."
  },
  start_voice_call: {
    ar: "بدء نداء الدعم الفني",
    en: "Start Live Support Call",
    ku: "دەستپێکردنی پەیوەندی پشتیوانی",
    fr: "Démarrer l'appel d'assistance",
    de: "Live-Support-Anruf starten"
  },
  stop_voice_call: {
    ar: "إنهاء المكالمة",
    en: "End Voice Call",
    ku: "کۆتاییهێنان بە پەیوەندی",
    fr: "Mettre fin à l'appel",
    de: "Anruf beenden"
  },

  // Private Chat
  sent_media: {
    ar: "أرسل {{type}}",
    en: "Sent {{type}}",
    ku: "{{type}} نێردرا",
    fr: "{{type}} envoyé",
    de: "{{type}} gesendet"
  },
  file_size_limit_error: {
    ar: "حجم الملف كبير جداً. الحد الأقصى هو 1 ميجابايت.",
    en: "File size is too large. Maximum size is 1MB.",
    ku: "قەبارەی پەڕگە زۆر گەورەیە. زۆرترین قەبارە ١ مێگابایتە.",
    fr: "Fichier trop volumineux. La taille maximale est de 1 Mo.",
    de: "Dateigröße zu groß. Maximale Größe ist 1 MB."
  },
  file_db_limit_error: {
    ar: "تعذر إرسال الملف: الحجم يتجاوز حدود قاعدة البيانات.",
    en: "Could not send file: size exceeds database limits.",
    ku: "ناردنی پەڕگە سەرکەوتوو نەبوو: قەبارەکەی لە سنووری داتابەیس زیاترە.",
    fr: "Échec de l'envoi : la taille dépasse la limite autorisée.",
    de: "Datei konnte nicht gesendet werden: Größe überschreitet Datenbanklimit."
  },
  audio_too_long_error: {
    ar: "التسجيل طويل جداً، يرجى إرسال رسالة أقصر.",
    en: "Recording is too long. Please record a shorter message.",
    ku: "تۆمارکردنەکە زۆر درێژە، تکایە پەیامێکی کورتتر بنێرە.",
    fr: "Enregistrement trop long. Veuillez envoyer un message plus court.",
    de: "Aufnahme zu lang. Bitte senden Sie eine kürzere Nachricht."
  },
  mic_permission_required: {
    ar: "إذن الميكروفون مطلوب لتسجيل الرسائل الصوتية.",
    en: "Microphone permission is required to record voice messages.",
    ku: "مۆڵەتی مایکرۆفۆن پێویستە بۆ تۆمارکردنی دەنگ.",
    fr: "L'autorisation du micro est requise pour enregistrer des messages vocaux.",
    de: "Mikrofonberechtigung für Sprachnachrichten erforderlich."
  },

  // Alarm & Actions
  general_alert: {
    ar: "تنبيه عام",
    en: "General Emergency Alert",
    ku: "ئاگاداری گشتی",
    fr: "Alerte générale d'urgence",
    de: "Allgemeiner Notfallalarm"
  },
  ai_field_announcement: {
    ar: "النداء الميداني الذكي",
    en: "Tactical Field Broadcast",
    ku: "بانگەوازی مەیدانی زیرەک",
    fr: "Diffusion tactique sur le terrain",
    de: "Taktische Felddurchsage"
  },
  instant_ai_broadcast: {
    ar: "بث ذكاء اصطناعي فوري",
    en: "Instant AI Voice Broadcast",
    ku: "پەخشی دەنگی دەستبەجێی AI",
    fr: "Diffusion vocale IA instantanée",
    de: "Sofortige KI-Sprachübertragung"
  },
  elapsed_time: {
    ar: "الزمن",
    en: "Elapsed Time",
    ku: "کات",
    fr: "Temps écoulé",
    de: "Verstrichene Zeit"
  },
  action_notes_placeholder: {
    ar: "صف الإجراءات التي قمت بها هنا...",
    en: "Describe the actions you took here...",
    ku: "لێرەدا ئەو هەنگاوانە بنووسە کە ئەنجامت داون...",
    fr: "Décrivez les actions effectuées ici...",
    de: "Beschreiben Sie hier Ihre durchgeführten Maßnahmen..."
  },
  sending_and_securing: {
    ar: "جاري الإرسال وتأمين الموقع...",
    en: "Submitting response and securing scene...",
    ku: "ناردن و پاراستنی شوێنەکە...",
    fr: "Envoi et sécurisation des lieux...",
    de: "Wird gesendet und Einsatzort gesichert..."
  },
  send_response_stop_sirens: {
    ar: "إرسال الاستجابة وإيقاف كافة الإنذارات",
    en: "Submit Response & Silence All Alarms",
    ku: "ناردنی وەڵامدانەوە و بێدەنگکردنی هەموو زەنگەکان",
    fr: "Confirmer la réponse et couper les sirènes",
    de: "Reaktion bestätigen & alle Sirenen stummschalten"
  },
  permanently_close_case: {
    ar: "إغلاق البلاغ نهائياً",
    en: "Permanently Close Incident",
    ku: "داخستنی یەکجارەکی حاڵەتەکە",
    fr: "Clôturer définitivement l'incident",
    de: "Einsatz endgültig schließen"
  },
  qr_scanner_title: {
    ar: "ماسح رمز تأكيد الوصول",
    en: "Arrival Verification QR Scanner",
    ku: "سکانی کۆدی QR بۆ پشتڕاستکردنەوەی گەیشتن",
    fr: "Scanner QR de confirmation d'arrivée",
    de: "QR-Scanner zur Ankunftsbestätigung"
  },

  // New Emergency
  voice_prefix: {
    ar: "[صوت]",
    en: "[Voice]",
    ku: "[دەنگ]",
    fr: "[Vocal]",
    de: "[Sprache]"
  },
  select_type_and_location_error: {
    ar: "يرجى اختيار النوع والموقع",
    en: "Please select emergency type and location",
    ku: "تکایە جۆری فریاگوزاری و شوێن هەڵبژێرە",
    fr: "Veuillez sélectionner le type et le lieu de l'urgence",
    de: "Bitte Notfalltyp und Ort auswählen"
  },
  emergency_dispatch_error: {
    ar: "حدث خطأ أثناء إرسال البلاغ",
    en: "An error occurred while dispatching emergency alert",
    ku: "هەڵەیەک ڕوویدا لە کاتی ناردنی ئاگادارکردنەوەکە",
    fr: "Une erreur est survenue lors de l'envoi de l'alerte",
    de: "Fehler beim Absenden des Notrufs aufgetreten"
  },
  upload_incident_photo: {
    ar: "ارفع صورة الحادث (اختياري)",
    en: "Upload Incident Photo (Optional)",
    ku: "وێنەی ڕووداو باربکە (ئارەزوومەندانە)",
    fr: "Télécharger une photo de l'incident (Optionnel)",
    de: "Einsatzfoto hochladen (Optional)"
  },
  ai_scene_analysis: {
    ar: "تحليل الذكاء الاصطناعي للمشهد",
    en: "AI Incident Scene Analysis",
    ku: "شیکاری زیرەکی دەستکرد بۆ ڕووداوەکە",
    fr: "Analyse IA de la scène d'incident",
    de: "KI-Szenenanalyse des Einsatzes"
  },
  selected_location: {
    ar: "الموقع المحدد",
    en: "Target Location",
    ku: "شوێنی دیاریکراو",
    fr: "Emplacement désigné",
    de: "Ausgewählter Ort"
  },
  select_location_placeholder: {
    ar: "اختر الموقع من القائمة",
    en: "Select location from list",
    ku: "شوێنەکە لە لیستەکە هەڵبژێرە",
    fr: "Sélectionnez l'emplacement dans la liste",
    de: "Ort aus der Liste auswählen"
  },
  incident_notes_placeholder: {
    ar: "اكتب أي تفاصيل إضافية عن المشهد...",
    en: "Write additional details about the incident...",
    ku: "زانیاری زیاتر دەربارەی ڕووداوەکە بنووسە...",
    fr: "Écrivez des détails supplémentaires sur l'incident...",
    de: "Zusätzliche Details zum Vorfall eingeben..."
  },
  activate_alarm_unified: {
    ar: "تفعيل الإنذار والنداء الموحد",
    en: "Trigger Alarm & Unified Broadcast",
    ku: "چالاککردنی زەنگ و بانگەوازی یەکگرتوو",
    fr: "Déclencher l'alarme et la diffusion unifiée",
    de: "Alarm & Sammelruf auslösen"
  },

  // Presentation Assets
  slide_login_title: {
    ar: "شاشة الدخول الذكية",
    en: "Smart Login Interface",
    ku: "ڕووکاری چوونەژوورەوەی زیرەک",
    fr: "Interface de connexion intelligente",
    de: "Intelligente Anmeldeoberfläche"
  },
  slide_login_desc: {
    ar: "واجهة دخول مستقبلية مع بصمة إصبع وتصميم Minimalist ضوئي.",
    en: "Futuristic login screen with biometric authentication and minimalist lighting.",
    ku: "ڕووکاری داهاتووی چوونەژوورەوە بە پەنجەمۆر و ڕووناکی مۆدێرن.",
    fr: "Écran de connexion futuriste avec biométrie et éclairage minimaliste.",
    de: "Futuristische Anmeldeseite mit Biometrie und minimalistischem Design."
  },
  slide_dashboard_title: {
    ar: "لوحة العمليات الحية",
    en: "Live Ops Dashboard",
    ku: "داشبۆردی ئۆپەراسیۆنی ڕاستەوخۆ",
    fr: "Tableau de bord des opérations",
    de: "Live-Einsatz-Dashboard"
  },
  slide_dashboard_desc: {
    ar: "غرفة تحكم مركزية بشاشات ضخمة تعرض خرائط وبيانات حية.",
    en: "Central command center with large video wall showing live maps and real-time telemetry.",
    ku: "ژووری کۆنترۆڵی ناوەندی بە شاشەی گەورە نەخشە و داتای ڕاستەوخۆ پێشان دەدات.",
    fr: "Centre de commandement central avec écrans géants affichant des cartes en direct.",
    de: "Zentrale Leitstelle mit Großbildwand für Live-Karten und Telemetrie."
  },
  slide_vision_title: {
    ar: "الرؤية العميقة للذكاء الاصطناعي",
    en: "Deep AI Scene Vision",
    ku: "بینینی قووڵی زیرەکی دەستکرد",
    fr: "Vision IA approfondie de la scène",
    de: "Deep-AI Szenenanalyse"
  },
  slide_vision_desc: {
    ar: "تحليل مشهد حريق باستخدام عيون روبوتية وبيانات HUD.",
    en: "Analyzing incident scene using robotic vision with augmented HUD telemetry.",
    ku: "شیکردنەوەی شوێنی ئاگرەکە بە بەکارهێنانی چاوی ڕۆبۆتی و داتای سەر شاشە.",
    fr: "Analyse de la scène avec vision robotique et affichage tête haute.",
    de: "Analyse der Brandstelle mittels Robotik-Vision und HUD-Daten."
  },
  slide_ar_nav_title: {
    ar: "الملاحة بالواقع المعزز",
    en: "Augmented Reality Navigation",
    ku: "ڕێدۆزی بە ڕاستی زیادکراو (AR)",
    fr: "Navigation en réalité augmentée",
    de: "Augmented-Reality-Navigation"
  },
  slide_ar_nav_desc: {
    ar: "أسهم توجيه ذكية تظهر في ممر بناية مشتعلة.",
    en: "Smart directional 3D arrows projecting evacuation paths inside emergency zones.",
    ku: "تیری ئاراستەکردنی زیرەکی 3D بۆ ڕێگەی دەربازبوون لە ناوچەی مەترسیدار.",
    fr: "Flèches directionnelles intelligentes guidant l'évacuation dans les zones à risque.",
    de: "Intelligente 3D-Richtungspfeile zur Fluchtwegweisung in Gefahrenzonen."
  },
  slide_comm_title: {
    ar: "التواصل والترجمة الفورية",
    en: "Real-time Tactical Comms & Translation",
    ku: "پەیوەندی و وەرگێڕانی دەستبەجێ",
    fr: "Communications et traduction instantanée",
    de: "Echtzeit-Kommunikation & Simultanübersetzung"
  },
  slide_comm_desc: {
    ar: "مسعفون يتواصلون عبر أجهزة معصم ذكية وهولوجرام.",
    en: "First responders communicating seamlessly with wearable smart devices and holograms.",
    ku: "تیمەکانی فریاگوزاری پەیوەندی دەکەن لە ڕێگەی ئامێرە زیرەکەکانەوە.",
    fr: "Intervenants communiquant via appareils portables intelligents et hologrammes.",
    de: "Einsatzkräfte kommunizieren nahtlos über smarte Wearables und Hologramme."
  },

  // Analytics & Reports
  strategic_analytics_report: {
    ar: "تقرير التحليلات الاستراتيجية",
    en: "Strategic Analytics Report",
    ku: "ڕاپۆرتی شیکاری ستراتیژی",
    fr: "Rapport d'analyses stratégiques",
    de: "Strategischer Analysebericht"
  },
  minutes_unit: {
    ar: "دقائق",
    en: "Minutes",
    ku: "خولەک",
    fr: "Minutes",
    de: "Minuten"
  },
  alerts_count: {
    ar: "عدد البلاغات",
    en: "Alerts Count",
    ku: "ژمارەی ئاگادارکردنەوەکان",
    fr: "Nombre d'alertes",
    de: "Anzahl der Alarme"
  },
  total_dismissals: {
    ar: "إجمالي المستبعدين",
    en: "Total Dismissed",
    ku: "کۆی فەرامۆشکراوەکان",
    fr: "Total des exclusions",
    de: "Gesamt abgewiesen"
  },

  // ApiSettings
  dual_key_failover_title: {
    ar: "بروتوكول حماية المفاتيح (Dual Key Failover)",
    en: "Dual Key Failover Protection Protocol",
    ku: "پڕۆتۆکۆڵی پاراستنی کلیلی دووانە (Dual Key Failover)",
    fr: "Protocole de basculement à double clé (Dual Key)",
    de: "Dual-Key-Failover-Schutzprotokoll"
  },
  dual_key_failover_sub: {
    ar: "تأمين استمرارية الذكاء الاصطناعي بنسبة 99.9%",
    en: "Securing 99.9% AI Availability & Reliability",
    ku: "دڵنیابوونەوە لە بەردەوامی زیرەکی دەستکرد بە ڕێژەی ٩٩.٩٪",
    fr: "Garantir une disponibilité de l'IA à 99,9 %",
    de: "Sicherung der 99,9%igen KI-Verfügbarkeit"
  },
  smart_routing_title: {
    ar: "نظام التبديل التلقائي (Smart Routing)",
    en: "Smart Routing & Failover System",
    ku: "سیستەمی گۆڕینی ئۆتۆماتیکی (Smart Routing)",
    fr: "Routage intelligent et système de basculement",
    de: "Intelligentes Routing- & Failover-System"
  },
  smart_routing_desc: {
    ar: "عند حدوث أي فشل في المفتاح 'الأساسي'، سيقوم النظام فوراً وبدون تدخل بشري بالتحويل للمفتاح 'الاحتياطي' لضمان عدم توقف التقارير الميدانية.",
    en: "Upon any failure with the primary key, the system automatically routes requests to the secondary backup key to guarantee uninterrupted field operations.",
    ku: "لە کاتی هەر کێشەیەک لە کلیلی سەرەکی، سیستەمەکە یەکسەر بەبێ دەستێوەردانی مرۆیی دەگۆڕێت بۆ کلیلی یەدەگ بۆ ئەوەی ڕاپۆرتە مەیدانییەکان نەوەستن.",
    fr: "En cas de défaillance de la clé principale, le système bascule automatiquement sur la clé de secours pour garantir la continuité du service.",
    de: "Bei einem Ausfall des Primärschlüssels schaltet das System automatisch auf den Sekundärschlüssel um, um unterbrechungsfreie Einsätze zu gewährleisten."
  },
  primary_key_label: {
    ar: "المفتاح الأساسي (Primary)",
    en: "Primary API Key",
    ku: "کلیلی سەرەکی (Primary)",
    fr: "Clé API principale (Primary)",
    de: "Primärer API-Schlüssel"
  },
  secondary_key_label: {
    ar: "المفتاح الاحتياطي (Secondary Failover)",
    en: "Secondary Failover API Key",
    ku: "کلیلی یەدەگ (Secondary Failover)",
    fr: "Clé API secondaire (Failover)",
    de: "Sekundärer Failover-API-Schlüssel"
  },
  updating_secure_protocol: {
    ar: "جاري تحديث البروتوكول الآمن...",
    en: "Updating secure protocol...",
    ku: "نوێکردنەوەی پڕۆتۆکۆڵی پارێزراو...",
    fr: "Mise à jour du protocole sécurisé...",
    de: "Sicherheitsprotokoll wird aktualisiert..."
  },
  save_protection_protocol: {
    ar: "تفعيل وحفظ بروتوكول الحماية المزدوج",
    en: "Activate & Save Dual Protection Protocol",
    ku: "چالاککردن و پاشەکەوتکردنی پڕۆتۆکۆڵی پاراستنی دووانە",
    fr: "Activer et enregistrer le protocole de double protection",
    de: "Doppelschutz-Protokoll aktivieren & speichern"
  },
  keys_saved_success: {
    ar: "تم حفظ وتفعيل بروتوكول حماية المفاتيح بنجاح!",
    en: "Dual key protection protocol successfully saved and activated!",
    ku: "پڕۆتۆکۆڵی پاراستنی کلیلی دووانە بە سەرکەوتوویی پاشەکەوت کرا و چالاک کرا!",
    fr: "Protocole de protection à double clé enregistré et activé avec succès !",
    de: "Dual-Key-Schutzprotokoll erfolgreich gespeichert und aktiviert!"
  },

  // Crisis Simulator
  crisis_simulator_report_title: {
    ar: "تقرير محاكي الأزمات الذكي ERS System",
    en: "Crisis Simulator Strategic Report - ERS System",
    ku: "ڕاپۆرتی هاوشێوەکەری قەیرانە زیرەکەکان ERS System",
    fr: "Rapport du simulateur de crise intelligent - ERS System",
    de: "Bericht des intelligenten Krisensimulators - ERS System"
  },
  generation_date: {
    ar: "تاريخ التوليد",
    en: "Generation Date",
    ku: "بەرواری دروستکردن",
    fr: "Date de génération",
    de: "Generierungsdatum"
  },
  pdf_not_loaded_error: {
    ar: "أداة PDF غير محملة بعد، يرجى المحاولة مرة أخرى.",
    en: "PDF engine not fully loaded yet, please try again.",
    ku: "ئامڕازی PDF هێشتا بارنەکراوە، تکایە دووبارە هەوڵبدەرەوە.",
    fr: "Le module PDF n'est pas encore prêt, veuillez réessayer.",
    de: "PDF-Modul noch nicht geladen, bitte versuchen Sie es erneut."
  },
  scenario_generation_failed: {
    ar: "فشل توليد السيناريو: {{error}}",
    en: "Failed to generate scenario: {{error}}",
    ku: "دروستکردنی سیناریۆ سەرکەوتوو نەبوو: {{error}}",
    fr: "Échec de génération du scénario : {{error}}",
    de: "Szenariogenerierung fehlgeschlagen: {{error}}"
  },
  select_case_for_report_error: {
    ar: "يرجى اختيار بلاغ من القائمة أولاً لتوليد التقرير عليه.",
    en: "Please select an incident from the list first to generate its report.",
    ku: "تکایە سەرەتا ئاگادارکردنەوەیەک لە لیستەکە هەڵبژێرە بۆ دروستکردنی ڕاپۆرت لەسەری.",
    fr: "Veuillez d'abord sélectionner un incident dans la liste pour générer son rapport.",
    de: "Bitte wählen Sie zuerst einen Vorfall aus der Liste aus, um einen Bericht zu erstellen."
  },

  // Checklists Management
  default_checklist_title: {
    ar: "قائمة مهام {{typeName}}",
    en: "{{typeName}} Checklist",
    ku: "لیستی ئەرکەکانی {{typeName}}",
    fr: "Liste de contrôle {{typeName}}",
    de: "Checkliste für {{typeName}}"
  },
  default_checklist_desc: {
    ar: "بروتوكول السلامة المعتمد للاستجابة. يرجى توثيق كافة الخطوات بدقة.",
    en: "Standard approved safety response protocol. Please document each step carefully.",
    ku: "پڕۆتۆکۆڵی پەسەندکراوی سەلامەتی بۆ وەڵامدانەوە. تکایە هەموو هەنگاوەکان بە وردی تۆمار بکەن.",
    fr: "Protocole de sécurité approuvé pour l'intervention. Veuillez documenter chaque étape.",
    de: "Zugelassenes Sicherheitsreaktionsprotokoll. Bitte alle Schritte sorgfältig dokumentieren."
  },
  default_task_hazard_assessment: {
    ar: "التحقق الأولي من منطقة الخطر وتحديد المسار الآمن",
    en: "Initial hazard assessment and safe egress verification",
    ku: "پشکنینی سەرەتایی ناوچەی مەترسی و دیاریکردنی ڕێڕەوی سەلامەت",
    fr: "Évaluation initiale des dangers et vérification des issues sûres",
    de: "Erste Gefahrenanalyse und Überprüfung sicherer Rettungswege"
  },
  default_task_hazard_desc: {
    ar: "تقييم بيئة الحادث والتأكد من عدم وجود مخاطر غير متوقعة.",
    en: "Evaluate the incident scene and confirm there are no unexpected secondary hazards.",
    ku: "هەڵسەنگاندنی ژینگەی ڕووداوەکە و دڵنیابوونەوە لە نەبوونی مەترسی چاوەڕواننەکراو.",
    fr: "Évaluer l'environnement de l'incident et vérifier l'absence de risques secondaires.",
    de: "Einsatzumgebung bewerten und sicherstellen, dass keine unerwarteten Gefahren bestehen."
  },
  checklist_validation_error: {
    ar: "يرجى إدخال عنوان القائمة وتحديد نوع الطوارئ",
    en: "Please enter checklist title and select emergency type",
    ku: "تکایە ناونیشانی لیست بنووسە و جۆری فریاگوزاری هەڵبژێرە",
    fr: "Veuillez saisir le titre de la liste et sélectionner le type d'urgence",
    de: "Bitte Checklistentitel eingeben und Notfalltyp auswählen"
  },
  checklist_tasks_required_error: {
    ar: "يجب إضافة مهمة واحدة على الأقل داخل القائمة",
    en: "At least one task must be added to the checklist",
    ku: "پێویستە لانی کەم یەک ئەرک بۆ لیستەکە زیاد بکرێت",
    fr: "Au moins une tâche doit être ajoutée à la liste",
    de: "Mindestens eine Aufgabe muss der Checkliste hinzugefügt werden"
  },
  checklist_saved_success: {
    ar: "تم حفظ القائمة بنجاح",
    en: "Checklist saved successfully",
    ku: "لیستەکە بە سەرکەوتوویی پاشەکەوت کرا",
    fr: "Liste de contrôle enregistrée avec succès",
    de: "Checkliste erfolgreich gespeichert"
  },
  checklist_save_failed: {
    ar: "فشل حفظ القائمة",
    en: "Failed to save checklist",
    ku: "پاشەکەوتکردنی لیستەکە سەرکەوتوو نەبوو",
    fr: "Échec de l'enregistrement de la liste",
    de: "Speichern der Checkliste fehlgeschlagen"
  },

  // QR and Location Management
  qr_code: {
    ar: "رمز QR",
    en: "QR Code",
    ku: "کۆدی QR",
    fr: "Code QR",
    de: "QR-Code"
  },
  view_and_print_qr: {
    ar: "عرض وطباعة رمز QR",
    en: "View and Print QR Code",
    ku: "پیشاندان و چاپکردنی کۆدی QR",
    fr: "Afficher et imprimer le code QR",
    de: "QR-Code anzeigen und drucken"
  },
  qr_print_footer: {
    ar: "نظام ERS - تأكيد الوصول للموقع",
    en: "ERS System - Location Arrival Verification",
    ku: "سیستەمی ERS - پشتڕاستکردنەوەی گەیشتن بە شوێنەکە",
    fr: "Système ERS - Confirmation d'arrivée sur les lieux",
    de: "ERS-System - Ankunftsverifizierung am Einsatzort"
  },
  save_failed: {
    ar: "فشل الحفظ",
    en: "Save failed",
    ku: "پاشەکەوتکردن سەرکەوتوو نەبوو",
    fr: "Échec de l'enregistrement",
    de: "Speichern fehlgeschlagen"
  },
  username_already_exists: {
    ar: "اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر.",
    en: "This username is already taken. Please choose another.",
    ku: "ئەم ناوی بەکارهێنەرە پێشتر تۆمارکراوە، تکایە ناوێکی تر هەڵبژێرە.",
    fr: "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.",
    de: "Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen."
  },

  // Connected Devices Map
  gps_accurate_desc: {
    ar: "GPS محدد بدقة",
    en: "Accurate GPS Fix",
    ku: "GPS بە وردی دیاریکراو",
    fr: "Position GPS précise",
    de: "Präziser GPS-Fix"
  },
  ip_approx_desc: {
    ar: "موقع تقريبي عبر IP",
    en: "Approximate IP Location",
    ku: "شوێنی نزیکەیی لە ڕێگەی IP",
    fr: "Position approximative par IP",
    de: "Ungefährer Standort über IP"
  },
  refreshing_location_notice: {
    ar: "جاري طلب فحص الموقع الجغرافي وتحديثه لحظياً...",
    en: "Requesting geolocation refresh and updating in real-time...",
    ku: "داواکردنی پشکنینی شوێنی جوگرافی و نوێکردنەوەی ڕاستەوخۆ...",
    fr: "Demande d'actualisation de la géolocalisation en cours...",
    de: "Geolokalisierung wird in Echtzeit abgefragt und aktualisiert..."
  },
  location_updated_success: {
    ar: "تم تحديث إحداثيات وموقع جهازك بنجاح.",
    en: "Device location coordinates updated successfully.",
    ku: "پۆوتان و شوێنی ئامێرەکەت بە سەرکەوتوویی نوێکرایەوە.",
    fr: "Coordonnées et position de votre appareil mises à jour avec succès.",
    de: "Gerätestandort und Koordinaten erfolgreich aktualisiert."
  },
  location_check_error: {
    ar: "حدث خطأ أثناء فحص الموقع.",
    en: "An error occurred while checking location.",
    ku: "هەڵەیەک ڕوویدا لە کاتی پشکنینی شوێندا.",
    fr: "Une erreur est survenue lors de la vérification de la position.",
    de: "Fehler bei der Standortüberprüfung aufgetreten."
  },
  simulating_egypt_travel: {
    ar: "جاري محاكاة انتقال الجهاز من السعودية إلى مصر (القاهرة)...",
    en: "Simulating device relocation from Saudi Arabia to Egypt (Cairo)...",
    ku: "هاوشێوەکردنی گواستنەوەی ئامێر لە سعودیە بۆ میسر (قاهیرە)...",
    fr: "Simulation du déplacement de l'appareil de l'Arabie Saoudite vers l'Égypte...",
    de: "Simulation des Gerätestandortwechsels von Saudi-Arabien nach Ägypten..."
  },
  simulating_kuwait_travel: {
    ar: "جاري محاكاة انتقال الجهاز من مصر إلى الكويت...",
    en: "Simulating device relocation from Egypt to Kuwait...",
    ku: "هاوشێوەکردنی گواستنەوەی ئامێر لە میسر بۆ کوەیت...",
    fr: "Simulation du déplacement de l'appareil de l'Égypte vers le Koweït...",
    de: "Simulation des Gerätestandortwechsels von Ägypten nach Kuwait..."
  },
  simulating_gps_drift: {
    ar: "جاري محاكاة حركة ميدانية دقيقة وتحديث الـ GPS...",
    en: "Simulating high-precision field movement and updating GPS...",
    ku: "هاوشێوەکردنی جوڵەی مەیدانی ورد و نوێکردنەوەی GPS...",
    fr: "Simulation d'un déplacement de terrain de haute précision et mise à jour GPS...",
    de: "Simulation hochpräziser Feldbewegung und GPS-Aktualisierung..."
  },
  simulation_applied_success: {
    ar: "تم تطبيق المحاكاة وتحديث سجل الموقع وقاعدة البيانات بنجاح.",
    en: "Simulation applied and location history updated in database successfully.",
    ku: "هاوشێوەکردنەکە جێبەجێکرا و تۆماری شوێن لە داتابەیس نوێکرایەوە.",
    fr: "Simulation appliquée et historique de localisation mis à jour avec succès.",
    de: "Simulation angewendet und Standortverlauf in der Datenbank aktualisiert."
  },
  simulation_error: {
    ar: "حدث خطأ أثناء تنفيذ المحاكاة.",
    en: "An error occurred while executing simulation.",
    ku: "هەڵەیەک ڕوویدا لە کاتی جێبەجێکردنی هاوشێوەکردنەکەدا.",
    fr: "Une erreur est survenue lors de l'exécution de la simulation.",
    de: "Fehler bei der Durchführung der Simulation aufgetreten."
  },
  location_history_for_device: {
    ar: "سجل تحركات ومواقع الجهاز",
    en: "Device Movement & Location History",
    ku: "تۆماری جوڵە و شوێنەکانی ئامێر",
    fr: "Historique des déplacements et positions de l'appareil",
    de: "Bewegungs- und Standortverlauf des Geräts"
  },
  all_recorded_locations_desc: {
    ar: "جميع المواقع والإحداثيات المسجلة لهذا الجهاز مع توقيت الرصد ومصدر التحديد.",
    en: "All recorded locations and coordinates for this device with timestamp and fix source.",
    ku: "هەموو شوێن و پۆوتانە تۆمارکراوەکانی ئەم ئامێرە لەگەڵ کات و سەرچاوەی دیاریکردن.",
    fr: "Toutes les positions et coordonnées enregistrées avec horodatage et source.",
    de: "Alle erfassten Standorte und Koordinaten dieses Geräts mit Zeitstempel und Quelle."
  },
  detection_source: {
    ar: "مصدر التحديد",
    en: "Detection Source",
    ku: "سەرچاوەی دیاریکردن",
    fr: "Source de détection",
    de: "Erfassungsquelle"
  },
  speed_and_altitude: {
    ar: "السرعة والارتفاع",
    en: "Speed & Altitude",
    ku: "خێرایی و بەرزایی",
    fr: "Vitesse et altitude",
    de: "Geschwindigkeit & Höhe"
  },
  recorded_timestamp: {
    ar: "توقيت التسجيل",
    en: "Recorded Timestamp",
    ku: "کاتی تۆمارکردن",
    fr: "Horodatage de l'enregistrement",
    de: "Erfassungszeitpunkt"
  },
  no_history_records: {
    ar: "لا توجد سجلات مواقع سابقة لهذا الجهاز حتى الآن.",
    en: "No previous location history recorded for this device yet.",
    ku: "هێشتا هیچ تۆمارێکی پێشووی شوێن بۆ ئەم ئامێرە نییە.",
    fr: "Aucun historique de position enregistré pour cet appareil.",
    de: "Noch kein Standortverlauf für dieses Gerät erfasst."
  },
  close_history_modal: {
    ar: "إغلاق السجل",
    en: "Close History",
    ku: "داخستنی تۆمار",
    fr: "Fermer l'historique",
    de: "Verlauf schließen"
  }
};

// 3. Inject newKeys into each language dictionary
for (const [k, v] of Object.entries(newKeys)) {
  for (const lang of languages) {
    data[lang][k] = v[lang];
  }
}

// 4. Ensure ALL keys are present in EVERY language (100% parity)
const allUniqueKeys = new Set();
for (const lang of languages) {
  Object.keys(data[lang]).forEach(k => allUniqueKeys.add(k));
}

for (const lang of languages) {
  for (const k of allUniqueKeys) {
    if (!data[lang][k] || data[lang][k].trim() === '') {
      // Fallback if missing
      data[lang][k] = data.en[k] || data.ar[k] || k;
    }
  }
}

console.log(`Writing i18n.ts with ${allUniqueKeys.size} keys for all 5 languages...`);

// 5. Generate formatted TypeScript code
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
console.log('Successfully generated i18n.ts with 100% complete parity across 5 languages!');

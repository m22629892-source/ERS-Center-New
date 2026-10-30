import fs from 'fs';

// Read complete_i18n_builder.js
const builderPath = 'scripts/complete_i18n_builder.js';
let content = fs.readFileSync(builderPath, 'utf8');

const additionalKeys = {
  unauthorized_access: {
    ar: "غير مصرح لك بالوصول",
    en: "Unauthorized Access",
    ku: "ڕێگەت پێ نەدراوە بۆ دەستڕاگەیشتن",
    fr: "Accès non autorisé",
    de: "Zugriff nicht autorisiert"
  },
  unauthorized_access_desc: {
    ar: "هذه اللوحة مخصصة لمدراء النظام فقط لمراقبة الأجهزة العالمية.",
    en: "This dashboard is restricted to system administrators for global device monitoring.",
    ku: "ئەم داشبۆردە تەنها بۆ بەڕێوەبەرانی سیستەمە بۆ چاودێریکردنی ئامێرە جیهانییەکان.",
    fr: "Ce tableau de bord est réservé aux administrateurs pour la surveillance globale des appareils.",
    de: "Dieses Dashboard ist Administratoren zur globalen Geräteüberwachung vorbehalten."
  },
  back_to_home: {
    ar: "العودة للرئيسية",
    en: "Back to Dashboard",
    ku: "گەڕانەوە بۆ سەرەکی",
    fr: "Retour au tableau de bord",
    de: "Zurück zur Übersicht"
  },
  live_stream_active: {
    ar: "بث لحظي نشط",
    en: "Live Stream Active",
    ku: "پەخشی ڕاستەوخۆ چالاکە",
    fr: "Flux en direct actif",
    de: "Live-Stream aktiv"
  },
  devices_map_sub: {
    ar: "تحديد دقيق عبر GPS و IP Geolocation مع إدارة النزاعات وحفظ السجل الزمني",
    en: "Precise tracking via GPS & IP Geolocation with conflict resolution and history logging",
    ku: "دیاریکردنی ورد لە ڕێگەی GPS و IP Geolocation لەگەڵ بەڕێوەبردنی ناکۆکییەکان و پاراستنی مێژوو",
    fr: "Localisation précise via GPS et IP avec résolution de conflits et historique",
    de: "Präzise Ortung über GPS & IP-Geolokalisierung mit Konfliktmanagement und Verlauf"
  },
  check_my_location_now: {
    ar: "فحص موقعي الآن",
    en: "Check My Location Now",
    ku: "پشکنینی شوێنەکەم ئێستا",
    fr: "Vérifier ma position maintenant",
    de: "Meinen Standort jetzt prüfen"
  },
  back_to_admin: {
    ar: "العودة للإدارة",
    en: "Back to Admin Panel",
    ku: "گەڕانەوە بۆ بەڕێوەبردن",
    fr: "Retour à l'administration",
    de: "Zurück zur Administration"
  },
  location_version_label: {
    ar: "إصدار الموقع: v{{version}}",
    en: "Location Version: v{{version}}",
    ku: "وەشانی شوێن: v{{version}}",
    fr: "Version de localisation : v{{version}}",
    de: "Standortversion: v{{version}}"
  },
  installation_id_label: {
    ar: "معرف التثبيت: {{instId}} | الجهاز: {{deviceId}}",
    en: "Installation ID: {{instId}} | Device: {{deviceId}}",
    ku: "ناسنامەی دامەزراندن: {{instId}} | ئامێر: {{deviceId}}",
    fr: "ID d'installation : {{instId}} | Appareil : {{deviceId}}",
    de: "Installations-ID: {{instId}} | Gerät: {{deviceId}}"
  },
  firestore_registered_fields: {
    ar: "الحقول المسجلة في Firestore",
    en: "Firestore Registered Fields",
    ku: "خانە تۆمارکراوەکان لە Firestore",
    fr: "Champs enregistrés dans Firestore",
    de: "In Firestore registrierte Felder"
  },
  user_id_label: {
    ar: "المستخدم (userId)",
    en: "User ID (userId)",
    ku: "بەکارهێنەر (userId)",
    fr: "Identifiant utilisateur (userId)",
    de: "Benutzer-ID (userId)"
  },
  user_name_label: {
    ar: "اسم المستخدم (userName)",
    en: "User Name (userName)",
    ku: "ناوی بەکارهێنەر (userName)",
    fr: "Nom d'utilisateur (userName)",
    de: "Benutzername (userName)"
  },
  current_session_id: {
    ar: "جلسة العمل الحالية (sessionId)",
    en: "Current Session ID (sessionId)",
    ku: "دانیشتنی ئێستا (sessionId)",
    fr: "ID de session actuelle (sessionId)",
    de: "Aktuelle Sitzungs-ID (sessionId)"
  },
  active_session_id: {
    ar: "الجلسة النشطة (activeSessionId)",
    en: "Active Session ID (activeSessionId)",
    ku: "دانیشتنی چالاک (activeSessionId)",
    fr: "ID de session active (activeSessionId)",
    de: "Aktive Sitzungs-ID (activeSessionId)"
  },
  operating_system_label: {
    ar: "نظام التشغيل (operatingSystem)",
    en: "Operating System (operatingSystem)",
    ku: "سیستەمی کارپێکردن (operatingSystem)",
    fr: "Système d'exploitation (operatingSystem)",
    de: "Betriebssystem (operatingSystem)"
  },
  browser_label: {
    ar: "المتصفح (browser)",
    en: "Web Browser (browser)",
    ku: "وێبگەڕ (browser)",
    fr: "Navigateur (browser)",
    de: "Webbrowser (browser)"
  },
  device_type_label: {
    ar: "نوع الجهاز (deviceType)",
    en: "Device Type (deviceType)",
    ku: "جۆری ئامێر (deviceType)",
    fr: "Type d'appareil (deviceType)",
    de: "Gerätetyp (deviceType)"
  },
  ip_address_label: {
    ar: "عنوان IP (ipAddress)",
    en: "IP Address (ipAddress)",
    ku: "ناونیشانی IP (ipAddress)",
    fr: "Adresse IP (ipAddress)",
    de: "IP-Adresse (ipAddress)"
  },
  country_label: {
    ar: "الدولة (country / countryCode)",
    en: "Country (country / countryCode)",
    ku: "وڵات (country / countryCode)",
    fr: "Pays (country / countryCode)",
    de: "Land (country / countryCode)"
  },
  city_region_label: {
    ar: "المدينة والمنطقة (city / region)",
    en: "City & Region (city / region)",
    ku: "شار و ناوچە (city / region)",
    fr: "Ville et région (city / region)",
    de: "Stadt & Region (city / region)"
  },
  latitude_field_label: {
    ar: "خط العرض (latitude)",
    en: "Latitude (latitude)",
    ku: "هێڵی پانی (latitude)",
    fr: "Latitude (latitude)",
    de: "Breitengrad (latitude)"
  },
  longitude_field_label: {
    ar: "خط الطول (longitude)",
    en: "Longitude (longitude)",
    ku: "هێڵی درێژی (longitude)",
    fr: "Longitude (longitude)",
    de: "Längengrad (longitude)"
  },
  location_source_label: {
    ar: "مصدر الموقع (locationSource)",
    en: "Location Source (locationSource)",
    ku: "سەرچاوەی شوێن (locationSource)",
    fr: "Source de localisation (locationSource)",
    de: "Standortquelle (locationSource)"
  },
  location_accuracy_label: {
    ar: "دقة الموقع (locationAccuracy)",
    en: "Location Accuracy (locationAccuracy)",
    ku: "وردبینی شوێن (locationAccuracy)",
    fr: "Précision de position (locationAccuracy)",
    de: "Standortgenauigkeit (locationAccuracy)"
  },
  location_status_label: {
    ar: "حالة الموقع (locationStatus)",
    en: "Location Status (locationStatus)",
    ku: "دۆخی شوێن (locationStatus)",
    fr: "Statut de localisation (locationStatus)",
    de: "Standortstatus (locationStatus)"
  },
  location_observed_at_label: {
    ar: "توقيت الرصد الفعلي (locationObservedAt)",
    en: "Observed At (locationObservedAt)",
    ku: "کاتی ڕوانین (locationObservedAt)",
    fr: "Heure d'observation (locationObservedAt)",
    de: "Erfassungszeit (locationObservedAt)"
  },
  location_updated_at_label: {
    ar: "توقيت التحديث بالخادم (locationUpdatedAt)",
    en: "Server Updated At (locationUpdatedAt)",
    ku: "کاتی نوێکردنەوە لە سێرڤەر (locationUpdatedAt)",
    fr: "Mis à jour sur le serveur (locationUpdatedAt)",
    de: "Server-Aktualisierungszeit (locationUpdatedAt)"
  },
  last_ip_check_label: {
    ar: "آخر فحص IP (lastIpCheckAt)",
    en: "Last IP Check (lastIpCheckAt)",
    ku: "دوایین پشکنینی IP (lastIpCheckAt)",
    fr: "Dernière vérification IP (lastIpCheckAt)",
    de: "Letzte IP-Prüfung (lastIpCheckAt)"
  },
  last_known_country_label: {
    ar: "آخر دولة معروفة (lastKnownCountry)",
    en: "Last Known Country (lastKnownCountry)",
    ku: "دوایین وڵاتی ناسراو (lastKnownCountry)",
    fr: "Dernier pays connu (lastKnownCountry)",
    de: "Zuletzt bekanntes Land (lastKnownCountry)"
  },
  last_known_city_label: {
    ar: "آخر مدينة معروفة (lastKnownCity)",
    en: "Last Known City (lastKnownCity)",
    ku: "دوایین شاری ناسراو (lastKnownCity)",
    fr: "Dernière ville connue (lastKnownCity)",
    de: "Zuletzt bekannte Stadt (lastKnownCity)"
  },
  connection_status_label: {
    ar: "حالة الاتصال (isOnline)",
    en: "Connection Status (isOnline)",
    ku: "دۆخی پەیوەندی (isOnline)",
    fr: "Statut de connexion (isOnline)",
    de: "Verbindungsstatus (isOnline)"
  },
  first_seen_label: {
    ar: "أول ظهور (firstSeen)",
    en: "First Seen (firstSeen)",
    ku: "یەکەم دەرکەوتن (firstSeen)",
    fr: "Première apparition (firstSeen)",
    de: "Erste Sichtung (firstSeen)"
  },
  last_seen_label: {
    ar: "آخر ظهور (lastSeen)",
    en: "Last Seen (lastSeen)",
    ku: "دوایین دەرکەوتن (lastSeen)",
    fr: "Dernière apparition (lastSeen)",
    de: "Zuletzt gesehen (lastSeen)"
  },
  notification_permission_label: {
    ar: "إذن الإشعارات (notificationEnabled)",
    en: "Notifications Permission (notificationEnabled)",
    ku: "مۆڵەتی ئاگادارکردنەوە (notificationEnabled)",
    fr: "Autorisation de notification (notificationEnabled)",
    de: "Benachrichtigungsberechtigung (notificationEnabled)"
  },
  fcm_token_field_label: {
    ar: "رمز FCM Token",
    en: "FCM Device Token",
    ku: "کۆدی ئامێری FCM",
    fr: "Jeton d'appareil FCM",
    de: "FCM-Gerätetoken"
  },
  enabled: {
    ar: "مفعل",
    en: "Enabled",
    ku: "چالاک",
    fr: "Activé",
    de: "Aktiviert"
  },
  disabled: {
    ar: "معطل",
    en: "Disabled",
    ku: "ناچالاک",
    fr: "Désactivé",
    de: "Deaktiviert"
  },
  not_available: {
    ar: "غير متوفر",
    en: "N/A",
    ku: "بەردەست نییە",
    fr: "Non disponible",
    de: "Nicht verfügbar"
  },
  location_movement_history: {
    ar: "سجل تحركات وتغيرات الموقع الجغرافي (locationHistory)",
    en: "Geographic Movement & Location History (locationHistory)",
    ku: "تۆماری جوڵە و گۆڕانکارییەکانی شوێن (locationHistory)",
    fr: "Historique des déplacements géographiques (locationHistory)",
    de: "Geografischer Bewegungs- & Standortverlauf (locationHistory)"
  },
  records_count_label: {
    ar: "{{count}} سجلات مسجلة",
    en: "{{count}} records logged",
    ku: "{{count}} تۆمار",
    fr: "{{count}} enregistrements",
    de: "{{count}} Einträge protokolliert"
  },
  loading_history: {
    ar: "جاري تحميل السجل...",
    en: "Loading history...",
    ku: "بارکردنی مێژوو...",
    fr: "Chargement de l'historique...",
    de: "Verlauf wird geladen..."
  },
  no_history_yet: {
    ar: "لا يوجد سجل تحركات مسجل لهذا الجهاز حتى الآن (يتم التسجيل تلقائياً عند تغيير الدولة أو المدينة أو الحركة).",
    en: "No movement history recorded for this device yet (logged automatically upon location shifts).",
    ku: "هیچ تۆمارێکی پێشووی جوڵە نییە (بە شێوەیەکی ئۆتۆماتیکی لە کاتی گۆڕینی شوێن تۆمار دەکرێت).",
    fr: "Aucun historique de déplacement pour cet appareil (enregistré lors des changements de position).",
    de: "Noch kein Bewegungsverlauf erfasst (wird bei Standortänderungen automatisch protokolliert)."
  },
  periodic_location_update: {
    ar: "تحديث دوري للموقع",
    en: "Periodic Location Update",
    ku: "نوێکردنەوەی خولیی شوێن",
    fr: "Mise à jour périodique de position",
    de: "Periodische Standortaktualisierung"
  },
  accurate_gps_tag: {
    ar: "🛰️ GPS دقيق",
    en: "🛰️ Accurate GPS",
    ku: "🛰️ GPSی ورد",
    fr: "🛰️ GPS précis",
    de: "🛰️ Präzises GPS"
  },
  approx_ip_tag: {
    ar: "🌐 تقريبي IP",
    en: "🌐 Approx IP",
    ku: "🌐 نزیکەیی IP",
    fr: "🌐 IP approx.",
    de: "🌐 Ungefähre IP"
  },
  delete_error: {
    ar: "حدث خطأ أثناء الحذف",
    en: "An error occurred while deleting",
    ku: "هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا",
    fr: "Une erreur est survenue lors de la suppression",
    de: "Fehler beim Löschen aufgetreten"
  },
  reset_filter: {
    ar: "إعادة تعيين",
    en: "Reset Filter",
    ku: "ڕێکخستنەوەی فلتەر",
    fr: "Réinitialiser les filtres",
    de: "Filter zurücksetzen"
  },
  settings_save_failed: {
    ar: "فشل حفظ الإعدادات",
    en: "Failed to save settings",
    ku: "پاشەکەوتکردنی ڕێکخستنەکان سەرکەوتوو نەبوو",
    fr: "Échec de l'enregistrement des paramètres",
    de: "Speichern der Einstellungen fehlgeschlagen"
  },
  delete_failed: {
    ar: "فشل الحذف",
    en: "Deletion failed",
    ku: "سڕینەوە سەرکەوتوو نەبوو",
    fr: "Échec de la suppression",
    de: "Löschen fehlgeschlagen"
  }
};

// Add to newKeys in builder
const marker = 'const newKeys = {';
const insertPos = content.indexOf(marker) + marker.length;

let serialized = '';
for (const [k, v] of Object.entries(additionalKeys)) {
  serialized += `\n  ${k}: ${JSON.stringify(v, null, 4)},`;
}

content = content.slice(0, insertPos) + serialized + content.slice(insertPos);
fs.writeFileSync(builderPath, content, 'utf8');
console.log('Appended additional keys to builder script.');

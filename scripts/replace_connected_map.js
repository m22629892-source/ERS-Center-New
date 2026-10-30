import fs from 'fs';

let mapCode = fs.readFileSync('pages/admin/ConnectedDevicesMap.tsx', 'utf8');

// Title in division
mapCode = mapCode.replace("title=\"${isGps ? 'GPS محدد بدقة' : 'موقع تقريبي عبر IP'}\"", 'title="${isGps ? t(\'gps_accurate_desc\') : t(\'ip_approx_desc\')}"');
mapCode = mapCode.replace("setSimulationNotice('جاري طلب فحص الموقع الجغرافي وتحديثه لحظياً...');", "setSimulationNotice(t('refreshing_location_notice'));");
mapCode = mapCode.replace("setSimulationNotice('تم تحديث إحداثيات وموقع جهازك بنجاح.');", "setSimulationNotice(t('location_updated_success'));");
mapCode = mapCode.replace("setSimulationNotice('حدث خطأ أثناء فحص الموقع.');", "setSimulationNotice(t('location_check_error'));");
mapCode = mapCode.replace("setSimulationNotice('جاري محاكاة انتقال الجهاز من السعودية إلى مصر (القاهرة)...');", "setSimulationNotice(t('simulating_egypt_travel'));");
mapCode = mapCode.replace("setSimulationNotice('نجحت المحاكاة! تم تحديث موقع الجهاز إلى مصر مع رفع الإصدار وتوثيق السجل دون تكرار.');", "setSimulationNotice(t('simulation_applied_success'));");
mapCode = mapCode.replace("setSimulationNotice(`فشلت المحاكاة: ${e.message}`);", "setSimulationNotice(t('simulation_error') + ': ' + e.message);");
mapCode = mapCode.replace("setSimulationNotice('جاري محاكاة عودة الجهاز إلى المملكة العربية السعودية (الرياض)...');", "setSimulationNotice(t('simulating_kuwait_travel'));");
mapCode = mapCode.replace("setSimulationNotice('نجحت المحاكاة! تم تسجيل العودة للرياض بسلاسة مع التحقق من عدم تعارض الجلسات.');", "setSimulationNotice(t('simulation_applied_success'));");
mapCode = mapCode.replace('<h2 className="text-xl font-black">غير مصرح لك بالوصول</h2>', '<h2 className="text-xl font-black">{t("unauthorized_access")}</h2>');
mapCode = mapCode.replace('<p className="text-gray-500 text-sm mt-1">هذه اللوحة مخصصة لمدراء النظام فقط لمراقبة الأجهزة العالمية.</p>', '<p className="text-gray-500 text-sm mt-1">{t("unauthorized_access_desc")}</p>');
mapCode = mapCode.replace('<Button onClick={() => navigate(\'/\')} className="mt-4">العودة للرئيسية</Button>', '<Button onClick={() => navigate(\'/\')} className="mt-4">{t("back_to_home")}</Button>');
mapCode = mapCode.replace('مراقبة الأجهزة والمواقع العالمية', '{t("connected_devices_global_map")}');
mapCode = mapCode.replace('بث لحظي نشط', '{t("live_stream_active")}');
mapCode = mapCode.replace('تحديد دقيق عبر GPS و IP Geolocation مع إدارة النزاعات وحفظ السجل الزمني', '{t("devices_map_sub")}');
mapCode = mapCode.replace('<RefreshCw size={14} /> فحص موقعي الآن', '<RefreshCw size={14} /> {t("check_my_location_now")}');
mapCode = mapCode.replace('<ArrowLeft size={14} /> العودة للإدارة', '<ArrowLeft size={14} className="rtl:rotate-180" /> {t("back_to_admin")}');

mapCode = mapCode.replace('إصدار الموقع: v{selectedDevice.locationVersion || 1}', '{t("location_version_label", { version: selectedDevice.locationVersion || 1 })}');
mapCode = mapCode.replace('معرف التثبيت: {selectedDevice.installationId} | الجهاز: {selectedDevice.deviceId}', '{t("installation_id_label", { instId: selectedDevice.installationId, deviceId: selectedDevice.deviceId })}');
mapCode = mapCode.replace('<Info size={14} /> الحقول المسجلة في Firestore (users/{selectedDevice.userId}/devices/{selectedDevice.deviceId})', '<Info size={14} /> {t("firestore_registered_fields")} (users/{selectedDevice.userId}/devices/{selectedDevice.deviceId})');

mapCode = mapCode.replace('<MetaItem label="المستخدم (userId)"', '<MetaItem label={t("user_id_label")}');
mapCode = mapCode.replace('<MetaItem label="اسم المستخدم (userName)"', '<MetaItem label={t("user_name_label")}');
mapCode = mapCode.replace('<MetaItem label="جلسة العمل الحالية (sessionId)"', '<MetaItem label={t("current_session_id")}');
mapCode = mapCode.replace('<MetaItem label="الجلسة النشطة (activeSessionId)"', '<MetaItem label={t("active_session_id")}');
mapCode = mapCode.replace('<MetaItem label="نظام التشغيل (operatingSystem)"', '<MetaItem label={t("operating_system_label")}');
mapCode = mapCode.replace('<MetaItem label="المتصفح (browser)"', '<MetaItem label={t("browser_label")}');
mapCode = mapCode.replace('<MetaItem label="نوع الجهاز (deviceType)"', '<MetaItem label={t("device_type_label")}');
mapCode = mapCode.replace('<MetaItem label="عنوان IP (ipAddress)"', '<MetaItem label={t("ip_address_label")}');
mapCode = mapCode.replace('<MetaItem label="الدولة (country / countryCode)"', '<MetaItem label={t("country_label")}');
mapCode = mapCode.replace('<MetaItem label="المدينة والمنطقة (city / region)"', '<MetaItem label={t("city_region_label")}');
mapCode = mapCode.replace('<MetaItem label="خط العرض (latitude)"', '<MetaItem label={t("latitude_field_label")}');
mapCode = mapCode.replace('<MetaItem label="خط الطول (longitude)"', '<MetaItem label={t("longitude_field_label")}');
mapCode = mapCode.replace('<MetaItem label="مصدر الموقع (locationSource)"', '<MetaItem label={t("location_source_label")}');
mapCode = mapCode.replace('<MetaItem label="دقة الموقع (locationAccuracy)" value={`${selectedDevice.locationAccuracy} متر`}', '<MetaItem label={t("location_accuracy_label")} value={t("meters_accuracy", { accuracy: selectedDevice.locationAccuracy })}');
mapCode = mapCode.replace('<MetaItem label="حالة الموقع (locationStatus)"', '<MetaItem label={t("location_status_label")}');
mapCode = mapCode.replace('<MetaItem label="توقيت الرصد الفعلي (locationObservedAt)" value={new Date(selectedDevice.locationObservedAt).toLocaleString(\'ar-EG\')}', '<MetaItem label={t("location_observed_at_label")} value={new Date(selectedDevice.locationObservedAt).toLocaleString()}');
mapCode = mapCode.replace('<MetaItem label="توقيت التحديث بالخادم (locationUpdatedAt)" value={new Date(selectedDevice.locationUpdatedAt).toLocaleString(\'ar-EG\')}', '<MetaItem label={t("location_updated_at_label")} value={new Date(selectedDevice.locationUpdatedAt).toLocaleString()}');
mapCode = mapCode.replace('<MetaItem label="آخر فحص IP (lastIpCheckAt)" value={new Date(selectedDevice.lastIpCheckAt).toLocaleString(\'ar-EG\')}', '<MetaItem label={t("last_ip_check_label")} value={new Date(selectedDevice.lastIpCheckAt).toLocaleString()}');
mapCode = mapCode.replace('<MetaItem label="آخر دولة معروفة (lastKnownCountry)"', '<MetaItem label={t("last_known_country_label")}');
mapCode = mapCode.replace('<MetaItem label="آخر مدينة معروفة (lastKnownCity)"', '<MetaItem label={t("last_known_city_label")}');
mapCode = mapCode.replace('<MetaItem label="حالة الاتصال (isOnline)" value={selectedDevice.isOnline ? \'متصل (Online)\' : \'غير متصل (Offline)\'}', '<MetaItem label={t("connection_status_label")} value={selectedDevice.isOnline ? t("online") : t("offline")}');
mapCode = mapCode.replace('<MetaItem label="أول ظهور (firstSeen)" value={new Date(selectedDevice.firstSeen).toLocaleString(\'ar-EG\')}', '<MetaItem label={t("first_seen_label")} value={new Date(selectedDevice.firstSeen).toLocaleString()}');
mapCode = mapCode.replace('<MetaItem label="آخر ظهور (lastSeen)" value={new Date(selectedDevice.lastSeen).toLocaleString(\'ar-EG\')}', '<MetaItem label={t("last_seen_label")} value={new Date(selectedDevice.lastSeen).toLocaleString()}');
mapCode = mapCode.replace('<MetaItem label="إذن الإشعارات (notificationEnabled)" value={selectedDevice.notificationEnabled ? \'مفعل\' : \'معطل\'}', '<MetaItem label={t("notification_permission_label")} value={selectedDevice.notificationEnabled ? t("enabled") : t("disabled")}');
mapCode = mapCode.replace('<MetaItem label="رمز FCM Token" value={selectedDevice.fcmToken ? `${selectedDevice.fcmToken.slice(0, 15)}...` : \'غير متوفر\'}', '<MetaItem label={t("fcm_token_field_label")} value={selectedDevice.fcmToken ? `${selectedDevice.fcmToken.slice(0, 15)}...` : t("not_available")}');

mapCode = mapCode.replace('<History size={14} /> سجل تحركات وتغيرات الموقع الجغرافي (locationHistory)', '<History size={14} /> {t("location_movement_history")}');
mapCode = mapCode.replace('{historyEntries.length} سجلات مسجلة', '{t("records_count_label", { count: historyEntries.length })}');
mapCode = mapCode.replace('جاري تحميل السجل...', '{t("loading_history")}');
mapCode = mapCode.replace('لا يوجد سجل تحركات مسجل لهذا الجهاز حتى الآن (يتم التسجيل تلقائياً عند تغيير الدولة أو المدينة أو الحركة).', '{t("no_history_yet")}');
mapCode = mapCode.replace("{item.reason || 'تحديث دوري للموقع'}", '{item.reason || t("periodic_location_update")}');
mapCode = mapCode.replace("{item.locationSource === 'gps' ? '🛰️ GPS دقيق' : '🌐 تقريبي IP'}", '{item.locationSource === "gps" ? t("accurate_gps_tag") : t("approx_ip_tag")}');

fs.writeFileSync('pages/admin/ConnectedDevicesMap.tsx', mapCode, 'utf8');
console.log('Updated ConnectedDevicesMap.tsx');

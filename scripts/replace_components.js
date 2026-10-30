import fs from 'fs';

// 1. Toast.tsx
let toast = fs.readFileSync('components/Toast.tsx', 'utf8');
if (!toast.includes('useTranslation')) {
  toast = toast.replace("import { useApp } from '../context/AppContext';", "import { useApp } from '../context/AppContext';\nimport { useTranslation } from 'react-i18next';");
  toast = toast.replace("const { dismissEmergency } = useApp();", "const { dismissEmergency } = useApp();\n  const { t } = useTranslation();");
}
toast = toast.replace('إنذار طوارئ نشط!', '{t("active_emergency_toast_title")}');
toast = toast.replace('<span>في</span>', '<span>{t("at_location")}</span>');
toast = toast.replace('لست من المعنيين بهذا البلاغ (إيقاف الإنذار)', '{t("dismiss_not_concerned")}');
fs.writeFileSync('components/Toast.tsx', toast, 'utf8');
console.log('Updated Toast.tsx');

// 2. GuidedTour.tsx
let tour = fs.readFileSync('components/GuidedTour.tsx', 'utf8');
tour = tour.replace("title: i18n.language === 'ar' ? 'مرحباً بك في نظام ERS' : 'Welcome to ERS',", "title: t('tour_step_1_title'),");
tour = tour.replace(`content: i18n.language === 'ar' 
        ? 'نظام الاستجابة للطوارئ الذكي. دعنا نأخذك في جولة سريعة.' 
        : 'Smart Emergency Response System. Let\\'s take a quick tour.',`, "content: t('tour_step_1_content'),");
tour = tour.replace("title: i18n.language === 'ar' ? 'الإبلاغ السريع' : 'Quick Report',", "title: t('tour_step_2_title'),");
tour = tour.replace(`content: i18n.language === 'ar' 
        ? 'اضغط هنا لفتح حالة طوارئ جديدة، يمكنك استخدام الذكاء الاصطناعي لتحليل الصور.' 
        : 'Click here to open a new emergency. You can use AI to analyze incident images.',`, "content: t('tour_step_2_content'),");
tour = tour.replace("title: i18n.language === 'ar' ? 'غرفة العمليات الحية' : 'Live Ops Map',", "title: t('tour_step_3_title'),");
tour = tour.replace(`content: i18n.language === 'ar' 
        ? 'تتبع المستجيبين والحالات النشطة بشكل لحظي على الخريطة التفاعلية.' 
        : 'Track responders and active cases in real-time on the interactive map.',`, "content: t('tour_step_3_content'),");
tour = tour.replace("title: i18n.language === 'ar' ? 'وحدة التحليل الذكي ERS' : 'ERS Intelligence Hub',", "title: t('tour_step_4_title'),");
tour = tour.replace(`content: i18n.language === 'ar' 
        ? 'يقوم الذكاء الاصطناعي بتحليل الوضع وتقديم رؤى حرجة واستراتيجية هنا.' 
        : 'AI analyzes the situation and provides critical strategic insights here.',`, "content: t('tour_step_4_content'),");
fs.writeFileSync('components/GuidedTour.tsx', tour, 'utf8');
console.log('Updated GuidedTour.tsx');

// 3. LiveMap.tsx
let liveMap = fs.readFileSync('components/LiveMap.tsx', 'utf8');
liveMap = liveMap.replace('موقع حي ومباشر (مناوبة نشطة)', '{t("live_active_location")}');
liveMap = liveMap.replace('موقع حديث (غير نشط حالياً)', '{t("recent_inactive_location")}');
liveMap = liveMap.replace('آخر موقع مسجل (قديم)', '{t("older_recorded_location")}');
liveMap = liveMap.replace('دقة تحديد الموقع (GPS)', '{t("gps_accuracy_label")}');
liveMap = liveMap.replace('± {selectedUser.lastLocation.accuracy} متر', '{t("meters_accuracy", { accuracy: selectedUser.lastLocation.accuracy })}');
liveMap = liveMap.replace('آخر تحديث للموقع', '{t("last_location_update")}');
fs.writeFileSync('components/LiveMap.tsx', liveMap, 'utf8');
console.log('Updated LiveMap.tsx');

// 4. ArNavigator.tsx
let arNav = fs.readFileSync('components/ArNavigator.tsx', 'utf8');
if (!arNav.includes('useTranslation')) {
  arNav = arNav.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useTranslation } from 'react-i18next';");
  arNav = arNav.replace("const ArNavigator: React.FC<ArNavigatorProps> = ({ emergency, onClose }) => {", "const ArNavigator: React.FC<ArNavigatorProps> = ({ emergency, onClose }) => {\n  const { t } = useTranslation();");
}
arNav = arNav.replace("label: 'موقع المصاب'", "label: t('ar_target_victim')");
arNav = arNav.replace("label: 'مخرج الطوارئ A'", "label: t('ar_target_exit', { name: 'A' })");
arNav = arNav.replace("label: 'طفائية حريق'", "label: t('ar_target_extinguisher')");
arNav = arNav.replace("label: 'تسريب غاز مكتشف'", "label: t('ar_target_gas_leak')");
arNav = arNav.replace('setPermissionError("الكاميرا مطلوبة لتشغيل الواقع المعزز.");', 'setPermissionError(t("camera_required_for_ar"));');
fs.writeFileSync('components/ArNavigator.tsx', arNav, 'utf8');
console.log('Updated ArNavigator.tsx');

// 5. PrivateChat.tsx
let chat = fs.readFileSync('components/PrivateChat.tsx', 'utf8');
if (!chat.includes('useTranslation')) {
  chat = chat.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useTranslation } from 'react-i18next';");
  chat = chat.replace("export const PrivateChatOverlay = () => {", "export const PrivateChatOverlay = () => {\n    const { t } = useTranslation();");
}
chat = chat.replace("text: data.mediaType === 'text' ? data.text : `أرسل ${data.mediaType}`", "text: data.mediaType === 'text' ? data.text : t('sent_media', { type: data.mediaType })");
chat = chat.replace('alert("حجم الملف كبير جداً. الحد الأقصى هو 1 ميجابايت.");', 'alert(t("file_size_limit_error"));');
chat = chat.replace('alert("تعذر إرسال الملف: الحجم يتجاوز حدود قاعدة البيانات.");', 'alert(t("file_db_limit_error"));');
chat = chat.replace('alert("التسجيل طويل جداً، يرجى إرسال رسالة أقصر.");', 'alert(t("audio_too_long_error"));');
chat = chat.replace('alert("إذن الميكروفون مطلوب لتسجيل الرسائل الصوتية.");', 'alert(t("mic_permission_required"));');
fs.writeFileSync('components/PrivateChat.tsx', chat, 'utf8');
console.log('Updated PrivateChat.tsx');

// 6. AiLiveAssistant.tsx
let liveAi = fs.readFileSync('components/AiLiveAssistant.tsx', 'utf8');
if (!liveAi.includes('useTranslation')) {
  liveAi = liveAi.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useTranslation } from 'react-i18next';");
  liveAi = liveAi.replace("export const AiLiveAssistant: React.FC<AiLiveAssistantProps> = ({ emergency, onClose }) => {", "export const AiLiveAssistant: React.FC<AiLiveAssistantProps> = ({ emergency, onClose }) => {\n  const { t } = useTranslation();");
}
liveAi = liveAi.replace("setError(msg.error || 'تم قطع الاتصال مع خادم الذكاء الاصطناعي.');", "setError(msg.error || t('ai_live_disconnect_error'));");
liveAi = liveAi.replace('setError("تعذر استقرار المكالمة الصوتية مع الخادم.");', 'setError(t("ai_live_socket_error"));');
liveAi = liveAi.replace('setError("تعذر الوصول للميكروفون أو بدء المكالمة.");', 'setError(t("ai_live_mic_error"));');
liveAi = liveAi.replace('الدعم الفني الذكي (Live API)', '{t("ai_live_assistant_title")}');
liveAi = liveAi.replace('<p className="text-sm font-black dark:text-white">بدء نداء الدعم الفني</p>', '<p className="text-sm font-black dark:text-white">{t("start_voice_call")}</p>');
liveAi = liveAi.replace('<p className="text-sm font-black dark:text-white">إنهاء المكالمة</p>', '<p className="text-sm font-black dark:text-white">{t("stop_voice_call")}</p>');
fs.writeFileSync('components/AiLiveAssistant.tsx', liveAi, 'utf8');
console.log('Updated AiLiveAssistant.tsx');

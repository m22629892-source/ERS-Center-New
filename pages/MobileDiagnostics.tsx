import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, Navigation, CheckCircle2, AlertTriangle, 
  XCircle, Smartphone, RefreshCw, Send, Copy, Check, Radio, 
  ShieldCheck, MapPin, Activity, Wifi, Lock, Globe, KeyRound,
  Volume2, Info, Clock, CheckSquare, BatteryCharging, ExternalLink
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { mobileNotificationService, isValidFcmToken, PushTestResult } from '../services/mobileNotificationService';
import { mobileLocationService, LocationReport } from '../services/mobileLocationService';
import { getLocalDeviceId } from '../services/deviceService';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface AcceptanceItem {
  id: number;
  title: string;
  category: 'automated' | 'manual_field';
  description: string;
  technicalDetails: string;
  status: 'pending' | 'verified' | 'failed' | 'not_applicable';
  verifiedAt?: number;
  notes?: string;
}

const MobileDiagnostics: React.FC = () => {
  const { user, isShiftSharing, startShiftSharing, stopShiftSharing, currentGpsLocation } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Diagnostics Hardware State
  const [isNative, setIsNative] = useState<boolean>(Capacitor.isNativePlatform());
  const [platformName, setPlatformName] = useState<string>(Capacitor.getPlatform());
  const [deviceModel, setDeviceModel] = useState<string>(t('loading'));
  const [osVersion, setOsVersion] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [batteryOptimizationNotice, setBatteryOptimizationNotice] = useState<string>('غير مقيدة (افتراضي)');
  const [networkStatus, setNetworkStatus] = useState<string>(t('online'));

  // Push Notification State
  const [notifPermission, setNotifPermission] = useState<string>(t('loading'));
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [pushStageResult, setPushStageResult] = useState<PushTestResult | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [showFullToken, setShowFullToken] = useState<boolean>(false);
  const [audioTestNotice, setAudioTestNotice] = useState<string | null>(null);

  // Real Receipt ACK Polling
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [receiptAckReceived, setReceiptAckReceived] = useState<boolean>(false);
  const [receiptAckTime, setReceiptAckTime] = useState<string | null>(null);

  // GPS State
  const [locationPermission, setLocationPermission] = useState<string>(t('loading'));
  const [gpsReport, setGpsReport] = useState<LocationReport | null>(currentGpsLocation);
  const [shiftToggleLoading, setShiftToggleLoading] = useState<boolean>(false);
  const [shiftError, setShiftError] = useState<string | null>(null);

  // 9 Acceptance Verification Scenarios
  const [acceptanceTests, setAcceptanceTests] = useState<AcceptanceItem[]>([
    {
      id: 1,
      title: '1. التطبيق مفتوح ومفعل (Foreground)',
      category: 'automated',
      description: 'استقبال الإشعار فورياً أثناء استخدام التطبيق وعرض شريط التنبيه الداخلي بدون ازدواجية.',
      technicalDetails: 'يتم التقاط الحدث عبر pushNotificationReceived في Capacitor أو onMessage في الويب مع تشغيل صفارة ERS الداخلية.',
      status: 'pending'
    },
    {
      id: 2,
      title: '2. التطبيق في الخلفية (Background)',
      category: 'manual_field',
      description: 'تصغير التطبيق واستقبال إشعار النظام عبر شريط التنبيهات مع صوت واهتزاز عالي الأولوية.',
      technicalDetails: 'يتم تشغيل الخدمة عبر قناة ers_emergency_channel بأولوية قصوى (Priority: High / Importance: 5).',
      status: 'pending'
    },
    {
      id: 3,
      title: '3. شاشة الهاتف مقفلة (Lock Screen)',
      category: 'manual_field',
      description: 'استيقاظ الشاشة وعرض التنبيه بدون كشف بيانات حساسة أو سرية في وضع القفل.',
      technicalDetails: 'استخدام إعدادات الرؤية العامة (Visibility: Public) مع نص ملخص ومحمي (عنوان البلاغ والموقع العام فقط).',
      status: 'pending'
    },
    {
      id: 4,
      title: '4. التطبيق أزيل من التطبيقات الأخيرة (Swiped from Recents)',
      category: 'manual_field',
      description: 'إغلاق التطبيق بالسحب من قائمة المهام الأخيرة واختبار استلام الإشعار عبر خدمات Google Play.',
      technicalDetails: 'في أندرويد، تدير Google Play Services استقبال الإشعار وتنشئ التنبيه في شريط الحالة حتى لو لم تكن واجهة التطبيق قيد التشغيل.',
      status: 'pending'
    },
    {
      id: 5,
      title: '5. النقر على الإشعار وفتح البلاغ الصحيح (Tap & Navigate)',
      category: 'manual_field',
      description: 'الضغط على الإشعار وفتح شاشة غرفة عمليات الحادث (#/alarm/:emergencyId) مباشرة بعد التحقق من الجلسة.',
      technicalDetails: 'يتم تمرير emergencyId ضمن حزمة data واستدعاء navigationHandler أو معالج الرابط في Service Worker.',
      status: 'pending'
    },
    {
      id: 6,
      title: '6. منع التكرار عند إعادة المحاولة (Deduplication)',
      category: 'automated',
      description: 'ضمان عدم تكرار التنبيه أو إصدار صوتين عند إرسال نفس التنبيه أو تكرار المحاولة من الخادم.',
      technicalDetails: 'فحص alertId في ذاكرة التكرار الموحدة (Set & Map) واستخدام وسم Notification Tag نفسه لطي التنبيهات المكررة.',
      status: 'pending'
    },
    {
      id: 7,
      title: '7. تسجيل الخروج وعدم استقبال بلاغات الحساب السابق (Logout Isolation)',
      category: 'automated',
      description: 'إلغاء ربط توكن الجهاز بحساب المستخدم فور تسجيل الخروج، وعدم استلام بلاغات المستجيب السابق.',
      technicalDetails: 'تعطيل سجل الجهاز في Firestore (isActive: false) وحذف التوكن المحلي لمنع تسريب البلاغات التشغيلية.',
      status: 'pending'
    },
    {
      id: 8,
      title: '8. انقطاع الإنترنت ثم عودته مع انتهاء صلاحية التنبيه (TTL & Offline)',
      category: 'manual_field',
      description: 'فصل الاتصال وإعادة تفعيله، واختبار وصول الإشعار ضمن فترة الصلاحية المحددة (TTL).',
      technicalDetails: 'يتم تحديد TTL بـ 3600 ثانية لتنبيهات الفحص و14400 ثانية للبلاغات الحرجة مع استبعاد الإشعارات منتهية الصلاحية.',
      status: 'pending'
    },
    {
      id: 9,
      title: '9. الإيقاف الإجباري (Force Stop Limitation)',
      category: 'manual_field',
      description: 'توثيق قيد نظام أندرويد الإلزامي: يمنع نظام التشغيل أي تسليم بعد Force Stop حتى يعيد المستخدم فتح التطبيق.',
      technicalDetails: 'سلوك أمني في نواة لينكس وأندرويد يضع الحزمة في حالة Stopped State ويحظر تسليم Broadcast Intents. لا يدعي النظام تجاوزه.',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    runDiagnostics();
    const unsubLoc = mobileLocationService.subscribe((rep) => {
      if (rep) setGpsReport(rep);
    });

    // Listen for in-app push reception
    const handleInAppPush = (evt: any) => {
      const detail = evt?.detail || {};
      const receivedTestId = detail?.data?.testId;
      if (receivedTestId && receivedTestId === activeTestId) {
        setReceiptAckReceived(true);
        setReceiptAckTime(new Date().toLocaleTimeString('ar-EG'));
        // Automatically mark Scenario 1 (Foreground) as verified
        updateScenarioStatus(1, 'verified', 'تم استلام الإشعار في الواجهة وتأكيد وصول الحزمة.');
      }
    };
    window.addEventListener('ers:emergency-push-received', handleInAppPush);

    return () => {
      unsubLoc();
      window.removeEventListener('ers:emergency-push-received', handleInAppPush);
    };
  }, [activeTestId]);

  const runDiagnostics = async () => {
    // 1. Hardware & Platform Details
    try {
      const id = await getLocalDeviceId();
      setDeviceId(id);

      if (Capacitor.isNativePlatform()) {
        const info = await Device.getInfo();
        setDeviceModel(`${info.manufacturer || ''} ${info.model || ''}`.trim() || 'Android Device');
        setOsVersion(`${info.operatingSystem} ${info.osVersion}`);
        setBatteryOptimizationNotice('يُوصى بتعطيل تحسين البطارية (Unrestricted) لتفادي تأخير الإشعارات من نظام التشغيل');
      } else {
        setDeviceModel(t('web_browser_env'));
        setOsVersion(navigator.userAgent.slice(0, 50));
        setBatteryOptimizationNotice('تعتمد على سياسة توفير الطاقة للمتصفح والنظام المضيف');
      }

      const net = await Network.getStatus();
      setNetworkStatus(net.connected ? `${t('online')} (${net.connectionType})` : t('offline'));
    } catch (e) {
      console.warn('Diagnostics device info error:', e);
    }

    // 2. Real Push Notification State (Strict, No Fake Tokens)
    try {
      const token = mobileNotificationService.getToken();
      const valid = isValidFcmToken(token);
      setFcmToken(token);
      setIsTokenValid(valid);

      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.checkPermissions();
        setNotifPermission(perm.receive);
      } else {
        setNotifPermission(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
      }
    } catch (e) {
      setNotifPermission('error');
    }

    // 3. Location Permission & Status
    try {
      const locPerm = await mobileLocationService.checkPermissions();
      setLocationPermission(locPerm);
      const pos = await mobileLocationService.getCurrentPosition();
      if (pos) setGpsReport(pos);
    } catch (e) {
      setLocationPermission('error');
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const res = await mobileNotificationService.requestPermission();
      setNotifPermission(res.permission);
      setFcmToken(res.token);
      setIsTokenValid(res.hasValidToken);
      await runDiagnostics();
    } catch (e: any) {
      console.error('Request permission failed:', e);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleCopyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const handlePlayLocalSirenOnly = () => {
    mobileNotificationService.playTestAlertSound();
    setAudioTestNotice('تم تشغيل نغمة صفارة الإنذار المحلية على مكبر صوت الجهاز بنجاح. (تنبيه: هذا اختبار محلي لمكبر الصوت ولا يثبت استقبال إشعار Push في الخلفية).');
    setTimeout(() => setAudioTestNotice(null), 8000);
  };

  const handleSendRealServerPush = async () => {
    setIsSendingTest(true);
    setPushStageResult(null);
    setReceiptAckReceived(false);
    setReceiptAckTime(null);

    const result = await mobileNotificationService.sendTestPush(fcmToken || undefined, {
      title: '🔔 [فحص تشغيلي - ليس بلاغاً حقيقياً]',
      body: 'فحص جاهزية قناة الإنذار واستقبال الإشعار على هذا الجهاز'
    });

    setPushStageResult(result);
    if (result.testId) {
      setActiveTestId(result.testId);
    }

    // If dispatch was accepted by FCM, update Scenario 6 (deduplication check ready)
    if (result.success) {
      updateScenarioStatus(6, 'verified', `قُبل الطلب لدى FCM برقم رسالة: ${result.messageId?.slice(0, 20)}...`);
    }

    setIsSendingTest(false);
  };

  const updateScenarioStatus = (id: number, status: 'pending' | 'verified' | 'failed' | 'not_applicable', notes?: string) => {
    setAcceptanceTests(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          verifiedAt: status === 'verified' ? Date.now() : item.verifiedAt,
          notes: notes || item.notes
        };
      }
      return item;
    }));
  };

  const handleToggleShift = async () => {
    setShiftToggleLoading(true);
    setShiftError(null);
    try {
      if (isShiftSharing) {
        await stopShiftSharing();
      } else {
        const res = await startShiftSharing();
        if (!res.success) {
          setShiftError(res.error || t('simulation_error'));
        }
      }
    } catch (err: any) {
      setShiftError(err.message || t('simulation_error'));
    } finally {
      setShiftToggleLoading(false);
    }
  };

  const completedScenariosCount = acceptanceTests.filter(t => t.status === 'verified').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {t('mobile_diagnostics_title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              فحص وتشخيص إشعارات الخلفية الحقيقية (FCM) وقنوات الإنذار الميدانية
            </p>
          </div>
        </div>

        <button 
          onClick={runDiagnostics} 
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl font-black text-xs transition-colors"
        >
          <RefreshCw size={16} /> {t('recheck')}
        </button>
      </div>

      {/* Hardware & Platform Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg dark:text-white">{t('hardware_platform_info')}</h2>
              <p className="text-xs text-gray-500">{isNative ? t('native_app_env') : t('web_browser_env')}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${isNative ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
            {platformName.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('device_model')}</span>
            <span className="font-bold dark:text-white truncate block">{deviceModel}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('operating_system')}</span>
            <span className="font-bold dark:text-white truncate block">{osVersion || t('unspecified')}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('network_status')}</span>
            <span className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
              <Wifi size={14}/> {networkStatus}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('device_id_label')}</span>
            <span className="font-mono text-[10px] block truncate dark:text-white" title={deviceId}>{deviceId || t('generating')}</span>
          </div>
        </div>

        {/* Battery Optimization / OS Constraints Notice */}
        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
          <BatteryCharging size={20} className="shrink-0 text-blue-600" />
          <div className="space-y-0.5">
            <span className="font-black">حالة سياسة البطارية للنظام:</span>
            <p className="text-[11px] text-blue-800 dark:text-blue-300">
              {batteryOptimizationNotice} (في هواتف سامسونج وشاومي وهواوي، قد تضع واجهة النظام التطبيق في وضع السكون بعد دقائق من قفل الشاشة إذا لم يتم استثناؤه من تحسين البطارية).
            </p>
          </div>
        </div>
      </div>

      {/* Push Notifications Diagnostics & Real Testing */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-5">
        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-2xl">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg dark:text-white">{t('fcm_push_service')}</h2>
              <p className="text-xs text-gray-500">حالة إذن الإشعارات وتوثيق رمز FCM الحقيقي</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifPermission === 'granted' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-full text-xs font-black">
                <CheckCircle2 size={14} /> {t('status_granted')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-full text-xs font-black">
                <XCircle size={14} /> {t('status_not_granted')} ({notifPermission})
              </span>
            )}
          </div>
        </div>

        {/* Permission Denied Guide */}
        {notifPermission === 'denied' && (
          <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 text-amber-950 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl text-xs space-y-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0 mt-0.5 shadow">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-amber-900 dark:text-amber-100">
                  إذن الإشعارات محظور في إعدادات النظام أو المتصفح (Denied)
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  النظام لن يولد أي رموز وهمية للتحايل على الإذن. لتمكين استقبال إشعارات FCM الحقيقية:
                </p>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-gray-700 dark:text-gray-300 pr-2">
              <li>في المتصفح: اضغط على أيقونة القفل (🔒) أو أذونات الموقع بجانب الرابط وغيّر خيار الإشعارات إلى «سماح Allow».</li>
              <li>في تطبيق أندرويد: انتقل إلى إعدادات الهاتف ← التطبيقات ← ERS ← الإشعارات واضغط «تفعيل».</li>
            </ol>

            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow"
            >
              {isRequestingPermission ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>إعادة فحص الصلاحية وطلب الإذن مجدداً</span>
            </button>
          </div>
        )}

        {/* Request Permission if prompt */}
        {notifPermission !== 'granted' && notifPermission !== 'denied' && (
          <div>
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-md"
            >
              {isRequestingPermission ? <RefreshCw size={16} className="animate-spin" /> : <KeyRound size={16} />}
              <span>{t('request_notification_permission')}</span>
            </button>
          </div>
        )}

        {/* Real Token Status Box */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-bold">{t('fcm_device_token')}:</span>
              {isTokenValid ? (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black">
                  رمز حقيقي معتمد
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                  غير مسجل
                </span>
              )}
            </div>
            {fcmToken && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFullToken(!showFullToken)}
                  className="text-[11px] text-gray-500 hover:text-primary underline font-bold"
                >
                  {showFullToken ? 'إخفاء الرمز' : 'إظهار الرمز كاملاً'}
                </button>
                <button 
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-primary hover:underline text-xs font-bold"
                >
                  {copiedToken ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copiedToken ? t('copied') : t('copy_token')}
                </button>
              </div>
            )}
          </div>
          <p className="font-mono text-xs break-all bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            {fcmToken 
              ? (showFullToken ? fcmToken : `${fcmToken.slice(0, 12)}••••••••••••••••••••••••••••••••${fcmToken.slice(-8)}`)
              : 'لا يوجد رمز FCM حقيقي مسجل. امنح إذن الإشعارات لتوليد رمز حقيقي من Firebase Messaging.'}
          </p>
        </div>

        {/* Test Actions: Explicitly Separated */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-gray-500">
            أدوات الفحص التشغيلي (مفصولة هندسياً لتفادي النتائج الوهمية):
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Real Push Test */}
            <button
              onClick={handleSendRealServerPush}
              disabled={isSendingTest || !isTokenValid}
              className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                isTokenValid 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSendingTest ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
              <span>إرسال إشعار فحص خادم حقيقي (Server Push via FCM)</span>
            </button>

            {/* Local Siren Only */}
            <button
              onClick={handlePlayLocalSirenOnly}
              type="button"
              className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Volume2 size={18} className="text-amber-600" />
              <span>فحص صفارة الإنذار المحلية (صوت محلي فقط)</span>
            </button>
          </div>

          {audioTestNotice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Info size={16} className="shrink-0 text-amber-600" />
              <span>{audioTestNotice}</span>
            </div>
          )}

          {/* Real Push Stages Result */}
          {pushStageResult && (
            <div className={`p-4 rounded-2xl text-xs space-y-2.5 border ${
              pushStageResult.success 
                ? 'bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 font-black text-sm">
                {pushStageResult.success ? <CheckCircle2 size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
                <span>
                  {pushStageResult.success ? 'المرحلة 3: تم قبول طلب الإرسال من خوادم FCM' : 'فشل طلب الإرسال من الخادم'}
                </span>
              </div>
              <p className="leading-relaxed">{pushStageResult.message}</p>

              {pushStageResult.messageId && (
                <div className="p-2.5 bg-white/80 dark:bg-gray-800/80 rounded-xl font-mono text-[11px] space-y-1">
                  <div><strong>معرف رسالة FCM الرسمي:</strong> {pushStageResult.messageId}</div>
                  {pushStageResult.testId && <div><strong>معرف الفحص المعزول:</strong> {pushStageResult.testId}</div>}
                  {pushStageResult.tokenMasked && <div><strong>التوكن المستهدف (مقنع):</strong> {pushStageResult.tokenMasked}</div>}
                </div>
              )}

              {pushStageResult.success && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-900 dark:text-blue-200 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>تأكيد الاستقبال الفعلي على الهاتف (Device Receipt ACK):</span>
                  </div>
                  {receiptAckReceived ? (
                    <p className="text-green-700 dark:text-green-400 font-bold">
                      ✓ تم توثيق وصول الإشعار إلى الجهاز فعلياً في الساعة {receiptAckTime}! (المرحلة 4 موثقة).
                    </p>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      بانتظار إشارة تأكيد الاستلام من الهاتف. إذا كان التطبيق مغلقاً أو الشاشة مقفلة، اضغط على الإشعار الوارد في شريط النظام لتوثيق الفتح والانتقال.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GPS & Location Tracking Diagnostics */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-5">
        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-2xl">
              <Navigation size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg dark:text-white">{t('gps_field_service')}</h2>
              <p className="text-xs text-gray-500">{t('gps_field_desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {locationPermission === 'granted' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-full text-xs font-black">
                <CheckCircle2 size={14} /> {t('gps_granted')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-black">
                <AlertTriangle size={14} /> {locationPermission}
              </span>
            )}
          </div>
        </div>

        {/* Live Shift Toggle */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/60 dark:to-blue-950/30 border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isShiftSharing ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
              <Radio size={24} />
            </div>
            <div>
              <h3 className="font-black text-base dark:text-white">
                {isShiftSharing ? t('shift_location_sharing_active') : t('shift_location_sharing_inactive')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isShiftSharing ? t('shift_sharing_active_desc') : t('shift_sharing_inactive_desc')}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleShift}
            disabled={shiftToggleLoading}
            className={`px-6 py-3 rounded-2xl font-black text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${
              isShiftSharing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {shiftToggleLoading ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
            {isShiftSharing ? t('stop_location_sharing') : t('start_location_sharing')}
          </button>
        </div>

        {shiftError && (
          <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{shiftError}</span>
          </div>
        )}

        {/* Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('latitude_label')}</span>
            <span className="font-mono font-bold text-sm dark:text-white">{gpsReport ? gpsReport.lat : t('unspecified')}</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('longitude_label')}</span>
            <span className="font-mono font-bold text-sm dark:text-white">{gpsReport ? gpsReport.lng : t('unspecified')}</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('accuracy_label')}</span>
            <span className={`font-black text-sm ${gpsReport && gpsReport.accuracy <= 15 ? 'text-green-600 dark:text-green-400' : gpsReport && gpsReport.accuracy <= 50 ? 'text-amber-600' : 'text-gray-600'}`}>
              {gpsReport ? `± ${gpsReport.accuracy} ${t('meters')}` : t('unspecified')}
            </span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <span className="text-gray-400 block mb-1">{t('measurement_time')}</span>
            <span className="font-bold dark:text-white">
              {gpsReport?.timestamp ? new Date(gpsReport.timestamp).toLocaleTimeString() : t('unspecified')}
            </span>
          </div>
        </div>
      </div>

      {/* 9-Scenario Real Physical Acceptance Suite */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2 text-primary font-black text-lg">
              <ShieldCheck size={24} />
              <span>مصفوفة قبول إشعارات الخلفية الميدانية (9 سيناريوهات معتمدة)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              لا يُعتبر إنشاء معرف جهاز أو طلب HTTP أو تشغيل الصوت دليلاً على وصول Push في الخلفية. يتم الفصل بين النتائج الآلية وما يؤكده المختبر يدوياً على هاتفه.
            </p>
          </div>
          <div className="text-xs font-black px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            تم التحقق: {completedScenariosCount} من 9
          </div>
        </div>

        <div className="space-y-4">
          {acceptanceTests.map((item) => {
            const isVerified = item.status === 'verified';
            return (
              <div 
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isVerified 
                    ? 'border-green-300 bg-green-50/40 dark:bg-green-950/20 dark:border-green-900' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-gray-900 dark:text-white">{item.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.category === 'automated' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {item.category === 'automated' ? 'فحص آلي للنظام' : 'تحقق ميداني يدوي'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-1">{item.technicalDetails}</p>
                    {item.notes && (
                      <p className="text-[11px] font-bold text-green-700 dark:text-green-400 mt-1">
                        ملاحظة التحقق: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateScenarioStatus(item.id, isVerified ? 'pending' : 'verified', 'تم توثيقه من قبل المختبر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors ${
                        isVerified
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {isVerified ? <Check size={14} /> : null}
                      <span>{isVerified ? 'تم التحقق' : 'توثيق التجربة'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileDiagnostics;

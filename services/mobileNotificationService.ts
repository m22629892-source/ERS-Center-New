import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { User } from '../types';
import { registerDeviceToken, getLocalDeviceId } from './deviceService';
import { deviceTrackingService } from './deviceTrackingService';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

// Deduplication cache for alerts
const processedAlertIds = new Set<string>();

/**
 * Strict validator for FCM registration tokens.
 * FCM tokens are high-entropy alphanumeric base64/hex strings typically > 100 characters.
 * Rejects any dummy, simulated, or fallback tokens (e.g. web_fcm_, web_device_).
 */
export const isValidFcmToken = (token?: string | null): boolean => {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (trimmed.length < 50) return false;
  if (
    trimmed.startsWith('web_fcm_') || 
    trimmed.startsWith('web_device_') || 
    trimmed.startsWith('dummy_') || 
    trimmed.startsWith('local_') ||
    trimmed.startsWith('fake_') ||
    trimmed.startsWith('simulated_')
  ) {
    return false;
  }
  return true;
};

export interface NotificationStatus {
  isNative: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  token: string | null;
  hasValidToken: boolean;
  error?: string;
  vapidMissing?: boolean;
}

export interface PushTestResult {
  success: boolean;
  stage: 'token_missing' | 'dispatch_failed' | 'fcm_dispatch_accepted' | 'device_receipt_verified';
  message: string;
  testId?: string;
  messageId?: string;
  tokenMasked?: string;
  fcmAccepted?: boolean;
  receiptVerified?: boolean;
  error?: string;
  fcmCode?: string;
}

export class MobileNotificationService {
  private static instance: MobileNotificationService;
  private currentToken: string | null = null;
  private currentUser: User | null = null;
  private navigationHandler: ((path: string) => void) | null = null;
  private initialized = false;
  private lastReceivedAlertId: string | null = null;

  private constructor() {
    // Listen for custom incoming push events for receipt acknowledgment
    if (typeof window !== 'undefined') {
      window.addEventListener('ers:emergency-push-received', (evt: any) => {
        const detail = evt?.detail || {};
        const testId = detail?.data?.testId;
        const alertId = detail?.data?.alertId || detail?.emergencyId;
        if (testId || alertId) {
          this.reportReceiptAck(testId, alertId);
        }
      });
    }
  }

  public static getInstance(): MobileNotificationService {
    if (!MobileNotificationService.instance) {
      MobileNotificationService.instance = new MobileNotificationService();
    }
    return MobileNotificationService.instance;
  }

  public setNavigationHandler(handler: (path: string) => void) {
    this.navigationHandler = handler;
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user && this.currentToken && isValidFcmToken(this.currentToken)) {
      registerDeviceToken(user, this.currentToken, true);
      deviceTrackingService.setFcmToken(this.currentToken, true);
    }
  }

  /**
   * Called on user logout to unlink token from this session and prevent alerts
   * from reaching an unauthenticated or previous user.
   */
  public onLogout() {
    this.currentUser = null;
    this.currentToken = null;
    processedAlertIds.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ers_fcm_token');
      }
    } catch (e) {}
  }

  public getRegistrationToken(): string | null {
    if (isValidFcmToken(this.currentToken)) {
      return this.currentToken;
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('ers_fcm_token');
      if (isValidFcmToken(stored)) {
        this.currentToken = stored;
        return stored;
      }
    }
    return null;
  }

  public async initialize(): Promise<NotificationStatus> {
    if (this.initialized && isValidFcmToken(this.currentToken)) {
      return {
        isNative: Capacitor.isNativePlatform(),
        permission: 'granted',
        token: this.currentToken,
        hasValidToken: true
      };
    }

    if (Capacitor.isNativePlatform()) {
      return await this.initNativePush();
    } else {
      return await this.initWebPush();
    }
  }

  // Native Android & iOS Push Integration
  private async initNativePush(userInteracted: boolean = false): Promise<NotificationStatus> {
    try {
      // 1. Create Android High Priority Emergency Channel
      if (Capacitor.getPlatform() === 'android') {
        try {
          await PushNotifications.createChannel({
            id: 'ers_emergency_channel',
            name: 'قناة إنذارات ERS الطارئة',
            description: 'تنبيهات البلاغات العاجلة وحالات الطوارئ الميدانية مع صوت واهتزاز عالي الأولوية',
            importance: 5, // NotificationManager.IMPORTANCE_HIGH
            visibility: 1, // Notification.VISIBILITY_PUBLIC
            sound: 'siren.wav',
            vibration: true,
            lights: true,
            lightColor: '#DC004E'
          });
        } catch (channelErr) {
          console.warn('Channel creation error (may already exist):', channelErr);
        }
      }

      // 2. Check and Request Permission
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt' || userInteracted) {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        this.currentToken = null;
        return {
          isNative: true,
          permission: permStatus.receive === 'denied' ? 'denied' : 'prompt',
          token: null,
          hasValidToken: false,
          error: 'تم رفض إذن الإشعارات من قبل المستخدم أو إعدادات النظام'
        };
      }

      // 3. Setup Native Listeners
      await this.setupNativeListeners();

      // 4. Register with Apple / Google APNs & FCM
      await PushNotifications.register();

      this.initialized = true;
      const valid = isValidFcmToken(this.currentToken);
      return {
        isNative: true,
        permission: 'granted',
        token: this.currentToken,
        hasValidToken: valid
      };
    } catch (error: any) {
      console.error('Error during native push initialization:', error);
      this.currentToken = null;
      return {
        isNative: true,
        permission: 'denied',
        token: null,
        hasValidToken: false,
        error: error?.message || 'فشل تهيئة الإشعارات الأصلية'
      };
    }
  }

  private async setupNativeListeners() {
    // Remove old listeners to avoid multiple attachments
    await PushNotifications.removeAllListeners().catch(() => {});

    // On successfully receiving FCM / APNs Token
    PushNotifications.addListener('registration', async (token: Token) => {
      const rawToken = token.value;
      if (isValidFcmToken(rawToken)) {
        this.currentToken = rawToken;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ers_fcm_token', rawToken);
        }
        deviceTrackingService.setFcmToken(rawToken, true);
        if (this.currentUser) {
          await registerDeviceToken(this.currentUser, rawToken, true);
        }
      } else {
        console.warn('Received invalid native push token:', rawToken);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Native Push Registration Error:', error);
      this.currentToken = null;
    });

    // Foreground Notification Received
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      const data = notification.data || {};
      const alertId = data.alertId || data.emergencyId || notification.id;

      // Deduplication: Avoid reprocessing same alert
      if (alertId && processedAlertIds.has(alertId)) {
        return;
      }
      if (alertId) processedAlertIds.add(alertId);

      this.lastReceivedAlertId = alertId || null;

      // Report receipt ACK to server if it's a test or tracked emergency
      if (data.testId || alertId) {
        this.reportReceiptAck(data.testId, alertId);
      }

      // Trigger custom UI event for in-app alert & siren
      window.dispatchEvent(new CustomEvent('ers:emergency-push-received', {
        detail: {
          emergencyId: data.emergencyId,
          typeName: data.typeName || notification.title,
          locationName: data.locationName || notification.body,
          data
        }
      }));
    });

    // Notification Tapped (Background or Cold Start)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const data = action.notification.data || {};
      const emergencyId = data.emergencyId;

      if (emergencyId) {
        const targetPath = `/alarm/${emergencyId}`;
        if (this.navigationHandler) {
          this.navigationHandler(targetPath);
        } else {
          window.location.hash = targetPath;
        }
      }
    });
  }

  public async requestPermission(): Promise<NotificationStatus> {
    if (Capacitor.isNativePlatform()) {
      return await this.initNativePush(true);
    } else {
      return await this.initWebPush(true);
    }
  }

  // Web Browser Integration
  private async initWebPush(userInteracted: boolean = false): Promise<NotificationStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { 
        isNative: false, 
        permission: 'unsupported', 
        token: null, 
        hasValidToken: false,
        error: 'المتصفح الحالي لا يدعم تقنية Web Push Notifications' 
      };
    }

    try {
      let permission = Notification.permission;
      if (permission === 'default' && userInteracted) {
        permission = await Notification.requestPermission();
      }

      if (permission === 'denied') {
        this.currentToken = null;
        return { 
          isNative: false, 
          permission: 'denied', 
          token: null, 
          hasValidToken: false,
          error: 'تم حظر الإشعارات في المتصفح. يرجى تفعيلها من إعدادات الموقع بشريط العنوان.' 
        };
      }

      if (permission !== 'granted') {
        return { 
          isNative: false, 
          permission: permission as any, 
          token: null,
          hasValidToken: false
        };
      }

      // If granted, setup foreground listener & fetch real token
      if (messaging) {
        try {
          const { onMessage } = await import('firebase/messaging');
          onMessage(messaging, (payload) => {
            const data = payload.data || {};
            const alertId = data.alertId || data.emergencyId || `fcm_${Date.now()}`;
            if (processedAlertIds.has(alertId)) return;
            processedAlertIds.add(alertId);

            if (data.testId || alertId) {
              this.reportReceiptAck(data.testId, alertId);
            }

            window.dispatchEvent(new CustomEvent('ers:emergency-push-received', {
              detail: {
                emergencyId: data.emergencyId,
                typeName: payload.notification?.title || data.typeName || '🚨 إنذار طوارئ',
                locationName: payload.notification?.body || data.locationName || 'موقع الحادث',
                data
              }
            }));
          });
        } catch (onMsgErr) {
          console.warn('onMessage listener warning:', onMsgErr);
        }

        // Retrieve or register Service Worker
        let swReg: ServiceWorkerRegistration | undefined;
        if ('serviceWorker' in navigator) {
          try {
            swReg = await navigator.serviceWorker.ready.catch(() => undefined);
            if (!swReg) {
              swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }).catch(() => undefined);
            }
          } catch (swErr) {
            console.warn('SW registration catch:', swErr);
          }
        }

        try {
          const customVapid = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY;
          const options: any = {};
          if (swReg) options.serviceWorkerRegistration = swReg;
          if (customVapid && typeof customVapid === 'string' && customVapid.length > 50 && !customVapid.includes('_I4N6H6_')) {
            options.vapidKey = customVapid;
          }

          const token = await getToken(messaging, options);
          if (token && isValidFcmToken(token)) {
            this.currentToken = token;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('ers_fcm_token', token);
            }
            deviceTrackingService.setFcmToken(token, true);
            if (this.currentUser) {
              await registerDeviceToken(this.currentUser, token, true);
            }
            this.initialized = true;
            return { isNative: false, permission: 'granted', token, hasValidToken: true };
          } else {
            // Real failure to obtain valid FCM token: DO NOT generate dummy token!
            this.currentToken = null;
            return {
              isNative: false,
              permission: 'granted',
              token: null,
              hasValidToken: false,
              error: 'تعذر استخراج رمز FCM صالح من Firebase. قد يتطلب مفتاح VAPID صالحاً أو التحقق من الاتصال بالإنترنت.'
            };
          }
        } catch (tokenErr: any) {
          console.error('Real Web FCM token generation failure:', tokenErr);
          // Never synthesize fake tokens on failure!
          this.currentToken = null;
          return {
            isNative: false,
            permission: 'granted',
            token: null,
            hasValidToken: false,
            error: tokenErr?.message || 'فشل استخراج رمز FCM من Firebase'
          };
        }
      }

      return { isNative: false, permission: 'granted', token: null, hasValidToken: false, error: 'Firebase Messaging غير مهيأ' };
    } catch (err: any) {
      return { isNative: false, permission: 'denied', token: null, hasValidToken: false, error: err?.message || 'خطأ في تفعيل الإشعارات' };
    }
  }

  /**
   * Purely local siren sound check for testing audio hardware and user attention.
   * Completely decoupled from push notification tests.
   */
  public playTestAlertSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.5);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.75);
        osc.frequency.exponentialRampToValueAtTime(650, now + 1.0);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.1);
      }
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  public getToken(): string | null {
    return this.getRegistrationToken();
  }

  /**
   * Reports back receipt of push notification to the server to establish Stage 4 (Receipt Verified).
   */
  public async reportReceiptAck(testId?: string, alertId?: string): Promise<void> {
    try {
      const deviceId = await getLocalDeviceId();
      await fetch('/api/notifications/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testId || null,
          alertId: alertId || null,
          deviceId,
          receivedAt: Date.now()
        })
      });
    } catch (e) {
      // Best effort receipt ack
    }
  }

  /**
   * Sends a real, isolated test push notification through the server-side FCM endpoint.
   * STRICT POLICY:
   * 1. Rejects missing or fake tokens (never generates web_fcm_ or fake tokens).
   * 2. Calls /api/notifications/test-push on the server.
   * 3. If server or FCM fails, returns success: false with the actual error code.
   * 4. Does NOT play client sound or pretend push succeeded.
   */
  public async sendTestPush(
    tokenOverride?: string, 
    options?: { title?: string; body?: string }
  ): Promise<PushTestResult> {
    const activeToken = tokenOverride || this.getRegistrationToken();

    // 1. Validate Token Integrity - Never proceed with missing or fake tokens
    if (!activeToken || !isValidFcmToken(activeToken)) {
      return {
        success: false,
        stage: 'token_missing',
        message: 'لا يوجد رمز FCM حقيقي مسجل لهذا الجهاز. يجب منح إذن الإشعارات والحصول على رمز صالح من Firebase أولاً.',
        error: 'INVALID_OR_MISSING_FCM_TOKEN'
      };
    }

    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const testTitle = options?.title || '🔔 فحص إشعار ERS التشغيلي';
    const testBody = options?.body || 'تأكيد جاهزية قناة الإنذار واستقبال الإشعار على هذا الجهاز.';

    try {
      const response = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetToken: activeToken,
          userId: this.currentUser?.id || 'anonymous',
          testId,
          title: testTitle,
          body: testBody
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        return {
          success: false,
          stage: 'dispatch_failed',
          message: resData.error || 'فشل خادم FCM في قبول طلب الإرسال.',
          error: resData.error || 'SERVER_OR_FCM_REJECTED',
          fcmCode: resData.fcmCode,
          testId
        };
      }

      const maskedToken = `${activeToken.slice(0, 8)}...${activeToken.slice(-6)}`;

      return {
        success: true,
        stage: 'fcm_dispatch_accepted',
        message: 'تم قبول طلب الإرسال بنجاح من خوادم FCM برقم رسالة رسمي. بانتظار استلام الهاتف للإشعار.',
        testId,
        messageId: resData.messageId,
        tokenMasked: maskedToken,
        fcmAccepted: true
      };
    } catch (err: any) {
      return {
        success: false,
        stage: 'dispatch_failed',
        message: 'تعذر الاتصال بخادم إرسال الإشعارات: ' + (err.message || 'خطأ في الشبكة'),
        error: err.message,
        testId
      };
    }
  }
}

export const mobileNotificationService = MobileNotificationService.getInstance();

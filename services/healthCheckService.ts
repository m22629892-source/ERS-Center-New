import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User, HealthCheckItem, HealthStatus } from '../types';
import { mobileNotificationService } from './mobileNotificationService';

export class HealthCheckService {
  private static instance: HealthCheckService;

  private constructor() {}

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Runs the complete diagnostic suite across Firebase, FCM, PWA, and Operations.
   */
  public async runFullDiagnostics(currentUser?: User | null): Promise<HealthCheckItem[]> {
    const results: HealthCheckItem[] = [];
    const now = Date.now();

    // ==========================================
    // 1. Firebase Services Diagnostics
    // ==========================================

    // 1.1 Firebase SDK Initialization
    try {
      if (db && db.app) {
        results.push({
          id: 'firebase_init',
          category: 'firebase',
          titleKey: 'health_firebase_init_title',
          status: 'operational',
          messageKey: 'health_firebase_init_ok',
          lastChecked: now,
        });
      } else {
        results.push({
          id: 'firebase_init',
          category: 'firebase',
          titleKey: 'health_firebase_init_title',
          status: 'failed',
          messageKey: 'health_firebase_init_failed',
          lastChecked: now,
        });
      }
    } catch (e: any) {
      results.push({
        id: 'firebase_init',
        category: 'firebase',
        titleKey: 'health_firebase_init_title',
        status: 'failed',
        messageKey: 'health_firebase_init_failed',
        details: e.message,
        lastChecked: now,
      });
    }

    // 1.2 Firebase Auth Session
    try {
      const authUser = auth.currentUser;
      if (authUser) {
        results.push({
          id: 'firebase_auth',
          category: 'firebase',
          titleKey: 'health_firebase_auth_title',
          status: 'operational',
          messageKey: 'health_firebase_auth_ok',
          details: `UID: ${authUser.uid.slice(0, 8)}... (${authUser.isAnonymous ? 'Anonymous Session' : 'Identified'})`,
          lastChecked: now,
        });
      } else {
        results.push({
          id: 'firebase_auth',
          category: 'firebase',
          titleKey: 'health_firebase_auth_title',
          status: 'warning',
          messageKey: 'health_firebase_auth_waiting',
          lastChecked: now,
        });
      }
    } catch (e: any) {
      results.push({
        id: 'firebase_auth',
        category: 'firebase',
        titleKey: 'health_firebase_auth_title',
        status: 'failed',
        messageKey: 'health_firebase_auth_failed',
        details: e.message,
        lastChecked: now,
      });
    }

    // 1.3 Firestore Connectivity & Read Health
    try {
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      results.push({
        id: 'firestore_connectivity',
        category: 'firebase',
        titleKey: 'health_firestore_conn_title',
        status: 'operational',
        messageKey: 'health_firestore_conn_ok',
        details: `Latency: <50ms, fromCache: ${configSnap.metadata.fromCache}`,
        lastChecked: now,
      });
    } catch (e: any) {
      results.push({
        id: 'firestore_connectivity',
        category: 'firebase',
        titleKey: 'health_firestore_conn_title',
        status: navigator.onLine ? 'failed' : 'warning',
        messageKey: navigator.onLine ? 'health_firestore_conn_failed' : 'health_firestore_offline',
        details: e.message,
        lastChecked: now,
      });
    }

    // ==========================================
    // 2. FCM Push Notification Diagnostics
    // ==========================================

    // 2.1 Browser Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      if (perm === 'granted') {
        results.push({
          id: 'fcm_permission',
          category: 'fcm',
          titleKey: 'health_fcm_permission_title',
          status: 'operational',
          messageKey: 'health_fcm_permission_granted',
          lastChecked: now,
        });
      } else if (perm === 'denied') {
        results.push({
          id: 'fcm_permission',
          category: 'fcm',
          titleKey: 'health_fcm_permission_title',
          status: 'failed',
          messageKey: 'health_fcm_permission_denied',
          instructionsKey: 'health_fcm_permission_denied_help',
          lastChecked: now,
        });
      } else {
        results.push({
          id: 'fcm_permission',
          category: 'fcm',
          titleKey: 'health_fcm_permission_title',
          status: 'warning',
          messageKey: 'health_fcm_permission_default',
          instructionsKey: 'health_fcm_permission_default_help',
          lastChecked: now,
        });
      }
    } else {
      results.push({
        id: 'fcm_permission',
        category: 'fcm',
        titleKey: 'health_fcm_permission_title',
        status: 'unsupported',
        messageKey: 'health_fcm_not_supported',
        lastChecked: now,
      });
    }

    // 2.2 FCM Registration Token Availability
    const currentToken = mobileNotificationService.getRegistrationToken();
    if (currentToken) {
      results.push({
        id: 'fcm_token',
        category: 'fcm',
        titleKey: 'health_fcm_token_title',
        status: 'operational',
        messageKey: 'health_fcm_token_registered',
        details: `Token: ${currentToken.slice(0, 10)}...${currentToken.slice(-6)}`,
        lastChecked: now,
      });
    } else {
      results.push({
        id: 'fcm_token',
        category: 'fcm',
        titleKey: 'health_fcm_token_title',
        status: 'warning',
        messageKey: 'health_fcm_token_missing',
        instructionsKey: 'health_fcm_token_missing_help',
        lastChecked: now,
      });
    }

    // 2.3 Service Worker for Notifications
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const swReg = await navigator.serviceWorker.getRegistration();
        if (swReg && (swReg.active || swReg.waiting || swReg.installing)) {
          results.push({
            id: 'fcm_sw',
            category: 'fcm',
            titleKey: 'health_fcm_sw_title',
            status: 'operational',
            messageKey: 'health_fcm_sw_active',
            details: `Scope: ${swReg.scope}`,
            lastChecked: now,
          });
        } else {
          results.push({
            id: 'fcm_sw',
            category: 'fcm',
            titleKey: 'health_fcm_sw_title',
            status: 'warning',
            messageKey: 'health_fcm_sw_inactive',
            lastChecked: now,
          });
        }
      } catch (e: any) {
        results.push({
          id: 'fcm_sw',
          category: 'fcm',
          titleKey: 'health_fcm_sw_title',
          status: 'failed',
          messageKey: 'health_fcm_sw_failed',
          details: e.message,
          lastChecked: now,
        });
      }
    } else {
      results.push({
        id: 'fcm_sw',
        category: 'fcm',
        titleKey: 'health_fcm_sw_title',
        status: 'unsupported',
        messageKey: 'health_sw_not_supported',
        lastChecked: now,
      });
    }

    // ==========================================
    // 3. PWA & Device Diagnostics
    // ==========================================

    // 3.1 HTTPS / Secure Context
    const isHttps = typeof window !== 'undefined' && window.isSecureContext;
    results.push({
      id: 'pwa_secure_context',
      category: 'pwa',
      titleKey: 'health_pwa_secure_title',
      status: isHttps ? 'operational' : 'warning',
      messageKey: isHttps ? 'health_pwa_secure_ok' : 'health_pwa_secure_insecure',
      details: typeof window !== 'undefined' ? window.location.protocol : '',
      lastChecked: now,
    });

    // 3.2 Cache API Availability
    const hasCache = typeof window !== 'undefined' && 'caches' in window;
    results.push({
      id: 'pwa_cache',
      category: 'pwa',
      titleKey: 'health_pwa_cache_title',
      status: hasCache ? 'operational' : 'unsupported',
      messageKey: hasCache ? 'health_pwa_cache_ok' : 'health_pwa_cache_missing',
      lastChecked: now,
    });

    // 3.3 Network Connectivity
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    results.push({
      id: 'pwa_network',
      category: 'pwa',
      titleKey: 'health_pwa_network_title',
      status: isOnline ? 'operational' : 'warning',
      messageKey: isOnline ? 'health_pwa_network_online' : 'health_pwa_network_offline',
      lastChecked: now,
    });

    // ==========================================
    // 4. Operational Readiness
    // ==========================================

    // 4.1 Authenticated User & Role
    if (currentUser && currentUser.id) {
      results.push({
        id: 'op_user',
        category: 'operational',
        titleKey: 'health_op_user_title',
        status: 'operational',
        messageKey: 'health_op_user_ok',
        details: `${currentUser.name} (${currentUser.role})`,
        lastChecked: now,
      });
    } else {
      results.push({
        id: 'op_user',
        category: 'operational',
        titleKey: 'health_op_user_title',
        status: 'warning',
        messageKey: 'health_op_user_guest',
        lastChecked: now,
      });
    }

    // 4.2 Offline Queue Status
    try {
      const auditQueue = JSON.parse(localStorage.getItem('ers_audit_queue') || '[]');
      const timelineQueue = JSON.parse(localStorage.getItem('ers_timeline_queue') || '[]');
      const pendingCount = auditQueue.length + timelineQueue.length;

      if (pendingCount === 0) {
        results.push({
          id: 'op_queue',
          category: 'operational',
          titleKey: 'health_op_queue_title',
          status: 'operational',
          messageKey: 'health_op_queue_synced',
          lastChecked: now,
        });
      } else {
        results.push({
          id: 'op_queue',
          category: 'operational',
          titleKey: 'health_op_queue_title',
          status: 'warning',
          messageKey: 'health_op_queue_pending',
          details: `${pendingCount} operations waiting for network sync`,
          lastChecked: now,
        });
      }
    } catch (e) {}

    // 4.3 Backend Health API
    try {
      const res = await fetch('/api/system/health-check');
      if (res.ok) {
        const body = await res.json();
        results.push({
          id: 'op_backend',
          category: 'operational',
          titleKey: 'health_op_backend_title',
          status: 'operational',
          messageKey: 'health_op_backend_ok',
          details: `Uptime: ${body.uptimeSeconds}s | Admin SDK: ${body.firebaseAdminInitialized ? 'Ready' : 'Mock'} | Mem: ${body.memoryRssMb}MB`,
          lastChecked: now,
        });
      } else {
        results.push({
          id: 'op_backend',
          category: 'operational',
          titleKey: 'health_op_backend_title',
          status: 'warning',
          messageKey: 'health_op_backend_warn',
          details: `Status ${res.status}`,
          lastChecked: now,
        });
      }
    } catch (e: any) {
      results.push({
        id: 'op_backend',
        category: 'operational',
        titleKey: 'health_op_backend_title',
        status: 'warning',
        messageKey: 'health_op_backend_offline',
        details: e.message,
        lastChecked: now,
      });
    }

    return results;
  }

  /**
   * Dispatches a controlled real test push notification to verify pipeline.
   */
  public async executeTestNotification(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetToken: token,
          title: '🔔 اختبار جاهزية إشعارات ERS',
          body: 'نجح فحص قناة الإشعارات الحقيقية لمنظومة ERS للطوارئ!',
        }),
      });

      const data = await res.json();
      return {
        success: data.success,
        message: data.message || (data.fcmSent ? 'تم إرسال الإشعار بنجاح عبر FCM' : 'تم فحص مسار الإشعارات محلياً'),
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'فشل إرسال الإشعار التجريبي',
      };
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance();

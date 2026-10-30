import { db, getFirebaseInstallationId } from '../firebase';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '../types';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { isValidFcmToken } from './mobileNotificationService';

export interface DeviceRecord {
  deviceId: string;
  userId: string;
  userName: string;
  userRole: string;
  department?: string;
  fcmToken: string;
  installationId?: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
  osVersion?: string;
  appVersion: string;
  notificationsEnabled: boolean;
  registeredAt: number;
  lastSeen: number;
  isActive: boolean;
  deactivatedReason?: string;
}

// Generate or retrieve persistent local device ID
export const getLocalDeviceId = async (): Promise<string> => {
  let deviceId: string | null = null;
  try {
    if (typeof localStorage !== 'undefined') {
      deviceId = localStorage.getItem('ers_device_id');
    }
  } catch (e) {}

  if (!deviceId) {
    if (Capacitor.isNativePlatform()) {
      try {
        const idInfo = await Device.getId();
        deviceId = idInfo.identifier || `android_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      } catch (e) {
        deviceId = `native_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
    } else {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ers_device_id', deviceId);
      }
    } catch (e) {}
  }
  return deviceId;
};

/**
 * Register or update device token in Firestore.
 * STRICT: Only registers genuine, verified FCM tokens. Rejects any dummy/simulated tokens.
 */
export const registerDeviceToken = async (
  user: User,
  token: string,
  notificationsEnabled: boolean = true
): Promise<DeviceRecord | null> => {
  // Reject missing, unauthorized, or dummy tokens
  if (!user?.id || !token || !isValidFcmToken(token)) {
    console.warn('Rejected invalid device token registration attempt.');
    return null;
  }

  try {
    const deviceId = await getLocalDeviceId();
    let platform: 'android' | 'ios' | 'web' = 'web';
    let deviceModel = 'Web Browser';
    let osVersion = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    if (Capacitor.isNativePlatform()) {
      const capPlatform = Capacitor.getPlatform();
      platform = capPlatform === 'android' ? 'android' : capPlatform === 'ios' ? 'ios' : 'web';
      try {
        const info = await Device.getInfo();
        deviceModel = `${info.manufacturer || ''} ${info.model || ''}`.trim() || 'Mobile Device';
        osVersion = `${info.operatingSystem} ${info.osVersion}`;
      } catch (err) {
        console.warn('Could not read native device info:', err);
      }
    }

    const instId = await getFirebaseInstallationId();
    const deviceDocRef = doc(db, 'user_devices', `${user.id}_${deviceId}`);
    const record: DeviceRecord = {
      deviceId,
      userId: user.id,
      userName: user.name || user.username,
      userRole: user.role,
      department: user.department || 'عام',
      fcmToken: token,
      installationId: instId,
      platform,
      deviceModel,
      osVersion,
      appVersion: '1.0.0',
      notificationsEnabled,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
    };

    await setDoc(deviceDocRef, {
      ...record,
      serverUpdatedAt: serverTimestamp()
    }, { merge: true });

    // Store active token in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ers_fcm_token', token);
    }
    return record;
  } catch (error) {
    console.error('Failed to register device in Firestore:', error);
    return null;
  }
};

/**
 * De-register device on logout so this device stops receiving this user's alerts.
 * Leaves other devices of the user untouched.
 */
export const unregisterDeviceOnLogout = async (userId: string): Promise<void> => {
  try {
    const deviceId = await getLocalDeviceId();
    const deviceDocRef = doc(db, 'user_devices', `${userId}_${deviceId}`);
    
    const snap = await getDoc(deviceDocRef);
    if (snap.exists()) {
      await updateDoc(deviceDocRef, {
        isActive: false,
        fcmToken: '',
        unregisteredAt: Date.now(),
        serverUpdatedAt: serverTimestamp()
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ers_fcm_token');
    }
  } catch (error) {
    console.warn('Failed to unregister device on logout:', error);
  }
};

/**
 * Deactivates dead/unregistered tokens according to FCM error response.
 * Only call when FCM explicitly rejects token (e.g. registration-token-not-registered).
 * Do NOT call on temporary network or server failures.
 */
export const deactivateDeadToken = async (fcmToken: string, reason: string): Promise<void> => {
  if (!fcmToken) return;
  try {
    const q = query(collection(db, 'user_devices'), where('fcmToken', '==', fcmToken));
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, {
      isActive: false,
      fcmToken: '',
      deactivatedReason: reason,
      deactivatedAt: Date.now(),
      serverUpdatedAt: serverTimestamp()
    }));
    await Promise.all(updates);
  } catch (err) {
    console.warn('Could not deactivate dead token:', err);
  }
};

// Record alert acknowledgment on device record
export const recordAlertAcknowledgment = async (userId: string, installationId: string): Promise<void> => {
  try {
    const devRef = doc(db, 'devices', installationId);
    await updateDoc(devRef, { lastAlertAcknowledgedAt: Date.now() });
  } catch (e) {
    // silently fail
  }
};

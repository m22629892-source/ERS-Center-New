importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDi3fe3uYPUtsaihI9aVwl9OdZoW2CdhVs",
  authDomain: "firealarmsystem-6fdc2.firebaseapp.com",
  databaseURL: "https://firealarmsystem-6fdc2-default-rtdb.firebaseio.com",
  projectId: "firealarmsystem-6fdc2",
  storageBucket: "firealarmsystem-6fdc2.firebasestorage.app",
  messagingSenderId: "108775827318",
  appId: "1:108775827318:web:05d1d4a4b0469beebd3c57",
  measurementId: "G-YLWKXZRY9M"
});

const messaging = firebase.messaging();

// In-memory deduplication set with 60-second TTL
const recentlyHandledAlerts = new Map();

function isDuplicateAlert(id) {
  if (!id) return false;
  const now = Date.now();
  // Clean old entries
  for (const [key, timestamp] of recentlyHandledAlerts.entries()) {
    if (now - timestamp > 60000) {
      recentlyHandledAlerts.delete(key);
    }
  }
  if (recentlyHandledAlerts.has(id)) {
    return true;
  }
  recentlyHandledAlerts.set(id, now);
  return false;
}

const displayEmergencyNotification = (payload) => {
  const data = payload?.data || {};
  const notif = payload?.notification || {};

  // Unique alert identification to prevent duplicate notifications
  const alertId = data.alertId || data.emergencyId || notif.tag || payload.messageId || `alert_${Date.now()}`;
  if (isDuplicateAlert(alertId)) {
    return Promise.resolve();
  }

  // Sanitized non-sensitive lockscreen text (privacy compliant)
  const title = notif.title || data.title || '🚨 إنذار طوارئ ERS';
  const body = notif.body || data.body || (data.locationName ? `موقع الحادث: ${data.locationName}` : 'بلاغ جديد يتطلب استجابة فورية!');
  const emergencyId = data.emergencyId || '';
  const targetUrl = data.url || (emergencyId ? `/#/alarm/${emergencyId}` : '/');

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [800, 300, 800, 300, 800, 500, 1500],
    tag: `ers_alert_${emergencyId || 'critical'}`, // collapse identical alerts for same incident
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: targetUrl,
      emergencyId,
      alertId,
      testId: data.testId || null,
      receivedAt: Date.now()
    },
    actions: [
      { action: 'open', title: '🚨 فتح البلاغ الآن 🚨' }
    ]
  };

  // Broadcast ACK to open clients if any
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'ers:push_received_ack',
        alertId,
        testId: data.testId || null,
        emergencyId
      });
    });
  }).catch(() => {});

  return self.registration.showNotification(title, options);
};

// Handle background messages through Firebase Messaging Compat
messaging.onBackgroundMessage((payload) => {
  return displayEmergencyNotification(payload);
});

// Single unified notificationclick listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

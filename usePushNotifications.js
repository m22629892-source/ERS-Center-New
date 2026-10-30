
import { useState, useEffect } from 'react';
import { messaging } from './firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);

  const requestPermission = async () => {
    try {
      if (!messaging) return;
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const customVapid = typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_VAPID_KEY;
        const options = {};
        if ('serviceWorker' in navigator) {
          const swReg = await navigator.serviceWorker.ready.catch(() => null);
          if (swReg) options.serviceWorkerRegistration = swReg;
        }
        if (customVapid && customVapid.length > 50) {
          options.vapidKey = customVapid;
        }
        const token = await getToken(messaging, options);
        if (token) {
          setFcmToken(token);
          console.log('FCM Token:', token);
        }
      }
    } catch (error) {
      console.error('Push Permission Error:', error);
    }
  };

  useEffect(() => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        // يمكنك إظهار Toast مخصص هنا
      });
    }
  }, []);

  return { fcmToken, requestPermission };
};

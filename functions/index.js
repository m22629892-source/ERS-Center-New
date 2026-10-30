const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered on Firestore when a new emergency is reported.
 * Sends native FCM push notifications to registered responder & admin devices.
 */
exports.sendEmergencyNotification = functions.firestore
  .document('emergencies/{emergencyId}')
  .onCreate(async (snap, context) => {
    const emergencyId = context.params.emergencyId;
    const emergency = snap.data();

    if (!emergency) {
      console.warn(`Emergency ${emergencyId} data is empty.`);
      return null;
    }

    // STRICT DRILL ISOLATION: Never send operational notifications for drills
    if (emergency.isDrill || emergencyId.startsWith('drill_') || emergency.typeId === 'type_drill_simulation') {
      console.log(`[Drill Isolation] Skipping operational broadcast notification for drill emergency: ${emergencyId}`);
      const dispatchLogRef = db.collection('notification_dispatch_logs').doc(emergencyId);
      await dispatchLogRef.set({
        emergencyId,
        timestamp: Date.now(),
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0,
        status: 'drill_isolated_skip',
        isDrill: true
      });
      return null;
    }

    // Deduplication check: verify if alert dispatch already recorded
    const dispatchLogRef = db.collection('notification_dispatch_logs').doc(emergencyId);
    const existingLog = await dispatchLogRef.get();
    if (existingLog.exists) {
      console.log(`Alert already dispatched for emergency: ${emergencyId}`);
      return null;
    }

    try {
      // 1. Query active registered devices for responders and admins
      const allowedRoles = ['responder', 'admin', 'super-admin'];
      const devicesSnapshot = await db.collection('user_devices')
        .where('isActive', '==', true)
        .where('notificationsEnabled', '==', true)
        .get();

      if (devicesSnapshot.empty) {
        console.log('No active devices registered for notification.');
        await dispatchLogRef.set({
          emergencyId,
          timestamp: Date.now(),
          totalRecipients: 0,
          successCount: 0,
          failureCount: 0,
          status: 'no_active_devices'
        });
        return null;
      }

      // Filter by role and collect valid tokens
      const eligibleTokens = [];
      const tokenToDocMap = new Map();

      devicesSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (allowedRoles.includes(data.userRole) && data.fcmToken) {
          eligibleTokens.push(data.fcmToken);
          tokenToDocMap.set(data.fcmToken, docSnap.ref);
        }
      });

      if (eligibleTokens.length === 0) {
        console.log('No eligible tokens found for roles:', allowedRoles);
        return null;
      }

      // Deduplicate tokens
      const uniqueTokens = Array.from(new Set(eligibleTokens));

      // 2. Prepare FCM payload with notification + high priority data
      // Lockscreen title & body are concise and non-sensitive
      const payload = {
        tokens: uniqueTokens,
        notification: {
          title: `🚨 إنذار طوارئ: ${emergency.typeName || 'حالة طارئة'}`,
          body: `الموقع: ${emergency.locationName || 'غير محدد'}. اضغط للاستجابة الفورية.`
        },
        data: {
          emergencyId: String(emergencyId),
          alertId: `${emergencyId}_${emergency.createdAt || Date.now()}`,
          typeName: String(emergency.typeName || 'طوارئ'),
          locationName: String(emergency.locationName || ''),
          locationId: String(emergency.locationId || ''),
          severity: String(emergency.severity || 'High'),
          url: `/#/alarm/${emergencyId}`,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          ttl: 14400, // 4 hours in seconds
          notification: {
            channelId: 'ers_emergency_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            visibility: 'public',
            icon: 'ic_stat_emergency'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert'
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true
            }
          }
        }
      };

      // 3. Send Multicast via Firebase Admin SDK
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`FCM Multicast accepted: ${response.successCount} success, ${response.failureCount} failure.`);

      // 4. Handle expired/invalid tokens
      const cleanupPromises = [];
      response.responses.forEach((res, idx) => {
        if (!res.success && res.error) {
          const errCode = res.error.code;
          const badToken = uniqueTokens[idx];
          const docRef = tokenToDocMap.get(badToken);

          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            console.log(`Deactivating obsolete FCM token: ${badToken}`);
            if (docRef) {
              cleanupPromises.push(
                docRef.update({
                  isActive: false,
                  fcmToken: '',
                  deactivatedReason: errCode,
                  updatedAt: Date.now()
                })
              );
            }
          }
        }
      });

      if (cleanupPromises.length > 0) {
        await Promise.all(cleanupPromises);
      }

      // 5. Log dispatch results (accepted by FCM)
      await dispatchLogRef.set({
        emergencyId,
        alertId: `${emergencyId}_${emergency.createdAt || Date.now()}`,
        timestamp: Date.now(),
        totalRecipients: uniqueTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        acceptedByFCM: true,
        status: response.successCount > 0 ? 'sent' : 'failed'
      });

      return { success: true, count: response.successCount };
    } catch (error) {
      console.error('Fatal error during FCM dispatch:', error);
      await dispatchLogRef.set({
        emergencyId,
        timestamp: Date.now(),
        status: 'error',
        error: error.message
      });
      throw error;
    }
  });

/**
 * Callable function to test sending an FCM push notification directly to a specific device.
 * Used by Mobile Diagnostics screen to verify push functionality.
 */
exports.sendTestPushToDevice = functions.https.onCall(async (data, context) => {
  const { targetToken, userId, testId } = data;
  if (!targetToken || typeof targetToken !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetToken');
  }

  const trimmedToken = targetToken.trim();
  if (
    trimmedToken.length < 50 ||
    trimmedToken.startsWith('web_fcm_') ||
    trimmedToken.startsWith('web_device_') ||
    trimmedToken.startsWith('dummy_')
  ) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid or simulated FCM token rejected');
  }

  const currentTestId = testId || `fn_test_${Date.now()}`;
  const message = {
    token: trimmedToken,
    notification: {
      title: '🔔 اختبار نظام التنبيهات ERS',
      body: 'تم استلام إشعار الاختبار بنجاح على هذا الجهاز.'
    },
    data: {
      isTest: 'true',
      testId: currentTestId,
      timestamp: String(Date.now()),
      alertId: currentTestId
    },
    android: {
      priority: 'high',
      ttl: 3600,
      notification: {
        channelId: 'ers_emergency_channel',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true
      }
    }
  };

  try {
    const res = await admin.messaging().send(message);
    const masked = `${trimmedToken.slice(0, 8)}...${trimmedToken.slice(-6)}`;
    console.log(`[Function test push] Dispatched to ${masked}, ID: ${res}`);
    return { success: true, messageId: res, tokenMasked: masked, testId: currentTestId };
  } catch (err) {
    console.error('Test push error:', err);
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
      const snap = await db.collection('user_devices').where('fcmToken', '==', trimmedToken).get();
      const batch = db.batch();
      snap.forEach(d => batch.update(d.ref, { isActive: false, fcmToken: '', deactivatedReason: err.code }));
      await batch.commit();
    }
    throw new functions.https.HttpsError('internal', err.message);
  }
});

/**
 * Triggered when an isolated drill is created in /drills/{drillId}.
 * Dispatches ONLY to registered, verified participants of this specific drill.
 * Enforces mandatory title prefix [تدريب — ليس بلاغًا حقيقيًا].
 * Never alters operational staff readiness.
 */
exports.sendDrillNotification = functions.firestore
  .document('drills/{drillId}')
  .onCreate(async (snap, context) => {
    const drillId = context.params.drillId;
    const drill = snap.data();
    if (!drill) return null;

    const dispatchLogRef = db.collection('drill_dispatch_logs').doc(drillId);

    // Extract participant user IDs strictly from the document
    const rawParticipants = drill.participants || [];
    const participantUserIds = Array.isArray(rawParticipants)
      ? rawParticipants.map(p => typeof p === 'string' ? p : p.userId).filter(Boolean)
      : [];

    if (participantUserIds.length === 0) {
      console.log(`[Drill Notification] No participants enrolled for drill ${drillId}.`);
      await dispatchLogRef.set({
        drillId,
        timestamp: Date.now(),
        totalRecipients: 0,
        status: 'no_participants'
      });
      return null;
    }

    try {
      // Query devices strictly belonging to the enrolled participant user IDs
      const devicesSnap = await db.collection('user_devices')
        .where('userId', 'in', participantUserIds.slice(0, 30))
        .where('isActive', '==', true)
        .where('notificationsEnabled', '==', true)
        .get();

      const tokens = [];
      devicesSnap.forEach(d => {
        const data = d.data();
        if (data.fcmToken) tokens.push(data.fcmToken);
      });

      const uniqueTokens = Array.from(new Set(tokens));
      if (uniqueTokens.length === 0) {
        console.log(`[Drill Notification] No active FCM tokens for enrolled participants.`);
        await dispatchLogRef.set({
          drillId,
          timestamp: Date.now(),
          enrolledCount: participantUserIds.length,
          totalRecipients: 0,
          status: 'no_tokens_found'
        });
        return null;
      }

      const payload = {
        tokens: uniqueTokens,
        notification: {
          title: `[تدريب — ليس بلاغًا حقيقيًا] ${drill.title || 'تمرين محاكاة'}`,
          body: `تنبيه تمرين محاكاة مخصص لك فقط بموقع: ${drill.facilityName || 'قاعة التدريب'}.`
        },
        data: {
          drillId: String(drillId),
          isDrill: 'true',
          title: String(drill.title || 'تمرين محاكاة'),
          url: `/#/alarm/${drillId}`,
          timestamp: String(Date.now())
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'ers_drill_channel',
            priority: 'high',
            defaultSound: true,
            visibility: 'public'
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`[Drill Multicast] Sent to ${response.successCount} participant devices.`);

      await dispatchLogRef.set({
        drillId,
        timestamp: Date.now(),
        enrolledCount: participantUserIds.length,
        totalRecipients: uniqueTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        isDrillIsolated: true,
        status: 'dispatched'
      });

      return { success: true, count: response.successCount };
    } catch (err) {
      console.error(`[Drill Notification Error]:`, err);
      await dispatchLogRef.set({
        drillId,
        timestamp: Date.now(),
        status: 'error',
        error: err.message
      });
      return null;
    }
  });


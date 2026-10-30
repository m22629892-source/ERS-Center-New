import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Emergency, EmergencyAcknowledgment, ResponderCounts } from '../types';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle2, Navigation, MapPinCheck, UserX, Bell, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResponderCounterProps {
  emergency: Emergency;
  variant?: 'compact' | 'detailed' | 'bar';
  className?: string;
  onDeclineClick?: () => void;
  showActions?: boolean;
}

export const ResponderCounter: React.FC<ResponderCounterProps> = ({
  emergency,
  variant = 'compact',
  className = '',
  onDeclineClick,
  showActions = false,
}) => {
  const { t } = useTranslation();
  const [acknowledgments, setAcknowledgments] = useState<EmergencyAcknowledgment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!emergency?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'emergencies', emergency.id, 'acknowledgments'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: EmergencyAcknowledgment[] = [];
          snap.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as EmergencyAcknowledgment) });
          });
          setAcknowledgments(list);
          setIsLoading(false);
        },
        (err) => {
          console.warn('ResponderCounter Firestore listener error:', err);
          setIsLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      setIsLoading(false);
      return () => {};
    }
  }, [emergency?.id]);

  // Derive mutually exclusive counts, deduplicating strictly by userId
  const counts: ResponderCounts = React.useMemo(() => {
    const userStateMap = new Map<string, string>();

    // 1. Ingest acknowledgments subcollection (most granular state)
    acknowledgments.forEach((ack) => {
      const uid = ack.userId || ack.userName || ack.id || '';
      if (!uid) return;
      const stage = (ack.stage || '').toUpperCase();
      userStateMap.set(uid, stage);
    });

    // 2. Ingest legacy emergency.verifiedResponders (arrived)
    (emergency.verifiedResponders || []).forEach((name) => {
      if (!name) return;
      if (!userStateMap.has(name) || userStateMap.get(name) !== 'ON_SCENE') {
        userStateMap.set(name, 'ON_SCENE');
      }
    });

    // 3. Ingest legacy emergency.responders (responding) if not already arrived
    (emergency.responders || []).forEach((name) => {
      if (!name) return;
      if (!userStateMap.has(name)) {
        userStateMap.set(name, 'RESPONDING');
      }
    });

    let arrived = 0;
    let responding = 0;
    let acknowledged = 0;
    let declined = 0;

    userStateMap.forEach((stage) => {
      if (stage === 'ON_SCENE' || stage === 'ARRIVED') {
        arrived++;
      } else if (stage === 'RESPONDING') {
        responding++;
      } else if (stage === 'ACKNOWLEDGED' || stage === 'RECEIVED') {
        acknowledged++;
      } else if (stage === 'DECLINED' || stage === 'UNAVAILABLE') {
        declined++;
      }
    });

    // Total assigned is the union of all responders interacting + active assigned pool
    const totalAssigned = Math.max(
      userStateMap.size,
      (emergency.responders?.length || 0) + (emergency.verifiedResponders?.length || 0),
      1
    );

    // Responders notified: all assigned or active responders for this incident
    const notified = Math.max(totalAssigned, userStateMap.size);

    return {
      totalAssigned,
      notified,
      acknowledged,
      responding,
      arrived,
      declined,
    };
  }, [acknowledgments, emergency]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-400 py-1 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-ping"></span>
        <span>{t('loading_responder_stats')}</span>
      </div>
    );
  }

  // COMPACT VARIANT: for dashboard cards & list items
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 text-[11px] font-bold ${className}`}>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          title={t('responders_assigned_tooltip')}
        >
          <Users size={12} className="text-blue-600" />
          <span className="font-extrabold">{counts.totalAssigned}</span>
          <span className="text-[10px] text-blue-600/80 hidden sm:inline">{t('assigned')}</span>
        </span>

        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
          title={t('responders_acknowledged_tooltip')}
        >
          <CheckCircle2 size={12} className="text-indigo-600" />
          <span className="font-extrabold">{counts.acknowledged}</span>
          <span className="text-[10px] text-indigo-600/80 hidden sm:inline">{t('acknowledged_short')}</span>
        </span>

        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          title={t('responders_responding_tooltip')}
        >
          <Navigation size={12} className="text-amber-600" />
          <span className="font-extrabold">{counts.responding}</span>
          <span className="text-[10px] text-amber-600/80 hidden sm:inline">{t('en_route')}</span>
        </span>

        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          title={t('responders_arrived_tooltip')}
        >
          <MapPinCheck size={12} className="text-emerald-600" />
          <span className="font-extrabold">{counts.arrived}</span>
          <span className="text-[10px] text-emerald-600/80 hidden sm:inline">{t('arrived')}</span>
        </span>

        {counts.declined > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            title={t('responders_declined_tooltip')}
          >
            <UserX size={12} className="text-rose-600" />
            <span className="font-extrabold">{counts.declined}</span>
            <span className="text-[10px] text-rose-600/80 hidden sm:inline">{t('declined')}</span>
          </span>
        )}

        {isOffline && (
          <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200">
            {t('offline_cached')}
          </span>
        )}
      </div>
    );
  }

  // DETAILED VARIANT: for Alarm screen & Incident details
  return (
    <div
      className={`bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black dark:text-white uppercase tracking-wider">
              {t('realtime_responder_counter')}
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('responder_counter_subtitle')}
            </p>
          </div>
        </div>

        {isOffline && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300">
            {t('offline_mode')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Total Assigned */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/50 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
            <Users size={16} />
            <span className="text-[10px] font-bold">{t('assigned')}</span>
          </div>
          <span className="text-xl font-black text-blue-900 dark:text-blue-100">
            {counts.totalAssigned}
          </span>
        </div>

        {/* Acknowledged */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/50 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-bold">{t('acknowledged_short')}</span>
          </div>
          <span className="text-xl font-black text-indigo-900 dark:text-indigo-100">
            {counts.acknowledged}
          </span>
        </div>

        {/* Responding / En Route */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/50 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
            <Navigation size={16} className="animate-pulse" />
            <span className="text-[10px] font-bold">{t('en_route')}</span>
          </div>
          <span className="text-xl font-black text-amber-900 dark:text-amber-100">
            {counts.responding}
          </span>
        </div>

        {/* Arrived On Scene */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
            <MapPinCheck size={16} />
            <span className="text-[10px] font-bold">{t('arrived')}</span>
          </div>
          <span className="text-xl font-black text-emerald-900 dark:text-emerald-100">
            {counts.arrived}
          </span>
        </div>

        {/* Declined */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/50 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
            <UserX size={16} />
            <span className="text-[10px] font-bold">{t('declined')}</span>
          </div>
          <span className="text-xl font-black text-rose-900 dark:text-rose-100">
            {counts.declined}
          </span>
        </div>
      </div>
    </div>
  );
};

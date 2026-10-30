import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, HealthCheckItem, HealthStatus } from '../types';
import { healthCheckService } from '../services/healthCheckService';
import { mobileNotificationService } from '../services/mobileNotificationService';
import { 
  ShieldCheck, AlertTriangle, XCircle, HelpCircle, 
  RefreshCw, Bell, Smartphone, Database, Server, 
  Send, ExternalLink, CheckCircle2, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface SystemReadinessDashboardProps {
  currentUser?: User | null;
  className?: string;
}

export const SystemReadinessDashboard: React.FC<SystemReadinessDashboardProps> = ({
  currentUser,
  className = '',
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<HealthCheckItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const runChecks = async () => {
    setIsRunning(true);
    setTestNotificationStatus(null);
    try {
      const results = await healthCheckService.runFullDiagnostics(currentUser);
      setItems(results);
      setLastRunTime(Date.now());
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, [currentUser]);

  const handleSendTestPush = async () => {
    const token = mobileNotificationService.getRegistrationToken();
    if (!token) {
      setTestNotificationStatus(t('health_fcm_token_missing'));
      return;
    }

    setIsSendingTest(true);
    setTestNotificationStatus(null);
    try {
      const res = await healthCheckService.executeTestNotification(token);
      setTestNotificationStatus(res.message);
    } catch (e: any) {
      setTestNotificationStatus(e.message || t('test_push_failed'));
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'operational':
        return {
          label: t('status_operational'),
          classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
        };
      case 'warning':
        return {
          label: t('status_warning'),
          classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'failed':
        return {
          label: t('status_failed'),
          classes: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300',
          dot: 'bg-rose-600',
          icon: XCircle,
        };
      case 'unsupported':
        return {
          label: t('status_unsupported'),
          classes: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300',
          dot: 'bg-gray-400',
          icon: HelpCircle,
        };
      default:
        return {
          label: t('status_not_tested'),
          classes: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300',
          dot: 'bg-blue-400',
          icon: Info,
        };
    }
  };

  const categories: Array<{ id: 'firebase' | 'fcm' | 'pwa' | 'operational'; label: string; icon: any }> = [
    { id: 'firebase', label: t('health_cat_firebase'), icon: Database },
    { id: 'fcm', label: t('health_cat_fcm'), icon: Bell },
    { id: 'pwa', label: t('health_cat_pwa'), icon: Smartphone },
    { id: 'operational', label: t('health_cat_operational'), icon: Server },
  ];

  // Calculate overall readiness score
  const operationalCount = items.filter((i) => i.status === 'operational').length;
  const totalCount = items.length || 1;
  const readinessPercent = Math.round((operationalCount / totalCount) * 100);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black dark:text-white">
                {t('system_readiness_and_health')}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                readinessPercent >= 80
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : readinessPercent >= 50
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {readinessPercent}% {t('ready')}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lastRunTime ? `${t('last_health_check')}: ${new Date(lastRunTime).toLocaleTimeString()}` : t('diagnostics_not_run')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Send Test Notification Button */}
          <Button
            variant="outline"
            disabled={isSendingTest}
            onClick={handleSendTestPush}
            className="flex items-center gap-1.5 text-xs font-black rounded-xl py-2"
          >
            {isSendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>{t('test_notification')}</span>
          </Button>

          {/* Re-run button */}
          <Button
            disabled={isRunning}
            onClick={runChecks}
            className="flex items-center gap-1.5 text-xs font-black rounded-xl py-2"
          >
            <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
            <span>{t('run_diagnostics_now')}</span>
          </Button>
        </div>
      </div>

      {/* Test Notification Banner Feedback */}
      <AnimatePresence>
        {testNotificationStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
              <span>{testNotificationStatus}</span>
            </div>
            <button
              onClick={() => setTestNotificationStatus(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Groups */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat.id);
          const CatIcon = cat.icon;

          return (
            <div
              key={cat.id}
              className="bg-gray-50/70 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/60"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <CatIcon size={16} className="text-primary" />
                <h3 className="text-xs font-black dark:text-white uppercase tracking-wider">
                  {cat.label}
                </h3>
              </div>

              <div className="space-y-2.5">
                {catItems.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const StatusIcon = badge.icon;

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded-lg mt-0.5">
                          <StatusIcon size={16} className={
                            item.status === 'operational' ? 'text-emerald-500' :
                            item.status === 'warning' ? 'text-amber-500' :
                            item.status === 'failed' ? 'text-rose-500' : 'text-gray-400'
                          } />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black dark:text-white">
                              {t(item.titleKey)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border ${badge.classes}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                              <span>{badge.label}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                            {String(t(item.messageKey, (item.messageParams || {}) as any))}
                          </p>
                          {item.details && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {item.details}
                            </p>
                          )}
                          {item.instructionsKey && (
                            <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-bold text-amber-800 dark:text-amber-200">
                              ⚠️ {t(item.instructionsKey)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

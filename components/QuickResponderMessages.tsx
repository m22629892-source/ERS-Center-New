import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, QuickMessageTemplate } from '../types';
import { quickMessageService } from '../services/quickMessageService';
import { 
  Navigation, MapPinCheck, AlertTriangle, ShieldCheck, 
  HeartPulse, CheckCircle2, UserX, Radio, Send, Loader2, Check, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickResponderMessagesProps {
  emergencyId: string;
  currentUser: User;
  isEmergencyActive?: boolean;
  className?: string;
  onMessageSent?: () => void;
}

export const QuickResponderMessages: React.FC<QuickResponderMessagesProps> = ({
  emergencyId,
  currentUser,
  isEmergencyActive = true,
  className = '',
  onMessageSent,
}) => {
  const { t } = useTranslation();
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [recentSentKey, setRecentSentKey] = useState<string | null>(null);

  const templates = quickMessageService.getTemplates();

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Navigation':
        return <Navigation size={16} className="text-blue-500" />;
      case 'MapPinCheck':
        return <MapPinCheck size={16} className="text-emerald-500" />;
      case 'AlertTriangle':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck size={16} className="text-emerald-600" />;
      case 'HeartPulse':
        return <HeartPulse size={16} className="text-red-500" />;
      case 'CheckCircle2':
        return <CheckCircle2 size={16} className="text-teal-500" />;
      case 'UserX':
        return <UserX size={16} className="text-rose-500" />;
      case 'Radio':
        return <Radio size={16} className="text-indigo-500" />;
      default:
        return <MessageSquare size={16} className="text-primary" />;
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'status':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60';
      case 'assistance':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60';
      case 'safety':
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60';
      case 'tactical':
        return 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50/50 hover:bg-gray-100';
    }
  };

  const handleSend = async (tpl: QuickMessageTemplate) => {
    if (!isEmergencyActive || sendingKey) return;

    setSendingKey(tpl.key);
    const localizedText = t(tpl.key, tpl.defaultText);

    const res = await quickMessageService.sendQuickMessage(
      emergencyId,
      currentUser,
      tpl,
      localizedText
    );

    setSendingKey(null);
    if (res.success) {
      setRecentSentKey(tpl.key);
      if (onMessageSent) onMessageSent();
      setTimeout(() => setRecentSentKey(null), 3000);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black dark:text-white uppercase tracking-wider">
              {t('quick_responder_messages')}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('quick_responder_messages_desc')}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-gray-400">
          {t('one_click_broadcast')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {templates.map((tpl) => {
          const isCurrentSending = sendingKey === tpl.key;
          const wasRecentlySent = recentSentKey === tpl.key;
          const label = t(tpl.key, tpl.defaultText);

          return (
            <motion.button
              key={tpl.id}
              whileTap={{ scale: 0.96 }}
              disabled={!isEmergencyActive || !!sendingKey}
              onClick={() => handleSend(tpl)}
              className={`p-3 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all flex items-center justify-between gap-2.5 shadow-xs disabled:opacity-50 ${getCategoryStyles(
                tpl.category
              )}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-white dark:bg-gray-800 shadow-xs shrink-0">
                  {getIcon(tpl.icon)}
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                  {label}
                </span>
              </div>

              <div className="shrink-0 ms-1">
                {isCurrentSending ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : wasRecentlySent ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs"
                  >
                    <Check size={12} />
                  </motion.span>
                ) : (
                  <Send size={14} className="text-gray-400 opacity-60 hover:opacity-100" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

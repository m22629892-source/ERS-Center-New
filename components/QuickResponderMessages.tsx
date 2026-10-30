import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, QuickMessageTemplate } from '../types';
import { quickMessageService, MUTUALLY_EXCLUSIVE_STATUS_KEYS } from '../services/quickMessageService';
import { 
  Navigation, MapPinCheck, AlertTriangle, ShieldCheck, 
  HeartPulse, CheckCircle2, UserX, Radio, Send, Loader2, Check, MessageSquare,
  AlertCircle, RotateCcw
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const templates = quickMessageService.getTemplates();

  // Clear selections when changing emergency or user account
  useEffect(() => {
    setSelectedKeys(new Set());
    setFeedback(null);
  }, [emergencyId, currentUser?.id]);

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

  const getCategoryStyles = (category: string, isSelected: boolean) => {
    if (isSelected) {
      return 'border-primary ring-2 ring-primary/30 bg-primary/10 dark:bg-primary/20 text-primary dark:text-white font-black shadow-md';
    }
    switch (category) {
      case 'status':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/60 text-gray-800 dark:text-gray-100';
      case 'assistance':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/60 text-gray-800 dark:text-gray-100';
      case 'safety':
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 text-gray-800 dark:text-gray-100';
      case 'tactical':
        return 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-100/60 text-gray-800 dark:text-gray-100';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50/50 hover:bg-gray-100 text-gray-800 dark:text-gray-100';
    }
  };

  // Toggle selection on click or keyboard
  const handleToggleSelect = (tpl: QuickMessageTemplate) => {
    if (!isEmergencyActive || isSending) return;

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(tpl.key)) {
        next.delete(tpl.key);
      } else {
        // If selecting a mutually exclusive status, check if another exclusive status is already selected
        if (MUTUALLY_EXCLUSIVE_STATUS_KEYS.includes(tpl.key)) {
          const existingExclusive = Array.from(next).find(k => MUTUALLY_EXCLUSIVE_STATUS_KEYS.includes(k));
          if (existingExclusive) {
            setFeedback({
              type: 'warning',
              message: 'تنبيه: لا يمكن الجمع بين حالات متناقضة في دفعة واحدة (تم استبدال الحالة السابقة بالحالة الجديدة).'
            });
            next.delete(existingExclusive);
          } else {
            setFeedback(null);
          }
        }
        next.add(tpl.key);
      }
      return next;
    });
  };

  // Check if current selection contains contradictory items
  const contradictionCheck = quickMessageService.checkContradictions(Array.from(selectedKeys));

  const handleSendSelectedBatch = async () => {
    if (selectedKeys.size === 0 || !isEmergencyActive || isSending) return;

    if (contradictionCheck.hasConflict) {
      setFeedback({
        type: 'error',
        message: contradictionCheck.reason || 'يوجد تضارب بين الحالات المحددة'
      });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    const selectedTemplates = templates.filter(tpl => selectedKeys.has(tpl.key));
    const localizedTexts: Record<string, string> = {};
    selectedTemplates.forEach(tpl => {
      localizedTexts[tpl.key] = t(tpl.key, tpl.defaultText);
    });

    // Client operation ID for idempotency deduplication
    const batchOperationId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const result = await quickMessageService.sendQuickMessagesBatch(
      emergencyId,
      currentUser,
      selectedTemplates,
      localizedTexts,
      batchOperationId
    );

    setIsSending(false);

    if (result.success) {
      setSelectedKeys(new Set());
      setFeedback({
        type: 'success',
        message: `تم إرسال ${result.successfulKeys.length} رسائل بنجاح وتسجيلها في محادثة وسجل الحادث.`
      });
      if (onMessageSent) onMessageSent();
      setTimeout(() => setFeedback(null), 5000);
    } else {
      // Partial failure handling:
      // Remove only successfully sent keys, keep failed ones selected so the user can retry!
      setSelectedKeys((prev) => {
        const remaining = new Set(prev);
        result.successfulKeys.forEach(k => remaining.delete(k));
        return remaining;
      });

      const failedCount = result.failedKeys.length;
      const successCount = result.successfulKeys.length;
      setFeedback({
        type: 'error',
        message: successCount > 0
          ? `تم إرسال ${successCount} رسالة، بينما تعذر إرسال ${failedCount} رسالة (ظلت محددة لإعادة المحاولة).`
          : (result.conflictError || 'فشل إرسال الرسائل المحددة، يرجى إعادة المحاولة.')
      });
    }
  };

  const handleClearSelections = () => {
    if (isSending) return;
    setSelectedKeys(new Set());
    setFeedback(null);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black dark:text-white uppercase tracking-wider">
              {t('quick_responder_messages')}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              حدد رسالة أو أكثر ثم اضغط «إرسال المحدد» للبث الفوري دون مغادرة غرفة العمليات
            </p>
          </div>
        </div>

        {selectedKeys.size > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleClearSelections}
              disabled={isSending}
              className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>إلغاء التحديد ({selectedKeys.size})</span>
            </button>
          </div>
        )}
      </div>

      {/* Contradiction Warning Alert */}
      {contradictionCheck.hasConflict && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{contradictionCheck.reason}</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
          feedback.type === 'success'
            ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
            : feedback.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 text-green-600" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Templates Grid with Toggle Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {templates.map((tpl) => {
          const isSelected = selectedKeys.has(tpl.key);
          const label = t(tpl.key, tpl.defaultText);

          return (
            <motion.button
              key={tpl.id}
              type="button"
              role="button"
              aria-pressed={isSelected}
              whileTap={{ scale: 0.97 }}
              disabled={!isEmergencyActive || isSending}
              onClick={() => handleToggleSelect(tpl)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleToggleSelect(tpl);
                }
              }}
              className={`p-3 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all flex items-center justify-between gap-2.5 shadow-xs disabled:opacity-40 cursor-pointer ${getCategoryStyles(
                tpl.category,
                isSelected
              )}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-xl shadow-xs shrink-0 transition-colors ${
                  isSelected ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800'
                }`}>
                  {getIcon(tpl.icon)}
                </div>
                <span className="text-xs font-bold truncate">
                  {label}
                </span>
              </div>

              {/* Selection Checkmark Indicator */}
              <div className="shrink-0 ms-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border ${
                  isSelected 
                    ? 'bg-primary text-white border-primary shadow-xs' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50'
                }`}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Action Footer: Send Selected Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-500 font-bold">
          {selectedKeys.size > 0 
            ? `تم تحديد ${selectedKeys.size} من أصل ${templates.length} رسائل` 
            : 'اختر الرسائل المطلوبة أعلاه ثم اضغط إرسال'}
        </span>

        <button
          type="button"
          disabled={selectedKeys.size === 0 || !isEmergencyActive || isSending || contradictionCheck.hasConflict}
          onClick={handleSendSelectedBatch}
          className={`px-6 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
            selectedKeys.size > 0 && !contradictionCheck.hasConflict && isEmergencyActive && !isSending
              ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
          }`}
        >
          {isSending ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Send size={15} />
          )}
          <span>
            {isSending 
              ? 'جاري إرسال الرسائل...' 
              : `إرسال المحدد (${selectedKeys.size})`}
          </span>
        </button>
      </div>
    </div>
  );
};

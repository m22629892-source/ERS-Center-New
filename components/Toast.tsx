import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, X, MapPin, BellOff, VolumeX, Volume2, 
  ChevronRight, ChevronLeft, Minimize2, Maximize2, ShieldAlert,
  ArrowRight, CheckCircle2, Siren
} from 'lucide-react';
import { Emergency } from '../types';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

interface ToastProps {
  emergency?: Emergency | null;
  activeEmergencies?: Emergency[];
  onClose?: () => void;
  onClick?: (emergency?: Emergency) => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  emergency, 
  activeEmergencies, 
  onClose, 
  onClick 
}) => {
  const { user, dismissEmergency, respondToEmergency, stopAllAlerts } = useApp();
  const { t } = useTranslation();

  // Combine emergencies list
  const list = activeEmergencies && activeEmergencies.length > 0 
    ? activeEmergencies 
    : (emergency ? [emergency] : []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Keep index in bounds when emergencies list changes
  useEffect(() => {
    if (currentIndex >= list.length) {
      setCurrentIndex(Math.max(0, list.length - 1));
    }
  }, [list.length, currentIndex]);

  if (list.length === 0) return null;

  const current = list[currentIndex] || list[0];
  if (!current) return null;

  const isResponding = user?.name ? current.responders?.includes(user.name) : false;
  const isDrill = !!current.isDrill;
  const totalCount = list.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
  };

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAllAlerts();
    setIsMuted(true);
  };

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.name) {
      await respondToEmergency(current.id, user.name);
    }
    stopAllAlerts();
    if (onClick) onClick(current);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissEmergency(current.id);
    if (onClose) onClose();
  };

  const handleCardClick = () => {
    if (onClick) onClick(current);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="active-emergency-toast-bar"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        className="fixed top-14 sm:top-16 inset-x-0 z-[100] px-3 pointer-events-none print:hidden flex justify-center"
      >
        <div className="w-full max-w-2xl pointer-events-auto">
          {/* Minimized Compact Bar */}
          {isMinimized ? (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`flex items-center justify-between px-4 py-2 rounded-xl shadow-xl border backdrop-blur-md cursor-pointer transition-all ${
                isDrill 
                  ? 'bg-amber-600/95 text-white border-amber-400' 
                  : 'bg-red-700/95 text-white border-red-500 hover:bg-red-800'
              }`}
              onClick={() => setIsMinimized(false)}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Siren size={18} className="animate-pulse" />
                <span>
                  {isDrill ? '⚠️ محاكاة تدريب نشطة' : '🚨 بلاغ طوارئ نشط'}
                </span>
                <span className="bg-black/30 px-2 py-0.5 rounded text-[11px]">
                  {current.typeName} — {current.locationName}
                </span>
                {totalCount > 1 && (
                  <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
                    {currentIndex + 1}/{totalCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleMute}
                  title="كتم الصوت"
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white/90"
                >
                  <VolumeX size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(false)}
                  title="توسيع"
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white/90"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </motion.div>
          ) : (
            /* Full Expandable Banner */
            <div 
              className={`rounded-2xl shadow-2xl border-2 overflow-hidden transition-colors ${
                isDrill 
                  ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-amber-300 text-white' 
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-red-400 text-white'
              }`}
            >
              {/* Header Bar */}
              <div className="px-4 py-2 bg-black/25 flex items-center justify-between text-xs border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded-full animate-pulse">
                    <ShieldAlert size={14} />
                  </div>
                  <span className="font-bold tracking-wide">
                    {isDrill ? 'وضع تمرين وتدريب معزول — ليس بلاغاً حقيقياً' : 'إنذار طوارئ عملياتي نشط'}
                  </span>
                  {totalCount > 1 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold">
                      {currentIndex + 1} من {totalCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {totalCount > 1 && (
                    <div className="flex items-center gap-1 ml-2 rtl:mr-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        title="البلاغ السابق"
                        className="p-1 hover:bg-white/20 rounded text-white/90"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        title="البلاغ التالي"
                        className="p-1 hover:bg-white/20 rounded text-white/90"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleMute}
                    title={isMuted ? 'تم كتم الصوت' : 'كتم صوت الإنذار'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isMuted ? 'bg-white/30 text-amber-200' : 'hover:bg-white/20 text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    title="تصغير الشريط"
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white"
                  >
                    <Minimize2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    title="إغلاق التنبيه"
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Main Body */}
              <div 
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={handleCardClick}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl flex-shrink-0 animate-bounce">
                    <AlertTriangle size={26} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-base sm:text-lg">
                        {current.typeName || 'حالة طوارئ'}
                      </h4>
                      {current.escalated && (
                        <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                          مُصعّد تلقائياً (مستوى {current.escalationLevel || 1})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/90 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold">
                        <MapPin size={13} /> {current.locationName || 'الموقع العام'}
                      </span>
                      {current.notes && (
                        <span className="text-white/80 truncate max-w-xs text-[11px]">
                          — {current.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div 
                  className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isResponding ? (
                    <button
                      type="button"
                      onClick={handleAcknowledge}
                      className="bg-white text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <CheckCircle2 size={15} />
                      <span>تأكيد الاستجابة</span>
                    </button>
                  ) : (
                    <span className="bg-emerald-500/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>مُستجيب بالفعل</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleCardClick}
                    className="bg-black/30 hover:bg-black/50 border border-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <span>فتح البلاغ</span>
                    <ArrowRight size={13} className="rtl:rotate-180" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    title="لست معنياً بهذا البلاغ"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 hover:text-white px-2 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <BellOff size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
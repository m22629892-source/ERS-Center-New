import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Emergency, Location, CongestionLevel, CongestionThresholds, AreaCongestionStat } from '../types';
import { congestionService, DEFAULT_CONGESTION_THRESHOLDS } from '../services/congestionService';
import { 
  Building2, Layers, AlertCircle, AlertTriangle, ShieldCheck, 
  Settings2, Filter, ChevronRight, X, Flame, ShieldAlert, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';

interface CongestionIndicatorProps {
  activeEmergencies: Emergency[];
  locations: Location[];
  isAdmin?: boolean;
  onSelectArea?: (area: AreaCongestionStat) => void;
  className?: string;
}

export const CongestionIndicator: React.FC<CongestionIndicatorProps> = ({
  activeEmergencies,
  locations,
  isAdmin = false,
  onSelectArea,
  className = '',
}) => {
  const { t } = useTranslation();
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [thresholds, setThresholds] = useState<CongestionThresholds>(congestionService.getThresholds());
  const [editThresholds, setEditThresholds] = useState<CongestionThresholds>(congestionService.getThresholds());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStat, setSelectedStat] = useState<AreaCongestionStat | null>(null);

  useEffect(() => {
    setThresholds(congestionService.getThresholds());
    setEditThresholds(congestionService.getThresholds());
  }, []);

  const { areaStats, overallLevel, totalActiveIncidents } = congestionService.computeCongestion(
    activeEmergencies,
    locations,
    thresholds
  );

  // Available floors for filtering
  const allFloors = Array.from(new Set(areaStats.map((s) => s.floor))).sort();

  const filteredStats = areaStats.filter((stat) => {
    if (selectedFloor !== 'all' && stat.floor !== selectedFloor) return false;
    if (selectedLevel !== 'all' && stat.level !== selectedLevel) return false;
    return true;
  });

  const levelConfigs: Record<CongestionLevel, { label: string; badge: string; bg: string; dot: string; icon: any }> = {
    normal: {
      label: t('congestion_normal'),
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300',
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
    },
    elevated: {
      label: t('congestion_elevated'),
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300',
      bg: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40',
      dot: 'bg-blue-500',
      icon: AlertCircle,
    },
    high: {
      label: t('congestion_high'),
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300',
      bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40',
      dot: 'bg-amber-500 animate-pulse',
      icon: AlertTriangle,
    },
    critical: {
      label: t('congestion_critical'),
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 animate-pulse',
      bg: 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 shadow-sm',
      dot: 'bg-rose-600 animate-ping',
      icon: ShieldAlert,
    },
  };

  const currentConfig = levelConfigs[overallLevel];
  const IconComponent = currentConfig.icon;

  const handleSaveConfig = async () => {
    setIsSaving(true);
    const success = await congestionService.updateThresholds(editThresholds);
    if (success) {
      setThresholds(editThresholds);
      setIsConfigModalOpen(false);
    }
    setIsSaving(false);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      {/* Header with Overall Status & Config */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black dark:text-white">
                {t('incident_congestion_indicator')}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${currentConfig.badge}`}>
                <span className={`w-2 h-2 rounded-full ${currentConfig.dot}`}></span>
                <span>{currentConfig.label}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('congestion_indicator_desc', { count: totalActiveIncidents })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('configure_congestion_thresholds')}
            >
              <Settings2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-500">{t('filter_by')}:</span>

          {/* Floor filter */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="text-xs font-bold bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 outline-none"
          >
            <option value="all">{t('all_floors')}</option>
            {allFloors.map((fl) => (
              <option key={fl} value={fl}>
                {t('floor')} {fl}
              </option>
            ))}
          </select>

          {/* Level filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="text-xs font-bold bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 outline-none"
          >
            <option value="all">{t('all_congestion_levels')}</option>
            <option value="normal">{t('congestion_normal')}</option>
            <option value="elevated">{t('congestion_elevated')}</option>
            <option value="high">{t('congestion_high')}</option>
            <option value="critical">{t('congestion_critical')}</option>
          </select>
        </div>

        <span className="text-[11px] font-bold text-gray-400">
          {t('areas_count', { count: filteredStats.length })}
        </span>
      </div>

      {/* Floor & Wing Matrix */}
      {filteredStats.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            {t('no_congestion_all_normal')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t('all_areas_operational_safe')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStats.map((stat) => {
            const cfg = levelConfigs[stat.level];
            const AreaIcon = cfg.icon;

            return (
              <motion.div
                key={stat.key}
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  setSelectedStat(stat);
                  if (onSelectArea) onSelectArea(stat);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${cfg.bg}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-xs">
                      <AreaIcon size={16} className={stat.level === 'critical' ? 'text-rose-600' : 'text-gray-700 dark:text-gray-300'} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black dark:text-white">
                        {t('floor')} {stat.floor} — {stat.wing}
                      </h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                        {stat.totalActive} {t('active_incidents_count')}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Severity Breakdown Badges */}
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" title={t('high_severity')}>
                    🔴 {stat.highCount} {t('high')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" title={t('medium_severity')}>
                    🟡 {stat.mediumCount} {t('medium')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" title={t('low_severity')}>
                    🔵 {stat.lowCount} {t('low')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Thresholds Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={t('configure_congestion_thresholds')}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('congestion_thresholds_explanation')}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('threshold_normal_max')}
              </label>
              <input
                type="number"
                min="0"
                value={editThresholds.normalMax}
                onChange={(e) => setEditThresholds({ ...editThresholds, normalMax: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('threshold_elevated_max')}
              </label>
              <input
                type="number"
                min="1"
                value={editThresholds.elevatedMax}
                onChange={(e) => setEditThresholds({ ...editThresholds, elevatedMax: parseInt(e.target.value) || 2 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('threshold_high_max')}
              </label>
              <input
                type="number"
                min="2"
                value={editThresholds.highMax}
                onChange={(e) => setEditThresholds({ ...editThresholds, highMax: parseInt(e.target.value) || 4 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('threshold_critical_min')}
              </label>
              <input
                type="number"
                min="3"
                value={editThresholds.criticalMin}
                onChange={(e) => setEditThresholds({ ...editThresholds, criticalMin: parseInt(e.target.value) || 5 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="highSevTrig"
                checked={editThresholds.highSeverityTriggersCritical}
                onChange={(e) => setEditThresholds({ ...editThresholds, highSeverityTriggersCritical: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="highSevTrig" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                {t('high_severity_triggers_critical')}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

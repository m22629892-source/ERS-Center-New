import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Emergency, ResponsePerformanceTargets } from '../types';
import { 
  performanceAnalyticsService, 
  ResponseAnalyticsSummary, 
  DEFAULT_RESPONSE_TARGETS 
} from '../services/performanceAnalyticsService';
import { 
  Clock, Zap, Target, CheckCircle2, TrendingUp, Filter, 
  Download, Settings2, BarChart2, ShieldAlert, Calendar, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Modal } from './Modal';
import { Button } from './Button';

interface ResponsePerformanceDashboardProps {
  emergencies: Emergency[];
  isAdmin?: boolean;
  className?: string;
}

export const ResponsePerformanceDashboard: React.FC<ResponsePerformanceDashboardProps> = ({
  emergencies,
  isAdmin = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [excludeDrills, setExcludeDrills] = useState<boolean>(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [targets, setTargets] = useState<ResponsePerformanceTargets>(performanceAnalyticsService.getTargets());
  const [editTargets, setEditTargets] = useState<ResponsePerformanceTargets>(performanceAnalyticsService.getTargets());
  const [isSaving, setIsSaving] = useState(false);

  // Compute date filter range
  const filterRange = React.useMemo(() => {
    const now = Date.now();
    if (dateFilter === 'today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      return { startMs: startOfDay, endMs: now };
    }
    if (dateFilter === '7d') {
      return { startMs: now - 7 * 86400000, endMs: now };
    }
    if (dateFilter === '30d') {
      return { startMs: now - 30 * 86400000, endMs: now };
    }
    return undefined;
  }, [dateFilter]);

  const summary: ResponseAnalyticsSummary = React.useMemo(() => {
    return performanceAnalyticsService.computeAnalytics(emergencies, filterRange, targets, excludeDrills);
  }, [emergencies, filterRange, targets, excludeDrills]);

  const periodComparison = React.useMemo(() => {
    const days = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 30;
    return performanceAnalyticsService.computePeriodComparison(emergencies, days, excludeDrills);
  }, [emergencies, dateFilter, excludeDrills]);

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0s';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  };

  const handleSaveTargets = async () => {
    setIsSaving(true);
    const ok = await performanceAnalyticsService.updateTargets(editTargets);
    if (ok) {
      setTargets(editTargets);
      setIsConfigOpen(false);
    }
    setIsSaving(false);
  };

  const handleDownloadCsv = () => {
    const csvContent = performanceAnalyticsService.generateCsvExport(summary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ers_response_performance_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data: Average Arrival Time by Floor
  const floorLabels = Object.keys(summary.byFloor);
  const floorChartData = {
    labels: floorLabels.map((f) => `${t('floor')} ${f}`),
    datasets: [
      {
        label: t('avg_arrival_time_sec'),
        data: floorLabels.map((f) => summary.byFloor[f].avgArrival),
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">
                {t('response_speed_performance_analytics')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('performance_analytics_subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range chips */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 p-1 rounded-2xl border border-gray-200 dark:border-gray-600">
            {[
              { id: 'today', label: t('range_today') },
              { id: '7d', label: t('range_7d') },
              { id: '30d', label: t('range_30d') },
              { id: 'all', label: t('range_all_time') },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setDateFilter(r.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === r.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Drill Isolation Toggle */}
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 select-none hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              checked={excludeDrills} 
              onChange={(e) => setExcludeDrills(e.target.checked)} 
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-[11px] whitespace-nowrap">عزل تمارين المحاكاة (Drills)</span>
          </label>

          {/* Export CSV */}
          <Button
            variant="outline"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 text-xs font-black rounded-xl py-2"
          >
            <Download size={14} />
            <span>{t('export_csv')}</span>
          </Button>

          {/* Admin Config */}
          {isAdmin && (
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 hover:text-primary transition-colors"
              title={t('configure_response_targets')}
            >
              <Settings2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Period Comparison Insights Card */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 p-4 rounded-3xl border border-indigo-100 dark:border-gray-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <TrendingUp size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                مقارنة الأداء بالفترة السابقة ({dateFilter === 'today' ? 'أمس' : dateFilter === '7d' ? 'الـ 7 أيام السابقة' : 'الـ 30 يوماً السابقة'})
              </h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                حجم العينة: الفترة الحالية (N={periodComparison.sampleSize.currentN}) مقابل السابقة (N={periodComparison.sampleSize.previousN})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700/60 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">زمن التأكيد (TTA):</span>
              <span className={`font-black ${periodComparison.deltaPercent.avgTTA <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {periodComparison.deltaPercent.avgTTA > 0 ? `+${periodComparison.deltaPercent.avgTTA}%` : `${periodComparison.deltaPercent.avgTTA}%`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700/60 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">سرعة الوصول (TTR):</span>
              <span className={`font-black ${periodComparison.deltaPercent.avgTTR <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {periodComparison.deltaPercent.avgTTR > 0 ? `+${periodComparison.deltaPercent.avgTTR}%` : `${periodComparison.deltaPercent.avgTTR}%`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700/60 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">الامتثال للمعيار (SLA):</span>
              <span className={`font-black ${periodComparison.deltaPercent.complianceRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {periodComparison.deltaPercent.complianceRate > 0 ? `+${periodComparison.deltaPercent.complianceRate}%` : `${periodComparison.deltaPercent.complianceRate}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Time to Acknowledge (TTA) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400">
              {t('metric_time_to_acknowledge')}
            </span>
            <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-2xl font-black dark:text-white mb-1">
            {formatSeconds(summary.avgTimeToAcknowledgeSec)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-bold border-t dark:border-gray-700 pt-2 mt-2">
            <span>{t('median')}: {formatSeconds(summary.medianTimeToAcknowledgeSec)}</span>
            <span>P90: {formatSeconds(summary.p90TimeToAcknowledgeSec)}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black">
              {summary.metAcknowledgePercent}% {t('met_target')}
            </span>
          </div>
        </div>

        {/* Metric 2: Time to Arrive (TTR) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
              {t('metric_time_to_arrive')}
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Zap size={16} />
            </span>
          </div>
          <div className="text-2xl font-black dark:text-white mb-1">
            {formatSeconds(summary.avgTimeToArriveSec)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-bold border-t dark:border-gray-700 pt-2 mt-2">
            <span>{t('median')}: {formatSeconds(summary.medianTimeToArriveSec)}</span>
            <span>P90: {formatSeconds(summary.p90TimeToArriveSec)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              {summary.metArrivalPercent}% {t('met_target')}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Resolution Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400">
              {t('metric_total_resolution')}
            </span>
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-2xl font-black dark:text-white mb-1">
            {formatSeconds(summary.avgResolutionDurationSec)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-bold border-t dark:border-gray-700 pt-2 mt-2">
            <span>{t('median')}: {formatSeconds(summary.medianResolutionDurationSec)}</span>
            <span>P90: {formatSeconds(summary.p90ResolutionDurationSec)}</span>
            <span className="text-blue-600 dark:text-blue-400 font-black">
              {summary.metResolutionPercent}% {t('met_target')}
            </span>
          </div>
        </div>

        {/* Metric 4: Target Compliance Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400">
              {t('sla_arrival_compliance_target')}
            </span>
            <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Target size={16} />
            </span>
          </div>
          <div className="text-2xl font-black dark:text-white mb-1">
            {summary.metArrivalPercent}%
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-bold border-t dark:border-gray-700 pt-2 mt-2">
            <span>{t('target_cap')}: {formatSeconds(targets.targetTimeToArriveSeconds)}</span>
            <span className="text-amber-600 dark:text-amber-400 font-black">
              {summary.metArrivalCount} / {summary.totalIncidents}
            </span>
          </div>
        </div>
      </div>

      {/* Shifts Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'morning', label: t('shift_morning'), times: '07:00 - 15:00', data: summary.byShift.morning },
          { key: 'evening', label: t('shift_evening'), times: '15:00 - 23:00', data: summary.byShift.evening },
          { key: 'night', label: t('shift_night'), times: '23:00 - 07:00', data: summary.byShift.night },
        ].map((sh) => (
          <div
            key={sh.key}
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black dark:text-white">{sh.label}</h4>
              <span className="text-[10px] text-gray-400 font-bold">{sh.times}</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-black dark:text-white">
                {formatSeconds(sh.data.avgArrival)}
              </span>
              <span className="text-xs font-extrabold text-emerald-600">
                {sh.data.complianceRate}% {t('compliant')}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {sh.data.count} {t('incidents_evaluated')}
            </p>
          </div>
        ))}
      </div>

      {/* Chart: Average Arrival by Floor */}
      {floorLabels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-black dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-primary" />
            {t('average_arrival_by_floor')}
          </h3>
          <div className="h-64">
            <Bar
              data={floorChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Detailed Incidents Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h3 className="text-sm font-black dark:text-white mb-4">
          {t('incident_response_logs')} ({summary.incidentMetrics.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
            <thead>
              <tr className="border-b dark:border-gray-700 text-gray-400 font-black">
                <th className="pb-3">{t('emergency_type')}</th>
                <th className="pb-3">{t('location')}</th>
                <th className="pb-3">{t('time_to_acknowledge')}</th>
                <th className="pb-3">{t('time_to_arrive')}</th>
                <th className="pb-3">{t('total_resolution')}</th>
                <th className="pb-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700/50">
              {summary.incidentMetrics.slice(0, 15).map((m) => (
                <tr key={m.incidentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="py-3 font-bold dark:text-white">{m.typeName}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{m.locationName}</td>
                  <td className="py-3 font-bold">
                    {m.timeToAcknowledgeSeconds !== undefined ? (
                      <span className={m.metAcknowledgeTarget ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatSeconds(m.timeToAcknowledgeSeconds)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 font-bold">
                    {m.timeToArriveSeconds !== undefined ? (
                      <span className={m.metArrivalTarget ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatSeconds(m.timeToArriveSeconds)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-300">
                    {m.totalResolutionSeconds !== undefined ? formatSeconds(m.totalResolutionSeconds) : '—'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      m.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal for SLA Targets */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title={t('configure_response_targets')}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('response_targets_desc')}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('target_time_to_acknowledge_seconds')}
              </label>
              <input
                type="number"
                min="10"
                value={editTargets.targetTimeToAcknowledgeSeconds}
                onChange={(e) =>
                  setEditTargets({
                    ...editTargets,
                    targetTimeToAcknowledgeSeconds: parseInt(e.target.value) || 60,
                  })
                }
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('target_time_to_arrive_seconds')}
              </label>
              <input
                type="number"
                min="30"
                value={editTargets.targetTimeToArriveSeconds}
                onChange={(e) =>
                  setEditTargets({
                    ...editTargets,
                    targetTimeToArriveSeconds: parseInt(e.target.value) || 300,
                  })
                }
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {t('target_time_to_resolve_seconds')}
              </label>
              <input
                type="number"
                min="60"
                value={editTargets.targetTimeToResolveSeconds}
                onChange={(e) =>
                  setEditTargets({
                    ...editTargets,
                    targetTimeToResolveSeconds: parseInt(e.target.value) || 1800,
                  })
                }
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm font-bold dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveTargets} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

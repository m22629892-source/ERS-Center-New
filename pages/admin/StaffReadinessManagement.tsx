import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Users, UserCheck, AlertTriangle, ShieldCheck, 
  Activity, Clock, Search, Filter, Phone, Siren, Wifi, WifiOff, 
  RefreshCw, CheckCircle, ChevronDown, Edit2, AlertCircle, Eye
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useApp } from '../../context/AppContext';
import { User, UserRole, StaffAvailabilityStatus } from '../../types';
import { readinessService, ReadinessSummary } from '../../services/readinessService';
import { motion, AnimatePresence } from 'framer-motion';

export const StaffReadinessManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useApp();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [summary, setSummary] = useState<ReadinessSummary>({
    totalStaff: 0,
    availableCount: 0,
    busyCount: 0,
    respondingCount: 0,
    offDutyCount: 0,
    onlineHeartbeatCount: 0,
    staleHeartbeatCount: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [connectivityFilter, setConnectivityFilter] = useState<string>('all');

  // Status Change Modal
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<StaffAvailabilityStatus>('available');
  const [changeReason, setChangeReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    const unsubscribe = readinessService.subscribeStaffReadiness((users, stats) => {
      setStaffList(users);
      setSummary(stats);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenStatusModal = (staff: User) => {
    setSelectedStaff(staff);
    setNewStatus((staff.availabilityStatus as StaffAvailabilityStatus) || (staff.shiftStatus === 'on-duty' ? 'available' : 'off-duty'));
    setChangeReason('');
    setStatusFeedback(null);
  };

  const handleApplyStatusChange = async () => {
    if (!selectedStaff || !user) return;
    setIsUpdating(true);
    setStatusFeedback(null);

    const result = await readinessService.setStaffAvailability({
      targetUserId: selectedStaff.id,
      newStatus,
      updatedByUser: user,
      reason: changeReason.trim() || undefined
    });

    setIsUpdating(false);

    if (result.success) {
      setStatusFeedback({ type: 'success', text: t('status_update_success', { name: selectedStaff.name, status: newStatus }) });
      setTimeout(() => {
        setSelectedStaff(null);
      }, 900);
    } else {
      setStatusFeedback({ type: 'error', text: result.error || t('status_update_failed') });
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const staffStatus = s.availabilityStatus || (s.shiftStatus === 'on-duty' ? 'available' : 'off-duty');
    const matchesStatus = statusFilter === 'all' || staffStatus === statusFilter;
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    const { isDeviceOnline } = readinessService.getEffectiveConnectivity(s);
    const matchesConnectivity = connectivityFilter === 'all' || 
                                (connectivityFilter === 'online' && isDeviceOnline) ||
                                (connectivityFilter === 'offline' && !isDeviceOnline);

    return matchesSearch && matchesStatus && matchesRole && matchesConnectivity;
  });

  return (
    <div className="space-y-6 pb-20 px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl">
              <Activity size={20} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
              {t('live_readiness_engine')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white tracking-tight">
            {t('staff_readiness')}
          </h1>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {t('staff_readiness_desc')}
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate('/admin')} 
          className="rounded-2xl text-xs font-bold"
        >
          <ArrowLeft size={16} /> {t('back')}
        </Button>
      </div>

      {/* 4 Core Status Counters + Heartbeat Connectivity */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">{t('total_staff')}</div>
            <div className="text-xl font-black dark:text-white">{summary.totalStaff}</div>
          </div>
        </div>

        {/* Available - Green */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm flex items-center gap-3 ${
            statusFilter === 'available' 
              ? 'bg-green-500 text-white border-green-600 shadow-green-200' 
              : 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-950/60 hover:border-green-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${statusFilter === 'available' ? 'bg-white/20' : 'bg-green-100 dark:bg-green-950/50 text-green-600'}`}>
            <UserCheck size={22} />
          </div>
          <div>
            <div className={`text-[10px] font-bold uppercase ${statusFilter === 'available' ? 'text-white/80' : 'text-gray-400'}`}>
              {t('status_available')}
            </div>
            <div className={`text-xl font-black ${statusFilter === 'available' ? 'text-white' : 'text-green-600'}`}>
              {summary.availableCount}
            </div>
          </div>
        </div>

        {/* Busy - Yellow */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'busy' ? 'all' : 'busy')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm flex items-center gap-3 ${
            statusFilter === 'busy' 
              ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200' 
              : 'bg-white dark:bg-gray-800 border-amber-100 dark:border-amber-950/60 hover:border-amber-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${statusFilter === 'busy' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'}`}>
            <Clock size={22} />
          </div>
          <div>
            <div className={`text-[10px] font-bold uppercase ${statusFilter === 'busy' ? 'text-white/80' : 'text-gray-400'}`}>
              {t('status_busy')}
            </div>
            <div className={`text-xl font-black ${statusFilter === 'busy' ? 'text-white' : 'text-amber-600'}`}>
              {summary.busyCount}
            </div>
          </div>
        </div>

        {/* Responding - Red */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'responding' ? 'all' : 'responding')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm flex items-center gap-3 ${
            statusFilter === 'responding' 
              ? 'bg-red-600 text-white border-red-700 shadow-red-200' 
              : 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-950/60 hover:border-red-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${statusFilter === 'responding' ? 'bg-white/20' : 'bg-red-100 dark:bg-red-950/50 text-red-600'}`}>
            <Siren size={22} className="animate-pulse" />
          </div>
          <div>
            <div className={`text-[10px] font-bold uppercase ${statusFilter === 'responding' ? 'text-white/80' : 'text-gray-400'}`}>
              {t('status_responding')}
            </div>
            <div className={`text-xl font-black ${statusFilter === 'responding' ? 'text-white' : 'text-red-600'}`}>
              {summary.respondingCount}
            </div>
          </div>
        </div>

        {/* Off Duty - Gray */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'off-duty' ? 'all' : 'off-duty')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm flex items-center gap-3 ${
            statusFilter === 'off-duty' 
              ? 'bg-gray-700 text-white border-gray-800' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400'
          }`}
        >
          <div className={`p-3 rounded-xl ${statusFilter === 'off-duty' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
            <Clock size={22} />
          </div>
          <div>
            <div className={`text-[10px] font-bold uppercase ${statusFilter === 'off-duty' ? 'text-white/80' : 'text-gray-400'}`}>
              {t('status_off_duty')}
            </div>
            <div className={`text-xl font-black ${statusFilter === 'off-duty' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              {summary.offDutyCount}
            </div>
          </div>
        </div>
      </div>

      {/* Heartbeat Connectivity Indicator Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-blue-500 text-white rounded-xl">
            <Wifi size={16} />
          </span>
          <div>
            <span className="font-black text-blue-900 dark:text-blue-200">
              {t('diff_readiness_connectivity')}
            </span>
            <span className="text-gray-600 dark:text-gray-300 font-bold mx-1">
              {t('online_only')}: <strong className="text-green-600">{summary.onlineHeartbeatCount}</strong> • {t('offline_only')}: <strong className="text-amber-600">{summary.staleHeartbeatCount}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConnectivityFilter('all')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black ${connectivityFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-blue-600'}`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setConnectivityFilter('online')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black ${connectivityFilter === 'online' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-green-600'}`}
          >
            {t('online_only')} ({summary.onlineHeartbeatCount})
          </button>
          <button
            onClick={() => setConnectivityFilter('offline')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black ${connectivityFilter === 'offline' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-amber-600'}`}
          >
            {t('offline_only')} ({summary.staleHeartbeatCount})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute right-3 top-3 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_staff_placeholder')}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
          >
            <option value="all">{t('all_readiness_statuses')}</option>
            <option value="available">{t('status_available')}</option>
            <option value="busy">{t('status_busy')}</option>
            <option value="responding">{t('status_responding')}</option>
            <option value="off-duty">{t('status_off_duty')}</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
          >
            <option value="all">{t('all_roles')}</option>
            <option value={UserRole.RESPONDER}>{t('responder_role')}</option>
            <option value={UserRole.ADMIN}>{t('admin_role')}</option>
            <option value={UserRole.SUPER_ADMIN}>{t('super_admin_role')}</option>
            <option value={UserRole.USER}>{t('user_role')}</option>
          </select>

          {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || connectivityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setConnectivityFilter('all');
              }}
              className="text-xs text-red-500 font-bold px-2 py-1 hover:underline"
            >
              {t('clear_filters')}
            </button>
          )}
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const rawStatus = staff.availabilityStatus || (staff.shiftStatus === 'on-duty' ? 'available' : 'off-duty');
          const { isDeviceOnline, effectiveDescription, heartbeatAgeSeconds } = readinessService.getEffectiveConnectivity(staff);

          const statusConfig = {
            available: {
              label: t('status_available'),
              bg: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-300',
              dot: 'bg-green-500'
            },
            busy: {
              label: t('status_busy'),
              bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300',
              dot: 'bg-amber-500'
            },
            responding: {
              label: t('status_responding'),
              bg: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300',
              dot: 'bg-red-500 animate-ping'
            },
            'off-duty': {
              label: t('status_off_duty'),
              bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300',
              dot: 'bg-gray-400'
            }
          }[rawStatus] || {
            label: t('status_off_duty'),
            bg: 'bg-gray-100 text-gray-700',
            dot: 'bg-gray-400'
          };

          return (
            <div 
              key={staff.id}
              className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-sm dark:text-white leading-tight">
                        {staff.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                        {staff.jobTitle || t('responder_member')} • {staff.department || t('general_dept')}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 shrink-0 ${statusConfig.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                {/* Info Badges */}
                <div className="mt-4 space-y-2 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400">{t('network_connectivity_status')}</span>
                    <span className={`flex items-center gap-1 font-black text-[10px] ${isDeviceOnline ? 'text-green-600' : 'text-amber-500'}`}>
                      {isDeviceOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {isDeviceOnline ? t('connected_live') : t('offline_since_minutes', { count: Math.round(heartbeatAgeSeconds / 60) })}
                    </span>
                  </div>

                  {staff.currentEmergencyIds && staff.currentEmergencyIds.length > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] font-bold text-gray-400">{t('linked_incident')}</span>
                      <span className="text-[10px] font-black text-red-600 flex items-center gap-1">
                        <Siren size={12} /> {t('active_alerts_count', { count: staff.currentEmergencyIds.length })}
                      </span>
                    </div>
                  )}

                  {staff.availabilityReason && (
                    <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[9px] font-bold text-gray-400 block">{t('status_reason')}</span>
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 italic font-bold">
                        "{staff.availabilityReason}"
                      </p>
                    </div>
                  )}

                  {staff.availabilityUpdatedBy && (
                    <div className="text-[9px] text-gray-400 font-bold flex justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span>{t('last_updated_by')}</span>
                      <span>{staff.availabilityUpdatedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenStatusModal(staff)}
                    className="w-full rounded-xl text-xs font-black py-2.5 flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Edit2 size={13} /> {t('manual_readiness_change')}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Availability Status Change Modal */}
      <Modal
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={t('edit_staff_readiness_title', { name: selectedStaff?.name || '' })}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 font-bold">
            {t('audit_trail_note')}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'available', label: t('status_available'), desc: t('status_available'), color: 'border-green-500 bg-green-50 text-green-800' },
              { id: 'busy', label: t('status_busy'), desc: t('status_busy'), color: 'border-amber-500 bg-amber-50 text-amber-800' },
              { id: 'responding', label: t('status_responding'), desc: t('status_responding'), color: 'border-red-500 bg-red-50 text-red-800' },
              { id: 'off-duty', label: t('status_off_duty'), desc: t('status_off_duty'), color: 'border-gray-400 bg-gray-50 text-gray-800' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => setNewStatus(item.id as StaffAvailabilityStatus)}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  newStatus === item.id 
                    ? `${item.color} shadow-md font-black` 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="text-xs font-black">{item.label}</div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-black dark:text-white block mb-1">{t('change_reason_label')}</label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder={t('change_reason_placeholder')}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
            />
          </div>

          {statusFeedback && (
            <div className={`p-3 rounded-xl text-xs font-black flex items-center gap-2 ${
              statusFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {statusFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{statusFeedback.text}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button variant="outline" onClick={() => setSelectedStaff(null)} className="rounded-xl text-xs font-bold">
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleApplyStatusChange} 
              disabled={isUpdating}
              className="rounded-xl text-xs font-black bg-primary text-white px-5"
            >
              {isUpdating ? <RefreshCw className="animate-spin" size={14} /> : t('save_and_update_status')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffReadinessManagement;

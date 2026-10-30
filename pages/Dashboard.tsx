
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { 
  AlertTriangle, List, ShieldAlert, CheckCircle, Activity, 
  LayoutDashboard, Map as MapIcon, Users, Radio, User as UserIcon, 
  ChevronDown, UserCheck, Smartphone, Download, RefreshCw, Loader2, 
  Volume2, CheckSquare, Clock, Siren 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveMap } from '../components/LiveMap';
import { User, UserRole, IncidentTask, Location } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ResponderCounter } from '../components/ResponderCounter';
import { CongestionIndicator } from '../components/CongestionIndicator';
import { unifiedMetricsService } from '../services/unifiedMetricsService';


const AnimatedCounter = ({ value }: { value: number }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="inline-block"
    >
      {value}
    </motion.span>
  );
};

const Dashboard = () => {
  const { user, users, activeEmergencies, emergencies, appLinks, isAudioUnlocked, unlockAudio } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [showUsersList, setShowUsersList] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
    const updateActiveUsers = () => {
      const now = Date.now();
      const active = users.filter(u => {
          if (!u.lastHeartbeat) return false;
          return (now - u.lastHeartbeat) < 300000; 
      });
      setActiveUsers(active);
      setLastUpdate(new Date());
    };

    updateActiveUsers();
    const interval = setInterval(updateActiveUsers, 10000);
    return () => clearInterval(interval);
  }, [users]);

  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Location)));
    });
    return () => unsub();
  }, []);

  const onlineUsers = activeUsers.filter(u => (Date.now() - (u.lastHeartbeat || 0)) < 60000);
  const responderCount = activeUsers.filter(u => u.role === UserRole.RESPONDER || u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN).length;
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const availableStaff = users.filter(u => {
    const s = u.availabilityStatus || (u.shiftStatus === 'on-duty' ? 'available' : 'off-duty');
    return s === 'available';
  });

  const respondingStaff = users.filter(u => {
    return u.availabilityStatus === 'responding' || activeEmergencies.some(e => e.responders?.includes(u.name));
  });

  const [activeTasksMetrics, setActiveTasksMetrics] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0
  });

  useEffect(() => {
    if (activeEmergencies.length === 0) {
      setActiveTasksMetrics({ total: 0, completed: 0, overdue: 0, completionRate: 0 });
      return;
    }

    const tasksMap = new Map<string, IncidentTask[]>();

    const updateAggregates = () => {
      let total = 0;
      let completed = 0;
      let overdue = 0;
      const now = Date.now();

      tasksMap.forEach((tasksList) => {
        tasksList.forEach(task => {
          total++;
          if (task.status === 'completed') completed++;
          if (task.status === 'in_progress' && task.startedAt) {
            const targetMs = (task.targetDurationSeconds || 300) * 1000;
            if (now - task.startedAt > targetMs) overdue++;
          } else if (task.status === 'pending') {
            const targetMs = (task.targetDurationSeconds || 300) * 1000;
            const em = activeEmergencies.find(e => e.id === task.emergencyId);
            if (em && (now - em.createdAt > targetMs)) overdue++;
          }
        });
      });

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setActiveTasksMetrics({ total, completed, overdue, completionRate });
    };

    const unsubs = activeEmergencies.map(em => {
      return onSnapshot(collection(db, 'emergencies', em.id, 'tasks'), (snap) => {
        tasksMap.set(em.id, snap.docs.map(d => ({ taskId: d.id, ...d.data() } as IncidentTask)));
        updateAggregates();
      });
    });

    return () => unsubs.forEach(u => u());
  }, [activeEmergencies]);

  const handleRefreshSession = () => {

      setIsRefreshing(true);
      setTimeout(() => {
          window.location.reload();
      }, 400);
  };

  const unifiedMetrics = React.useMemo(() => {
    return unifiedMetricsService.computeMetrics(emergencies);
  }, [emergencies]);

  return (
    <div className="space-y-6 pb-10">
      {/* iOS Audio Activation Banner */}
      <AnimatePresence>
          {isIOS && !isAudioUnlocked && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-100 border-2 border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm overflow-hidden"
              >
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-200 text-amber-700 rounded-xl"><Volume2 size={24} /></div>
                      <p className="text-xs font-black text-amber-800">{t("audio_siren_disabled_warning")}</p>
                  </div>
                  <Button onClick={unlockAudio} className="w-full sm:w-auto bg-amber-600 border-none py-2 px-6 rounded-xl font-black text-[10px] uppercase">{t("activate_audio_engine_now")}</Button>
              </motion.div>
          )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={() => navigate('/mobile-app')}
        className="bg-gradient-to-r from-primary to-indigo-600 p-3 rounded-2xl shadow-lg cursor-pointer flex items-center justify-between text-white overflow-hidden relative group"
      >
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <Smartphone size={20} />
                </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">{t('available_now')}</p>
            <p className="text-xs font-bold">{t('mobile_app_desc')}</p>
          </div>
        </div>
        <div className="bg-white text-primary px-4 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
          <Download size={12} /> {t('download_android')}
        </div>
        <div className="absolute right-0 top-0 h-full w-32 bg-white/10 skew-x-[30deg] -translate-y-2 group-hover:translate-x-10 transition-transform duration-700"></div>
      </motion.div>

      <header className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Live System Syncing</p>
            </div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
              {t('welcome')}, <span className="text-primary">{user?.name}</span>
            </h1>
            <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-500 text-[10px] font-bold">
                  {t('last_active')}: {lastUpdate.toLocaleTimeString()}
                </p>
                <button 
                  onClick={handleRefreshSession}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 text-primary hover:text-blue-700 transition-colors text-[10px] font-black uppercase tracking-tighter disabled:opacity-50"
                >
                    {isRefreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} 
                    {isRefreshing ? t('loading') : t('refresh_session')}
                </button>
            </div>
          </div>
          <div className="bg-primary/10 p-4 rounded-2xl text-primary hidden md:block">
              <LayoutDashboard size={28} />
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 text-primary pointer-events-none">
          <Radio size={150} />
        </div>
      </header>

      <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
              <h3 className="font-bold dark:text-white flex items-center gap-2">
                <MapIcon size={18} className="text-blue-500"/> 
                {t('live_ops_map')}
              </h3>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUsersList(!showUsersList)}
                  className="flex items-center gap-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-4 py-2 rounded-2xl font-black text-xs shadow-sm hover:bg-green-200 transition-all border border-green-200 dark:border-green-800"
                >
                  <UserCheck size={16} />
                  <span>{activeUsers.length} {t('users_online')}</span>
                  <ChevronDown size={14} className={`transition-transform ${showUsersList ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUsersList && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 5, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[60] overflow-hidden"
                    >
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                        <span>{t('roles')}</span>
                        <span>{onlineUsers.length} {t('online')}</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {activeUsers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-500 italic">{t('no_data')}</div>
                        ) : (
                          activeUsers.map(u => {
                            const isOnline = (Date.now() - (u.lastHeartbeat || 0)) < 60000;
                            return (
                                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b last:border-0 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg ${isOnline ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'} flex items-center justify-center font-bold text-xs`}>
                                    {u.name.charAt(0)}
                                    </div>
                                    <div>
                                    <p className={`text-xs font-bold ${isOnline ? 'dark:text-white' : 'text-gray-400'}`}>{u.name}</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">{u.role}</p>
                                    </div>
                                </div>
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`}></span>
                                </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>

          <motion.div 
            id="live-map-container"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative"
          >
            <LiveMap emergencies={emergencies} users={users} height="400px" />
          </motion.div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard 
          title={t('active_alerts')} 
          value={unifiedMetrics.activeIncidentsCount} 
          icon={<AlertTriangle size={20} />} 
          color="bg-red-500" 
          glowColor="shadow-red-500/20"
          delay={0.05}
        />
        <StatCard 
          title={t("available_staff_card")} 
          value={availableStaff.length} 
          icon={<UserCheck size={20} />} 
          color="bg-green-500" 
          glowColor="shadow-green-500/20"
          delay={0.1}
        />
        <StatCard 
          title={t("on_field_response_card")} 
          value={respondingStaff.length} 
          icon={<Siren size={20} />} 
          color="bg-red-600" 
          glowColor="shadow-red-600/20"
          delay={0.15}
        />
        <StatCard 
          title={t("task_completion_rate_card")} 
          value={activeTasksMetrics.completionRate} 
          icon={<CheckSquare size={20} />} 
          color="bg-indigo-500" 
          glowColor="shadow-indigo-500/20"
          delay={0.2}
        />
        <StatCard 
          title={t("delayed_tasks_card")} 
          value={activeTasksMetrics.overdue} 
          icon={<Clock size={20} />} 
          color="bg-amber-500" 
          glowColor="shadow-amber-500/20"
          delay={0.25}
        />
        <StatCard 
          title={t('today_total_alerts')} 
          value={unifiedMetrics.todayIncidentsCount} 
          icon={<Activity size={20} />} 
          color="bg-blue-500" 
          glowColor="shadow-blue-500/20"
          delay={0.3}
        />
      </div>

      {/* FEATURE 2: Incident Congestion Indicator */}
      <CongestionIndicator
        activeEmergencies={activeEmergencies}
        locations={locations}
        isAdmin={isAdmin}
      />

      {/* FEATURE 1: Active Emergencies with Real-Time Responder Counters */}
      {activeEmergencies.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-sm dark:text-white flex items-center gap-2">
              <Siren size={18} className="text-red-500 animate-pulse" />
              <span>{t('active_alerts')} ({activeEmergencies.length})</span>
            </h3>
            <button
              onClick={() => navigate('/active-alerts')}
              className="text-xs font-black text-primary hover:underline"
            >
              {t('view_all')} →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeEmergencies.slice(0, 4).map((em) => (
              <div
                key={em.id}
                onClick={() => navigate(`/alarm/${em.id}`)}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-red-500/30 hover:border-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black dark:text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                      <span>{em.typeName}</span>
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                      📍 {em.locationName}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 uppercase">
                    {t('live_emergency')}
                  </span>
                </div>

                {/* Real-time Responder Counter */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <ResponderCounter emergency={em} variant="compact" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
        <ActionButton 
          id="btn-new-emergency"
          variant="danger" 
          icon={<AlertTriangle size={32} />} 
          label={t('new_emergency')}
          onClick={() => navigate('/new-emergency')}
          className="shadow-red-500/20"
        />
        <ActionButton 
          variant="primary" 
          icon={<List size={32} />} 
          label={t('active_alerts')}
          onClick={() => navigate('/active-alerts')}
        />
        <ActionButton 
          variant="primary" 
          icon={<CheckCircle size={32} />} 
          label={t('personal_report')}
          onClick={() => navigate('/personal-report')}
        />
        
        {isAdmin ? (
          <ActionButton 
            variant="primary" 
            icon={<ShieldAlert size={32} />} 
            label={t('admin_panel')}
            onClick={() => navigate('/admin')}
          />
        ) : (
          <ActionButton 
            variant="primary" 
            icon={<UserIcon size={32} />} 
            label={t('my_profile_settings')}
            onClick={() => navigate('/settings')}
          />
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, glowColor, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={`bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg ${glowColor} flex items-center justify-between border border-gray-100 dark:border-gray-700 transition-all`}
  >
    <div>
      <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">{title}</h3>
      <div className="text-4xl font-black text-gray-800 dark:text-white mt-1">
        <AnimatedCounter value={value} />
      </div>
    </div>
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
      {icon}
    </div>
  </motion.div>
);

const ActionButton = ({ icon, label, onClick, variant, className, id }: any) => (
  <Button 
    id={id}
    variant={variant} 
    className={`h-32 flex flex-col items-center justify-center gap-3 text-lg font-bold rounded-3xl shadow-xl hover:scale-[1.03] active:scale-95 transition-all ${className}`} 
    onClick={onClick}
  >
    {icon} {label}
  </Button>
);

export default Dashboard;

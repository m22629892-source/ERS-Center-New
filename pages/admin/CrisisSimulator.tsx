
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Play, ArrowLeft, Bot, RefreshCw, AlertTriangle, 
  Target, Zap, Loader2, Printer, FileDown, Save, MessageSquareText, Settings2,
  Users, CheckCircle2, Award, Clock, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FacilityProfile, SimulatorConfig, DrillSession, DrillParticipant } from '../../types';
import { generateCrisisScenario } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';

const CrisisSimulator = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, users, geminiApiKey, geminiApiKeySecondary } = useApp();
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isLaunchingDrill, setIsLaunchingDrill] = useState(false);
  const [scenario, setScenario] = useState<any>(null);
  const [customSituations, setCustomSituations] = useState('');
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfile | null>(null);

  // Participant Enrollment & Past Drills State
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [targetSlaMinutes, setTargetSlaMinutes] = useState<number>(5);
  const [pastDrills, setPastDrills] = useState<DrillSession[]>([]);
  const [launchMessage, setLaunchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize selected participants with current user
  useEffect(() => {
    if (user?.id && selectedParticipantIds.length === 0) {
      setSelectedParticipantIds([user.id]);
    }
  }, [user]);

  const loadPastDrills = async () => {
    try {
      const q = query(collection(db, 'drills'), orderBy('startedAt', 'desc'));
      const snap = await getDocs(q);
      const list: DrillSession[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as DrillSession));
      setPastDrills(list);
    } catch (e) {
      console.warn('Error fetching past drills:', e);
    }
  };

  const handleLaunchDrillEmergency = async () => {
    if (!scenario || !user) return;
    setIsLaunchingDrill(true);
    setLaunchMessage(null);
    try {
      const emergencyId = `drill_${Date.now()}`;
      const now = Date.now();

      // Resolve enrolled participants
      const enrolledUserList: DrillParticipant[] = (users || [])
        .filter(u => selectedParticipantIds.includes(u.id))
        .map(u => ({
          userId: u.id,
          userName: u.name,
          jobTitle: (u as any).jobTitle || (u as any).job_name || 'مستجيب',
          role: u.role,
          deviceId: (u as any).deviceId || 'device_primary',
          enrolledAt: now,
        }));

      // 1. Create Drill Session Document in /drills/{id}
      const drillData: DrillSession = {
        id: emergencyId,
        title: scenario.title,
        description: scenario.description,
        difficulty: scenario.difficulty,
        challenges: scenario.challenges || [],
        goals: scenario.goals || [],
        startedAt: now,
        status: 'in_progress',
        targetSlaMinutes: targetSlaMinutes || 5,
        enrolledParticipants: enrolledUserList.length > 0 ? enrolledUserList : [{
          userId: user.id,
          userName: user.name,
          jobTitle: (user as any).jobTitle || 'مشرف المحاكاة',
          role: user.role,
          enrolledAt: now,
        }],
        creatorId: user.id,
        creatorName: user.name,
      };
      await setDoc(doc(db, 'drills', emergencyId), drillData);

      // 2. Create Mirror Isolated Incident in /emergencies/{id}
      const emergencyData = {
        id: emergencyId,
        typeId: 'type_drill_simulation',
        typeName: `[تمرين محاكاة] ${scenario.title}`,
        locationId: 'loc_main_facility',
        locationName: 'مبنى المنشأة الرئيسي (قاعة المحاكاة)',
        notes: scenario.description,
        createdBy: user.id,
        creatorName: user.name,
        createdAt: now,
        status: 'active',
        responders: [],
        isDrill: true, // STRICT ISOLATION FLAG
        drillId: emergencyId,
        severity: scenario.difficulty === 'صعب' ? 'high' : 'medium',
      };
      await setDoc(doc(db, 'emergencies', emergencyId), emergencyData);

      // 3. Trigger Server-Authoritative FCM Dispatch (Strictly to Enrolled Participants)
      try {
        await fetch('/api/drills/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drillId: emergencyId,
            scenarioTitle: scenario.title,
            scenarioDescription: scenario.description,
            participantUserIds: enrolledUserList.map(p => p.userId),
            targetSlaMinutes,
          }),
        });
      } catch (fcmLaunchErr) {
        console.warn('FCM drill launch call notice:', fcmLaunchErr);
      }

      setLaunchMessage({
        type: 'success',
        text: 'تم إطلاق تمرين المحاكاة بنجاح وعزل الإشعارات عن الفرق التشغيلية.'
      });

      // Navigate to incident alarm room
      setTimeout(() => {
        navigate(`/alarm/${emergencyId}`);
      }, 1000);
    } catch (err: any) {
      setLaunchMessage({ type: 'error', text: 'فشل إطلاق التمرين: ' + err.message });
    } finally {
      setIsLaunchingDrill(false);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
        const profileSnap = await getDoc(doc(db, 'system', 'facility_profile'));
        if (profileSnap.exists()) setFacilityProfile(profileSnap.data() as FacilityProfile);
        
        const configSnap = await getDoc(doc(db, 'system', 'simulator_config'));
        if (configSnap.exists()) {
            const data = configSnap.data() as SimulatorConfig;
            setCustomSituations(data.customSituations || '');
        }
    };
    loadConfig();
  }, []);

  const saveConfig = async () => {
      setSavingSettings(true);
      try {
          await setDoc(doc(db, 'system', 'simulator_config'), {
              customSituations,
              updatedAt: Date.now()
          });
      } catch (e) { alert(t("settings_save_failed")); }
      setSavingSettings(false);
  };

  const handlePrint = () => {
      const element = document.getElementById('scenario-content');
      if (!element) return;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
                <head>
                    <title>ERS System Crisis Scenario</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                        body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; color: #1f2937; }
                        h4 { color: #1976d2; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0; }
                        .bg-gray-50 { background: #f9fafb !important; padding: 25px; border-radius: 15px; border: 1px solid #e5e7eb; margin-bottom: 25px; }
                        .grid { display: flex; gap: 30px; margin-top: 25px; }
                        .grid > div { flex: 1; }
                        ul { padding-right: 20px; list-style-type: none; }
                        li { margin-bottom: 12px; font-weight: bold; background: #fff; padding: 10px; border-radius: 8px; border-right: 4px solid #1976d2; }
                        .no-print { display: none !important; }
                    </style>
                </head>
                <body>
                    <div style="text-align:center; border-bottom: 3px solid #1976d2; padding-bottom: 15px; margin-bottom: 30px;">
                        <h2 style="color:#1976d2; margin-bottom: 5px;">' + t("crisis_simulator_report_title") + '</h2>
                        <p style="font-size:12px; color:#6b7280;">' + t("generation_date") + ': ' + new Date().toLocaleString() + '</p>
                    </div>
                    ${element.innerHTML}
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = () => window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const handleExportPDF = () => {
      const element = document.getElementById('scenario-content');
      if (!element) return;
      
      const opt = {
          margin: 15,
          filename: `ERS_Scenario_${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 1.0 },
          html2canvas: { scale: 3, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // @ts-ignore
      if (window.html2pdf) {
          // @ts-ignore
          window.html2pdf().set(opt).from(element).save();
      } else {
          alert(t("pdf_not_loaded_error"));
      }
  };

  const handleGenerateScenario = async () => {
    setLoading(true);
    try {
      // Fix: Pass geminiApiKey and geminiApiKeySecondary as required by the generateCrisisScenario function signature
      const result = await generateCrisisScenario(facilityProfile, customSituations, geminiApiKey, geminiApiKeySecondary);
      setScenario(result);
    } catch (e: any) {
      console.error("Simulator Error:", e);
      alert(t("scenario_generation_failed", { error: e.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-10 px-2 sm:px-0">
      <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700 gap-4 no-print">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
          <ShieldAlert className="text-primary shrink-0" size={24} /> {t('simulated_emergencies')}
        </h2>
        <Button variant="outline" onClick={() => navigate('/admin')} className="rounded-xl shrink-0">
          <ArrowLeft size={16} className="mr-1 rtl:rotate-180" /> {t('back')}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-100 dark:border-gray-700 space-y-4 no-print">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <Settings2 size={16} /> {t("customize_simulator_content")}
          </div>
          <p className="text-[10px] text-gray-400 font-bold">{t("custom_simulator_prompt")}</p>
          <textarea 
            value={customSituations}
            onChange={(e) => setCustomSituations(e.target.value)}
            placeholder={t("custom_situations_placeholder")}
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-primary min-h-[100px] font-bold text-sm dark:text-white shadow-inner"
          />
          <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={savingSettings} className="rounded-xl py-2 px-6 text-xs font-black">
                  {savingSettings ? <Loader2 className="animate-spin" /> : <><Save size={14} className="mr-1"/> {t("save_custom_situations")}</>}
              </Button>
          </div>
      </div>

      <div className="bg-indigo-600 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden no-print">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div className="bg-white/20 p-5 rounded-3xl shrink-0"><Bot size={48} className="sm:w-16 sm:h-16"/></div>
            <div className="flex-1 text-center md:text-right">
                <h3 className="text-2xl sm:text-3xl font-black mb-3">{t("generate_corporate_scenario")}</h3>
                <p className="text-indigo-100 font-medium leading-relaxed text-sm sm:text-base italic">{t("simulator_smart_desc")}</p>
                <button 
                  onClick={handleGenerateScenario}
                  disabled={loading}
                  className="mt-6 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto md:mx-0 hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />} {scenario ? t("generate_different_scenario") : t("start_simulation_now")}
                </button>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {scenario && (
          <motion.div 
            id="scenario-content"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-6 sm:p-10 border border-gray-100 dark:border-gray-700 space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-gray-700 pb-6">
                <div>
                    <h4 className="text-xl sm:text-2xl font-black text-primary leading-tight">{scenario.title}</h4>
                    <span className={`mt-2 inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${scenario.difficulty === 'صعب' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{t("difficulty_level")}: {scenario.difficulty}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 no-print">
                    <Button 
                        onClick={handleLaunchDrillEmergency} 
                        disabled={isLaunchingDrill}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 px-4 text-xs font-black flex items-center gap-1.5 shadow-md"
                    >
                        <ShieldAlert size={16} />
                        <span>{isLaunchingDrill ? 'جاري الإطلاق...' : 'إطلاق سيناريو التمرين كبلاغ معزول'}</span>
                    </Button>
                    <button onClick={handlePrint} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-primary rounded-xl transition-all border border-gray-100 dark:border-gray-600 shadow-sm" title={t("print")}>
                        <Printer size={20} />
                    </button>
                    <button onClick={handleExportPDF} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-primary rounded-xl transition-all border border-gray-100 dark:border-gray-600 shadow-sm" title={t("export_pdf")}>
                        <FileDown size={20} />
                    </button>
                </div>
            </div>

            {/* Launch Notification Feedback */}
            {launchMessage && (
              <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-2 ${
                launchMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {launchMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{launchMessage.text}</span>
              </div>
            )}

            {/* Participant Selection & Target SLA (Strict Isolation) */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-200 dark:border-amber-800/40 space-y-4 no-print">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
                  <Users size={18} />
                  <span>تحديد المشاركين المعتمدين في التمرين (عزل تام عن بقية الفرق)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                  <span>المهلة المستهدفة (SLA):</span>
                  <select 
                    value={targetSlaMinutes} 
                    onChange={e => setTargetSlaMinutes(Number(e.target.value))}
                    className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-black dark:bg-gray-800"
                  >
                    <option value={3}>3 دقائق</option>
                    <option value={5}>5 دقائق</option>
                    <option value={8}>8 دقائق</option>
                    <option value={10}>10 دقائق</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                🔒 ضمان العزل الصارم: سيتم إرسال إشعار التمرين الموسوم بـ [تدريب — ليس بلاغًا حقيقيًا] حصريًا للأجهزة والمستخدمين المحددين أدناه. لن يتم إطلاق صفارات الإنذار التشغيلية أو التأثير على جاهزية باقي الفرق أو سجلات الإنتاج.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                {(users || []).map((u) => {
                  const isChecked = selectedParticipantIds.includes(u.id);
                  return (
                    <label 
                      key={u.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-amber-100 border-amber-400 text-amber-950 dark:bg-amber-900/40 dark:text-amber-200' 
                          : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipantIds([...selectedParticipantIds, u.id]);
                          } else {
                            setSelectedParticipantIds(selectedParticipantIds.filter(id => id !== u.id));
                          }
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div className="truncate">
                        <div className="truncate font-black">{u.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{(u as any).jobTitle || u.role}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
                <h5 className="font-black flex items-center gap-2 text-gray-700 dark:text-white text-sm sm:text-base">
                    <AlertTriangle size={18} className="text-orange-500"/> {t("field_crisis_details")}
                </h5>
                <div className="text-gray-600 dark:text-gray-300 leading-loose font-bold bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 text-sm sm:text-base italic shadow-inner">
                    "{scenario.description}"
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h5 className="font-black flex items-center gap-2 text-gray-700 dark:text-white text-sm sm:text-base">
                        <Zap className="text-blue-500" size={18}/> التحديات الحرجة
                    </h5>
                    <ul className="space-y-3">
                        {scenario.challenges.map((c: any, i: number) => (
                            <li key={i} className="bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 p-4 rounded-2xl text-xs sm:text-sm font-black border-r-4 border-blue-400 flex items-center gap-3 shadow-sm">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-4">
                    <h5 className="font-black flex items-center gap-2 text-gray-700 dark:text-white text-sm sm:text-base">
                        <Target className="text-green-500" size={18}/> مؤشرات النجاح (KPIs)
                    </h5>
                    <ul className="space-y-3">
                        {scenario.goals.map((g: any, i: number) => (
                            <li key={i} className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-blue-300 p-4 rounded-2xl text-xs sm:text-sm font-black border-r-4 border-green-400 flex items-center gap-3 shadow-sm">
                                <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                                {g}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="hidden print:block border-t pt-10 mt-20 text-[10px] text-gray-400 font-bold flex justify-between">
                <span>ERS System - محاكي الأزمات الذكي</span>
                <span>تاريخ التوليد: ${new Date().toLocaleString('ar-EG')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Drills and Documented Performance Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 sm:p-8 shadow-md border border-gray-100 dark:border-gray-700 space-y-5 no-print">
        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <div className="flex items-center gap-2 text-primary font-black text-base">
            <Award size={20} />
            <span>سجل تمارين المحاكاة والتقارير الموثقة للجان السلامة</span>
          </div>
          <button 
            onClick={loadPastDrills} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500" 
            title="تحديث قائمة التمارين"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {pastDrills.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs font-bold bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            لا توجد تمارين محاكاة مسجلة حتى الآن. عند إطلاق سيناريو، سيتم توثيق طوابعه الزمنية وتقارير استجابته هنا تلقائياً.
          </div>
        ) : (
          <div className="space-y-3">
            {pastDrills.map((drill) => (
              <div 
                key={drill.id}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-800 dark:text-white">
                      {drill.title}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {drill.difficulty || 'متوسط'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {new Date(drill.startedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {drill.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold pt-1">
                    <span>المشاركون: {(drill.enrolledParticipants || []).length} فرد</span>
                    <span>المهلة المستهدفة: {drill.targetSlaMinutes || 5} دقيقة</span>
                    <span>الحالة: {drill.status === 'completed' ? 'مكتمل' : 'نشط / قيد التنفيذ'}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate(`/admin/drill-report/${drill.id}`)}
                  className="rounded-xl text-xs font-black bg-primary text-white flex items-center gap-1.5 shrink-0"
                >
                  <FileText size={14} />
                  <span>تقرير التمرين الموثق</span>
                  <ChevronRight size={14} className="rtl:rotate-180" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          #scenario-content { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default CrisisSimulator;

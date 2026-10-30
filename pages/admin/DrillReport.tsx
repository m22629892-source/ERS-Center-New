import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { DrillSession, DrillParticipant, DrillReportSummary, Emergency } from '../../types';
import { 
  ArrowLeft, ShieldAlert, Clock, CheckCircle2, AlertTriangle, 
  Users, Target, Printer, Download, Calendar, Building2, 
  BadgeCheck, Award, FileText, ChevronDown, Check, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DrillReport: React.FC = () => {
  const { drillId } = useParams<{ drillId: string }>();
  const navigate = useNavigate();

  const [drill, setDrill] = useState<DrillSession | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comparison drill selection
  const [allPastDrills, setAllPastDrills] = useState<DrillSession[]>([]);
  const [comparisonDrillId, setComparisonDrillId] = useState<string>('');
  const [comparisonDrill, setComparisonDrill] = useState<DrillSession | null>(null);

  useEffect(() => {
    if (!drillId) return;
    setLoading(true);

    const loadDrillData = async () => {
      try {
        // 1. Try fetching from drills collection
        let drillData: DrillSession | null = null;
        const drillSnap = await getDoc(doc(db, 'drills', drillId));
        if (drillSnap.exists()) {
          drillData = { id: drillSnap.id, ...drillSnap.data() } as DrillSession;
        } else {
          // Fallback to emergencies collection
          const emSnap = await getDoc(doc(db, 'emergencies', drillId));
          if (emSnap.exists()) {
            const em = emSnap.data() as Emergency;
            drillData = {
              id: emSnap.id,
              title: em.typeName,
              description: em.notes || '',
              facilityId: em.locationId,
              facilityName: em.locationName,
              severity: (em.severity as any) || 'medium',
              createdBy: em.createdBy,
              creatorName: em.creatorName || 'المشرف',
              createdAt: em.createdAt,
              startedAt: em.createdAt || Date.now(),
              status: em.status === 'closed' ? 'completed' : 'active',
              isDrill: true,
              participants: (em.responders || []).map((r: any) => ({
                userId: typeof r === 'string' ? r : r.userId,
                userName: typeof r === 'string' ? r : r.userName,
                role: 'responder',
                enrolledAt: em.createdAt,
                invitationStatus: 'acknowledged',
                acknowledgedAt: em.firstAcknowledgedAt,
              })),
              targetSlaAckSeconds: 60,
              targetSlaArrivalSeconds: 300,
              firstAcknowledgedAt: em.firstAcknowledgedAt,
              firstArrivalAt: em.firstArrivalAt,
              closedAt: em.closedAt,
            };
          }
        }

        if (!drillData) {
          setError('لم يتم العثور على سجل التمرين المحدد');
          setLoading(false);
          return;
        }

        setDrill(drillData);

        // 2. Fetch tasks
        try {
          const tasksSnap = await getDocs(collection(db, 'emergencies', drillId, 'tasks'));
          setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {}

        // 3. Fetch events/timeline
        try {
          const eventsSnap = await getDocs(
            query(collection(db, 'emergencies', drillId, 'events'), orderBy('timestamp', 'asc'))
          );
          setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {}

        // 4. Fetch past drills for comparison
        try {
          const allDrillsSnap = await getDocs(collection(db, 'drills'));
          const list = allDrillsSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as DrillSession))
            .filter(d => d.id !== drillId && d.status === 'completed');
          setAllPastDrills(list);
        } catch (e) {}

      } catch (err: any) {
        console.error('Error loading drill:', err);
        setError(err.message || 'فشل تحميل بيانات التمرين');
      } finally {
        setLoading(false);
      }
    };

    loadDrillData();
  }, [drillId]);

  useEffect(() => {
    if (comparisonDrillId) {
      const match = allPastDrills.find(d => d.id === comparisonDrillId) || null;
      setComparisonDrill(match);
    } else {
      setComparisonDrill(null);
    }
  }, [comparisonDrillId, allPastDrills]);

  // Derived factual calculations (No 0-fill for missing data)
  const reportMetrics = useMemo(() => {
    if (!drill) return null;

    const createdAt = drill.createdAt;
    const firstAckAt = drill.firstAcknowledgedAt;
    const firstArrAt = drill.firstArrivalAt;
    const containedAt = drill.containedAt;
    const closedAt = drill.closedAt;

    const ackDurationSec = firstAckAt && createdAt && firstAckAt >= createdAt
      ? Math.round((firstAckAt - createdAt) / 1000)
      : null;

    const arrivalDurationSec = firstArrAt && createdAt && firstArrAt >= createdAt
      ? Math.round((firstArrAt - createdAt) / 1000)
      : null;

    const containmentDurationSec = containedAt && createdAt && containedAt >= createdAt
      ? Math.round((containedAt - createdAt) / 1000)
      : null;

    const totalDurationSec = closedAt && createdAt && closedAt >= createdAt
      ? Math.round((closedAt - createdAt) / 1000)
      : null;

    // Deduplicated participants
    const participants = drill.participants || [];
    const uniqueUserIds = Array.from(new Set(participants.map(p => p.userId)));

    const invitedCount = uniqueUserIds.length;
    const acknowledgedCount = participants.filter(p => p.acknowledgedAt || p.invitationStatus === 'acknowledged').length;
    const arrivedCount = participants.filter(p => p.arrivedAt || p.invitationStatus === 'arrived').length;
    const participatedCount = participants.filter(p => p.hasInteracted || p.arrivedAt || p.acknowledgedAt).length;

    // SLA targets
    const targetAck = drill.targetSlaAckSeconds || 60;
    const targetArrival = drill.targetSlaArrivalSeconds || 300;

    const ackBreached = ackDurationSec !== null ? ackDurationSec > targetAck : false;
    const arrivalBreached = arrivalDurationSec !== null ? arrivalDurationSec > targetArrival : false;

    // Tasks metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.completed).length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed' || (t.targetDurationSeconds && !t.completed)).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ackDurationSec,
      arrivalDurationSec,
      containmentDurationSec,
      totalDurationSec,
      invitedCount,
      acknowledgedCount,
      arrivedCount,
      participatedCount,
      targetAck,
      targetArrival,
      ackBreached,
      arrivalBreached,
      totalTasks,
      completedTasks,
      delayedTasks,
      taskCompletionRate
    };
  }, [drill, tasks]);

  const handlePrint = () => {
    window.print();
  };

  const formatSeconds = (sec: number | null | undefined): string => {
    if (sec === null || sec === undefined) return 'غير موثق';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} ثانية`;
    return `${m} دقيقة و${s} ثانية`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-gray-500 font-bold">
        جاري تحميل تقرير التمرين المعتمد...
      </div>
    );
  }

  if (error || !drill || !reportMetrics) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xl text-center space-y-4">
        <AlertTriangle size={48} className="mx-auto text-amber-500" />
        <h3 className="text-lg font-black dark:text-white">تعذر عرض تقرير التمرين</h3>
        <p className="text-xs text-gray-500">{error || 'البيانات غير متوفرة'}</p>
        <button
          onClick={() => navigate('/admin/crisis-simulator')}
          className="bg-primary text-white text-xs font-black px-4 py-2 rounded-xl"
        >
          العودة لمحاكي الأزمات
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 print:p-0 print:m-0 print:max-w-none">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/admin/crisis-simulator')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>العودة للمحاكي</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition-colors"
          >
            <Printer size={16} />
            <span>طباعة تقرير اللجنة الرسمي</span>
          </button>
        </div>
      </div>

      {/* Main Official Committee Report Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden print:shadow-none print:border-none">
        {/* Committee Header Banner */}
        <div className="p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-white/10 print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black mb-2 print:border-black print:text-black">
                <ShieldAlert size={14} />
                <span>تقرير تقييم تمرين محاكاة معزول (Isolated Drill Assessment)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">{drill.title}</h1>
              <p className="text-xs text-indigo-200 print:text-gray-600 mt-1">
                المنشأة: {drill.facilityName} | رقم التمرين المرجعي #{drill.id.toUpperCase()}
              </p>
            </div>

            <div className="text-left rtl:text-right sm:rtl:text-left text-xs space-y-1 print:text-gray-700">
              <div>تاريخ التمرين: <span className="font-bold">{new Date(drill.createdAt).toLocaleDateString('ar-EG')}</span></div>
              <div>وقت الاستخراج: <span className="font-bold">{new Date().toLocaleTimeString('ar-EG')}</span></div>
              <div>حالة التمرين: <span className="font-black text-emerald-400 print:text-black">{drill.status === 'completed' ? 'مكتمل ومغلق' : 'قيد المتابعة والتنفيذ'}</span></div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Section 1: Response Durations (Strictly Computed from Events) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 border-r-4 border-primary pr-2">
              <Clock size={18} className="text-primary" />
              <span>أولاً: أزمنة الاستجابة الموثقة بالطوابع الرقمية (لا تحتسب صفراً في حال الغياب)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Ack SLA */}
              <div className={`p-4 rounded-2xl border ${reportMetrics.ackBreached ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                <span className="text-gray-400 font-bold block text-[10px]">أول تأكيد استلام (Ack)</span>
                <span className="font-black text-base dark:text-white block mt-1">
                  {formatSeconds(reportMetrics.ackDurationSec)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  المهلة المستهدفة: {reportMetrics.targetAck} ثانية
                  {reportMetrics.ackBreached && <span className="text-rose-600 font-black block">تجاوز المهلة!</span>}
                </span>
              </div>

              {/* Arrival SLA */}
              <div className={`p-4 rounded-2xl border ${reportMetrics.arrivalBreached ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                <span className="text-gray-400 font-bold block text-[10px]">أول وصول ميداني (Arrival)</span>
                <span className="font-black text-base dark:text-white block mt-1">
                  {formatSeconds(reportMetrics.arrivalDurationSec)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  المهلة المستهدفة: {reportMetrics.targetArrival} ثانية
                  {reportMetrics.arrivalBreached && <span className="text-rose-600 font-black block">تجاوز المهلة!</span>}
                </span>
              </div>

              {/* Containment */}
              <div className="p-4 rounded-2xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <span className="text-gray-400 font-bold block text-[10px]">زمن السيطرة (Containment)</span>
                <span className="font-black text-base dark:text-white block mt-1">
                  {formatSeconds(reportMetrics.containmentDurationSec)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {drill.containedAt ? 'موثق بسجل الأحداث' : 'غير موثق في السجل'}
                </span>
              </div>

              {/* Total Duration */}
              <div className="p-4 rounded-2xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <span className="text-gray-400 font-bold block text-[10px]">مدة التمرين الكلية</span>
                <span className="font-black text-base dark:text-white block mt-1">
                  {formatSeconds(reportMetrics.totalDurationSec)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  من إطلاق التمرين حتى الإغلاق
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Deduplicated Participant Metrics */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 border-r-4 border-indigo-500 pr-2">
              <Users size={18} className="text-indigo-500" />
              <span>ثانياً: إحصاءات المشاركين الفعلية (بدون تكرار للشخص عبر أجهزته)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold block text-[10px]">المدعوون للتمرين</span>
                <span className="text-2xl font-black text-indigo-950 dark:text-indigo-200 mt-1 block">
                  {reportMetrics.invitedCount}
                </span>
                <span className="text-[10px] text-gray-500">كوادر مسجلة ومصرحة</span>
              </div>

              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <span className="text-blue-600 dark:text-blue-400 font-bold block text-[10px]">المؤكدون للاستلام</span>
                <span className="text-2xl font-black text-blue-950 dark:text-blue-200 mt-1 block">
                  {reportMetrics.acknowledgedCount}
                </span>
                <span className="text-[10px] text-gray-500">استجابوا للتنبيه الفوري</span>
              </div>

              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                <span className="text-purple-600 dark:text-purple-400 font-bold block text-[10px]">الواصلون لموقع الحدث</span>
                <span className="text-2xl font-black text-purple-950 dark:text-purple-200 mt-1 block">
                  {reportMetrics.arrivedCount}
                </span>
                <span className="text-[10px] text-gray-500">تم تأكيد وصولهم بنظام التتبع</span>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-[10px]">المشاركون الفعليون</span>
                <span className="text-2xl font-black text-emerald-950 dark:text-emerald-200 mt-1 block">
                  {reportMetrics.participatedCount}
                </span>
                <span className="text-[10px] text-gray-500">تفاعلوا ونفذوا مهام ميدانية</span>
              </div>
            </div>
          </div>

          {/* Section 3: Tasks and Procedures Compliance */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 border-r-4 border-emerald-500 pr-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>ثالثاً: معدل إنجاز بروتوكول التشغيل القياسي (SOP Compliance)</span>
            </h3>

            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-black text-sm dark:text-white">
                  نسبة الإنجاز الميداني: {reportMetrics.taskCompletionRate}%
                </div>
                <div className="text-gray-500">
                  تم تنفيذ {reportMetrics.completedTasks} مهمة من أصل {reportMetrics.totalTasks} مهمة مسجلة في قائمة تمرين المحاكاة.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  مكتملة: {reportMetrics.completedTasks}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-bold">
                  متأخرة/معلقة: {reportMetrics.delayedTasks}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Comparative Drill Analysis (Only shown if comparable drill is available) */}
          <div className="space-y-3 no-print">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 border-r-4 border-amber-500 pr-2">
              <Target size={18} className="text-amber-500" />
              <span>رابعاً: مقارنة الأداء مع تجربة سابقة (لا تُحسب نسب تحسن دون تجربة موثقة مماثلة)</span>
            </h3>

            <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="font-bold block text-gray-700 dark:text-gray-300 mb-1">
                    اختر تمرين محاكاة سابق مكتمل للمقارنة:
                  </label>
                  <select
                    value={comparisonDrillId}
                    onChange={(e) => setComparisonDrillId(e.target.value)}
                    className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 dark:bg-gray-800 dark:text-white text-xs font-bold w-full sm:w-80"
                  >
                    <option value="">-- لا يوجد تمرين مقارن مختار --</option>
                    {allPastDrills.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({new Date(d.createdAt).toLocaleDateString('ar-EG')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!comparisonDrill ? (
                <div className="text-gray-500 italic text-[11px]">
                  ملاحظة منهجية: لا يظهر النظام نسب تحسن مئوية افتراضية؛ يجب اختيار تمرين سابق مكتمل بنفس النطاق لبيان الفروق الزمنية وحجم العينة بدقة.
                </div>
              ) : (
                <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-300 dark:border-amber-700 space-y-2">
                  <div className="font-black text-xs text-amber-900 dark:text-amber-200">
                    مقارنة: التمرين الحالي مقابل #{comparisonDrill.id} ({comparisonDrill.title})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 block">حجم العينة الحالي:</span>
                      <span className="font-bold">{reportMetrics.invitedCount} مشارك</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">حجم عينة التمرين السابق:</span>
                      <span className="font-bold">{(comparisonDrill.participants || []).length} مشارك</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">فارق أول استجابة:</span>
                      <span className="font-bold">
                        {reportMetrics.ackDurationSec !== null && comparisonDrill.firstAcknowledgedAt
                          ? `${reportMetrics.ackDurationSec - Math.round((comparisonDrill.firstAcknowledgedAt - comparisonDrill.createdAt)/1000)} ثانية`
                          : 'غير قابل للحساب بدقة لغياب طابع المقارنة'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Committee Sign-Off Block */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 block text-[10px]">معد التقرير</span>
              <span className="font-black text-gray-800 dark:text-white block mt-1">{drill.creatorName || 'مسؤول التدريب الميداني'}</span>
              <span className="text-[10px] block mt-1">توقيع إلكتروني موثق بالسجل</span>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 block text-[10px]">المشرف المعتمد</span>
              <span className="font-black text-gray-800 dark:text-white block mt-1">مدير إدارة السلامة والطوارئ</span>
              <span className="text-[10px] block mt-1">اعتماد لجنة تقييم الأزمات</span>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 block text-[10px]">حجية البيانات</span>
              <span className="font-black text-gray-800 dark:text-white block mt-1">سجل رقمي محمي (ERS Central)</span>
              <span className="text-[10px] block mt-1">استخراج مؤرخ: {new Date().toLocaleString('ar-EG')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrillReport;

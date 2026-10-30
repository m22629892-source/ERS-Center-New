import React, { useState, useEffect } from 'react';
import { 
  Emergency, PostIncidentReview, CAPAItem, User, UserRole, 
  GroundedEvidenceItem, PIRVersionHistory 
} from '../types';
import { pirService, LegacyPirAuditFinding } from '../services/pirService';
import { 
  FileText, CheckCircle2, Clock, ShieldCheck, AlertCircle, 
  Plus, ExternalLink, Printer, Star, Bot, Save, X, 
  UserCheck, ArrowRight, Sparkles, Building2, Calendar, 
  Search, History, AlertTriangle, HelpCircle, BadgeCheck, FileWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostIncidentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergency: Emergency;
  currentUser: User | null;
}

export const PostIncidentReviewModal: React.FC<PostIncidentReviewModalProps> = ({
  isOpen,
  onClose,
  emergency,
  currentUser,
}) => {
  const [pir, setPir] = useState<PostIncidentReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'rca' | 'capa' | 'history' | 'legacyAudit'>('overview');

  // Form states
  const [summary, setSummary] = useState('');
  const [rootCauses, setRootCauses] = useState('');
  const [rootCauseStatus, setRootCauseStatus] = useState<'preliminary_hypothesis' | 'expert_confirmed'>('preliminary_hypothesis');
  const [rating, setRating] = useState(4);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [capaItems, setCapaItems] = useState<CAPAItem[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<GroundedEvidenceItem[]>([]);
  const [casualtyAssessment, setCasualtyAssessment] = useState<{ status: string; details: string; sourceEventId?: string }>({
    status: 'not_documented',
    details: 'غير موثق'
  });
  const [containmentAssessment, setContainmentAssessment] = useState<{ status: string; details: string; sourceEventId?: string }>({
    status: 'not_documented',
    details: 'غير موثق'
  });
  const [arrivalAssessment, setArrivalAssessment] = useState<{ status: string; durationSeconds?: number; details: string; sourceEventId?: string }>({
    status: 'not_documented',
    details: 'غير موثق'
  });

  // Legacy audit state
  const [legacyFindings, setLegacyFindings] = useState<LegacyPirAuditFinding[]>([]);
  const [isScanningLegacy, setIsScanningLegacy] = useState(false);

  // New CAPA item draft
  const [isAddingCapa, setIsAddingCapa] = useState(false);
  const [newCapaTitle, setNewCapaTitle] = useState('');
  const [newCapaAssignee, setNewCapaAssignee] = useState('');
  const [newCapaDept, setNewCapaDept] = useState('');
  const [newCapaDueDate, setNewCapaDueDate] = useState('');
  const [newCapaProof, setNewCapaProof] = useState('');

  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (!isOpen || !emergency.id) return;
    setLoading(true);
    pirService.getPostIncidentReview(emergency.id).then((existing) => {
      if (existing) {
        setPir(existing);
        setSummary(existing.executiveSummary || '');
        setRootCauses(existing.rootCauseAnalysis || '');
        setRootCauseStatus(existing.rootCauseStatus || 'preliminary_hypothesis');
        setRating(existing.responseRating || 4);
        setStrengths(existing.strengths || []);
        setImprovements(existing.areasOfImprovement || []);
        setCapaItems(existing.capaItems || []);
        setEvidenceItems(existing.evidenceItems || []);
        if (existing.casualtyAssessment) setCasualtyAssessment(existing.casualtyAssessment);
        if (existing.containmentAssessment) setContainmentAssessment(existing.containmentAssessment);
        if (existing.arrivalAssessment) setArrivalAssessment(existing.arrivalAssessment);
      } else {
        // Pre-fill with strictly grounded draft (no fabricated facts)
        const draft = pirService.generateDraftPirSummary(emergency);
        setSummary(draft.summary);
        setRootCauses(draft.rootCauses);
        setRootCauseStatus('preliminary_hypothesis');
        setRating(4);
        setStrengths(draft.strengths);
        setImprovements(draft.improvements);
        setCapaItems([]);
        setEvidenceItems(draft.evidenceItems);
        setCasualtyAssessment(draft.casualtyAssessment);
        setContainmentAssessment(draft.containmentAssessment);
        setArrivalAssessment(draft.arrivalAssessment);
      }
      setLoading(false);
    });
  }, [isOpen, emergency.id]);

  if (!isOpen) return null;

  const handleGenerateAiDraft = () => {
    const draft = pirService.generateDraftPirSummary(emergency);
    setSummary(draft.summary);
    setRootCauses(draft.rootCauses);
    setRootCauseStatus('preliminary_hypothesis');
    setStrengths(draft.strengths);
    setImprovements(draft.improvements);
    setEvidenceItems(draft.evidenceItems);
    setCasualtyAssessment(draft.casualtyAssessment);
    setContainmentAssessment(draft.containmentAssessment);
    setArrivalAssessment(draft.arrivalAssessment);
  };

  const handleScanLegacyReports = async () => {
    setIsScanningLegacy(true);
    const findings = await pirService.scanLegacyPirReports();
    setLegacyFindings(findings);
    setIsScanningLegacy(false);
  };

  const handleSavePir = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    const reviewData: PostIncidentReview = {
      id: pir?.id || `pir_${emergency.id}`,
      emergencyId: emergency.id,
      executiveSummary: summary,
      rootCauseAnalysis: rootCauses,
      rootCauseStatus,
      responseRating: rating,
      strengths,
      areasOfImprovement: improvements,
      capaItems,
      evidenceItems,
      casualtyAssessment: casualtyAssessment as any,
      containmentAssessment: containmentAssessment as any,
      arrivalAssessment: arrivalAssessment as any,
      conductedBy: currentUser.id,
      conductedByName: currentUser.name,
      conductedAt: pir?.conductedAt || Date.now(),
      status: pir?.status || 'draft',
      approvedBy: pir?.approvedBy,
      approvedByName: pir?.approvedByName,
      approvedAt: pir?.approvedAt,
      version: pir?.version || 1,
      history: pir?.history || [],
    };

    const ok = await pirService.savePostIncidentReview(reviewData, currentUser, 'تحديث مسودة التقرير وحفظ الأدلة الموثقة');
    if (ok) {
      setPir(reviewData);
    }
    setIsSaving(false);
  };

  const handleApprovePir = async () => {
    if (!currentUser || !isAdmin) return;
    setIsSaving(true);
    await handleSavePir();
    const ok = await pirService.approvePostIncidentReview(emergency.id, currentUser, true);
    if (ok) {
      setRootCauseStatus('expert_confirmed');
      setPir((prev) => prev ? {
        ...prev,
        status: 'approved',
        rootCauseStatus: 'expert_confirmed',
        approvedBy: currentUser.id,
        approvedByName: currentUser.name,
        approvedAt: Date.now(),
      } : null);
    }
    setIsSaving(false);
  };

  const handleCreateCapa = async () => {
    if (!newCapaTitle.trim() || !newCapaAssignee.trim() || !currentUser) return;
    const newItem: CAPAItem = {
      id: `capa_${Date.now()}`,
      title: newCapaTitle.trim(),
      assignedToName: newCapaAssignee.trim(),
      department: newCapaDept.trim() || 'إدارة السلامة والصحة المهنية',
      dueDate: newCapaDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      proofUrl: newCapaProof.trim() || undefined,
    };

    const nextList = [...capaItems, newItem];
    setCapaItems(nextList);
    setIsAddingCapa(false);
    setNewCapaTitle('');
    setNewCapaAssignee('');
    setNewCapaDept('');
    setNewCapaDueDate('');
    setNewCapaProof('');

    // Save with evidence linking
    await pirService.savePostIncidentReview({
      id: pir?.id || `pir_${emergency.id}`,
      emergencyId: emergency.id,
      executiveSummary: summary,
      rootCauseAnalysis: rootCauses,
      rootCauseStatus,
      responseRating: rating,
      strengths,
      areasOfImprovement: improvements,
      capaItems: nextList,
      evidenceItems,
      casualtyAssessment: casualtyAssessment as any,
      containmentAssessment: containmentAssessment as any,
      arrivalAssessment: arrivalAssessment as any,
      conductedBy: currentUser.id,
      conductedByName: currentUser.name,
      conductedAt: Date.now(),
      status: pir?.status || 'draft',
    }, currentUser, 'إضافة إجراء تصحيحي وقائي جديد (CAPA)');
  };

  const handleUpdateCapaStatus = async (capaId: string, nextStatus: CAPAItem['status']) => {
    const updated = capaItems.map((item) => {
      if (item.id === capaId) {
        return {
          ...item,
          status: nextStatus,
          verifiedBy: nextStatus === 'verified' ? currentUser?.name : item.verifiedBy,
          verifiedAt: nextStatus === 'verified' ? Date.now() : item.verifiedAt,
        };
      }
      return item;
    });
    setCapaItems(updated);
    if (currentUser) {
      await pirService.updateCapaStatus(emergency.id, capaId, nextStatus, undefined, currentUser);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const createdDate = emergency.createdAt ? new Date(emergency.createdAt).toLocaleString('ar-EG') : '—';
  const closedDate = emergency.closedAt ? new Date(emergency.closedAt).toLocaleString('ar-EG') : 'قيد المتابعة';
  const totalMins = emergency.closedAt && emergency.createdAt 
    ? Math.max(1, Math.round((emergency.closedAt - emergency.createdAt) / 60000))
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none"
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <FileText size={26} className="text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">
                  مراجعة ما بعد الحادث (Post-Incident Review - PIR)
                </h2>
                {pir?.status === 'approved' ? (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} /> معتمد رسمياً
                  </span>
                ) : (
                  <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    مسودة تقييم — قيد التدقيق
                  </span>
                )}
                {rootCauseStatus === 'expert_confirmed' ? (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BadgeCheck size={12} /> سبب جذري معتمد
                  </span>
                ) : (
                  <span className="bg-orange-500/80 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={12} /> فرضية أولية
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                توثيق مسند بالأدلة فقط دون افتراضات مسبقة — رقم البلاغ #{emergency.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
              title="طباعة التقرير المعتمد"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 shrink-0 print:hidden overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'overview', label: 'التسلسل والملخص', icon: <Clock size={14} /> },
              { id: 'evidence', label: `الأدلة والوقائع (${evidenceItems.length})`, icon: <BadgeCheck size={14} /> },
              { id: 'rca', label: 'الأسباب الجذرية (RCA)', icon: <AlertCircle size={14} /> },
              { id: 'capa', label: `خطة التصحيح CAPA (${capaItems.length})`, icon: <CheckCircle2 size={14} /> },
              { id: 'history', label: `سجل التعديلات (${pir?.history?.length || 0})`, icon: <History size={14} /> },
              { id: 'legacyAudit', label: 'تدقيق التقارير السابقة', icon: <FileWarning size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAiDraft}
              className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap"
              title="توليد مسودة موثقة بالأدلة المتاحة فقط"
            >
              <Sparkles size={14} />
              <span>توليد مسودة مسندة</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Incident Evidence Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
            <div>
              <span className="text-gray-400 font-bold block text-[10px]">نوع الحادثة</span>
              <span className="font-black dark:text-white">{emergency.typeName}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block text-[10px]">الموقع</span>
              <span className="font-black dark:text-white">{emergency.locationName}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block text-[10px]">توقيت البلاغ</span>
              <span className="font-black dark:text-white">{createdDate}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block text-[10px]">مدة الاستجابة والإغلاق</span>
              <span className="font-black text-primary">
                {totalMins ? `${totalMins} دقيقة` : 'قيد المتابعة'}
              </span>
            </div>
          </div>

          {/* Three Key Safety Assessments (Grounded vs Not Documented) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Arrival */}
            <div className={`p-3.5 rounded-2xl border ${
              arrivalAssessment.status === 'documented' 
                ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' 
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-gray-700 dark:text-gray-200">أول وصول ميداني</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                  arrivalAssessment.status === 'documented' ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {arrivalAssessment.status === 'documented' ? 'موثق زمنياً' : 'غير موثق'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-bold text-[11px]">{arrivalAssessment.details}</p>
            </div>

            {/* Containment */}
            <div className={`p-3.5 rounded-2xl border ${
              containmentAssessment.status === 'documented_contained'
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : containmentAssessment.status === 'conflicting'
                ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-gray-700 dark:text-gray-200">السيطرة وعزل الخطر</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                  containmentAssessment.status === 'documented_contained' ? 'bg-emerald-200 text-emerald-900' :
                  containmentAssessment.status === 'conflicting' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {containmentAssessment.status === 'documented_contained' ? 'موثق رسمياً' :
                   containmentAssessment.status === 'conflicting' ? 'توجد معلومات متعارضة تحتاج مراجعة' : 'غير موثق'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-bold text-[11px]">{containmentAssessment.details}</p>
            </div>

            {/* Casualties */}
            <div className={`p-3.5 rounded-2xl border ${
              casualtyAssessment.status === 'documented_zero'
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : casualtyAssessment.status === 'documented_casualties'
                ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-gray-700 dark:text-gray-200">الخسائر والإصابات</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                  casualtyAssessment.status === 'documented_zero' ? 'bg-emerald-200 text-emerald-900' :
                  casualtyAssessment.status === 'documented_casualties' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {casualtyAssessment.status === 'documented_zero' ? 'موثق: صفر إصابات' :
                   casualtyAssessment.status === 'documented_casualties' ? 'موثق: رُصدت إصابات' : 'غير موثق'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-bold text-[11px]">{casualtyAssessment.details}</p>
            </div>
          </div>

          {/* TAB 1: Overview & Executive Summary */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Star Rating for Response */}
              <div>
                <label className="text-xs font-black dark:text-white mb-2 block">
                  تقييم سرعة وكفاءة الاستجابة العملياتية (1 إلى 5 نجوم)
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl border transition-all ${
                        star <= rating 
                          ? 'bg-amber-50 border-amber-300 text-amber-500 scale-105' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300'
                      }`}
                    >
                      <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <span className="text-xs font-black text-amber-600 mr-2 rtl:ml-2">
                    {rating === 5 ? 'ممتاز جداً (نموذجي)' : rating === 4 ? 'جيد جداً' : rating === 3 ? 'مقبول' : 'يحتاج تحسين'}
                  </span>
                </div>
              </div>

              {/* Executive Summary Input */}
              <div>
                <label className="text-xs font-black dark:text-white mb-2 block">
                  الملخص التنفيذي للمراجعة والتدخل الميداني (مبني فقط على الوقائع المثبتة)
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                  placeholder="وصف تفصيلي لكيفية اكتشاف الحالة، خطوات الاستجابة، وتأمين الموقع وفق السجلات..."
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold leading-relaxed focus:ring-2 focus:ring-primary outline-hidden"
                />
              </div>

              {/* Strengths & Improvement Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> نقاط القوة الموثقة في الاستجابة
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 font-bold list-disc list-inside">
                    {strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                  <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={16} /> مجالات التحسين واستكمال التوثيق
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 font-bold list-disc list-inside">
                    {improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Grounded Evidence Items */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black dark:text-white">
                    سجل الوقائع والأدلة المعتمدة للحادث
                  </h4>
                  <p className="text-xs text-gray-500">
                    تصنيف دقيق ومسند يفرّق بين الحقائق المسجلة، إفادات الأفراد، الفرضيات، والتوصيات.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {evidenceItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    لا توجد أدلة مسجلة حالياً. اضغط على "توليد مسودة مسندة" لاستخراج الأدلة من سجلات البلاغ.
                  </div>
                ) : (
                  evidenceItems.map((item) => {
                    const badgeConfig = {
                      RECORDED_FACT: { label: 'حقيقة مسجلة', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
                      USER_STATEMENT: { label: 'إفادة مستخدم', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
                      HYPOTHESIS_PENDING_VERIFICATION: { label: 'استنتاج يحتاج تحققاً', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
                      RECOMMENDATION: { label: 'توصية', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                    }[item.type];

                    return (
                      <div key={item.id} className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeConfig.bg}`}>
                              {badgeConfig.label}
                            </span>
                            {item.isConflicting && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                توجد معلومات متعارضة تحتاج مراجعة
                              </span>
                            )}
                            <span className="text-gray-400 text-[10px] font-mono">
                              معرف المصدر: {item.sourceId || 'سجل النظام'}
                            </span>
                          </div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">{item.text}</p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500">
                            {item.recordedByName && <span>الموثق: {item.recordedByName}</span>}
                            {item.timestamp && <span>التوقيت: {new Date(item.timestamp).toLocaleTimeString('ar-EG')}</span>}
                            {item.conflictNotes && <span className="text-rose-600 font-bold">{item.conflictNotes}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Root Cause Analysis (RCA) */}
          {activeTab === 'rca' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border bg-orange-50/70 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-orange-900 dark:text-orange-200 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    حالة السبب الجذري: {rootCauseStatus === 'expert_confirmed' ? 'معتمد رسمياً من المختص' : 'فرضية أولية قيد التحقق والاعتماد'}
                  </h4>
                  <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-0.5 font-bold">
                    لا يجوز اعتبار الأسباب الجذرية نهائية حتى يتم فحصها ميدانياً وتوقيعها من مدير السلامة أو المشرف المخول.
                  </p>
                </div>
                {isAdmin && rootCauseStatus !== 'expert_confirmed' && (
                  <button
                    onClick={() => setRootCauseStatus('expert_confirmed')}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black hover:bg-emerald-700 whitespace-nowrap"
                  >
                    اعتماد السبب كـ مثبت
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-sm font-black dark:text-white mb-1">
                  تحليل الأسباب الجذرية (Root Cause Analysis - 5 Whys)
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  تحديد الأسباب الفنية والبشرية والتنظيمية التي أدت لوقوع الحادث لتفادي تكراره مستقبلاً.
                </p>
                <textarea
                  value={rootCauses}
                  onChange={(e) => setRootCauses(e.target.value)}
                  rows={8}
                  placeholder="1. لماذا حدث العطل أو الخطر؟ ...&#10;2. لماذا لم يتم اكتشافه استباقياً؟ ...&#10;3. ما العامل الفني أو البيئي الحاسم؟ ..."
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold leading-relaxed focus:ring-2 focus:ring-primary outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CAPA Corrective & Preventive Actions */}
          {activeTab === 'capa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black dark:text-white">
                    مصفوفة الإجراءات التصحيحية والوقائية (CAPA)
                  </h4>
                  <p className="text-xs text-gray-500">
                    تكليفات محددة بمسؤول وتاريخ استحقاق لضمان إغلاق الثغرات الفنية.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingCapa(true)}
                  className="flex items-center gap-1.5 bg-primary text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <Plus size={14} />
                  <span>إضافة إجراء تصحيحي</span>
                </button>
              </div>

              {/* Form to add CAPA item */}
              {isAddingCapa && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <h5 className="text-xs font-black dark:text-white">تفاصيل الإجراء التصحيحي الجديد</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="عنوان الإجراء (مثال: فحص واستبدال صمام الإطفاء)"
                      value={newCapaTitle}
                      onChange={(e) => setNewCapaTitle(e.target.value)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs font-bold dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="المسؤول عن التنفيذ (الاسم أو المنصب)"
                      value={newCapaAssignee}
                      onChange={(e) => setNewCapaAssignee(e.target.value)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs font-bold dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="القسم / الإدارة"
                      value={newCapaDept}
                      onChange={(e) => setNewCapaDept(e.target.value)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs font-bold dark:text-white"
                    />
                    <input
                      type="date"
                      value={newCapaDueDate}
                      onChange={(e) => setNewCapaDueDate(e.target.value)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs font-bold dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsAddingCapa(false)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleCreateCapa}
                      className="px-4 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    >
                      اعتماد المهمة
                    </button>
                  </div>
                </div>
              )}

              {/* CAPA Items Table / List */}
              <div className="space-y-2.5">
                {capaItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    لا توجد إجراءات تصحيحية مضافة حتى الآن. انقر على "إضافة إجراء تصحيحي" للبدء.
                  </div>
                ) : (
                  capaItems.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <h5 className="text-xs font-black dark:text-white">{item.title}</h5>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold">
                            <UserCheck size={12} /> {item.assignedToName} ({item.department || 'السلامة'})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> استحقاق: {item.dueDate}
                          </span>
                          {item.verifiedBy && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">
                              تم التحقق بواسطة: {item.verifiedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateCapaStatus(item.id, e.target.value as any)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-transparent cursor-pointer ${
                            item.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : item.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                              : item.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="in_progress">قيد التنفيذ</option>
                          <option value="completed">مكتمل</option>
                          <option value="verified">تم التحقق رسمياً</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Revision History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black dark:text-white">سجل تعديلات وإصدارات التقرير</h4>
                <p className="text-xs text-gray-500">
                  حفظ النسخ السابقة عند كل تعديل واعتماد دون محو التاريخ العملياتي.
                </p>
              </div>

              <div className="space-y-2">
                {(!pir?.history || pir.history.length === 0) ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    الإصدار الحالي (v{pir?.version || 1}) هو أول إصدار مسجل لهذا التقرير.
                  </div>
                ) : (
                  pir.history.map((h, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary">إصدار v{h.version}</span>
                        <span className="text-gray-400 text-[10px]">{new Date(h.savedAt).toLocaleString('ar-EG')}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400">
                        حرره: <span className="font-bold">{h.savedByName}</span> — {h.changeSummary || 'تعديل مسودة'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Legacy Audit Checklist */}
          {activeTab === 'legacyAudit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black dark:text-white">تدقيق وفحص التقارير السابقة (Legacy Audit)</h4>
                  <p className="text-xs text-gray-500">
                    رصد التقارير السابقة التي قد تحتوي على عبارات تلقائية مفترضة دون مسحها أو تعديلها آلياً.
                  </p>
                </div>
                <button
                  onClick={handleScanLegacyReports}
                  disabled={isScanningLegacy}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-colors"
                >
                  <Search size={14} />
                  <span>{isScanningLegacy ? 'جاري الفحص...' : 'بدء فحص السجلات'}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {legacyFindings.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    اضغط على "بدء فحص السجلات" للتحقق من التقارير المخزنة في قاعدة البيانات.
                  </div>
                ) : (
                  legacyFindings.map((finding) => (
                    <div key={finding.pirId} className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-900 dark:text-amber-200">
                          تقرير حادثة: #{finding.emergencyId} (الحالة: {finding.status})
                        </span>
                        <span className="text-gray-400 text-[10px] font-mono">
                          الموثق: {finding.conductedByName}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {finding.reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                            <AlertCircle size={12} className="shrink-0 text-amber-600" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium pt-1 border-t border-amber-200/50">
                        ملاحظة: هذا التقرير محفوظ كمرجع تاريخي؛ يُنصح بمراجعته وتحديثه يدوياً بواسطة المشرف المخول.
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Supervisor Approval Block */}
          {pir?.approvedBy && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} className="text-emerald-600" />
                <div>
                  <h5 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    تم اعتماد المراجعة والسبب الجذري رسمياً
                  </h5>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    المشرف: {pir.approvedByName} — التاريخ: {pir.approvedAt ? new Date(pir.approvedAt).toLocaleString('ar-EG') : 'معتمد'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-gray-400 font-bold">
            {pir?.conductedByName ? `حرره: ${pir.conductedByName}` : ''}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              إغلاق
            </button>

            <button
              onClick={handleSavePir}
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all"
            >
              <Save size={14} />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ كمسودة'}</span>
            </button>

            {isAdmin && pir?.status !== 'approved' && (
              <button
                onClick={handleApprovePir}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all"
              >
                <ShieldCheck size={14} />
                <span>اعتماد رسمي نهائي</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

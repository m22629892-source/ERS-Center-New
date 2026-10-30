import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Plus, CheckCircle2, AlertTriangle, ShieldCheck, 
  Clock, Users, Trash2, Edit3, MoveUp, MoveDown, FileText, 
  Layers, Lock, Sparkles, Check, X, Info, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal, ConfirmModal } from '../../components/Modal';
import { useApp } from '../../context/AppContext';
import { 
  ChecklistTemplate, ChecklistTemplateTask, EmergencyType, 
  JobTitle, UserRole 
} from '../../types';
import { checklistService } from '../../services/checklistService';
import { 
  getChecklistTaskTitle, 
  getChecklistTaskDescription, 
  getChecklistTitle, 
  getChecklistDescription 
} from '../../services/checklistLocalization';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export const EmergencyChecklistsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useApp();

  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [emergencyTypes, setEmergencyTypes] = useState<EmergencyType[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ChecklistTemplate> | null>(null);
  const [editingTasks, setEditingTasks] = useState<ChecklistTemplateTask[]>([]);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);

  // Delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Dry Run Quality Audit State
  const [isDryRunModalOpen, setIsDryRunModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [dryRunResults, setDryRunResults] = useState<{
    inspected: number;
    flagged: Array<{ 
      id: string; 
      titleAr: string; 
      category: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    archivedCount: number;
    isDryRun: boolean;
  } | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    loadChecklists();

    const unsubTypes = onSnapshot(collection(db, 'emergency_types'), (snap) => {
      setEmergencyTypes(snap.docs.map(d => ({ id: d.id, ...d.data() } as EmergencyType)));
    });

    const unsubJobs = onSnapshot(collection(db, 'job_titles'), (snap) => {
      setJobTitles(snap.docs.map(d => ({ id: d.id, ...d.data() } as JobTitle)));
    });

    return () => {
      unsubTypes();
      unsubJobs();
    };
  }, []);

  const loadChecklists = async () => {
    setLoading(true);
    try {
      const data = await checklistService.getAllChecklists();
      setChecklists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (presetTypeId?: string) => {
    const matchedType = emergencyTypes.find(t => t.id === presetTypeId);
    setEditingTemplate({
      checklistId: '',
      emergencyTypeId: presetTypeId || (emergencyTypes[0]?.id || ''),
      emergencyTypeName: matchedType?.type_name || emergencyTypes[0]?.type_name || '',
      titleAr: presetTypeId ? t('default_checklist_title', { typeName: matchedType?.type_name }) : '',
      titleEn: presetTypeId ? `Checklist for ${matchedType?.type_name}` : '',
      description: t('default_checklist_desc'),
      version: 1,
      status: 'draft',
      createdAt: Date.now()
    });
    setEditingTasks([
      {
        taskId: `task_1_${Date.now().toString(36)}`,
        titleAr: t('default_task_hazard_assessment'),
        titleEn: 'Initial hazard assessment and safe egress verification',
        description: t('default_task_hazard_desc'),
        order: 1,
        requiredRoleIds: ['responder'],
        isMandatory: true,
        targetDurationSeconds: 120,
        requiresSupervisorApproval: false,
        canBeSkipped: false,
        isActive: true
      }
    ]);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (template: ChecklistTemplate) => {
    setEditingTemplate({ ...template });
    setEditingTasks(template.tasks && template.tasks.length > 0 ? [...template.tasks] : []);
    setIsEditModalOpen(true);
  };

  const handleAddTask = () => {
    const newTask: ChecklistTemplateTask = {
      taskId: `task_${editingTasks.length + 1}_${Date.now().toString(36)}`,
      titleAr: '',
      titleEn: '',
      description: '',
      order: editingTasks.length + 1,
      requiredRoleIds: ['responder'],
      isMandatory: true,
      targetDurationSeconds: 300,
      requiresSupervisorApproval: false,
      canBeSkipped: true,
      isActive: true
    };
    setEditingTasks([...editingTasks, newTask]);
    setActiveTaskIndex(editingTasks.length);
  };

  const handleUpdateTask = (index: number, updates: Partial<ChecklistTemplateTask>) => {
    const updated = [...editingTasks];
    updated[index] = { ...updated[index], ...updates };
    setEditingTasks(updated);
  };

  const handleRemoveTask = (index: number) => {
    const updated = editingTasks.filter((_, i) => i !== index).map((t, idx) => ({ ...t, order: idx + 1 }));
    setEditingTasks(updated);
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editingTasks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...editingTasks];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const final = reordered.map((t, idx) => ({ ...t, order: idx + 1 }));
    setEditingTasks(final);
  };

  const handleSaveChecklist = async () => {
    if (!editingTemplate || !editingTemplate.titleAr || !editingTemplate.emergencyTypeId) {
      setActionMessage({ type: 'error', text: t('checklist_validation_error') });
      return;
    }

    if (editingTasks.length === 0) {
      setActionMessage({ type: 'error', text: t('checklist_tasks_required_error') });
      return;
    }

    try {
      const selectedType = emergencyTypes.find(t => t.id === editingTemplate.emergencyTypeId);
      await checklistService.saveChecklist({
        ...editingTemplate,
        emergencyTypeName: selectedType?.type_name || editingTemplate.emergencyTypeName || ''
      }, editingTasks, user || undefined);

      setActionMessage({ type: 'success', text: t('checklist_saved_success') });
      setIsEditModalOpen(false);
      loadChecklists();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || t('checklist_save_failed') });
    }
  };

  const handleApproveTemplate = async (templateId: string) => {
    if (!user) return;
    try {
      await checklistService.approveChecklistVersion(templateId, user, true);
      setActionMessage({ type: 'success', text: t('checklist_version_approved') });
      loadChecklists();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || t('checklist_approval_failed') });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTargetId || !user) return;
    try {
      await checklistService.deleteChecklist(deleteTargetId, user);
      setActionMessage({ type: 'success', text: t('checklist_deleted_success') });
      setDeleteTargetId(null);
      loadChecklists();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || t('checklist_delete_failed') });
    }
  };

  const handleSeedStandardSOPs = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      const created = await checklistService.seedDefaultSafetyChecklists(emergencyTypes, user);
      setActionMessage({
        type: 'success',
        text: t('checklists_imported_count', { count: created })
      });
      loadChecklists();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || t('generate_checklists_failed') });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRunDryRunAudit = async () => {
    setIsAuditing(true);
    setIsDryRunModalOpen(true);
    try {
      const res = await checklistService.auditAndCleanTemplates(true);
      setDryRunResults(res as any);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'فشل تشغيل فحص القوائم: ' + e.message });
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredChecklists = checklists.filter(c => {
    const matchType = selectedTypeFilter === 'all' || c.emergencyTypeId === selectedTypeFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchType && matchStatus;
  });

  return (
    <div className="space-y-6 pb-20 px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShieldCheck size={20} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {t('approved_safety_sops')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white tracking-tight">
            {t('emergency_checklists')}
          </h1>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {t('emergency_checklists_desc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')} 
            className="rounded-2xl text-xs font-bold"
          >
            <ArrowLeft size={16} /> {t('back')}
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={handleRunDryRunAudit}
                disabled={isAuditing}
                className="rounded-2xl text-xs font-black border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                title="فحص جودة القوائم والمهام بدون تعديل البيانات"
              >
                {isAuditing ? <RefreshCw className="animate-spin" size={14} /> : <Eye size={14} />}
                <span>فحص الجودة (Dry Run)</span>
              </Button>

              <Button 
                variant="outline"
                onClick={handleSeedStandardSOPs}
                disabled={isSeeding}
                className="rounded-2xl text-xs font-black border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                title={t('seed_approved_protocols')}
              >
                {isSeeding ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                {t('seed_approved_protocols')}
              </Button>

              <Button 
                onClick={() => handleOpenCreateModal()} 
                className="rounded-2xl text-xs font-black bg-primary text-white shadow-md"
              >
                <Plus size={16} /> {t('create_new_checklist')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Action Notification Message */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-black shadow-sm ${
              actionMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-300' 
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-70">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">{t('total_checklists')}</div>
            <div className="text-xl font-black dark:text-white">{checklists.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">{t('approved_checklists')}</div>
            <div className="text-xl font-black text-green-600">
              {checklists.filter(c => c.status === 'approved').length}
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="w-full sm:w-1/2">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">{t('filter_by_emergency_type')}</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
            >
              <option value="all">{t('all_emergency_types')} ({emergencyTypes.length})</option>
              {emergencyTypes.map(t => (
                <option key={t.id} value={t.id}>{t.type_name}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-1/2">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">{t('status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
            >
              <option value="all">{t('all')}</option>
              <option value="approved">{t('approved_only')}</option>
              <option value="draft">{t('drafts')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checklists Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <RefreshCw className="animate-spin mx-auto mb-2 text-primary" size={28} />
          <p className="text-xs font-bold">{t('loading_checklists')}</p>
        </div>
      ) : filteredChecklists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-4">
          <ShieldCheck className="mx-auto text-gray-300 dark:text-gray-600" size={54} />
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-black dark:text-white">{t('no_matching_checklists')}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {t('emergency_checklists_desc')}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={handleSeedStandardSOPs} className="rounded-xl text-xs font-black">
              {t('seed_safety_protocols_now')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredChecklists.map((checklist) => {
            const isApproved = checklist.status === 'approved';
            const matchedType = emergencyTypes.find(t => t.id === checklist.emergencyTypeId);

            return (
              <motion.div
                key={checklist.checklistId}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-full text-[10px] font-black text-white"
                        style={{ backgroundColor: matchedType?.alert_color || '#1976d2' }}
                      >
                        {checklist.emergencyTypeName || matchedType?.type_name || t('general_emergency')}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                        v{checklist.version || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-100 dark:bg-green-950/40 dark:text-green-300 px-2.5 py-1 rounded-full border border-green-200">
                          <CheckCircle2 size={12} /> {t('officially_approved')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock size={12} /> {t('draft_in_review')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black dark:text-white leading-snug">
                      {getChecklistTitle(checklist, i18n.language)}
                    </h3>
                    {checklist.titleEn && i18n.language !== 'en' && (
                      <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                        {checklist.titleEn}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {getChecklistDescription(checklist, i18n.language)}
                    </p>
                  </div>

                  {checklist.approvedByName && (
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                      <ShieldCheck size={12} className="text-green-600" />
                      <span>{t('supervisor_approval')} {checklist.approvedByName}</span>
                      {checklist.approvedAt && (
                        <span>({new Date(checklist.approvedAt).toLocaleDateString()})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tasks Preview */}
                <div className="p-5 flex-1 bg-gray-50/50 dark:bg-gray-900/30 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    <span>{t('tactical_steps_list')} ({checklist.tasks?.length || 0})</span>
                    <span>{t('estimated_duration')}</span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {checklist.tasks && checklist.tasks.length > 0 ? (
                      checklist.tasks.map((task, idx) => (
                        <div 
                          key={task.taskId || idx}
                          className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/80 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-black text-[10px] flex items-center justify-center shrink-0">
                              {task.order || idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-black dark:text-white truncate block">
                                {getChecklistTaskTitle(task, i18n.language)}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-400">
                                {task.isMandatory && (
                                  <span className="text-red-500 font-bold">{t('mandatory')}</span>
                                )}
                                {task.requiresSupervisorApproval && (
                                  <span className="text-blue-500 font-bold">{t('supervisor_approval_required')}</span>
                                )}
                                {task.canBeSkipped && (
                                  <span className="text-gray-400">{t('justified_override')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-[10px] font-black text-gray-500 shrink-0 mr-2">
                            {task.targetDurationSeconds ? `${Math.round(task.targetDurationSeconds / 60)} ${t('minutes')}` : '—'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-400 italic">
                        {t('no_tasks_entered')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenEditModal(checklist)}
                      className="rounded-xl text-xs font-black py-2 px-3"
                    >
                      <Edit3 size={14} /> {t('edit')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteTargetId(checklist.checklistId)}
                      className="rounded-xl text-xs font-black py-2 px-3 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div>
                    {!isApproved ? (
                      <Button
                        onClick={() => handleApproveTemplate(checklist.checklistId)}
                        className="rounded-xl text-xs font-black py-2 px-3 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ShieldCheck size={14} /> {t('official_approval')}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleApproveTemplate(checklist.checklistId)}
                        className="rounded-xl text-xs font-bold py-2 px-3 border-green-600 text-green-700 hover:bg-green-50"
                        title={t('upgrade_and_approve')}
                      >
                        {t('upgrade_and_approve')} v{(checklist.version || 1) + 1}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor Modal for Checklist Template & Tasks */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={editingTemplate?.checklistId ? t('edit_checklist_title', { title: getChecklistTitle(editingTemplate, i18n.language) }) : t('create_new_checklist_title')}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* General Template Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black dark:text-white block mb-1">{t('linked_emergency_type')}</label>
              <select
                value={editingTemplate?.emergencyTypeId || ''}
                onChange={(e) => {
                  const sel = emergencyTypes.find(t => t.id === e.target.value);
                  setEditingTemplate(prev => prev ? { 
                    ...prev, 
                    emergencyTypeId: e.target.value,
                    emergencyTypeName: sel?.type_name || ''
                  } : null);
                }}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
              >
                {emergencyTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.type_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black dark:text-white block mb-1">{t('regulatory_status')}</label>
              <select
                value={editingTemplate?.status || 'draft'}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
              >
                <option value="draft">{t('draft_in_review')}</option>
                <option value="approved">{t('officially_approved')}</option>
                <option value="archived">{t('archived_status')}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black dark:text-white block mb-1">{t('checklist_title_ar')}</label>
              <input
                type="text"
                value={editingTemplate?.titleAr || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, titleAr: e.target.value } : null)}
                placeholder={t('title_ar_placeholder')}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black dark:text-white block mb-1">{t('checklist_title_en')}</label>
              <input
                type="text"
                value={editingTemplate?.titleEn || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, titleEn: e.target.value } : null)}
                placeholder="e.g. Fire Evacuation & Response Protocol"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-black dark:text-white block mb-1">{t('checklist_title_ku')}</label>
              <input
                type="text"
                value={editingTemplate?.titleKu || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, titleKu: e.target.value } : null)}
                placeholder="پلانی وەڵامدانەوە و لیستی پێداچوونەوە"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-black dark:text-white block mb-1">{t('checklist_title_ur')}</label>
              <input
                type="text"
                value={editingTemplate?.titleUr || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, titleUr: e.target.value } : null)}
                placeholder="ہنگامی ردعمل پلان اور چیک لسٹ"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-black dark:text-white block mb-1">{t('description_label')}</label>
              <textarea
                value={editingTemplate?.description || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={2}
                placeholder={t('step_details_placeholder')}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none resize-none"
              />
            </div>
          </div>

          {/* Tasks Builder Header */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black dark:text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  {t('tasks_management_header')} ({editingTasks.length})
                </h4>
                <p className="text-[10px] text-gray-400 font-bold">
                  {t('step_details_placeholder')}
                </p>
              </div>

              <Button
                onClick={handleAddTask}
                className="rounded-xl text-xs font-black py-2 px-3 bg-primary text-white"
              >
                <Plus size={14} /> {t('add_task_step')}
              </Button>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {editingTasks.map((task, index) => (
                <div 
                  key={task.taskId || index}
                  className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-black dark:text-white">
                        {getChecklistTaskTitle(task, i18n.language) || `${t('task_number')} ${index + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveTask(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                        title={t('move_up')}
                      >
                        <MoveUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveTask(index, 'down')}
                        disabled={index === editingTasks.length - 1}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                        title={t('move_down')}
                      >
                        <MoveDown size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveTask(index)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30"
                        title={t('delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('task_title_ar')}</label>
                      <input
                        type="text"
                        value={task.titleAr}
                        onChange={(e) => handleUpdateTask(index, { titleAr: e.target.value })}
                        placeholder={t('task_title_ar')}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('task_title_en')}</label>
                      <input
                        type="text"
                        value={task.titleEn}
                        onChange={(e) => handleUpdateTask(index, { titleEn: e.target.value })}
                        placeholder={t('task_title_en')}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('task_title_ku')}</label>
                      <input
                        type="text"
                        value={task.titleKu || ''}
                        onChange={(e) => handleUpdateTask(index, { titleKu: e.target.value })}
                        placeholder={t('task_title_ku')}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('task_title_ur')}</label>
                      <input
                        type="text"
                        value={task.titleUr || ''}
                        onChange={(e) => handleUpdateTask(index, { titleUr: e.target.value })}
                        placeholder={t('task_title_ur')}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('description')}</label>
                      <input
                        type="text"
                        value={task.description || ''}
                        onChange={(e) => handleUpdateTask(index, { description: e.target.value })}
                        placeholder={t('step_details_placeholder')}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('target_duration_minutes')}</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={task.targetDurationSeconds ? Math.round(task.targetDurationSeconds / 60) : 5}
                        onChange={(e) => handleUpdateTask(index, { targetDurationSeconds: Number(e.target.value) * 60 })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 block mb-1">{t('responsible_role')}</label>
                      <select
                        value={task.requiredRoleIds?.[0] || 'responder'}
                        onChange={(e) => handleUpdateTask(index, { requiredRoleIds: [e.target.value] })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
                      >
                        <option value="responder">{t('responder_role')}</option>
                        <option value="admin">{t('admin_role')}</option>
                        <option value="super-admin">{t('super_admin_role')}</option>
                        {jobTitles.map(j => (
                          <option key={j.id} value={j.job_name}>{j.job_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Checkbox Options */}
                    <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold dark:text-white">
                        <input
                          type="checkbox"
                          checked={task.isMandatory}
                          onChange={(e) => handleUpdateTask(index, { isMandatory: e.target.checked })}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <span>{t('mandatory_task_option')}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold dark:text-white">
                        <input
                          type="checkbox"
                          checked={task.requiresSupervisorApproval}
                          onChange={(e) => handleUpdateTask(index, { requiresSupervisorApproval: e.target.checked })}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <span>{t('requires_supervisor_approval_option')}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold dark:text-white">
                        <input
                          type="checkbox"
                          checked={task.canBeSkipped}
                          onChange={(e) => handleUpdateTask(index, { canBeSkipped: e.target.checked })}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <span>{t('can_be_skipped_option')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSaveChecklist}
              className="rounded-xl text-xs font-black bg-primary text-white px-6"
            >
              {t('save_changes')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteTemplate}
        title={t('delete_checklist_title')}
        message={t('delete_checklist_msg')}
      />

      {/* Dry Run Quality Audit Modal */}
      <Modal
        isOpen={isDryRunModalOpen}
        onClose={() => setIsDryRunModalOpen(false)}
        title="فحص جودة القوائم والمهام التشغيلية (Dry Run — بدون تعديل)"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1 text-right" dir="rtl">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 font-bold space-y-1">
            <div className="flex items-center gap-2 font-black text-sm text-blue-800 dark:text-blue-300">
              <ShieldCheck size={18} />
              <span>نتائج الفحص والتدقيق الآلي (Dry Run Mode)</span>
            </div>
            <p>
              يقوم هذا الفحص باكتشاف القوائم التجريبية (مثل tt أو test)، والقوائم المعتمدة الخالية من المهام، والخطوات الناقصة بدون المساس بقاعدة البيانات أو حذف أي مستندات.
            </p>
          </div>

          {isAuditing ? (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="animate-spin mx-auto text-primary" size={32} />
              <p className="text-xs font-bold">جاري تدقيق القوائم ومطابقة الخطوات...</p>
            </div>
          ) : dryRunResults ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="text-gray-400 font-bold text-[10px]">القوائم المفحوصة</div>
                  <div className="text-lg font-black dark:text-white mt-0.5">{dryRunResults.inspected}</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 text-amber-800 dark:text-amber-300">
                  <div className="font-bold text-[10px]">ملاحظات تم رصدها</div>
                  <div className="text-lg font-black mt-0.5">{dryRunResults.flagged.length}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 text-green-800 dark:text-green-300">
                  <div className="font-bold text-[10px]">حالة البيانات</div>
                  <div className="text-xs font-black mt-1.5">محمية (لم يتم التعديل)</div>
                </div>
              </div>

              {dryRunResults.flagged.length === 0 ? (
                <div className="p-8 text-center bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 text-green-700 dark:text-green-300 font-bold text-xs">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-green-600" />
                  جميع القوائم والمهام تستوفي معايير الجودة والاعتماد التشغيلي بنجاح!
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-black text-gray-700 dark:text-gray-300">
                    قائمة الملاحظات والأسباب المصنفة:
                  </div>
                  {dryRunResults.flagged.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs dark:text-white">{item.titleAr}</span>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {item.id.slice(0, 10)}...
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                          {item.reason}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
                        item.severity === 'high' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {item.severity === 'high' ? 'حرج' : 'تنبيه'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsDryRunModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              إغلاق نافذة الفحص
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmergencyChecklistsManagement;

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, Clock, ShieldCheck, AlertTriangle, Users, 
  ChevronDown, MessageSquare, Play, SkipForward, Ban, 
  Info, Loader2, UserCheck, AlertCircle, Check, X, ShieldAlert
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { 
  IncidentTask, TaskStatus, User, UserRole, 
  StaffAvailabilityStatus 
} from '../types';
import { checklistService } from '../services/checklistService';
import { readinessService } from '../services/readinessService';
import { getChecklistTaskTitle, getChecklistTaskDescription } from '../services/checklistLocalization';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyChecklistSectionProps {
  emergencyId: string;
  emergencyTypeId: string;
  currentUser: User;
  allUsers: User[];
  isEmergencyActive: boolean;
}

export const EmergencyChecklistSection: React.FC<EmergencyChecklistSectionProps> = ({
  emergencyId,
  emergencyTypeId,
  currentUser,
  allUsers,
  isEmergencyActive
}) => {
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState<IncidentTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Action Modal (For entering Notes, Skip reason, or Block reason)
  const [activeTaskModal, setActiveTaskModal] = useState<{
    task: IncidentTask;
    targetStatus: TaskStatus;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [blockedReason, setBlockedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Delegation / Assignment Modal
  const [assigningTask, setAssigningTask] = useState<IncidentTask | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [overrideWarningAccepted, setOverrideWarningAccepted] = useState(false);

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    // 1. Subscribe to realtime incident tasks
    const unsubscribe = checklistService.subscribeIncidentTasks(emergencyId, (loadedTasks) => {
      if (loadedTasks.length > 0) {
        setTasks(loadedTasks);
        setLoading(false);
      } else {
        // If no tasks exist for this emergency yet, auto-instantiate from approved template
        checklistService.instantiateIncidentChecklist(emergencyId, emergencyTypeId, currentUser)
          .then((instantiated) => {
            setTasks(instantiated);
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, [emergencyId, emergencyTypeId]);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleOpenActionModal = (task: IncidentTask, targetStatus: TaskStatus) => {
    // Security check: cannot sign on behalf of another user unless admin
    if (task.assignedUserId && task.assignedUserId !== currentUser.id && !isAdmin) {
      alert(t('cannot_edit_others_task'));
      return;
    }

    setActiveTaskModal({ task, targetStatus });
    setActionNotes(task.notes || '');
    setSkipReason(task.skipReason || '');
    setBlockedReason(task.blockedReason || '');
    setErrorMessage(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!activeTaskModal) return;
    const { task, targetStatus } = activeTaskModal;

    if (targetStatus === 'skipped') {
      if (!skipReason.trim()) {
        setErrorMessage(t('enter_skip_reason_required'));
        return;
      }
    }

    if (targetStatus === 'blocked') {
      if (!blockedReason.trim()) {
        setErrorMessage(t('enter_blocked_reason_required'));
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await checklistService.updateIncidentTaskStatus({
      emergencyId,
      taskId: task.taskId,
      newStatus: targetStatus,
      user: currentUser,
      notes: actionNotes.trim() || undefined,
      skipReason: skipReason.trim() || undefined,
      blockedReason: blockedReason.trim() || undefined
    });

    setIsSubmitting(false);

    if (result.success) {
      setActiveTaskModal(null);
    } else {
      setErrorMessage(result.error || t('failed_update_task_status'));
    }
  };

  const handleApproveTask = async (task: IncidentTask) => {
    if (!isAdmin) return;
    try {
      await checklistService.approveIncidentTask(emergencyId, task.taskId, currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignTask = async () => {
    if (!assigningTask || !selectedAssigneeId) return;
    const assignee = allUsers.find(u => u.id === selectedAssigneeId);
    if (!assignee) return;

    try {
      await checklistService.assignIncidentTask(emergencyId, assigningTask.taskId, assignee, currentUser);
      setAssigningTask(null);
      setSelectedAssigneeId('');
      setOverrideWarningAccepted(false);
    } catch (e: any) {
      alert(e.message || t('failed_assignment'));
    }
  };

  const selectedAssigneeUser = allUsers.find(u => u.id === selectedAssigneeId);
  const delegationEval = selectedAssigneeUser 
    ? readinessService.evaluateTaskAssignment(selectedAssigneeUser, assigningTask?.requiredRoleIds)
    : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-blue-200 dark:border-blue-900/60 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-lg">
              <ShieldCheck size={18} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
              {t('checklist_sop_badge')}
            </span>
          </div>
          <h3 className="text-xl font-black">
            {t('checklist_sop_title')}
          </h3>
          <p className="text-xs text-blue-100 font-bold mt-0.5">
            {t('checklist_sop_desc')}
          </p>
        </div>

        {/* Progress Display */}
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <div className="text-[10px] font-black uppercase text-blue-200">{t('field_completion_rate')}</div>
            <div className="text-lg font-black">{t('tasks_completed_count', { completed: completedCount, total: totalCount })}</div>
          </div>
          <div className="text-2xl font-black text-yellow-300">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Progress Bar & Regulatory Safety Disclaimer */}
      <div className="p-5 pb-3 space-y-3">
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6 }}
            className={`h-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary'}`}
          />
        </div>

        {/* Mandated Safety Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 p-3 rounded-2xl flex items-center gap-2.5 text-xs">
          <AlertTriangle className="text-amber-600 shrink-0" size={18} />
          <p className="text-amber-900 dark:text-amber-200 font-bold leading-relaxed text-[11px]">
            <strong>{t('safety_notice_title')}</strong> {t('safety_notice_body')}
          </p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-5 pt-2 space-y-3">
        {loading ? (
          <div className="py-10 text-center text-gray-400">
            <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
            <span className="text-xs font-bold">{t('loading_sop_tasks')}</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-400 border border-dashed rounded-2xl">
            {t('no_tasks_for_incident')}
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';
            const isSkipped = task.status === 'skipped';
            const isBlocked = task.status === 'blocked';

            const statusStyles = {
              completed: 'bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800 text-green-900 dark:text-green-200',
              in_progress: 'bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800 text-blue-900 dark:text-blue-200',
              skipped: 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400',
              blocked: 'bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800 text-red-900 dark:text-red-200',
              pending: 'bg-white border-gray-200 dark:bg-gray-800/80 dark:border-gray-700 text-gray-800 dark:text-white'
            }[task.status];

            const statusLabel = {
              completed: t('status_completed'),
              in_progress: t('status_in_progress'),
              skipped: t('status_skipped'),
              blocked: t('status_blocked'),
              pending: t('status_pending')
            }[task.status];

            const taskTitle = getChecklistTaskTitle(task, i18n.language);
            const taskDescription = getChecklistTaskDescription(task, i18n.language);

            return (
              <motion.div
                key={task.taskId}
                layout
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${statusStyles}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {task.order}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-sm dark:text-white leading-tight">
                          {taskTitle}
                        </h4>
                        {task.isMandatory && (
                          <span className="text-[9px] font-black text-red-600 bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                            {t('mandatory_badge')}
                          </span>
                        )}
                        {task.requiresSupervisorApproval && (
                          <span className="text-[9px] font-black text-blue-600 bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                            {t('supervisor_approval_badge')}
                          </span>
                        )}
                      </div>

                      {taskDescription && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {taskDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 border ${
                    isCompleted ? 'bg-green-100 text-green-800 border-green-300' :
                    isInProgress ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    isSkipped ? 'bg-gray-200 text-gray-700 border-gray-400' :
                    isBlocked ? 'bg-red-100 text-red-800 border-red-300' :
                    'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Task Metadata (Assignee, Completion info, Notes) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-500 font-bold">
                  <div className="flex flex-wrap items-center gap-3">
                    {task.assignedUserName ? (
                      <span className="flex items-center gap-1 text-primary">
                        <UserCheck size={13} />
                        {t('assigned_to_label')} <strong>{task.assignedUserName}</strong>
                      </span>
                    ) : (
                      <span className="text-gray-400">{t('unassigned_task')}</span>
                    )}

                    {task.completedByName && (
                      <span className="flex items-center gap-1 text-green-700 dark:text-green-300">
                        <CheckCircle2 size={13} />
                        {t('completed_by_label')} {task.completedByName} ({new Date(task.completedAt || 0).toLocaleTimeString()})
                      </span>
                    )}

                    {task.targetDurationSeconds && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock size={12} />
                        {t('target_duration')} {Math.round(task.targetDurationSeconds / 60)} {t('minutes')}
                      </span>
                    )}
                  </div>

                  {/* Supervisor Formal Approval Status */}
                  {task.requiresSupervisorApproval && (
                    <div>
                      {task.approvedByName ? (
                        <span className="flex items-center gap-1 text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/40 px-2 py-0.5 rounded-md text-[10px]">
                          <ShieldCheck size={12} /> {t('supervisor_approved')} {task.approvedByName}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-md text-[10px]">
                          <Clock size={12} /> {t('awaiting_supervisor_approval')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes or Skip/Block reason display */}
                {task.notes && (
                  <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                    <strong className="text-gray-500 block text-[10px]">{t('field_action_notes_label')}</strong>
                    <p className="font-bold dark:text-white mt-0.5">{task.notes}</p>
                  </div>
                )}

                {task.skipReason && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
                    <strong className="block text-[10px]">{t('skip_reason_label')}</strong>
                    <p className="font-bold mt-0.5">{task.skipReason}</p>
                  </div>
                )}

                {task.blockedReason && (
                  <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 text-xs text-red-900 dark:text-red-200">
                    <strong className="block text-[10px]">{t('blocked_reason_label')}</strong>
                    <p className="font-bold mt-0.5">{task.blockedReason}</p>
                  </div>
                )}

                {/* Action Buttons for Responders & Admins */}
                {isEmergencyActive && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      {/* Assign button */}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssigningTask(task);
                            setSelectedAssigneeId(task.assignedUserId || '');
                            setOverrideWarningAccepted(false);
                          }}
                          className="rounded-xl text-[11px] font-bold py-1.5 px-3"
                        >
                          <Users size={13} /> {task.assignedUserName ? t('change_assignee') : t('assign_employee')}
                        </Button>
                      )}

                      {/* Supervisor Approval Button */}
                      {isAdmin && task.requiresSupervisorApproval && !task.approvedByName && (
                        <Button
                          onClick={() => handleApproveTask(task)}
                          className="rounded-xl text-[11px] font-black py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white"
                        >
                          <ShieldCheck size={13} /> {t('supervisor_approve_action')}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Pending to In Progress */}
                      {task.status === 'pending' && (
                        <Button
                          onClick={() => handleOpenActionModal(task, 'in_progress')}
                          className="rounded-xl text-[11px] font-black py-1.5 px-3 bg-blue-600 text-white"
                        >
                          <Play size={13} /> {t('start_task_action')}
                        </Button>
                      )}

                      {/* In Progress or Pending to Complete */}
                      {task.status !== 'completed' && (
                        <Button
                          onClick={() => handleOpenActionModal(task, 'completed')}
                          className="rounded-xl text-[11px] font-black py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 size={13} /> {t('complete_task_action')}
                        </Button>
                      )}

                      {/* Skip Option (if allowed or supervisor) */}
                      {(task.canBeSkipped || isAdmin) && task.status !== 'skipped' && task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenActionModal(task, 'skipped')}
                          className="rounded-xl text-[11px] font-bold py-1.5 px-3 text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
                          <SkipForward size={13} /> {t('skip_task_action')}
                        </Button>
                      )}

                      {/* Blocked Option */}
                      {task.status !== 'blocked' && task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenActionModal(task, 'blocked')}
                          className="rounded-xl text-[11px] font-bold py-1.5 px-3 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Ban size={13} /> {t('block_task_action')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Status Modal (Notes / Skip Reason / Block Reason) */}
      <Modal
        isOpen={!!activeTaskModal}
        onClose={() => setActiveTaskModal(null)}
        title={`${t('task_update_modal_title')} ${getChecklistTaskTitle(activeTaskModal?.task, i18n.language)}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-200 text-xs">
            <span className="font-bold text-gray-500 block text-[10px]">{t('current_performing_user')}</span>
            <span className="font-black text-blue-900 dark:text-blue-200">{currentUser.name} ({currentUser.role})</span>
          </div>

          <div>
            <label className="text-xs font-black dark:text-white block mb-1">
              {t('field_action_notes_input_label')}
            </label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={t('field_action_notes_placeholder')}
              rows={3}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none resize-none"
            />
          </div>

          {activeTaskModal?.targetStatus === 'skipped' && (
            <div>
              <label className="text-xs font-black text-amber-600 dark:text-amber-400 block mb-1">
                {t('skip_reason_input_label')}
              </label>
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder={t('skip_reason_placeholder')}
                rows={2}
                className="w-full p-3 rounded-xl border-2 border-amber-400 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none resize-none"
              />
            </div>
          )}

          {activeTaskModal?.targetStatus === 'blocked' && (
            <div>
              <label className="text-xs font-black text-red-600 dark:text-red-400 block mb-1">
                {t('blocked_reason_input_label')}
              </label>
              <textarea
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder={t('blocked_reason_placeholder')}
                rows={2}
                className="w-full p-3 rounded-xl border-2 border-red-400 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none resize-none"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-100 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setActiveTaskModal(null)}
              className="rounded-xl text-xs font-bold"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-black bg-primary text-white px-5"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : t('confirm_save_action')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Assignment / Delegation Modal with Readiness & Availability Verification */}
      <Modal
        isOpen={!!assigningTask}
        onClose={() => setAssigningTask(null)}
        title={`${t('assign_task_modal_title')} ${getChecklistTaskTitle(assigningTask, i18n.language)}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 font-bold">
            {t('assign_task_modal_desc')}
          </p>

          <div>
            <label className="text-xs font-black dark:text-white block mb-1">{t('candidate_employee_label')}</label>
            <select
              value={selectedAssigneeId}
              onChange={(e) => {
                setSelectedAssigneeId(e.target.value);
                setOverrideWarningAccepted(false);
              }}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs font-bold outline-none"
            >
              <option value="">{t('select_employee_from_list')}</option>
              {allUsers.map((u) => {
                const status = u.availabilityStatus || (u.shiftStatus === 'on-duty' ? 'available' : 'off-duty');
                const statusName = {
                  available: t('status_available'),
                  busy: t('status_busy'),
                  responding: t('status_responding'),
                  'off-duty': t('status_off_duty')
                }[status] || status;
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} — ({statusName}) • {u.jobTitle || u.role}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Readiness Evaluation Banner */}
          {delegationEval && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              delegationEval.warningLevel === 'critical' 
                ? 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:text-red-200' 
                : delegationEval.warningLevel === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                : 'bg-green-50 border-green-300 text-green-900 dark:bg-green-950/40 dark:text-green-200'
            }`}>
              <div className="flex items-center gap-2 font-black">
                {delegationEval.warningLevel === 'critical' ? <ShieldAlert size={16} /> :
                 delegationEval.warningLevel === 'warning' ? <AlertTriangle size={16} /> :
                 <CheckCircle2 size={16} />}
                <span>{t('auto_readiness_eval')}</span>
              </div>
              <p className="font-bold leading-relaxed">{delegationEval.message}</p>

              {delegationEval.requiresSupervisorOverride && (
                <label className="flex items-center gap-2 pt-2 border-t border-black/10 dark:border-white/10 cursor-pointer font-black">
                  <input
                    type="checkbox"
                    checked={overrideWarningAccepted}
                    onChange={(e) => setOverrideWarningAccepted(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>{t('supervisor_override_acknowledgement')}</span>
                </label>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button variant="outline" onClick={() => setAssigningTask(null)} className="rounded-xl text-xs font-bold">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAssignTask}
              disabled={!selectedAssigneeId || (delegationEval?.requiresSupervisorOverride && !overrideWarningAccepted)}
              className="rounded-xl text-xs font-black bg-primary text-white px-5 disabled:opacity-40"
            >
              {t('confirm_assignment')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

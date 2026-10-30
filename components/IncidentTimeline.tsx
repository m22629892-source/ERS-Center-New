import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IncidentTimelineEvent, TimelineEventType, User, UserRole } from '../types';
import { timelineService } from '../services/timelineService';
import { 
  Clock, ArrowUpDown, Filter, Plus, MessageSquare, Shield, 
  CheckCircle2, Navigation, MapPinCheck, AlertTriangle, 
  HelpCircle, UserX, FileText, Mic, Lock, Eye, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface IncidentTimelineProps {
  emergencyId: string;
  currentUser?: User | null;
  className?: string;
  isEmergencyActive?: boolean;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  emergencyId,
  currentUser,
  className = '',
  isEmergencyActive = true,
}) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<IncidentTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    if (!emergencyId) {
      setIsLoading(false);
      return;
    }

    const unsub = timelineService.subscribeTimeline(emergencyId, (loaded) => {
      setEvents(loaded);
      setIsLoading(false);
    });

    return () => unsub();
  }, [emergencyId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !currentUser || !emergencyId) return;

    setIsSubmittingNote(true);
    await timelineService.recordEvent({
      incidentId: emergencyId,
      eventType: 'NOTE_ADDED',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.username,
      actorRole: currentUser.role,
      descriptionKey: 'timeline_event_note_added',
      metadata: {
        noteText: newNote.trim(),
        userName: currentUser.name || currentUser.username,
      },
      source: 'web',
    });

    setNewNote('');
    setIsAddingNote(false);
    setIsSubmittingNote(false);
  };

  // Helper to format event description with localized metadata
  const renderEventDescription = (ev: IncidentTimelineEvent) => {
    const meta = ev.metadata || {};
    const actor = ev.actorName || t('system');

    switch (ev.eventType) {
      case 'INCIDENT_CREATED':
        return t('timeline_desc_created', {
          actor,
          type: meta.typeName || '',
          location: meta.locationName || '',
        });
      case 'ACKNOWLEDGED':
        return t('timeline_desc_acknowledged', {
          actor,
          notes: meta.notes ? ` (${meta.notes})` : '',
        });
      case 'RESPONSE_STARTED':
        return t('timeline_desc_response_started', {
          actor,
          actionNotes: meta.actionNotes ? ` - ${meta.actionNotes}` : '',
        });
      case 'ON_SCENE':
        return t('timeline_desc_on_scene', { actor });
      case 'DECLINED':
        return t('timeline_desc_declined', {
          actor,
          reason: meta.reason || '',
        });
      case 'ESCALATED':
        return t('timeline_desc_escalated', {
          actor,
          level: meta.level || '1',
        });
      case 'BACKUP_REQUESTED':
        return t('timeline_desc_backup_requested', {
          actor,
          details: meta.details ? ` - ${meta.details}` : '',
        });
      case 'TASK_STATUS_CHANGED':
        return t('timeline_desc_task_changed', {
          actor,
          taskTitle: meta.taskTitle || '',
          status: t(`task_status_${meta.status || 'completed'}`),
        });
      case 'QUICK_MESSAGE':
        return t('timeline_desc_quick_message', {
          actor,
          message: meta.messageText || meta.key || '',
        });
      case 'VOICE_NOTE_ADDED':
        return t('timeline_desc_voice_note_added', {
          actor,
          duration: meta.durationSeconds ? `${meta.durationSeconds}s` : '',
        });
      case 'CLOSED':
      case 'OVERRIDE_CLOSED':
        return t('timeline_desc_closed', {
          actor,
          reason: meta.closureReason ? ` - ${meta.closureReason}` : '',
        });
      case 'NOTE_ADDED':
        return meta.noteText || t('timeline_event_note_added');
      default:
        return t(ev.descriptionKey || 'timeline_generic_event', { actor });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'INCIDENT_CREATED':
        return <Shield className="text-red-500" size={16} />;
      case 'ACKNOWLEDGED':
        return <CheckCircle2 className="text-indigo-500" size={16} />;
      case 'RESPONSE_STARTED':
        return <Navigation className="text-amber-500" size={16} />;
      case 'ON_SCENE':
        return <MapPinCheck className="text-emerald-500" size={16} />;
      case 'DECLINED':
        return <UserX className="text-rose-500" size={16} />;
      case 'ESCALATED':
        return <AlertTriangle className="text-orange-600 animate-pulse" size={16} />;
      case 'BACKUP_REQUESTED':
        return <AlertTriangle className="text-red-600" size={16} />;
      case 'TASK_STATUS_CHANGED':
        return <FileText className="text-blue-500" size={16} />;
      case 'QUICK_MESSAGE':
        return <MessageSquare className="text-teal-500" size={16} />;
      case 'VOICE_NOTE_ADDED':
        return <Mic className="text-purple-500" size={16} />;
      case 'CLOSED':
      case 'OVERRIDE_CLOSED':
        return <Lock className="text-gray-500" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  // Filter & sort
  const filteredEvents = events.filter((ev) => {
    if (selectedFilter === 'responses') {
      return ['ACKNOWLEDGED', 'RESPONSE_STARTED', 'ON_SCENE', 'DECLINED'].includes(ev.eventType);
    }
    if (selectedFilter === 'tasks') {
      return ev.eventType === 'TASK_STATUS_CHANGED';
    }
    if (selectedFilter === 'messages') {
      return ['QUICK_MESSAGE', 'NOTE_ADDED', 'VOICE_NOTE_ADDED'].includes(ev.eventType);
    }
    if (selectedFilter === 'escalations') {
      return ['ESCALATED', 'BACKUP_REQUESTED'].includes(ev.eventType);
    }
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const tA = a.timestamp || 0;
    const tB = b.timestamp || 0;
    return sortOrder === 'desc' ? tB - tA : tA - tB;
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">
              {t('incident_activity_timeline')}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('timeline_subtitle', { count: events.length })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chronological Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-colors"
            title={sortOrder === 'desc' ? t('sort_newest_first') : t('sort_oldest_first')}
          >
            <ArrowUpDown size={14} />
            <span>{sortOrder === 'desc' ? t('newest_first') : t('oldest_first')}</span>
          </button>

          {/* Add Note Button */}
          {currentUser && isEmergencyActive && (
            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-primary text-white hover:opacity-90 shadow-xs transition-opacity"
            >
              <Plus size={14} />
              <span>{t('add_timeline_note')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 text-[11px] font-bold scrollbar-none">
        {[
          { id: 'all', label: t('all_events') },
          { id: 'responses', label: t('filter_responses') },
          { id: 'tasks', label: t('filter_tasks') },
          { id: 'messages', label: t('filter_messages') },
          { id: 'escalations', label: t('filter_escalations') },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors border ${
              selectedFilter === f.id
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add Note Drawer */}
      <AnimatePresence>
        {isAddingNote && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddNote}
            className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2 overflow-hidden"
          >
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t('write_timeline_note_placeholder')}
              rows={2}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingNote(false)}
                type="button"
                className="text-xs py-1"
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={!newNote.trim() || isSubmittingNote}
                type="submit"
                className="text-xs py-1"
              >
                {isSubmittingNote ? t('saving') : t('record_event')}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-gray-400 font-bold">
          {t('loading')}
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 font-bold">
          {t('no_timeline_events')}
        </div>
      ) : (
        <div className="relative border-s-2 border-gray-100 dark:border-gray-700 ms-3 space-y-4 my-2">
          {sortedEvents.map((ev, index) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const dateStr = new Date(ev.timestamp).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <motion.div
                key={ev.eventId || ev.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="relative ps-6 group"
              >
                {/* Node icon */}
                <span className="absolute -start-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xs">
                  {getEventIcon(ev.eventType)}
                </span>

                <div className="bg-gray-50/70 dark:bg-gray-700/30 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black dark:text-white">
                        {ev.actorName || t('system')}
                      </span>
                      {ev.actorRole && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                          {ev.actorRole}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {dateStr} • {timeStr}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-200 font-semibold leading-relaxed">
                    {renderEventDescription(ev)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

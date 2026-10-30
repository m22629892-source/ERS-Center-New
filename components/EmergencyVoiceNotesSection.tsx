import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Square, Play, Pause, Trash2, Upload, 
  CheckCircle2, AlertCircle, Clock, Volume2, VolumeX, 
  RefreshCw, FileText, Loader2, ShieldCheck, WifiOff
} from 'lucide-react';
import { Button } from './Button';
import { ConfirmModal } from './Modal';
import { VoiceNote, User, UserRole } from '../types';
import { voiceNotesService } from '../services/voiceNotesService';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyVoiceNotesSectionProps {
  emergencyId: string;
  currentUser: User;
  isEmergencyActive: boolean;
}

export const EmergencyVoiceNotesSection: React.FC<EmergencyVoiceNotesSectionProps> = ({
  emergencyId,
  currentUser,
  isEmergencyActive
}) => {
  const { t } = useTranslation();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Preview State (after recording, before upload)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [noteDescription, setNoteDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Playback State for Preview
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Playback State for Existing Voice Notes
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const playingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Offline / Pending Uploads
  const [pendingOfflineNotes, setPendingOfflineNotes] = useState<any[]>([]);

  // Deletion Modal
  const [deletingNote, setDeletingNote] = useState<VoiceNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    // 1. Subscribe to realtime voice notes from Firestore
    const unsubscribe = voiceNotesService.subscribeEmergencyVoiceNotes(emergencyId, (notes) => {
      setVoiceNotes(notes);
      setLoading(false);
    });

    // 2. Check offline IndexedDB cache
    checkPendingOffline();

    return () => {
      unsubscribe();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (playingAudioRef.current) playingAudioRef.current.pause();
    };
  }, [emergencyId]);

  const checkPendingOffline = async () => {
    const list = await voiceNotesService.getPendingOfflineVoiceNotes(emergencyId);
    setPendingOfflineNotes(list);
  };

  const handleStartRecording = async () => {
    setFeedback(null);
    const perm = await voiceNotesService.requestMicrophonePermission();
    if (!perm.granted) {
      setFeedback({ type: 'error', text: perm.error || t('voice_notes_mic_required') });
      return;
    }

    try {
      const { stream } = await voiceNotesService.startRecording();
      setMediaStream(stream);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer (Max 60 seconds)
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e: any) {
      setFeedback({ type: 'error', text: `${t('voice_notes_start_failed')}: ${e.message}` });
    }
  };

  const handleStopRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);

    try {
      const { audioBlob, durationSeconds, audioUrl } = await voiceNotesService.stopRecording(mediaStream || undefined);
      setPreviewBlob(audioBlob);
      setPreviewDuration(durationSeconds);
      setPreviewUrl(audioUrl);
      setMediaStream(null);
    } catch (e: any) {
      setFeedback({ type: 'error', text: t('voice_notes_stop_failed') });
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
    setNoteDescription('');
    setIsPreviewPlaying(false);
  };

  const handleTogglePreviewPlay = () => {
    if (!previewAudioRef.current && previewUrl) {
      previewAudioRef.current = new Audio(previewUrl);
      previewAudioRef.current.onended = () => setIsPreviewPlaying(false);
    }

    if (previewAudioRef.current) {
      if (isPreviewPlaying) {
        previewAudioRef.current.pause();
        setIsPreviewPlaying(false);
      } else {
        previewAudioRef.current.play();
        setIsPreviewPlaying(true);
      }
    }
  };

  const handleUploadVoiceNote = async () => {
    if (!previewBlob) return;
    setIsUploading(true);
    setUploadProgress(0);
    setFeedback(null);

    const result = await voiceNotesService.uploadVoiceNote({
      emergencyId,
      audioBlob: previewBlob,
      durationSeconds: previewDuration,
      user: currentUser,
      description: noteDescription.trim() || undefined,
      onProgress: (p) => setUploadProgress(p)
    });

    setIsUploading(false);

    if (result.success) {
      setFeedback({ type: 'success', text: t('voice_notes_upload_success') });
      handleCancelPreview();
    } else {
      setFeedback({ type: 'error', text: result.error || t('voice_notes_upload_failed') });
      checkPendingOffline();
    }
  };

  const handlePlayVoiceNote = (note: VoiceNote) => {
    if (!note.downloadUrl) return;

    if (activePlayingId === note.noteId) {
      // Pause
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
      }
      setActivePlayingId(null);
    } else {
      // Start new
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
      }
      const audio = new Audio(note.downloadUrl);
      playingAudioRef.current = audio;
      audio.onended = () => setActivePlayingId(null);
      audio.play().catch((err) => {
        console.warn('Audio play error:', err);
      });
      setActivePlayingId(note.noteId);
    }
  };

  const handleDeleteVoiceNote = async () => {
    if (!deletingNote) return;
    const targetId = deletingNote.noteId || (deletingNote as any).id;
    setIsDeleting(true);
    try {
      const res = await voiceNotesService.deleteVoiceNote(emergencyId, deletingNote, currentUser);
      if (res && res.success === false) {
        setFeedback({ type: 'error', text: res.error || t('voice_notes_delete_failed') });
      } else {
        setFeedback({ type: 'success', text: t('voice_notes_delete_success') });
        // Optimistically remove from state
        setVoiceNotes(prev => prev.filter(n => (n.noteId || (n as any).id) !== targetId));
      }
      setDeletingNote(null);
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || t('voice_notes_delete_failed') });
      setDeletingNote(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetryOfflineNote = async (pendingNote: any) => {
    setIsUploading(true);
    const res = await voiceNotesService.uploadVoiceNote({
      emergencyId,
      audioBlob: pendingNote.audioBlob,
      durationSeconds: pendingNote.durationSeconds,
      user: currentUser,
      description: pendingNote.description
    });
    setIsUploading(false);

    if (res.success) {
      await voiceNotesService.removePendingOfflineVoiceNote(pendingNote.tempId);
      checkPendingOffline();
      setFeedback({ type: 'success', text: t('voice_notes_upload_success') });
    } else {
      setFeedback({ type: 'error', text: res.error || t('voice_notes_upload_failed') });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-900 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-lg">
              <Mic size={18} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
              Emergency Voice Notes Engine
            </span>
          </div>
          <h3 className="text-xl font-black">
            {t('voice_notes_title')}
          </h3>
          <p className="text-xs text-indigo-100 font-bold mt-0.5">
            {t('voice_notes_desc')}
          </p>
        </div>

        <div className="text-[11px] font-black bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
          <span>{t('voice_notes_count', { count: voiceNotes.length })}</span>
        </div>
      </div>

      {/* Notifications / Feedback */}
      <div className="px-5">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3.5 rounded-2xl text-xs font-black flex items-center justify-between ${
                feedback.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/40 dark:text-green-300' 
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{feedback.text}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline Pending Recordings Warning */}
        {pendingOfflineNotes.length > 0 && (
          <div className="mt-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <WifiOff size={18} className="text-amber-600 shrink-0" />
              <span>
                {t('voice_notes_offline_warning', { count: pendingOfflineNotes.length })}
              </span>
            </div>
            <Button
              onClick={() => handleRetryOfflineNote(pendingOfflineNotes[0])}
              disabled={isUploading}
              className="rounded-xl text-[10px] font-black py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              {isUploading ? <Loader2 className="animate-spin" size={12} /> : t('voice_notes_retry_now')}
            </Button>
          </div>
        )}
      </div>

      {/* Recording Control Area */}
      {isEmergencyActive && (
        <div className="px-5">
          <div className="bg-gray-50 dark:bg-gray-800/80 p-5 rounded-3xl border border-gray-200 dark:border-gray-700/80 space-y-4">
            {!isRecording && !previewBlob && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Mic size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm dark:text-white">
                      {t('voice_notes_record_new')}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-bold">
                      {t('voice_notes_click_to_start')}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleStartRecording}
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center gap-2"
                >
                  <Mic size={16} /> {t('voice_notes_start_recording')}
                </Button>
              </div>
            )}

            {/* Active Recording State */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="w-4 h-4 bg-red-600 rounded-full inline-block animate-ping absolute -inset-0.5"></span>
                    <span className="w-4 h-4 bg-red-600 rounded-full inline-block relative"></span>
                  </div>

                  {/* Sound Wave Animation */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [6, 26, 6] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.08 }}
                        className="w-1.5 bg-red-600 rounded-full"
                      />
                    ))}
                  </div>

                  <div>
                    <div className="text-lg font-black text-red-700 dark:text-red-300">
                      {t('voice_notes_recording_in_progress')} {formatTime(recordingSeconds)} / 01:00
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {t('voice_notes_speak_clearly')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleStopRecording}
                  className="rounded-2xl py-3 px-6 font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-md flex items-center gap-2"
                >
                  <Square size={16} /> {t('voice_notes_stop_and_save')}
                </Button>
              </motion.div>
            )}

            {/* Preview Before Upload */}
            {previewBlob && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-5 rounded-2xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTogglePreviewPlay}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
                    >
                      {isPreviewPlaying ? <Pause size={20} /> : <Play size={20} className="mr-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                        {t('voice_notes_preview_title')}
                      </div>
                      <div className="text-[11px] text-gray-500 font-bold">
                        {t('voice_notes_duration_size', { duration: previewDuration, size: Math.round(previewBlob.size / 1024) })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleCancelPreview}
                      disabled={isUploading}
                      className="rounded-xl text-xs font-bold text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> {t('voice_notes_cancel_and_delete')}
                    </Button>
                    <Button
                      onClick={handleUploadVoiceNote}
                      disabled={isUploading}
                      className="rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-5 flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>{t('voice_notes_uploading')} ({uploadProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>{t('voice_notes_confirm_upload')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Optional Note Description */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 block mb-1">
                    {t('voice_notes_description_label')}
                  </label>
                  <input
                    type="text"
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                    placeholder={t('voice_notes_desc_placeholder')}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold outline-none"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Voice Notes List */}
      <div className="p-5 pt-1 space-y-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Volume2 size={14} />
          {t('voice_notes_list_title')} ({voiceNotes.length})
        </h4>

        {loading ? (
          <div className="py-8 text-center text-gray-400">
            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={20} />
            <span className="text-xs font-bold">{t('voice_notes_loading')}</span>
          </div>
        ) : voiceNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-dashed text-xs">
            {t('voice_notes_empty')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {voiceNotes.map((note) => {
              const isPlaying = activePlayingId === note.noteId;
              const canDelete = isAdmin || note.userId === currentUser.id;

              return (
                <div
                  key={note.noteId}
                  className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handlePlayVoiceNote(note)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isPlaying 
                          ? 'bg-red-600 text-white shadow-red-200 shadow-md animate-pulse' 
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200'
                      }`}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="mr-0.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs dark:text-white truncate">
                          {note.userName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                          {note.durationSeconds} {t('voice_notes_seconds')}
                        </span>
                      </div>

                      {note.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-bold mt-1 line-clamp-1">
                          "{note.description}"
                        </p>
                      )}

                      <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-2">
                        <Clock size={11} />
                        <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {canDelete && (
                      <button
                        onClick={() => setDeletingNote(note)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title={t('voice_notes_delete_btn')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingNote}
        onClose={() => !isDeleting && setDeletingNote(null)}
        onConfirm={handleDeleteVoiceNote}
        isDeleting={isDeleting}
        title={t('voice_notes_delete_title')}
        message={t('voice_notes_delete_msg')}
      />
    </div>
  );
};

import { storage, db } from '../firebase';
import { 
  ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { 
  collection, doc, setDoc, getDocs, deleteDoc, 
  query, orderBy, limit, onSnapshot, updateDoc 
} from 'firebase/firestore';
import { VoiceNote, User } from '../types';
import { auditService } from './auditService';

// IndexedDB Helper for safe offline buffer (never raw localStorage)
const DB_NAME = 'ERS_Audio_Offline_DB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_voice_notes';

function openOfflineAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class VoiceNotesService {
  private static instance: VoiceNotesService;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime = 0;

  private constructor() {}

  public static getInstance(): VoiceNotesService {
    if (!VoiceNotesService.instance) {
      VoiceNotesService.instance = new VoiceNotesService();
    }
    return VoiceNotesService.instance;
  }

  /**
   * Request microphone permission explicitly
   */
  public async requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { granted: false, error: 'المتصفح أو الجهاز لا يدعم تسجيل الصوت عبر الميكروفون.' };
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop track immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (err: any) {
      console.warn('Microphone permission denied:', err);
      let msg = 'تم رفض الإذن للوصول إلى الميكروفون.';
      if (err.name === 'NotAllowedError') msg = 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.';
      if (err.name === 'NotFoundError') msg = 'لم يتم العثور على جهاز ميكروفون متصل.';
      return { granted: false, error: msg };
    }
  }

  /**
   * Start recording audio
   */
  public async startRecording(onTimeUpdate?: (seconds: number) => void): Promise<{ stream: MediaStream; mimeType: string }> {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });

    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
      else mimeType = '';
    }

    const options = mimeType ? { mimeType } : undefined;
    this.mediaRecorder = new MediaRecorder(stream, options);
    this.audioChunks = [];
    this.recordingStartTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Slice every 250ms
    return { stream, mimeType: this.mediaRecorder.mimeType || 'audio/webm' };
  }

  /**
   * Stop recording and return the recorded audio blob and duration
   */
  public stopRecording(stream?: MediaStream): Promise<{ audioBlob: Blob; durationSeconds: number; audioUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('No active recorder found'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const durationSeconds = Math.max(1, Math.round((Date.now() - this.recordingStartTime) / 1000));
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop all media tracks
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }

        this.mediaRecorder = null;
        this.audioChunks = [];
        resolve({ audioBlob, durationSeconds, audioUrl });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Upload voice note to Firebase Storage and create Firestore metadata record
   */
  /**
   * Upload voice note: converts audio to embedded data URL and synchronizes directly to Firestore
   * This guarantees 100% immediate upload without hanging on unprovisioned Firebase Storage buckets
   */
  public async uploadVoiceNote(params: {
    emergencyId: string;
    audioBlob: Blob;
    durationSeconds: number;
    user: User;
    description?: string;
    onProgress?: (progress: number) => void;
  }): Promise<{ success: boolean; voiceNote?: VoiceNote; error?: string }> {
    const { emergencyId, audioBlob, durationSeconds, user, description, onProgress } = params;

    // Safety checks
    if (!audioBlob || audioBlob.size === 0) {
      return { success: false, error: 'ملف التسجيل الصوتي فارغ.' };
    }

    // Max 25MB check
    if (audioBlob.size > 25 * 1024 * 1024) {
      return { success: false, error: 'حجم المقطع الصوتي تجاوز الحد الأقصى المسموح (25 ميغابايت).' };
    }

    const noteId = `vnote_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const mimeType = audioBlob.type || 'audio/webm';

    try {
      if (onProgress) onProgress(20);

      // Read audio blob as Base64 Data URL (Fast, safe, zero-config, works everywhere)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to encode audio as data URL'));
        };
        reader.onerror = () => reject(reader.error || new Error('FileReader error'));
        reader.readAsDataURL(audioBlob);
      });

      if (onProgress) onProgress(60);

      // Save directly to Firestore emergency voice_notes subcollection
      const noteDocRef = doc(db, 'emergencies', emergencyId, 'voice_notes', noteId);
      const record: VoiceNote = {
        noteId,
        emergencyId,
        userId: user.id,
        userName: user.name,
        storagePath: `voice_notes/${noteId}`,
        downloadUrl: dataUrl,
        durationSeconds,
        mimeType,
        fileSize: audioBlob.size,
        description: description || '',
        createdAt: Date.now(),
        uploadedAt: Date.now(),
        status: 'ready'
      };

      await setDoc(noteDocRef, record);

      if (onProgress) onProgress(100);

      // Record in audit log
      try {
        await auditService.logEvent({
          emergencyId,
          userId: user.id,
          userName: user.name,
          actionType: 'VOICE_NOTE_RECORDED',
          details: `تسجيل ملاحظة صوتية (${durationSeconds} ثانية) بواسطة ${user.name}.`,
          metadata: { noteId, durationSeconds, fileSize: audioBlob.size }
        });
      } catch (auditErr) {
        console.warn('Audit trail logging error:', auditErr);
      }

      return { success: true, voiceNote: record };
    } catch (error: any) {
      console.error('Error uploading voice note:', error);

      // Save to offline IndexedDB if failed
      try {
        await this.savePendingOfflineVoiceNote({
          tempId: noteId,
          emergencyId,
          audioBlob,
          durationSeconds,
          userId: user.id,
          userName: user.name,
          description: description || '',
          timestamp: Date.now()
        });
      } catch (idbErr) {
        console.warn('Failed to cache in IndexedDB:', idbErr);
      }

      return {
        success: false,
        error: navigator.onLine 
          ? `فشل حفظ المقطع الصوتي: ${error.message || 'خطأ غير متوقع'}` 
          : 'انقطع الاتصال بالإنترنت. تم حفظ التسجيل بأمان محلياً للمحاولة لاحقاً.'
      };
    }
  }

  /**
   * Realtime subscription to emergency voice notes (ordered by createdAt desc, limited to 50 for performance)
   */
  public subscribeEmergencyVoiceNotes(
    emergencyId: string, 
    callback: (notes: VoiceNote[]) => void
  ): () => void {
    const q = query(
      collection(db, 'emergencies', emergencyId, 'voice_notes'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ noteId: doc.id, ...doc.data() } as VoiceNote));
      callback(list);
    }, (err) => {
      console.warn('Voice notes listener error:', err);
    });
  }

  /**
   * Delete voice note (Storage file + Firestore metadata + Audit log)
   */
  public async deleteVoiceNote(emergencyId: string, voiceNote: VoiceNote, user: User): Promise<{ success: boolean; error?: string }> {
    const noteId = voiceNote.noteId || (voiceNote as any).id;
    if (!noteId || !emergencyId) {
      return { success: false, error: 'معرّف الملاحظة الصوتية غير محدد' };
    }

    try {
      // 1. Delete from Firestore document
      const noteDocRef = doc(db, 'emergencies', emergencyId, 'voice_notes', noteId);
      await deleteDoc(noteDocRef);

      // 2. Also remove from local offline cache if it was pending
      try {
        await this.removePendingOfflineVoiceNote(noteId);
      } catch (idbErr) {
        // Silently ignore IDB error
      }

      // 3. Delete from Firebase Storage if it was uploaded to storage bucket
      if (voiceNote.storagePath && !voiceNote.downloadUrl?.startsWith('data:')) {
        try {
          const storageRef = ref(storage, voiceNote.storagePath);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn('Storage file deletion warning (may not exist in bucket):', storageErr);
        }
      }

      // 4. Log in Audit Trail
      try {
        await auditService.logEvent({
          emergencyId,
          userId: user.id,
          userName: user.name,
          actionType: 'VOICE_NOTE_DELETED',
          details: `تم حذف الملاحظة الصوتية ${noteId} بواسطة ${user.name}.`,
          metadata: { noteId, storagePath: voiceNote.storagePath }
        });
      } catch (auditErr) {
        console.warn('Audit trail logging error:', auditErr);
      }

      return { success: true };
    } catch (e: any) {
      console.error('Error deleting voice note:', e);
      return { success: false, error: e.message || 'فشل حذف الملاحظة الصوتية' };
    }
  }

  /**
   * Cache failed/offline audio securely in IndexedDB
   */
  private async savePendingOfflineVoiceNote(data: any): Promise<void> {
    const db = await openOfflineAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Check for pending offline recordings to retry
   */
  public async getPendingOfflineVoiceNotes(emergencyId?: string): Promise<any[]> {
    try {
      const db = await openOfflineAudioDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          if (emergencyId) {
            resolve(list.filter((item: any) => item.emergencyId === emergencyId));
          } else {
            resolve(list);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Remove cached item after successful upload
   */
  public async removePendingOfflineVoiceNote(tempId: string): Promise<void> {
    try {
      const db = await openOfflineAudioDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(tempId);
    } catch (e) {}
  }
}

export const voiceNotesService = VoiceNotesService.getInstance();

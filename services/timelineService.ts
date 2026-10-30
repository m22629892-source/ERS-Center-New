import { db } from '../firebase';
import { 
  collection, doc, setDoc, getDocs, query, orderBy, 
  onSnapshot, serverTimestamp, limit 
} from 'firebase/firestore';
import { IncidentTimelineEvent, TimelineEventType } from '../types';
import { auditService } from './auditService';

export class TimelineService {
  private static instance: TimelineService;

  private constructor() {}

  public static getInstance(): TimelineService {
    if (!TimelineService.instance) {
      TimelineService.instance = new TimelineService();
    }
    return TimelineService.instance;
  }

  /**
   * Records an immutable event in the incident timeline.
   * Stored under `emergencies/{emergencyId}/timeline/{eventId}` and mirrored to audit trail.
   */
  public async recordEvent(
    event: Omit<IncidentTimelineEvent, 'eventId' | 'timestamp'> & { eventId?: string; timestamp?: number }
  ): Promise<string> {
    if (!event.incidentId) {
      console.warn('Cannot record timeline event without incidentId');
      return '';
    }

    const eventId = event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = event.timestamp || Date.now();

    const timelineItem: IncidentTimelineEvent = {
      ...event,
      eventId,
      timestamp,
      visibility: event.visibility || 'all',
      source: event.source || 'web',
    };

    try {
      const docRef = doc(db, 'emergencies', event.incidentId, 'timeline', eventId);
      await setDoc(docRef, {
        ...timelineItem,
        serverTimestamp: serverTimestamp(),
      });

      // Mirror to global audit service for comprehensive compliance
      await auditService.logEvent({
        eventId,
        emergencyId: event.incidentId,
        eventType: event.eventType,
        actorUserId: event.actorId,
        actorName: event.actorName,
        actorRole: event.actorRole,
        actionDetails: event.descriptionKey,
        metadata: event.metadata || {},
        source: event.source || 'timeline',
        timestamp,
      });

      return eventId;
    } catch (error) {
      console.warn('Failed to write timeline event to Firestore, storing in offline queue:', error);
      try {
        const queue = JSON.parse(localStorage.getItem('ers_timeline_queue') || '[]');
        queue.push({ ...timelineItem, localTimestamp: Date.now() });
        localStorage.setItem('ers_timeline_queue', JSON.stringify(queue.slice(-50)));
      } catch (e) {}
      return eventId;
    }
  }

  /**
   * Subscribes to real-time incident timeline updates.
   */
  public subscribeTimeline(
    emergencyId: string,
    callback: (events: IncidentTimelineEvent[]) => void
  ): () => void {
    if (!emergencyId) return () => {};

    try {
      const q = query(
        collection(db, 'emergencies', emergencyId, 'timeline'),
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const events: IncidentTimelineEvent[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as IncidentTimelineEvent),
          }));
          callback(events);
        },
        (error) => {
          console.warn(`Error in timeline listener for ${emergencyId}:`, error);
        }
      );
    } catch (err) {
      console.warn('Could not establish timeline listener:', err);
      return () => {};
    }
  }

  /**
   * One-time fetch for reports and exports.
   */
  public async getEmergencyTimeline(emergencyId: string): Promise<IncidentTimelineEvent[]> {
    if (!emergencyId) return [];
    try {
      const q = query(
        collection(db, 'emergencies', emergencyId, 'timeline'),
        orderBy('timestamp', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as IncidentTimelineEvent),
      }));
    } catch (e) {
      console.warn('Error fetching emergency timeline:', e);
      return [];
    }
  }
}

export const timelineService = TimelineService.getInstance();

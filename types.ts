
export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  USER = 'user',
  RESPONDER = 'responder'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  contact?: string;
  country?: string;
  ip?: string;
  lastLocation?: { lat: number; lng: number; accuracy?: number; timestamp: number; isLiveShift?: boolean };
  shiftStatus?: 'on-duty' | 'off-duty';
  lastShiftStart?: number;
  lastShiftEnd?: number;
  lastHeartbeat?: number;
  status?: 'online' | 'idle' | 'offline';
  lastLogin?: number;
  deviceInfo?: {
    type: 'mobile' | 'desktop' | 'tablet';
    model: string;
    browser: string;
    os: string;
  };
  availabilityStatus?: 'available' | 'busy' | 'responding' | 'off-duty';
  availabilityUpdatedAt?: number;
  availabilityUpdatedBy?: string;
  availabilityReason?: string;
  currentEmergencyIds?: string[];
  lastActiveAt?: number;
}


export interface SimulatorConfig {
  customSituations: string;
  updatedAt: number;
}

export interface FacilityProfile {
  activityType: string;
  potentialHazards: string;
  criticalAssets: string;
  safetyStandards: string;
  siteDescription: string;
  updatedAt: number;
}

export interface TelemetryPoint {
  userId: string;
  userName: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export interface EmergencyEvent {
  id: string;
  type: 'message' | 'task' | 'arrival' | 'escalation';
  content: string;
  userName: string;
  timestamp: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  emergencyId: string;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface Emergency {
  id: string;
  typeId: string;
  typeName: string;
  locationId: string;
  locationName: string;
  notes?: string;
  createdBy: string;
  creatorName: string;
  createdAt: number;
  status: EmergencyStatus;
  responders: string[];
  responderActions?: Record<string, string>;
  dismissedBy?: string[];
  closedAt?: number;
  closedBy?: string;
  closedByName?: string;
  aiReport?: string;
  escalated?: boolean;
  checklist?: SOPTask[];
  isStreaming?: boolean;
  verifiedResponders?: string[];
  quiz?: Quiz;
  dispatchedAt?: number;
  firstAcknowledgedAt?: number;
  firstResponseAt?: number;
  firstArrivalAt?: number;
  escalationLevel?: number;
  escalationStatus?: string;
  lastEscalationHaltedAt?: number;
  isDrill?: boolean;
  drillId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  checklistSnapshot?: any;
  escalationTargetTier?: string;
  coverageFailure?: boolean;
  coverageFailureReason?: string | null;
  escalationHalted?: boolean;
  escalationReason?: string;
}

export enum EmergencyStatus {
  ACTIVE = 'active',
  CLOSED = 'closed'
}

export interface SOPTask {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: number;
}

export interface Location {
  id: string;
  name: string;
  floor_number: string;
  coords: { lat: number; lng: number };
  verificationCode?: string;
}

export interface JobTitle {
  id: string;
  job_name: string;
  description: string;
}

export interface Settings {
  darkMode: boolean;
  language: 'ar' | 'en' | 'ku' | 'fr' | 'de' | 'ur';
  translationLanguage: string;
  doNotDisturb: {
    enabled: boolean;
    start: string;
    end: string;
  };
  themeColor: string;
  muteSiren: boolean;
}

export interface AppLinks {
  androidUrl: string;
  iosUrl: string;
  lastUpdated?: number;
}

export interface EmergencyType {
  id: string;
  type_name: string;
  description: string;
  severity_level: 'High' | 'Medium' | 'Low';
  alert_color: string;
  default_procedures: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  loginTime: number;
  logoutTime?: number;
  device?: string;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type DeviceLocationSource = 'gps' | 'ip' | 'manual' | 'none';
export type DeviceLocationStatus = 'active' | 'stale' | 'approximate' | 'failed';

export interface ConnectedDevice {
  deviceId: string;
  installationId: string;
  userId: string;
  userName?: string;
  sessionId: string;
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
  fcmToken: string;
  notificationEnabled: boolean;
  ipAddress: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  locationSource: DeviceLocationSource;
  locationAccuracy: number;
  locationStatus: DeviceLocationStatus;
  locationObservedAt: number;
  locationUpdatedAt: number;
  locationVersion: number;
  lastIpCheckAt: number;
  lastKnownCountry: string;
  lastKnownCity: string;
  activeSessionId: string;
  isOnline: boolean;
  firstSeen: number;
  lastSeen: number;
  lastLocationUpdate: number;
}

export interface LocationHistoryEntry {
  id?: string;
  deviceId: string;
  userId: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  locationSource: DeviceLocationSource;
  locationAccuracy: number;
  locationStatus: DeviceLocationStatus;
  timestamp: number;
  reason?: string;
}

export type StaffAvailabilityStatus = 'available' | 'busy' | 'responding' | 'off-duty';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';

export interface ChecklistTemplateTask {
  taskId: string;
  checklistId?: string;
  titleAr: string;
  titleEn: string;
  titleKu?: string;
  titleFr?: string;
  titleDe?: string;
  titleUr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionKu?: string;
  descriptionFr?: string;
  descriptionDe?: string;
  descriptionUr?: string;
  order: number;
  requiredRoleIds: string[]; // Role IDs or Job Title names
  isMandatory: boolean;
  targetDurationSeconds?: number;
  requiresSupervisorApproval: boolean;
  canBeSkipped: boolean;
  isActive: boolean;
}

export interface ChecklistTemplate {
  checklistId: string;
  emergencyTypeId: string;
  emergencyTypeName?: string;
  titleAr: string;
  titleEn: string;
  titleKu?: string;
  titleFr?: string;
  titleDe?: string;
  titleUr?: string;
  description: string;
  descriptionEn?: string;
  descriptionKu?: string;
  descriptionFr?: string;
  descriptionDe?: string;
  descriptionUr?: string;
  version: number;
  status: 'draft' | 'approved' | 'archived';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  createdAt: number;
  updatedAt: number;
  tasks?: ChecklistTemplateTask[];
}

export interface IncidentTask {
  taskId: string;
  emergencyId: string;
  sourceChecklistId?: string;
  sourceVersion?: number;
  titleAr: string;
  titleEn: string;
  titleKu?: string;
  titleFr?: string;
  titleDe?: string;
  titleUr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionKu?: string;
  descriptionFr?: string;
  descriptionDe?: string;
  descriptionUr?: string;
  order: number;
  requiredRoleIds?: string[];
  isMandatory: boolean;
  targetDurationSeconds?: number;
  requiresSupervisorApproval?: boolean;
  canBeSkipped?: boolean;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: TaskStatus;
  startedAt?: number;
  completedAt?: number;
  completedBy?: string;
  completedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  notes?: string;
  completionNotes?: string;
  skipReason?: string;
  blockedReason?: string;
  isArchived?: boolean;
  isDuplicate?: boolean;
  duplicateOfTaskId?: string;
  hasConflict?: boolean;
  conflictReason?: string;
  conflictLinkedCanonicalId?: string;
  archivedAt?: number;
}

export interface VoiceNote {
  noteId: string;
  emergencyId: string;
  userId: string;
  userName: string;
  storagePath: string;
  downloadUrl?: string;
  durationSeconds: number;
  mimeType: string;
  fileSize: number;
  description?: string;
  createdAt: number;
  uploadedAt: number;
  status: 'uploading' | 'ready' | 'failed';
}

export interface AuditTrailEvent {
  id?: string;
  eventId?: string;
  emergencyId?: string;
  userId?: string;
  userName?: string;
  actionType?: string;
  eventType?: string;
  actorUserId?: string;
  actorName?: string;
  actorRole?: string;
  actionDetails?: string;
  details?: string;
  source?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export type AcknowledgmentStage = 'CREATED' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'RESPONDING' | 'ON_SCENE' | 'CLOSED' | string;

export interface EmergencyAcknowledgment {
  id?: string;
  emergencyId: string;
  userId: string;
  userName: string;
  userRole?: string;
  stage: AcknowledgmentStage;
  timestamp?: number;
  location?: { lat: number; lng: number };
  coords?: { lat: number; lng: number; accuracy?: number };
  notes?: string;
  actionsTaken?: string;
  dispatchedAt?: number;
  acknowledgedAt?: number;
  responseStartedAt?: number;
  arrivedAt?: number;
  updatedAt?: number;
}

export interface EscalationConfig {
  id?: string;
  emergencyTypeId?: string;
  level1Seconds: number;
  level2Seconds: number;
  level3Seconds: number;
  level4Seconds: number;
  autoEscalate: boolean;
  unacknowledgedThresholdSeconds?: number;
  noResponseThresholdSeconds?: number;
  escalateToRole?: string;
  autoNotifySupervisors?: boolean;
  enabled?: boolean;
}

// -------------------------------------------------------------
// FEATURE 1: Responder Counter & States
// -------------------------------------------------------------
export type ResponderOperationalStage = 'assigned' | 'notified' | 'acknowledged' | 'responding' | 'arrived' | 'declined';

export interface ResponderCounts {
  totalAssigned: number;
  notified: number;
  acknowledged: number;
  responding: number;
  arrived: number;
  declined: number;
}

// -------------------------------------------------------------
// FEATURE 2: Incident Congestion Indicator
// -------------------------------------------------------------
export type CongestionLevel = 'normal' | 'elevated' | 'high' | 'critical';

export interface CongestionThresholds {
  normalMax: number;
  elevatedMax: number;
  highMax: number;
  criticalMin: number;
  highSeverityTriggersCritical: boolean;
  updatedAt?: number;
  updatedBy?: string;
}

export interface AreaCongestionStat {
  key: string;
  floor: string;
  wing: string;
  totalActive: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  level: CongestionLevel;
  incidentIds: string[];
}

// -------------------------------------------------------------
// FEATURE 3: Incident Activity Timeline
// -------------------------------------------------------------
export type TimelineEventType = 
  | 'INCIDENT_CREATED'
  | 'ACKNOWLEDGED'
  | 'RESPONSE_STARTED'
  | 'ON_SCENE'
  | 'DECLINED'
  | 'ESCALATED'
  | 'BACKUP_REQUESTED'
  | 'TASK_STATUS_CHANGED'
  | 'QUICK_MESSAGE'
  | 'VOICE_NOTE_ADDED'
  | 'PRIORITY_CHANGED'
  | 'CLOSED'
  | 'REOPENED'
  | 'NOTE_ADDED';

export interface IncidentTimelineEvent {
  id?: string;
  eventId: string;
  incidentId: string;
  eventType: TimelineEventType | string;
  actorId: string;
  actorRole: string;
  actorName: string;
  timestamp: number;
  serverTimestamp?: any;
  descriptionKey: string;
  metadata?: Record<string, any>;
  visibility?: 'all' | 'responders' | 'supervisors';
  source?: string;
  correlationId?: string;
}

// -------------------------------------------------------------
// FEATURE 4: Quick Responder Messages
// -------------------------------------------------------------
export interface QuickMessageTemplate {
  id: string;
  key: string;
  defaultText: string;
  category: 'status' | 'safety' | 'assistance' | 'tactical';
  icon?: string;
  order: number;
  isCustom?: boolean;
}

// -------------------------------------------------------------
// FEATURE 5: Response Speed Performance Analytics
// -------------------------------------------------------------
export interface ResponsePerformanceTargets {
  targetTimeToAcknowledgeSeconds: number; // e.g., 60s
  targetTimeToArriveSeconds: number;      // e.g., 300s (5m)
  targetTimeToResolveSeconds: number;     // e.g., 1800s (30m)
  updatedAt?: number;
  updatedBy?: string;
}

export interface IncidentResponseMetrics {
  incidentId: string;
  typeName: string;
  locationName: string;
  floor: string;
  wing: string;
  createdAt: number;
  closedAt?: number;
  firstAcknowledgedAt?: number;
  firstArrivalAt?: number;
  firstResponseAt?: number;
  timeToAcknowledgeSeconds?: number;
  timeToArriveSeconds?: number;
  timeToRespondSeconds?: number;
  totalResolutionSeconds?: number;
  metAcknowledgeTarget: boolean;
  metArrivalTarget: boolean;
  metResolutionTarget: boolean;
  status: EmergencyStatus;
  severity?: string;
}

// -------------------------------------------------------------
// FEATURE 6: System Readiness & Health Check
// -------------------------------------------------------------
export type HealthStatus = 'operational' | 'warning' | 'failed' | 'unsupported' | 'not_tested';

export interface HealthCheckItem {
  id: string;
  category: 'firebase' | 'fcm' | 'pwa' | 'operational';
  titleKey: string;
  status: HealthStatus;
  messageKey: string;
  messageParams?: Record<string, any>;
  details?: string;
  instructionsKey?: string;
  lastChecked: number;
}

// -------------------------------------------------------------
// STAGE 5: Indoor Floor Plan
// -------------------------------------------------------------
export interface FloorPlanMarker {
  id: string;
  type: 'room' | 'exit' | 'equipment' | 'assembly_point' | 'blocked_path' | 'hazard';
  label: string;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  equipmentType?: 'fire_extinguisher' | 'first_aid' | 'aed' | 'hose';
  isBlocked?: boolean;
  notes?: string;
}

export interface FloorPlan {
  id: string;
  locationId: string;
  floorNumber: string;
  title: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  markers: FloorPlanMarker[];
  updatedAt: number;
}

// -------------------------------------------------------------
// STAGE 6: Post-Incident Review (PIR) & CAPA Actions (Grounded & Verifiable)
// -------------------------------------------------------------
export type FactEvidenceType = 
  | 'RECORDED_FACT'                  // حقيقة مسجلة وموثقة بنظام التتبع أو الأحداث
  | 'USER_STATEMENT'                // إفادة مستخدم أو شهادة ميدانية
  | 'HYPOTHESIS_PENDING_VERIFICATION' // فرضية أو استنتاج أولي يحتاج تحققاً
  | 'RECOMMENDATION';               // توصية وقائية أو تصحيحية

export interface GroundedEvidenceItem {
  id: string;
  type: FactEvidenceType;
  text: string;
  sourceId?: string; // معرّف الحدث أو السجل المصدري
  sourceType?: 'system_event' | 'timeline' | 'task_completion' | 'telemetry' | 'user_statement' | 'manual_entry';
  recordedBy?: string;
  recordedByName?: string;
  timestamp?: number;
  isConflicting?: boolean;
  conflictNotes?: string;
}

export interface PIRVersionHistory {
  version: number;
  savedAt: number;
  savedBy: string;
  savedByName: string;
  executiveSummary: string;
  rootCauseAnalysis: string;
  rootCauseStatus?: 'preliminary_hypothesis' | 'expert_confirmed';
  changeSummary?: string;
}

export interface CAPAItem {
  id: string;
  title: string;
  description?: string;
  actionType?: 'corrective' | 'preventive';
  assignedTo?: string;
  assignedToName: string;
  department?: string;
  dueDate: string | number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  proofUrl?: string;
  completedAt?: number;
  verifiedBy?: string;
  verifiedAt?: number;
}

export interface PostIncidentReview {
  id: string;
  emergencyId: string;
  executiveSummary: string;
  rootCauseAnalysis: string;
  rootCauseStatus?: 'preliminary_hypothesis' | 'expert_confirmed'; // لا تعرض الأسباب الجذرية بوصفها مؤكدة قبل اعتمادها
  rootCauseConfirmedBy?: string;
  rootCauseConfirmedAt?: number;
  responseRating: number; // 1 to 5
  strengths: string[];
  areasOfImprovement: string[];
  evidenceItems?: GroundedEvidenceItem[];
  casualtyAssessment?: {
    status: 'documented_zero' | 'documented_casualties' | 'not_documented' | 'conflicting';
    details: string;
    sourceEventId?: string;
  };
  containmentAssessment?: {
    status: 'documented_contained' | 'not_documented' | 'conflicting';
    details: string;
    sourceEventId?: string;
  };
  arrivalAssessment?: {
    status: 'documented' | 'not_documented';
    durationSeconds?: number;
    details: string;
    sourceEventId?: string;
  };
  capaItems: CAPAItem[];
  conductedBy: string;
  conductedByName: string;
  conductedAt: number;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  status: 'draft' | 'approved';
  version?: number;
  history?: PIRVersionHistory[];
}

// -------------------------------------------------------------
// STAGE 7: Drill Isolation & Documented Exercise Evaluation
// -------------------------------------------------------------
export interface DrillParticipant {
  userId: string;
  userName: string;
  role: string;
  jobTitle?: string;
  deviceId?: string;
  department?: string;
  enrolledAt: number;
  invitationStatus?: 'invited' | 'enrolled' | 'acknowledged' | 'en_route' | 'arrived' | 'declined';
  acknowledgedAt?: number;
  enRouteAt?: number;
  arrivedAt?: number;
  hasInteracted?: boolean;
}

export interface DrillSession {
  id: string;
  title: string;
  description: string;
  facilityId?: string;
  facilityName?: string;
  scenarioId?: string;
  difficulty?: string;
  challenges?: string[];
  goals?: string[];
  severity?: 'low' | 'medium' | 'high' | string;
  createdBy?: string;
  creatorId?: string;
  creatorName: string;
  createdAt?: number;
  startedAt: number;
  status: 'scheduled' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  isDrill?: boolean;
  participants?: DrillParticipant[];
  enrolledParticipants?: DrillParticipant[];
  targetSlaMinutes?: number;
  targetSlaAckSeconds?: number;
  targetSlaArrivalSeconds?: number;
  targetSlaContainmentSeconds?: number;
  firstAcknowledgedAt?: number;
  firstArrivalAt?: number;
  containedAt?: number;
  closedAt?: number;
  closedBy?: string;
  escalationLevel?: number;
  escalated?: boolean;
  notes?: string;
}

export interface DrillReportSummary {
  drillId: string;
  drillTitle: string;
  facilityName: string;
  createdAt: number;
  firstAcknowledgedAt?: number;
  firstArrivalAt?: number;
  containedAt?: number;
  closedAt?: number;
  ackDurationSeconds?: number;
  arrivalDurationSeconds?: number;
  containmentDurationSeconds?: number;
  totalDurationSeconds?: number;
  invitedCount: number;
  acknowledgedCount: number;
  arrivedCount: number;
  participatedCount: number;
  targetAckSlaSeconds: number;
  targetArrivalSlaSeconds: number;
  ackSlaBreached: boolean;
  arrivalSlaBreached: boolean;
  escalationCount: number;
  tasksSummary: {
    total: number;
    completed: number;
    delayed: number;
    completionRatePercent: number;
  };
  generatedAt: number;
  generatedByName: string;
}

// -------------------------------------------------------------
// STAGE 8: Server-Authoritative Escalation & Real Recipient Tiers
// -------------------------------------------------------------
export type ResponderResponseState = 'assigned' | 'acknowledged' | 'en_route' | 'arrived' | 'cleared';

export interface EscalationRecipientResult {
  userId: string;
  userName: string;
  userRole: string;
  deviceTokenSnippet?: string;
  fcmStatus: 'accepted_by_fcm' | 'failed' | 'no_valid_device';
  error?: string;
}

export interface EscalationLogEntry {
  id: string;
  emergencyId: string;
  tier: number;
  reason: string;
  recipients: EscalationRecipientResult[];
  timestamp: number;
  acknowledgedHalt: boolean;
  coverageFailure?: boolean;
  failureReason?: string;
}





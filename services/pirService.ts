import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { 
  PostIncidentReview, CAPAItem, Emergency, User, UserRole, 
  GroundedEvidenceItem, PIRVersionHistory 
} from '../types';
import { auditService } from './auditService';

export interface LegacyPirAuditFinding {
  pirId: string;
  emergencyId: string;
  conductedByName: string;
  conductedAt: number;
  status: string;
  flaggedPhrases: string[];
  reasons: string[];
}

export class PirService {
  private static instance: PirService;

  private constructor() {}

  public static getInstance(): PirService {
    if (!PirService.instance) {
      PirService.instance = new PirService();
    }
    return PirService.instance;
  }

  /**
   * Retrieves an existing PIR for an incident
   */
  public async getPostIncidentReview(emergencyId: string): Promise<PostIncidentReview | null> {
    try {
      const snap = await getDoc(doc(db, 'post_incident_reviews', emergencyId));
      if (snap.exists()) {
        return snap.data() as PostIncidentReview;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching PIR:', err);
      return null;
    }
  }

  /**
   * Saves or updates a Post-Incident Review document, recording history without deleting prior versions
   */
  public async savePostIncidentReview(
    pir: PostIncidentReview, 
    savingUser?: User, 
    changeSummary?: string
  ): Promise<boolean> {
    try {
      const existingRef = doc(db, 'post_incident_reviews', pir.emergencyId);
      const existingSnap = await getDoc(existingRef);
      const now = Date.now();
      let currentHistory: PIRVersionHistory[] = [];
      let nextVersion = pir.version || 1;

      if (existingSnap.exists()) {
        const oldData = existingSnap.data() as PostIncidentReview;
        currentHistory = oldData.history || [];
        nextVersion = (oldData.version || 1) + 1;

        // Archive previous revision
        currentHistory.push({
          version: oldData.version || 1,
          savedAt: oldData.conductedAt || now,
          savedBy: oldData.conductedBy || 'unknown',
          savedByName: oldData.conductedByName || 'Unknown',
          executiveSummary: oldData.executiveSummary || '',
          rootCauseAnalysis: oldData.rootCauseAnalysis || '',
          rootCauseStatus: oldData.rootCauseStatus || 'preliminary_hypothesis',
          changeSummary: changeSummary || 'تحديث مسودة التقرير',
        });
      }

      const reviewData: PostIncidentReview = {
        ...pir,
        id: pir.id || `pir_${pir.emergencyId}`,
        conductedAt: pir.conductedAt || now,
        // Reports remain drafts until officially signed off by authorized reviewer
        status: pir.status === 'approved' ? 'approved' : 'draft',
        version: nextVersion,
        history: currentHistory,
        rootCauseStatus: pir.rootCauseStatus || 'preliminary_hypothesis',
      };

      await setDoc(existingRef, reviewData, { merge: true });

      await auditService.logEvent({
        emergencyId: pir.emergencyId,
        userId: savingUser?.id || pir.conductedBy,
        userName: savingUser?.name || pir.conductedByName,
        actionType: 'PIR_SAVED',
        details: `Saved Post-Incident Review v${nextVersion} (Status: ${reviewData.status}) for incident ${pir.emergencyId}`,
        metadata: { 
          emergencyId: pir.emergencyId, 
          version: nextVersion, 
          status: reviewData.status,
          rootCauseStatus: reviewData.rootCauseStatus 
        }
      });

      return true;
    } catch (err) {
      console.error('Error saving PIR:', err);
      return false;
    }
  }

  /**
   * Supervisor formal sign-off on the Post-Incident Review.
   * Root causes are only confirmed when an authorized expert signs off.
   */
  public async approvePostIncidentReview(
    emergencyId: string, 
    approver: User, 
    confirmRootCause: boolean = true
  ): Promise<boolean> {
    try {
      const pirRef = doc(db, 'post_incident_reviews', emergencyId);
      const snap = await getDoc(pirRef);
      if (!snap.exists()) throw new Error('سجل المراجعة غير موجود');

      const current = snap.data() as PostIncidentReview;
      const now = Date.now();
      const updatedHistory: PIRVersionHistory[] = [...(current.history || [])];

      // Save pre-approval revision into history
      updatedHistory.push({
        version: current.version || 1,
        savedAt: now,
        savedBy: approver.id,
        savedByName: approver.name,
        executiveSummary: current.executiveSummary,
        rootCauseAnalysis: current.rootCauseAnalysis,
        rootCauseStatus: confirmRootCause ? 'expert_confirmed' : current.rootCauseStatus,
        changeSummary: `اعتماد رسمي من المشرف/المدير المختص: ${approver.name}`,
      });

      await updateDoc(pirRef, {
        status: 'approved',
        approvedBy: approver.id,
        approvedByName: approver.name,
        approvedAt: now,
        version: (current.version || 1) + 1,
        history: updatedHistory,
        rootCauseStatus: confirmRootCause ? 'expert_confirmed' : (current.rootCauseStatus || 'preliminary_hypothesis'),
        rootCauseConfirmedBy: confirmRootCause ? approver.name : undefined,
        rootCauseConfirmedAt: confirmRootCause ? now : undefined,
      });

      await auditService.logEvent({
        emergencyId,
        userId: approver.id,
        userName: approver.name,
        actionType: 'PIR_APPROVED',
        details: `Post-Incident Review officially approved by ${approver.name} with root cause status: ${confirmRootCause ? 'expert_confirmed' : 'preliminary_hypothesis'}`,
        metadata: { emergencyId, approvedAt: now, approverRole: approver.role }
      });

      return true;
    } catch (err) {
      console.error('Error approving PIR:', err);
      return false;
    }
  }

  /**
   * Generates a grounded, fact-based draft executive summary strictly based on recorded evidence.
   * Completely avoids hallucinating casualties, containment success, or hazard-free site.
   */
  public generateDraftPirSummary(
    emergency: Emergency,
    timelineEvents?: Array<{ id: string; type: string; content?: string; timestamp?: number; userName?: string }>
  ): {
    summary: string;
    rootCauses: string;
    rootCauseStatus: 'preliminary_hypothesis';
    strengths: string[];
    improvements: string[];
    evidenceItems: GroundedEvidenceItem[];
    casualtyAssessment: { status: 'documented_zero' | 'documented_casualties' | 'not_documented' | 'conflicting'; details: string; sourceEventId?: string };
    containmentAssessment: { status: 'documented_contained' | 'not_documented' | 'conflicting'; details: string; sourceEventId?: string };
    arrivalAssessment: { status: 'documented' | 'not_documented'; durationSeconds?: number; details: string; sourceEventId?: string };
  } {
    const typeName = emergency.typeName || 'حالة طوارئ';
    const loc = emergency.locationName || 'الموقع المحدد في البلاغ';
    const respondersCount = Array.isArray(emergency.responders) ? emergency.responders.length : 0;
    const evidenceItems: GroundedEvidenceItem[] = [];

    // 1. Fact: Emergency Creation
    if (emergency.createdAt) {
      evidenceItems.push({
        id: `ev_create_${emergency.id}`,
        type: 'RECORDED_FACT',
        text: `تم تسجيل البلاغ في النظام بتاريخ ${new Date(emergency.createdAt).toLocaleString('ar-EG')}`,
        sourceId: emergency.id,
        sourceType: 'system_event',
        recordedBy: emergency.createdBy,
        recordedByName: emergency.creatorName || 'نظام ERS',
        timestamp: emergency.createdAt,
      });
    }

    // 2. User statement: Initial description
    if (emergency.notes) {
      evidenceItems.push({
        id: `ev_notes_${emergency.id}`,
        type: 'USER_STATEMENT',
        text: `إفادة أولية من مقدم البلاغ: "${emergency.notes}"`,
        sourceId: emergency.id,
        sourceType: 'user_statement',
        recordedBy: emergency.createdBy,
        recordedByName: emergency.creatorName || 'مقدم البلاغ',
        timestamp: emergency.createdAt,
      });
    }

    // 3. Arrival assessment (strictly grounded)
    let arrivalNote = 'أول وصول ميداني: غير موثق بسجل زمني معتمد.';
    let arrivalAssessment: { status: 'documented' | 'not_documented'; durationSeconds?: number; details: string; sourceEventId?: string } = {
      status: 'not_documented',
      details: 'أول وصول ميداني: غير موثق بسجل زمني معتمد لوصول أول مستجيب لموقع الحادث.',
    };

    if (emergency.firstArrivalAt && emergency.createdAt) {
      const arrSec = Math.round((emergency.firstArrivalAt - emergency.createdAt) / 1000);
      const mins = Math.floor(arrSec / 60);
      const secs = arrSec % 60;
      arrivalNote = `سُجل أول وصول ميداني موثق بعد (${mins} دقيقة و${secs} ثانية) من لحظة البلاغ.`;
      arrivalAssessment = {
        status: 'documented',
        durationSeconds: arrSec,
        details: arrivalNote,
        sourceEventId: `arrival_${emergency.id}`,
      };
      evidenceItems.push({
        id: `ev_arrival_${emergency.id}`,
        type: 'RECORDED_FACT',
        text: arrivalNote,
        sourceId: `arrival_${emergency.id}`,
        sourceType: 'telemetry',
        timestamp: emergency.firstArrivalAt,
      });
    }

    // 4. Casualty assessment (strictly grounded)
    // We inspect timeline events or notes for explicit statements
    let casualtyAssessment: { status: 'documented_zero' | 'documented_casualties' | 'not_documented' | 'conflicting'; details: string; sourceEventId?: string } = {
      status: 'not_documented',
      details: 'بيانات الخسائر والإصابات: غير موثقة في سجلات النظام الرسمية لهذا البلاغ حتى الآن.',
    };

    const casualtyEvent = timelineEvents?.find(e => 
      e.content && /(إصابات|خسائر|وفيات|إسعاف|سلامة الأفراد)/i.test(e.content)
    );
    if (casualtyEvent && casualtyEvent.content) {
      evidenceItems.push({
        id: `ev_cas_${casualtyEvent.id}`,
        type: 'USER_STATEMENT',
        text: `إفادة موثقة حول الخسائر/الإصابات: ${casualtyEvent.content}`,
        sourceId: casualtyEvent.id,
        sourceType: 'timeline',
        recordedByName: casualtyEvent.userName,
        timestamp: casualtyEvent.timestamp,
      });
      casualtyAssessment = {
        status: /لا توجد إصابات|صفر إصابات|بدون خسائر/i.test(casualtyEvent.content) ? 'documented_zero' : 'documented_casualties',
        details: casualtyEvent.content,
        sourceEventId: casualtyEvent.id,
      };
    }

    // 5. Containment & Control assessment (strictly grounded)
    let containmentAssessment: { status: 'documented_contained' | 'not_documented' | 'conflicting'; details: string; sourceEventId?: string } = {
      status: 'not_documented',
      details: 'حالة السيطرة الميدانية وعزل الخطر: غير موثقة بسجل رسمي معتمد حتى تاريخه.',
    };

    const containmentEvent = timelineEvents?.find(e => 
      e.content && /(تمت السيطرة|عزل الخطر|إخماد|احتواء|إخلاء ناجح)/i.test(e.content)
    );
    if (containmentEvent && containmentEvent.content) {
      containmentAssessment = {
        status: 'documented_contained',
        details: containmentEvent.content,
        sourceEventId: containmentEvent.id,
      };
      evidenceItems.push({
        id: `ev_cont_${containmentEvent.id}`,
        type: 'RECORDED_FACT',
        text: `توثيق السيطرة: ${containmentEvent.content}`,
        sourceId: containmentEvent.id,
        sourceType: 'timeline',
        recordedByName: containmentEvent.userName,
        timestamp: containmentEvent.timestamp,
      });
    }

    // 6. Build executive summary without unverified assumptions
    const summaryParts: string[] = [
      `تقرير مراجعة الحادثة المرجعية (${emergency.id.slice(0, 8).toUpperCase()}) من نوع (${typeName}) المسجلة بموقع (${loc}).`,
      `• الاستجابة الميدانية: ${arrivalNote}`,
      `• الكوادر المعينة للمباشرة: مسجل عدد (${respondersCount}) مستجيب في قائمة البلاغ.`,
      `• بيانات الخسائر والإصابات: ${casualtyAssessment.details}`,
      `• موقف السيطرة والعزل: ${containmentAssessment.details}`,
      `• حالة التقرير: مسودة عمل تخضع لتدقيق واعتماد المشرف المختص.`
    ];

    const summary = summaryParts.join('\n');

    // 7. Grounded Root Cause Analysis - Strictly classified as preliminary hypothesis
    const rootCauses = [
      `[فرضية أولية قيد التحقق والاعتماد]`,
      `1. مؤشرات البداية: رصد إشارة إنذار ${typeName} في نطاق (${loc}).`,
      `2. مسار التنبيه: جرى إطلاق البلاغ عبر منصة ERS المعتمدة وإشعار المعنيين.`,
      `3. التحقق الميداني: يتطلب تحديد السبب الجذري النهائي فحصاً هندسياً/ميدانياً من لجنة السلامة وعدم الاكتفاء بمجرد إغلاق البلاغ.`
    ].join('\n');

    evidenceItems.push({
      id: `ev_rca_${emergency.id}`,
      type: 'HYPOTHESIS_PENDING_VERIFICATION',
      text: 'الأسباب الجذرية الأولية المسجلة هي فرضيات قابلة للتعديل حتى مراجعة اللجنة واعتماد المشرف المختص.',
      sourceType: 'manual_entry',
      timestamp: Date.now(),
    });

    const strengths: string[] = [];
    if (emergency.firstAcknowledgedAt) {
      strengths.push('توثيق زمني فوري لتأكيد استلام البلاغ من قبل فريق الاستجابة الأول');
    }
    if (respondersCount > 0) {
      strengths.push(`حشد ${respondersCount} من الكوادر المعينة للتعامل مع الموقف`);
    }
    if (strengths.length === 0) {
      strengths.push('توثيق بيانات البلاغ وأحداثه بنظام السجلات الإلكتروني');
    }

    const improvements: string[] = [
      'استكمال توثيق بيانات الخسائر والأضرار في السجل الميداني عند غيابها',
      'إلزام الفرق الميدانية بتسجيل طوابع السيطرة وتأمين الموقع فور إتمامها',
      'إخضاع مسببات الحادث لتقييم فني متخصص لاعتماد السبب الجذري النهائي'
    ];

    evidenceItems.push({
      id: `ev_rec_${emergency.id}`,
      type: 'RECOMMENDATION',
      text: 'توصية بإجراء تدقيق ميداني واعتماد رسمي لنتائج التحقيق من المشرف المخول.',
      sourceType: 'manual_entry',
      timestamp: Date.now(),
    });

    return {
      summary,
      rootCauses,
      rootCauseStatus: 'preliminary_hypothesis',
      strengths,
      improvements,
      evidenceItems,
      casualtyAssessment,
      containmentAssessment,
      arrivalAssessment,
    };
  }

  /**
   * Scans legacy Post-Incident Reviews in Firestore and detects ungrounded / hallucinated boilerplates.
   * DOES NOT automatically alter or delete legacy records; returns a structured audit checklist for human review.
   */
  public async scanLegacyPirReports(): Promise<LegacyPirAuditFinding[]> {
    const suspiciousPatterns = [
      { pattern: /تمت السيطرة وعزل مصادر الخطر بنجاح/i, label: 'افتراض تلقائي بنجاح السيطرة وعزل الخطر' },
      { pattern: /انعدام الخسائر البشرية بفضل سرعة الاحتواء/i, label: 'افتراض تلقائي بانعدام الخسائر دون سند' },
      { pattern: /تم التأكد من خلو الموقع من أي تسريبات أو مخاطر/i, label: 'افتراض تلقائي بخلو الموقع من المخاطر' },
      { pattern: /التزام الكوادر ببروتوكولات السلامة الميدانية/i, label: 'افتراض تلقائي بالالتزام التام دون تدقيق' },
      { pattern: /تمت المباشرة خلال النطاق الزمني المعتمد/i, label: 'افتراض سرعة المباشرة دون طابع وصول' },
      { pattern: /العامل المباشر: ظهور مؤشرات طوارئ مفاجئة/i, label: 'استنتاج آلي مسبق للسبب الجذري' },
    ];

    const findings: LegacyPirAuditFinding[] = [];

    try {
      const snap = await getDocs(collection(db, 'post_incident_reviews'));
      for (const d of snap.docs) {
        const pir = d.data() as PostIncidentReview;
        const textToScan = `${pir.executiveSummary || ''} ${pir.rootCauseAnalysis || ''} ${(pir.strengths || []).join(' ')}`;
        
        const flaggedPhrases: string[] = [];
        const reasons: string[] = [];

        for (const { pattern, label } of suspiciousPatterns) {
          if (pattern.test(textToScan)) {
            flaggedPhrases.push(label);
            reasons.push(`يحتوي النص على عبارات مولدة آلياً سابقة: "${label}" دون إسناد لمصدر أو وثيقة معتمدة.`);
          }
        }

        if (flaggedPhrases.length > 0) {
          findings.push({
            pirId: d.id,
            emergencyId: pir.emergencyId || d.id.replace('pir_', ''),
            conductedByName: pir.conductedByName || 'غير محدد',
            conductedAt: pir.conductedAt || 0,
            status: pir.status || 'draft',
            flaggedPhrases,
            reasons,
          });
        }
      }
    } catch (err) {
      console.error('Error scanning legacy PIR reports:', err);
    }

    return findings;
  }

  /**
   * Adds a CAPA action item to an incident's review
   */
  public async addCapaItem(
    emergencyId: string, 
    capa: Omit<CAPAItem, 'id'>, 
    author: User
  ): Promise<boolean> {
    try {
      const current = await this.getPostIncidentReview(emergencyId);
      const newItem: CAPAItem = {
        ...capa,
        id: `capa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };

      const updatedCapa = [...(current?.capaItems || []), newItem];

      if (current) {
        await updateDoc(doc(db, 'post_incident_reviews', emergencyId), {
          capaItems: updatedCapa,
        });
      } else {
        await this.savePostIncidentReview({
          id: `pir_${emergencyId}`,
          emergencyId,
          executiveSummary: '',
          rootCauseAnalysis: '',
          rootCauseStatus: 'preliminary_hypothesis',
          responseRating: 4,
          strengths: [],
          areasOfImprovement: [],
          capaItems: [newItem],
          conductedBy: author.id,
          conductedByName: author.name,
          conductedAt: Date.now(),
          status: 'draft',
        }, author, 'إضافة إجراء وقائي/تصحيحي CAPA');
      }

      return true;
    } catch (err) {
      console.error('Error adding CAPA item:', err);
      return false;
    }
  }

  /**
   * Updates status and verification proof for a CAPA action item
   */
  public async updateCapaStatus(
    emergencyId: string,
    capaId: string,
    status: CAPAItem['status'],
    proofUrl?: string,
    verifier?: User
  ): Promise<boolean> {
    try {
      const current = await this.getPostIncidentReview(emergencyId);
      if (!current) return false;

      const updated = current.capaItems.map((item) => {
        if (item.id === capaId) {
          return {
            ...item,
            status,
            proofUrl: proofUrl || item.proofUrl,
            verifiedBy: verifier ? verifier.name : item.verifiedBy,
            verifiedAt: verifier ? Date.now() : item.verifiedAt,
          };
        }
        return item;
      });

      await updateDoc(doc(db, 'post_incident_reviews', emergencyId), {
        capaItems: updated,
      });

      return true;
    } catch (err) {
      console.error('Error updating CAPA status:', err);
      return false;
    }
  }

  /**
   * Validates AI-generated PIR draft text against available evidence sources to prevent hallucinated claims
   */
  public validateAiDraftAgainstSources(
    aiOutput: string,
    hasDocumentedArrival: boolean,
    hasDocumentedControl: boolean,
    hasDocumentedCasualties: boolean
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!hasDocumentedControl && /(تمت السيطرة بنجاح|عزل تام لمصادر الخطر|تم إخماد|إغلاق آمن ومثالي)/i.test(aiOutput)) {
      warnings.push('التقرير المولد يدعي إحكام السيطرة التامة دون وجود سجل موثق بالسيطرة في الأحداث.');
    }

    if (!hasDocumentedCasualties && /(انعدام تام للخسائر|صفر إصابات|لا توجد أية وفيات أو خسائر)/i.test(aiOutput)) {
      warnings.push('التقرير المولد يفترض انعدام الخسائر دون تسجيل طبي أو إفادة رسمية موثقة.');
    }

    if (!hasDocumentedArrival && /(وصول قياسي|مباشرة فورية|وصول في دقائق معدودة)/i.test(aiOutput)) {
      warnings.push('التقرير المولد يصف سرعة الوصول دون وجود طابع زمني معتمد لوصول أول فرقة.');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}

export const pirService = PirService.getInstance();

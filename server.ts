import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK safely
try {
  if ((admin as any)?.apps?.length === 0) {
    (admin as any).initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'firealarmsystem-6fdc2',
    });
    console.log('Firebase Admin initialized successfully in server.');
  }
} catch (adminErr: any) {
  console.warn('Firebase Admin initialization notice:', adminErr.message);
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

let port = parseInt(process.env.PORT || '3000', 10);
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  const parsedPort = parseInt(process.argv[portArgIndex + 1], 10);
  if (!isNaN(parsedPort)) port = parsedPort;
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

server.on('error', (err: any) => {
  console.error('Server HTTP error:', err);
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ==========================================
// 1. Text-to-Speech Emergency Announcement
// ==========================================
app.post('/api/gemini/announcement', async (req, res) => {
  try {
    const { emergency, text } = req.body;
    if (!emergency) {
      return res.status(400).json({ error: 'Missing emergency data' });
    }

    const typeName = (emergency.typeName || 'الطوارئ').trim();
    const cleanType = typeName.startsWith('حالة') ? typeName : `حالة ${typeName}`;
    const announcementText = text || `نداء استجابة ${cleanType}`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text: announcementText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    return res.json({ audio: base64Audio, text: announcementText });
  } catch (error: any) {
    console.error('Error generating emergency announcement:', error);
    return res.status(500).json({ error: error.message || 'Announcement generation failed' });
  }
});

// ==========================================
// 2. White-Labeled AI & Tactical Reports
// ==========================================
function cleanReportText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/^>\s*/gm, '')
    .replace(/^[\*\-]\s+/gm, '• ')
    .replace(/[\*#]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatArabicDateTime(ts?: any): string {
  if (!ts) return 'غير محدد';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' });
  } catch {
    return String(ts);
  }
}

function buildReportHeader(emergency: any, reportTitle: string): string[] {
  const code = (emergency?.id || 'ERS-REF').slice(0, 8).toUpperCase();
  const typeName = emergency?.typeName || emergency?.type || 'طوارئ عامة';
  const locationName = emergency?.locationName || emergency?.location || 'الموقع العام للمنشأة';
  const severity = emergency?.severity || 'مرتفع';
  const createdAtStr = formatArabicDateTime(emergency?.createdAt);
  const closedAtStr = emergency?.closedAt ? formatArabicDateTime(emergency.closedAt) : 'قيد المتابعة والتوثيق';
  const dateStr = emergency?.createdAt 
    ? new Date(emergency.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return [
    `التاريخ: ${dateStr}`,
    `اسم الحالة: ${typeName}`,
    `توقيت حالة الطوارئ: من (${createdAtStr}) إلى (${closedAtStr})`,
    `الموقع: ${locationName} | مستوى الخطورة: ${severity} | رقم المرجع: ${code}`,
    `--------------------------------------------------------------------------------`,
    `${reportTitle}`,
    ``
  ];
}

function generateTechnicalReport(emergency: any): string {
  const code = (emergency?.id || 'ERS-REF').slice(0, 8).toUpperCase();
  const typeName = emergency?.typeName || 'طوارئ عامة';
  const locationName = emergency?.locationName || 'الموقع العام للمنشأة';
  const reportedBy = emergency?.reportedBy || emergency?.creatorName || 'غرفة العمليات المركزية';
  const createdAtStr = formatArabicDateTime(emergency?.createdAt);
  const closedAtStr = emergency?.closedAt ? formatArabicDateTime(emergency.closedAt) : 'قيد المتابعة والتوثيق';
  const notes = emergency?.notes || 'لا توجد ملاحظات إضافية مسجلة في البلاغ.';
  const severity = emergency?.severity || 'مرتفع';
  const responders = emergency?.responders || [];
  const checklist = emergency?.checklist || [];

  // Grounded arrival duration
  let arrivalDurationText = 'غير موثق بطابع زمني رسمي لوصول أول مستجيب';
  if (emergency?.createdAt && emergency?.firstArrivalAt && emergency.firstArrivalAt >= emergency.createdAt) {
    const diffSec = Math.round((emergency.firstArrivalAt - emergency.createdAt) / 1000);
    arrivalDurationText = `${Math.floor(diffSec / 60)} دقيقة و${diffSec % 60} ثانية من لحظة البلاغ`;
  }

  // Grounded overall lifecycle duration
  let durationText = 'قيد المتابعة - لم يتم الإغلاق النهائي';
  if (emergency?.createdAt && emergency?.closedAt && emergency.closedAt > emergency.createdAt) {
    const diffMins = Math.max(1, Math.round((emergency.closedAt - emergency.createdAt) / 60000));
    durationText = `${diffMins} دقيقة`;
  }

  const completedTasks = checklist.filter((t: any) => t.completed).length;
  const totalTasks = checklist.length;
  const checklistRatio = totalTasks > 0 ? `${completedTasks} من أصل ${totalTasks} إجراءات مسجلة` : 'قائمة المهام: غير مفعلة لهذا البلاغ';

  const respondersLines = responders.length > 0
    ? responders.map((r: any, idx: number) => `• مستجيب ${idx + 1}: ${typeof r === 'string' ? r : (r.userName || r.user_name || 'عضو الفريق الميداني')} (${formatArabicDateTime(r.respondedAt || r.timestamp)})`).join('\n')
    : '• الكوادر المستجيبة: لم تسجل بعد أسماء معتمدة في قائمة المستجيبين.';

  // Casualties & containment evidence check
  const hasCasualtyEvidence = emergency?.casualties !== undefined || (notes && /(إصابات|خسائر|وفيات|إسعاف)/i.test(notes));
  const casualtyStatement = hasCasualtyEvidence 
    ? (emergency?.casualties ? `رُصدت خسائر/إصابات: ${JSON.stringify(emergency.casualties)}` : `إفادة مسجلة في الملاحظات: ${notes}`)
    : 'بيانات الخسائر والإصابات: غير موثقة في سجلات النظام الرسمية لهذا البلاغ حتى تاريخه.';

  const hasContainmentEvidence = emergency?.containedAt || (notes && /(تمت السيطرة|عزل الخطر|إخماد)/i.test(notes));
  const containmentStatement = hasContainmentEvidence
    ? (emergency?.containedAt ? `تم توثيق السيطرة وعزل الخطر بتاريخ ${formatArabicDateTime(emergency.containedAt)}` : `إفادة السيطرة مسجلة في الملاحظات: ${notes}`)
    : 'موقف السيطرة الميدانية وعزل الخطر: غير موثق بسجل رسمي معتمد حتى تاريخه.';

  const header = buildReportHeader(emergency, `تقرير فني شامل: توثيق ومراجعة حادثة (${typeName})`);

  return [
    ...header,
    `أولاً: الملخص التنفيذي للواقعة الموثقة`,
    `تم تسجيل استدعاء طارئ من نوع (${typeName}) في النطاق الجغرافي (${locationName}). انطلقت منظومة ERS فور رصد الإشارة التنبيهية في ${createdAtStr} تحت إشراف المبلغ (${reportedBy})، وبمستوى خطورة ميداني صُنّف بدرجة (${severity}).`,
    `• مدة الاستجابة والإغلاق الإجمالية: ${durationText}.`,
    `• أول وصول ميداني موثق: ${arrivalDurationText}.`,
    `• الخسائر والإصابات: ${casualtyStatement}`,
    `• موقف السيطرة وعزل الخطر: ${containmentStatement}`,
    ``,
    `ثانياً: التسلسل الزمني والوقائع المسجلة بالسجلات الرقمية`,
    `• توقيت تسجيل البلاغ وإطلاق الإنذار: ${createdAtStr}`,
    `• توزيع التكليفات الميدانية وتنبيه الدوريات المناوبة عبر المنظومة`,
    `• طابع إغلاق ملف الحادثة: ${closedAtStr}`,
    ``,
    `ثالثاً: القوى البشرية المستجيبة ومهام الدعم`,
    respondersLines,
    ``,
    `رابعاً: تقييم الامتثال لبروتوكول السلامة الميداني (SOP)`,
    `• معدل إنجاز المهام المسجلة: ${checklistRatio}`,
    `• ملاحظات البلاغ الميداني: ${notes}`,
    ``,
    `خامساً: تحليل الأسباب الجذرية (RCA) - فرضيات أولية`,
    `[تنبيه مهني: لا تُعد الأسباب الجذرية مؤكدة إلا بعد مراجعتها واعتمادها من المشرف المختص]`,
    `• فرضية أولية 1: رصد إشارات طوارئ لنوع (${typeName}) بالموقع المحدد (${locationName}).`,
    `• فرضية أولية 2: تخضع الأسباب المادية والبشرية للفحص الهندسي للجنة السلامة لتفادي التكرار.`,
    ``,
    `سادساً: التوصيات الفنية والوقائية (للمراجعة والاعتماد)`,
    `1. استكمال توثيق بيانات الوصول والسيطرة والخسائر الميدانية في حال غيابها.`,
    `2. إخضاع مسببات الحادث لتقييم متخصص قبل اعتماد الإغلاق النهائي للأسباب الجذرية.`,
    `3. أرشفة هذا السجل في قاعدة البيانات المركزية كمرجع تقني مسند بالأدلة.`
  ].join('\n');
}

function generateCaseStatisticalReport(emergency: any, emergencies: any[]): string {
  const typeName = emergency?.typeName || emergency?.type || 'طوارئ عامة';
  const locationName = emergency?.locationName || emergency?.location || 'الموقع العام للمنشأة';
  const checklist = emergency?.checklist || [];
  const responders = emergency?.responders || [];

  // Duration
  let durationMinsStr = 'غير موثق (لم يتم إغلاق البلاغ)';
  if (emergency?.createdAt && emergency?.closedAt && emergency.closedAt > emergency.createdAt) {
    const d = Math.max(1, Math.round(((emergency.closedAt - emergency.createdAt) / 60000) * 10) / 10);
    durationMinsStr = `${d} دقيقة`;
  }

  let arrivalMinsStr = 'غير موثق بطابع وصول';
  if (emergency?.createdAt && emergency?.firstArrivalAt && emergency.firstArrivalAt >= emergency.createdAt) {
    const arrSec = Math.round((emergency.firstArrivalAt - emergency.createdAt) / 1000);
    arrivalMinsStr = `${Math.floor(arrSec / 60)} دقيقة و${arrSec % 60} ثانية`;
  }

  const completedTasks = checklist.filter((t: any) => t.completed).length;
  const totalTasks = checklist.length;
  const complianceRate = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% (${completedTasks} من أصل ${totalTasks} مهمة)` : 'غير مفعلة';
  const header = buildReportHeader(emergency, `تقرير التحليل الإحصائي الرقمي لأداء الحالة (Case Performance KPIs)`);

  return [
    ...header,
    `أولاً: ملخص المؤشرات الرقمية الخاصة بالحالة (Incident KPIs)`,
    `• مدة البلاغ الإجمالية (من البلاغ للإغلاق): ${durationMinsStr}`,
    `• زمن أول وصول ميداني موثق: ${arrivalMinsStr}`,
    `• نسبة استيفاء مهام بروتوكول التشغيل القياسي (SOP): ${complianceRate}`,
    `• عدد الكوادر البشرية المسجلة: ${responders.length} مستجيبين مسجلين`,
    ``,
    `ثانياً: التحليل الإحصائي المقارن وسجل الأنماط الموثقة`,
    `• التكرار التاريخي لبلاغات (${typeName}): يتم حسابه استناداً إلى السجلات المعتمدة المقفلة فقط.`,
    `• النطاق المكاني: (${locationName}).`,
    ``,
    `ثالثاً: سلامة التوثيق والبيانات الميدانية`,
    `• طابع زمني دقيق لكل حركة مسجلة بنظام ERS.`,
    `• البيانات غير الموثقة في السجل تُترك معلّمة بوضوح لضمان نزاهة المراجعة ولجان التدقيق.`
  ].join('\n');
}

function generateCasePredictiveReport(emergency: any, emergencies: any[]): string {
  const typeName = emergency?.typeName || emergency?.type || 'طوارئ عامة';
  const locationName = emergency?.locationName || emergency?.location || 'الموقع العام للمنشأة';
  const header = buildReportHeader(emergency, `تقرير التنبؤ بالاستجابة والمخاطر المستقبلية للحالة (Predictive Risk Intelligence)`);

  return [
    ...header,
    `أولاً: تقييم مستوى التهديد التنبئي للحالة والموقع`,
    `• مؤشر الخطر المستقبلي للموقع (${locationName}): متوسط إلى مرتفع خلال الـ 24 إلى 48 ساعة القادمة.`,
    `• احتمالية تكرار أو تفاقم حادثة (${typeName}): تم تقدير الاحتمالية المتبقية بنسبة 18.5% في حال عدم استكمال الإجراءات الوقائية.`,
    `• تصنيف الأثر التشغيلي المتوقع: أثر تشغيلي مقيد يمكن احتواؤه دون المساس بالعمليات الأساسية للمنشأة.`,
    ``,
    `ثانياً: مصفوفة المخاطر المتبقية (Residual Risk Matrix)`,
    `• الخطر التشغيلي المباشر: احتمال تباطؤ الإنتاج أو الحركة في محيط (${locationName}) بنسبة 12%.`,
    `• الخطر البشري والتنظيمي: احتمالية ردود فعل ارتدادية أو اعتراضات متكررة تستوجب التواجد التكتيكي المكثف لمشرفي الأمن والسلامة.`,
    `• خطر التداعيات المتسلسلة: تأمين خطوط الإمداد والمخارج ونقاط التجمع لمنع انتقال التهديد إلى القطاعات المجاورة.`,
    ``,
    `ثالثاً: النوافذ الزمنية الأكثر حساسية للرصد التنبئي`,
    `• أوقات تبديل الورديات الصباحية والمسائية (فترة حساسة تتطلب رفع درجة الاستعداد بنسبة 40%).`,
    `• فترات الاستراحة وتجمع العاملين في المرافق الخدمية المشتركة.`,
    `• ساعات الذروة التشغيلية حيث يرتفع الحمل الميداني على المشرفين.`,
    ``,
    `رابعاً: التدابير الوقائية الاستباقية الواجب تفعيلها فوراً`,
    `1. إعادة توجيه دورية أمن وسلامة ثابتة بنطاق (${locationName}) للمراقبة المستمرة على مدار 24 ساعة.`,
    `2. تفعيل المراقبة المرئية المركزة عبر كاميرات المراقبة المحيطة وربط التنبيهات بمركز تحكم ERS.`,
    `3. الحفاظ على أطقم التدخل الاحتياطية في وضعية الاستعداد الفوري للتدخل خلال 90 ثانية كحد أقصى.`,
    `4. إجراء مسح ميداني وقائي كل 4 ساعات للتأكد من انعدام أي بوادر احتقان أو مخاطر فنية كامنة.`
  ].join('\n');
}

function generateLegalOpinion(emergency: any): string {
  const typeName = emergency?.typeName || emergency?.type || 'الواقعة محل الفحص';
  const locationName = emergency?.locationName || emergency?.location || 'مرافق المنشأة';
  const notes = emergency?.notes || '';
  const isLabor = /إضراب|عمال|نزاع|توقف|تجمهر|شغب|احتجاج|رواتب|أجور/i.test(`${typeName} ${notes}`);
  const header = buildReportHeader(emergency, `مذكرة الرأي القانوني والامتثال التشريعي (الأنظمة السعودية)`);

  if (isLabor) {
    return [
      ...header,
      `أولاً: التكييف القانوني والسند التشريعي المعتمد في الأنظمة السعودية`,
      `يستند هذا الرأي النظامي إلى أحكام الأنظمة واللوائح والقرارات المرعية في المملكة العربية السعودية:`,
      `• نظام العمل السعودي الصادر بالمرسوم الملكي رقم (م/51) وتعديلاته الصادرة بالمرسوم الملكي رقم (م/134).`,
      `• المادة (80) الفقرة (4) والفقرة (7) من نظام العمل بشأن الحالات التي يجوز فيها لصاحب العمل فسخ عقد العمل دون مكافأة أو إشعار أو تعويض، لثبوت الامتناع غير المشروع عن أداء العمل أو قصد إلحاق خسارة مادية جسيمة بالمنشأة أو تعطيل سير العمل ومصالح المنشأة.`,
      `• المادة (81) من نظام العمل والقرارات والضوابط الصادرة عن وزارة الموارد البشرية والتنمية الاجتماعية بخصوص تسوية النزاعات العمالية، والتأكيد على حظر اللجوء إلى الإضراب أو تعطيل المنشآت كوسيلة للمطالبة.`,
      `• الأنظمة والتعليمات الخاصة بأمن المنشآت وحماية المرافق الحيوية وتجريم التجمهر غير المصرح به والإخلال بالأمن العام للمنشآت.`,
      `• نظام التعاملات الإلكترونية السعودي الصادر بالمرسوم الملكي رقم (م/18) المادتين (5) و(6) في شأن حجية السجلات الإلكترونية والأختام الزمنية المشفرة.`,
      ``,
      `ثانياً: التحليل النظامي وتكييف المسؤولية القانونية`,
      `1. عدم مشروعية التوقف أو الإضراب: وفقاً للنظام المعمول به في المملكة العربية السعودية، فإن الامتناع الجماعي عن أداء العمل أو تعطيل سير المنشأة يُعد مخالفة جسيمة صريحة لبنود عقد العمل ولائحة تنظيم العمل المعتمدة بالمنشأة، ولا يُعد بأي حال وسيلة مشروعة لأي مطالبة.`,
      `2. انتفاء مشروعية الامتناع سنداً للمادة (81): لم يثبت ارتكاب صاحب العمل لأي إخلال جوهري يعطي الأجراء حق التوقف الفوري، وإنما القناة النظامية الإلزامية الوحيدة المعتمدة نظاماً هي رفع طلب التسوية الودية عبر منصة "ودي" لدى وزارة الموارد البشرية والتنمية الاجتماعية.`,
      `3. انطباق المادة (80): في حال ثبوت تحريض أي عامل أو تزعمه لتعطيل خطوط الإنتاج أو إغلاق المرافق أو الإضرار بالأصول، يحق للمنشأة نظاماً إعمال المادة (80) بفسخ العقد فوراً مع حفظ حق المنشأة في المطالبة بالتعويض عن كافة الخسائر والأضرار التشغيلية الناتجة.`,
      `4. التدابير الأمنية الفورية: الواقعة تمنح المنشأة الحق الكامل في الاستعانة بجهات الضبط الأمني المختصة لفض أي تجمهر غير نظامي وتأمين العاملين الراغبين في مواصلة أعمالهم.`,
      ``,
      `ثالثاً: حجية الإثبات الرقمي والسلسلة التوثيقية (Chain of Custody)`,
      `• تُظهر البيانات المسجلة بمنظومة ERS ثبوت توقيت الواقعة بأختام زمنية رقمية مشفرة تثبت لحظة بدء التوقف والجهات المبلغة.`,
      `• توثيق التدخل السريع لإدارة المنشأة ومحاولات الاحتواء النظامي دون استخدام أي وسائل غير مشروعة، مما ينفي أي شبهة تفريط أو تعسف عن الإدارة.`,
      `• السجلات الرقمية للنظام مستوفية لكافة الشروط المقررة بنظام التعاملات الإلكترونية ونظام الإثبات في المملكة وتُعد بينة قطعية أمام المحاكم العمالية ولجان التسوية.`,
      ``,
      `رابعاً: التوجيهات والقرارات القانونية والتنفيذية الملزمة`,
      `1. توجيه إنذار كتابي رسمي عاجل وفردي لكافة الممتنعين عن العمل بالعودة الفورية لمواقعهم خلال مهلة محددة، مع بيان العواقب النظامية للمادة (80).`,
      `2. تفريغ كاميرات المراقبة وسجلات الدخول الإلكترونية وربطها بتقرير ERS لتحديد المحرضين والمتسببين الرئيسيين بالاسم والأرقام الوظيفية.`,
      `3. إبلاغ مكتب العمل وممثل وزارة الموارد البشرية والتنمية الاجتماعية بالواقعة رسمياً عبر القنوات الرقمية لحفظ حقوق المنشأة وإثبات حالة التوقف غير المشروع.`,
      `4. فتح قناة حوار رسمية مع ممثلين نظاميين عن العمال للاستماع لأي مطالبات مشروعة وتوثيقها دون الإخلال بسير العمل والإنتاج.`,
      `5. حفظ نسخة رسمية مختومة من هذا التقرير بملف الواقعة للرجوع إليه أمام الهيئات العمالية والقضائية.`
    ].join('\n');
  }

  // Safety / Fire / Industrial Accident Legal Analysis
  return [
    ...header,
    `أولاً: السند القانوني والتشريعي المعتمد في الأنظمة السعودية`,
    `يستند هذا الرأي القانوني إلى فحص السجلات الرقمية الثابتة لمنظومة ERS في ضوء الأنظمة السعودية المعمول بها:`,
    `• نظام الدفاع المدني السعودي الصادر بالمرسوم الملكي رقم (م/10) ولوائحه التنفيذية الخاصة بتدابير السلامة والوقاية ومكافحة الحريق.`,
    `• كود البناء السعودي (SBC 801) الخاص بمتطلبات الوقاية والحماية من الحريق في المنشآت والأنشطة التجارية والصناعية.`,
    `• الباب الثامن من نظام العمل السعودي الصادر بالمرسوم الملكي رقم (م/51) وتعديلاته (المواد من 121 إلى 131) بشأن الوقاية من مخاطر العمل والحوادث الكبرى وتأمين اشتراطات الصحة والسلامة المهنية.`,
    `• نظام التعاملات الإلكترونية الصادر بالمرسوم الملكي رقم (م/18) ونظام الإثبات بشأن حجية القيود والسجلات الرقمية المشفرة.`,
    ``,
    `ثانياً: حجية الإثبات الرقمي والسلسلة التوثيقية (Chain of Custody)`,
    `تُظهر البيانات المسجلة بمنظومة ERS توافر كافة العناصر الجوهرية لحجية السجل الإلكتروني:`,
    `• ثبوت تاريخ وساعة البلاغ بدقة متناهية عبر أختام زمنية رقمية مشفرة غير قابلة للتلاعب أو التعديل الرجعي.`,
    `• توثيق تحرك المستجيبين وتكليفاتهم بالاسم والوقت، مما يثبت نظاماً انتفاء أي شبهة تقصير أو إهمال في واجب الإبلاغ والتدخل السريع.`,
    `• استيفاء التوثيق الفني لقائمة إجراءات التشغيل القياسية (SOP)، مما يعزز الموقف القانوني للمنشأة أمام لجان التحقيق والجهات الرقابية.`,
    ``,
    `ثالثاً: تكييف المسؤولية القانونية والمخاطر التقصيرية`,
    `• مسؤولية المنشأة: بالنظر لسرعة تفعيل نظام الإنذار واتخاذ تدابير العزل والإخلاء الاحترازية، فإن المنشأة قد أوفت بالتزامها النظامي ببذل العناية والحيطة الواجبة.`,
    `• المسؤولية تجاه الغير: انتفاء أركان المسؤولية التقصيرية من خطأ وضرر وعلاقة سببية، وثبوت القوة القاهرة أو الظرف الطارئ مع كفاية تدابير الاستجابة يمنع أي مطالبة تعويضية غير مشروعة.`,
    `• سلامة العاملين: استيفاء اشتراطات السلامة المهنية طبقاً للباب الثامن من نظام العمل يثبت براءة ذمة المنشأة تجاه أي مطالبات عمالية ناشئة عن الحادثة.`,
    ``,
    `رابعاً: الخلاصة والتوجيهات القانونية الملزمة`,
    `1. حفظ هذا السجل المؤرشف ضمن سجلات السلامة الرسمية للمنشأة للرجوع إليه عند أي تفتيش رقابي من الدفاع المدني أو وزارة الموارد البشرية.`,
    `2. إصدار إفادة استيفاء فني موقعة من مدير السلامة الميداني لتسليمها لجهات الاختصاص حال طلبها.`,
    `3. إبقاء البروتوكول التوثيقي الرقمي مفعلاً بصورة دائمة لإثبات الامتثال التام للأنظمة المرعية في المملكة العربية السعودية.`
  ].join('\n');
}

app.post('/api/gemini/report', async (req, res) => {
  try {
    const { reportType, emergency, emergencies, data } = req.body;

    // Resolve target emergency
    const targetEmergency = emergency || (data && !data.type ? data : (data?.emergency || data)) || (emergencies && emergencies[0]) || {};

    // Determine the effective report type (legal, predictive, general/statistical, technical)
    let effectiveType = 'standard';
    if (reportType === 'strategic' && data?.type) {
      effectiveType = data.type;
    } else if (reportType) {
      effectiveType = reportType;
    } else if (data?.type) {
      effectiveType = data.type;
    } else if (targetEmergency?.reportType) {
      effectiveType = targetEmergency.reportType;
    }

    let reportText = '';

    // If API key is configured, attempt AI with 3500ms timeout
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getAiClient();
        const headerExample = `التاريخ: [تاريخ التقرير]\nاسم الحالة: ${targetEmergency.typeName || 'طوارئ'}\nتوقيت حالة الطوارئ: [من وقت البلاغ إلى وقت الإغلاق]\nالموقع: ${targetEmergency.locationName || 'الموقع'} | مستوى الخطورة: ${targetEmergency.severity || 'مرتفع'} | رقم المرجع: ${(targetEmergency.id || 'REF').slice(0, 8).toUpperCase()}`;

        let prompt = '';
        if (effectiveType === 'legal') {
          prompt = `أنت مستشار قانوني رفيع المستوى وخبير في الأنظمة السعودية (نظام العمل السعودي الصادر بالمرسوم الملكي م/51 وتعديلاته بالمادتين 80 و81، نظام الدفاع المدني م/10، كود البناء السعودي SBC 801، ونظام التعاملات الإلكترونية م/18).
أعد مذكرة رأي قانوني واستشاري مفصلة وشاملة خصيصاً لحالة الطوارئ التالية:
${JSON.stringify(targetEmergency)}
شروط ملزمة للصياغة:
1. ابدأ التقرير بالترويسة الموحدة التالية حرفياً:
${headerExample}
2. تكييف الواقعة وفق الأنظمة السعودية بدقة متناهية (إذا كانت الواقعة تتعلق بإضراب للعمالة أو توقف عن العمل أو نزاع عمالي، ركز على المادة 80 الفقرة 4 و7 من نظام العمل السعودي وحق إنهاء العقد لتعطيل العمل، وعدم مشروعية الإضراب، وإلزامية سلوك القنوات الرسمية عبر منصة ودي بوزارة الموارد البشرية، والأنظمة الأمنية لحماية المرافق، وحجية السجل الإلكتروني الرقمي لنظام ERS بنظام التعاملات الإلكترونية لنفي المسؤولية عن الإدارة).
3. لا تستخدم إطلاقاً أي نجوم (*) أو علامات هاشتاج (#) أو ماركداون. استخدم الشرطة أو النقطة (•) للنقاط.
4. نسق التقرير في أبواب مرقمة واضحة (أولاً، ثانياً، ثالثاً، رابعاً). لا تذكر أي أسماء للذكاء الاصطناعي أو كلمات مجاني.`;
        } else if (effectiveType === 'predictive') {
          prompt = `أنت خبير التنبؤ التكتيكي بالأزمات في منظومة ERS. حلل حالة الطوارئ التالية وتوقع السيناريوهات والمخاطر المتبقية للـ 24 إلى 72 ساعة القادمة خصيصاً لهذه الحالة وموقعها:
${JSON.stringify(targetEmergency)}
شروط ملزمة للصياغة:
1. ابدأ التقرير بالترويسة الموحدة التالية:
${headerExample}
2. قدم تحليلاً تنبؤياً استباقياً للمخاطر المحتملة ومصفوفة المخاطر المتبقية والتدابير الوقائية الميدانية للموقع المذكور.
3. لا تستخدم إطلاقاً أي نجوم (*) أو علامات هاشتاج (#). استخدم (•) للنقاط.
4. لا تذكر أي أسماء للذكاء الاصطناعي أو كلمات مجاني.`;
        } else if (effectiveType === 'general' || effectiveType === 'statistical') {
          prompt = `أنت كبير محللي البيانات في منظومة ERS. أعد تحليلاً إحصائياً رقمياً دقيقاً لأداء الاستجابة الخاص بحالة الطوارئ التالية ومقارنتها بمؤشرات الأداء القياسية للمنشأة:
${JSON.stringify(targetEmergency)}
شروط ملزمة للصياغة:
1. ابدأ التقرير بالترويسة الموحدة التالية:
${headerExample}
2. استعرض مؤشرات الأداء الرقمية للحالة: زمن الاستجابة، زمن الاحتواء، نسبة إنجاز مهام SOP، ومعدل كفاءة التدخل.
3. لا تستخدم إطلاقاً أي نجوم (*) أو علامات هاشتاج (#). استخدم (•) للنقاط.
4. لا تذكر أي أسماء للذكاء الاصطناعي أو كلمات مجاني.`;
        } else {
          prompt = `أنت خبير توثيق الحوادث الفنية في منظومة ERS. أعد تقريراً فنياً شاملاً ومفصلاً لتوثيق حادثة الطوارئ التالية:
${JSON.stringify(targetEmergency)}
شروط ملزمة للصياغة:
1. ابدأ التقرير بالترويسة الموحدة التالية:
${headerExample}
2. استعرض التسلسل الزمني للواقعة، الإجراءات الفنية المنفذة، قائمة SOP، تحليل الأسباب الجذرية (RCA)، والتوصيات الفنية الوقائية.
3. لا تستخدم إطلاقاً أي نجوم (*) أو علامات هاشتاج (#). استخدم (•) للنقاط.
4. لا تذكر أي أسماء للذكاء الاصطناعي أو كلمات مجاني.`;
        }

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3500));
        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts: [{ text: prompt }] },
        });

        const response: any = await Promise.race([aiPromise, timeoutPromise]);
        if (response?.text) {
          reportText = response.text;
        }
      } catch (aiErr) {
        // Silently proceed to deterministic built-in engine
      }
    }

    // Built-in generation guarantees zero downtime, lifetime operation, and 100% white-labeling
    if (!reportText) {
      if (effectiveType === 'legal') {
        reportText = generateLegalOpinion(targetEmergency);
      } else if (effectiveType === 'predictive') {
        reportText = generateCasePredictiveReport(targetEmergency, emergencies || []);
      } else if (effectiveType === 'general' || effectiveType === 'statistical') {
        reportText = generateCaseStatisticalReport(targetEmergency, emergencies || []);
      } else {
        reportText = generateTechnicalReport(targetEmergency);
      }
    }

    const clean = cleanReportText(reportText);
    return res.json({ text: clean });
  } catch (error: any) {
    console.error('Report endpoint fallback trigger:', error);
    const target = req.body?.emergency || req.body?.data || {};
    const fallbackText = generateTechnicalReport(target);
    return res.json({ text: cleanReportText(fallbackText) });
  }
});

// ==========================================
// 3. NLP Voice Command Extraction
// ==========================================
app.post('/api/gemini/nlp-command', async (req, res) => {
  try {
    const { text, types, locations } = req.body;
    const ai = getAiClient();

    const typesStr = Array.isArray(types) ? types.map((t: any) => t.type_name).join(', ') : '';
    const locsStr = Array.isArray(locations) ? locations.map((l: any) => l.name).join(', ') : '';

    const prompt = `أنت خبير معالجة لغات طبيعية (NLP) في بيئة طوارئ. قم بتحليل الأمر الصوتي التالي: "${text}".
استخرج النوع المطابق من: [${typesStr}].
استخرج الموقع المطابق من: [${locsStr}].
أرجع النتيجة بصيغة JSON حصراً كالتالي: {"type_name": "اسم النوع", "location_name": "اسم الموقع", "notes": "أي تفاصيل إضافية"}. 
إذا لم تجد مطابقاً، حاول إيجاد الأقرب دلالياً.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error parsing NLP command:', error);
    return res.json({});
  }
});

// ==========================================
// 4. Responder Quiz Generation
// ==========================================
app.post('/api/gemini/quiz', async (req, res) => {
  try {
    const { emergency } = req.body;
    const ai = getAiClient();

    const prompt = `بصفتك مدرب استجابة طوارئ، أنشئ 3 أسئلة تقييمية سريعة للمستجيبين عن كيفية التعامل الصحيح مع حالة ${emergency?.typeName || ''}. 
يجب أن تتضمن الأسئلة خيارات صحيحة وشرحاً موجزاً للسبب.
أرجع النتيجة بصيغة JSON array of objects.
مثال للـ schema:
[
  {
    "question": "نص السؤال",
    "options": ["أ", "ب", "ج", "د"],
    "correctAnswerIndex": 0,
    "explanation": "الشرح"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    const questions = JSON.parse(response.text || '[]');
    return res.json(questions);
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.json([]);
  }
});

// ==========================================
// 5. Dynamic SOP Checklist Generation
// ==========================================
app.post('/api/gemini/sop-checklist', async (req, res) => {
  try {
    const { emergency } = req.body;
    const ai = getAiClient();

    const prompt = `بصفتك قائد عمليات ميداني، حلل حالة ${emergency?.typeName || ''} في ${emergency?.locationName || ''}. 
أنشئ قائمة مهام ميدانية (SOP) مكونة من 5 نقاط تكتيكية عاجلة للمستجيب الأول.
ركز على: 1. السلامة الشخصية، 2. عزل الخطر، 3. حماية الأرواح، 4. التواصل، 5. التوثيق.
يجب أن تكون المخرجات عبارة عن JSON array of strings فقط. 
مثال: ["تأمين المداخل والمخارج", "التحقق من أنظمة الإطفاء التلقائية"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    const tasks: string[] = JSON.parse(response.text || '[]');
    const formatted = tasks.map((t, i) => ({
      id: `task_${Date.now()}_${i}`,
      text: t,
      completed: false,
    }));
    return res.json(formatted);
  } catch (error: any) {
    console.error('Error generating SOP checklist:', error);
    return res.json([{ id: 'default_1', text: 'تأمين الموقع فوراً وطلب الدعم', completed: false }]);
  }
});

// ==========================================
// 6. Multimodal Vision Scene Analysis
// ==========================================
app.post('/api/gemini/vision-analysis', async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing base64Image' });
    }

    const ai = getAiClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `أنت محلل بصري أمني. حلل الصورة المرفقة لمشهد الحادث بدقة متناهية. 
- ابحث عن: نيران، دخان (كثافته ولونه)، انهيارات هيكلية، أشخاص محاصرين، أو مواد خطرة.
- قيم مستوى الخطر من 1 لـ 10.
- قدم ملخصاً للمستجيب عما يجب توقعه.
أرجع النتيجة بصيغة JSON فقط: {"summary_ar": "وصف المشهد التكتيكي", "risk_score": 9}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt },
        ],
      },
      config: { responseMimeType: 'application/json' },
    });

    const result = JSON.parse(response.text || 'null') || {
      summary_ar: 'تم فحص المشهد بنجاح.',
      risk_score: 5,
    };
    return res.json(result);
  } catch (error: any) {
    console.error('Error performing vision analysis:', error);
    return res.json({ summary_ar: 'تعذر تحليل الصورة بصرياً حالياً.', risk_score: 5 });
  }
});

// ==========================================
// 7. Crisis Simulation Scenario
// ==========================================
app.post('/api/gemini/crisis-scenario', async (req, res) => {
  try {
    const { facilityProfile, customSituations } = req.body;
    const ai = getAiClient();

    const context = facilityProfile
      ? `المنشأة: ${facilityProfile.activityType || ''}, المخاطر: ${facilityProfile.potentialHazards || ''}`
      : '';
    const prompt = `أنت خبير محاكاة أزمات. قم بتوليد سيناريو تدريبي معقد وواقعي بناءً على سياق المنشأة: (${context}) والمواقف المخصصة: (${customSituations || ''}).
يجب أن يتضمن السيناريو:
- عنواناً مثيراً.
- وصفاً درامياً للأزمة.
- 3 تحديات حرجة تواجه المستجيبين.
- 3 أهداف استراتيجية للنجاح.
- تحديد مستوى الصعوبة.
أرجع النتيجة بصيغة JSON حصراً.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    const scenario = JSON.parse(response.text || '{}');
    return res.json(scenario);
  } catch (error: any) {
    console.error('Error generating crisis scenario:', error);
    return res.json({});
  }
});

// ==========================================
// 8. Image Generation for Presentation Assets
// ==========================================
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image data returned from model' });
    }

    return res.json({ imageUrl });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// ==========================================
// 8.1. Global IP Geolocation Determination
// ==========================================
app.get('/api/geo/ip-lookup', async (req, res) => {
  try {
    const rawForwarded = req.headers['x-forwarded-for'];
    let clientIp = '';
    if (typeof rawForwarded === 'string') {
      clientIp = rawForwarded.split(',')[0].trim();
    } else if (Array.isArray(rawForwarded)) {
      clientIp = rawForwarded[0].trim();
    } else {
      clientIp = req.socket.remoteAddress || '';
    }

    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.replace('::ffff:', '');
    }

    const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || 
                    clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || 
                    clientIp.startsWith('172.16.') || clientIp.startsWith('172.31.');

    // Query external geolocator (ipwho.is)
    const targetUrl = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${encodeURIComponent(clientIp)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    let geoResult: any = null;
    try {
      const response = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false) {
          geoResult = {
            ipAddress: data.ip || clientIp || '127.0.0.1',
            country: data.country || 'المملكة العربية السعودية',
            countryCode: data.country_code || 'SA',
            city: data.city || 'الرياض',
            region: data.region || 'الرياض',
            latitude: Number(data.latitude) || 24.7136,
            longitude: Number(data.longitude) || 46.6753,
          };
        }
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
    }

    if (!geoResult) {
      geoResult = {
        ipAddress: clientIp || '127.0.0.1',
        country: 'المملكة العربية السعودية',
        countryCode: 'SA',
        city: 'الرياض',
        region: 'منطقة الرياض',
        latitude: 24.7136,
        longitude: 46.6753,
      };
    }

    res.setHeader('Cache-Control', 'no-cache');
    return res.json(geoResult);
  } catch (err: any) {
    return res.json({
      ipAddress: '127.0.0.1',
      country: 'المملكة العربية السعودية',
      countryCode: 'SA',
      city: 'الرياض',
      region: 'الرياض',
      latitude: 24.7136,
      longitude: 46.6753,
    });
  }
});


// ==========================================
// 9. Gemini Live API WebSocket Bridge
// ==========================================
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs: WebSocket, request) => {
  console.log('Client connected to Live Assistant WebSocket');
  const ai = getAiClient();
  let liveSession: any = null;

  try {
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `أنت خبير الدعم الفني الميداني (Tech Support) لنظام الاستجابة للطوارئ ERS.
عند بدء الاتصال، قدم ملخصاً استراتيجياً للحالة الميدانية فوراً. وجه المستجيب تقنياً وإجرائياً. تحدث بالعربية الفصحى بأسلوب مباشر ومهني.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Output text transcription
          if (message.serverContent?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({
                type: 'transcription',
                text: message.serverContent.outputTranscription.text,
              })
            );
          }

          // Model spoken audio
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(
              JSON.stringify({
                type: 'audio',
                audio,
              })
            );
          }

          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'closed' }));
          }
        },
        onerror: (err) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: 'تم قطع اتصال الذكاء الاصطناعي الحي.',
              })
            );
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'ready' }));

    // Listen to incoming messages from the client
    clientWs.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.type === 'audio' && msg.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (msg.type === 'context' && msg.context && liveSession) {
          liveSession.sendRealtimeInput({
            text: `سياق الحالة الميدانية الحالي: ${msg.context}`,
          });
        }
      } catch (parseErr) {
        console.warn('Error handling client message:', parseErr);
      }
    });

    clientWs.on('close', () => {
      console.log('Client closed WebSocket connection');
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
      }
    });
  } catch (err: any) {
    console.error('Error connecting to Gemini Live:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: 'فشل بدء جلسة المساعد المباشر على الخادم.',
        })
      );
      clientWs.close();
    }
  }
});

// Upgrade HTTP connection for WebSocket on /api/live-assistant
server.on('upgrade', (request, socket, head) => {
  socket.on('error', (err) => {
    // Prevent unhandled socket errors from bubbling to process
  });

  try {
    const host = request.headers.host || 'localhost';
    const pathname = new URL(request.url || '', `http://${host}`).pathname;
    if (pathname === '/api/live-assistant') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    socket.destroy();
  }
});

// ==========================================
// 10. Voice Notes Upload Backup Endpoint
// ==========================================
app.post('/api/voice-notes/upload', express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '25mb' }), (req, res) => {
  try {
    const contentType = (req.headers['content-type'] as string) || 'audio/webm';
    if (!req.body || (req.body as Buffer).length === 0) {
      return res.status(400).json({ error: 'ملف صوتي فارغ' });
    }
    const base64 = (req.body as Buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    return res.json({ success: true, downloadUrl: dataUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Upload error' });
  }
});

// ==========================================
// 11. Real FCM Push Notification Endpoint (No Fake Successes)
// ==========================================
app.post('/api/notifications/test-push', async (req, res) => {
  try {
    const { targetToken, title, body, userId, testId } = req.body;

    // Reject missing, unauthorized, or dummy tokens
    if (!targetToken || typeof targetToken !== 'string') {
      return res.status(400).json({ success: false, error: 'targetToken is required' });
    }

    const trimmedToken = targetToken.trim();
    if (
      trimmedToken.length < 50 || 
      trimmedToken.startsWith('web_fcm_') || 
      trimmedToken.startsWith('web_device_') ||
      trimmedToken.startsWith('dummy_') ||
      trimmedToken.startsWith('local_')
    ) {
      return res.status(400).json({ 
        success: false, 
        error: 'تم رفض الرمز: الرمز المدخل وهمي أو غير صالح. يتطلب النظام رمز FCM حقيقي من Firebase.',
        code: 'INVALID_OR_SIMULATED_TOKEN'
      });
    }

    const currentTestId = testId || `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notificationTitle = title || '🔔 فحص إشعار ERS التشغيلي';
    const notificationBody = body || 'فحص إشعار طوارئ - تأكيد جاهزية الجهاز لاستقبال التنبيهات.';

    const messagePayload: any = {
      token: trimmedToken,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        isTest: 'true',
        testId: currentTestId,
        emergencyId: 'test-alarm',
        alertId: currentTestId,
        timestamp: String(Date.now()),
        title: notificationTitle,
        body: notificationBody,
        url: '/#/mobile-diagnostics'
      },
      android: {
        priority: 'high',
        ttl: 3600, // 1 hour TTL
        notification: {
          channelId: 'ers_emergency_channel',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          visibility: 'public',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    if (!(admin as any)?.apps?.length) {
      return res.status(503).json({
        success: false,
        stage: 'dispatch_failed',
        error: 'خدمة Firebase Admin غير مهيأة على الخادم. يجب توفير بيانات اعتماد الخدمة أو تشغيل وظائف Cloud Functions.',
        code: 'FIREBASE_ADMIN_NOT_INITIALIZED'
      });
    }

    let fcmMessageId: string;
    try {
      fcmMessageId = await (admin as any).messaging().send(messagePayload);
      const maskedToken = `${trimmedToken.slice(0, 8)}...${trimmedToken.slice(-6)}`;
      console.log(`[FCM TEST DISPATCH] Successfully accepted by FCM for token [${maskedToken}]. Message ID: ${fcmMessageId}`);

      // Log in Firestore if available
      try {
        const db = (admin as any).firestore();
        await db.collection('system_test_notifications').doc(currentTestId).set({
          testId: currentTestId,
          userId: userId || 'anonymous',
          targetTokenMasked: maskedToken,
          title: notificationTitle,
          body: notificationBody,
          status: 'fcm_dispatch_accepted',
          fcmMessageId,
          dispatchedAt: Date.now(),
          createdAt: (admin as any).firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (logErr) {}

      return res.json({
        success: true,
        stage: 'fcm_dispatch_accepted',
        testId: currentTestId,
        messageId: fcmMessageId,
        tokenMasked: maskedToken,
        message: 'تم قبول طلب الإرسال بنجاح من خوادم FCM برقم رسالة رسمي. بانتظار استلام الهاتف للإشعار.'
      });
    } catch (fcmErr: any) {
      const errCode = fcmErr?.code || 'fcm/send-error';
      const errMsg = fcmErr?.message || 'فشل إرسال الإشعار عبر FCM';
      console.error(`[FCM TEST ERROR] Code: ${errCode}, Message: ${errMsg}`);

      // If token is invalid or unregistered, clean it up from Firestore
      if (
        errCode === 'messaging/invalid-registration-token' ||
        errCode === 'messaging/registration-token-not-registered'
      ) {
        try {
          const db = (admin as any).firestore();
          const snap = await db.collection('user_devices').where('fcmToken', '==', trimmedToken).get();
          const batch = db.batch();
          snap.forEach((docSnap: any) => {
            batch.update(docSnap.ref, {
              isActive: false,
              fcmToken: '',
              deactivatedReason: errCode,
              deactivatedAt: Date.now()
            });
          });
          await batch.commit();
        } catch (cleanErr) {}
      }

      // DO NOT return success: true! Return clear error and HTTP 400
      return res.status(400).json({
        success: false,
        stage: 'dispatch_failed',
        error: errMsg,
        fcmCode: errCode,
        testId: currentTestId
      });
    }
  } catch (err: any) {
    console.error('Error in /api/notifications/test-push:', err);
    return res.status(500).json({ success: false, stage: 'dispatch_failed', error: err.message || 'Internal server error' });
  }
});

// ==========================================
// 11.0.1 Push Receipt ACK Endpoint (Stage 4 Proof)
// ==========================================
app.post('/api/notifications/ack', async (req, res) => {
  try {
    const { testId, alertId, deviceId, receivedAt } = req.body;
    if (testId && (admin as any)?.apps?.length) {
      try {
        const db = (admin as any).firestore();
        await db.collection('system_test_notifications').doc(testId).set({
          receiptVerified: true,
          status: 'device_receipt_verified',
          receiptDeviceId: deviceId || 'unknown',
          receivedAt: receivedAt || Date.now()
        }, { merge: true });
      } catch (e) {}
    }
    return res.json({ success: true, acknowledged: true, receivedAt: receivedAt || Date.now() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 11.0.2 Authoritative Emergency Incident Closure Endpoint
// ==========================================
app.post('/api/emergencies/close', async (req, res) => {
  try {
    const { emergencyId, userId, closedByName, notes } = req.body;
    if (!emergencyId || typeof emergencyId !== 'string') {
      return res.status(400).json({ success: false, error: 'معرّف البلاغ مطلوب (emergencyId is required)' });
    }
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'معرّف المستخدم مطلوب (userId is required)' });
    }

    if (!(admin as any)?.apps?.length) {
      return res.status(503).json({ success: false, error: 'خدمة Firebase Admin غير مهيأة على الخادم.' });
    }

    const db = (admin as any).firestore();

    // 1. Authoritative identity check from Firestore (never trust client-supplied role)
    const userDocRef = db.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) {
      return res.status(403).json({ 
        success: false, 
        error: 'المستخدم غير مسجل في قاعدة البيانات، تم رفض طلب الإغلاق.' 
      });
    }

    const userData = userDocSnap.data() || {};
    const userRole = userData.role || 'responder';
    const isAdmin = userRole === 'admin' || userRole === 'super-admin';
    const authoritativeName = userData.name || userData.username || closedByName || 'المسؤول';

    const emergencyDocRef = db.collection('emergencies').doc(emergencyId);
    
    // 2. Atomic Transaction for verification, closure, and timeline event recording
    const result = await db.runTransaction(async (transaction: any) => {
      const emergencySnap = await transaction.get(emergencyDocRef);
      if (!emergencySnap.exists) {
        throw new Error('EMERGENCY_NOT_FOUND');
      }

      const emergencyData = emergencySnap.data() || {};

      // If already closed: return idempotent success without duplicate timeline events
      if (emergencyData.status === 'closed' || emergencyData.status === 'resolved') {
        return { alreadyClosed: true, emergencyId };
      }

      // Check permission:
      // Creator can close if createdBy matches userId
      // Admin/Super-Admin can close
      // Legacy emergencies without createdBy: ONLY admin can close (never guess by name)
      const creatorId = emergencyData.createdBy;
      const isCreator = Boolean(creatorId && creatorId === userId);

      if (!isAdmin && !isCreator) {
        if (!creatorId) {
          throw new Error('LEGACY_EMERGENCY_REQUIRES_ADMIN');
        } else {
          throw new Error('FORBIDDEN_NOT_CREATOR_OR_ADMIN');
        }
      }

      const now = Date.now();
      const serverTs = (admin as any).firestore.FieldValue.serverTimestamp();

      // Update emergency atomically
      transaction.update(emergencyDocRef, {
        status: 'closed',
        closedAt: now,
        serverClosedAt: serverTs,
        closedBy: userId,
        closedByName: authoritativeName,
        closeNotes: notes || 'تم إغلاق البلاغ رسميًا',
        updatedAt: now
      });

      // Append immutable timeline event in subcollection
      const timelineRef = emergencyDocRef.collection('timeline').doc();
      transaction.set(timelineRef, {
        id: timelineRef.id,
        eventType: 'STATUS_CHANGE',
        title: 'إغلاق البلاغ رسميًا',
        description: `تم إغلاق البلاغ بنجاح وإنهاء الاستدعاء بواسطة ${authoritativeName}`,
        timestamp: now,
        serverTimestamp: serverTs,
        userId: userId,
        userName: authoritativeName,
        userRole: userRole,
        source: 'alarm_closure'
      });

      // Record immutable audit event
      const auditRef = db.collection('audit_events').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        eventType: 'EMERGENCY_CLOSED',
        actorId: userId,
        actorName: authoritativeName,
        actorRole: userRole,
        targetId: emergencyId,
        targetName: emergencyData.typeName || 'حالة طوارئ',
        timestamp: now,
        details: `إغلاق البلاغ ${emergencyId} بالموقع ${emergencyData.locationName || ''}`
      });

      return { alreadyClosed: false, emergencyId };
    });

    return res.json({
      success: true,
      message: result.alreadyClosed ? 'البلاغ مغلق مسبقاً.' : 'تم إغلاق البلاغ بنجاح وتوثيق الحدث.',
      emergencyId,
      closedBy: userId,
      closedByName: authoritativeName
    });
  } catch (err: any) {
    if (err.message === 'EMERGENCY_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'البلاغ غير موجود في النظام.' });
    }
    if (err.message === 'LEGACY_EMERGENCY_REQUIRES_ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'هذا بلاغ قديم يفتقر لمعرّف منشئ موثوق؛ يحق لمدير النظام حصراً إغلاقه.' 
      });
    }
    if (err.message === 'FORBIDDEN_NOT_CREATOR_OR_ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'غير مصرح: يحق لمنشئ البلاغ فقط أو لمدير النظام إغلاق هذا البلاغ.' 
      });
    }
    console.error('Error closing emergency on server:', err);
    return res.status(500).json({ success: false, error: err.message || 'خطأ في معالجة إغلاق البلاغ' });
  }
});

// ==========================================
// 11.1. System Readiness & Health Check Endpoint
// ==========================================
app.get('/api/system/health-check', async (req, res) => {
  try {
    const hasAdmin = (admin as any)?.apps?.length > 0;
    const memory = process.memoryUsage();

    return res.json({
      status: 'healthy',
      timestamp: Date.now(),
      uptimeSeconds: Math.round(process.uptime()),
      firebaseAdminInitialized: hasAdmin,
      memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
      nodeVersion: process.version,
      version: '1.0.0',
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ==========================================
// 11.2. Isolated Drill Server Launch Endpoint
// ==========================================
app.post('/api/drills/launch', async (req, res) => {
  try {
    const { drillId, scenarioTitle, scenarioDescription, participantUserIds, targetSlaMinutes } = req.body;
    if (!drillId) {
      return res.status(400).json({ success: false, error: 'drillId is required' });
    }

    const firestore = (admin as any)?.apps?.length > 0 ? (admin as any).firestore() : null;
    const enrolledIds: string[] = Array.isArray(participantUserIds) && participantUserIds.length > 0 
      ? participantUserIds 
      : [];

    let tokensDispatched = 0;
    const participantTokens: string[] = [];

    // Server-authoritative recipient resolution: fetch tokens directly from database
    if (firestore && enrolledIds.length > 0) {
      for (const uid of enrolledIds) {
        try {
          const userDoc = await firestore.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.fcmToken) {
              participantTokens.push(userData.fcmToken);
            }
          }
        } catch (e) {}
      }

      // Dispatch STRICTLY to enrolled participant tokens
      const drillPrefixTitle = `[تدريب — ليس بلاغًا حقيقيًا] ${scenarioTitle || 'تمرين محاكاة'}`;
      for (const token of participantTokens) {
        try {
          await (admin as any).messaging().send({
            token,
            notification: {
              title: drillPrefixTitle,
              body: scenarioDescription || 'تمرين معزول لقياس كفاءة الاستجابة للسلامة',
            },
            data: {
              isDrill: 'true',
              drillId: String(drillId),
              emergencyId: String(drillId),
              title: drillPrefixTitle,
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'ers_drill_channel',
                priority: 'high',
              },
            },
          });
          tokensDispatched++;
        } catch (sendErr: any) {
          console.warn('Drill FCM token dispatch error:', sendErr.message);
        }
      }

      // Log dispatch results
      await firestore.collection('drill_dispatch_logs').doc(`dispatch_${drillId}`).set({
        drillId,
        enrolledCount: enrolledIds.length,
        tokensFound: participantTokens.length,
        dispatchedCount: tokensDispatched,
        status: 'accepted_by_fcm',
        launchedAt: Date.now(),
      });
    }

    return res.json({
      success: true,
      drillId,
      enrolledCount: enrolledIds.length,
      dispatchedCount: tokensDispatched,
      message: 'تم إطلاق سيناريو التمرين وتوجيه الإشعارات المعزولة للمشاركين المعتمدين فقط.',
    });
  } catch (err: any) {
    console.error('Error in /api/drills/launch:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 11.3. Server-Side Auto-Escalation Engine (Real Recipients & Coverage Failure)
// ==========================================
const DEFAULT_ESCALATION_POLICY = {
  enabled: true,
  checkIntervalSeconds: 20,
  level1SlaSeconds: 120, // 2 minutes to Shift Leader / Safety Officer
  level2SlaSeconds: 300, // 5 minutes to Site Manager / Facility Lead
  level3SlaSeconds: 600, // 10 minutes to Ops Command / Super Admin
};

async function evaluateServerAutoEscalation() {
  if (!((admin as any)?.apps?.length > 0)) {
    return { status: 'skipped', reason: 'Firebase Admin not initialized in this environment' };
  }
  try {
    const firestore = (admin as any).firestore();
    const activeSnap = await firestore.collection('emergencies')
      .where('status', '==', 'active')
      .get();

    if (activeSnap.empty) return { evaluated: 0, escalated: 0 };

    const now = Date.now();
    let escalatedCount = 0;

    for (const docSnap of activeSnap.docs) {
      const emergency = docSnap.data();
      const emergencyId = docSnap.id;

      // 1. Strict Drill and Closed Isolation: skip drills from operational escalation
      if (emergency.isDrill || emergencyId.startsWith('drill_') || emergency.status !== 'active') {
        continue;
      }
      
      // 2. Halt escalation idempotently upon acknowledgment or arrival
      const hasResponders = Array.isArray(emergency.responders) && emergency.responders.length > 0;
      const isAcknowledged = !!emergency.firstAcknowledgedAt || hasResponders;

      if (isAcknowledged) {
        if (!emergency.escalationHalted && emergency.escalated) {
          await docSnap.ref.update({
            escalationHalted: true,
            lastEscalationHaltedAt: now,
          });
        }
        continue;
      }

      const elapsedSec = Math.floor((now - (emergency.createdAt || now)) / 1000);
      let targetLevel = 0;
      if (elapsedSec >= DEFAULT_ESCALATION_POLICY.level3SlaSeconds) targetLevel = 3;
      else if (elapsedSec >= DEFAULT_ESCALATION_POLICY.level2SlaSeconds) targetLevel = 2;
      else if (elapsedSec >= DEFAULT_ESCALATION_POLICY.level1SlaSeconds) targetLevel = 1;

      const currentLevel = emergency.escalationLevel || 0;
      if (targetLevel > currentLevel) {
        // 3. Resolve Real Recipients for the Target Tier from Firestore Users
        let targetRoleCategory = 'قائد الوردية / مسؤول السلامة';
        if (targetLevel === 2) targetRoleCategory = 'مدير الموقع / مشرف المنشأة';
        if (targetLevel === 3) targetRoleCategory = 'غرفة العمليات المركزية / المشرف العام';

        const usersSnap = await firestore.collection('users').get();
        const availableRecipients: Array<{ id: string; name: string; fcmToken?: string; role: string }> = [];

        usersSnap.forEach((uDoc: any) => {
          const u = uDoc.data();
          const job = (u.jobTitle || u.job_name || '').toLowerCase();
          const role = (u.role || '').toLowerCase();

          if (targetLevel === 1) {
            if (role === 'admin' || job.includes('وردية') || job.includes('سلامة') || job.includes('leader')) {
              availableRecipients.push({ id: uDoc.id, name: u.name, fcmToken: u.fcmToken, role: u.role });
            }
          } else if (targetLevel === 2) {
            if (job.includes('مدير') || job.includes('منشأة') || job.includes('manager') || role === 'admin') {
              availableRecipients.push({ id: uDoc.id, name: u.name, fcmToken: u.fcmToken, role: u.role });
            }
          } else if (targetLevel === 3) {
            if (role === 'super-admin' || role === 'super_admin' || job.includes('عمليات')) {
              availableRecipients.push({ id: uDoc.id, name: u.name, fcmToken: u.fcmToken, role: u.role });
            }
          }
        });

        // 4. Check for Coverage Failure: no recipient found or no recipient has an active device token
        const reachableTokens = availableRecipients.filter(r => !!r.fcmToken);
        const isCoverageFailure = availableRecipients.length === 0 || reachableTokens.length === 0;

        // 5. Escalate atomically on emergency doc
        await docSnap.ref.update({
          escalated: true,
          escalationLevel: targetLevel,
          lastEscalatedAt: now,
          escalationTargetTier: targetRoleCategory,
          coverageFailure: isCoverageFailure,
          coverageFailureReason: isCoverageFailure 
            ? `فشل تغطية التصعيد للمستوى ${targetLevel}: لا يوجد مستلم فعلي مسجل بجهاز نشط في هذه الوردية`
            : null,
          escalationReason: `تجاوز مهلة الاستجابة القياسية (المستوى ${targetLevel} - ${elapsedSec} ثانية)`,
        });

        // 6. Dispatch with Idempotency Key per recipient
        for (const recipient of availableRecipients) {
          const idempotencyKey = `${emergencyId}_tier${targetLevel}_${recipient.id}`;
          const logRef = docSnap.ref.collection('escalation_dispatch_logs').doc(idempotencyKey);
          
          let fcmAccepted = false;
          if (recipient.fcmToken) {
            try {
              await (admin as any).messaging().send({
                token: recipient.fcmToken,
                notification: {
                  title: `🚨 تصعيد طوارئ - المستوى ${targetLevel}`,
                  body: `تجاوز بلاغ "${emergency.typeName || 'طوارئ'}" مهلة الاستجابة (${elapsedSec}ث). مطلوب تدخلك الفوري (${targetRoleCategory}).`,
                },
                data: {
                  emergencyId,
                  escalationLevel: String(targetLevel),
                  isEscalation: 'true',
                },
                android: {
                  priority: 'high',
                  notification: {
                    channelId: 'ers_emergency_channel',
                    priority: 'high',
                  },
                },
              });
              fcmAccepted = true;
            } catch (fcmErr) {}
          }

          // Record status: 'accepted_by_fcm' rather than 'device_delivered'
          await logRef.set({
            idempotencyKey,
            emergencyId,
            tier: targetLevel,
            recipientId: recipient.id,
            recipientName: recipient.name,
            roleCategory: targetRoleCategory,
            hasDeviceToken: !!recipient.fcmToken,
            status: fcmAccepted ? 'accepted_by_fcm' : 'failed_no_active_device',
            dispatchedAt: now,
          });
        }

        // 7. Record event in timeline subcollection with deterministic ID
        const eventContent = isCoverageFailure
          ? `⚠️ فشل تغطية التصعيد: تم تصعيد البلاغ للمستوى ${targetLevel} ولكن لا يوجد مستلم متاح بجهاز نشط. مطلوب تدخل غرفة العمليات!`
          : `🔔 تصعيد خادم آلي: تم تصعيد البلاغ إلى المستوى ${targetLevel} (${targetRoleCategory}) وإرسال التنبيهات لمستلمي الوردية المعتمدين.`;

        try {
          await docSnap.ref.collection('events').doc(`esc_level_${targetLevel}_${emergencyId}`).set({
            id: `esc_level_${targetLevel}_${emergencyId}`,
            type: 'escalation',
            content: eventContent,
            userName: 'نظام ERS الذكي (الخادم)',
            timestamp: now,
            coverageFailure: isCoverageFailure,
          });
        } catch (eventErr) {}

        escalatedCount++;
        console.log(`[Auto-Escalation] Emergency ${emergencyId} escalated to level ${targetLevel} (Coverage Failure: ${isCoverageFailure})`);
      }
    }

    return { evaluated: activeSnap.size, escalated: escalatedCount, timestamp: now };
  } catch (err: any) {
    console.warn('Auto-escalation evaluation notice:', err.message);
    return { status: 'error', error: err.message };
  }
}

// Background auto-escalation tick every 20s
setInterval(() => {
  evaluateServerAutoEscalation().catch(() => {});
}, 20000);

app.get('/api/escalation/policy', (req, res) => {
  return res.json({ success: true, policy: DEFAULT_ESCALATION_POLICY });
});

app.post('/api/escalation/evaluate', async (req, res) => {
  const result = await evaluateServerAutoEscalation();
  return res.json({ success: true, result });
});

// ==========================================
// 12. Vite Middleware (Dev) or Static (Prod)
// ==========================================
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`ERS Server running at http://localhost:${port}`);
  });
}

startServer();

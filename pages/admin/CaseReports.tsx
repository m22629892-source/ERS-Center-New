
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { 
  ArrowLeft, FileText, Search, RotateCcw, Filter, Calendar, 
  Users, Printer, CheckSquare, Mic, Play, Pause, ShieldCheck, 
  Clock, CheckCircle2 
} from 'lucide-react';
import { EmergencyStatus, Emergency, IncidentTask, VoiceNote } from '../../types';
import { Modal } from '../../components/Modal';
import { getChecklistTaskTitle } from '../../services/checklistLocalization';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';


const CaseReports = () => {
  const { emergencies, users } = useApp();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<string>('closed'); 
  const [typeNameSearch, setTypeNameSearch] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [closerFilter, setCloserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [inspectingEmergency, setInspectingEmergency] = useState<Emergency | null>(null);
  const [inspectingTasks, setInspectingTasks] = useState<IncidentTask[]>([]);
  const [inspectingVoiceNotes, setInspectingVoiceNotes] = useState<VoiceNote[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handleOpenDetails = async (emergency: Emergency) => {
    setInspectingEmergency(emergency);
    setLoadingDetails(true);
    setPlayingVoiceId(null);
    try {
      const [tSnap, vnSnap] = await Promise.all([
        getDocs(query(collection(db, 'emergencies', emergency.id, 'tasks'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'emergencies', emergency.id, 'voice_notes'), orderBy('createdAt', 'desc')))
      ]);
      setInspectingTasks(tSnap.docs.map(d => ({ taskId: d.id, ...d.data() } as IncidentTask)));
      setInspectingVoiceNotes(vnSnap.docs.map(d => ({ noteId: d.id, ...d.data() } as VoiceNote)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getUserName = (userId?: string) => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };


  const handlePrint = () => {
    const element = document.getElementById('reports-table-container');
    if (!element) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cases Report</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                        body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 11px; }
                        th { background: #f4f4f4; font-weight: bold; }
                        .no-print { display: none !important; }
                    </style>
                </head>
                <body>
                    <h2 style="text-align:center; color:#1976d2;">' + t("case_reports_log_title") + '</h2>
                    <p style="text-align:center;">' + t("export_date") + ': ' + new Date().toLocaleString() + '</p>
                    ${element.innerHTML}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };

  const filteredCases = useMemo(() => {
    return emergencies.filter(e => {
      if (typeNameSearch && !e.typeName.toLowerCase().includes(typeNameSearch.toLowerCase())) return false;
      
      if (statusFilter !== 'all') {
          if (statusFilter === 'active' && e.status !== EmergencyStatus.ACTIVE) return false;
          if (statusFilter === 'closed' && e.status !== EmergencyStatus.CLOSED) return false;
      }
      
      const creatorName = e.creatorName?.toLowerCase() || '';
      if (creatorFilter && !creatorName.includes(creatorFilter.toLowerCase())) return false;
      
      const closerName = getUserName(e.closedBy).toLowerCase();
      if (closerFilter && !closerName.includes(closerFilter.toLowerCase())) return false;
      
      const caseDate = new Date(e.createdAt).setHours(0,0,0,0);
      if (startDate) {
        const start = new Date(startDate).setHours(0,0,0,0);
        if (caseDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23,59,59,999);
        if (caseDate > end) return false;
      }
      return true;
    }).sort((a, b) => {
      const timeA = a.closedAt || a.createdAt || 0;
      const timeB = b.closedAt || b.createdAt || 0;
      return timeB - timeA;
    });
  }, [emergencies, typeNameSearch, statusFilter, creatorFilter, closerFilter, startDate, endDate, users]);

  return (
    <div className="space-y-6 max-w-full overflow-hidden pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 dark:border-gray-700 px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          <FileText size={24} className="text-primary" /> {t('status_reports')}
        </h2>
        <div className="flex gap-2 w-full md:w-auto no-print">
            <Button variant="outline" onClick={handlePrint} className="rounded-xl flex-1 md:flex-none">
                <Printer size={16} className="mr-2" /> {t('print')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin')} className="rounded-xl flex-1 md:flex-none">
                <ArrowLeft size={16} className="mr-2 rtl:rotate-180" /> {t('back')}
            </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-700 space-y-4 mx-2 sm:mx-0 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Search size={10}/> {t("search_case_name")}</label>
                  <input 
                    type="text" 
                    value={typeNameSearch} 
                    onChange={(e) => setTypeNameSearch(e.target.value)} 
                    placeholder={t("case_name_placeholder")} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white outline-none text-sm font-bold shadow-inner" 
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Filter size={10}/> {t("filter_status")}</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white outline-none text-sm font-bold shadow-inner">
                      <option value="all">{t("all_cases")}</option>
                      <option value="closed">{t("closed_only")}</option>
                      <option value="active">{t("active_only")}</option>
                  </select>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> {t("from_date")}</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white text-xs font-bold shadow-inner" />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> {t("to_date")}</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white text-xs font-bold shadow-inner" />
              </div>
          </div>
      </div>

      <div id="reports-table-container" className="bg-white dark:bg-gray-800 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-700 overflow-hidden mx-2 sm:mx-0">
         <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
                 <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                     <tr>
                         <th className="px-4 sm:px-6 py-4 text-right rtl:text-right ltr:text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("emergency_type")}</th>
                         <th className="px-4 sm:px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("dismissed_responders")}</th>
                         <th className="px-4 sm:px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("closed_by_header")}</th>
                         <th className="px-4 sm:px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest no-print">{t("documentation_notes_header")}</th>
                         <th className="px-4 sm:px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest no-print">Replay</th>
                     </tr>
                 </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-50 dark:divide-gray-700">

                     {filteredCases.map(c => (
                         <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                                <div className="text-sm font-black dark:text-white">{c.typeName}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{c.locationName}</div>
                                <div className="text-[9px] text-primary font-mono mt-1">{new Date(c.createdAt).toLocaleDateString()}</div>
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${c.dismissedBy?.length ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Users size={14} className="mr-1"/> {c.dismissedBy?.length || 0}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold">{t("person_unit")}</span>
                                </div>
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                                {c.status === 'closed' ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center font-black text-[10px] uppercase">{getUserName(c.closedBy)?.charAt(0)}</div>
                                        <span className="text-xs font-bold dark:text-gray-300">{getUserName(c.closedBy)}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-red-500 uppercase animate-pulse">{t("currently_active")}</span>
                                )}
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap text-center no-print">
                                 <button 
                                    onClick={() => handleOpenDetails(c)}
                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 transition-all text-[10px] font-black border border-blue-200 flex items-center gap-1.5 mx-auto"
                                 >
                                    <CheckSquare size={13} />
                                    <span>{t("tasks_and_recordings")}</span>
                                 </button>
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap text-center no-print">
                                 <button 
                                    onClick={() => navigate(`/admin/playback/${c.id}`)}
                                    className="p-2 sm:p-2.5 bg-primary text-white rounded-xl hover:scale-105 transition-all text-[10px] font-black shadow-lg shadow-primary/20"
                                 >
                                    <RotateCcw size={14}/>
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {filteredCases.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-10 text-center text-gray-400 font-bold italic text-xs">{t("no_cases_matching_search")}</td>
                        </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </div>

      {/* Incident Details Inspection Modal (Tasks & Voice Notes without raw token exposure) */}
      <Modal
        isOpen={!!inspectingEmergency}
        onClose={() => setInspectingEmergency(null)}
        title={`${t("incident_record_title")} ${inspectingEmergency?.typeName || ''} (${inspectingEmergency?.locationName || ''})`}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {loadingDetails ? (
            <div className="py-12 text-center text-gray-400">
              <Clock className="animate-spin mx-auto mb-2 text-primary" size={24} />
              <p className="text-xs font-bold">{t("loading_incident_tasks_and_voice")}</p>
            </div>
          ) : (
            <>
              {/* Checklist Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
                  <h4 className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <CheckSquare size={16} className="text-primary" />
                    {t("field_protocol_tasks_log")} ({inspectingTasks.length})
                  </h4>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-950/40 px-2.5 py-0.5 rounded-full">
                    {inspectingTasks.filter(t => t.status === 'completed').length} {t("status_completed")}
                  </span>
                </div>

                {inspectingTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-3">{t("no_tasks_for_incident")}</p>
                ) : (
                  <div className="space-y-2">
                    {inspectingTasks.map(task => (
                      <div 
                        key={task.taskId} 
                        className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black dark:text-white">{task.order}. {getChecklistTaskTitle(task, i18n.language)}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'skipped' ? 'bg-amber-100 text-amber-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t(`status_${task.status}`) || task.status}
                          </span>
                        </div>

                        {task.completedByName && (
                          <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-green-600" />
                            <span>{t('completed_by_label')} {task.completedByName}</span>
                            {task.completedAt && (
                              <span>{t("at_time")} {new Date(task.completedAt).toLocaleTimeString()}</span>
                            )}
                          </div>
                        )}

                        {task.approvedByName && (
                          <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                            <ShieldCheck size={12} />
                            <span>{t("supervisor_approved")} {task.approvedByName}</span>
                          </div>
                        )}

                        {task.notes && (
                          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl text-[10px] text-gray-600 dark:text-gray-300 font-bold">
                            {t("notes")}: {task.notes}
                          </div>
                        )}

                        {task.skipReason && (
                          <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-xl text-[10px] text-amber-900 dark:text-amber-200 font-bold">
                            {t("skip_reason_label")} {task.skipReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Voice Notes Section */}
              <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
                  <h4 className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <Mic size={16} className="text-indigo-600" />
                    {t("voice_notes_list_title")} ({inspectingVoiceNotes.length})
                  </h4>
                </div>

                {inspectingVoiceNotes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-3">{t("voice_notes_empty")}</p>
                ) : (
                  <div className="space-y-2">
                    {inspectingVoiceNotes.map(vn => (
                      <div 
                        key={vn.noteId}
                        className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black dark:text-white">{vn.userName}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md font-bold">
                              {vn.durationSeconds} {t("seconds")}
                            </span>
                          </div>
                          {vn.description && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 font-bold mt-0.5">
                              "{vn.description}"
                            </p>
                          )}
                          <div className="text-[9px] text-gray-400 font-bold mt-1">
                            {new Date(vn.createdAt).toLocaleString('ar-SA')}
                          </div>
                        </div>

                        {vn.downloadUrl && (
                          <button
                            onClick={() => {
                              if (playingVoiceId === vn.noteId) {
                                setPlayingVoiceId(null);
                              } else {
                                setPlayingVoiceId(vn.noteId);
                                const a = new Audio(vn.downloadUrl);
                                a.onended = () => setPlayingVoiceId(null);
                                a.play().catch(e => console.warn(e));
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1 shrink-0 shadow-sm"
                          >
                            {playingVoiceId === vn.noteId ? <Pause size={12} /> : <Play size={12} />}
                            <span>{playingVoiceId === vn.noteId ? t("pause") : t("play")}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-3 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setInspectingEmergency(null)} className="rounded-xl text-xs font-bold">
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default CaseReports;

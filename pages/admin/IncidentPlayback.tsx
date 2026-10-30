
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { Emergency, TelemetryPoint, EmergencyEvent, EmergencyStatus } from '../../types';
import { Button } from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, ArrowLeft, Clock, Users, MessageSquare, 
  Map as MapIcon, FastForward, Info, ShieldCheck, Activity, 
  Flame, ShieldAlert, Loader2, Navigation, Radio, Target, AlertTriangle, Smartphone,
  Satellite, ZoomIn, ZoomOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getChecklistTaskTitle } from '../../services/checklistLocalization';

const IncidentPlayback = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    
    const [emergency, setEmergency] = useState<Emergency | null>(null);
    const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
    const [events, setEvents] = useState<EmergencyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets');

    const [currentTime, setCurrentTime] = useState(0); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [duration, setDuration] = useState(0); 

    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<Record<string, any>>({});
    const incidentCoordsRef = useRef<[number, number] | null>(null);
    const playbackIntervalRef = useRef<any>(null);

    useEffect(() => {
        const loadRealData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const eDoc = await getDoc(doc(db, 'emergencies', id));
                if (eDoc.exists()) {
                    const eData = { id: eDoc.id, ...eDoc.data() } as Emergency;
                    setEmergency(eData);
                    
                    const startTs = eData.createdAt;
                    const endTs = eData.closedAt || (startTs + 300000);
                    setDuration(Math.floor((endTs - startTs) / 1000));

                    // جلب التتبع الحقيقي
                    const tSnap = await getDocs(query(collection(db, `emergencies/${id}/telemetry`), orderBy('timestamp', 'asc')));
                    const realTelemetry = tSnap.docs.map(d => d.data() as TelemetryPoint);
                    
                    // جلب المحادثات الحقيقية
                    const cSnap = await getDocs(query(collection(db, `emergencies/${id}/chat`), orderBy('timestamp', 'asc')));
                    const realChat = cSnap.docs.map(d => ({
                        id: d.id,
                        type: 'message' as const,
                        content: d.data().text,
                        userName: d.data().senderName,
                        timestamp: d.data().timestamp
                    }));

                    // جلب مهام الطوارئ المنجزة
                    const tksSnap = await getDocs(collection(db, `emergencies/${id}/tasks`));
                    const taskEvents = tksSnap.docs
                        .filter(d => d.data().completedAt)
                        .map(d => ({
                            id: d.id,
                            type: 'task' as const,
                            content: t('task_completed_event', { title: getChecklistTaskTitle(d.data(), i18n.language) }),
                            userName: d.data().completedByName || t('responder_name_fallback'),
                            timestamp: d.data().completedAt
                        }));

                    // جلب الملاحظات الصوتية
                    const vnSnap = await getDocs(collection(db, `emergencies/${id}/voice_notes`));
                    const voiceEvents = vnSnap.docs.map(d => ({
                        id: d.id,
                        type: 'message' as const,
                        content: t('voice_note_event', { duration: d.data().durationSeconds, desc: d.data().description || t('field_recording_fallback') }),
                        userName: d.data().userName,
                        timestamp: d.data().createdAt
                    }));

                    const allEvents = [...realChat, ...taskEvents, ...voiceEvents].sort((a, b) => a.timestamp - b.timestamp);

                    setTelemetry(realTelemetry);
                    setEvents(allEvents);

                    
                    if (realTelemetry.length === 0) {
                        console.warn("No real telemetry found for this incident.");
                    }
                }
            } catch (err) { console.error("Playback Error:", err); }
            setLoading(false);
        };
        loadRealData();
    }, [id]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current || loading) return;
        const L = (window as any).L;
        if (!L) return;
        mapRef.current = L.map(containerRef.current, { center: [24.7136, 46.6753], zoom: 15, zoomControl: false, attributionControl: false });
        
        // Free open-source map tile layer (Zero API key needed)
        if (mapLayer === 'streets') {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
        } else {
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: '© Esri ArcGIS'
            }).addTo(mapRef.current);
        }
        
        if (emergency?.locationId) {
            getDoc(doc(db, 'locations', emergency.locationId)).then(lDoc => {
                if (lDoc.exists()) {
                    const lData = lDoc.data();
                    if (lData.coords?.lat && lData.coords?.lng) {
                        incidentCoordsRef.current = [lData.coords.lat, lData.coords.lng];
                        const fireIcon = L.divIcon({
                            className: 'fire-marker',
                            html: `<div class="relative"><div class="absolute -inset-4 bg-red-500/40 rounded-full animate-ping"></div><div class="bg-red-600 p-2 rounded-full border-2 border-white text-white shadow-2xl"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 3.5 6.5 1.5 2 1 4.5-1 6.5"></path><path d="M12 22c4.418 0 8-3.582 8-8 0-1.125-.232-2.195-.651-3.163C16.893 11.233 14.636 12 12 12s-4.893-.767-7.349-1.163A7.962 7.962 0 0 0 4 14c0 4.418 3.582 8 8 8z"></path></svg></div></div>`,
                            iconSize: [40, 40], iconAnchor: [20, 20]
                        });
                        L.marker([lData.coords.lat, lData.coords.lng], { icon: fireIcon }).addTo(mapRef.current);
                        mapRef.current.setView([lData.coords.lat, lData.coords.lng], 16);
                    }
                }
            });
        }

        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (e) {}
                mapRef.current = null;
            }
        };
    }, [loading, emergency]);

    // Handle switching between Streets and Satellite layers (Both 100% Free, No API key)
    useEffect(() => {
        if (!mapRef.current) return;
        const L = (window as any).L;
        if (!L) return;
        mapRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.TileLayer) {
                try { mapRef.current.removeLayer(layer); } catch (e) {}
            }
        });
        if (mapLayer === 'streets') {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
        } else {
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: '© Esri ArcGIS'
            }).addTo(mapRef.current);
        }
    }, [mapLayer]);

    useEffect(() => {
        if (isPlaying) {
            playbackIntervalRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    if (prev >= duration) { setIsPlaying(false); return duration; }
                    return prev + 1;
                });
            }, 1000 / playbackSpeed);
        } else {
            clearInterval(playbackIntervalRef.current);
        }
        return () => clearInterval(playbackIntervalRef.current);
    }, [isPlaying, playbackSpeed, duration]);

    useEffect(() => {
        if (!mapRef.current || !emergency) return;
        const L = (window as any).L;
        const targetMs = emergency.createdAt + (currentTime * 1000);
        
        const currentPos: Record<string, TelemetryPoint> = {};
        telemetry.forEach(p => {
            if (p.timestamp <= targetMs) {
                if (!currentPos[p.userId] || p.timestamp > currentPos[p.userId].timestamp) {
                    currentPos[p.userId] = p;
                }
            }
        });

        Object.values(currentPos).forEach(p => {
            if (markersRef.current[p.userId]) {
                markersRef.current[p.userId].setLatLng([p.lat, p.lng]);
            } else {
                const icon = L.divIcon({
                    className: 'responder-marker-tactical',
                    html: `<div class="flex flex-col items-center"><div class="bg-black/80 text-white text-[8px] font-black px-2 py-0.5 rounded-full mb-1 border border-white/20 shadow-lg whitespace-nowrap">${p.userName}</div><div class="w-6 h-6 rounded-lg rotate-45 border-2 border-white shadow-2xl flex items-center justify-center animate-pulse bg-blue-500"><div class="-rotate-45 text-white"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div></div></div>`,
                    iconSize: [100, 40], iconAnchor: [50, 35]
                });
                markersRef.current[p.userId] = L.marker([p.lat, p.lng], { icon, zIndexOffset: 10000 }).addTo(mapRef.current);
            }
        });
    }, [currentTime, telemetry, emergency]);

    const visibleMessages = useMemo(() => {
        if (!emergency) return [];
        const targetMs = emergency.createdAt + (currentTime * 1000);
        return events.filter(ev => ev.timestamp <= targetMs).slice(-3);
    }, [currentTime, events, emergency]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-gray-950 gap-6 text-white font-black"><Loader2 className="animate-spin text-primary" size={64}/>{t('loading_blackbox_data')}</div>;

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-950 p-2 lg:p-4 overflow-hidden">
            {/* Header - Compact for Mobile */}
            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-center gap-3 z-50 border border-white/10 mb-2">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button onClick={() => navigate('/admin/reports')} className="p-3 bg-white/10 rounded-2xl text-primary"><ArrowLeft className="rtl:rotate-180" size={20}/></button>
                    <div className="min-w-0">
                        <h2 className="text-sm lg:text-xl font-black text-white uppercase truncate flex items-center gap-2">
                            <Radio size={16} className="text-red-500 animate-pulse" /> {t('replay_incident')} {emergency?.typeName}
                        </h2>
                        <p className="text-[9px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{emergency?.locationName}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full lg:w-auto gap-4 bg-black/40 px-6 py-2 rounded-2xl border border-primary/20">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-primary uppercase opacity-50">{t('elapsed_time')}</span>
                        <div className="flex items-baseline gap-1">
                             <span className="font-mono font-black text-xl lg:text-2xl text-primary">{formatTime(currentTime)}</span>
                             <span className="text-gray-500 text-[10px] font-bold">/ {formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="text-white flex items-center gap-2">
                        {telemetry.length > 0 ? <ShieldCheck size={18} className="text-green-500" /> : <AlertTriangle size={18} className="text-yellow-500" />}
                        <span className="text-[10px] font-black">{telemetry.length > 0 ? t('real_data') : t('no_telemetry')}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden">
                {/* Tactical Map - Largest Space on Mobile */}
                <div className="flex-[3] relative rounded-[1.5rem] lg:rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
                    <div ref={containerRef} className="w-full h-full" />
                    
                    {/* Floating Map Controls (Free, Zero API Key) */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                        <div className="bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl flex flex-col gap-1.5">
                            {/* Layer Toggle (OpenStreetMap / ArcGIS Satellite) */}
                            <button
                                type="button"
                                onClick={() => setMapLayer(prev => prev === 'streets' ? 'satellite' : 'streets')}
                                className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
                                    mapLayer === 'satellite' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                title={mapLayer === 'streets' ? t('switch_to_satellite_tooltip') : t('switch_to_streets_tooltip')}
                            >
                                {mapLayer === 'streets' ? <Satellite size={16} /> : <MapIcon size={16} />}
                                <span className="text-[10px] hidden sm:inline">
                                    {mapLayer === 'streets' ? t('switch_to_satellite') : t('switch_to_street_map')}
                                </span>
                            </button>

                            {/* Zoom In */}
                            <button
                                type="button"
                                onClick={() => mapRef.current?.zoomIn()}
                                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                                title={t('zoom_in')}
                            >
                                <ZoomIn size={16} />
                            </button>

                            {/* Zoom Out */}
                            <button
                                type="button"
                                onClick={() => mapRef.current?.zoomOut()}
                                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                                title={t('zoom_out')}
                            >
                                <ZoomOut size={16} />
                            </button>

                            {/* Recenter */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (mapRef.current && incidentCoordsRef.current) {
                                        mapRef.current.setView(incidentCoordsRef.current, 16);
                                    }
                                }}
                                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                                title={t('recenter_incident')}
                            >
                                <Target size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Free Service Indicator Badge */}
                    <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
                        <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            {t('free_live_tracking_badge')} • {mapLayer === 'streets' ? 'OpenStreetMap' : 'ArcGIS Satellite'}
                        </div>
                    </div>

                    {/* Real Messages Overlay */}
                    <div className="absolute top-4 left-4 w-60 lg:w-80 space-y-2 pointer-events-none z-[1000]">
                        <AnimatePresence mode="popLayout">
                            {visibleMessages.map((ev) => (
                                <motion.div 
                                    key={ev.id} initial={{ opacity: 0, x: -30, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8, x: -50 }}
                                    className="bg-black/60 backdrop-blur-xl p-3 rounded-[1rem] lg:rounded-[1.5rem] border border-white/10 flex gap-3 items-start"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0"><MessageSquare size={12}/></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-primary uppercase">{ev.userName}</p>
                                        <p className="text-[9px] font-bold text-white leading-tight line-clamp-2">{ev.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Playback Controls - Sticky Bottom on Mobile */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-[1.5rem] lg:rounded-[3rem] p-4 lg:p-8 flex flex-col gap-4 border border-white/10">
                    <div className="hidden lg:block space-y-4">
                        <h3 className="text-lg font-black text-white flex items-center gap-2"><ShieldAlert size={22} className="text-primary"/> {t('stats')}</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                             <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                 <p className="text-[9px] font-black text-gray-500 uppercase">{t('responders')}</p>
                                 <p className="text-sm font-black text-primary">{emergency?.responders.length}</p>
                             </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-4 bg-black/40 p-4 lg:p-6 rounded-[1.5rem] border border-white/5">
                        <input type="range" min="0" max={duration} value={currentTime} onChange={(e) => setCurrentTime(parseInt(e.target.value))} className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary" />

                        <div className="flex justify-center items-center gap-6">
                            <button onClick={() => setPlaybackSpeed(prev => prev === 1 ? 2 : prev === 2 ? 5 : 1)} className="w-12 h-12 bg-white/10 rounded-2xl text-[10px] font-black text-white hover:text-primary transition-all flex flex-col items-center justify-center border border-white/10">
                                <FastForward size={16}/> {playbackSpeed}x
                            </button>
                            
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}>
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
                            </button>

                            <button onClick={() => {setCurrentTime(0); setIsPlaying(false);}} className="w-12 h-12 bg-white/10 rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-white/10 flex items-center justify-center">
                                <RotateCcw size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-center py-2 opacity-30">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('forensic_replay_module')}</span>
            </div>
        </div>
    );
};

export default IncidentPlayback;

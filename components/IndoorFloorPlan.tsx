import React, { useState, useEffect, useRef } from 'react';
import { 
  FloorPlan, FloorPlanMarker, Emergency 
} from '../types';
import { floorPlanService } from '../services/floorPlanService';
import { 
  ZoomIn, ZoomOut, RotateCcw, Shield, AlertTriangle, 
  DoorOpen, HeartPulse, Flame, Flag, Ban, CheckCircle2, 
  Info, Siren, Plus, Layers, MapPin, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IndoorFloorPlanProps {
  locationId: string;
  locationName: string;
  floorNumber?: string;
  currentEmergency?: Emergency | null;
  isAdmin?: boolean;
  className?: string;
}

export const IndoorFloorPlan: React.FC<IndoorFloorPlanProps> = ({
  locationId,
  locationName,
  floorNumber = '1',
  currentEmergency,
  isAdmin = false,
  className = '',
}) => {
  const [plan, setPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState<FloorPlanMarker | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [newMarkerData, setNewMarkerData] = useState<Partial<FloorPlanMarker>>({
    type: 'room',
    label: '',
    x: 50,
    y: 50,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    floorPlanService.getFloorPlan(locationId, locationName, floorNumber).then((p) => {
      if (isMounted) {
        setPlan(p);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [locationId, locationName, floorNumber]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.marker-btn')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, z - 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Toggle blocked status
  const handleToggleBlocked = async (marker: FloorPlanMarker) => {
    if (!plan) return;
    const nextBlocked = !marker.isBlocked;
    const ok = await floorPlanService.toggleBlockedMarker(plan.id, marker.id, nextBlocked);
    if (ok) {
      setPlan({
        ...plan,
        markers: plan.markers.map((m) =>
          m.id === marker.id ? { ...m, isBlocked: nextBlocked } : m
        ),
      });
      setSelectedMarker((prev) => (prev ? { ...prev, isBlocked: nextBlocked } : null));
    }
  };

  // Add new marker
  const handleSaveNewMarker = async () => {
    if (!plan || !newMarkerData.label) return;
    const marker: FloorPlanMarker = {
      id: `m_${Date.now()}`,
      type: newMarkerData.type || 'room',
      label: newMarkerData.label,
      x: Number(newMarkerData.x) || 50,
      y: Number(newMarkerData.y) || 50,
      equipmentType: newMarkerData.equipmentType,
      notes: newMarkerData.notes,
    };
    const updated = {
      ...plan,
      markers: [...plan.markers, marker],
    };
    const ok = await floorPlanService.saveFloorPlan(updated);
    if (ok) {
      setPlan(updated);
      setIsAddingMarker(false);
      setNewMarkerData({ type: 'room', label: '', x: 50, y: 50 });
    }
  };

  // Default incident coordinate on floor if active
  const incidentPoint = currentEmergency ? { x: 50, y: 50 } : null;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Top Controls Toolbar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black dark:text-white">
              {plan?.title || `مخطط الطابق ${floorNumber}`}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {locationName} — المخطط الهندسي التفاعلي لمسارات النجاة والتجهيزات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-primary rounded-xl text-xs font-bold shadow-2xs transition-colors"
            title="تكبير (+)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-primary rounded-xl text-xs font-bold shadow-2xs transition-colors"
            title="تصغير (-)"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-primary rounded-xl text-xs font-bold shadow-2xs transition-colors"
            title="إعادة ضبط الرؤية"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              showLegend 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            دليل الرموز
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAddingMarker(true)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus size={14} />
              <span>إضافة نقطة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Floor Plan Canvas / SVG Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[450px] sm:h-[550px] bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
            جاري تحميل المخطط الهندسي للطابق...
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {/* Architectural Blueprint Vector Representation */}
            <svg
              viewBox="0 0 1000 700"
              className="w-[900px] h-[630px] rounded-2xl shadow-2xl border-4 border-slate-700 bg-slate-950/90"
            >
              {/* Blueprint Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
                <pattern id="hazardStripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#ef4444" strokeWidth="8" />
                </pattern>
              </defs>
              <rect width="1000" height="700" fill="url(#grid)" />

              {/* Exterior Perimeter Walls */}
              <rect x="40" y="40" width="920" height="620" fill="none" stroke="#38bdf8" strokeWidth="6" rx="12" />

              {/* Main Corridors */}
              {/* North-South Corridor */}
              <rect x="440" y="40" width="120" height="620" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,6" />
              {/* East-West Corridor */}
              <rect x="40" y="300" width="920" height="100" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,6" />

              {/* North Wing Rooms */}
              <rect x="50" y="50" width="380" height="240" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" rx="8" />
              <text x="240" y="170" fill="#94a3b8" fontSize="18" fontWeight="bold" textAnchor="middle">قاعة العمليات الشمالية (A-1)</text>

              <rect x="570" y="50" width="380" height="240" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" rx="8" />
              <text x="760" y="170" fill="#94a3b8" fontSize="18" fontWeight="bold" textAnchor="middle">غرفة التحكم والشبكات (A-2)</text>

              {/* South Wing Rooms */}
              <rect x="50" y="410" width="380" height="240" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" rx="8" />
              <text x="240" y="530" fill="#94a3b8" fontSize="18" fontWeight="bold" textAnchor="middle">المكاتب الإدارية والخدمات (B-1)</text>

              <rect x="570" y="410" width="380" height="240" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" rx="8" />
              <text x="760" y="530" fill="#94a3b8" fontSize="18" fontWeight="bold" textAnchor="middle">قاعة الاجتماعات والطوارئ (B-2)</text>

              {/* Corridor Center Label */}
              <text x="500" y="355" fill="#38bdf8" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="2">
                الممر العملياتي الرئيسي
              </text>

              {/* Interactive Markers Overlay */}
              {plan?.markers.map((marker) => {
                const posX = (marker.x / 100) * 1000;
                const posY = (marker.y / 100) * 700;
                const isBlocked = !!marker.isBlocked;

                return (
                  <g 
                    key={marker.id} 
                    transform={`translate(${posX}, ${posY})`}
                    className="marker-btn cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedMarker(marker)}
                  >
                    {/* Blocked Path Hazard Warning */}
                    {isBlocked && (
                      <circle r="36" fill="url(#hazardStripes)" stroke="#dc2626" strokeWidth="3" className="animate-pulse" opacity="0.85" />
                    )}

                    {/* Outer Glow */}
                    <circle 
                      r="20" 
                      fill={
                        isBlocked 
                          ? '#ef4444' 
                          : marker.type === 'exit' 
                          ? '#10b981' 
                          : marker.type === 'assembly_point' 
                          ? '#3b82f6' 
                          : marker.type === 'equipment' 
                          ? '#f59e0b' 
                          : '#6366f1'
                      } 
                      opacity="0.25" 
                      className="animate-ping" 
                    />

                    {/* Main Pin Circle */}
                    <circle 
                      r="16" 
                      fill={
                        isBlocked 
                          ? '#dc2626' 
                          : marker.type === 'exit' 
                          ? '#059669' 
                          : marker.type === 'assembly_point' 
                          ? '#2563eb' 
                          : marker.type === 'equipment' 
                          ? '#d97706' 
                          : '#4f46e5'
                      } 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                    />

                    {/* Icon Glyph */}
                    <text 
                      x="0" 
                      y="5" 
                      fill="#ffffff" 
                      fontSize="12" 
                      fontWeight="bold" 
                      textAnchor="middle"
                    >
                      {marker.type === 'exit' ? '🚪' : marker.type === 'equipment' ? '🧯' : marker.type === 'assembly_point' ? '🚩' : '📍'}
                    </text>

                    {/* Label Badge */}
                    <text 
                      x="0" 
                      y="-22" 
                      fill="#ffffff" 
                      fontSize="11" 
                      fontWeight="bold" 
                      textAnchor="middle"
                      className="bg-black/80 pointer-events-none drop-shadow"
                    >
                      {marker.label}
                    </text>
                  </g>
                );
              })}

              {/* Active Incident Beacon (If Active Emergency) */}
              {incidentPoint && (
                <g 
                  transform={`translate(${(incidentPoint.x / 100) * 1000}, ${(incidentPoint.y / 100) * 700})`}
                  className="animate-bounce"
                >
                  <circle r="50" fill="#dc2626" opacity="0.3" className="animate-ping" />
                  <circle r="30" fill="#ef4444" opacity="0.6" className="animate-ping" />
                  <circle r="18" fill="#991b1b" stroke="#ffffff" strokeWidth="3" />
                  <text x="0" y="6" fill="#ffffff" fontSize="16" textAnchor="middle">🚨</text>
                  <rect x="-80" y="-45" width="160" height="26" fill="#dc2626" rx="6" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="0" y="-28" fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">
                    موقع البلاغ النشط
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}

        {/* Selected Marker Details Flyout */}
        <AnimatePresence>
          {selectedMarker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700 z-30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {selectedMarker.type === 'exit' ? '🚪' : selectedMarker.type === 'equipment' ? '🧯' : selectedMarker.type === 'assembly_point' ? '🚩' : '📍'}
                  </span>
                  <div>
                    <h4 className="text-sm font-black dark:text-white">
                      {selectedMarker.label}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                      {selectedMarker.type === 'exit' ? 'مخرج طوارئ' : selectedMarker.type === 'equipment' ? 'معدات سلامة' : selectedMarker.type === 'assembly_point' ? 'نقطة تجمع' : 'موقع داخلي'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              {selectedMarker.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  {selectedMarker.notes}
                </p>
              )}

              {/* Status & Blocked Toggle */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  selectedMarker.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedMarker.isBlocked ? '⚠️ المسار مغلق / معطل' : '✅ المسار سالك ومتاح'}
                </span>

                <button
                  onClick={() => handleToggleBlocked(selectedMarker)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    selectedMarker.isBlocked 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {selectedMarker.isBlocked ? 'فتح المسار' : 'إغلاق المسار'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend Footer */}
      {showLegend && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-around gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span>🚪</span>
            <span>مخارج طوارئ</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span>🧯</span>
            <span>معدات إطفاء وإسعاف</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span>🚩</span>
            <span>نقاط التجمع</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span>⚠️</span>
            <span>مسارات محظورة/مغلقة</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600">
            <span>🚨</span>
            <span>موقع البلاغ الفعلي</span>
          </div>
        </div>
      )}

      {/* Admin Add Marker Modal */}
      {isAddingMarker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-base font-black dark:text-white">إضافة نقطة على المخطط</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">التسمية</label>
                <input
                  type="text"
                  value={newMarkerData.label || ''}
                  onChange={(e) => setNewMarkerData({ ...newMarkerData, label: e.target.value })}
                  placeholder="مثال: مخرج طوارئ B أو مطفأة حريق"
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">النوع</label>
                <select
                  value={newMarkerData.type || 'room'}
                  onChange={(e) => setNewMarkerData({ ...newMarkerData, type: e.target.value as any })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold"
                >
                  <option value="room">غرفة / قاعة</option>
                  <option value="exit">مخرج طوارئ</option>
                  <option value="equipment">معدات سلامة</option>
                  <option value="assembly_point">نقطة تجمع</option>
                  <option value="blocked_path">مسار معطل</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">الموقع الأفقي X (0-100%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMarkerData.x ?? 50}
                    onChange={(e) => setNewMarkerData({ ...newMarkerData, x: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">الموقع الرأسي Y (0-100%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMarkerData.y ?? 50}
                    onChange={(e) => setNewMarkerData({ ...newMarkerData, y: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">ملاحظات إرشادية</label>
                <textarea
                  value={newMarkerData.notes || ''}
                  onChange={(e) => setNewMarkerData({ ...newMarkerData, notes: e.target.value })}
                  placeholder="ملاحظات للاستجابة السريعة..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs font-bold"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingMarker(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveNewMarker}
                className="px-4 py-2 rounded-xl text-xs font-black bg-primary text-white hover:bg-primary/90"
              >
                حفظ النقطة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

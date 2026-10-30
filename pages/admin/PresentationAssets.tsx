
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Sparkles, Download, Loader2, Key, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PresentationAssets = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [generating, setGenerating] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

    const slides = [
        {
            id: 'login',
            title: t("slide_login_title"),
            description: t("slide_login_desc"),
            prompt: "A ultra-futuristic, minimalist smartphone login screen for an emergency system. Sleek interface with glowing soft blue biometric fingerprint icon. Glassmorphism effect, volumetric lighting, high-tech security vibe, 8k resolution, cinematic render."
        },
        {
            id: 'dashboard',
            title: t("slide_dashboard_title"),
            description: t("slide_dashboard_desc"),
            prompt: "High-tech emergency response command center, multi-screen wall showing glowing digital maps of a city, dynamic data visualizations, red alert icons pulsing. Dark cinematic atmosphere, dramatic backlighting, sci-fi military aesthetic, photorealistic."
        },
        {
            id: 'vision',
            title: t("slide_vision_title"),
            description: t("slide_vision_desc"),
            prompt: "First-person view of a robot eye analyzing a house fire scene. Digital HUD overlay showing 'THREAT DETECTED', 'RISK SCORE: 9.5', and object boxes around hazards. Cyan and neon orange tech interface, smoky environment, hyper-detailed, 4k."
        },
        {
            id: 'ar_nav',
            title: t("slide_ar_nav_title"),
            description: t("slide_ar_nav_desc"),
            prompt: "POV looking through a smartphone at a dark, smoky building corridor. Glowing 3D AR green arrows on the floor pointing to 'EXIT'. Holographic icons for 'FIRE EXTINGUISHER' and 'VICTIM' floating in space. Mixed reality concept, intense atmosphere."
        },
        {
            id: 'comm',
            title: t("slide_comm_title"),
            description: t("slide_comm_desc"),
            prompt: "Two first responders in advanced tactical gear communicating via high-tech wrist-worn devices. Floating holographic chat bubbles between them, digital translation waves in the air. Urban ruins background, heroic cinematic lighting, 8k."
        },
        {
            id: 'brain',
            title: t("strategic_brain_reports"),
            description: t("strategic_brain_desc"),
            prompt: "A glowing digital brain made of fiber-optic circuits and data nodes. Surrounded by floating translucent legal documents and performance charts. Symbolic of super-intelligence, strategic auditing, and AI power, abstract tech background."
        }
    ];

    const generateImage = async (slide: typeof slides[0]) => {
        setGenerating(slide.id);
        try {
            const response = await fetch('/api/gemini/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: slide.prompt, aspectRatio: '16:9' }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || t('image_generation_failed'));
            }
            const data = await response.json();
            if (data.imageUrl) {
                setGeneratedImages(prev => ({ ...prev, [slide.id]: data.imageUrl }));
            }
        } catch (error: any) {
            alert(t("image_generation_failed") + ": " + error.message);
        } finally {
            setGenerating(null);
        }
    };

    const downloadImage = (id: string) => {
        const link = document.createElement('a');
        link.href = generatedImages[id];
        link.download = `ers_slide_${id}.png`;
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between border-b pb-6 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-4 rounded-3xl text-primary"><ImageIcon size={32}/></div>
                    <div>
                        <h1 className="text-3xl font-black dark:text-white">{t('presentation_assets')}</h1>
                        <p className="text-gray-500 font-bold text-sm">{t("generate_high_res_slides")}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin')}><ArrowLeft className="mr-2 rtl:rotate-180" /> {t('back')}</Button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-4">
                <Info className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200 font-bold leading-relaxed">
                    {t("presentation_assets_notice")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {slides.map(slide => (
                    <motion.div 
                        key={slide.id}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col"
                    >
                        <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative group">
                            {generatedImages[slide.id] ? (
                                <>
                                    <img src={generatedImages[slide.id]} className="w-full h-full object-cover" alt={slide.title} />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => downloadImage(slide.id)} className="bg-white text-black p-3 rounded-full shadow-2xl"><Download size={24}/></button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <ImageIcon size={48} className="opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Pending Render</span>
                                </div>
                            )}
                            {generating === slide.id && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
                                    <Loader2 className="animate-spin" size={40} />
                                    <p className="text-xs font-black animate-pulse">{t("ai_drawing_in_progress")}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 space-y-3 flex-1 flex flex-col">
                            <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
                                <Sparkles className="text-primary" size={18} /> {slide.title}
                            </h3>
                            <p className="text-[11px] text-gray-500 font-bold leading-relaxed">{slide.description}</p>
                            <div className="pt-4 mt-auto">
                                <Button 
                                    onClick={() => generateImage(slide)} 
                                    disabled={!!generating}
                                    fullWidth 
                                    className="rounded-2xl py-3 font-black text-xs"
                                >
                                    {generatedImages[slide.id] ? t("regenerate_pro") : t("generate_slide_img")}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default PresentationAssets;

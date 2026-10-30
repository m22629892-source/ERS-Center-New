
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, UserRole, Settings, Emergency, EmergencyStatus, AppLinks, StaffAvailabilityStatus } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, setDoc, doc, getDoc, 
  arrayUnion, query, orderBy, serverTimestamp, where, limit, 
  enableNetwork, disableNetwork 
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { mobileNotificationService } from '../services/mobileNotificationService';
import { mobileLocationService, LocationReport } from '../services/mobileLocationService';
import { unregisterDeviceOnLogout } from '../services/deviceService';
import { deviceTrackingService } from '../services/deviceTrackingService';
import { readinessService } from '../services/readinessService';
import { checklistService } from '../services/checklistService';
import i18n from '../i18n';

interface AppContextType {
  user: User | null;
  users: User[];
  login: (username: string, role: UserRole, password?: string, initialCoords?: {lat: number, lng: number}, rememberMe?: boolean, userDocId?: string, existingData?: any) => Promise<void>;
  logout: () => void;
  updateAvailabilityStatus: (status: StaffAvailabilityStatus, reason?: string) => Promise<void>;

  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  emergencies: Emergency[];
  activeEmergencies: Emergency[];
  createEmergency: (data: Partial<Emergency>) => Promise<string>;
  respondToEmergency: (id: string, action: string) => Promise<void>;
  dismissEmergency: (id: string) => Promise<void>;
  closeEmergency: (id: string) => Promise<void>;
  updateEmergencyReport: (id: string, report: string) => Promise<void>;
  appLinks: AppLinks;
  updateAppLinks: (links: AppLinks) => Promise<void>;
  geminiApiKey: string;
  geminiApiKeySecondary: string;
  updateGeminiApiKeys: (primary: string, secondary: string) => Promise<void>;
  unlockAudio: () => void;
  stopAllAlerts: () => void;
  playGlobalSiren: () => void;
  logAdminAction: (type: string, details: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  isFirebaseReady: boolean;
  isOfflineMode: boolean;
  isAudioUnlocked: boolean;
  isSyncing: boolean;
  // Mobile Shift Location & GPS
  isShiftSharing: boolean;
  startShiftSharing: () => Promise<{ success: boolean; error?: string }>;
  stopShiftSharing: () => Promise<void>;
  currentGpsLocation: LocationReport | null;
}

const themeColors: Record<string, string> = {
  blue: '#1976d2', red: '#dc004e', green: '#10b981', purple: '#7c3aed',
  indigo: '#6366f1', orange: '#f59e0b', teal: '#14b8a6', pink: '#ec4899', amber: '#d97706',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('esr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('esr_settings');
    return saved ? JSON.parse(saved) : { darkMode: false, language: 'ar', themeColor: 'blue', doNotDisturb: { enabled: false, start: "22:00", end: "07:00" }, translationLanguage: 'English', muteSiren: false };
  });
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [appLinks, setAppLinks] = useState<AppLinks>({ androidUrl: '', iosUrl: '' });
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiApiKeySecondary, setGeminiApiKeySecondary] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const [isShiftSharing, setIsShiftSharing] = useState<boolean>(() => mobileLocationService.isShiftActive());
  const [currentGpsLocation, setCurrentGpsLocation] = useState<LocationReport | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenRef = useRef<any>(null);
  const settingsRef = useRef(settings);
  const userRef = useRef(user); 
  const [activeEmergencies, setActiveEmergencies] = useState<Emergency[]>([]);

  // Mobile Push & Native Setup & Global Device Tracking
  useEffect(() => {
    mobileNotificationService.initialize();
    deviceTrackingService.initialize();

    if (user) {
      mobileNotificationService.setCurrentUser(user);
      mobileLocationService.setCurrentUser(user);
      deviceTrackingService.setCurrentUser(user);
    }

    const unsubLoc = mobileLocationService.subscribe((report) => {
      setCurrentGpsLocation(report);
      setIsShiftSharing(mobileLocationService.isShiftActive());
    });

    const handlePushReceived = (e: any) => {
      if (userRef.current && !settingsRef.current.muteSiren) {
        playGlobalSiren();
      }
    };
    window.addEventListener('ers:emergency-push-received', handlePushReceived);

    return () => {
      unsubLoc();
      window.removeEventListener('ers:emergency-push-received', handlePushReceived);
    };
  }, []);

  useEffect(() => {
    mobileNotificationService.setCurrentUser(user);
    mobileLocationService.setCurrentUser(user);
    deviceTrackingService.setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    settingsRef.current = settings;
    const color = themeColors[settings.themeColor] || themeColors.blue;
    document.documentElement.style.setProperty('--color-primary', color);
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const lang = settings.language || 'ar';
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    const isRTL = lang === 'ar' || lang === 'ku' || lang === 'ur';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    localStorage.setItem('esr_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const unlockAudio = () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => setIsAudioUnlocked(true));
    } else { setIsAudioUnlocked(true); }
  };

  const playGlobalSiren = () => {
    if (sirenRef.current || settingsRef.current.muteSiren) return;
    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sawtooth'; osc2.type = 'square';
    const sweep = () => {
        const now = ctx.currentTime;
        osc1.frequency.setValueAtTime(1000, now); osc1.frequency.exponentialRampToValueAtTime(2500, now + 0.2);
        osc2.frequency.setValueAtTime(800, now); osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
    };
    sweep();
    const interval = setInterval(sweep, 450);
    gain.gain.value = 0.5; osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(); osc2.start();
    sirenRef.current = { osc1, osc2, interval };
  };

  const stopAllAlerts = () => {
    if (sirenRef.current) {
        sirenRef.current.osc1.stop(); sirenRef.current.osc2.stop();
        clearInterval(sirenRef.current.interval);
        sirenRef.current = null;
    }
  };

  // Listen to all users as long as Firebase is ready
  useEffect(() => {
    if (!isFirebaseReady) return;
    const unsubU = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    }, (err) => {
      console.warn('Users subscription error:', err);
    });
    return () => unsubU();
  }, [isFirebaseReady]);

  useEffect(() => {
    // Only subscribe to emergencies and live alerts if user is authenticated and session verified
    if (!isFirebaseReady || !user || !user.id) {
      setActiveEmergencies([]);
      setEmergencies([]);
      stopAllAlerts();
      return;
    }

    const unsubActive = onSnapshot(query(collection(db, 'emergencies'), where('status', '==', EmergencyStatus.ACTIVE)), (snap) => {
      // STRICT ISOLATION: Drills must never alert operational teams or trigger global sirens
      const activeList = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Emergency))
        .filter(e => !e.isDrill && !e.id.startsWith('drill_') && e.typeId !== 'type_drill_simulation');
      setActiveEmergencies(activeList);
      const currentUser = userRef.current;
      if (!currentUser) {
        stopAllAlerts();
        return;
      }
      const needsAlert = activeList.filter(e => !e.responders?.includes(currentUser.name || '') && !e.dismissedBy?.includes(currentUser.id || ''));
      if (needsAlert.length > 0 && !settingsRef.current.muteSiren) playGlobalSiren();
      else stopAllAlerts();
    }, (err) => {
      console.warn('Active emergencies subscription error:', err);
    });

    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            if (data.appLinks) setAppLinks(data.appLinks);
            if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
            if (data.geminiApiKeySecondary) setGeminiApiKeySecondary(data.geminiApiKeySecondary);
        }
    }, (err) => {
      console.warn('System config subscription error:', err);
    });

    const unsubAll = onSnapshot(query(collection(db, 'emergencies'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
      setEmergencies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Emergency)));
    }, (err) => {
      console.warn('All emergencies subscription error:', err);
    });

    return () => { 
      unsubConfig(); 
      unsubActive(); 
      unsubAll(); 
      stopAllAlerts(); 
    };
  }, [isFirebaseReady, user?.id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) setIsFirebaseReady(true);
      else signInAnonymously(auth);
    });
    return () => unsubscribe();
  }, []);

  const login = async (
    username: string, 
    requestedRole: UserRole, 
    password?: string, 
    initialCoords?: {lat: number, lng: number},
    rememberMe?: boolean,
    userDocId?: string,
    existingData?: any
  ) => {
    const id = userDocId || username.toLowerCase().replace(/\s+/g, '-');
    const userDocRef = doc(db, 'users', id);
    const userSnap = await getDoc(userDocRef);
    let finalUserData: any;
    const now = Date.now();
    const locUpdate = initialCoords && (initialCoords.lat !== 0 || initialCoords.lng !== 0) 
      ? { lastLocation: { ...initialCoords, timestamp: now } } 
      : {};

    if (userSnap.exists()) {
        const dbData = userSnap.data() as User;
        finalUserData = { 
          ...dbData, 
          ...(existingData || {}), 
          id, 
          status: 'online', 
          lastLogin: now, 
          lastHeartbeat: now,
          ...locUpdate 
        };
        await updateDoc(userDocRef, { 
          status: 'online', 
          lastLogin: now, 
          lastHeartbeat: now,
          ...locUpdate 
        });
    } else if (existingData) {
        finalUserData = { 
          ...existingData, 
          id, 
          status: 'online', 
          lastLogin: now, 
          lastHeartbeat: now,
          ...locUpdate 
        };
        await setDoc(userDocRef, finalUserData);
    } else {
        finalUserData = { 
          id, 
          name: username, 
          username, 
          role: requestedRole, 
          status: 'online', 
          lastLogin: now, 
          lastHeartbeat: now, 
          lastLocation: initialCoords || { lat: 0, lng: 0, timestamp: now } 
        };
        await setDoc(userDocRef, finalUserData);
    }

    try {
      await addDoc(collection(db, 'login_logs'), {
        userId: id,
        userName: finalUserData.name || finalUserData.username || username,
        loginTime: now,
        device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
      });
    } catch (logErr) {
      console.warn("Failed to write login log:", logErr);
    }

    setUser(finalUserData as User);
    localStorage.setItem('esr_user', JSON.stringify(finalUserData));
    mobileNotificationService.setCurrentUser(finalUserData as User);
    mobileLocationService.setCurrentUser(finalUserData as User);
    deviceTrackingService.setCurrentUser(finalUserData as User);
  };

  const logout = async () => { 
    stopAllAlerts();
    if (user) {
      try {
        await unregisterDeviceOnLogout(user.id);
        await deviceTrackingService.markDeviceOfflineOnLogout(user.id);
        await mobileLocationService.stopShiftSharing();
        await updateDoc(doc(db, 'users', user.id), { status: 'offline' });
      } catch (err) {
        console.warn('Logout cleanup warning:', err);
      }
    }
    mobileNotificationService.onLogout();
    mobileLocationService.setCurrentUser(null);
    deviceTrackingService.setCurrentUser(null);
    setUser(null); 
    setActiveEmergencies([]);
    setEmergencies([]);
    setUsers([]);
    try {
      localStorage.removeItem('esr_user');
      localStorage.removeItem('ers_fcm_token');
      sessionStorage.clear();
    } catch (e) {}
    stopAllAlerts(); 
  };

  const startShiftSharing = async () => {
    const res = await mobileLocationService.startShiftSharing();
    if (res.success) {
      setIsShiftSharing(true);
    }
    return res;
  };

  const stopShiftSharing = async () => {
    await mobileLocationService.stopShiftSharing();
    setIsShiftSharing(false);
  };
  
  const updateAvailabilityStatus = async (status: StaffAvailabilityStatus, reason?: string) => {
    if (!user) return;
    await readinessService.setStaffAvailability({
      targetUserId: user.id,
      newStatus: status,
      updatedByUser: user,
      reason
    });
    setUser(prev => prev ? { ...prev, availabilityStatus: status } : null);
  };

  const createEmergency = async (data: Partial<Emergency>) => {
    const docRef = await addDoc(collection(db, 'emergencies'), { 
      ...data, 
      createdBy: user?.id, 
      creatorName: user?.name, 
      createdAt: Date.now(), 
      status: EmergencyStatus.ACTIVE, 
      responders: [] 
    });

    // Auto-instantiate approved checklist for this incident
    if (data.typeId) {
      checklistService.instantiateIncidentChecklist(docRef.id, data.typeId, user || undefined)
        .catch(err => console.warn('Checklist auto-instantiate error:', err));
    }

    return docRef.id;
  };
  
  const respondToEmergency = async (id: string, action: string) => {
    if (!user) return;
    stopAllAlerts(); 
    mobileLocationService.setAssignedEmergency(id);
    await updateDoc(doc(db, 'emergencies', id), { 
      responders: arrayUnion(user.name), 
      [`responderActions.${user.name.replace(/\./g, '_')}`]: action 
    });

    // Automatically transition responder availability to 'responding'
    await readinessService.markRespondingToEmergency(user, id);
    setUser(prev => prev ? { ...prev, availabilityStatus: 'responding' } : null);
  };

  const dismissEmergency = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'emergencies', id), { dismissedBy: arrayUnion(user.id) });
  };

  const closeEmergency = async (id: string) => { 
    stopAllAlerts(); 
    mobileLocationService.setAssignedEmergency(null);
    await updateDoc(doc(db, 'emergencies', id), { 
      status: EmergencyStatus.CLOSED, 
      closedAt: Date.now(), 
      closedBy: user?.id, 
      closedByName: user?.name 
    });

    // Revert user readiness status taking into account other active incidents
    if (user) {
      await readinessService.handleEmergencyClosedForStaff(user.id, id);
    }
  };

  const updateEmergencyReport = async (id: string, report: string) => { await updateDoc(doc(db, 'emergencies', id), { aiReport: report }); };
  const updateAppLinks = async (links: AppLinks) => { await setDoc(doc(db, 'system', 'config'), { appLinks: links }, { merge: true }); };
  const updateGeminiApiKeys = async (primary: string, secondary: string) => { await setDoc(doc(db, 'system', 'config'), { geminiApiKey: primary, geminiApiKeySecondary: secondary }, { merge: true }); };
  const logAdminAction = async (type: string, details: string) => { if (user) await addDoc(collection(db, 'admin_logs'), { userId: user.id, userName: user.name, actionType: type, details, timestamp: Date.now() }); };
  const updateProfile = async (data: any) => { if (user) { await updateDoc(doc(db, 'users', user.id), data); const updated = { ...user, ...data }; setUser(updated); localStorage.setItem('esr_user', JSON.stringify(updated)); } };
  
  return (
    <AppContext.Provider value={{ 
      user, users, login, logout, updateAvailabilityStatus, settings, updateSettings: (s) => setSettings(p => ({...p, ...s})), 
      emergencies, activeEmergencies, createEmergency, respondToEmergency, dismissEmergency, closeEmergency, 
      updateEmergencyReport, appLinks, updateAppLinks, geminiApiKey, geminiApiKeySecondary, updateGeminiApiKeys,
      unlockAudio, stopAllAlerts, playGlobalSiren, logAdminAction, updateProfile, isFirebaseReady, isOfflineMode, isAudioUnlocked, isSyncing,
      isShiftSharing, startShiftSharing, stopShiftSharing, currentGpsLocation
    }}>
      {children}
    </AppContext.Provider>
  );

};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp error');
  return context;
};

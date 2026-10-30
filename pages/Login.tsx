
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, User, MapPin, Loader2, AlertCircle, Check, WifiOff } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const Login = () => {
  const { login, users, unlockAudio, user: contextUser, isOfflineMode } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'denied' | 'success'>('idle');
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('esr_remembered_creds');
    if (saved) {
      try {
        const { u, p } = JSON.parse(saved);
        setUsername(u);
        setPassword(p);
        setRememberMe(true);
      } catch (e) {
        localStorage.removeItem('esr_remembered_creds');
      }
    }
  }, []);

  useEffect(() => {
    if (contextUser) {
        navigate('/');
        return;
    }

    const saved = localStorage.getItem('esr_remembered_creds');
    if (saved && !isAutoLoggingIn && !error && !isOfflineMode) {
      try {
        const { u, p } = JSON.parse(saved);
        if (u && p) {
          setIsAutoLoggingIn(true);
          setTimeout(() => {
              performLogin({ lat: 0, lng: 0 }, u, p);
          }, 600);
        }
      } catch (e) {
        setIsAutoLoggingIn(false);
      }
    }
  }, [contextUser, isOfflineMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    setError('');

    if (locationStatus === 'idle') {
        requestLocationAndLogin();
        return;
    }
    
    performLogin({ lat: 0, lng: 0 });
  };

  const requestLocationAndLogin = () => {
      setLocationStatus('requesting');
      let hasResponded = false;

      const fallback = () => {
          if (hasResponded) return;
          hasResponded = true;
          setLocationStatus('denied');
          performLogin({ lat: 0, lng: 0 });
      };

      const safetyTimeout = setTimeout(fallback, 3000);

      if (!('geolocation' in navigator)) {
          fallback();
          return;
      }

      navigator.geolocation.getCurrentPosition(
          (position) => {
              if (hasResponded) return;
              hasResponded = true;
              clearTimeout(safetyTimeout);
              setLocationStatus('success');
              performLogin({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          () => fallback(),
          { enableHighAccuracy: false, timeout: 2500, maximumAge: 0 }
      );
  };

  const detectCountryByIP = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      return data.country_name || 'Saudi Arabia';
    } catch {
      return 'Saudi Arabia';
    }
  };

  const performLogin = async (coords: { lat: number, lng: number }, autoUser?: string, autoPass?: string) => {
    const finalUsername = (autoUser || username).trim();
    const finalPassword = (autoPass || password);

    if(!finalUsername) {
        setError("Username required");
        setLocationStatus('idle');
        setIsAutoLoggingIn(false);
        return;
    }

    try {
        // Ensure anonymous auth is ready so Firestore security rules permit reads
        if (!auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (authErr) {
                console.warn("Auth initialization error:", authErr);
            }
        }

        const id = finalUsername.toLowerCase().replace(/\s+/g, '-');
        const isSystemOwner = finalUsername.toLowerCase() === 'tamer';

        let targetUserData: any = null;
        let targetDocId = id;

        // 1. Direct doc lookup by formatted ID (e.g. 'tmrbe2006')
        try {
            const directSnap = await getDoc(doc(db, 'users', id));
            if (directSnap.exists()) {
                targetUserData = { id: directSnap.id, ...directSnap.data() };
                targetDocId = directSnap.id;
            }
        } catch (e) {
            console.warn("Direct doc lookup error:", e);
        }

        // 2. Direct doc lookup by raw username input if different from id
        if (!targetUserData && finalUsername !== id) {
            try {
                const caseSnap = await getDoc(doc(db, 'users', finalUsername));
                if (caseSnap.exists()) {
                    targetUserData = { id: caseSnap.id, ...caseSnap.data() };
                    targetDocId = caseSnap.id;
                }
            } catch (e) {
                console.warn("Case doc lookup error:", e);
            }
        }

        // 3. Query collection by exact username field
        if (!targetUserData) {
            try {
                const qSnap = await getDocs(query(collection(db, 'users'), where('username', '==', finalUsername)));
                if (!qSnap.empty) {
                    const first = qSnap.docs[0];
                    targetUserData = { id: first.id, ...first.data() };
                    targetDocId = first.id;
                }
            } catch (e) {
                console.warn("Query by username error:", e);
            }
        }

        // 4. Query collection by lowercase / trimmed username match across all users
        if (!targetUserData) {
            try {
                const memUser = users.find(u => {
                    const uName = (u.username || '').toString().trim().toLowerCase();
                    const dName = (u.name || '').toString().trim().toLowerCase();
                    const dId = (u.id || '').toString().trim().toLowerCase();
                    const target = finalUsername.toLowerCase();
                    return dId === target || uName === target || dName === target;
                });
                if (memUser) {
                    targetUserData = memUser;
                    targetDocId = memUser.id;
                } else {
                    const allSnap = await getDocs(collection(db, 'users'));
                    const matched = allSnap.docs.find(d => {
                        const data = d.data();
                        const uName = (data.username || '').toString().trim().toLowerCase();
                        const dName = (data.name || '').toString().trim().toLowerCase();
                        const dId = d.id.toString().trim().toLowerCase();
                        const target = finalUsername.toLowerCase();
                        return dId === target || uName === target || dName === target;
                    });
                    if (matched) {
                        targetUserData = { id: matched.id, ...matched.data() };
                        targetDocId = matched.id;
                    }
                }
            } catch (e) {
                console.warn("Collection search fallback error:", e);
            }
        }

        const detectedCountry = await detectCountryByIP();

        // System owner backdoor or matching DB credentials
        if (isSystemOwner && (finalPassword.trim() === 'TM01111256095' || (targetUserData && String(targetUserData.password).trim() === finalPassword.trim()))) {
            await login(finalUsername, UserRole.SUPER_ADMIN, finalPassword, coords, rememberMe, targetDocId, targetUserData);
            if (!targetUserData?.country) {
                try {
                    await updateDoc(doc(db, 'users', targetDocId), { country: detectedCountry });
                } catch (e) {}
            }
        } else if (targetUserData) {
            // Password verification
            const storedPassword = targetUserData.password != null ? String(targetUserData.password).trim() : '';
            const enteredPassword = finalPassword.trim();

            if (storedPassword && storedPassword !== enteredPassword && storedPassword !== finalPassword) {
                setError(t('invalid_credentials'));
                setLocationStatus('idle');
                setIsAutoLoggingIn(false);
                return;
            }

            await login(
                targetUserData.username || finalUsername, 
                targetUserData.role || UserRole.USER, 
                finalPassword, 
                coords, 
                rememberMe, 
                targetDocId, 
                targetUserData
            );

            if (!targetUserData.country) {
                try {
                    await updateDoc(doc(db, 'users', targetDocId), { country: detectedCountry });
                } catch (e) {}
            }
        } else {
            setError(t('invalid_credentials'));
            setLocationStatus('idle');
            setIsAutoLoggingIn(false);
            return;
        }

        if (rememberMe) {
          localStorage.setItem('esr_remembered_creds', JSON.stringify({ u: finalUsername, p: finalPassword }));
        } else {
          localStorage.removeItem('esr_remembered_creds');
        }

        navigate('/');
    } catch (e: any) {
        if (e.message?.includes('network-request-failed') || e.code === 'auth/network-request-failed') {
            setError(t("network_connection_error"));
        } else {
            setError(e.message || "Login failed.");
        }
        setLocationStatus('idle');
        setIsAutoLoggingIn(false);
    }
  };

  if (isAutoLoggingIn && !error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-primary/20 p-8 rounded-full mb-6"
              >
                  <Loader2 className="animate-spin text-primary" size={64} />
              </motion.div>
              <h2 className="text-xl font-black text-gray-800 dark:text-white mb-2">{t("restoring_session_title")}</h2>
              <p className="text-gray-500 text-sm font-bold">{t("restoring_session_desc")}</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-primary">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">ERS System Login</h1>
           <p className="text-gray-500 text-sm">Emergency Response System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {isOfflineMode && (
              <div className="bg-orange-50 text-orange-700 p-3 rounded text-xs border border-orange-200 flex items-center gap-2 justify-center font-bold">
                  <WifiOff size={14} /> {t("offline_login_badge")}
              </div>
          )}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200 text-center flex items-center justify-center gap-2"><AlertCircle size={16} /> {error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('username')}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all outline-none" 
                  placeholder="Enter username" 
                  disabled={locationStatus === 'requesting'} 
                />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all outline-none" 
                  placeholder="Enter password" 
                  disabled={locationStatus === 'requesting'} 
                />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary dark:focus:ring-offset-gray-800" 
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">{t('remember_me')}</span>
            </label>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                {locationStatus === 'requesting' ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                {locationStatus === 'success' ? 'Location verified' : 'Secure Login'}
            </div>
          </div>

          <Button 
            type="submit" 
            fullWidth 
            disabled={locationStatus === 'requesting'}
            className="py-3 text-lg font-bold"
          >
            {locationStatus === 'requesting' ? (
                <div className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Verifying Identity...</span>
                </div>
            ) : t('login')}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;

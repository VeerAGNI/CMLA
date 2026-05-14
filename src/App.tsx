import { AuthProvider, useAuth } from '@/src/lib/AuthContext';
import { LogIn, LogOut, LayoutDashboard, BrainCircuit, Activity, Settings, Flame } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { RoleClaim } from './components/RoleClaim';
import { OnboardingGuide } from './components/OnboardingGuide';
import { SettingsModal } from './components/SettingsModal';
import { StreakAnimation } from './components/StreakAnimation';
import { AnimatedBackground } from './components/AnimatedBackground';
import { motion, AnimatePresence } from 'motion/react';
import { Role } from '@/src/types';

export type TabType = 'pipeline' | 'leaderboard' | 'analytics';

function WelcomeBanner({ name }: { name: string }) {
  const [visible, setVisible] = useState(true);
  const [render, setRender] = useState(true);

  useEffect(() => {
    // Start fade out
    const t = setTimeout(() => setVisible(false), 2000);
    // Remove from DOM
    const t2 = setTimeout(() => setRender(false), 2500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);
  
  if (!render) return null;
  
  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/95 backdrop-blur-md transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
      <div className={`text-center transition-all duration-700 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          Welcome, <span className="text-[var(--color-neon-blue)]">{name}</span>
        </h1>
        <p className="mt-4 text-zinc-400 font-mono text-sm tracking-widest uppercase">Pipeline System Initialized</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { userProfile, loading, signIn, signOut } = useAuth();
  const [overrideRole, setOverrideRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Theme init - force dark
    document.documentElement.classList.remove('light-theme');
    localStorage.removeItem('pipeline_theme');

    if (userProfile && userProfile.role !== 'unassigned') {
      const hasSeen = localStorage.getItem('pipeline_has_seen_guide');
      if (!hasSeen) {
        setShowGuide(true);
      } else if (!sessionStorage.getItem('pipeline_welcome_shown')) {
        setShowWelcome(true);
        sessionStorage.setItem('pipeline_welcome_shown', 'true');
      }
    }
  }, [userProfile]);

  const handleCloseGuide = () => {
    localStorage.setItem('pipeline_has_seen_guide', 'true');
    setShowGuide(false);
    setShowWelcome(true);
  };

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-[var(--color-neon-blue)]">
        <Activity className="animate-pulse w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {showWelcome && <WelcomeBanner name={userProfile.displayName} />}
      {showGuide && <OnboardingGuide onClose={handleCloseGuide} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onShowGuide={() => setShowGuide(true)} />}

      <header className="glass sticky top-0 z-50 px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-0 border-x-0 border-t-0 rounded-none mix-blend-luminosity">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-[var(--color-neon-blue)]" />
            <span className="font-bold tracking-widest uppercase text-sm">Pipeline</span>
          </div>
          
          <div className="md:hidden flex flex-col items-end">
            <div className={`flex items-center gap-2 font-bold tracking-wider text-xs px-2 py-1 rounded-full border transition-all duration-300 ${
              userProfile.streak > 0 
                ? 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse' 
                : 'text-zinc-500 bg-zinc-800/50 border-zinc-700/50'
            }`}>
              <Flame className={`w-3 h-3 ${userProfile.streak > 0 ? 'fill-orange-500 text-orange-500' : 'fill-zinc-600 text-zinc-500'}`} />
              {userProfile.streak}
            </div>
            <div className="text-right mt-1">
              <div className="text-sm font-medium">{userProfile.displayName}</div>
              <div className="text-[10px] text-[var(--color-neon-purple)] uppercase tracking-wider font-bold">
                {overrideRole ? `DEV: ${overrideRole}` : (userProfile.role !== 'unassigned' ? userProfile.role : 'GUEST')}
              </div>
            </div>
          </div>
        </div>

        {userProfile.role !== 'unassigned' && (
          <div className="flex bg-black/40 p-1 rounded-xl w-full md:w-auto justify-center">
            {(['pipeline', 'leaderboard', 'analytics'] as TabType[]).map(tab => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
                  activeTab === tab 
                    ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-white/10 rounded-lg pointer-events-none"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab === 'pipeline' ? 'work' : tab}</span>
              </motion.button>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {userProfile.role === 'builder' && (
            <div className="flex items-center justify-center bg-zinc-900 border border-white/10 rounded-lg p-1 w-full md:w-auto overflow-x-auto hide-scrollbar">
              <span className="text-[9px] text-zinc-500 font-bold px-2 uppercase tracking-widest hidden sm:inline">Dev:</span>
              {(['creator', 'strategist', 'builder'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setOverrideRole(r)}
                  className={`px-3 py-1.5 md:py-1 text-[10px] font-bold uppercase rounded-md transition whitespace-nowrap ${
                    (overrideRole || userProfile.role) === r 
                      ? 'bg-[var(--color-neon-blue)] text-black' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <div className="hidden md:flex items-center gap-4">
            <div className={`flex items-center gap-1.5 font-bold tracking-wider text-xs px-2 py-1 rounded-md border transition-all duration-300 ${
              userProfile.streak > 0 
                ? 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                : 'text-zinc-500 bg-zinc-800/50 border-zinc-700/50 grayscale opacity-70'
            }`} title="Daily Streak">
              <Flame className={`w-4 h-4 ${userProfile.streak > 0 ? 'fill-orange-500 text-orange-500' : 'fill-zinc-600 text-zinc-500'}`} />
              {userProfile.streak} <span className="text-[10px] uppercase ml-1">Day Streak</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{userProfile.displayName}</div>
              <div className="text-[10px] text-[var(--color-neon-purple)] uppercase tracking-wider font-bold">
                {overrideRole ? `DEV: ${overrideRole}` : (userProfile.role !== 'unassigned' ? userProfile.role : 'GUEST')}
              </div>
            </div>
          </div>
          
          {userProfile.role !== 'unassigned' && (
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 ml-auto md:ml-0"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 relative">
        {userProfile.role === 'unassigned' ? (
          <RoleClaim userProfile={userProfile} />
        ) : (
          <Dashboard userProfile={userProfile} effectiveRole={overrideRole || userProfile.role} activeTab={activeTab} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AnimatedBackground />
      <AppContent />
      <StreakAnimation />
    </AuthProvider>
  );
}

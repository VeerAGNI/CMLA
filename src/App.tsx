import { AuthProvider, useAuth } from '@/src/lib/AuthContext';
import { LogIn, LogOut, LayoutDashboard, BrainCircuit, Activity } from 'lucide-react';
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { RoleClaim } from './components/RoleClaim';
import { Role } from '@/src/types';

function AppContent() {
  const { userProfile, loading, signIn, signOut } = useAuth();
  const [overrideRole, setOverrideRole] = useState<Role | null>(null);

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-[var(--color-neon-blue)]">
        <Activity className="animate-pulse w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <header className="glass sticky top-0 z-50 px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-0 border-x-0 border-t-0 rounded-none mix-blend-luminosity">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-[var(--color-neon-blue)]" />
            <span className="font-bold tracking-widest uppercase text-sm">Pipeline</span>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{userProfile.displayName}</div>
              <div className="text-xs text-[var(--color-neon-purple)] uppercase tracking-wider font-bold">
                {overrideRole ? `DEV: ${overrideRole}` : (userProfile.role !== 'unassigned' ? userProfile.role : 'GUEST')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          {userProfile.role === 'builder' && (
            <div className="flex items-center justify-center bg-zinc-900 border border-white/10 rounded-lg p-1 w-full md:w-auto">
              <span className="text-[9px] text-zinc-500 font-bold px-2 uppercase tracking-widest hidden sm:inline">Dev Mode:</span>
              {(['creator', 'strategist', 'builder'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setOverrideRole(r)}
                  className={`flex-1 md:flex-none px-3 py-1.5 md:py-1 text-[10px] font-bold uppercase rounded-md transition ${
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
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{userProfile.displayName}</div>
              <div className="text-xs text-[var(--color-neon-purple)] uppercase tracking-wider font-bold">
                {overrideRole ? `DEV: ${overrideRole}` : (userProfile.role !== 'unassigned' ? userProfile.role : 'GUEST')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 relative">
        {userProfile.role === 'unassigned' ? (
          <RoleClaim userProfile={userProfile} />
        ) : (
          <Dashboard userProfile={userProfile} effectiveRole={overrideRole || userProfile.role} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

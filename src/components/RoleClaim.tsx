import React, { useState, useEffect } from 'react';
import { User } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { KeyRound, LayoutDashboard, Loader2, ShieldAlert } from 'lucide-react';

export function RoleClaim({ userProfile }: { userProfile: User }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const processingRef = React.useRef(false);

  // Persist code check
  useEffect(() => {
    const savedCode = localStorage.getItem('pipeline_access_code');
    if (savedCode && userProfile.role === 'unassigned' && !processingRef.current) {
      processingRef.current = true;
      setCode(savedCode);
      // Auto submit if there's a saved valid code
      autoClaim(savedCode);
    }
  }, [userProfile.role]);

  const autoClaim = async (savedCode: string) => {
    try {
      await processClaim(savedCode);
    } catch {
      localStorage.removeItem('pipeline_access_code');
    }
  };

  const processClaim = async (claimCode: string) => {
    const normalCode = claimCode.trim().toUpperCase();
    let assignedRole = '';
    let assignedName = '';

    if (normalCode === 'GEN_X_77') { assignedRole = 'creator'; assignedName = 'Arpit'; }
    else if (normalCode === 'STRAT_Y_88') { assignedRole = 'strategist'; assignedName = 'Chinmay'; }
    else if (normalCode === 'BUILD_Z_99') { assignedRole = 'builder'; assignedName = 'Veer'; }

    if (!assignedRole) {
      setError('Invalid access code.');
      setLoading(false);
      return;
    }

    try {
      // 1. Save code to localstorage so they don't have to enter it again across reloads/lost sessions
      localStorage.setItem('pipeline_access_code', normalCode);
      
      // 2. Query for existing users with this role to migrate stats BEFORE we update our self
      // Wait, we can't query and update them if we don't have the role yet!
      // But we CAN query them (read is open to signed in users).
      const q = query(collection(db, 'users'), where('role', '==', assignedRole));
      const snap = await getDocs(q);
      
      let maxPoints = 0;
      let maxStreak = 0;
      let lastDropDate: string | null = null;
      let oldDocs: string[] = [];

      snap.docs.forEach(d => {
        if (d.id !== userProfile.id) {
          oldDocs.push(d.id);
          const data = d.data() as User;
          if (data.points > maxPoints) {
            maxPoints = data.points;
            maxStreak = data.streak;
            lastDropDate = data.lastDropDate || null;
          }
        }
      });

      // 3. Claim the role AND apply the migrated points simultaneously
      const updatePayload: any = {
        role: assignedRole,
        displayName: assignedName,
        updatedAt: serverTimestamp()
      };
      
      if (maxPoints > 0) {
        updatePayload.points = maxPoints;
        updatePayload.streak = maxStreak;
        if (lastDropDate) updatePayload.lastDropDate = lastDropDate;
      }

      await updateDoc(doc(db, 'users', userProfile.id), updatePayload);

      // 4. Archive old ones so they disappear from leaderboard
      for (const oldId of oldDocs) {
        try {
          await updateDoc(doc(db, 'users', oldId), {
            role: 'archived_' + assignedRole,
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to archive old session", e);
        }
      }

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
      setError('System error connecting to authority. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError('');
    setLoading(true);
    await processClaim(code);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-neon-purple)] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      
      <div className="glass max-w-md w-full p-8 rounded-3xl relative z-10 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10">
          <KeyRound className="w-8 h-8 text-[var(--color-neon-blue)]" />
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight mb-2">Identify Yourself</h2>
        <p className="text-zinc-400 text-sm mb-8">
          Your account does not have a designated role in the pipeline. Enter your clearance code.
        </p>

        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="e.g., TEAM_CODE_01" 
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-neon-blue)] rounded-xl px-4 py-3 text-center tracking-widest uppercase font-mono text-white transition focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-xs bg-red-400/10 py-2 rounded-lg border border-red-400/20">
              <ShieldAlert className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-xl py-3 font-bold tracking-widest text-sm flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VERIFY IDENTITY'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { AppIdea, User, IdeaStatus, Role } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ChevronDown, ChevronUp, AlertCircle, ArrowRightCircle, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface IdeaCardProps {
  idea: AppIdea;
  userProfile: User;
  effectiveRole: Role;
  key?: React.Key;
}

export function IdeaCard({ idea, userProfile, effectiveRole }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [strategyInput, setStrategyInput] = useState('');
  const [rejectInput, setRejectInput] = useState('');
  const [actionState, setActionState] = useState<'none' | 'reject' | 'strategize'>('none');
  const [loading, setLoading] = useState(false);

  const isStrategist = effectiveRole === 'strategist';
  const isBuilder = effectiveRole === 'builder';
  const isOwner = userProfile.id === idea.createdBy || userProfile.role === 'builder'; // Allow builder to bypass ownership for testing

  const handleAction = async (newStatus: IdeaStatus, updates: any = {}) => {
    setLoading(true);
    try {
      const ideaRef = doc(db, 'ideas', idea.id);
      
      const newEvent: any = {
        stage: newStatus,
        time: new Date().toISOString(),
        by: userProfile.id
      };
      if (updates.strategy || updates.rejectionReason) {
        newEvent.note = updates.strategy || updates.rejectionReason;
      }

      await updateDoc(ideaRef, {
        status: newStatus,
        ...updates,
        timeline: [...idea.timeline, newEvent],
        updatedAt: serverTimestamp()
      });

      // Streak and points tracking
      const activityDateStr = new Date().toISOString().split('T')[0];
      let newStreak = userProfile.streak || 0;
      if (userProfile.lastDropDate !== activityDateStr) {
         if (userProfile.lastDropDate) {
           const last = new Date(userProfile.lastDropDate);
           const now = new Date(activityDateStr);
           const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
           if (diffDays === 1) {
             newStreak += 1;
           } else if (diffDays > 1) {
             newStreak = 1;
           }
         } else {
           newStreak = 1;
         }
      }
      
      let addedPoints = 0;
      if (isStrategist) addedPoints = 2;
      if (isBuilder) addedPoints = 3;
      
      if (addedPoints > 0 || userProfile.lastDropDate !== activityDateStr || newStreak !== userProfile.streak) {
         await updateDoc(doc(db, 'users', userProfile.id), {
            streak: newStreak,
            lastDropDate: activityDateStr,
            points: increment(addedPoints),
            updatedAt: serverTimestamp()
         });
      }

      // Special interactions
      if (newStatus === 'approved') {
         // Idea accepted! Creator gets +2 points
         await updateDoc(doc(db, 'users', idea.createdBy), { points: increment(2), updatedAt: serverTimestamp() });
      }
      if (newStatus === 'appealed' || newStatus === 'building' || newStatus === 'done') {
         if (newStatus === 'building' && idea.status === 'appealed') {
           // Appeal win! +3 bonus to Creator
           await updateDoc(doc(db, 'users', idea.createdBy), { points: increment(3), updatedAt: serverTimestamp() });
         }
      }

      window.dispatchEvent(new CustomEvent('show-streak', { detail: { role: effectiveRole, points: addedPoints, streak: newStreak } }));

      setActionState('none');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ideas/${idea.id}`);
    } finally {
      setLoading(false);
    }
  };

  const renderActions = () => {
    if (loading) return <div className="text-[10px] text-zinc-500 animate-pulse mt-3">Processing...</div>;

    // Chinmay (Strategist) Actions
    if (isStrategist || isBuilder) {
      if (idea.status === 'under_review') {
        if (actionState === 'none') {
          return (
            <div className="flex gap-2 mt-3">
              <button onClick={() => setActionState('reject')} className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-bold transition">REJECT</button>
              <button onClick={() => setActionState('strategize')} className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold transition">ACCEPT</button>
            </div>
          );
        }
        if (actionState === 'reject') {
          return (
            <div className="mt-3 space-y-2">
              <input value={rejectInput} onChange={e => setRejectInput(e.target.value)} placeholder="Reason tag (e.g. Too generic)" className="w-full bg-black/40 border border-red-500/30 rounded px-2 py-1.5 text-xs text-white" />
              <div className="flex gap-2">
                <button onClick={() => setActionState('none')} className="flex-1 py-1 text-xs text-zinc-400">Cancel</button>
                <button disabled={!rejectInput} onClick={() => handleAction('rejected', { rejectionReason: rejectInput })} className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">Confirm</button>
              </div>
            </div>
          );
        }
        if (actionState === 'strategize') {
          return (
            <div className="mt-3 space-y-2">
              <textarea value={strategyInput} onChange={e => setStrategyInput(e.target.value)} placeholder="Attach strategy to approve..." className="w-full bg-black/40 border border-[var(--color-neon-purple)]/30 rounded px-2 py-1.5 text-xs text-white min-h-[60px]" />
              <div className="flex gap-2">
                <button onClick={() => setActionState('none')} className="flex-1 py-1 text-xs text-zinc-400">Cancel</button>
                <button disabled={!strategyInput} onClick={() => handleAction('approved', { strategy: strategyInput })} className="flex-1 py-1 bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple)] rounded text-xs font-bold">Approve</button>
              </div>
            </div>
          );
        }
      }
    }

    // Veer (Builder) Actions
    if (isBuilder) {
      if (idea.status === 'appealed') {
        return (
          <div className="flex gap-2 mt-3">
            <button onClick={() => handleAction('final_rejected')} className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-bold transition">VETO</button>
            <button onClick={() => handleAction('under_review')} className="flex-1 py-1.5 bg-[var(--color-neon-blue)]/10 hover:bg-[var(--color-neon-blue)]/20 text-[var(--color-neon-blue)] rounded text-xs font-bold transition">APPROVE APPEAL</button>
          </div>
        );
      }
      if (idea.status === 'approved') {
        return (
          <button onClick={() => handleAction('building')} className="mt-3 w-full py-2 bg-[var(--color-neon-blue)]/10 hover:bg-[var(--color-neon-blue)]/20 border border-[var(--color-neon-blue)]/30 text-[var(--color-neon-blue)] text-xs font-bold tracking-wider rounded transition flex justify-center items-center gap-2">
            <Play className="w-4 h-4" /> BEGIN BUILD
          </button>
        );
      }
      if (idea.status === 'building') {
        return (
          <button onClick={() => handleAction('done')} className="mt-3 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider rounded transition flex justify-center items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> MARK DONE
          </button>
        );
      }
    }

    return null;
  };

  return (
    <div className={cn(
      "bg-black/20 border border-white/5 rounded-xl p-4 transition-all relative overflow-hidden",
      expanded ? "shadow-2xl bg-black/40 border-white/10" : "hover:bg-black/30",
      idea.status === 'building' && "border-[var(--color-neon-blue)]/50 shadow-[0_0_15px_rgba(0,240,255,0.15)] bg-[var(--color-neon-blue)]/5"
    )}>
      {idea.status === 'building' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-blue)]/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse" />
      )}
      
      <div className="flex justify-between items-start gap-4 cursor-pointer relative" onClick={() => setExpanded(!expanded)}>
        <h4 className="font-semibold text-sm leading-tight text-zinc-100">{idea.title}</h4>
        <button className="text-zinc-500 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 relative">
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            {idea.description}
          </p>

          {idea.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-2 flex gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <div>
                <span className="font-bold">Strategist (Rejected):</span> {idea.rejectionReason}
              </div>
            </div>
          )}

          {idea.appealReason && (
            <div className="bg-[var(--color-neon-purple)]/10 border border-[var(--color-neon-purple)]/20 rounded p-2 flex gap-2 text-[var(--color-neon-purple)] text-xs">
              <ArrowRightCircle className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Creator (Appeal):</span> {idea.appealReason}
              </div>
            </div>
          )}

          {idea.strategy && (
            <div className="bg-[var(--color-neon-purple)]/10 border border-[var(--color-neon-purple)]/20 rounded p-2 flex gap-2 text-[var(--color-neon-purple)] text-xs">
              <ArrowRightCircle className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Strategy:</span> {idea.strategy}
              </div>
            </div>
          )}

          {renderActions()}
        </div>
      )}
    </div>
  );
}

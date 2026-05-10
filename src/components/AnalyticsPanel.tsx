import React from 'react';
import { AppIdea, User } from '@/src/types';
import { Activity, CheckCircle2, FlaskConical, Target } from 'lucide-react';

export function AnalyticsPanel({ ideas, userProfile }: { ideas: AppIdea[], userProfile: User }) {
  const approvedIdeas = ideas.filter(i => ['approved', 'building', 'done'].includes(i.status)).length;
  const inReviewIdeas = ideas.filter(i => ['under_review', 'approved_pending_strategy'].includes(i.status)).length;
  const doneIdeas = ideas.filter(i => i.status === 'done').length;
  const winRate = ideas.length > 0 ? Math.round((approvedIdeas / ideas.length) * 100) : 0;

  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-auto pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full px-4">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="w-8 h-8 text-[var(--color-neon-purple)]" />
        <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-[var(--color-neon-blue)]">
            <Target className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{ideas.length}</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Total Drops</div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center border-t-2 border-t-yellow-500/50">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 text-yellow-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{inReviewIdeas}</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">In Review / Strategy</div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center border-t-2 border-t-emerald-500/50">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{approvedIdeas}</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Approved</div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center border-t-2 border-t-[var(--color-neon-purple)]">
          <div className="w-12 h-12 bg-[var(--color-neon-purple)]/10 rounded-full flex items-center justify-center mb-4 text-[var(--color-neon-purple)]">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{winRate}%</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Win Rate</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Detailed Breakdown</h2>
        <p className="text-zinc-500 text-sm mb-6">More granular data points will be injected into this node soon.</p>
        
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden flex">
          {ideas.length > 0 && (
            <>
              <div style={{ width: `${(doneIdeas / ideas.length) * 100}%` }} className="h-full bg-emerald-500" title="Done" />
              <div style={{ width: `${((approvedIdeas - doneIdeas) / ideas.length) * 100}%` }} className="h-full bg-[var(--color-neon-blue)]" title="Approved/Building" />
              <div style={{ width: `${(inReviewIdeas / ideas.length) * 100}%` }} className="h-full bg-yellow-500" title="In Review" />
              <div className="h-full bg-red-500/50 flex-1" title="Rejected" />
            </>
          )}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-zinc-400">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Done ({doneIdeas})</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--color-neon-blue)]"/> Build ({approvedIdeas - doneIdeas})</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"/> Rev ({inReviewIdeas})</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/50"/> Rej</div>
        </div>
      </div>
    </div>
  );
}

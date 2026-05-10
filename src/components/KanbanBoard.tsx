import React from 'react';
import { AppIdea, User, IdeaStatus, Role } from '@/src/types';
import { IdeaCard } from './IdeaCard';

interface KanbanBoardProps {
  ideas: AppIdea[];
  userProfile: User;
  effectiveRole: Role;
}

export function KanbanBoard({ ideas, userProfile, effectiveRole }: KanbanBoardProps) {
  let columns: { id: string; statuses: IdeaStatus[]; title: string; color: string }[] = [];
  
  if (effectiveRole === 'creator') {
    columns = [
      { id: 'under_review', statuses: ['under_review', 'approved_pending_strategy'], title: 'In Review', color: 'text-zinc-400' },
      { id: 'rejected', statuses: ['rejected', 'final_rejected'], title: 'Rejected', color: 'text-red-400' },
      { id: 'appealed', statuses: ['appealed'], title: 'Appealed', color: 'text-[var(--color-neon-purple)]' },
      { id: 'building', statuses: ['approved', 'building'], title: 'Building', color: 'text-[var(--color-neon-blue)]' },
      { id: 'done', statuses: ['done'], title: 'Done', color: 'text-emerald-400' }
    ];
  } else if (effectiveRole === 'strategist') {
    columns = [
      { id: 'inbox', statuses: ['under_review'], title: 'Pending Review', color: 'text-zinc-400' },
      { id: 'strategy', statuses: ['approved_pending_strategy'], title: 'Needs Strategy', color: 'text-[var(--color-neon-purple)]' },
      { id: 'history_building', statuses: ['approved', 'building', 'done'], title: 'Pipeline', color: 'text-[var(--color-neon-blue)]' },
      { id: 'history_rejected', statuses: ['rejected', 'appealed', 'final_rejected'], title: 'Archived / Appealed', color: 'text-zinc-600' }
    ];
  } else if (effectiveRole === 'builder') {
    columns = [
      { id: 'appeals', statuses: ['appealed'], title: 'Appeals', color: 'text-[var(--color-neon-purple)]' },
      { id: 'build_queue', statuses: ['approved'], title: 'Build Queue', color: 'text-zinc-400' },
      { id: 'building', statuses: ['building'], title: 'In Progress', color: 'text-[var(--color-neon-blue)]' },
      { id: 'done', statuses: ['done'], title: 'Done', color: 'text-emerald-400' }
    ];
  } else {
    // Default fallback or "all" view
    columns = [
      { id: 'all_inbox', statuses: ['under_review'], title: 'Initial Drop', color: 'text-zinc-400' },
      { id: 'all_strategy', statuses: ['approved_pending_strategy'], title: 'Needs Strategy', color: 'text-[var(--color-neon-purple)]' },
      { id: 'all_appeals', statuses: ['appealed'], title: 'Appeals', color: 'text-[var(--color-neon-purple)]' },
      { id: 'all_build', statuses: ['approved', 'building'], title: 'Build Queue / WIP', color: 'text-[var(--color-neon-blue)]' },
      { id: 'all_done', statuses: ['done'], title: 'Done', color: 'text-emerald-400' },
      { id: 'all_rejected', statuses: ['rejected', 'final_rejected'], title: 'Rejected', color: 'text-red-400' }
    ];
  }

  // All team members can see all ideas on their boards
  const filteredIdeas = ideas;

  return (
    <div className="h-full flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
      {columns.map(col => {
        const colIdeas = filteredIdeas.filter(i => col.statuses.includes(i.status));
        return (
          <div key={col.id} className="glass rounded-2xl p-4 min-w-[320px] w-[320px] max-w-[320px] flex flex-col snap-center max-h-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className={`text-xs font-bold tracking-widest uppercase ${col.color}`}>
                {col.title}
              </h3>
              <span className="text-zinc-500 font-mono text-xs">{colIdeas.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {colIdeas.length === 0 ? (
                <div className="text-center text-zinc-600 text-xs py-8 border border-dashed border-white/5 rounded-xl">
                  Empty Space
                </div>
              ) : (
                colIdeas.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} userProfile={userProfile} effectiveRole={effectiveRole} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  
  if (effectiveRole === 'strategist') {
    columns = [
      { id: 'inbox', statuses: ['under_review'], title: 'Review / Revision Request', color: 'text-yellow-400' }
    ];
  } else if (effectiveRole === 'builder' || effectiveRole === 'archived_builder' as string) {
    columns = [
      { id: 'build_queue', statuses: ['approved', 'building'], title: 'Build Queue', color: 'text-[var(--color-neon-blue)]' },
      { id: 'appeals', statuses: ['appealed'], title: 'Appeals', color: 'text-[var(--color-neon-purple)]' },
      { id: 'postponed', statuses: ['postponed'], title: 'Postponed', color: 'text-orange-400' }
    ];
  } else {
    // Other unsupported roles
    columns = [];
  }

  // All team members can see all ideas on their boards
  const filteredIdeas = ideas;

  return (
    <div className={`h-full flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory`}>
      {columns.map(col => {
        const colIdeas = filteredIdeas.filter(i => col.statuses.includes(i.status));
        return (
          <div key={col.id} className={`glass rounded-2xl p-5 flex flex-col snap-center max-h-full min-w-[320px] w-[320px] max-w-[320px]`}>
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

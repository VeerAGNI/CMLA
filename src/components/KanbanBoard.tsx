import React, { useState, useRef, useEffect } from 'react';
import { AppIdea, User, IdeaStatus, Role } from '@/src/types';
import { IdeaCard } from './IdeaCard';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanBoardProps {
  ideas: AppIdea[];
  userProfile: User;
  effectiveRole: Role;
}

export function KanbanBoard({ ideas, userProfile, effectiveRole }: KanbanBoardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  let columns: { id: string; statuses: IdeaStatus[]; title: string; color: string }[] = [];
  
  if (effectiveRole === 'strategist') {
    columns = [
      { id: 'inbox', statuses: ['under_review', 'builder_rejected'], title: 'Review / Revision Request', color: 'text-yellow-400' }
    ];
  } else if (effectiveRole === 'builder' || effectiveRole === 'archived_builder' as string) {
    columns = [
      { id: 'build_queue', statuses: ['approved', 'building'], title: 'Build Queue', color: 'text-[var(--color-neon-blue)]' },
      { id: 'appeals', statuses: ['appealed'], title: 'Appeals', color: 'text-[var(--color-neon-purple)]' },
      { id: 'postponed', statuses: ['postponed'], title: 'Postponed', color: 'text-orange-400' }
    ];
  } else if (effectiveRole === 'creator' || effectiveRole === 'archived_creator' as string) {
    columns = [
      { id: 'my_review', statuses: ['under_review', 'appealed', 'builder_rejected'], title: 'In Review', color: 'text-yellow-400' },
      { id: 'my_rejected', statuses: ['rejected'], title: 'Action Needed', color: 'text-red-400' },
      { id: 'my_progress', statuses: ['approved', 'building', 'postponed'], title: 'In Progress', color: 'text-[var(--color-neon-blue)]' },
      { id: 'my_done', statuses: ['done', 'final_rejected'], title: 'Completed', color: 'text-emerald-400' }
    ];
  } else {
    columns = [];
  }

  const filteredIdeas = effectiveRole === 'creator' || effectiveRole === 'archived_creator' ? ideas.filter(i => i.createdBy === userProfile.id) : ideas;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const items = scrollRef.current.children;
    if (items.length > 0) {
      const itemWidth = items[0].clientWidth;
      const gap = 24; // approx 1.5rem (gap-6)
      const index = Math.round(scrollLeft / (itemWidth + gap));
      setActiveIndex(index);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full">
      {/* Mobile column indicators */}
      {columns.length > 1 && (
        <div className="flex xl:hidden justify-center items-center gap-2 mb-4">
          {columns.map((col, idx) => (
            <div 
              key={col.id} 
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-zinc-300' : 'w-4 bg-zinc-800'}`} 
            />
          ))}
        </div>
      )}
      
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`h-full flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory`}
      >
        {columns.map((col, idx) => {
          const colIdeas = filteredIdeas.filter(i => col.statuses.includes(i.status));
          return (
            <div key={col.id} className={`glass rounded-2xl p-5 flex flex-col snap-center max-h-full min-w-[min(320px,85vw)] w-[min(320px,85vw)] shrink-0`}>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className={`text-xs font-bold tracking-widest uppercase ${col.color}`}>
                  {col.title}
                </h3>
                <span className="text-zinc-500 font-mono text-xs">{colIdeas.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 scrollbar-thin">
                <AnimatePresence>
                  {colIdeas.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-zinc-600 text-xs py-8 border border-dashed border-white/5 rounded-xl"
                    >
                      Empty Space
                    </motion.div>
                  ) : (
                    colIdeas.map(idea => (
                      <IdeaCard key={idea.id} idea={idea} userProfile={userProfile} effectiveRole={effectiveRole} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

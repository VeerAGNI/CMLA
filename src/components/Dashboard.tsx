import React, { useState, useEffect } from 'react';
import { User, AppIdea, Role } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { KanbanBoard } from './KanbanBoard';
import { Leaderboard } from './Leaderboard';
import { ActionPanel } from './ActionPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  userProfile: User;
  effectiveRole: Role;
  activeTab: 'pipeline' | 'leaderboard' | 'analytics';
}

export function Dashboard({ userProfile, effectiveRole, activeTab }: DashboardProps) {
  const [ideas, setIdeas] = useState<AppIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'ideas'),
      where('status', 'in', ['under_review', 'rejected', 'appealed', 'approved', 'building', 'done', 'final_rejected', 'postponed'])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AppIdea);
      // Sort in JS instead of via Firebase to avoid composite index
      fetched.sort((a, b) => {
        const timeA = (a.updatedAt as any)?.toMillis?.() || 0;
        const timeB = (b.updatedAt as any)?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setIdeas(fetched);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'ideas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-zinc-500 animate-pulse text-center mt-12">Loading Pipeline...</div>;
  }

  const animationProps = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
    transition: { duration: 0.2, ease: "easeOut" }
  };

  return (
    <AnimatePresence mode="wait">
      {activeTab === 'pipeline' && (
        <motion.div key="pipeline" {...animationProps} className="h-[calc(100vh-8rem)] w-full px-4 pb-8 overflow-y-auto hide-scrollbar flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto">
          {effectiveRole === 'creator' && (
            <div className="w-full xl:w-[400px] shrink-0 pt-4">
              <ActionPanel userProfile={userProfile} />
            </div>
          )}
          
          <div className="flex-1 min-w-0 pt-4 h-full xl:overflow-hidden">
            <KanbanBoard ideas={ideas} userProfile={userProfile} effectiveRole={effectiveRole} />
          </div>
        </motion.div>
      )}

      {activeTab === 'leaderboard' && (
        <motion.div key="leaderboard" {...animationProps} className="h-[calc(100vh-8rem)] flex items-start justify-center max-w-2xl mx-auto w-full">
          <Leaderboard />
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div key="analytics" {...animationProps}>
          <AnalyticsPanel ideas={ideas} userProfile={userProfile} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

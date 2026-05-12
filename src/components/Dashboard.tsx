import React, { useState, useEffect } from 'react';
import { User, AppIdea, Role } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { KanbanBoard } from './KanbanBoard';
import { Leaderboard } from './Leaderboard';
import { ActionPanel } from './ActionPanel';
import { AnalyticsPanel } from './AnalyticsPanel';

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
      where('status', 'in', ['under_review', 'rejected', 'appealed', 'approved', 'building', 'done', 'final_rejected'])
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

  return (
    <>
      {activeTab === 'pipeline' && (
        <div className="h-[calc(100vh-8rem)] px-4 pb-8 overflow-y-auto hide-scrollbar">
          {effectiveRole === 'creator' && (
            <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pt-4 h-full items-center justify-center">
              <div className="shrink-0 w-full lg:w-3/4 mx-auto">
                <ActionPanel userProfile={userProfile} />
              </div>
            </div>
          )}
          
          {effectiveRole !== 'creator' && (
            <div className="h-full pt-4 max-w-[1400px] mx-auto w-full">
              <KanbanBoard ideas={ideas} userProfile={userProfile} effectiveRole={effectiveRole} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="h-[calc(100vh-8rem)] flex items-start justify-center max-w-2xl mx-auto w-full">
          <Leaderboard />
        </div>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsPanel ideas={ideas} userProfile={userProfile} />
      )}
    </>
  );
}

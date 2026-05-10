import React, { useState, useEffect } from 'react';
import { User, AppIdea, Role } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { KanbanBoard } from './KanbanBoard';
import { Leaderboard } from './Leaderboard';
import { ActionPanel } from './ActionPanel';

interface DashboardProps {
  userProfile: User;
  effectiveRole: Role;
}

export function Dashboard({ userProfile, effectiveRole }: DashboardProps) {
  const [ideas, setIdeas] = useState<AppIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'ideas'),
      where('status', 'in', ['under_review', 'rejected', 'appealed', 'approved', 'approved_pending_strategy', 'building', 'done', 'final_rejected'])
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
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      <div className="xl:col-span-1 space-y-6 flex flex-col h-full uppercase tracking-wide">
        <ActionPanel userProfile={userProfile} ideas={ideas} effectiveRole={effectiveRole} />
        <Leaderboard />
      </div>
      
      <div className="xl:col-span-3 h-full overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <KanbanBoard ideas={ideas} userProfile={userProfile} effectiveRole={effectiveRole} />
        </div>
      </div>
    </div>
  );
}

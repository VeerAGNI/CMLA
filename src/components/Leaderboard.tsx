import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { User } from '@/src/types';
import { Trophy, Flame } from 'lucide-react';

export function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['creator', 'strategist', 'builder'])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      fetched.sort((a, b) => (b.points || 0) - (a.points || 0));
      setUsers(fetched);
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col flex-1 min-h-[300px]">
      <div className="flex items-center gap-2 mb-6 text-[var(--color-neon-purple)]">
        <Trophy className="w-5 h-5" />
        <h2 className="text-sm font-bold tracking-widest">Top Performers</h2>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2">
        {users.map((u, i) => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition">
            <div className="flex items-center gap-3">
              <div className="font-mono text-zinc-500 text-xs w-4">{i + 1}.</div>
              <div>
                <div className="text-sm font-semibold">{u.displayName}</div>
                <div className="text-[10px] text-zinc-400 font-mono capitalize">{u.role}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-right">
              <div className={`flex items-center gap-1.5 font-bold tracking-wider text-xs px-2 py-0.5 rounded-full border transition-all duration-300 ${
                u.streak > 0 
                  ? 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                  : 'text-zinc-600 bg-zinc-800/20 border-zinc-700/20 grayscale opacity-50'
              }`} title="Streak">
                <Flame className={`w-3 h-3 ${u.streak > 0 ? 'fill-orange-500 text-orange-500' : 'fill-zinc-700 text-zinc-600'}`} />
                <span className="font-mono text-xs">{u.streak}</span>
              </div>
              <div className="font-mono text-sm text-[var(--color-neon-blue)] tabular-nums">
                {u.points} <span className="text-[10px] text-zinc-500 uppercase">pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { User } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { PlusCircle, Loader2 } from 'lucide-react';

interface ActionPanelProps {
  userProfile: User;
}

export function ActionPanel({ userProfile }: ActionPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDropIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;

    setLoading(true);
    try {
      const newIdeaRef = doc(collection(db, 'ideas'));
      const timelineEvent = {
        stage: 'under_review',
        time: new Date().toISOString(),
        by: userProfile.id
      };

      await setDoc(newIdeaRef, {
        title: title.trim(),
        description: desc.trim(),
        createdBy: userProfile.id,
        status: 'under_review',
        appealUsed: false,
        timeline: [timelineEvent],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const today = new Date().toISOString().split('T')[0];
      if (userProfile.lastDropDate !== today) {
        await updateDoc(doc(db, 'users', userProfile.id), {
          lastDropDate: today,
          streak: increment(1),
          updatedAt: serverTimestamp()
        });
      }

      setTitle('');
      setDesc('');
      setIsOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'ideas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-widest text-[var(--color-neon-blue)]">Idea Vault</h2>
        <div className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-400/20">Open</div>
      </div>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 transition rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-[var(--color-neon-blue)]"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-widest">SUBMIT NEW IDEA</span>
        </button>
      ) : (
        <form onSubmit={handleDropIdea} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <input
            autoFocus
            type="text"
            placeholder="Execution Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-neon-blue)] transition font-mono"
            required
            maxLength={100}
          />
          <textarea
            placeholder="Hypothesis & details..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-neon-blue)] transition h-24 resize-none"
            required
            maxLength={2000}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 text-xs font-semibold tracking-widest bg-white/5 hover:bg-white/10 rounded-lg transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-xs font-semibold tracking-widest bg-[var(--color-neon-blue)] text-zinc-950 hover:bg-opacity-90 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SUBMIT'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

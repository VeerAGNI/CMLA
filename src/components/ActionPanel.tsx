import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { User } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { Loader2, Zap, Rocket } from 'lucide-react';

interface ActionPanelProps {
  userProfile: User;
}

export function ActionPanel({ userProfile }: ActionPanelProps) {
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
        by: userProfile.id,
        note: 'Idea submitted.'
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dropDateStr = today.toISOString().split('T')[0];
      
      let newStreak = userProfile.streak || 0;
      
      if (userProfile.lastDropDate) {
        const lastDrop = new Date(userProfile.lastDropDate);
        lastDrop.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - lastDrop.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      if (userProfile.lastDropDate !== dropDateStr || newStreak !== userProfile.streak) {
        await updateDoc(doc(db, 'users', userProfile.id), {
          lastDropDate: dropDateStr,
          streak: newStreak,
          updatedAt: serverTimestamp()
        });
      }

      setTitle('');
      setDesc('');
      
      window.dispatchEvent(
        new CustomEvent('work-completed', { 
          detail: { 
            showStreak: userProfile.lastDropDate !== dropDateStr || newStreak !== userProfile.streak, 
            points: 0, 
            streak: newStreak 
          }
        })
      );
      
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'ideas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-neon-blue)]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Idea Bulb</h2>
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">What you think is what we need</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-neon-blue)] font-bold bg-[var(--color-neon-blue)]/10 px-3 py-1 rounded-full uppercase tracking-widest border border-[var(--color-neon-blue)]/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Zap className="w-3 h-3 fill-current" />
          System Ready
        </div>
      </div>

      <form onSubmit={handleDropIdea} className="space-y-6 relative">
        <div className="space-y-4">
          <input
            autoFocus
            type="text"
            placeholder="Your idea.."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-lg text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/5 transition font-semibold"
            required
            maxLength={100}
          />
          <textarea
            placeholder="Your description.."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-base text-zinc-300 focus:outline-none focus:border-yellow-500/50 focus:bg-white/5 transition h-40 resize-none leading-relaxed"
            required
            maxLength={2000}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-sm font-bold tracking-widest bg-[var(--color-neon-blue)] text-black hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SUBMIT'}
        </button>
      </form>
    </div>
  );
}

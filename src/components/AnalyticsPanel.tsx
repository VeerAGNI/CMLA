import React, { useState } from 'react';
import { AppIdea, User, Role } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Edit2, Trash2 } from 'lucide-react';
import { IdeaCard } from './IdeaCard';

export function AnalyticsPanel({ ideas, userProfile, effectiveRole }: { ideas: AppIdea[], userProfile: User, effectiveRole: Role }) {
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const submitAppeal = async (idea: AppIdea) => {
    setLoadingId(idea.id);
    try {
      const ideaRef = doc(db, 'ideas', idea.id);
      
      const newEvent: any = {
        stage: 'appealed',
        time: new Date().toISOString(),
        by: userProfile.id,
        note: `Appeal reason: ${appealReason}`
      };

      await updateDoc(ideaRef, {
        status: 'appealed',
        appealUsed: true,
        appealReason: appealReason, // Store the specific reason
        timeline: [...idea.timeline, newEvent],
        updatedAt: serverTimestamp()
      });
      setAppealingId(null);
      setAppealReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ideas/${idea.id}`);
    } finally {
      setLoadingId(null);
    }
  };

  const startEditing = (idea: AppIdea) => {
    setEditingIdeaId(idea.id);
    setEditTitle(idea.title);
    setEditDesc(idea.description);
  };

  const handleSaveEdit = async (idea: AppIdea) => {
    setSavingEdit(idea.id);
    try {
       await updateDoc(doc(db, 'ideas', idea.id), {
         title: editTitle,
         description: editDesc,
         updatedAt: serverTimestamp()
       });
       setEditingIdeaId(null);
    } catch(e) {
       handleFirestoreError(e, OperationType.UPDATE, `ideas/${idea.id}`);
    } finally {
       setSavingEdit(null);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    setDeletingId(ideaId);
    try {
      await deleteDoc(doc(db, 'ideas', ideaId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `ideas/${ideaId}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-auto pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full px-4">
      <div className="mt-8 mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">History</h2>
        <div className="text-xs text-[var(--color-neon-blue)] font-bold uppercase tracking-widest bg-[var(--color-neon-blue)]/10 px-3 py-1 rounded-full border border-[var(--color-neon-blue)]/20">All System Inputs</div>
      </div>

      <div className="space-y-4">
        {ideas.map(idea => (
          <IdeaCard 
            key={idea.id} 
            idea={idea} 
            userProfile={userProfile} 
            effectiveRole={effectiveRole} 
            customTrigger={
              <div className="bg-black/20 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-start justify-between gap-4 hover:bg-black/30 transition shadow-lg w-full">
                <div className="flex-1 pr-4 w-full">
                  {editingIdeaId === idea.id ? (
                    <div className="animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                      <input 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-2 focus:border-[var(--color-neon-blue)] outline-none font-semibold" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                      />
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-zinc-300 text-sm h-24 resize-none mb-3 focus:border-[var(--color-neon-blue)] outline-none leading-relaxed" 
                        value={editDesc} 
                        onChange={e => setEditDesc(e.target.value)} 
                      />
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditingIdeaId(null); }} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition">CANCEL</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(idea); }} disabled={savingEdit === idea.id} className="px-4 py-1.5 rounded-lg bg-[var(--color-neon-blue)]/20 text-[var(--color-neon-blue)] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-neon-blue)]/30 transition">
                          {savingEdit === idea.id ? <Loader2 className="w-3 h-3 animate-spin"/> : 'SAVE EDITS'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-lg mb-1 text-zinc-100 leading-tight flex items-center gap-2 flex-wrap">
                        {idea.title}
                        {(userProfile.role === 'builder' || (userProfile.id === idea.createdBy && (idea.status === 'under_review' || idea.status === 'appealed' || idea.status === 'rejected' || idea.status === 'builder_rejected'))) && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); startEditing(idea); }} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-[var(--color-neon-blue)] transition shrink-0">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteIdea(idea.id); }} disabled={deletingId === idea.id} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-red-400 transition shrink-0">
                              {deletingId === idea.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-zinc-400 text-sm line-clamp-2 md:line-clamp-none leading-relaxed break-words">{idea.description}</div>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-3 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-white/5 border border-white/10 whitespace-nowrap ${
                    idea.status === 'done' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                    ['approved', 'building'].includes(idea.status) ? 'text-[var(--color-neon-blue)] border-[var(--color-neon-blue)]/20 bg-[var(--color-neon-blue)]/5' :
                    ['rejected', 'final_rejected'].includes(idea.status) ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                    idea.status === 'appealed' ? 'text-[var(--color-neon-purple)] border-[var(--color-neon-purple)]/20 bg-[var(--color-neon-purple)]/5' :
                    idea.status === 'postponed' ? 'text-orange-400 border-orange-400/20 bg-orange-400/5' :
                    'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
                  }`}>
                    {idea.status.replace(/_/g, ' ')}
                  </span>
                  
                  {/* If Rejected and user is creator: Allow Appeal */}
                  {idea.status === 'rejected' && userProfile.id === idea.createdBy && !idea.appealUsed && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {appealingId === idea.id ? (
                        <div className="flex flex-col gap-2 w-full min-w-[200px] mt-2 animate-in fade-in zoom-in-95">
                          <input
                            value={appealReason}
                            onChange={(e) => setAppealReason(e.target.value)}
                            placeholder="Why should this be appealed?"
                            className="bg-black/40 border border-[var(--color-neon-purple)]/30 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[var(--color-neon-purple)] transition"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppealingId(null);
                                setAppealReason('');
                              }}
                              className="flex-1 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                submitAppeal(idea);
                              }}
                              disabled={!appealReason || loadingId === idea.id}
                              className="flex-1 py-1.5 bg-[var(--color-neon-purple)]/20 hover:bg-[var(--color-neon-purple)]/30 text-[var(--color-neon-purple)] rounded-lg text-xs font-bold transition flex justify-center items-center gap-2"
                            >
                              {loadingId === idea.id ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Submit Appeal'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAppealingId(idea.id); }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-neon-purple)]/30 hover:border-[var(--color-neon-purple)]/50 text-[var(--color-neon-purple)] rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 w-full md:w-auto mt-2"
                        >
                          APPEAL REJECTION
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            }
          />
        ))}
        {ideas.length === 0 && (
          <div className="text-center text-zinc-500 py-12 bg-black/20 rounded-2xl border border-white/5 border-dashed">
            No pipeline history found.
          </div>
        )}
      </div>
    </div>
  );
}

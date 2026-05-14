import React, { useState } from 'react';
import { AppIdea, User, IdeaStatus, Role } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ChevronDown, ChevronUp, AlertCircle, ArrowRightCircle, Play, CheckCircle2, X, Sparkles, Send, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { createPortal } from 'react-dom';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { signInToAutoForge, fetchProjects, pushToAutoForgeTask } from '../services/autoforgeService';

export interface IdeaCardProps {
  idea: AppIdea;
  userProfile: User;
  effectiveRole: Role;
  key?: React.Key;
}

export function IdeaCard({ idea, userProfile, effectiveRole }: IdeaCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [strategyInput, setStrategyInput] = useState('');
  const [rejectInput, setRejectInput] = useState('');
  const [postponeInput, setPostponeInput] = useState('');
  const [actionState, setActionState] = useState<'none' | 'reject' | 'strategize' | 'postpone' | 'ai_plan'>('none');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  // AutoForge Integration States
  const [afStatus, setAfStatus] = useState<'idle' | 'linking' | 'selecting' | 'pushing' | 'done'>('idle');
  const [afProjects, setAfProjects] = useState<any[]>([]);
  const [afSelectedProjectId, setAfSelectedProjectId] = useState<string>('');
  const [afError, setAfError] = useState<string>('');

  const handleGenerateAIPlan = async () => {
    setAiLoading(true);
    setGeneratedPrompt('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined. Please check environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Generate a structured prompt for AutoForge
      const promptText = `
        Analyze this idea request and output a precise, practical strategy prompt that can be directly passed to AutoForge (an AI Agent builder).
        
        App Title: ${idea.title}
        Description: ${idea.description}
        Strategist Notes: ${idea.strategy || "None"}
        
        Output *only* the raw prompt, including:
        - The absolute core goal of the app.
        - Primary features to be implemented.
        - Database structure (if applicable).
        - Key UI constraints (bold, dark mode, neon accents).
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText
      });
      setGeneratedPrompt(response.text || "Failed to generate strategy.");
    } catch (e: any) {
      setGeneratedPrompt(`Error generating strategy: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePushToAutoForge = async () => {
    setAfStatus('linking');
    setAfError('');
    try {
      let projects;
      try {
        projects = await fetchProjects();
      } catch (e) {
        await signInToAutoForge();
        projects = await fetchProjects();
      }
      setAfProjects(projects);
      if (projects.length > 0) {
        setAfSelectedProjectId(projects[0].id);
      }
      setAfStatus('selecting');
    } catch (error: any) {
      console.error("Failed to link to AutoForge:", error);
      setAfError("Failed to link: " + (error.message || String(error)));
      setAfStatus('idle');
    }
  };

  const confirmPushToAutoForge = async () => {
    if (!afSelectedProjectId) {
      setAfError("Please select a project first.");
      return;
    }
    setAfStatus('pushing');
    setAfError('');
    try {
      await pushToAutoForgeTask(afSelectedProjectId, idea.title, generatedPrompt);
      setAfStatus('done');
    } catch (error: any) {
      console.error("Failed to push to AutoForge:", error);
      setAfError("Push Error: " + (error.message || String(error)));
      setAfStatus('selecting');
    }
  };

  const isStrategist = effectiveRole === 'strategist';
  const isBuilder = effectiveRole === 'builder' || effectiveRole === 'archived_builder' as string;
  const isOwner = userProfile.id === idea.createdBy || isBuilder;

  const handleAction = async (newStatus: IdeaStatus, updates: any = {}) => {
    setLoading(true);
    try {
      const ideaRef = doc(db, 'ideas', idea.id);
      
      const newEvent: any = {
        stage: newStatus,
        time: new Date().toISOString(),
        by: userProfile.id
      };
      if (updates.strategy || updates.rejectionReason || updates.postponeReason) {
        newEvent.note = updates.strategy || updates.rejectionReason || updates.postponeReason;
      }

      await updateDoc(ideaRef, {
        status: newStatus,
        ...updates,
        timeline: [...idea.timeline, newEvent],
        updatedAt: serverTimestamp()
      });

      // Streak and points tracking
      const activityDateStr = new Date().toISOString().split('T')[0];
      let newStreak = userProfile.streak || 0;
      if (userProfile.lastDropDate !== activityDateStr) {
         if (userProfile.lastDropDate) {
           const last = new Date(userProfile.lastDropDate);
           const now = new Date(activityDateStr);
           const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
           if (diffDays === 1) {
             newStreak += 1;
           } else if (diffDays > 1) {
             newStreak = 1;
           }
         } else {
           newStreak = 1;
         }
      }
      
      let addedPoints = 0;
      if (isStrategist) addedPoints = 2;
      if (isBuilder) addedPoints = 3;
      
      if (addedPoints > 0 || userProfile.lastDropDate !== activityDateStr || newStreak !== userProfile.streak) {
         await updateDoc(doc(db, 'users', userProfile.id), {
            streak: newStreak,
            lastDropDate: activityDateStr,
            points: increment(addedPoints),
            updatedAt: serverTimestamp()
         });
      }

      // Special interactions
      if (newStatus === 'approved') {
         await updateDoc(doc(db, 'users', idea.createdBy), { points: increment(2), updatedAt: serverTimestamp() });
      }
      if (newStatus === 'appealed' || newStatus === 'building' || newStatus === 'done') {
         if (newStatus === 'building' && idea.status === 'appealed') {
           await updateDoc(doc(db, 'users', idea.createdBy), { points: increment(3), updatedAt: serverTimestamp() });
         }
      }

      window.dispatchEvent(new CustomEvent('show-streak', { detail: { role: effectiveRole, points: addedPoints, streak: newStreak } }));

      let fColor = 'bg-zinc-500';
      if (newStatus === 'rejected') fColor = 'bg-red-500';
      else if (newStatus === 'under_review') fColor = 'bg-[var(--color-neon-purple)]';
      else if (newStatus === 'approved') fColor = 'bg-[var(--color-neon-blue)]';
      else if (newStatus === 'building') fColor = 'bg-orange-500';
      else if (newStatus === 'postponed') fColor = 'bg-orange-500';
      else if (newStatus === 'done') fColor = 'bg-emerald-500';
      else if (newStatus === 'final_rejected') fColor = 'bg-red-600';
      
      window.dispatchEvent(new CustomEvent('flash-bg', { detail: { color: fColor } }));

      setActionState('none');
      setShowModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ideas/${idea.id}`);
    } finally {
      setLoading(false);
    }
  };

  const renderModalActions = () => {
    if (loading) return <div className="text-zinc-500 animate-pulse mt-8 text-center bg-black/40 py-4 rounded-xl font-mono text-sm tracking-widest uppercase">Processing...</div>;

    // Strategist Actions
    if (isStrategist || isBuilder) {
      if (idea.status === 'under_review') {
        if (actionState === 'none') {
          return (
            <div className="flex gap-4 mt-8">
              <button onClick={() => setActionState('reject')} className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 text-red-400 rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]">Reject Idea</button>
              <button onClick={() => setActionState('strategize')} className="flex-1 py-4 bg-[var(--color-neon-blue)]/10 hover:bg-[var(--color-neon-blue)]/20 border border-[var(--color-neon-blue)]/20 hover:border-[var(--color-neon-blue)]/50 text-[var(--color-neon-blue)] rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]">Accept & Strategize</button>
            </div>
          );
        }
        if (actionState === 'reject') {
          return (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-sm text-zinc-400 font-mono mb-2">Select or type rejection reason:</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Too brief', 'Out of scope', 'Duplicate'].map(tag => (
                  <button key={tag} onClick={() => setRejectInput(tag)} className="px-3 py-1.5 bg-black/40 border border-white/10 hover:border-white/30 text-zinc-300 text-xs rounded-full transition">{tag}</button>
                ))}
              </div>
              <input autoFocus value={rejectInput} onChange={e => setRejectInput(e.target.value)} placeholder="Elaborate on rejection..." className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition" />
              <div className="flex gap-3">
                <button onClick={() => setActionState('none')} className="w-1/3 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-zinc-400 font-bold uppercase tracking-widest transition">Back</button>
                <button disabled={!rejectInput} onClick={() => handleAction('rejected', { rejectionReason: rejectInput })} className="flex-1 py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:bg-red-500/30 disabled:opacity-50 disabled:pointer-events-none">Confirm Rejection</button>
              </div>
            </div>
          );
        }
        if (actionState === 'strategize') {
          return (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-sm text-zinc-400 font-mono mb-2">Provide strategy details for the builder:</div>
              <textarea autoFocus value={strategyInput} onChange={e => setStrategyInput(e.target.value)} placeholder="Technical approach, constraints, UI notes..." className="w-full bg-black/50 border border-[var(--color-neon-blue)]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-neon-blue)]/50 transition h-32 resize-none" />
              <div className="flex gap-3 items-center">
                <button onClick={() => setActionState('none')} className="w-1/3 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-zinc-400 font-bold uppercase tracking-widest transition">Back</button>
                <div className="flex-1 flex flex-col gap-1">
                  <button disabled={strategyInput.trim().length < 50} onClick={() => handleAction('approved', { strategy: strategyInput })} className="w-full py-3 bg-[var(--color-neon-blue)]/20 text-[var(--color-neon-blue)] border border-[var(--color-neon-blue)]/50 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:bg-[var(--color-neon-blue)]/30 disabled:opacity-50 disabled:pointer-events-none">Submit Strategy</button>
                  {strategyInput.trim().length < 50 && strategyInput.trim().length > 0 && (
                    <span className="text-[10px] text-red-400 text-center uppercase tracking-widest font-mono">Minimum 50 characters required</span>
                  )}
                </div>
              </div>
            </div>
          );
        }
      }
    }

    // Builder Actions
    if (isBuilder) {
      if (idea.status === 'appealed') {
        return (
          <div className="flex gap-4 mt-8">
            <button onClick={() => handleAction('final_rejected')} className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition shadow-[0_0_20px_rgba(239,68,68,0.1)]">VETO (REJECT)</button>
            <button onClick={() => handleAction('under_review')} className="flex-1 py-4 bg-[var(--color-neon-purple)]/10 hover:bg-[var(--color-neon-purple)]/20 border border-[var(--color-neon-purple)]/30 text-[var(--color-neon-purple)] rounded-xl text-xs font-bold transition shadow-[0_0_20px_rgba(180,0,255,0.1)]">APPROVE APPEAL</button>
          </div>
        );
      }
      if (idea.status === 'approved') {
        if (actionState === 'postpone') {
          return (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-sm text-zinc-400 font-mono mb-2">Select or type postpone reason:</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Not worth effort right now', 'Low priority', 'Missing dependencies', 'Too complex'].map(tag => (
                  <button key={tag} onClick={() => setPostponeInput(tag)} className="px-3 py-1.5 bg-black/40 border border-white/10 hover:border-white/30 text-zinc-300 text-xs rounded-full transition">{tag}</button>
                ))}
              </div>
              <input autoFocus value={postponeInput} onChange={e => setPostponeInput(e.target.value)} placeholder="Why defer this?" className="w-full bg-black/50 border border-orange-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition" />
              <div className="flex gap-3">
                <button onClick={() => setActionState('none')} className="w-1/3 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-zinc-400 font-bold uppercase tracking-widest transition">Back</button>
                <button disabled={!postponeInput} onClick={() => handleAction('postponed', { postponeReason: postponeInput })} className="flex-1 py-3 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:bg-orange-500/30 disabled:opacity-50 disabled:pointer-events-none">Confirm Postpone</button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex gap-4 mt-8">
            <button onClick={() => setActionState('postpone')} className="w-1/3 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded-xl text-xs font-bold transition shadow-[0_0_20px_rgba(249,115,22,0.1)]">POSTPONE</button>
            <button onClick={() => handleAction('building')} className="flex-1 py-4 bg-[var(--color-neon-blue)]/10 hover:bg-[var(--color-neon-blue)]/20 border border-[var(--color-neon-blue)]/30 text-[var(--color-neon-blue)] text-sm font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(0,240,255,0.15)] hover:shadow-[0_0_40px_rgba(0,240,255,0.25)] flex justify-center items-center gap-3">
              <Play className="w-5 h-5 fill-current" /> BEGIN BUILD
            </button>
          </div>
        );
      }
      if (idea.status === 'building') {
        if (actionState === 'ai_plan') {
          return (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="text-sm text-[var(--color-neon-purple)] font-mono mb-2 flex items-center gap-2">
                 <Sparkles className="w-4 h-4" /> AI AutoForge Strategy
               </div>
               <div className="text-xs text-zinc-400 mb-2 leading-relaxed">
                 Below is the generated strategy. Copy this prompt and paste it to the AutoForge AO for automated execution.
               </div>
               {aiLoading ? (
                 <div className="w-full bg-black/50 border border-[var(--color-neon-purple)]/30 rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-4 animate-pulse">
                   <Sparkles className="w-6 h-6 text-[var(--color-neon-purple)] animate-spin" />
                   <div className="text-xs text-[var(--color-neon-purple)] font-mono tracking-widest uppercase">Analyzing architecture...</div>
                 </div>
               ) : (
                 <textarea readOnly value={generatedPrompt} className="w-full bg-black/50 border border-[var(--color-neon-purple)]/30 rounded-xl px-4 py-4 text-xs font-mono text-zinc-300 transition h-32 resize-none focus:outline-none" />
               )}

               {/* AutoForge Integration Box */}
               {!aiLoading && generatedPrompt && (
                 <div className="border border-[var(--color-neon-purple)]/20 bg-[var(--color-neon-purple)]/5 p-4 rounded-xl mt-4">
                   {afStatus === 'idle' && (
                     <button onClick={handlePushToAutoForge} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-neon-blue)]/10 text-[var(--color-neon-blue)] border border-[var(--color-neon-blue)]/30 hover:bg-[var(--color-neon-blue)]/20 transition rounded-xl text-xs font-bold tracking-widest uppercase">
                       <Send className="w-4 h-4" /> SUBMIT TO AUTOFORGE
                     </button>
                   )}
                   {afStatus === 'linking' && (
                     <div className="flex items-center justify-center gap-2 text-[var(--color-neon-blue)] text-xs font-mono animate-pulse py-2">
                       <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating & Fetching Projects...
                     </div>
                   )}
                   {afStatus === 'selecting' && (
                     <div className="flex flex-col gap-3">
                       <div className="text-xs text-zinc-400 font-mono">Select Target AutoForge Project:</div>
                       <select value={afSelectedProjectId} onChange={(e) => setAfSelectedProjectId(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-white text-sm focus:outline-none">
                         {afProjects.map(p => (
                           <option key={p.id} value={p.id}>{p.githubRepo} ({p.githubOwner})</option>
                         ))}
                       </select>
                       <button onClick={confirmPushToAutoForge} className="w-full py-2 bg-[var(--color-neon-blue)]/20 text-[var(--color-neon-blue)] border border-[var(--color-neon-blue)]/50 hover:bg-[var(--color-neon-blue)]/30 transition rounded-lg text-xs font-bold tracking-widest uppercase">
                         Confirm Push
                       </button>
                     </div>
                   )}
                   {afStatus === 'pushing' && (
                     <div className="flex items-center justify-center gap-2 text-[var(--color-neon-blue)] text-xs font-mono animate-pulse py-2">
                       <Send className="w-4 h-4 animate-bounce" /> Pushing to AutoForge Queue...
                     </div>
                   )}
                   {afStatus === 'done' && (
                     <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                       <CheckCircle2 className="w-4 h-4" /> SUCCESS! READY IN AUTOFORGE
                     </div>
                   )}
                   {afError && (
                     <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono whitespace-pre-wrap break-words">
                       <AlertCircle className="w-4 h-4 mb-1 inline mr-1" /> {afError}
                     </div>
                   )}
                 </div>
               )}

               <div className="flex gap-3">
                 <button onClick={() => setActionState('none')} className="w-1/3 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-zinc-400 font-bold uppercase tracking-widest transition">Back</button>
                 <button disabled={aiLoading || !generatedPrompt} onClick={() => { navigator.clipboard.writeText(generatedPrompt); }} className="flex-1 py-3 bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple)] border border-[var(--color-neon-purple)]/50 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:bg-[var(--color-neon-purple)]/30 disabled:opacity-50">Copy Prompt</button>
               </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-4 mt-8">
            <button onClick={() => handleAction('done')} className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)] flex justify-center items-center gap-3">
              <CheckCircle2 className="w-5 h-5" /> MARK AS DONE
            </button>
            <button onClick={() => { setActionState('ai_plan'); handleGenerateAIPlan(); }} className="w-full py-3 bg-[var(--color-neon-purple)]/5 border border-[var(--color-neon-purple)]/20 hover:bg-[var(--color-neon-purple)]/10 text-[var(--color-neon-purple)] text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(180,0,255,0.1)] flex justify-center items-center gap-2">
              <Sparkles className="w-4 h-4" /> DEV MODE: GENERATE AUTOFORGE PLAN
            </button>
          </div>
        );
      }
      if (idea.status === 'postponed') {
        return (
          <button onClick={() => handleAction('approved')} className="mt-8 w-full py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.15)] flex justify-center items-center gap-3">
            <Play className="w-5 h-5 fill-current" /> RESTORE TO QUEUE
          </button>
        );
      }
    }

    return null;
  };

  return (
    <>
      <motion.div 
        layout
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "bg-black/20 border border-white/5 rounded-xl p-4 transition-all relative overflow-hidden cursor-pointer group",
          idea.status === 'building' && "border-[var(--color-neon-blue)]/50 shadow-[0_0_15px_rgba(0,240,255,0.15)] bg-[var(--color-neon-blue)]/5"
        )}
      >
        {idea.status === 'building' && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-blue)]/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse" />
        )}
        
        <div className="flex justify-between items-start gap-4">
          <h4 className="font-semibold text-sm leading-tight text-zinc-100 group-hover:text-white transition-colors">{idea.title}</h4>
        </div>
      </motion.div>

      {showModal && createPortal(
        <AnimatePresence>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            onClick={() => setShowModal(false)} 
          />
          
          <motion.div 
            layoutId={idea.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#08080c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Glossy top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="flex justify-between items-start p-6 sm:p-8 pb-4 shrink-0 border-b border-white/5">
              <div>
                <div className="text-[10px] text-[var(--color-neon-purple)] tracking-widest font-bold uppercase mb-2">Idea Request</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight pr-8">{idea.title}</h2>
              </div>
              
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0 -mt-2 -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 pt-4 overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-mono bg-white/5 p-4 rounded-xl border border-white/5">
                  {idea.description}
                </p>
              </div>

              <div className="mt-8">
                <div className="text-[10px] text-zinc-500 tracking-widest font-bold uppercase mb-4 border-b border-white/5 pb-2">History & Progress</div>
                <div className="space-y-4">
                  {idea.timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-neon-blue)]/10 text-[var(--color-neon-blue)] shrink-0 mt-1">
                        {event.stage === 'under_review' && <Sparkles className="w-4 h-4" />}
                        {event.stage === 'rejected' && <X className="w-4 h-4 text-red-500" />}
                        {event.stage === 'approved' && <Play className="w-4 h-4 text-[var(--color-neon-blue)]" />}
                        {event.stage === 'building' && <AlertCircle className="w-4 h-4 text-orange-400" />}
                        {event.stage === 'appealed' && <ArrowRightCircle className="w-4 h-4 text-[var(--color-neon-purple)]" />}
                        {event.stage === 'postponed' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                        {event.stage === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {event.stage === 'final_rejected' && <X className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs uppercase tracking-widest text-[var(--color-neon-blue)]">{event.stage.replace('_', ' ')}</span>
                          <time className="font-mono text-[10px] text-zinc-500">{new Date(event.time).toLocaleDateString()} {new Date(event.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                        </div>
                        {event.note && (
                          <div className="text-sm text-zinc-300 font-mono p-3 bg-black/40 rounded-lg border border-white/5 break-words">
                            {event.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {renderModalActions()}
            </div>
          </motion.div>
        </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

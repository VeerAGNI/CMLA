import React from 'react';
import { X, Lightbulb, TrendingUp, Presentation, ShieldCheck } from 'lucide-react';

export function OnboardingGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass max-w-xl w-full rounded-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 overflow-y-auto">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] rounded-xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <Lightbulb className="w-6 h-6 text-black" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Welcome to Pipeline</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            This is the ultimate workspace for managing, strategizing, and building our best ideas. Here is how it works:
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-neon-blue)]/10 text-[var(--color-neon-blue)] flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-white">1. Idea Vault</h3>
                <p className="text-sm text-zinc-400 mt-1">Submit your new execution ideas anytime. No time restrictions. The more detailed, the better.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-neon-purple)]/10 text-[var(--color-neon-purple)] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-white">2. The Pipeline</h3>
                <p className="text-sm text-zinc-400 mt-1">Ideas move through different stages. Review, strategy, building, and deployment. Keep track of progress seamlessly.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Presentation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-white">3. Streaks & Analytics</h3>
                <p className="text-sm text-zinc-400 mt-1">Consistency is key. Submit ideas to build your daily streak. Higher streaks boost your position on the Leaderboard.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-white">4. Roles</h3>
                <p className="text-sm text-zinc-400 mt-1">Creators drop ideas. Strategists review and plan. Builders execute. All roles are crucial to the pipeline.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-10 bg-white text-black hover:bg-zinc-200 transition py-3 rounded-xl font-bold tracking-widest text-sm"
          >
            START EXECUTING
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { X, Moon, Sun, BookOpen } from 'lucide-react';

export function SettingsModal({ 
  onClose, 
  onShowGuide 
}: { 
  onClose: () => void;
  onShowGuide: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass max-w-sm w-full rounded-2xl relative overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="font-bold tracking-widest uppercase text-sm">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-2">
          <button 
            onClick={() => {
              onClose();
              onShowGuide();
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-neon-blue)]/10 text-[var(--color-neon-blue)] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">Onboarding Guide</div>
                <div className="text-xs text-zinc-500">Replay the introductory guide</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

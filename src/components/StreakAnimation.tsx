import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { createPortal } from 'react-dom';

export function StreakAnimation() {
  const [data, setData] = useState<{ role: string; points: number; streak: number } | null>(null);

  useEffect(() => {
    const handleShow = (e: any) => {
      const { role, points, streak } = e.detail;
      setData({ role, points, streak });

      // Automatically hide after 3 seconds
      setTimeout(() => {
        setData(null);
      }, 3500);
    };

    window.addEventListener('show-streak', handleShow);
    return () => window.removeEventListener('show-streak', handleShow);
  }, []);

  if (!data) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black animate-in fade-in duration-300">
      <div className="animate-[bounce_2s_ease-in-out_infinite] mb-8">
        <Flame className="w-48 h-48 sm:w-64 sm:h-64 text-orange-500 drop-shadow-[0_0_80px_rgba(249,115,22,0.8)] fill-current" />
      </div>
      <div className="text-center space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
        <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          Action Completed
        </h2>
        
        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">Streak</span>
            <div className="text-4xl font-black text-orange-400 tabular-nums">🔥 {data.streak}</div>
          </div>
          <div className="w-px h-16 bg-white/10" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">Points Gained</span>
            <div className="text-4xl font-black text-[var(--color-neon-blue)] tabular-nums">+{data.points}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

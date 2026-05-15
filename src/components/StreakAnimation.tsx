import React, { useEffect, useState } from 'react';
import { Flame, Rocket } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

export function StreakAnimation() {
  const [data, setData] = useState<{ showStreak: boolean; points: number; streak: number } | null>(null);
  const [phase, setPhase] = useState<'idle' | 'rocket' | 'streak'>('idle');

  useEffect(() => {
    const handleShow = (e: any) => {
      const { showStreak, points, streak } = e.detail;
      setData({ showStreak, points, streak });
      setPhase('rocket');

      // End rocket after 2 seconds, move to streak or idle
      setTimeout(() => {
        if (showStreak) {
          setPhase('streak');
          setTimeout(() => setPhase('idle'), 3500); // end streak after 3.5s
        } else {
          setPhase('idle');
        }
      }, 2000);
    };

    window.addEventListener('work-completed', handleShow);
    return () => window.removeEventListener('work-completed', handleShow);
  }, []);

  return createPortal(
    <AnimatePresence>
      {phase === 'rocket' && (
        <motion.div 
          key="rocket-phase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center overflow-hidden bg-black/90 backdrop-blur-md"
        >
          {/* Golden mesh gradient that fades in and out */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center mix-blend-screen"
          >
            <div className="w-[120vw] h-[120vw] rounded-full bg-gradient-to-tr from-orange-500/40 via-yellow-400/40 to-amber-300/40 blur-[150px]" />
          </motion.div>

          <motion.div 
            initial={{ y: '100vh', scale: 0.5, rotate: -45 }}
            animate={{ y: '-100vh', scale: 1.2, rotate: -45 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative flex flex-col items-center justify-center"
          >
            <Rocket className="w-48 h-48 text-yellow-400 drop-shadow-[0_0_80px_rgba(250,204,21,1)] fill-current relative z-10" />
            <div className="w-16 h-[800px] bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 blur-2xl opacity-90 delay-100 rounded-full absolute top-[100%] left-1/2 -translate-x-1/2 origin-top transform" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white blur-[100px] opacity-80" />
          </motion.div>
        </motion.div>
      )}

      {phase === 'streak' && data && (
        <motion.div 
          key="streak-phase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="flex flex-col items-center"
          >
            <div className="animate-[bounce_2s_ease-in-out_infinite] mb-8">
              <Flame className="w-48 h-48 sm:w-64 sm:h-64 text-orange-500 drop-shadow-[0_0_80px_rgba(249,115,22,0.8)] fill-current" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Action Completed
              </h2>
              
              <div className="flex items-center justify-center gap-8 mt-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">Streak</span>
                  <div className="text-4xl font-black text-orange-400 tabular-nums">🔥 {data.streak}</div>
                </div>
                {data.points > 0 && (
                  <>
                    <div className="w-px h-16 bg-white/10" />
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">Points Gained</span>
                      <div className="text-4xl font-black text-[var(--color-neon-blue)] tabular-nums">+{data.points}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

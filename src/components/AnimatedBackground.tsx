import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function AnimatedBackground() {
  const [flashColor, setFlashColor] = useState<string | null>(null);

  useEffect(() => {
    const onFlash = (e: any) => {
      setFlashColor(e.detail?.color || 'bg-[var(--color-neon-blue)]');
      setTimeout(() => setFlashColor(null), 2500);
    };
    window.addEventListener('flash-bg', onFlash);
    return () => window.removeEventListener('flash-bg', onFlash);
  }, []);

  return (
    <div className="fixed inset-0 z-[-10] overflow-hidden pointer-events-none bg-[#030308]">
      {/* Dynamic Mesh Orbs */}
      <motion.div
        animate={{
          x: ['-5%', '15%', '-5%'],
          y: ['-5%', '5%', '-5%'],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-neon-blue)]/30 blur-[100px]"
      />
      <motion.div
        animate={{
          x: ['5%', '-15%', '5%'],
          y: ['15%', '-5%', '15%'],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-neon-purple)]/30 blur-[100px]"
      />
      <motion.div
        animate={{
          x: ['0%', '20%', '0%'],
          y: ['10%', '-10%', '10%'],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/15 blur-[100px]"
      />

      <AnimatePresence>
        {flashColor && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
            >
              <div className={`w-[100vw] h-[100vw] rounded-full ${flashColor}/30 blur-[150px]`} />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Dimmer / Grain Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
    </div>
  );
}

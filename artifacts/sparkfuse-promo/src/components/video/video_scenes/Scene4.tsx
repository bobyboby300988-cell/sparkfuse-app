import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Text appears
      setTimeout(() => setPhase(2), 1000), // Card drops in locked
      setTimeout(() => setPhase(3), 2000), // Card unlocks with shimmer
      setTimeout(() => setPhase(4), 3000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute top-[10%] text-center z-20 w-full px-6">
        <motion.h2 
          className="font-display text-[9vh] leading-[0.9] text-white drop-shadow-lg"
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          PREMIUM <span className="text-accent">CONTENT</span><br/>
          <span className="text-primary">EXCLUSIVE</span> ACCESS
        </motion.h2>
      </div>

      <div className="relative w-[70%] aspect-[3/4] mt-[20%]">
        {/* Content Card */}
        <motion.div
          className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-zinc-700 shadow-[0_0_50px_rgba(243,156,18,0.2)]"
          initial={{ y: 50, opacity: 0, scale: 0.8 }}
          animate={phase >= 2 ? { y: 0, opacity: 1, scale: 1 } : { y: 50, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <img src={`${import.meta.env.BASE_URL}profile1.png`} className="w-full h-full object-cover bg-white" />
          
          {/* Glass blur overlay when locked */}
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            animate={phase >= 3 ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent"
              animate={phase >= 3 ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-5xl">🔒</span>
            </motion.div>
          </motion.div>

          {/* Golden Shimmer effect when unlocking */}
          {phase === 3 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-50 mix-blend-overlay"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
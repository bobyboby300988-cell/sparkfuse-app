import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // UI appears
      setTimeout(() => setPhase(2), 1000), // Stream starts, hearts
      setTimeout(() => setPhase(3), 2000), // Gifts/comments appear
      setTimeout(() => setPhase(4), 3500), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const hearts = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${40 + Math.random() * 40}%`,
    duration: 1.5 + Math.random(),
    delay: Math.random() * 2
  }));

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute top-[8%] text-center z-20 w-full px-6">
        <motion.h2 
          className="font-display text-[8vh] leading-[0.9] text-white drop-shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          GO <span className="text-primary">LIVE</span><br/>
          CONNECT IN <span className="text-accent">REAL TIME</span>
        </motion.h2>
      </div>

      <motion.div 
        className="relative w-[85%] aspect-[9/16] max-h-[60vh] mt-[25%] bg-zinc-900 rounded-3xl overflow-hidden border-2 border-zinc-700 shadow-2xl"
        initial={{ y: 100, opacity: 0, rotateX: 20 }}
        animate={phase >= 1 ? { y: 0, opacity: 1, rotateX: 0 } : { y: 100, opacity: 0, rotateX: 20 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        style={{ perspective: 1000 }}
      >
        <img src={`${import.meta.env.BASE_URL}profile2.png`} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-display text-lg text-white">LIVE</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            <span className="text-white text-sm">👁️ 1.2k</span>
          </div>
        </div>

        {/* Hearts animation */}
        {phase >= 2 && hearts.map(h => (
          <motion.div
            key={h.id}
            className="absolute bottom-20 text-2xl z-10"
            style={{ left: h.left }}
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ y: -300, opacity: [0, 1, 0], scale: 1.5 }}
            transition={{ duration: h.duration, delay: h.delay, repeat: Infinity }}
          >
            {Math.random() > 0.5 ? '❤️' : '🔥'}
          </motion.div>
        ))}

        {/* Comments/Gifts overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-10">
          {phase >= 3 && (
            <>
              <motion.div 
                className="bg-black/40 backdrop-blur-md rounded-xl p-2 text-sm text-white w-3/4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring' }}
              >
                <span className="font-bold text-accent">Jake:</span> You look gorgeous!
              </motion.div>
              <motion.div 
                className="bg-gradient-to-r from-primary/50 to-accent/50 backdrop-blur-md rounded-xl p-2 text-sm text-white font-bold w-5/6 flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <span>🎁</span> Mark sent a Rose!
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
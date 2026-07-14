import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Card 1 appears
      setTimeout(() => setPhase(2), 1200), // Card 1 swipes, Card 2 appears
      setTimeout(() => setPhase(3), 2000), // Match!
      setTimeout(() => setPhase(4), 3000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '-100%' }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute top-[10%] text-center z-20 w-full px-6">
        <motion.h2 
          className="font-display text-[10vh] leading-none text-white drop-shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          SWIPE. <span className="text-primary">MATCH.</span> CONNECT.
        </motion.h2>
      </div>

      <div className="relative w-[80%] aspect-[3/4] mt-[20%]">
        {/* Card 2 (behind) */}
        <motion.div 
          className="absolute inset-0 bg-zinc-800 rounded-3xl overflow-hidden border-4 border-zinc-700 shadow-2xl"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={phase >= 1 ? (phase >= 2 ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.95, y: 10, opacity: 1 }) : { scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <img src={`${import.meta.env.BASE_URL}profile2.png`} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="font-display text-4xl text-white">Sarah, 24</h3>
            <p className="font-body text-white/80">Photographer</p>
          </div>
        </motion.div>

        {/* Card 1 (front) */}
        <motion.div 
          className="absolute inset-0 bg-zinc-800 rounded-3xl overflow-hidden border-4 border-zinc-700 shadow-2xl origin-bottom"
          initial={{ y: '100%', rotate: -10 }}
          animate={phase >= 2 ? { x: '120%', rotate: 20, opacity: 0 } : (phase >= 1 ? { y: 0, rotate: 0 } : { y: '100%', rotate: -10 })}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <img src={`${import.meta.env.BASE_URL}profile1.png`} className="w-full h-full object-cover bg-white" />
          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="font-display text-4xl text-white">James, 26</h3>
            <p className="font-body text-white/80">Software Engineer</p>
          </div>
          
          {phase >= 1 && phase < 2 && (
            <motion.div 
              className="absolute top-10 right-10 border-4 border-accent text-accent font-display text-4xl px-4 py-1 rounded-xl rotate-12"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              LIKE
            </motion.div>
          )}
        </motion.div>

        {/* Match Overlay */}
        {phase >= 3 && (
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-3xl backdrop-blur-sm z-30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <motion.h1 
              className="font-display text-[12vh] leading-none text-accent drop-shadow-[0_0_20px_rgba(243,156,18,0.8)]"
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              IT'S A
            </motion.h1>
            <motion.h1 
              className="font-display text-[15vh] leading-none text-primary drop-shadow-[0_0_30px_rgba(192,57,43,0.8)]"
              initial={{ scale: 0.5, rotate: 10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              MATCH!
            </motion.h1>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
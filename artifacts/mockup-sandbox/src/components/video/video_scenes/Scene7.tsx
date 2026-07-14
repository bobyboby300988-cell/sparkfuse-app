import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="z-30 flex flex-col items-center">
        {/* App Icon/Logo */}
        <motion.div 
          className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-[#C0392B] to-[#F39C12] flex items-center justify-center shadow-[0_0_50px_rgba(192,57,43,0.6)] mb-6 relative overflow-hidden"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <div className="absolute inset-0 bg-white/20 blur-md transform translate-y-1/2" />
        </motion.div>

        {/* Logotype */}
        <motion.h1 
          className="text-[15vw] font-display tracking-tight text-white mb-12 drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        >
          SparkFuse
        </motion.h1>

        {/* Availability */}
        <motion.div 
          className="flex flex-col items-center gap-4 mb-10 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        >
          <div className="bg-white text-black px-8 py-4 rounded-xl font-bold w-full max-w-[280px] flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" /></svg>
            Available on Google Play
          </div>
          <div className="bg-white/10 text-white/50 px-8 py-3 rounded-xl font-medium w-full max-w-[280px] text-center border border-white/5">
            App Store Coming Soon
          </div>
        </motion.div>

        {/* URL */}
        <motion.div 
          className="text-[#F39C12] font-sans font-medium text-lg tracking-wide"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        >
          match-maker-2025ap.replit.app
        </motion.div>
      </div>

      {/* Sparkles background effect for Outro */}
      {phase >= 1 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white"
              initial={{ 
                x: '50vw', y: '50vh', opacity: 1, scale: 0 
              }}
              animate={{ 
                x: `${50 + (Math.random() * 100 - 50)}vw`, 
                y: `${50 + (Math.random() * 100 - 50)}vh`,
                opacity: 0,
                scale: Math.random() * 2 + 0.5
              }}
              transition={{ 
                duration: 1.5 + Math.random() * 1,
                ease: "easeOut",
                delay: Math.random() * 0.5
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
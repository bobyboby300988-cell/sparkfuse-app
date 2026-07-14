import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Text appears
      setTimeout(() => setPhase(2), 1000), // Chat bubbles
      setTimeout(() => setPhase(3), 2000), // Coach card
      setTimeout(() => setPhase(4), 3500), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute top-[8%] text-center z-20 w-full px-6">
        <motion.h2 
          className="font-display text-[9vh] leading-[0.9] text-white drop-shadow-lg"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          CHAT <span className="text-primary">INSTANTLY</span><br/>
          GET <span className="text-accent">COACHED</span>
        </motion.h2>
      </div>

      <div className="relative w-full h-[60%] flex flex-col items-center mt-[20%] px-6">
        {/* Chat bubbles */}
        <div className="w-full flex flex-col gap-4 z-10 mb-8">
          <motion.div 
            className="self-end bg-primary rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] text-white font-body shadow-lg"
            initial={{ scale: 0, originX: 1, originY: 1, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          >
            How do I start a good conversation? 🤔
          </motion.div>

          <motion.div 
            className="self-start bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] text-white font-body shadow-lg border border-zinc-700"
            initial={{ scale: 0, originX: 0, originY: 1, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.3 }}
          >
            Be genuine! Comment on something specific from their profile. 💡
          </motion.div>
        </div>

        {/* Coach Card */}
        <motion.div
          className="w-[85%] bg-zinc-900 rounded-3xl overflow-hidden border-2 border-accent shadow-[0_0_40px_rgba(243,156,18,0.2)] flex flex-row items-center p-4 gap-4"
          initial={{ y: 50, opacity: 0 }}
          animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shrink-0">
            <img src={`${import.meta.env.BASE_URL}coach.png`} className="w-full h-full object-cover bg-white" />
          </div>
          <div className="flex flex-col">
            <div className="text-accent font-display text-sm tracking-wider">CERTIFIED COACH</div>
            <div className="text-white font-display text-2xl">ALEXANDER</div>
            <div className="text-white/60 font-body text-xs mt-1">Dating & Relationship Expert</div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
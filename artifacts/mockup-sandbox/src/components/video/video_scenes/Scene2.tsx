import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background shapes */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-[#C0392B]/20 blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#F39C12]/20 blur-3xl" />
      </motion.div>

      {/* Caption/Subtitle overlay */}
      <div className="absolute top-20 left-0 right-0 z-30 flex flex-col items-center">
        <motion.div 
          className="bg-black/40 backdrop-blur-lg px-8 py-4 rounded-2xl border border-white/10 shadow-2xl"
          initial={{ y: -50, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <h2 className="text-[12vw] font-display text-white leading-none tracking-tight">
            MATCH INSTANTLY
          </h2>
        </motion.div>
      </div>

      {/* Phone UI Mockup */}
      <motion.div 
        className="relative w-[75vw] h-[150vw] max-h-[75vh] max-w-[350px] z-20"
        initial={{ y: 100, opacity: 0, rotateZ: 5 }}
        animate={{ y: 0, opacity: 1, rotateZ: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
        {/* Phone Frame */}
        <div className="absolute inset-0 rounded-[40px] border-[8px] border-gray-900 bg-gray-950 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Card Stack */}
          
          {/* Card 3 (Bottom) */}
          <motion.div 
            className="absolute inset-2 bottom-20 rounded-[24px] bg-gray-800 overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={
              phase >= 3 ? { scale: 0.95, y: 10 } :
              phase >= 2 ? { scale: 0.9, y: 20 } :
              { scale: 0.9, y: 20 }
            }
          >
             <img src={`${import.meta.env.BASE_URL}couple.png`} className="w-full h-full object-cover opacity-50" />
          </motion.div>

          {/* Card 2 (Middle) */}
          <motion.div 
            className="absolute inset-2 bottom-20 rounded-[24px] bg-gray-700 overflow-hidden shadow-xl"
            initial={{ scale: 0.95, y: 10 }}
            animate={
              phase >= 3 ? { scale: 1, y: 0 } :
              phase >= 2 ? { x: 300, rotate: 15, opacity: 0 } :
              { scale: 0.95, y: 10 }
            }
            transition={{ duration: 0.5 }}
          >
            <img src={`${import.meta.env.BASE_URL}profile2.png`} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-3xl font-bold text-white font-sans">Sarah, 24</h3>
              <p className="text-white/80 font-sans mt-1">Adventure seeker ✨</p>
            </div>
          </motion.div>

          {/* Card 1 (Top) */}
          <motion.div 
            className="absolute inset-2 bottom-20 rounded-[24px] bg-gray-600 overflow-hidden shadow-2xl origin-bottom-right"
            initial={{ scale: 1, y: 0 }}
            animate={
              phase >= 2 ? { x: -300, rotate: -20, opacity: 0 } :
              { scale: 1, y: 0 }
            }
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <img src={`${import.meta.env.BASE_URL}profile1.png`} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-3xl font-bold text-white font-sans">James, 27</h3>
              <p className="text-white/80 font-sans mt-1">Coffee enthusiast ☕</p>
            </div>
            
            {/* Nope Stamp */}
            <motion.div
              className="absolute top-10 right-10 border-4 border-red-500 rounded-lg px-4 py-2"
              initial={{ opacity: 0, scale: 2 }}
              animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 2 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-4xl font-black text-red-500 transform -rotate-12 inline-block">NOPE</span>
            </motion.div>
          </motion.div>

          {/* IT'S A MATCH OVERLAY */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div 
                className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h3 
                  className="font-display text-5xl text-[#F39C12] text-center mb-8 drop-shadow-[0_0_15px_rgba(243,156,18,0.5)]"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  IT'S A SPARK!
                </motion.h3>
                <div className="flex gap-4">
                  <motion.div 
                    className="w-20 h-20 rounded-full border-4 border-[#C0392B] overflow-hidden"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <img src={`${import.meta.env.BASE_URL}profile1.png`} className="w-full h-full object-cover" />
                  </motion.div>
                  <motion.div 
                    className="w-20 h-20 rounded-full border-4 border-[#C0392B] overflow-hidden"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <img src={`${import.meta.env.BASE_URL}profile2.png`} className="w-full h-full object-cover" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gray-900 border-t border-white/10 flex justify-around items-center px-4">
            <div className="w-8 h-8 rounded-full bg-white/20" />
            <div className="w-12 h-12 rounded-full bg-[#C0392B] shadow-[0_0_15px_rgba(192,57,43,0.5)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 4500),
      setTimeout(() => setPhase(3), 9000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center bg-[#0D0B12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 3 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PhoneMockup scale={1.2}>
        <div className="relative flex flex-col h-full bg-[#0D0B12] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] opacity-90" />

          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#C0392B] px-2 py-0.5 rounded text-xs font-bold">● LIVE</div>
              <div className="bg-black/40 px-2 py-0.5 rounded text-xs backdrop-blur-sm">👁 1,847 viewers</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-sm">✕</div>
          </div>

          <div className="relative z-10 px-4 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-lg drop-shadow-md">Sofia 🔥</h2>
              <span className="text-blue-400 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
            </div>
            <div className="bg-black/40 inline-block px-2 py-0.5 rounded-full text-[10px] backdrop-blur-sm border border-white/20">🔥 Dating</div>
          </div>

          <div className="absolute right-4 bottom-20 z-10 w-8 h-64 overflow-hidden pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div key={i} className="absolute bottom-0 text-xl"
                style={{ left: `${Math.sin(i) * 10}px` }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -200, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {['❤️', '😍', '🔥', '💋'][i % 4]}
              </motion.div>
            ))}
          </div>

          <div className="mt-auto relative z-10 flex flex-col gap-2 p-4 pb-20">
            <AnimatePresence>
              {phase >= 1 && (
                <>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10">
                    <span className="font-bold text-[#F39C12]">Alex:</span> she's so beautiful 😍
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10">
                    <span className="font-bold text-[#48CAE4]">Marco:</span> 🔥🔥🔥
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10">
                    <span className="font-bold text-[#27ae60]">Jin:</span> first time here, love it!
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10"
              >
                <span className="font-bold text-[#FF6B9D]">Mia:</span> this community is amazing 💕
              </motion.div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 z-20 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex-1 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white/50 border border-white/10 flex items-center">
              💬 Comment...
            </div>
            <motion.button className="bg-gradient-to-r from-[#C0392B] to-[#e74c3c] rounded-full px-4 py-2 text-xs font-bold shadow-[0_0_10px_rgba(192,57,43,0.5)]"
              animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ❤️ REACT
            </motion.button>
          </div>
        </div>
      </PhoneMockup>
    </motion.div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3500), // Swipe animation
      setTimeout(() => setPhase(3), 4500), // Next card in
      setTimeout(() => setPhase(4), 7500), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center bg-[#0D0B12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 4 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PhoneMockup scale={1.2}>
        <div className="flex flex-col h-full bg-[#0D0B12] text-white">
          <div className="flex items-center justify-between p-4 pb-2 border-b border-white/10">
            <span style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: '#C0392B' }}>SPARKFUSE</span>
            <span style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: 'bold' }}>💗 Discover</span>
            <span>⚙️</span>
          </div>

          <div className="flex-1 p-4 relative overflow-hidden">
            <AnimatePresence>
              {phase < 2 && (
                <motion.div
                  key="card1"
                  className="absolute inset-4 rounded-xl overflow-hidden shadow-2xl bg-[rgba(22,18,32,0.97)] border border-white/10"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: phase === 1 ? 5 : 0, x: phase === 1 ? 20 : 0 }}
                  exit={{ x: 500, rotate: 30, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-20">
                    <div className="flex items-center gap-2">
                      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 32 }}>Sofia, 24</h2>
                      <span className="text-blue-400 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                    </div>
                    <p style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>📍 2 km away</p>
                    <p style={{ fontFamily: 'Inter', fontSize: 13, marginTop: 4 }}>Artist. Lover of wine & travel 🍷</p>
                  </div>
                  
                  {phase === 1 && (
                    <motion.div className="absolute top-8 left-8 border-4 border-[#27ae60] text-[#27ae60] font-bold text-4xl p-2 rounded transform -rotate-12"
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      LIKE
                    </motion.div>
                  )}
                </motion.div>
              )}

              {phase >= 2 && (
                <motion.div
                  key="card2"
                  className="absolute inset-4 rounded-xl overflow-hidden shadow-2xl bg-[rgba(22,18,32,0.97)] border border-white/10"
                  initial={{ scale: 0.9, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#48CAE4] to-[#4895EF] opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-20">
                    <div className="flex items-center gap-2">
                      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 32 }}>Isabella, 26</h2>
                      <span className="text-blue-400 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                    </div>
                    <p style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>📍 5 km away</p>
                    <p style={{ fontFamily: 'Inter', fontSize: 13, marginTop: 4 }}>Coffee addict & dog mom 🐶</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-center items-center gap-6 p-4 pt-0">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">✕</div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">⭐</div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(192,57,43,0.5)]">❤</div>
          </div>
        </div>
      </PhoneMockup>
    </motion.div>
  );
}
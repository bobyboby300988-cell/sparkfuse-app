import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000), // Comments start
      setTimeout(() => setPhase(2), 4000), // Open gift modal
      setTimeout(() => setPhase(3), 5000), // Send Lambo
      setTimeout(() => setPhase(4), 8500), // Exit
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
        <div className="relative flex flex-col h-full bg-[#0D0B12] text-white overflow-hidden">
          {/* Video Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] opacity-90" />
          
          {/* Top Bar */}
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

          {/* Floating Hearts */}
          <div className="absolute right-4 bottom-20 z-10 w-8 h-64 overflow-hidden pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div key={i} className="absolute bottom-0 text-xl"
                initial={{ y: 0, opacity: 1, x: Math.sin(i)*10 }}
                animate={{ y: -200, opacity: 0, x: Math.sin(i)*20 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {['❤️', '😍', '🔥', '💋'][i % 4]}
              </motion.div>
            ))}
          </div>

          <div className="mt-auto relative z-10 flex flex-col gap-2 p-4 pb-16">
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
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 z-20 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex-1 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white/50 border border-white/10 flex items-center">
              💬 Comment...
            </div>
            <motion.button className="bg-gradient-to-r from-[#C0392B] to-[#e74c3c] rounded-full px-4 py-2 text-xs font-bold shadow-[0_0_10px_rgba(192,57,43,0.5)]"
              animate={phase === 1 ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: Infinity }}
            >
              🎁 SEND GIFT
            </motion.button>
          </div>

          {/* Gift Modal */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div className="absolute bottom-0 left-0 right-0 bg-[rgba(22,18,32,0.98)] rounded-t-2xl p-4 border-t border-white/10 z-40"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              >
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/50 p-2 rounded-lg border-2 border-[#FFD700] text-center shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    <span className="text-3xl">🏎️</span>
                    <div className="text-xs font-bold mt-1 text-[#FFD700]">Lamborghini</div>
                    <div className="text-[10px] text-white/70">€30.00</div>
                  </div>
                  <div className="w-20 bg-black/50 p-2 rounded-lg border border-white/10 text-center flex flex-col items-center justify-center">
                    <span className="text-2xl">💎</span>
                    <span className="text-[10px] mt-1">€5.00</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LAMBO EXPLOSION OVERLAY */}
          {phase >= 3 && (
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <motion.div 
                initial={{ scale: 0, opacity: 0, rotate: -20 }} 
                animate={{ scale: [0, 1.5, 1.2], opacity: 1, rotate: 0 }} 
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="flex flex-col items-center"
              >
                <svg width="200" height="100" viewBox="0 0 200 100" className="drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">
                  <path d="M 20 80 Q 30 40 80 40 L 140 40 Q 180 50 180 80 Z" fill="#FFD700" />
                  <circle cx="50" cy="80" r="15" fill="#333" />
                  <circle cx="150" cy="80" r="15" fill="#333" />
                  <path d="M 60 40 L 120 40 L 100 60 L 50 60 Z" fill="rgba(0,0,0,0.5)" />
                </svg>
                <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: '#FFD700', textShadow: '0 0 20px #FFD700' }} className="mt-4">🏎️ LAMBORGHINI!</h1>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'white', background: '#C0392B', padding: '4px 16px', borderRadius: 20, marginTop: 8 }} className="shadow-[0_0_15px_rgba(192,57,43,1)]">
                  +3000 ST
                </div>
              </motion.div>
              {[...Array(30)].map((_, i) => (
                <motion.div key={i} className="absolute w-2 h-2 bg-[#FFD700] rounded-full"
                  initial={{ x: 0, y: 0 }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 400, 
                    y: (Math.random() - 0.5) * 400,
                    opacity: 0, scale: 0
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          )}

        </div>
      </PhoneMockup>
    </motion.div>
  );
}
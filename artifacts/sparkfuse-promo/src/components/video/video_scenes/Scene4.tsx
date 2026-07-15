import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2000), // Transition to chat
      setTimeout(() => setPhase(2), 3000), // Msg 1
      setTimeout(() => setPhase(3), 4000), // Msg 2
      setTimeout(() => setPhase(4), 5000), // Msg 3
      setTimeout(() => setPhase(5), 6000), // Open gift modal
      setTimeout(() => setPhase(6), 7000), // Send gift / Explosion
      setTimeout(() => setPhase(7), 7500), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center bg-[#0D0B12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 7 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {phase === 0 && (
          <motion.div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0B12]"
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(40px, 10vw, 80px)', background: 'linear-gradient(90deg, #FF6B9D, #C0392B)', WebkitBackgroundClip: 'text', color: 'transparent' }}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
            >
              💗 IT'S A MATCH! 💗
            </motion.h1>
            <div className="flex items-center justify-center my-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 -mr-4 border-4 border-[#0D0B12] z-10" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] border-4 border-[#0D0B12]" />
            </div>
            <p style={{ fontFamily: 'Inter', color: 'white', fontSize: 16 }}>You and Sofia like each other</p>
            <button className="mt-8 px-8 py-3 rounded-full text-white font-bold" style={{ background: 'linear-gradient(135deg, #C0392B, #e74c3c)' }}>
              SEND MESSAGE →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PhoneMockup scale={1.2}>
        <div className="flex flex-col h-full bg-[#0D0B12] text-white">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[rgba(22,18,32,0.97)]">
            <div className="flex items-center gap-2">
              <span>←</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B]" />
              <span style={{ fontFamily: 'Inter', fontWeight: 'bold' }}>Sofia ✓</span>
            </div>
            <div className="flex gap-4">
              <span>📞</span>
              <span>🎁</span>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-3 relative">
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div initial={{ opacity: 0, x: -20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} className="self-start bg-[rgba(22,18,32,0.97)] p-3 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10">
                  <p style={{ fontFamily: 'Inter', fontSize: 13 }}>Hey! I saw you liked me 😊</p>
                </motion.div>
              )}
              {phase >= 3 && (
                <motion.div initial={{ opacity: 0, x: 20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} className="self-end p-3 rounded-2xl rounded-tr-sm max-w-[80%]" style={{ background: 'linear-gradient(135deg, #C0392B, #e74c3c)' }}>
                  <p style={{ fontFamily: 'Inter', fontSize: 13 }}>You're stunning honestly 😍</p>
                </motion.div>
              )}
              {phase >= 4 && (
                <motion.div initial={{ opacity: 0, x: -20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} className="self-start bg-[rgba(22,18,32,0.97)] p-3 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10">
                  <p style={{ fontFamily: 'Inter', fontSize: 13 }}>Aww thank you! Want to video call later? 📹</p>
                </motion.div>
              )}
            </AnimatePresence>

            {phase >= 6 && (
              <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 1 }} className="absolute text-6xl">💎</motion.div>
                <div className="bg-black/80 px-4 py-2 rounded-full border border-[#F39C12] mt-20">
                  <span style={{ color: '#F39C12', fontSize: 12 }}>Sofia received your 💎 Diamond!</span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 bg-[rgba(22,18,32,0.97)] flex items-center gap-3">
            <span className="text-white/50">📎</span>
            <span className="text-white/50">📷</span>
            <div className="flex-1 bg-black/50 rounded-full h-8 px-4 flex items-center text-sm text-white/30 border border-white/10">Message...</div>
            <motion.span className="text-[#C0392B] text-xl"
              animate={phase === 5 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity }}
            >🎁</motion.span>
          </div>

          <AnimatePresence>
            {phase >= 5 && (
              <motion.div className="absolute bottom-0 left-0 right-0 bg-[rgba(22,18,32,0.98)] rounded-t-2xl p-4 border-t border-white/10 z-40"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              >
                <p className="text-center font-bold mb-4">Send a Gift to Sofia</p>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-black/50 p-2 rounded-lg border border-[#F39C12] text-center flex flex-col items-center">
                    <span className="text-2xl">💎</span>
                    <span className="text-xs font-bold mt-1">Diamond</span>
                    <span className="text-[10px] text-white/50">€5.00</span>
                  </div>
                  <div className="flex-1 bg-black/50 p-2 rounded-lg border border-white/10 text-center flex flex-col items-center">
                    <span className="text-2xl">🌹</span>
                    <span className="text-xs font-bold mt-1">Roses</span>
                    <span className="text-[10px] text-white/50">€0.10</span>
                  </div>
                </div>
                <motion.button className="w-full py-3 rounded-lg text-white font-bold" style={{ background: 'linear-gradient(135deg, #C0392B, #e74c3c)' }}
                  animate={{ scale: phase === 5 ? [1, 1.02, 1] : 1 }} transition={{ repeat: Infinity }}
                >
                  SEND GIFT — €5.00
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneMockup>
    </motion.div>
  );
}
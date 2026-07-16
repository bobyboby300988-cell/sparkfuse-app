import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1500),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 5200),
      setTimeout(() => setPhase(4), 6000),
      setTimeout(() => setPhase(5), 7200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (phase !== 2) return;
    const t = setInterval(() => setCallTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center bg-[#0D0B12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Match splash */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0B12]"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(40px,10vw,80px)', background: 'linear-gradient(90deg,#FF6B9D,#C0392B)', WebkitBackgroundClip: 'text', color: 'transparent' }}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
            >
              💗 IT'S A MATCH! 💗
            </motion.h1>
            <div className="flex items-center justify-center my-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 -mr-4 border-4 border-[#0D0B12] z-10" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] border-4 border-[#0D0B12]" />
            </div>
            <p style={{ fontFamily: 'Inter', color: 'white', fontSize: 16 }}>You and Sofia like each other</p>
            <button className="mt-8 px-8 py-3 rounded-full text-white font-bold" style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)' }}>
              VIDEO CALL 📹
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call Screen */}
      <AnimatePresence>
        {(phase === 1 || phase === 2) && (
          <motion.div className="absolute inset-0 z-40 flex flex-col"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ background: '#0a0710' }}
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] to-[#2d0b3d]" />
              <motion.div className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.01, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] flex items-center justify-center shadow-[0_0_40px_rgba(255,107,157,0.4)]">
                  <span style={{ fontSize: 64 }}>👩</span>
                </div>
              </motion.div>
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
                <span style={{ fontFamily: 'Inter', fontWeight: 700, color: '#fff', fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Sofia ✓</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
                  <span style={{ fontFamily: 'Inter', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{formatTimer(callTimer)}</span>
                </div>
              </div>
              {phase === 2 && [0, 1, 2].map(i => (
                <motion.div key={i} className="absolute text-2xl pointer-events-none"
                  style={{ left: `${20 + i * 30}%`, bottom: 60 }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -80 }}
                  transition={{ duration: 2, delay: i * 0.7, repeat: Infinity, repeatDelay: 1.5 }}
                >
                  💕
                </motion.div>
              ))}
            </div>

            <motion.div
              className="absolute top-4 right-4 w-20 h-28 rounded-xl overflow-hidden border-2 border-[#C0392B] shadow-xl"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                <span style={{ fontSize: 28 }}>🙂</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-8 pt-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur">
                <span style={{ fontSize: 20 }}>🔇</span>
              </div>
              <motion.div className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(231,76,60,0.7)]"
                style={{ background: 'linear-gradient(135deg,#e74c3c,#C0392B)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span style={{ fontSize: 24 }}>📵</span>
              </motion.div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur">
                <span style={{ fontSize: 20 }}>🔄</span>
              </div>
            </motion.div>

            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur">
              <div className="w-2 h-2 rounded-full bg-[#e74c3c]" />
              <span style={{ fontFamily: 'Inter', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>VIDEO CALL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat phone (phases 3+) */}
      {phase >= 3 && (
        <motion.div className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <PhoneMockup scale={1.2}>
            <div className="flex flex-col h-full bg-[#0D0B12] text-white">
              <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[rgba(22,18,32,0.97)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs">←</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B]" />
                  <div>
                    <div style={{ fontFamily: 'Inter', fontWeight: 'bold', fontSize: 12 }}>Sofia ✓</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Online now</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span style={{ fontSize: 16 }}>📞</span>
                  <span style={{ fontSize: 16 }}>📹</span>
                  <span style={{ fontSize: 16 }}>😊</span>
                </div>
              </div>

              <div className="flex-1 p-3 flex flex-col gap-2 relative overflow-hidden">
                <AnimatePresence>
                  {phase >= 4 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="self-start bg-[rgba(22,18,32,0.97)] p-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10">
                      <p style={{ fontFamily: 'Inter', fontSize: 11 }}>That video call was amazing 😍 let's chat!</p>
                    </motion.div>
                  )}
                  {phase >= 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="self-end p-2.5 rounded-2xl rounded-tr-sm max-w-[80%]" style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)', fontSize: 11 }}>
                      <p style={{ fontFamily: 'Inter', fontSize: 11 }}>You're gorgeous 💕 can't wait to meet you!</p>
                    </motion.div>
                  )}
                  {phase >= 5 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="self-start bg-[rgba(22,18,32,0.97)] p-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10">
                      <p style={{ fontFamily: 'Inter', fontSize: 11 }}>Me too! Coffee this weekend? ☕</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-2.5 border-t border-white/10 bg-[rgba(22,18,32,0.97)] flex items-center gap-2">
                <span className="text-white/50 text-sm">📎</span>
                <span className="text-white/50 text-sm">📷</span>
                <div className="flex-1 bg-black/50 rounded-full h-7 px-3 flex items-center text-xs text-white/30 border border-white/10">Message...</div>
                <motion.span className="text-[#FF6B9D]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >😊</motion.span>
              </div>
            </div>
          </PhoneMockup>
        </motion.div>
      )}
    </motion.div>
  );
}

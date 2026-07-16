import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),   // match → call
      setTimeout(() => setPhase(2), 1500),  // call active
      setTimeout(() => setPhase(3), 3500),  // call ends
      setTimeout(() => setPhase(4), 4200),  // messages appear
      setTimeout(() => setPhase(5), 5200),  // gift tray
      setTimeout(() => setPhase(6), 5900),  // diamond sent
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
    >
      {/* Match splash */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0B12]"
            exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.4 }}
          >
            <motion.h1
              style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(40px,10vw,80px)', background: 'linear-gradient(90deg,#FF6B9D,#C0392B)', WebkitBackgroundClip: 'text', color: 'transparent' }}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
            >
              💗 IT'S A MATCH! 💗
            </motion.h1>
            <div className="flex items-center justify-center my-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 -mr-4 border-4 border-[#0D0B12] z-10" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] border-4 border-[#0D0B12]" />
            </div>
            <p style={{ fontFamily: 'Inter', color: 'white', fontSize: 15 }}>You and Sofia like each other</p>
            <button className="mt-6 px-8 py-3 rounded-full text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)' }}>
              VIDEO CALL 📹
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call */}
      <AnimatePresence>
        {(phase === 1 || phase === 2) && (
          <motion.div className="absolute inset-0 z-40 flex flex-col"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} style={{ background: '#0a0710' }}
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] to-[#2d0b3d]" />
              <motion.div className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.01, 1] }} transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] flex items-center justify-center shadow-[0_0_40px_rgba(255,107,157,0.4)]">
                  <span style={{ fontSize: 56 }}>👩</span>
                </div>
              </motion.div>
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
                <span style={{ fontFamily: 'Inter', fontWeight: 700, color: '#fff', fontSize: 16 }}>Sofia ✓</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{formatTimer(callTimer)}</span>
                </div>
              </div>
              {phase === 2 && [0, 1, 2].map(i => (
                <motion.div key={i} className="absolute text-xl pointer-events-none"
                  style={{ left: `${20 + i * 30}%`, bottom: 60 }}
                  initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -70 }}
                  transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, repeatDelay: 1 }}
                >💕</motion.div>
              ))}
            </div>
            <motion.div className="absolute top-4 right-4 w-18 h-24 rounded-xl overflow-hidden border-2 border-[#C0392B] shadow-xl"
              style={{ width: 72, height: 96 }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                <span style={{ fontSize: 24 }}>🙂</span>
              </div>
            </motion.div>
            <motion.div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-6 pt-4"
              style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85),transparent)' }}
              initial={{ y: 50 }} animate={{ y: 0 }} transition={{ delay: 0.3 }}
            >
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center border border-white/20"><span style={{ fontSize: 18 }}>🔇</span></div>
              <motion.div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e74c3c,#C0392B)' }}
                animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              ><span style={{ fontSize: 22 }}>📵</span></motion.div>
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center border border-white/20"><span style={{ fontSize: 18 }}>🔄</span></div>
            </motion.div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#e74c3c]" />
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>VIDEO CALL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat */}
      {phase >= 3 && (
        <motion.div className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          <PhoneMockup scale={1.2}>
            <div className="flex flex-col h-full bg-[#0D0B12] text-white">
              <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[rgba(22,18,32,0.97)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs">←</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B]" />
                  <div>
                    <div style={{ fontFamily: 'Inter', fontWeight: 'bold', fontSize: 12 }}>Sofia ✓</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Online now</div>
                  </div>
                </div>
                <div className="flex gap-3 text-base">📞 📹 🎁</div>
              </div>

              <div className="flex-1 p-3 flex flex-col gap-2 relative overflow-hidden">
                {phase >= 4 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="self-start bg-[rgba(22,18,32,0.97)] p-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10"
                  >
                    <p style={{ fontSize: 11 }}>That video call was amazing 😍</p>
                  </motion.div>
                )}
                {phase >= 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                    className="self-end p-2.5 rounded-2xl rounded-tr-sm max-w-[80%]"
                    style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)' }}
                  >
                    <p style={{ fontSize: 11 }}>You're gorgeous 💕 sending you a gift!</p>
                  </motion.div>
                )}

                {/* Diamond explosion */}
                {phase >= 6 && (
                  <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [0, 1.7, 1.3], rotate: [0, 8, 0] }}
                      transition={{ type: 'spring', damping: 10, stiffness: 130 }}
                      style={{ fontSize: 80, filter: 'drop-shadow(0 0 28px #a78bfa)' }}
                    >💎</motion.div>
                    {[...Array(14)].map((_, i) => (
                      <motion.div key={i} className="absolute" style={{ fontSize: 16, top: '50%', left: '50%' }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos((i / 14) * Math.PI * 2) * 90,
                          y: Math.sin((i / 14) * Math.PI * 2) * 90,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      >✨</motion.div>
                    ))}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                      className="mt-4 bg-black/80 px-5 py-2 rounded-full border border-[#a78bfa]"
                    >
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: '#a78bfa', letterSpacing: '0.1em' }}>
                        💎 DIAMOND SENT TO SOFIA
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Gift tray */}
              <AnimatePresence>
                {phase === 5 && (
                  <motion.div className="absolute bottom-0 left-0 right-0 bg-[rgba(22,18,32,0.98)] rounded-t-2xl p-3 border-t border-white/10 z-40"
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                  >
                    <p className="text-center font-bold text-sm mb-2">Send a Gift to Sofia</p>
                    <div className="flex gap-2 mb-2">
                      {[
                        { icon: '💎', name: 'Diamond', color: '#a78bfa' },
                        { icon: '🌹', name: 'Rose', color: '#FF6B9D' },
                        { icon: '💋', name: 'Kiss', color: '#e74c3c' },
                        { icon: '⌚', name: 'Watch', color: '#F39C12' },
                      ].map(({ icon, name, color }) => (
                        <div key={name} className="flex-1 bg-black/50 p-2 rounded-lg border border-white/10 text-center">
                          <span style={{ fontSize: 20 }}>{icon}</span>
                          <div style={{ fontSize: 9, fontWeight: 'bold', marginTop: 2, color }}>{name}</div>
                        </div>
                      ))}
                    </div>
                    <motion.button className="w-full py-2 rounded-lg text-white text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)' }}
                      animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity }}
                    >SEND GIFT 💎</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-2.5 border-t border-white/10 bg-[rgba(22,18,32,0.97)] flex items-center gap-2">
                <span className="text-white/50 text-sm">📎</span>
                <span className="text-white/50 text-sm">📷</span>
                <div className="flex-1 bg-black/50 rounded-full h-7 px-3 flex items-center text-xs text-white/30 border border-white/10">Message...</div>
                <motion.span className="text-[#C0392B]"
                  animate={phase === 4 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity }}
                >🎁</motion.span>
              </div>
            </div>
          </PhoneMockup>
        </motion.div>
      )}
    </motion.div>
  );
}

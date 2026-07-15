import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1500),  // transition to video call
      setTimeout(() => setPhase(2), 2200),  // video call active
      setTimeout(() => setPhase(3), 5200),  // end call / back to chat
      setTimeout(() => setPhase(4), 6000),  // messages appear
      setTimeout(() => setPhase(5), 6800),  // gift modal
      setTimeout(() => setPhase(6), 7400),  // gift sent
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
            {/* Sofia — main video (full screen) */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] to-[#2d0b3d]" />
              {/* Sofia avatar */}
              <motion.div className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.01, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] flex items-center justify-center shadow-[0_0_40px_rgba(255,107,157,0.4)]">
                  <span style={{ fontSize: 64 }}>👩</span>
                </div>
              </motion.div>
              {/* Name + timer */}
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
                <span style={{ fontFamily: 'Inter', fontWeight: 700, color: '#fff', fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Sofia ✓</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
                  <span style={{ fontFamily: 'Inter', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{formatTimer(callTimer)}</span>
                </div>
              </div>
              {/* Floating hearts */}
              {phase === 2 && [0,1,2].map(i => (
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

            {/* Self PiP (small) */}
            <motion.div
              className="absolute top-4 right-4 w-20 h-28 rounded-xl overflow-hidden border-2 border-[#C0392B] shadow-xl"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                <span style={{ fontSize: 28 }}>🙂</span>
              </div>
            </motion.div>

            {/* Call controls */}
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

            {/* "VIDEO CALL" label top */}
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
              {/* Header */}
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
                  <span style={{ fontSize: 16 }}>🎁</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-3 flex flex-col gap-2 relative overflow-hidden">
                <AnimatePresence>
                  {phase >= 4 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="self-start bg-[rgba(22,18,32,0.97)] p-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10">
                      <p style={{ fontFamily: 'Inter', fontSize: 11 }}>That video call was 😍 let's chat!</p>
                    </motion.div>
                  )}
                  {phase >= 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="self-end p-2.5 rounded-2xl rounded-tr-sm max-w-[80%]" style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)', fontSize: 11 }}>
                      <p style={{ fontFamily: 'Inter', fontSize: 11 }}>You're gorgeous 💕 sending you a gift!</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Gift explosion */}
                {phase >= 6 && (
                  <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 1 }} className="absolute text-6xl">💎</motion.div>
                    <div className="bg-black/80 px-4 py-2 rounded-full border border-[#F39C12] mt-24">
                      <span style={{ color: '#F39C12', fontSize: 11 }}>Sofia received 💎 Diamond!</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input bar */}
              <div className="p-2.5 border-t border-white/10 bg-[rgba(22,18,32,0.97)] flex items-center gap-2">
                <span className="text-white/50 text-sm">📎</span>
                <span className="text-white/50 text-sm">📷</span>
                <div className="flex-1 bg-black/50 rounded-full h-7 px-3 flex items-center text-xs text-white/30 border border-white/10">Message...</div>
                <motion.span className="text-[#C0392B]"
                  animate={phase === 5 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity }}
                >🎁</motion.span>
              </div>

              {/* Gift modal */}
              <AnimatePresence>
                {phase >= 5 && (
                  <motion.div className="absolute bottom-0 left-0 right-0 bg-[rgba(22,18,32,0.98)] rounded-t-2xl p-3 border-t border-white/10 z-40"
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                  >
                    <p className="text-center font-bold text-sm mb-3">Send a Gift to Sofia</p>
                    <div className="flex gap-2 mb-3">
                      {[['💎','Diamond','€5.00','#F39C12'],['🌹','Roses','€0.10','white'],['🏎️','Lambo','€50','#F39C12']].map(([icon,name,price,color]) => (
                        <div key={name} className="flex-1 bg-black/50 p-2 rounded-lg border border-white/10 text-center flex flex-col items-center">
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <span style={{ fontSize: 9, fontWeight: 'bold', marginTop: 2, color }}>{name}</span>
                          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{price}</span>
                        </div>
                      ))}
                    </div>
                    <motion.button className="w-full py-2.5 rounded-lg text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg,#C0392B,#e74c3c)' }}
                      animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity }}
                    >
                      SEND GIFT — €5.00
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </PhoneMockup>
        </motion.div>
      )}
    </motion.div>
  );
}

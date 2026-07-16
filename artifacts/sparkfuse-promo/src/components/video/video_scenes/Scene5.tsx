import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

const GIFTS = [
  { icon: '🏎️', label: 'Ferrari', color: '#FFD700', glow: 'rgba(255,215,0,0.8)' },
  { icon: '💎', label: 'Diamond', color: '#a78bfa', glow: 'rgba(167,139,250,0.8)' },
  { icon: '⌚', label: 'Watch',   color: '#F39C12', glow: 'rgba(243,156,18,0.8)' },
];

export function Scene5() {
  const [phase, setPhase] = useState(0);
  const [giftIdx, setGiftIdx] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),   // comments start
      setTimeout(() => setPhase(2), 3500),  // gift tray
      setTimeout(() => setPhase(3), 4500),  // gift explosion
      setTimeout(() => setPhase(4), 6200),  // next gift
      setTimeout(() => setPhase(5), 7200),  // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Cycle gifts during explosion
  useEffect(() => {
    if (phase !== 3 && phase !== 4) return;
    const t = setInterval(() => setGiftIdx(i => (i + 1) % GIFTS.length), 900);
    return () => clearInterval(t);
  }, [phase]);

  const gift = GIFTS[giftIdx % GIFTS.length];

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center bg-[#0D0B12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 5 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PhoneMockup scale={1.2}>
        <div className="relative flex flex-col h-full bg-[#0D0B12] text-white overflow-hidden">

          {/* Live stream background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] opacity-90" />

          {/* Top bar */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#C0392B] px-2 py-0.5 rounded text-xs font-bold">● LIVE</div>
              <div className="bg-black/40 px-2 py-0.5 rounded text-xs backdrop-blur-sm">👁 2,341 viewers</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-sm">✕</div>
          </div>

          <div className="relative z-10 px-4 mt-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-lg drop-shadow-md">Sofia 🔥</h2>
              <span className="text-blue-400 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
            </div>
            <div className="bg-black/40 inline-block px-2 py-0.5 rounded-full text-[10px]">🔥 Dating</div>
          </div>

          {/* Floating hearts */}
          <div className="absolute right-4 bottom-20 z-10 w-8 h-64 overflow-hidden pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div key={i} className="absolute bottom-0 text-xl"
                style={{ left: Math.sin(i) * 10 }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -200, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {['❤️', '😍', '🔥', '💋'][i % 4]}
              </motion.div>
            ))}
          </div>

          {/* Chat comments */}
          <div className="mt-auto relative z-10 flex flex-col gap-1.5 p-3 pb-16">
            <AnimatePresence>
              {phase >= 1 && (
                <>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10">
                    <span className="font-bold text-[#F39C12]">Alex:</span> she's amazing 😍
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10">
                    <span className="font-bold text-[#48CAE4]">Marco:</span> 🔥🔥🔥
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="text-xs bg-black/30 backdrop-blur-sm p-2 rounded-lg max-w-[80%] border border-white/10">
                    <span className="font-bold text-[#27ae60]">Jin:</span> first time here, love it!
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 z-20 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex-1 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white/50 border border-white/10">💬 Comment...</div>
            <motion.button className="bg-gradient-to-r from-[#C0392B] to-[#e74c3c] rounded-full px-4 py-2 text-xs font-bold shadow-[0_0_10px_rgba(192,57,43,0.5)]"
              animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
            >🎁 GIFT</motion.button>
          </div>

          {/* Gift tray */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div className="absolute bottom-0 left-0 right-0 bg-[rgba(22,18,32,0.98)] rounded-t-2xl p-3 border-t border-white/10 z-40"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              >
                <p className="text-center text-sm font-bold mb-2">Send a Gift</p>
                <div className="flex gap-2">
                  {GIFTS.map(({ icon, label, color }) => (
                    <div key={label} className="flex-1 bg-black/50 p-2 rounded-xl border-2 border-white/20 text-center">
                      <div style={{ fontSize: 28 }}>{icon}</div>
                      <div style={{ fontSize: 10, color, fontWeight: 'bold', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gift explosion overlay — NO prices, NO points */}
          {(phase === 3 || phase === 4) && (
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={giftIdx}
                  initial={{ scale: 0, opacity: 0, rotate: -15 }}
                  animate={{ scale: [0, 1.5, 1.2], opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 120 }}
                  className="flex flex-col items-center"
                >
                  {gift.icon === '🏎️' ? (
                    <>
                      <svg width="180" height="90" viewBox="0 0 200 100"
                        style={{ filter: `drop-shadow(0 0 28px ${gift.glow})` }}
                      >
                        <path d="M 20 80 Q 30 40 80 40 L 140 40 Q 180 50 180 80 Z" fill={gift.color} />
                        <circle cx="50" cy="80" r="14" fill="#333" />
                        <circle cx="150" cy="80" r="14" fill="#333" />
                        <path d="M 60 40 L 120 40 L 100 60 L 50 60 Z" fill="rgba(0,0,0,0.4)" />
                      </svg>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, color: gift.color, textShadow: `0 0 20px ${gift.glow}`, marginTop: 8 }}>
                        🏎️ FERRARI!
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 90, filter: `drop-shadow(0 0 28px ${gift.glow})` }}>{gift.icon}</div>
                  )}
                  <motion.div
                    style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: gift.color, letterSpacing: '0.1em', marginTop: 8 }}
                    animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    {gift.label.toUpperCase()} SENT!
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Particle burst */}
              {[...Array(20)].map((_, i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ width: 6, height: 6, background: gift.color, top: '50%', left: '50%' }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 20) * Math.PI * 2) * (60 + Math.random() * 80),
                    y: Math.sin((i / 20) * Math.PI * 2) * (60 + Math.random() * 80),
                    opacity: 0,
                  }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </PhoneMockup>
    </motion.div>
  );
}

import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => `€${v.toFixed(2)}`);

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setPhase(1);
        animate(count, 127.50, { duration: 2, ease: "easeOut" });
      }, 500),
      setTimeout(() => setPhase(2), 3500), // Click withdraw
      setTimeout(() => setPhase(3), 4500), // Processing / Success
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
        <div className="flex flex-col h-full bg-[#0D0B12] text-white p-4 relative">
          
          <AnimatePresence>
            {phase < 3 && (
              <motion.div exit={{ opacity: 0, scale: 0.9 }} className="h-full flex flex-col">
                <div className="text-center mt-4">
                  <h1 style={{ fontFamily: 'Inter', fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>💰 Your Earnings</h1>
                  <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 64, color: '#27ae60', textShadow: '0 0 20px rgba(39,174,96,0.3)', marginTop: 8 }}>
                    {displayCount}
                  </motion.div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-8">
                  <div className="bg-[rgba(22,18,32,0.97)] p-2 rounded-lg border border-white/10 text-center">
                    <div className="text-[10px] text-white/50">Gifts</div>
                    <div className="font-bold text-[#F39C12]">48</div>
                  </div>
                  <div className="bg-[rgba(22,18,32,0.97)] p-2 rounded-lg border border-white/10 text-center">
                    <div className="text-[10px] text-white/50">Msgs</div>
                    <div className="font-bold text-[#48CAE4]">234</div>
                  </div>
                  <div className="bg-[rgba(22,18,32,0.97)] p-2 rounded-lg border border-white/10 text-center">
                    <div className="text-[10px] text-white/50">Fans</div>
                    <div className="font-bold text-[#FF6B9D]">1,204</div>
                  </div>
                </div>

                <div className="mt-6 bg-[rgba(22,18,32,0.97)] rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-3 border-b border-white/10 flex justify-between text-sm">
                    <span className="text-white/70">🎁 Gift income</span>
                    <span className="font-bold">€98.20</span>
                  </div>
                  <div className="p-3 flex justify-between text-sm">
                    <span className="text-white/70">💬 Message tips</span>
                    <span className="font-bold">€29.30</span>
                  </div>
                </div>

                <div className="mt-auto mb-4 space-y-4">
                  <motion.button className="w-full py-3 rounded-lg text-lg font-bold text-white tracking-wider shadow-[0_0_15px_rgba(192,57,43,0.4)]"
                    style={{ fontFamily: 'Bebas Neue', background: 'linear-gradient(135deg, #C0392B, #e74c3c)' }}
                    animate={phase === 1 ? { scale: [1, 1.02, 1] } : { scale: phase === 2 ? 0.95 : 1 }}
                    transition={{ repeat: phase === 1 ? Infinity : 0 }}
                  >
                    WITHDRAW NOW
                  </motion.button>
                  
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded-full bg-[#27ae60] flex items-center justify-center text-[8px]">✓</div>
                      <span>Bank card transfer (available)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-50">
                      <div className="w-4 h-4 rounded-full border border-white/50 flex items-center justify-center"></div>
                      <span>Crypto</span>
                      <span className="bg-[#9b59b6] px-1.5 py-0.5 rounded text-[8px] ml-auto">COMING SOON</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {phase >= 3 && (
              <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-[#0D0B12] flex flex-col items-center justify-center p-6 text-center z-50">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-20 h-20 bg-gradient-to-br from-[#27ae60] to-[#2ecc71] rounded-full flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(39,174,96,0.5)] mb-6">
                  ✓
                </motion.div>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: '0.05em' }}>TRANSFER COMPLETE</h2>
                <p className="text-[#27ae60] font-bold text-3xl my-4">€114.75</p>
                <p className="text-xs text-white/50">Sent to Visa ending in 4242</p>
                <p className="text-[10px] text-white/30 mt-2">After 10% platform fee</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </PhoneMockup>
    </motion.div>
  );
}
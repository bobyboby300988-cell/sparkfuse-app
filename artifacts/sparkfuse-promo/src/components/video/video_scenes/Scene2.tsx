import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 4500),
      setTimeout(() => setPhase(6), 5500),
      setTimeout(() => setPhase(7), 7500),
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
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <PhoneMockup scale={1.2}>
          <div className="flex flex-col h-full bg-[#0D0B12] text-white p-4">
            <motion.div className="text-center mt-6"
              initial={{ opacity: 0, y: -20 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            >
              <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: '0.05em' }}>🔒 UNLOCK SPARKFUSE</h1>
              <p style={{ fontFamily: 'Inter', color: '#F39C12', fontSize: 14, fontWeight: 600, marginTop: 4 }}>Adult Premium · €2 / month</p>
            </motion.div>

            <motion.div className="flex justify-center my-6"
              initial={{ scale: 0 }}
              animate={phase >= 2 ? { scale: 1 } : { scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="w-24 h-24 rounded-full bg-[rgba(22,18,32,0.97)] border-2 border-[#F39C12] flex items-center justify-center shadow-[0_0_20px_rgba(243,156,18,0.3)]">
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 48 }}>€2</span>
              </div>
            </motion.div>

            <div className="flex flex-col gap-3 px-2">
              {[
                "Unlimited swipes & matches",
                "Chat with all your matches",
                "Send & receive gifts",
                "Video calls & live streams",
                "No ads, ever"
              ].map((perk, i) => (
                <motion.div key={i} className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={phase >= 3 + (i*0.2) ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                >
                  <div className="w-5 h-5 rounded-full bg-[#27ae60] flex items-center justify-center text-xs">✓</div>
                  <span style={{ fontFamily: 'Inter', fontSize: 13 }}>{perk}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto mb-4 space-y-4">
              <motion.div className="flex gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              >
                <div className="flex-1 bg-[rgba(22,18,32,0.97)] border border-white/10 rounded-lg p-2 text-center text-xs">💳 Card</div>
                <div className="flex-1 bg-[rgba(22,18,32,0.97)] border border-white/10 rounded-lg p-2 text-center text-xs">🅿️ PayPal</div>
              </motion.div>

              <motion.button className="w-full py-3 rounded-lg text-lg font-bold text-white tracking-wider"
                style={{ fontFamily: 'Bebas Neue', background: 'linear-gradient(135deg, #C0392B, #e74c3c)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={phase >= 6 ? { opacity: 1, y: 0, scale: [1, 1.02, 1] } : { opacity: 0, y: 20 }}
                transition={phase >= 6 ? { scale: { repeat: Infinity, duration: 1.5 } } : undefined}
              >
                SUBSCRIBE — €2/MONTH
              </motion.button>
              <p className="text-center text-[10px] text-white/40">🔒 Secure · SSL encrypted · Cancel anytime</p>
            </div>
          </div>
        </PhoneMockup>
      </motion.div>
    </motion.div>
  );
}
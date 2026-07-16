import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D0B12] overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(192,57,43,0.2) 0%, transparent 70%)' }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Logo */}
      <motion.div className="relative z-10 text-center mb-8"
        initial={{ y: -30, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
      >
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(44px,9vw,80px)', letterSpacing: '0.05em', color: '#fff', lineHeight: 1 }}>
          SPARK<span style={{ color: '#FF6B9D' }}>FUSE</span>
        </div>
        <div style={{ fontFamily: 'Inter', color: '#F39C12', letterSpacing: '0.2em', fontSize: '0.85rem', fontWeight: 600, marginTop: 6 }}>
          WHERE REAL CONNECTIONS HAPPEN
        </div>
      </motion.div>

      {/* Store buttons */}
      <motion.div className="flex flex-col gap-3 mb-8 relative z-10 w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      >
        <div className="flex gap-3">
          <div className="flex-1 bg-[rgba(22,18,32,0.97)] border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="text-xl">🍎</span>
            <div className="text-left">
              <div className="text-[9px] text-white/50">Download on the</div>
              <div className="text-sm font-bold">App Store</div>
            </div>
          </div>
          <div className="flex-1 bg-[rgba(22,18,32,0.97)] border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="text-xl">▶️</span>
            <div className="text-left">
              <div className="text-[9px] text-white/50">GET IT ON</div>
              <div className="text-sm font-bold">Google Play</div>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(22,18,32,0.97)] border border-[#C0392B] px-4 py-3 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(192,57,43,0.3)]">
          <span className="text-xl">🌐</span>
          <div className="text-left">
            <div className="text-[9px] text-[#FF6B9D]">OPEN IN BROWSER</div>
            <div className="text-sm font-bold">Web App — No Download Needed</div>
          </div>
        </div>
      </motion.div>

      {/* URL */}
      <motion.div className="relative z-10 bg-black/50 border border-[#F39C12] px-6 py-3 rounded-2xl mb-8 overflow-hidden w-full"
        initial={{ y: 30, opacity: 0 }}
        animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          animate={{ translateX: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <div style={{ fontFamily: 'Inter', fontSize: 'clamp(14px,4vw,22px)', color: '#F39C12', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'center' }}>
          match-maker-2025ap.replit.app
        </div>
      </motion.div>

      {/* Badge + tagline */}
      <motion.div className="flex flex-col items-center gap-2 relative z-10"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
      >
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <span className="bg-[#C0392B] text-white px-2 py-0.5 rounded text-xs font-bold shadow-[0_0_10px_rgba(192,57,43,0.5)]">18+</span>
          Adult Content · 18 and over only
        </div>
        <motion.div className="mt-6 text-2xl font-bold tracking-[0.3em] text-white/80" style={{ fontFamily: 'Bebas Neue' }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SWIPE · MATCH · CONNECT
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

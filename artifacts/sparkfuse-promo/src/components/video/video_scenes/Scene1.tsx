import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 4500), // begin exit
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
      <motion.div className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(192,57,43,0.3) 0%, transparent 60%)' }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1
          }}
          animate={{
            y: [0, -40, 0],
          }}
          transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="text-center relative z-10 flex flex-col items-center">
        <motion.div className="relative inline-block"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.8, opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(60px, 12vw, 120px)', letterSpacing: '0.05em', color: '#fff', lineHeight: 1 }}>
            SPARK<span style={{ color: '#FF6B9D' }}>FUSE</span>
          </div>
          <motion.div className="absolute -top-4 -right-10 bg-[#C0392B] text-white px-2 py-0.5 rounded text-lg font-bold shadow-[0_0_15px_rgba(192,57,43,0.8)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            18+
          </motion.div>
        </motion.div>

        <motion.div className="mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6 }}
        >
          <span style={{ fontFamily: 'Inter', color: '#F39C12', letterSpacing: '0.2em', fontSize: '1.2rem', fontWeight: 600 }}>
            THE DATING APP THAT PAYS YOU
          </span>
        </motion.div>

        <div className="flex justify-center gap-4 mt-16">
          {['💳 €2/month', '💰 Earn Real Cash', '📱 App & Web'].map((text, i) => (
            <motion.div key={text}
              className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white text-sm font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {text}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
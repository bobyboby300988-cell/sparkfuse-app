import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PhoneMockup } from '../PhoneMockup';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 7500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const stats = [
    { label: 'Profile Views', value: '1,284', icon: '👁', color: '#48CAE4', delay: 0 },
    { label: 'Likes Received', value: '342', icon: '❤️', color: '#FF6B9D', delay: 0.1 },
    { label: 'Matches', value: '47', icon: '💗', color: '#27ae60', delay: 0.2 },
  ];

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center bg-[#0D0B12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 4 ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PhoneMockup scale={1.2}>
        <div className="flex flex-col h-full bg-[#0D0B12] text-white p-4">

          <div className="text-center mt-2 mb-3">
            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: '0.05em' }}>👤 Your Profile</h1>
          </div>

          {/* Avatar */}
          <motion.div className="flex justify-center mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C0392B] flex items-center justify-center shadow-[0_0_30px_rgba(192,57,43,0.4)]">
                <span style={{ fontSize: 38 }}>👩</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#27ae60] rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#0D0B12] text-xs">✓</div>
            </div>
          </motion.div>

          <motion.div className="text-center mb-2"
            initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          >
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22 }}>Sofia, 24</div>
            <div className="flex justify-center items-center gap-1 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
              <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Active now · Barcelona</span>
            </div>
          </motion.div>

          {/* Fire badge */}
          <motion.div className="flex justify-center mb-3"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
          >
            <div className="bg-gradient-to-r from-[#C0392B] to-[#e74c3c] px-4 py-1 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(192,57,43,0.4)]">
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: '0.1em' }}>YOUR PROFILE IS ON FIRE</span>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {stats.map(({ label, value, icon, color, delay }) => (
              <motion.div key={label}
                className="bg-[rgba(22,18,32,0.97)] p-2.5 rounded-xl border border-white/10 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color }}>{value}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>{label}</div>
              </motion.div>
            ))}
          </div>

          {/* New today */}
          <motion.div className="bg-[rgba(22,18,32,0.97)] rounded-xl border border-white/10 p-3 mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>New likes today</span>
              <div className="flex items-center gap-1">
                <motion.span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#27ae60' }}
                  animate={phase >= 2 ? { opacity: [0, 1], scale: [0.5, 1] } : {}}
                  transition={{ delay: 0.5, type: 'spring' }}
                >+23</motion.span>
                <span style={{ fontSize: 14 }}>💗</span>
              </div>
            </div>
          </motion.div>

          {/* Boost button */}
          <motion.div className="mt-auto mb-1"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          >
            <motion.button className="w-full py-3 rounded-xl text-white tracking-wider shadow-[0_0_20px_rgba(192,57,43,0.4)]"
              style={{ fontFamily: 'Bebas Neue', fontSize: 18, background: 'linear-gradient(135deg,#C0392B,#e74c3c)' }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🚀 BOOST MY PROFILE
            </motion.button>
          </motion.div>

        </div>
      </PhoneMockup>
    </motion.div>
  );
}

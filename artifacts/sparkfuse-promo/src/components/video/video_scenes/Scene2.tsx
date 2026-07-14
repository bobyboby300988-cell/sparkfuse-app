import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0D0B12 0%, #1a0a0a 60%, #0D0B12 100%)' }}
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* BG glow */}
      <motion.div className="absolute" style={{
        top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '80%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(192,57,43,0.25) 0%, transparent 70%)',
        filter: 'blur(24px)',
      }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Step tag */}
      <motion.div className="absolute" style={{ top: '7%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(192,57,43,0.18)', borderRadius: 40, padding: '5px 14px',
          border: '1px solid rgba(192,57,43,0.4)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6V12C4 16.418 7.582 20.418 12 22C16.418 20.418 20 16.418 20 12V6L12 2Z" fill="#C0392B" opacity="0.9"/>
            <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#F39C12', letterSpacing: '0.15em', fontWeight: 600 }}>
            STEP 1 — VERIFY
          </span>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div style={{
        width: '84%', background: 'rgba(26,22,37,0.95)', borderRadius: 22, padding: '24px 20px',
        border: '1px solid rgba(192,57,43,0.3)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)', position: 'relative', zIndex: 10,
      }}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.1 }}
      >
        {/* Gold shimmer */}
        <motion.div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 2,
          background: 'linear-gradient(90deg, transparent, #F39C12, transparent)', borderRadius: 2,
        }}
          initial={{ scaleX: 0 }}
          animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.5 }}
        />

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <motion.p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', marginBottom: 6 }}
            initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.4 }}
          >ONE-TIME VERIFICATION FEE</motion.p>
          <motion.div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(52px, 13vw, 72px)', color: '#fff', lineHeight: 1 }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          >
            <span style={{ color: '#F39C12' }}>€</span>2
          </motion.div>
          <motion.p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          >Unlock full access to SparkFuse</motion.p>
        </div>

        {/* Payment methods */}
        <motion.div style={{ display: 'flex', gap: 10 }}
          initial={{ opacity: 0, y: 18 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 10px',
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
          }}>
            <svg width="26" height="20" viewBox="0 0 28 22" fill="none">
              <rect x="1" y="1" width="26" height="20" rx="4" stroke="white" strokeOpacity="0.6" strokeWidth="1.5"/>
              <rect x="1" y="6" width="26" height="4" fill="white" fillOpacity="0.25"/>
              <rect x="5" y="13" width="8" height="2" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="20" y="13" width="4" height="2" rx="1" fill="#F39C12" fillOpacity="0.8"/>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Credit Card</span>
          </div>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 10px',
            border: '1px solid rgba(243,156,18,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
          }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <text x="1" y="19" fontFamily="Arial" fontWeight="bold" fontSize="15" fill="#009cde">P</text>
              <text x="10" y="19" fontFamily="Arial" fontWeight="bold" fontSize="15" fill="#012069">P</text>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>PayPal</span>
          </div>
        </motion.div>

        {/* Join button */}
        <motion.div style={{
          marginTop: 16, borderRadius: 12, padding: '12px 0',
          background: 'linear-gradient(90deg, #C0392B, #e74c3c)', textAlign: 'center',
        }}
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.45 }}
        >
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: '#fff', letterSpacing: '0.12em' }}>
            VERIFY &amp; JOIN
          </span>
        </motion.div>
      </motion.div>

      {/* Caption */}
      <motion.p style={{
        position: 'absolute', bottom: '7%', left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)',
        textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.05em',
      }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >Safe &amp; secure · One-time only</motion.p>
    </motion.div>
  );
}

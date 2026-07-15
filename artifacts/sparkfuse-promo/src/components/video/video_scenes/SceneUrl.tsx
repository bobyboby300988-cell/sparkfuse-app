import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const APP_URL = 'match-maker-2025ap.replit.app';

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 20 + Math.random() * 60,
  size: 2 + Math.random() * 5,
  delay: Math.random() * 2,
  dur: 3 + Math.random() * 3,
  color: i % 2 === 0 ? '#F39C12' : '#C0392B',
  opacity: 0.2 + Math.random() * 0.4,
}));

export function SceneUrl() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const T = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1600),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glows */}
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(192,57,43,0.32) 0%, transparent 65%)',
      }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      />
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(243,156,18,0.18) 0%, transparent 60%)',
      }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.7 }}
      />

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: p.opacity, pointerEvents: 'none',
        }}
          animate={{ y: [0, -20, 5, 0], opacity: [p.opacity, p.opacity * 1.8, p.opacity * 0.3, p.opacity] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
        />
      ))}

      {/* Horizontal accent lines */}
      <motion.div style={{ position: 'absolute', top: '22%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.6), transparent)' }}
        initial={{ scaleX: 0 }} animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }} transition={{ duration: 0.7 }}
      />
      <motion.div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(243,156,18,0.5), transparent)' }}
        initial={{ scaleX: 0 }} animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, padding: '0 20px', width: '100%' }}>

        {/* SPARKFUSE logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 24, textAlign: 'center' }}
        >
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(38px, 10vw, 56px)', color: '#fff', letterSpacing: '0.1em', lineHeight: 1 }}>
            SPARK<span style={{ color: '#C0392B' }}>FUSE</span>
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#F39C12', letterSpacing: '0.25em', marginTop: 4, textTransform: 'uppercase' }}>
            The Dating App That Pays You
          </div>
        </motion.div>

        {/* "JOIN NOW" label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(18px, 5vw, 26px)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.22em', marginBottom: 16 }}
        >↓ OPEN IN YOUR BROWSER ↓</motion.div>

        {/* Store badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {/* App Store badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '7px 14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>Download on the</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>App Store</div>
            </div>
          </div>
          {/* Google Play badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '7px 14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3.18 23.76c.37.21.82.19 1.25-.06l11.37-6.54-2.53-2.54-10.09 9.14z" fill="#EA4335"/><path d="M21.54 10.27L19.1 8.9l-2.85 2.84 2.85 2.85 2.46-1.41c.7-.4.7-1.51-.02-1.91z" fill="#FBBC05"/><path d="M2.12.38C1.8.7 1.6 1.2 1.6 1.86V22.14c0 .66.2 1.16.53 1.48L3.18 23.76 13.5 13.44 3.18.38H2.12z" fill="#4285F4"/><path d="M15.8 12l-2.3-2.3L3.18.38l11.37 6.54L15.8 12z" fill="#34A853"/></svg>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>Get it on</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>Google Play</div>
            </div>
          </div>
          {/* Web App badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(192,57,43,0.22)', border: '1px solid rgba(192,57,43,0.55)', borderRadius: 10, padding: '7px 14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>Available on</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C0392B', fontWeight: 700, lineHeight: 1.2 }}>Web App</div>
            </div>
          </div>
        </motion.div>

        {/* URL — BIG and clear */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(192,57,43,0.22), rgba(243,156,18,0.12))',
            borderRadius: 20, padding: '20px 16px',
            border: '1.5px solid rgba(243,156,18,0.55)',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div style={{
            position: 'absolute', top: 0, bottom: 0, width: '60%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            borderRadius: 20,
          }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
          />
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginBottom: 8, textTransform: 'uppercase' }}>
            🌐 Open now in any browser — no app needed
          </div>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(16px, 5vw, 24px)',
            color: '#F39C12',
            letterSpacing: '0.06em',
            lineHeight: 1.2,
            wordBreak: 'break-all',
            textShadow: '0 0 24px rgba(243,156,18,0.6)',
          }}>
            {APP_URL}
          </div>
        </motion.div>

        {/* 18+ badge + tagline */}
        <motion.div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}
          initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}
        >
          <div style={{ background: '#C0392B', borderRadius: 7, padding: '3px 9px', boxShadow: '0 0 12px rgba(192,57,43,0.6)' }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, color: '#fff', letterSpacing: '0.1em' }}>18+</span>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>Adult Content · Ages 18 and over only</span>
        </motion.div>

        {/* Feature pills */}
        <motion.div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}
          initial={{ opacity: 0, y: 10 }} animate={phase >= 4 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        >
          {['📱 iOS App', '🤖 Android App', '🌐 Web Browser', '💬 Chat', '🎁 50 Gifts', '📹 Live Video', '💸 Earn Cash'].map(pill => (
            <div key={pill} style={{
              fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 10px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>{pill}</div>
          ))}
        </motion.div>

        {/* Pulsing CTA */}
        <motion.div style={{ marginTop: 22, textAlign: 'center' }}
          animate={phase >= 4 ? { opacity: [0.6, 1, 0.6] } : { opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(14px, 4vw, 20px)', color: '#fff', letterSpacing: '0.18em' }}>
            TAP · TYPE · CONNECT
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

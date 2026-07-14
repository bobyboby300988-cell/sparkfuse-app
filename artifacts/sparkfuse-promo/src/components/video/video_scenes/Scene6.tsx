import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const particles = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 20 + Math.random() * 70,
  size: 2 + Math.random() * 6,
  delay: Math.random() * 2.5,
  dur: 3 + Math.random() * 3,
  color: i % 2 === 0 ? '#F39C12' : '#C0392B',
  opacity: 0.25 + Math.random() * 0.45,
}));

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 3100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glows */}
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(192,57,43,0.28) 0%, transparent 65%)',
      }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 50% 35% at 50% 50%, rgba(243,156,18,0.14) 0%, transparent 60%)',
      }}
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: p.opacity, filter: 'blur(0.5px)',
          pointerEvents: 'none',
        }}
          animate={{ y: [0, -22, 6, 0], opacity: [p.opacity, p.opacity * 1.6, p.opacity * 0.4, p.opacity] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Accent lines */}
      <motion.div style={{
        position: 'absolute', top: '26%', left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.5), transparent)',
      }}
        initial={{ scaleX: 0 }} animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.6 }}
      />
      <motion.div style={{
        position: 'absolute', bottom: '22%', left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(243,156,18,0.4), transparent)',
      }}
        initial={{ scaleX: 0 }} animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />

      {/* Logo block */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>

        {/* Flame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.3, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          style={{ marginBottom: 4 }}
        >
          <svg width="42" height="54" viewBox="0 0 42 54" fill="none">
            <path d="M21 2C21 2 36 17 36 30C36 39.389 29.284 47 21 47C12.716 47 6 39.389 6 30C6 17 21 2 21 2Z" fill="url(#fg1)"/>
            <path d="M21 20C21 20 28 27 28 33C28 37.418 24.866 41 21 41C17.134 41 14 37.418 14 33C14 27 21 20 21 20Z" fill="url(#fg2)"/>
            <defs>
              <linearGradient id="fg1" x1="21" y1="2" x2="21" y2="47" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F39C12"/><stop offset="1" stopColor="#C0392B"/>
              </linearGradient>
              <linearGradient id="fg2" x1="21" y1="20" x2="21" y2="41" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff" stopOpacity="0.95"/><stop offset="1" stopColor="#F39C12"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* SPARKFUSE */}
        <div>
          {'SPARKFUSE'.split('').map((char, i) => (
            <motion.span key={i} style={{
              display: 'inline-block',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(48px, 15vw, 80px)',
              color: i < 5 ? '#fff' : '#C0392B',
              letterSpacing: '0.04em', lineHeight: 1,
              WebkitTextStroke: i >= 5 ? '1px #F39C12' : undefined,
            }}
              initial={{ opacity: 0, y: 40, rotateX: -45 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: -45 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: phase >= 2 ? i * 0.05 : 0 }}
            >{char}</motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 'clamp(10px, 3.2vw, 14px)',
          color: '#F39C12', letterSpacing: '0.28em', marginTop: 6,
          textTransform: 'uppercase', fontWeight: 500,
        }}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.55 }}
        >Find Your Spark</motion.p>

        {/* Availability cards */}
        <motion.div style={{
          display: 'flex', flexDirection: 'column', gap: 7, marginTop: 18, width: '84vw', maxWidth: 340,
        }}
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.45 }}
        >
          {/* Web — NOW */}
          <div style={{
            background: 'rgba(192,57,43,0.15)', borderRadius: 14, padding: '10px 14px',
            border: '1px solid rgba(192,57,43,0.45)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(192,57,43,0.25)', border: '1px solid rgba(192,57,43,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🌐</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F39C12', fontWeight: 700, letterSpacing: '0.06em' }}>
                AVAILABLE NOW — WEB ONLY
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                match-maker-2025ap.replit.app
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,165,0,0.7)', marginTop: 2 }}>
                ⚠️ Live streaming not available on web
              </div>
            </div>
            <div style={{
              background: '#C0392B', borderRadius: 20, padding: '3px 8px', flexShrink: 0,
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, color: '#fff', letterSpacing: '0.08em',
            }}>NOW</div>
          </div>

          {/* Google Play — SOON */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="20" viewBox="0 0 22 24" fill="none">
                <path d="M1 1.5L12 12L1 22.5V1.5Z" fill="#34A853"/>
                <path d="M1 1.5L12 12L17.5 6.5L4 0L1 1.5Z" fill="#4285F4"/>
                <path d="M1 22.5L12 12L17.5 17.5L4 24L1 22.5Z" fill="#FBBC05"/>
                <path d="M17.5 6.5L21 9.5L21 14.5L17.5 17.5L12 12L17.5 6.5Z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                Google Play — Android
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#F39C12', marginTop: 2 }}>
                ⏳ Coming soon — first mobile launch
              </div>
            </div>
            <div style={{
              marginLeft: 'auto', flexShrink: 0,
              background: 'rgba(243,156,18,0.15)', borderRadius: 20, padding: '3px 8px',
              border: '1px solid rgba(243,156,18,0.35)',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, color: '#F39C12', letterSpacing: '0.08em',
            }}>SOON</div>
          </div>

          {/* App Store — AFTER */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🍎</div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                App Store — iOS
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>
                After Google Play launch
              </div>
            </div>
            <div style={{
              marginLeft: 'auto', flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '3px 8px',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em',
            }}>LATER</div>
          </div>
        </motion.div>

        {/* Website row */}
        <motion.div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 7,
        }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ width: 18, height: 1, background: 'rgba(243,156,18,0.4)' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
            match-maker-2025ap.replit.app
          </span>
          <div style={{ width: 18, height: 1, background: 'rgba(243,156,18,0.4)' }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 7,
  delay: Math.random() * 2,
  dur: 3 + Math.random() * 4,
  color: i % 3 === 0 ? '#F39C12' : i % 3 === 1 ? '#C0392B' : '#ffffff',
  opacity: 0.3 + Math.random() * 0.5,
}));

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 500);
    const t3 = setTimeout(() => setPhase(3), 1100);
    const t4 = setTimeout(() => setPhase(4), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.4 }}
    >
      {/* Radial glow */}
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 55% at 50% 55%, rgba(192,57,43,0.35) 0%, transparent 70%)',
      }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 50% 30% at 50% 50%, rgba(243,156,18,0.18) 0%, transparent 65%)',
      }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: p.opacity, filter: 'blur(1px)',
        }}
          animate={{ y: [0, -28, 8, 0], x: [0, 12, -8, 0], opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity], scale: [1, 1.3, 0.8, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Accent lines */}
      <motion.div className="absolute" style={{
        top: '32%', left: '-10%', width: '120%', height: '2px',
        background: 'linear-gradient(90deg, transparent, #C0392B, transparent)',
      }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={phase >= 1 ? { scaleX: 1, opacity: 0.6 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div className="absolute" style={{
        bottom: '32%', left: '-10%', width: '120%', height: '2px',
        background: 'linear-gradient(90deg, transparent, #F39C12, transparent)',
      }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={phase >= 1 ? { scaleX: 1, opacity: 0.5 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Title */}
      <div className="relative z-10 flex flex-col items-center">
        {/* SPARK */}
        <div style={{ overflow: 'hidden', lineHeight: 1 }}>
          {'SPARK'.split('').map((char, i) => (
            <motion.span key={i} style={{
              display: 'inline-block',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(44px, 11vw, 62px)',
              color: '#fff',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
              initial={{ y: 70, opacity: 0, rotateX: -60 }}
              animate={phase >= 2 ? { y: 0, opacity: 1, rotateX: 0 } : { y: 70, opacity: 0, rotateX: -60 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22, delay: phase >= 2 ? i * 0.06 : 0 }}
            >{char}</motion.span>
          ))}
        </div>

        {/* FUSE */}
        <div style={{ overflow: 'hidden', lineHeight: 1 }}>
          {'FUSE'.split('').map((char, i) => (
            <motion.span key={i} style={{
              display: 'inline-block',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(44px, 11vw, 62px)',
              color: '#C0392B',
              letterSpacing: '0.06em',
              lineHeight: 1,
              WebkitTextStroke: '1px #F39C12',
            }}
              initial={{ y: 70, opacity: 0, rotateX: -60 }}
              animate={phase >= 2 ? { y: 0, opacity: 1, rotateX: 0 } : { y: 70, opacity: 0, rotateX: -60 }}
              transition={{ type: 'spring', stiffness: 380, damping: 20, delay: phase >= 2 ? (4 + i) * 0.07 : 0 }}
            >{char}</motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(11px, 3vw, 15px)',
          color: '#F39C12',
          letterSpacing: '0.3em',
          marginTop: 14,
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
          initial={{ opacity: 0, filter: 'blur(12px)', y: 10 }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(12px)', y: 10 }}
          transition={{ duration: 0.6 }}
        >Find Your Spark</motion.p>

        {/* Sub-line */}
        <motion.div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 8 }}
          initial={{ opacity: 0, y: 15 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ width: 28, height: 2, background: '#C0392B', borderRadius: 2 }} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(9px, 2.5vw, 11px)',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.2em',
            fontWeight: 400,
          }}>THE DATING APP THAT PAYS</span>
          <div style={{ width: 28, height: 2, background: '#C0392B', borderRadius: 2 }} />
        </motion.div>
      </div>

      {/* Copyright */}
      <motion.div style={{
        position: 'absolute', bottom: '4%', left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
      }}
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(8px, 2vw, 10px)',
          color: 'rgba(255,255,255,0.28)',
          letterSpacing: '0.12em',
        }}>© 2026 SparkFuse · All Rights Reserved</span>
      </motion.div>

      {/* Flame SVG */}
      <motion.div className="absolute" style={{ bottom: '10%', right: '12%', opacity: 0.7 }}
        animate={{ y: [0, -10, 0], rotate: [0, 5, -3, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="32" height="42" viewBox="0 0 40 52" fill="none">
          <path d="M20 2C20 2 32 14 32 26C32 33.732 26.627 40 20 40C13.373 40 8 33.732 8 26C8 14 20 2 20 2Z" fill="url(#f1)"/>
          <path d="M20 18C20 18 26 24 26 30C26 33.314 23.314 36 20 36C16.686 36 14 33.314 14 30C14 24 20 18 20 18Z" fill="url(#f2)"/>
          <defs>
            <linearGradient id="f1" x1="20" y1="2" x2="20" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F39C12"/><stop offset="1" stopColor="#C0392B"/>
            </linearGradient>
            <linearGradient id="f2" x1="20" y1="18" x2="20" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" stopOpacity="0.9"/><stop offset="1" stopColor="#F39C12"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  );
}

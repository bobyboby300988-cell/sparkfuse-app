import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const steps = [
  { icon: '💳', label: 'Buy ST Tokens',  sub: 'Card or PayPal',         color: '#C0392B' },
  { icon: '⚡', label: 'Spend ST',        sub: 'Gifts · Content · Live', color: '#F39C12' },
  { icon: '💸', label: 'Creators Earn',  sub: 'ST credited instantly',   color: '#27ae60' },
  { icon: '🏦', label: 'Withdraw Cash',  sub: '10% platform fee',        color: '#3498db' },
];

const stPacks = [
  { st: '100 ST', price: '€1.00', popular: false },
  { st: '500 ST', price: '€4.50', popular: true  },
  { st: '1000 ST', price: '€8.00', popular: false },
];

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #0D0B12 0%, #080d0a 60%, #0D0B12 100%)' }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 55% 40% at 50% 40%, rgba(243,156,18,0.16) 0%, transparent 70%)',
      }} />

      {/* Header */}
      <motion.div style={{ textAlign: 'center', marginBottom: 12, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.45 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(243,156,18,0.12)', borderRadius: 40, padding: '4px 14px',
          border: '1px solid rgba(243,156,18,0.3)', marginBottom: 8,
        }}>
          <span style={{ fontSize: 12 }}>⚡</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#F39C12', letterSpacing: '0.15em', fontWeight: 600 }}>ST TOKEN ECONOMY</span>
        </div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(28px, 8vw, 44px)', color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>
          BUY ST — <span style={{ color: '#F39C12' }}>CASH OUT</span>
        </div>
      </motion.div>

      {/* Steps */}
      <motion.div style={{ width: '88%', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3 }}
      >
        {steps.map((step, i) => (
          <motion.div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(20,16,30,0.92)', borderRadius: 12, padding: '10px 12px',
            border: `1px solid ${step.color}28`, boxShadow: `0 2px 10px ${step.color}10`,
          }}
            initial={{ opacity: 0, x: -22 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -22 }}
            transition={{ duration: 0.35, delay: i * 0.1 }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `${step.color}18`, border: `1px solid ${step.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{step.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#fff', fontWeight: 600 }}>{step.label}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{step.sub}</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: step.color, boxShadow: `0 0 7px ${step.color}` }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Withdrawal box */}
      <motion.div style={{
        width: '88%', marginTop: 10,
        background: 'linear-gradient(135deg, rgba(243,156,18,0.12), rgba(192,57,43,0.08))',
        borderRadius: 14, padding: '12px 14px',
        border: '1px solid rgba(243,156,18,0.35)', position: 'relative', zIndex: 10, overflow: 'hidden',
      }}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={phase >= 4 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🏦</span>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 17, color: '#F39C12', letterSpacing: '0.08em' }}>
            WITHDRAW TO YOUR BANK
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Your ST balance</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, color: '#fff', letterSpacing: '0.04em' }}>1,000 ST</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>You receive</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, color: '#27ae60', letterSpacing: '0.04em' }}>€9.00</div>
          </div>
        </div>
        {/* Fee info */}
        <motion.div style={{
          marginTop: 8, padding: '6px 10px',
          background: 'rgba(0,0,0,0.35)', borderRadius: 9,
          display: 'flex', alignItems: 'center', gap: 7,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span style={{ fontSize: 13 }}>ℹ️</span>
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>10% platform fee</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}> on withdrawal</span>
          </div>
          <div style={{ marginLeft: 'auto', fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: '#C0392B' }}>−€1.00</div>
        </motion.div>
      </motion.div>

      {/* ST packs */}
      <motion.div style={{ width: '88%', marginTop: 9, display: 'flex', gap: 7, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, y: 10 }}
        animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4 }}
      >
        {stPacks.map((pack, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: 11, padding: '9px 6px', textAlign: 'center',
            background: pack.popular ? 'linear-gradient(135deg, rgba(192,57,43,0.3), rgba(243,156,18,0.2))' : 'rgba(20,16,30,0.9)',
            border: pack.popular ? '1px solid rgba(243,156,18,0.5)' : '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
          }}>
            {pack.popular && (
              <div style={{
                position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)',
                background: '#F39C12', borderRadius: 20, padding: '1px 7px',
                fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#0D0B12', fontWeight: 700,
                letterSpacing: '0.1em', whiteSpace: 'nowrap',
              }}>POPULAR</div>
            )}
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: '#F39C12', letterSpacing: '0.04em' }}>{pack.st}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{pack.price}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

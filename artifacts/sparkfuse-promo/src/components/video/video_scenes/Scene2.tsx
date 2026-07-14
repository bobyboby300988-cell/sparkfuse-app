import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FULL_CARD   = '4532 8721 0034 5678';
const FULL_EXPIRY = '09 / 27';
const FULL_CVV    = '412';

export function Scene2() {
  const [phase,  setPhase]  = useState(0);
  const [cardNum, setCardNum] = useState('');
  const [expiry,  setExpiry]  = useState('');
  const [cvv,     setCvv]     = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const T: ReturnType<typeof setTimeout>[] = [];

    // App screen
    T.push(setTimeout(() => setPhase(1), 200));

    // Payment modal slides up
    T.push(setTimeout(() => setPhase(2), 2200));

    // Card number types in
    T.push(setTimeout(() => {
      setPhase(3);
      let i = 0;
      const step = () => {
        i++;
        setCardNum(FULL_CARD.slice(0, i));
        if (i < FULL_CARD.length) T.push(setTimeout(step, 65));
      };
      step();
    }, 4000));

    // Expiry + CVV fill
    T.push(setTimeout(() => { setPhase(4); setExpiry(FULL_EXPIRY); }, 6200));
    T.push(setTimeout(() => setCvv(FULL_CVV), 6700));

    // Button activates + pressed
    T.push(setTimeout(() => setPhase(5), 7800));

    // Processing progress bar
    T.push(setTimeout(() => {
      setPhase(6);
      let p = 0;
      const tick = () => {
        p += 3 + Math.random() * 5;
        setProgress(Math.min(p, 98));
        if (p < 98) T.push(setTimeout(tick, 80));
      };
      tick();
    }, 8700));

    // Success
    T.push(setTimeout(() => { setPhase(7); setProgress(100); }, 11000));

    // Back to app — verified badge
    T.push(setTimeout(() => setPhase(8), 12800));

    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0D0B12 0%, #170a0a 60%, #0D0B12 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.45 }}
    >
      {/* Ambient glow */}
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(192,57,43,0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.8, repeat: Infinity }} />

      {/* ── Phase 1–2: App Verify Screen ── */}
      <AnimatePresence>
        {phase >= 1 && phase < 6 && (
          <motion.div
            key="app-screen"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 5 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 6 ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Step tag */}
            <motion.div style={{ marginBottom: 16 }}
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(192,57,43,0.18)', borderRadius: 40, padding: '5px 14px',
                border: '1px solid rgba(192,57,43,0.4)',
              }}>
                <span style={{ fontSize: 11 }}>🛡️</span>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#F39C12', letterSpacing: '0.14em', fontWeight: 600 }}>STEP 1 — VERIFY ACCOUNT</span>
              </div>
            </motion.div>

            {/* Big price card */}
            <motion.div style={{
              width: '84%', background: 'rgba(22,18,32,0.96)', borderRadius: 22,
              padding: '26px 20px 20px', border: '1px solid rgba(192,57,43,0.3)',
              boxShadow: '0 12px 50px rgba(0,0,0,0.65)', textAlign: 'center',
            }}
              initial={{ opacity: 0, y: 36, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
            >
              <motion.div style={{ fontSize: 44, marginBottom: 6 }}
                animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
              >🔓</motion.div>
              <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', marginBottom: 4 }}>
                MONTHLY SUBSCRIPTION
              </div>
              <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(58px,14vw,78px)', color: '#fff', lineHeight: 1 }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.2 }}
              >
                <span style={{ color: '#F39C12' }}>€</span>2
              </motion.div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 18 }}>
                Only €2 / month · Full access · Auto-renews · Cancel anytime
              </div>

              {/* Payment methods */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {['💳 Credit Card', '🅿️ PayPal'].map((m, i) => (
                  <div key={i} style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: '10px 8px',
                    border: i === 0 ? '1px solid rgba(192,57,43,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Inter', fontSize: 11, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: i === 0 ? 600 : 400,
                  }}>{m}</div>
                ))}
              </div>

              {/* CTA button */}
              <motion.div style={{
                borderRadius: 12, padding: '14px 0',
                background: 'linear-gradient(90deg, #C0392B, #e74c3c)',
                fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: '0.12em',
                boxShadow: '0 4px 20px rgba(192,57,43,0.5)',
              }}
                animate={{ boxShadow: ['0 4px 20px rgba(192,57,43,0.4)', '0 6px 30px rgba(192,57,43,0.7)', '0 4px 20px rgba(192,57,43,0.4)'] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                VERIFY &amp; JOIN — €2
              </motion.div>

              <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 10 }}>
                🔒 Secure · SSL encrypted · 100% refundable if declined
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 2: Payment Form Modal ── */}
      <AnimatePresence>
        {phase >= 2 && phase < 6 && (
          <motion.div
            key="payment-modal"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
              background: 'rgba(18,14,28,0.97)',
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: '20px 20px 28px',
              border: '1px solid rgba(192,57,43,0.25)',
              boxShadow: '0 -10px 50px rgba(0,0,0,0.8)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #C0392B, #e74c3c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>💳</div>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 17, color: '#fff', letterSpacing: '0.08em' }}>CARD PAYMENT</div>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>€2.00/month · Auto-renews monthly</div>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: 'Bebas Neue', fontSize: 20, color: '#F39C12' }}>€2</div>
            </div>

            {/* Card number field */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.1em' }}>CARD NUMBER</div>
              <div style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: '12px 14px',
                border: phase === 3 ? '1.5px solid rgba(192,57,43,0.7)' : '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Inter', fontSize: 14, color: '#fff', letterSpacing: '0.08em',
                fontWeight: 500, minHeight: 44, display: 'flex', alignItems: 'center', position: 'relative',
              }}>
                {cardNum || <span style={{ color: 'rgba(255,255,255,0.2)' }}>1234 5678 9012 3456</span>}
                {phase === 3 && (
                  <motion.span style={{ marginLeft: 1, display: 'inline-block', width: 2, height: 16, background: '#C0392B', borderRadius: 1 }}
                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
                {/* Card type badge */}
                {cardNum.length > 0 && (
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Bebas Neue', fontSize: 13, color: '#F39C12' }}>VISA</div>
                )}
              </div>
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.1em' }}>EXPIRY</div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: '12px 14px',
                  border: phase === 4 ? '1.5px solid rgba(192,57,43,0.7)' : '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Inter', fontSize: 14, color: expiry ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 500, minHeight: 44, display: 'flex', alignItems: 'center',
                }}>
                  {expiry || 'MM / YY'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.1em' }}>CVV</div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Inter', fontSize: 14, color: cvv ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 500, minHeight: 44, display: 'flex', alignItems: 'center',
                }}>
                  {cvv ? '•••' : '•••'}
                </div>
              </div>
            </div>

            {/* Pay button */}
            <motion.div style={{
              borderRadius: 13, padding: '14px 0', textAlign: 'center',
              background: phase >= 4 ? 'linear-gradient(90deg, #C0392B, #e74c3c)' : 'rgba(255,255,255,0.07)',
              fontFamily: 'Bebas Neue', fontSize: 20, color: phase >= 4 ? '#fff' : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.12em',
              boxShadow: phase >= 5 ? '0 0 30px rgba(192,57,43,0.7)' : 'none',
            }}
              animate={phase === 5 ? { scale: [1, 0.96, 1] } : phase >= 4 ? { scale: 1 } : {}}
              transition={{ duration: 0.25 }}
            >
              {phase >= 5 ? '⏳ SUBSCRIBING...' : 'SUBSCRIBE — €2 / MONTH'}
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 10, fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              🔒 256-bit SSL encryption
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 6: Processing ── */}
      <AnimatePresence>
        {phase === 6 && (
          <motion.div
            key="processing"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 40, background: '#0D0B12' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div style={{ fontSize: 52, marginBottom: 16 }}
              animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >⚙️</motion.div>

            <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(22px,6vw,32px)', color: '#fff', letterSpacing: '0.1em', marginBottom: 4 }}>
              PROCESSING PAYMENT
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              Activating your monthly subscription...
            </div>

            {/* Progress bar */}
            <div style={{ width: '76%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
              <motion.div style={{
                height: '100%', borderRadius: 10,
                background: 'linear-gradient(90deg, #C0392B, #F39C12)',
                boxShadow: '0 0 12px rgba(243,156,18,0.7)',
              }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
              />
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              Contacting bank... please wait
            </div>

            {/* Bank logos row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20, opacity: 0.35 }}>
              {['🏦', '🔐', '🛡️', '✅'].map((icon, i) => (
                <div key={i} style={{ fontSize: 20 }}>{icon}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 7: Success! ── */}
      <AnimatePresence>
        {phase >= 7 && phase < 8 && (
          <motion.div
            key="success"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 40, background: 'linear-gradient(160deg, #0a1f0f 0%, #0D0B12 100%)' }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Green flash */}
            <motion.div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(39,174,96,0.35) 0%, transparent 70%)',
            }} />

            {/* Checkmark circle */}
            <motion.div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, marginBottom: 20,
              boxShadow: '0 0 60px rgba(46,204,113,0.6)',
            }}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            >✓</motion.div>

            <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(28px,8vw,42px)', color: '#fff', letterSpacing: '0.08em', marginBottom: 6 }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >PAYMENT CONFIRMED!</motion.div>

            <motion.div style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            >€2.00 charged to ••••5678</motion.div>

            {/* Verified badge */}
            <motion.div style={{
              background: 'rgba(39,174,96,0.18)', border: '1.5px solid rgba(39,174,96,0.5)',
              borderRadius: 16, padding: '14px 28px', textAlign: 'center',
            }}
              initial={{ opacity: 0, y: 20, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(20px,6vw,28px)', color: '#2ecc71', letterSpacing: '0.1em' }}>
                ACCOUNT VERIFIED!
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                Full access unlocked · Start earning now
              </div>
            </motion.div>

            {/* Particles */}
            {[...Array(16)].map((_, i) => (
              <motion.div key={i} style={{
                position: 'absolute', top: '40%', left: '50%',
                width: 8, height: 8, borderRadius: '50%',
                background: i % 3 === 0 ? '#2ecc71' : i % 3 === 1 ? '#F39C12' : '#C0392B',
              }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 16) * Math.PI * 2) * (80 + Math.random() * 80),
                  y: Math.sin((i / 16) * Math.PI * 2) * (80 + Math.random() * 80),
                  opacity: 0,
                  scale: 0.2,
                }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 8: Back to app — verified state ── */}
      <AnimatePresence>
        {phase >= 8 && (
          <motion.div
            key="app-verified"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 50 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div style={{
              width: '84%', background: 'rgba(22,18,32,0.97)', borderRadius: 22,
              padding: '24px 20px', border: '1.5px solid rgba(39,174,96,0.4)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(26px,7vw,36px)', color: '#2ecc71', letterSpacing: '0.08em', marginBottom: 4 }}>
                YOU'RE IN!
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                Welcome to SparkFuse · Your profile is live
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  { icon: '📺', label: 'Go Live' },
                  { icon: '💌', label: 'DM Fans' },
                  { icon: '📸', label: 'Sell Content' },
                ].map((item, i) => (
                  <div key={i} style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 11,
                    padding: '10px 6px', border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                    {item.label}
                  </div>
                ))}
              </div>

              <motion.div style={{
                borderRadius: 12, padding: '13px 0',
                background: 'linear-gradient(90deg, #C0392B, #e74c3c)',
                fontFamily: 'Bebas Neue', fontSize: 19, color: '#fff', letterSpacing: '0.12em',
              }}
                animate={{ boxShadow: ['0 4px 18px rgba(192,57,43,0.4)', '0 6px 28px rgba(192,57,43,0.7)', '0 4px 18px rgba(192,57,43,0.4)'] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                START EARNING NOW →
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

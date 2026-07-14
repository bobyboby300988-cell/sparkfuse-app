import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FULL_IBAN = 'DE89 3704 0044 0532 0130 00';
const EARNINGS_EUR = 127.50;
const FEE_PCT = 0.10;
const NET_EUR = EARNINGS_EUR * (1 - FEE_PCT);

export function SceneWithdraw() {
  const [phase,    setPhase]    = useState(0);
  const [iban,     setIban]     = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const T: ReturnType<typeof setTimeout>[] = [];

    // Dashboard appears
    T.push(setTimeout(() => setPhase(1), 200));

    // Withdraw button pulses + user taps
    T.push(setTimeout(() => setPhase(2), 2500));

    // Bank form slides up
    T.push(setTimeout(() => setPhase(3), 3800));

    // IBAN types in
    T.push(setTimeout(() => {
      setPhase(4);
      let i = 0;
      const step = () => {
        i++;
        setIban(FULL_IBAN.slice(0, i));
        if (i < FULL_IBAN.length) T.push(setTimeout(step, 70));
      };
      step();
    }, 5000));

    // Confirm pressed
    T.push(setTimeout(() => setPhase(5), 7200));

    // Processing bar
    T.push(setTimeout(() => {
      setPhase(6);
      let p = 0;
      const tick = () => {
        p += 4 + Math.random() * 6;
        setProgress(Math.min(p, 98));
        if (p < 98) T.push(setTimeout(tick, 90));
      };
      tick();
    }, 8000));

    // Transfer complete
    T.push(setTimeout(() => { setPhase(7); setProgress(100); }, 10500));

    // Fee breakdown
    T.push(setTimeout(() => setPhase(8), 11600));

    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0D0B12 0%, #080d1a 60%, #0D0B12 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.45 }}
    >
      {/* Ambient glow */}
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 65% 45% at 50% 35%, rgba(39,174,96,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />

      {/* ── Phase 1–2: Earnings Dashboard ── */}
      <AnimatePresence>
        {phase >= 1 && phase < 6 && (
          <motion.div
            key="dashboard"
            className="absolute inset-0 flex flex-col"
            style={{ zIndex: 5, padding: '18px 16px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header tag */}
            <motion.div style={{ marginBottom: 14, alignSelf: 'center' }}
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(39,174,96,0.15)', borderRadius: 40, padding: '5px 14px',
                border: '1px solid rgba(39,174,96,0.4)',
              }}>
                <span style={{ fontSize: 11 }}>🏦</span>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#2ecc71', letterSpacing: '0.14em', fontWeight: 600 }}>
                  WITHDRAW EARNINGS
                </span>
              </div>
            </motion.div>

            {/* Big earnings card */}
            <motion.div style={{
              background: 'rgba(22,18,32,0.96)', borderRadius: 20,
              padding: '20px 18px', border: '1px solid rgba(39,174,96,0.3)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)', marginBottom: 12,
            }}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.1 }}
            >
              <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 4 }}>
                THIS MONTH'S EARNINGS
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(48px,12vw,64px)', color: '#F39C12', lineHeight: 1 }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.2 }}
                >
                  €{EARNINGS_EUR.toFixed(2)}
                </motion.div>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#2ecc71', fontWeight: 600, marginBottom: 6 }}>▲ +38%</div>
              </div>

              {/* Breakdown rows */}
              {[
                { icon: '📺', label: 'Live streams', value: '€58.50' },
                { icon: '💌', label: 'DM gifts',     value: '€42.00' },
                { icon: '📸', label: 'Content sales', value: '€27.00' },
              ].map((row, i) => (
                <motion.div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.35 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>{row.icon}</span>
                    <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                  </div>
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 15, color: '#fff', letterSpacing: '0.04em' }}>{row.value}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Withdraw button */}
            <motion.div style={{
              borderRadius: 14, padding: '15px 0', textAlign: 'center',
              background: 'linear-gradient(90deg, #1a7a45, #27ae60)',
              fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: '0.12em',
              boxShadow: phase >= 2 ? '0 0 30px rgba(39,174,96,0.6)' : '0 4px 18px rgba(39,174,96,0.3)',
            }}
              animate={phase === 2
                ? { scale: [1, 1.05, 1, 1.05, 0.97], boxShadow: ['0 4px 18px rgba(39,174,96,0.4)', '0 8px 36px rgba(39,174,96,0.75)', '0 4px 18px rgba(39,174,96,0.4)', '0 8px 36px rgba(39,174,96,0.75)', '0 2px 10px rgba(39,174,96,0.2)'] }
                : { scale: 1 }
              }
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              {phase >= 2 ? '👆 TAPPING WITHDRAW...' : 'WITHDRAW TO BANK'}
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              10% platform fee · Processed within 2 business days
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 3–5: Bank Form Modal ── */}
      <AnimatePresence>
        {phase >= 3 && phase < 6 && (
          <motion.div
            key="bank-form"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
              background: 'rgba(14,11,22,0.98)',
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: '20px 20px 32px',
              border: '1px solid rgba(39,174,96,0.25)',
              boxShadow: '0 -12px 60px rgba(0,0,0,0.9)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 250, damping: 28 }}
          >
            {/* Amount summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#fff', letterSpacing: '0.08em' }}>BANK TRANSFER</div>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Funds arrive in 1–2 business days</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>You receive</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: '#2ecc71', letterSpacing: '0.04em' }}>
                  €{NET_EUR.toFixed(2)}
                </div>
              </div>
            </div>

            {/* IBAN field */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.1em' }}>
                IBAN / BANK ACCOUNT
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: '12px 14px',
                border: phase === 4 ? '1.5px solid rgba(39,174,96,0.7)' : '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Inter', fontSize: 13, color: '#fff', letterSpacing: '0.06em',
                fontWeight: 500, minHeight: 44, display: 'flex', alignItems: 'center',
              }}>
                {iban || <span style={{ color: 'rgba(255,255,255,0.2)' }}>Enter IBAN or account number</span>}
                {phase === 4 && (
                  <motion.span style={{ marginLeft: 1, display: 'inline-block', width: 2, height: 16, background: '#2ecc71', borderRadius: 1 }}
                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </div>
            </div>

            {/* Fee breakdown */}
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 11, padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14,
            }}>
              {[
                { label: 'Gross earnings', value: `€${EARNINGS_EUR.toFixed(2)}`, color: 'rgba(255,255,255,0.7)' },
                { label: 'Platform fee (10%)', value: `−€${(EARNINGS_EUR * FEE_PCT).toFixed(2)}`, color: '#C0392B' },
                { label: 'You receive', value: `€${NET_EUR.toFixed(2)}`, color: '#2ecc71' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '3px 0',
                  borderTop: i > 0 ? (i === 2 ? '1px solid rgba(255,255,255,0.1)' : 'none') : 'none',
                  marginTop: i === 2 ? 5 : 0, paddingTop: i === 2 ? 8 : 3,
                }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 13, color: row.color, letterSpacing: '0.04em' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Confirm button */}
            <motion.div style={{
              borderRadius: 13, padding: '14px 0', textAlign: 'center',
              background: phase >= 4 ? 'linear-gradient(90deg, #1a7a45, #27ae60)' : 'rgba(255,255,255,0.07)',
              fontFamily: 'Bebas Neue', fontSize: 20, color: phase >= 4 ? '#fff' : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em',
            }}
              animate={phase === 5 ? { scale: [1, 0.96, 1] } : {}}
              transition={{ duration: 0.25 }}
            >
              {phase >= 5 ? '⏳ CONFIRMING...' : `WITHDRAW €${NET_EUR.toFixed(2)}`}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 6: Processing transfer ── */}
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
              animate={{ y: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >🏦</motion.div>

            <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(22px,6vw,32px)', color: '#fff', letterSpacing: '0.1em', marginBottom: 4 }}>
              SENDING TO YOUR BANK
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              Transferring €{NET_EUR.toFixed(2)} · Please wait...
            </div>

            <div style={{ width: '76%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
              <motion.div style={{
                height: '100%', borderRadius: 10,
                background: 'linear-gradient(90deg, #1a7a45, #2ecc71)',
                boxShadow: '0 0 12px rgba(46,204,113,0.7)',
              }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
              />
            </div>

            <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
              Securely routed · Encrypted transfer
            </div>

            {/* Progress icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
              {['💳', '→', '🔐', '→', '🏦'].map((item, i) => (
                <motion.div key={i} style={{
                  fontFamily: 'Inter', fontSize: i % 2 === 1 ? 14 : 22,
                  color: i % 2 === 1 ? 'rgba(255,255,255,0.3)' : undefined,
                }}
                  animate={i % 2 === 0 ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                >{item}</motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 7–8: Transfer Complete ── */}
      <AnimatePresence>
        {phase >= 7 && (
          <motion.div
            key="complete"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 50, padding: '20px 16px' }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Green glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(39,174,96,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Success icon */}
            <motion.div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a7a45, #27ae60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42, marginBottom: 18,
              boxShadow: '0 0 50px rgba(46,204,113,0.55)',
            }}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            >✓</motion.div>

            <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(26px,7vw,36px)', color: '#fff', letterSpacing: '0.08em', marginBottom: 4 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >TRANSFER COMPLETE!</motion.div>

            <motion.div style={{
              fontFamily: 'Bebas Neue', fontSize: 'clamp(40px,11vw,56px)', color: '#2ecc71',
              letterSpacing: '0.06em', marginBottom: 6, lineHeight: 1,
            }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.35 }}
            >€{NET_EUR.toFixed(2)}</motion.div>

            <motion.div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >Sent to DE89 ···· ···· 0130 00</motion.div>

            {/* Fee breakdown card */}
            <AnimatePresence>
              {phase >= 8 && (
                <motion.div style={{
                  width: '88%', background: 'rgba(22,18,32,0.97)', borderRadius: 18,
                  padding: '16px 16px', border: '1px solid rgba(39,174,96,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#F39C12', letterSpacing: '0.1em', marginBottom: 10 }}>
                    BREAKDOWN
                  </div>
                  {[
                    { label: 'Gross earnings',     value: `€${EARNINGS_EUR.toFixed(2)}`, valueColor: 'rgba(255,255,255,0.8)' },
                    { label: 'SparkFuse fee (10%)', value: `−€${(EARNINGS_EUR * FEE_PCT).toFixed(2)}`, valueColor: '#C0392B' },
                    { label: 'You received',        value: `€${NET_EUR.toFixed(2)}`,     valueColor: '#2ecc71' },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: 15, color: row.valueColor, letterSpacing: '0.04em' }}>{row.value}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(39,174,96,0.08)', borderRadius: 10, border: '1px solid rgba(39,174,96,0.2)' }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(39,174,96,0.85)', textAlign: 'center' }}>
                      🏦 Arrives in your bank within 2 business days
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

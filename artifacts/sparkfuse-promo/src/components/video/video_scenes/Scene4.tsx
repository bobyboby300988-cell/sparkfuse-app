import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { GiftAnimation, type GiftKey } from '../GiftAnimations';

/* ─── DM gift set — 5 progressive gifts ─── */
type DmGiftKey = 'lingerie' | 'vibrator' | 'rolex' | 'ferrari' | 'lamborghini';

const GIFT_DEFS: Record<DmGiftKey, {
  label: string; st: number; color: string; erotic?: boolean; size: 'small'|'medium'|'large';
}> = {
  lingerie:    { label: 'Lingerie',    st: 1000,  color: '#FF80AB', erotic: true, size: 'small'  },
  vibrator:    { label: 'Vibrator',    st: 2000,  color: '#E91E63', erotic: true, size: 'small'  },
  rolex:       { label: 'Rolex',       st: 5000,  color: '#FFD700',               size: 'medium' },
  ferrari:     { label: 'Ferrari',     st: 15000, color: '#C0392B',               size: 'medium' },
  lamborghini: { label: 'Lamborghini', st: 30000, color: '#FFD200',               size: 'large'  },
};

const GIFT_ORDER: DmGiftKey[] = ['lingerie','vibrator','rolex','ferrari','lamborghini'];

const BURST_CFG = {
  small:  { pCount: 14, radius: 70,  giftSz: 80,  dur: 1800 },
  medium: { pCount: 28, radius: 110, giftSz: 110, dur: 2400 },
  large:  { pCount: 48, radius: 170, giftSz: 150, dur: 3200 },
};

const CAR_GIFTS: Set<DmGiftKey> = new Set(['ferrari','lamborghini']);

interface BubbleItem { id: number; type: 'msg'|'gift'|'media'; from: 'them'|'me'; text?: string; giftKey?: DmGiftKey; emoji?: string; locked?: boolean }

/* ─── DM gift burst — animated SVG, small price pill ─── */
function DmGiftBurst({ giftKey, onDone }: { giftKey: DmGiftKey; onDone: () => void }) {
  const def = GIFT_DEFS[giftKey];
  const cfg = BURST_CFG[def.size];
  const isLarge = def.size === 'large';
  const isMed   = def.size === 'medium' || isLarge;
  const isCar   = CAR_GIFTS.has(giftKey);

  const particles = Array.from({ length: cfg.pCount }, (_, i) => {
    const angle = (360 / cfg.pCount) * i;
    const r = cfg.radius * (0.75 + Math.random() * 0.4);
    const rad = (angle * Math.PI) / 180;
    return {
      tx: Math.cos(rad) * r,
      ty: -Math.sin(rad) * r * 0.55,
      color: i % 3 === 0 ? def.color : i % 3 === 1 ? '#F39C12' : '#fff',
      s: 3 + Math.random() * (isLarge ? 8 : 5),
    };
  });

  useEffect(() => { const t = setTimeout(onDone, cfg.dur); return () => clearTimeout(t); }, []);

  const displayW = isCar ? cfg.giftSz * 2.1 : cfg.giftSz;
  const displayH = isCar ? cfg.giftSz * 0.75 : cfg.giftSz;

  return (
    <motion.div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
      zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', overflow: 'hidden',
    }}
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
    >
      {/* Gradient scrim */}
      <motion.div style={{
        position: 'absolute', inset: 0,
        background: isLarge
          ? `radial-gradient(ellipse 90% 90% at 50% 70%, ${def.color}55 0%, rgba(13,11,18,0.88) 70%)`
          : `rgba(13,11,18,0.75)`,
      }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.75, 0] }}
        transition={{ duration: isLarge ? 1.4 : 1.0, times: [0, 0.15, 0.5, 1] }}
      />

      {/* Ring pulses */}
      {Array.from({ length: isLarge ? 3 : 1 }).map((_, ring) => (
        <motion.div key={ring} style={{ position: 'absolute', border: `${isLarge ? 3 : 2}px solid ${def.color}`, borderRadius: '50%' }}
          initial={{ width: cfg.giftSz * 0.5, height: cfg.giftSz * 0.5, opacity: 0.9 }}
          animate={{ width: cfg.radius * (2.4 + ring * 0.7), height: cfg.radius * (2.4 + ring * 0.7), opacity: 0 }}
          transition={{ duration: 0.85 + ring * 0.18, ease: 'easeOut', delay: ring * 0.12 }}
        />
      ))}

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div key={i} style={{
          position: 'absolute', width: p.s, height: p.s, borderRadius: '50%',
          background: p.color, boxShadow: `0 0 ${p.s * 2}px ${p.color}88`,
        }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.82, delay: 0.04, ease: 'easeOut' }}
        />
      ))}

      {/* ─── Animated gift (no box) ─── */}
      <motion.div style={{
        width: displayW, height: displayH,
        position: 'relative', zIndex: 10, overflow: 'visible',
        filter: isLarge
          ? `drop-shadow(0 0 20px ${def.color}) drop-shadow(0 0 40px ${def.color}66)`
          : isMed
          ? `drop-shadow(0 0 10px ${def.color})`
          : `drop-shadow(0 0 6px ${def.color}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
        initial={{ scale: 0, opacity: 0, rotate: isCar ? 0 : -18 }}
        animate={{ scale: [0, isLarge ? 1.7 : isMed ? 1.3 : 1.0, 1.0], opacity: [0, 1, 1], rotate: isCar ? 0 : [-18, 8, 0] }}
        transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.5] }}
      >
        <GiftAnimation giftKey={giftKey} size={isCar ? displayH * 1.75 : cfg.giftSz} />
      </motion.div>

      {/* Small price pill */}
      <motion.div style={{
        marginTop: 10,
        background: isLarge ? `${def.color}EE` : 'rgba(0,0,0,0.85)',
        borderRadius: 24, padding: isLarge ? '4px 16px' : '3px 12px',
        border: `1px solid ${def.color}88`,
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: isLarge ? 20 : isMed ? 16 : 13,
        color: isLarge ? '#000' : def.color,
        letterSpacing: '0.08em',
        textShadow: isLarge ? 'none' : `0 0 12px ${def.color}`,
        zIndex: 10,
      }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        {def.label} · {def.st >= 1000 ? `${(def.st / 1000).toFixed(0)}K` : def.st} ST{def.st === 30000 ? ' = €300' : ''}
      </motion.div>
      <motion.div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 5, zIndex: 10 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
      >{def.erotic ? 'Erotic Gift 🔞' : 'Luxury Gift ✨'}</motion.div>

      {/* Floating emoji copies */}
      {Array.from({ length: isLarge ? 3 : 1 }, (_, i) => (
        <motion.div key={i} style={{
          position: 'absolute', fontSize: isLarge ? 26 : 18,
          left: `${30 + i * 15}%`,
        }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -(60 + i * 22), opacity: [0, 0.7, 0] }}
          transition={{ delay: 0.3 + i * 0.12, duration: 1.0, ease: 'easeOut' }}
        >{def.erotic ? '🔞' : '✨'}</motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Chat bubble ─── */
function Bubble({ item }: { item: BubbleItem }) {
  const isMe = item.from === 'me';

  if (item.type === 'gift' && item.giftKey) {
    const def = GIFT_DEFS[item.giftKey];
    return (
      <motion.div initial={{ opacity: 0, scale: 0.7, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
      >
        <div style={{
          background: `linear-gradient(135deg, ${def.color}20, ${def.color}10)`,
          border: `1px solid ${def.color}55`, borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: '78%',
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `${def.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {def.erotic ? '🔞' : '✨'}
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: def.color, letterSpacing: '0.06em' }}>
              {def.label}{def.erotic ? ' 🔞' : ' ✨'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              +{def.st.toLocaleString()} ST · €{Math.round(def.st / 100)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (item.type === 'media') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
      >
        <div style={{ width: 100, height: 70, borderRadius: 12, overflow: 'hidden', position: 'relative', background: 'rgba(20,14,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24 }}>{item.emoji}</span>
          {item.locked && (
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#F39C12' }}>30 ST</div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: isMe ? 14 : -14, y: 4 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.3 }}
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
    >
      <div style={{
        background: isMe ? 'linear-gradient(135deg, rgba(192,57,43,0.85), rgba(160,40,25,0.9))' : 'rgba(26,22,37,0.95)',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '8px 12px', maxWidth: '78%', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: isMe ? '#fff' : 'rgba(255,255,255,0.85)' }}>{item.text}</span>
      </div>
    </motion.div>
  );
}

/* ─── Main scene ─── */
export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [activeBurst, setActiveBurst] = useState<DmGiftKey | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [sentKeys, setSentKeys] = useState<Set<DmGiftKey>>(new Set());
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (item: Omit<BubbleItem,'id'>) => {
    setBubbles(prev => [...prev.slice(-8), { ...item, id: nextId.current++ }]);
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
  };

  const sendGift = (key: DmGiftKey) => {
    push({ type: 'gift', from: 'me', giftKey: key });
    setActiveBurst(key); setBurstKey(k => k + 1);
    setSentKeys(prev => new Set([...prev, key]));
    setEarnings(prev => prev + GIFT_DEFS[key].st);
  };

  useEffect(() => {
    const T = [
      setTimeout(() => { setPhase(1); push({ type: 'msg', from: 'them', text: 'Hey 😍 your profile is stunning!' }); }, 200),
      setTimeout(() => { push({ type: 'msg', from: 'me', text: 'Thank you! 🔥 Want to see more?' }); }, 750),
      setTimeout(() => { push({ type: 'media', from: 'me', emoji: '📸', locked: false }); }, 1200),
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'Gorgeous! Can I unlock your premium content? 🔥' }); setPhase(2); }, 1700),
      setTimeout(() => { push({ type: 'media', from: 'me', emoji: '🎬', locked: true }); }, 2100),
      // Lingerie 1K
      setTimeout(() => { setPhase(3); sendGift('lingerie'); }, 2600),
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'That lingerie gift is for you! 🔥 you\'re irresistible' }); }, 3700),
      // Vibrator 2K
      setTimeout(() => { sendGift('vibrator'); }, 4300),
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'You deserve more… I want to spoil you 💎' }); setPhase(4); }, 5500),
      // Rolex 5K
      setTimeout(() => { sendGift('rolex'); }, 6100),
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'You\'re the hottest on SparkFuse! 🔥 Now for the real gifts…' }); }, 7300),
      // Ferrari 15K
      setTimeout(() => { setPhase(5); sendGift('ferrari'); }, 7900),
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'A Ferrari wasn\'t enough… you deserve the ULTIMATE 🏎️💰' }); }, 9400),
      // Lamborghini 30K = €300
      setTimeout(() => { setPhase(6); sendGift('lamborghini'); }, 10000),
      setTimeout(() => setPhase(7), 13000),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(192,57,43,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Gift burst — bottom 50% */}
      <AnimatePresence>
        {activeBurst && <DmGiftBurst key={burstKey} giftKey={activeBurst} onDone={() => setActiveBurst(null)} />}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 20, flexShrink: 0 }}
        initial={{ opacity: 0, y: -12 }} animate={phase >= 1 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8e44ad, #3498db)', border: '2px solid rgba(52,152,219,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👩</div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#27ae60', border: '2px solid #0D0B12' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#fff', fontWeight: 600 }}>Julia R.</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#27ae60' }}>● online now</div>
        </div>
        <motion.div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(192,57,43,0.18)', border: '1px solid rgba(192,57,43,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
          animate={phase >= 3 ? { boxShadow: ['0 0 0px rgba(192,57,43,0)', '0 0 10px rgba(192,57,43,0.6)', '0 0 0px rgba(192,57,43,0)'] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
        >📹</motion.div>
        <motion.div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
          animate={phase >= 3 ? { boxShadow: ['0 0 0px rgba(39,174,96,0)', '0 0 10px rgba(39,174,96,0.5)', '0 0 0px rgba(39,174,96,0)'] } : {}} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >📞</motion.div>
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div key={earnings} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: 'rgba(243,156,18,0.15)', borderRadius: 20, padding: '3px 9px', border: '1px solid rgba(243,156,18,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#F39C12' }}>+{earnings.toLocaleString()} ST</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CHAT BUBBLES */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'hidden', padding: '10px 12px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {bubbles.map(b => <Bubble key={b.id} item={b} />)}
        </AnimatePresence>
      </div>

      {/* GIFT TRAY */}
      <motion.div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, position: 'relative', zIndex: 20 }}
        initial={{ opacity: 0, y: 16 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>Send a Gift · 5 shown · 50 available in app</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {GIFT_ORDER.map((key) => {
            const def = GIFT_DEFS[key];
            const isSent = sentKeys.has(key);
            const emojis: Record<DmGiftKey, string> = {
              lingerie: '🔥', vibrator: '🔞', rolex: '⌚', ferrari: '🏎️', lamborghini: '🏎️',
            };
            return (
              <motion.div key={key} style={{
                flex: 1, borderRadius: 13, overflow: 'hidden',
                border: `1px solid ${isSent ? def.color + '70' : def.erotic ? 'rgba(255,91,168,0.25)' : 'rgba(255,255,255,0.08)'}`,
                background: isSent ? `${def.color}20` : 'rgba(20,16,30,0.9)',
                position: 'relative',
              }}
                animate={isSent ? { boxShadow: [`0 0 0px ${def.color}00`, `0 0 18px ${def.color}55`, `0 0 0px ${def.color}00`] } : {}}
                transition={isSent ? { duration: 0.4 } : {}}
              >
                <div style={{ height: 44, background: `linear-gradient(135deg, ${def.color}33, ${def.color}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {emojis[key]}
                </div>
                <div style={{ padding: '4px 3px', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 9, color: isSent ? def.color : def.erotic ? '#FF5CA8' : 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.label}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{def.st >= 1000 ? `${(def.st/1000).toFixed(0)}K` : def.st} ST</div>
                </div>
                {isSent && (
                  <motion.div style={{ position: 'absolute', top: 3, right: 3, width: 14, height: 14, borderRadius: '50%', background: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                  >✓</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* BOTTOM CAPTION */}
      <AnimatePresence>
        {phase >= 7 && (
          <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(0deg, rgba(13,11,18,0.98) 70%, transparent)', padding: '20px 16px 14px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(16px,5vw,26px)', color: '#fff', letterSpacing: '0.06em', lineHeight: 1.1 }}>
              CHAT · PHOTOS · VIDEOS · <span style={{ color: '#F39C12' }}>LUXURY & EROTIC GIFTS</span>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>50 real gifts · from 1 ST = €0.01 · biggest = Lamborghini 30,000 ST = €300</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              {[{ icon: '📹', label: 'Video call', c: 'rgba(192,57,43,0.4)' }, { icon: '📞', label: 'Voice call', c: 'rgba(39,174,96,0.4)' }].map(({ icon, label, c }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: c, borderRadius: 20, padding: '3px 10px', border: `1px solid ${c.replace('0.4','0.6')}` }}>
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{label} · Web &amp; App</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

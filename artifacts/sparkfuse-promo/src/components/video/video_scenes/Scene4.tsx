import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── Gift definitions ─── */
const GIFT_DEFS = {
  small:  { emoji: '🌹', label: 'Rose',    st: 10,  color: '#e74c3c' },
  medium: { emoji: '💎', label: 'Diamond', st: 50,  color: '#3498db' },
  large:  { emoji: '👑', label: 'Crown',   st: 200, color: '#F39C12' },
};

type GiftSize = 'small' | 'medium' | 'large';

interface BubbleItem {
  id: number;
  type: 'msg' | 'gift' | 'media';
  from: 'them' | 'me';
  text?: string;
  giftSize?: GiftSize;
  emoji?: string;
  locked?: boolean;
}

/* ─── Particle burst for DM gift ─── */
const PCOUNTS  = { small: 8,  medium: 16, large: 26 };
const PRADIUS  = { small: 60, medium: 95, large: 140 };
const PEMOJI   = { small: 32, medium: 52, large: 80 };

function DmGiftBurst({ size, onDone }: { size: GiftSize; onDone: () => void }) {
  const count  = PCOUNTS[size];
  const radius = PRADIUS[size];
  const emojiSz = PEMOJI[size];
  const def    = GIFT_DEFS[size];

  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i;
    const r = radius * (0.8 + Math.random() * 0.35);
    const rad = (angle * Math.PI) / 180;
    return {
      tx: Math.cos(rad) * r,
      ty: -Math.sin(rad) * r,
      color: i % 3 === 0 ? '#F39C12' : i % 3 === 1 ? '#C0392B' : '#fff',
      s: 4 + Math.random() * 7,
    };
  });

  useEffect(() => {
    const t = setTimeout(onDone, size === 'large' ? 2000 : size === 'medium' ? 1600 : 1200);
    return () => clearTimeout(t);
  }, [size, onDone]);

  return (
    <motion.div
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
    >
      {/* Large gift flash */}
      {size === 'large' && (
        <motion.div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${def.color}44 0%, transparent 70%)`,
        }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 0] }}
          transition={{ duration: 0.8, times: [0, 0.15, 0.4, 1] }}
        />
      )}

      {/* Ring pulse */}
      {size !== 'small' && (
        <motion.div style={{
          position: 'absolute',
          border: `3px solid ${def.color}`,
          borderRadius: '50%',
        }}
          initial={{ width: emojiSz, height: emojiSz, opacity: 0.9 }}
          animate={{ width: radius * 2.4, height: radius * 2.4, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}
      {size === 'large' && (
        <motion.div style={{
          position: 'absolute',
          border: `2px solid rgba(243,156,18,0.5)`,
          borderRadius: '50%',
        }}
          initial={{ width: emojiSz, height: emojiSz, opacity: 0.6 }}
          animate={{ width: radius * 3.2, height: radius * 3.2, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: p.s, height: p.s, borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${p.s * 2}px ${p.color}88`,
        }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.75, delay: 0.04, ease: 'easeOut' }}
        />
      ))}

      {/* Main emoji — big pop */}
      <motion.div style={{
        fontSize: emojiSz, lineHeight: 1, position: 'relative', zIndex: 10,
        filter: size === 'large'
          ? 'drop-shadow(0 0 24px rgba(243,156,18,1))'
          : size === 'medium'
          ? 'drop-shadow(0 0 14px rgba(52,152,219,0.8))'
          : 'drop-shadow(0 0 8px rgba(231,76,60,0.7))',
      }}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, size === 'large' ? 1.8 : size === 'medium' ? 1.4 : 1.15, 1], opacity: [0, 1, 1], rotate: [−20, 10, 0] }}
        transition={{ duration: 0.55, ease: [0.175, 0.885, 0.32, 1.5] }}
      >{def.emoji}</motion.div>

      {/* ST badge */}
      <motion.div style={{
        marginTop: 14, background: 'rgba(0,0,0,0.75)',
        borderRadius: 20, padding: '4px 14px',
        border: `1px solid ${def.color}88`,
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: size === 'large' ? 22 : 17,
        color: def.color, letterSpacing: '0.08em',
        textShadow: `0 0 12px ${def.color}`,
        zIndex: 10,
      }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >+{def.st} ST</motion.div>

      {/* Label */}
      <motion.div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.65)',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, zIndex: 10,
      }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      >{def.label} Gift</motion.div>

      {/* Floating copies drift upward */}
      {Array.from({ length: size === 'large' ? 5 : size === 'medium' ? 3 : 2 }, (_, i) => (
        <motion.div key={i} style={{
          position: 'absolute', fontSize: emojiSz * 0.5,
          left: `${35 + i * 8}%`,
        }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -(80 + i * 30), opacity: [0, 0.7, 0] }}
          transition={{ delay: 0.3 + i * 0.12, duration: 1.0, ease: 'easeOut' }}
        >{def.emoji}</motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Chat bubble ─── */
function Bubble({ item }: { item: BubbleItem }) {
  const isMe = item.from === 'me';

  if (item.type === 'gift') {
    const def = GIFT_DEFS[item.giftSize!];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        style={{
          display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
          marginBottom: 2,
        }}
      >
        <div style={{
          background: `linear-gradient(135deg, ${def.color}20, ${def.color}10)`,
          border: `1px solid ${def.color}55`,
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8, maxWidth: '75%',
        }}>
          <span style={{ fontSize: 22 }}>{def.emoji}</span>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: def.color, letterSpacing: '0.06em' }}>
              {def.label} Gift
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              +{def.st} ST
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (item.type === 'media') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
      >
        <div style={{
          width: 100, height: 70, borderRadius: 12, overflow: 'hidden', position: 'relative',
          background: 'rgba(20,14,28,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 24 }}>{item.emoji}</span>
          {item.locked && (
            <div style={{
              position: 'absolute', inset: 0, backdropFilter: 'blur(4px)',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#F39C12' }}>30 ST</div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 14 : -14, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
    >
      <div style={{
        background: isMe
          ? 'linear-gradient(135deg, rgba(192,57,43,0.85), rgba(160,40,25,0.9))'
          : 'rgba(26,22,37,0.95)',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '8px 12px', maxWidth: '78%',
        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: isMe ? '#fff' : 'rgba(255,255,255,0.85)' }}>
          {item.text}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Main Scene ─── */
export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [activeBurst, setActiveBurst] = useState<GiftSize | null>(null);
  const [earnings, setEarnings] = useState(0);
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (item: Omit<BubbleItem, 'id'>) => {
    setBubbles(prev => [...prev.slice(-8), { ...item, id: nextId.current++ }]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const sendGift = (size: GiftSize) => {
    push({ type: 'gift', from: 'me', giftSize: size });
    setActiveBurst(size);
    setEarnings(prev => prev + GIFT_DEFS[size].st);
  };

  useEffect(() => {
    const T = [
      setTimeout(() => { setPhase(1); push({ type: 'msg', from: 'them', text: 'Hey 😍 your profile is amazing!' }); }, 200),
      setTimeout(() => { push({ type: 'msg', from: 'me',   text: 'Thank you! 🔥 Want to see more?' }); }, 750),
      setTimeout(() => { push({ type: 'media', from: 'me', emoji: '📸', locked: false }); }, 1200),
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'Gorgeous! Can I see your premium content?' }); setPhase(2); }, 1700),
      setTimeout(() => { push({ type: 'media', from: 'me', emoji: '🎬', locked: true }); }, 2100),

      // SMALL gift
      setTimeout(() => { setPhase(3); sendGift('small'); }, 2550),

      // Medium gift
      setTimeout(() => { setPhase(4); push({ type: 'msg', from: 'them', text: 'You are literally the best 💙' }); }, 3500),
      setTimeout(() => { sendGift('medium'); }, 3900),

      // LARGE gift
      setTimeout(() => { setPhase(5); sendGift('large'); }, 4900),

      setTimeout(() => setPhase(6), 5800),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(192,57,43,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Gift burst overlay */}
      <AnimatePresence>
        {activeBurst && (
          <DmGiftBurst
            key={activeBurst + earnings}
            size={activeBurst}
            onDone={() => setActiveBurst(null)}
          />
        )}
      </AnimatePresence>

      {/* ── TOP BAR: Header ── */}
      <motion.div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 20, flexShrink: 0,
      }}
        initial={{ opacity: 0, y: -12 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: 0.4 }}
      >
        {/* "Partner" avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8e44ad, #3498db)',
            border: '2px solid rgba(52,152,219,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>👩</div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
            borderRadius: '50%', background: '#27ae60', border: '2px solid #0D0B12',
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#fff', fontWeight: 600 }}>Julia R.</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#27ae60' }}>● online now</div>
        </div>
        {/* Earnings badge */}
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div
              key={earnings}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'rgba(243,156,18,0.15)', borderRadius: 20, padding: '3px 9px',
                border: '1px solid rgba(243,156,18,0.4)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#F39C12' }}>
                +{earnings} ST
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── CHAT BUBBLES ── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'hidden', padding: '10px 12px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {bubbles.map(b => <Bubble key={b.id} item={b} />)}
        </AnimatePresence>
      </div>

      {/* ── GIFT BUTTONS ── */}
      <motion.div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0, position: 'relative', zIndex: 20,
      }}
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7, textAlign: 'center',
        }}>Send a Gift</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['small', 'medium', 'large'] as const).map((size) => {
            const def = GIFT_DEFS[size];
            const isSent = (
              (size === 'small'  && phase >= 3) ||
              (size === 'medium' && phase >= 4) ||
              (size === 'large'  && phase >= 5)
            );
            return (
              <motion.div key={size} style={{
                flex: 1, borderRadius: 14, padding: '9px 6px', textAlign: 'center',
                background: isSent
                  ? `linear-gradient(135deg, ${def.color}28, ${def.color}18)`
                  : 'rgba(20,16,30,0.9)',
                border: `1px solid ${isSent ? def.color + '70' : 'rgba(255,255,255,0.08)'}`,
                position: 'relative', overflow: 'hidden',
              }}
                animate={isSent
                  ? { scale: [1, 1.12, 1], boxShadow: [`0 0 0px ${def.color}00`, `0 0 20px ${def.color}55`, `0 0 0px ${def.color}00`] }
                  : { scale: 1 }
                }
                transition={isSent ? { duration: 0.4 } : {}}
              >
                <div style={{ fontSize: size === 'large' ? 26 : size === 'medium' ? 22 : 18 }}>{def.emoji}</div>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: 11,
                  color: isSent ? def.color : 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.04em', marginTop: 3,
                }}>{def.label}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  {def.st} ST
                </div>
                {isSent && (
                  <motion.div style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 13, height: 13, borderRadius: '50%',
                    background: '#27ae60',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, color: '#fff', fontWeight: 700,
                  }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                  >✓</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── BOTTOM CAPTION ── */}
      <AnimatePresence>
        {phase >= 6 && (
          <motion.div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
            background: 'linear-gradient(0deg, rgba(13,11,18,0.98) 70%, transparent)',
            padding: '20px 16px 14px',
            textAlign: 'center',
          }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(20px, 6vw, 30px)', color: '#fff', letterSpacing: '0.06em', lineHeight: 1.1 }}>
              GIFTS IN CHAT — <span style={{ color: '#F39C12' }}>REAL MONEY</span>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
              Small · Medium · Large · All convert to cash
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

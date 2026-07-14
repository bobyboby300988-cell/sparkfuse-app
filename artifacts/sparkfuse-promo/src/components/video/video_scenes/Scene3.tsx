import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── Types ─── */
interface Gift {
  id: number;
  size: 'small' | 'medium' | 'large';
  emoji: string;
  label: string;
  st: number;
  x: number; // % from left for float path
}

interface ChatMsg {
  id: number;
  user: string;
  text: string;
  color: string;
  isGift?: boolean;
  giftEmoji?: string;
}

/* ─── Gift config ─── */
const GIFT_DEFS = {
  small:  { emoji: '🌸', label: 'Rose',    st: 5   },
  medium: { emoji: '💎', label: 'Diamond', st: 50  },
  large:  { emoji: '👑', label: 'Crown',   st: 200 },
};

const USER_COLORS = ['#F39C12', '#C0392B', '#e74c3c', '#f1c40f', '#e67e22'];

/* ─── Particle configs per gift size ─── */
const PARTICLE_COUNT = { small: 7, medium: 14, large: 22 };
const PARTICLE_RADIUS = { small: 55, medium: 90, large: 130 };
const EMOJI_SIZE = { small: 44, medium: 68, large: 100 };

/* ─── Particle burst component ─── */
function GiftBurst({ gift, onDone }: { gift: Gift; onDone: () => void }) {
  const count = PARTICLE_COUNT[gift.size];
  const radius = PARTICLE_RADIUS[gift.size];
  const size = EMOJI_SIZE[gift.size];
  const particles = Array.from({ length: count }, (_, i) => ({
    angle: (360 / count) * i,
    r: radius * (0.8 + Math.random() * 0.4),
    color: i % 3 === 0 ? '#F39C12' : i % 3 === 1 ? '#C0392B' : '#fff',
    s: 4 + Math.random() * 6,
  }));

  useEffect(() => {
    const t = setTimeout(onDone, gift.size === 'large' ? 1800 : gift.size === 'medium' ? 1400 : 1100);
    return () => clearTimeout(t);
  }, [gift.size, onDone]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${gift.x}%`,
        bottom: '28%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Flash for large */}
      {gift.size === 'large' && (
        <motion.div style={{
          position: 'fixed', inset: 0, background: 'rgba(243,156,18,0.22)',
          zIndex: 35, pointerEvents: 'none',
        }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, times: [0, 0.2, 1] }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.r;
        const ty = -Math.sin(rad) * p.r;
        return (
          <motion.div key={i} style={{
            position: 'absolute',
            width: p.s, height: p.s,
            borderRadius: '50%',
            background: p.color,
            top: '50%', left: '50%',
            marginLeft: -p.s / 2, marginTop: -p.s / 2,
            boxShadow: `0 0 ${p.s * 2}px ${p.color}`,
          }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.7, delay: 0.05, ease: 'easeOut' }}
          />
        );
      })}

      {/* Ring for large */}
      {gift.size !== 'small' && (
        <motion.div style={{
          position: 'absolute',
          border: `3px solid ${gift.size === 'large' ? '#F39C12' : '#C0392B'}`,
          borderRadius: '50%',
          top: '50%', left: '50%',
        }}
          initial={{ width: size * 0.8, height: size * 0.8, x: '-50%', y: '-50%', opacity: 0.9 }}
          animate={{ width: radius * 2.2, height: radius * 2.2, x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      )}

      {/* Main emoji */}
      <motion.div style={{
        fontSize: size,
        lineHeight: 1,
        filter: gift.size === 'large' ? 'drop-shadow(0 0 20px rgba(243,156,18,0.9))' : gift.size === 'medium' ? 'drop-shadow(0 0 10px rgba(192,57,43,0.7))' : undefined,
        zIndex: 41,
        position: 'relative',
      }}
        initial={{ scale: 0.2, opacity: 0, y: 0 }}
        animate={{ scale: [0.2, gift.size === 'large' ? 1.6 : gift.size === 'medium' ? 1.3 : 1.1, 1.0], opacity: [0, 1, 1], y: [0, -10, 0] }}
        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
      >{gift.emoji}</motion.div>

      {/* ST label */}
      <motion.div style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: gift.size === 'large' ? 20 : 15,
        color: '#F39C12',
        letterSpacing: '0.06em',
        marginTop: 6,
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 20,
        padding: '2px 10px',
      }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >+{gift.st} ST</motion.div>

      {/* Float up and away */}
      <motion.div style={{ fontSize: size * 0.55, position: 'absolute', top: 0 }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: -140, opacity: [0, 0.6, 0] }}
        transition={{ delay: 0.4, duration: 1.1, ease: 'easeOut' }}
      >{gift.emoji}</motion.div>
    </motion.div>
  );
}

/* ─── Floating hearts in stream ─── */
const HEARTS = Array.from({ length: 12 }, (_, i) => ({
  id: i, x: 15 + Math.random() * 70, delay: i * 0.4, dur: 2.2 + Math.random() * 1.5, emoji: ['❤️','💛','🧡','💜'][i % 4],
}));

/* ─── Main Scene ─── */
export function Scene3() {
  const [phase, setPhase] = useState(0);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [viewers, setViewers] = useState(1241);
  const nextId = useRef(0);

  const addMsg = (msg: Omit<ChatMsg, 'id'>) =>
    setChatMsgs(prev => [...prev.slice(-5), { ...msg, id: nextId.current++ }]);

  const sendGift = (size: 'small' | 'medium' | 'large') => {
    const def = GIFT_DEFS[size];
    const g: Gift = { id: nextId.current++, size, ...def, x: 30 + Math.random() * 40 };
    setGifts(prev => [...prev, g]);
    setEarnings(prev => prev + def.st);
    setViewers(prev => prev + (size === 'large' ? 120 : size === 'medium' ? 40 : 10));
  };

  const removeGift = (id: number) =>
    setGifts(prev => prev.filter(g => g.id !== id));

  useEffect(() => {
    const T = [
      // phase 1 — stream comes online
      setTimeout(() => setPhase(1), 100),

      // chat warms up
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex', text: 'Omg you\'re gorgeous! 😍', color: USER_COLORS[0] }); }, 600),
      setTimeout(() => addMsg({ user: 'Mia', text: 'Your eyes are everything ✨', color: USER_COLORS[1] }), 1000),

      // SMALL gift — Rose
      setTimeout(() => { setPhase(3); sendGift('small'); addMsg({ user: 'Carlos', text: 'Sent a Rose 🌸', color: USER_COLORS[2], isGift: true, giftEmoji: '🌸' }); }, 1400),
      setTimeout(() => addMsg({ user: 'Sam', text: 'Love watching you live! 🔥', color: USER_COLORS[3] }), 1900),

      // MEDIUM gift — Diamond
      setTimeout(() => { setPhase(4); sendGift('medium'); addMsg({ user: 'Luna', text: 'Sent a Diamond 💎', color: USER_COLORS[4], isGift: true, giftEmoji: '💎' }), setViewers(v => v + 55); }, 2300),

      // LARGE gift — Crown
      setTimeout(() => { setPhase(5); sendGift('large'); addMsg({ user: 'Marcus', text: 'Sent a CROWN 👑 !!', color: '#F39C12', isGift: true, giftEmoji: '👑' }); }, 3100),

      // Withdraw step
      setTimeout(() => { setPhase(6); setShowWithdraw(true); }, 3900),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  const totalST = earnings;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Background glow ── */}
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(192,57,43,0.28) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* ── TOP: Live header ── */}
      <motion.div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.4 }}
      >
        {/* LIVE badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#C0392B', borderRadius: 40, padding: '4px 10px',
          boxShadow: '0 0 14px rgba(192,57,43,0.7)',
        }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
          />
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#fff', letterSpacing: '0.12em' }}>LIVE</span>
        </div>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <motion.div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #C0392B, #F39C12)',
            border: '2px solid rgba(243,156,18,0.6)',
          }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0)', '0 0 12px rgba(243,156,18,0.7)', '0 0 0px rgba(243,156,18,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#fff', fontWeight: 600 }}>Sarah M.</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>is live</div>
          </div>
        </div>

        {/* Viewer count */}
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 8px' }}
          animate={{ scale: viewers > 1241 ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.3 }}
          key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#fff', letterSpacing: '0.04em' }}>
            {viewers.toLocaleString()}
          </span>
        </motion.div>
      </motion.div>

      {/* ── MIDDLE: Stream video area ── */}
      <motion.div style={{
        margin: '0 12px', borderRadius: 16, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(180deg, #2a1025 0%, #1a0d1f 100%)',
        border: '1px solid rgba(192,57,43,0.25)',
        flex: '0 0 auto',
        height: '34%',
      }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        {/* Ambient glow */}
        <motion.div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(192,57,43,0.2) 0%, transparent 70%)',
        }}
          animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* "Camera on" — streamer avatar */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C0392B 0%, #F39C12 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, position: 'relative',
            boxShadow: '0 0 0 3px rgba(243,156,18,0.3)',
          }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0.2)', '0 0 22px rgba(243,156,18,0.6)', '0 0 0px rgba(243,156,18,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            👩‍🦰
            {/* Camera dot */}
            <motion.div style={{
              position: 'absolute', top: -2, right: -2, width: 12, height: 12,
              borderRadius: '50%', background: '#C0392B', border: '2px solid #0D0B12',
            }}
              animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.div>

          {/* "On camera" tag */}
          <motion.div style={{
            fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}
            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          >● streaming live</motion.div>
        </div>

        {/* Floating hearts from fans */}
        {phase >= 2 && HEARTS.map(h => (
          <motion.div key={h.id} style={{
            position: 'absolute', bottom: -10, left: `${h.x}%`, fontSize: 14, pointerEvents: 'none', zIndex: 5,
          }}
            animate={{ y: [0, -130], opacity: [0, 1, 0], scale: [0.6, 1, 0.7] }}
            transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'easeOut', repeatDelay: 2 }}
          >{h.emoji}</motion.div>
        ))}

        {/* Large gift flash overlay */}
        <AnimatePresence>
          {gifts.filter(g => g.size === 'large').map(g => (
            <motion.div key={g.id} style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse, rgba(243,156,18,0.5) 0%, transparent 70%)',
              zIndex: 8, pointerEvents: 'none',
            }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.7 }}
            />
          ))}
        </AnimatePresence>

        {/* ST earned ribbon */}
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '3px 9px',
              border: '1px solid rgba(243,156,18,0.4)', zIndex: 10,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              key={earnings}
            >
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#F39C12', letterSpacing: '0.04em' }}>
                +{earnings} ST
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Gift burst animations (over stream) ── */}
      <AnimatePresence>
        {gifts.map(g => (
          <GiftBurst key={g.id} gift={g} onDone={() => removeGift(g.id)} />
        ))}
      </AnimatePresence>

      {/* ── CHAT FEED ── */}
      <motion.div style={{
        flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 5,
        position: 'relative', zIndex: 10, overflow: 'hidden',
      }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {chatMsgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                background: msg.isGift ? 'rgba(243,156,18,0.1)' : 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '5px 8px',
                border: msg.isGift ? '1px solid rgba(243,156,18,0.3)' : 'none',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: msg.color, marginTop: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif',
              }}>{msg.user[0]}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: msg.color, fontWeight: 700 }}>
                  {msg.user}{msg.giftEmoji ? ' ' + msg.giftEmoji : ''}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: msg.isGift ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)', marginLeft: 4 }}>
                  {msg.text}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── GIFT BUTTONS ── */}
      <motion.div style={{
        padding: '0 12px 8px', display: 'flex', gap: 7, position: 'relative', zIndex: 10,
      }}
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4 }}
      >
        {(['small', 'medium', 'large'] as const).map((size, i) => {
          const def = GIFT_DEFS[size];
          const colors = {
            small:  { bg: 'rgba(255,182,193,0.12)', border: 'rgba(255,182,193,0.3)', label: 'rgba(255,200,210,0.8)' },
            medium: { bg: 'rgba(52,152,219,0.12)',  border: 'rgba(52,152,219,0.3)',  label: 'rgba(100,180,255,0.9)' },
            large:  { bg: 'rgba(243,156,18,0.18)',  border: 'rgba(243,156,18,0.5)',  label: '#F39C12' },
          }[size];
          const isSent = (
            (size === 'small'  && phase >= 3) ||
            (size === 'medium' && phase >= 4) ||
            (size === 'large'  && phase >= 5)
          );
          return (
            <motion.div key={size} style={{
              flex: 1, borderRadius: 13, padding: '8px 6px', textAlign: 'center',
              background: isSent ? `${colors.bg.replace('0.12', '0.28').replace('0.18', '0.35')}` : colors.bg,
              border: `1px solid ${isSent ? colors.border.replace('0.3', '0.7').replace('0.5', '0.9') : colors.border}`,
              position: 'relative', overflow: 'hidden',
            }}
              animate={isSent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={isSent ? { duration: 0.3 } : {}}
            >
              {isSent && (
                <motion.div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse, ${colors.border.replace('0.3', '0.2').replace('0.5', '0.3')} 0%, transparent 70%)`,
                }}
                  animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6 }}
                />
              )}
              <div style={{ fontSize: i === 2 ? 24 : i === 1 ? 20 : 16 }}>{def.emoji}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, color: colors.label, letterSpacing: '0.04em', marginTop: 2 }}>
                {def.label}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                {def.st} ST
              </div>
              {isSent && (
                <motion.div style={{
                  position: 'absolute', top: 3, right: 3,
                  background: '#27ae60', borderRadius: '50%', width: 12, height: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7,
                }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >✓</motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── WITHDRAW STEP ── */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(13,11,18,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 14, backdropFilter: 'blur(6px)',
          }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Earnings summary */}
            <motion.div style={{ textAlign: 'center' }}
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            >
              <div style={{ fontSize: 40 }}>💰</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(26px, 7vw, 38px)', color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>
                YOU EARNED
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(44px, 12vw, 62px)', color: '#F39C12', letterSpacing: '0.06em', lineHeight: 1 }}>
                {totalST} ST
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                from this live session
              </div>
            </motion.div>

            {/* Withdraw box */}
            <motion.div style={{
              width: '82%', background: 'rgba(26,22,37,0.95)', borderRadius: 18,
              border: '1px solid rgba(243,156,18,0.4)', padding: '16px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🏦</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: '#F39C12', letterSpacing: '0.08em' }}>
                  CASH OUT
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Your ST balance</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#fff' }}>{totalST} ST</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>You receive</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#27ae60' }}>
                    €{((totalST / 100) * 0.9).toFixed(2)}
                  </div>
                </div>
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
              }}>
                <span style={{ fontSize: 11 }}>ℹ️</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                  10% platform fee deducted on withdrawal
                </span>
              </div>
              <motion.div style={{
                background: 'linear-gradient(90deg, #27ae60, #2ecc71)', borderRadius: 12, padding: '11px 0',
                textAlign: 'center', boxShadow: '0 4px 16px rgba(39,174,96,0.4)',
              }}
                animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 17, color: '#fff', letterSpacing: '0.12em' }}>
                  WITHDRAW TO BANK
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

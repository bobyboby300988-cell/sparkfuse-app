import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface Gift {
  id: number;
  size: 'small' | 'medium' | 'large' | 'mega';
  emoji: string;
  label: string;
  st: number;
  x: number;
}

interface ChatMsg {
  id: number;
  user: string;
  text: string;
  color: string;
  isGift?: boolean;
  giftEmoji?: string;
}

const GIFT_DEFS = {
  small:  { emoji: '🌸', label: 'Rose',     st: 5   },
  medium: { emoji: '💎', label: 'Diamond',  st: 50  },
  large:  { emoji: '👑', label: 'Crown',    st: 200 },
  mega:   { emoji: '🌟', label: 'Star',     st: 500 },
};

const USER_COLORS = ['#F39C12','#C0392B','#e74c3c','#f1c40f','#e67e22','#9b59b6','#3498db'];

const PARTICLE_COUNT  = { small: 8,  medium: 16, large: 24, mega: 36 };
const PARTICLE_RADIUS = { small: 60, medium: 100, large: 140, mega: 190 };
const EMOJI_SIZE      = { small: 46, medium: 70,  large: 108, mega: 140 };

function GiftBurst({ gift, onDone }: { gift: Gift; onDone: () => void }) {
  const count  = PARTICLE_COUNT[gift.size];
  const radius = PARTICLE_RADIUS[gift.size];
  const size   = EMOJI_SIZE[gift.size];

  const particles = Array.from({ length: count }, (_, i) => ({
    angle: (360 / count) * i + Math.random() * 15,
    r: radius * (0.75 + Math.random() * 0.5),
    color: i % 4 === 0 ? '#F39C12' : i % 4 === 1 ? '#C0392B' : i % 4 === 2 ? '#fff' : '#e74c3c',
    s: 4 + Math.random() * (gift.size === 'mega' ? 10 : 6),
  }));

  useEffect(() => {
    const durations = { small: 1100, medium: 1500, large: 1900, mega: 2400 };
    const t = setTimeout(onDone, durations[gift.size]);
    return () => clearTimeout(t);
  }, [gift.size, onDone]);

  const isMega  = gift.size === 'mega';
  const isLarge = gift.size === 'large';

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${gift.x}%`,
        bottom: '26%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Full-screen flash for mega/large */}
      {(isMega || isLarge) && (
        <motion.div style={{
          position: 'fixed', inset: 0, zIndex: 35, pointerEvents: 'none',
          background: isMega
            ? 'radial-gradient(ellipse, rgba(243,156,18,0.45) 0%, transparent 70%)'
            : 'rgba(243,156,18,0.2)',
        }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: isMega ? 0.8 : 0.5, times: [0, 0.25, 1] }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
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
            animate={{ x: Math.cos(rad) * p.r, y: -Math.sin(rad) * p.r, opacity: 0, scale: 0.2 }}
            transition={{ duration: isMega ? 0.9 : 0.7, delay: 0.04 + i * 0.01, ease: 'easeOut' }}
          />
        );
      })}

      {/* Expanding rings */}
      {(isMega || isLarge || gift.size === 'medium') && [1, 2, ...(isMega ? [3] : [])].map(ring => (
        <motion.div key={ring} style={{
          position: 'absolute',
          border: `${isMega ? 4 : 3}px solid ${isMega ? '#F39C12' : isLarge ? '#F39C12' : '#C0392B'}`,
          borderRadius: '50%',
          top: '50%', left: '50%',
        }}
          initial={{ width: size * 0.6, height: size * 0.6, x: '-50%', y: '-50%', opacity: 0.9 }}
          animate={{ width: radius * (1.8 + ring * 0.4), height: radius * (1.8 + ring * 0.4), x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.7 + ring * 0.1, delay: ring * 0.1, ease: 'easeOut' }}
        />
      ))}

      {/* Main emoji */}
      <motion.div style={{
        fontSize: size, lineHeight: 1, zIndex: 41, position: 'relative',
        filter: isMega
          ? 'drop-shadow(0 0 30px rgba(243,156,18,1))'
          : isLarge
          ? 'drop-shadow(0 0 20px rgba(243,156,18,0.9))'
          : gift.size === 'medium'
          ? 'drop-shadow(0 0 10px rgba(192,57,43,0.7))'
          : undefined,
      }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{
          scale: [0.1, isMega ? 2.0 : isLarge ? 1.6 : gift.size === 'medium' ? 1.3 : 1.1, 1.0],
          opacity: [0, 1, 1],
          y: [0, isMega ? -20 : -10, 0],
        }}
        transition={{ duration: 0.55, ease: [0.175, 0.885, 0.32, 1.275] }}
      >{gift.emoji}</motion.div>

      {/* ST label */}
      <motion.div style={{
        fontFamily: 'Bebas Neue',
        fontSize: isMega ? 24 : isLarge ? 20 : 15,
        color: isMega ? '#F39C12' : '#fff',
        letterSpacing: '0.06em', marginTop: 8,
        textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        background: isMega ? 'rgba(243,156,18,0.25)' : 'rgba(0,0,0,0.6)',
        borderRadius: 20, padding: '3px 12px',
        border: isMega ? '1px solid rgba(243,156,18,0.5)' : 'none',
      }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >+{gift.st} ST</motion.div>

      {/* Float-up ghost */}
      <motion.div style={{ fontSize: size * 0.5, position: 'absolute', top: 0 }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: isMega ? -200 : -150, opacity: [0, 0.7, 0] }}
        transition={{ delay: 0.35, duration: isMega ? 1.4 : 1.1, ease: 'easeOut' }}
      >{gift.emoji}</motion.div>
    </motion.div>
  );
}

const HEARTS = Array.from({ length: 14 }, (_, i) => ({
  id: i, x: 12 + Math.random() * 76, delay: i * 0.35, dur: 2.0 + Math.random() * 1.8,
  emoji: ['❤️','💛','🧡','💜','💗','💝'][i % 6],
}));

export function Scene3() {
  const [phase,       setPhase]       = useState(0);
  const [gifts,       setGifts]       = useState<Gift[]>([]);
  const [chatMsgs,    setChatMsgs]    = useState<ChatMsg[]>([]);
  const [earnings,    setEarnings]    = useState(0);
  const [showWithdraw,setShowWithdraw]= useState(false);
  const [viewers,     setViewers]     = useState(1241);
  const nextId = useRef(0);

  const addMsg = (msg: Omit<ChatMsg,'id'>) =>
    setChatMsgs(prev => [...prev.slice(-6), { ...msg, id: nextId.current++ }]);

  const sendGift = (size: 'small'|'medium'|'large'|'mega') => {
    const def = GIFT_DEFS[size];
    const g: Gift = { id: nextId.current++, size, ...def, x: 28 + Math.random() * 44 };
    setGifts(prev => [...prev, g]);
    setEarnings(prev => prev + def.st);
    setViewers(prev => prev + (size === 'mega' ? 350 : size === 'large' ? 120 : size === 'medium' ? 40 : 12));
  };

  const removeGift = (id: number) => setGifts(prev => prev.filter(g => g.id !== id));

  useEffect(() => {
    const T = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex', text: 'OMG you look amazing 😍', color: USER_COLORS[0] }); }, 700),
      setTimeout(() => addMsg({ user: 'Mia',  text: 'Your eyes are everything ✨', color: USER_COLORS[1] }), 1300),
      setTimeout(() => addMsg({ user: 'Jake', text: 'First time watching — love it!', color: USER_COLORS[2] }), 1900),

      // 🌸 Rose (5 ST)
      setTimeout(() => { setPhase(3); sendGift('small'); addMsg({ user: 'Carlos', text: 'Sent a Rose 🌸', color: USER_COLORS[2], isGift: true, giftEmoji: '🌸' }); }, 2500),
      setTimeout(() => addMsg({ user: 'Sam', text: 'Keep streaming! 🔥', color: USER_COLORS[3] }), 3300),

      // 💎 Diamond (50 ST)
      setTimeout(() => { setPhase(4); sendGift('medium'); addMsg({ user: 'Luna', text: 'Sent a Diamond 💎 wow!', color: USER_COLORS[4], isGift: true, giftEmoji: '💎' }); }, 4200),
      setTimeout(() => addMsg({ user: 'Ryan', text: 'Can\'t stop watching 👀', color: USER_COLORS[5] }), 5200),

      // 👑 Crown (200 ST)
      setTimeout(() => { setPhase(5); sendGift('large'); addMsg({ user: 'Marcus', text: '👑 CROWN for the queen!!', color: '#F39C12', isGift: true, giftEmoji: '👑' }); }, 6200),
      setTimeout(() => addMsg({ user: 'Sofia', text: 'She deserves it 🥰', color: USER_COLORS[6] }), 7400),

      // 🌟 MEGA STAR (500 ST) — biggest gift!
      setTimeout(() => {
        setPhase(6);
        sendGift('mega');
        addMsg({ user: '⭐ VIP Tyler', text: '🌟🌟 MEGA STAR — you\'re the BEST! 🌟🌟', color: '#F39C12', isGift: true, giftEmoji: '🌟' });
      }, 8800),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '🔥🔥🔥🔥🔥 WOW!!!!', color: '#e74c3c' }), 9800),

      // Withdraw overlay
      setTimeout(() => { setPhase(7); setShowWithdraw(true); }, 11200),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(192,57,43,0.28) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }} />

      {/* ── LIVE Header ── */}
      <motion.div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#C0392B', borderRadius: 40, padding: '4px 10px',
          boxShadow: '0 0 14px rgba(192,57,43,0.7)',
        }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
          />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff', letterSpacing: '0.12em' }}>LIVE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <motion.div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #C0392B, #F39C12)',
            border: '2px solid rgba(243,156,18,0.6)',
          }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0)', '0 0 14px rgba(243,156,18,0.8)', '0 0 0px rgba(243,156,18,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#fff', fontWeight: 600 }}>Sarah M.</div>
            <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>is live</div>
          </div>
        </div>

        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 9px' }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.3 }} key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff', letterSpacing: '0.04em' }}>
            {viewers.toLocaleString()}
          </span>
        </motion.div>
      </motion.div>

      {/* ── Stream video area ── */}
      <motion.div style={{
        margin: '0 12px', borderRadius: 16, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(180deg, #2a1025 0%, #1a0d1f 100%)',
        border: '1px solid rgba(192,57,43,0.25)', flex: '0 0 auto', height: '33%',
      }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <motion.div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(192,57,43,0.2) 0%, transparent 70%)',
        }} animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C0392B 0%, #F39C12 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, position: 'relative',
          }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0.2)', '0 0 24px rgba(243,156,18,0.7)', '0 0 0px rgba(243,156,18,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            👩‍🦰
            <motion.div style={{
              position: 'absolute', top: -2, right: -2, width: 13, height: 13,
              borderRadius: '50%', background: '#C0392B', border: '2px solid #0D0B12',
            }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          </motion.div>
          <motion.div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}
            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          >● streaming live</motion.div>
        </div>

        {phase >= 2 && HEARTS.map(h => (
          <motion.div key={h.id} style={{
            position: 'absolute', bottom: -10, left: `${h.x}%`, fontSize: 13, pointerEvents: 'none', zIndex: 5,
          }}
            animate={{ y: [0, -140], opacity: [0, 1, 0], scale: [0.6, 1, 0.7] }}
            transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'easeOut', repeatDelay: 2.5 }}
          >{h.emoji}</motion.div>
        ))}

        {/* Earnings ribbon */}
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.75)', borderRadius: 20, padding: '3px 10px',
              border: '1px solid rgba(243,156,18,0.5)', zIndex: 10,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={earnings}
            >
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#F39C12', letterSpacing: '0.04em' }}>
                +{earnings} ST
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Gift bursts */}
      <AnimatePresence>
        {gifts.map(g => (
          <GiftBurst key={g.id} gift={g} onDone={() => removeGift(g.id)} />
        ))}
      </AnimatePresence>

      {/* ── Chat Feed ── */}
      <motion.div style={{
        flex: 1, padding: '6px 12px', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', gap: 4, position: 'relative', zIndex: 10, overflow: 'hidden',
      }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {chatMsgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, x: -20, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                background: msg.isGift ? 'rgba(243,156,18,0.12)' : 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '5px 8px',
                border: msg.isGift ? '1px solid rgba(243,156,18,0.35)' : 'none',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: msg.color, marginTop: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Inter',
              }}>{msg.user[0]}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: msg.color, fontWeight: 700 }}>
                  {msg.user}{msg.giftEmoji ? ' ' + msg.giftEmoji : ''}
                </span>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: msg.isGift ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', marginLeft: 4 }}>
                  {msg.text}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Gift Buttons ── */}
      <motion.div style={{ padding: '0 10px 8px', display: 'flex', gap: 6, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4 }}
      >
        {(['small','medium','large','mega'] as const).map((size, i) => {
          const def = GIFT_DEFS[size];
          const phaseNeeded = [3, 4, 5, 6][i];
          const isSent = phase >= phaseNeeded;
          const colors = {
            small:  { bg: 'rgba(255,182,193,0.12)', border: 'rgba(255,182,193,0.3)', label: 'rgba(255,200,210,0.9)' },
            medium: { bg: 'rgba(52,152,219,0.12)',  border: 'rgba(52,152,219,0.35)', label: 'rgba(100,180,255,0.9)' },
            large:  { bg: 'rgba(243,156,18,0.18)',  border: 'rgba(243,156,18,0.5)',  label: '#F39C12' },
            mega:   { bg: 'rgba(243,156,18,0.28)',  border: 'rgba(243,156,18,0.9)',  label: '#F39C12' },
          }[size];
          const emojiSize = [16, 20, 26, 32][i];

          return (
            <motion.div key={size} style={{
              flex: 1, borderRadius: 12, padding: '7px 4px', textAlign: 'center',
              background: isSent ? colors.bg.replace(/0\.\d+\)$/, m => String(parseFloat(m) * 2) + ')') : colors.bg,
              border: `1px solid ${isSent ? colors.border : colors.border}`,
              position: 'relative', overflow: 'hidden',
            }}
              animate={isSent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={isSent ? { duration: 0.3 } : {}}
            >
              {size === 'mega' && (
                <motion.div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(243,156,18,0.2), rgba(192,57,43,0.1))',
                }}
                  animate={isSent ? { opacity: [0, 1, 0] } : { opacity: 0.3 }}
                  transition={{ duration: 0.8, repeat: isSent ? 0 : Infinity }}
                />
              )}
              <div style={{ fontSize: emojiSize }}>{def.emoji}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 10, color: colors.label, letterSpacing: '0.04em', marginTop: 2 }}>{def.label}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{def.st} ST</div>
              {isSent && (
                <motion.div style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#27ae60', borderRadius: '50%', width: 11, height: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff',
                }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >✓</motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Withdraw Overlay ── */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(13,11,18,0.93)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55 }}
          >
            <motion.div style={{ textAlign: 'center' }}
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            >
              <div style={{ fontSize: 44, marginBottom: 8 }}>💰</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(24px,7vw,36px)', color: '#fff', letterSpacing: '0.08em', lineHeight: 1 }}>
                YOU EARNED THIS SESSION
              </div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(44px,13vw,62px)', color: '#F39C12', letterSpacing: '0.06em', lineHeight: 1, marginTop: 4 }}>
                {earnings} ST
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                ≈ €{(earnings / 100).toFixed(2)} before 10% fee
              </div>
            </motion.div>

            <motion.div style={{
              width: '84%', background: 'rgba(22,18,32,0.98)', borderRadius: 20,
              border: '1px solid rgba(243,156,18,0.4)', padding: '18px 16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
              initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Your ST balance</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: '#fff' }}>{earnings} ST</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>You receive</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: '#27ae60' }}>
                    €{((earnings / 100) * 0.9).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <span style={{ fontSize: 14 }}>ℹ️</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#fff', fontWeight: 600 }}>10% platform fee</span>
                  <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}> on all withdrawals</span>
                </div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#C0392B' }}>
                  −€{((earnings / 100) * 0.1).toFixed(2)}
                </div>
              </div>

              <motion.div style={{
                borderRadius: 12, padding: '13px 0', textAlign: 'center',
                background: 'linear-gradient(90deg, #1a7a45, #27ae60)',
                fontFamily: 'Bebas Neue', fontSize: 18, color: '#fff', letterSpacing: '0.1em',
                boxShadow: '0 4px 20px rgba(39,174,96,0.5)',
              }}
                animate={{ boxShadow: ['0 4px 18px rgba(39,174,96,0.4)', '0 6px 28px rgba(39,174,96,0.7)', '0 4px 18px rgba(39,174,96,0.4)'] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                🏦 WITHDRAW TO BANK
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

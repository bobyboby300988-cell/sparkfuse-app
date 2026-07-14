import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── Gift definitions ─── */
const GIFT_DEFS = {
  small:  { emoji: '🌸', label: 'Rose',      st: 5,   color: '#ff8fab' },
  medium: { emoji: '💎', label: 'Diamond',   st: 50,  color: '#74b9ff' },
  large:  { emoji: '👑', label: 'Crown',     st: 200, color: '#F39C12' },
  mega:   { emoji: '🌟', label: 'Mega Star', st: 500, color: '#F39C12' },
};

type GiftSize = 'small' | 'medium' | 'large' | 'mega';

interface Gift { id: number; size: GiftSize; x: number }
interface ChatMsg { id: number; user: string; text: string; color: string; isGift?: boolean }

const USER_COLORS = ['#F39C12','#e74c3c','#9b59b6','#3498db','#e67e22','#1abc9c'];

/* ─── Gift Burst (particles + central emoji) ─── */
function GiftBurst({ gift, onDone }: { gift: Gift; onDone: () => void }) {
  const def   = GIFT_DEFS[gift.size];
  const isMega  = gift.size === 'mega';
  const isLarge = gift.size === 'large';

  const pCount  = isMega ? 48 : isLarge ? 28 : 16;
  const pRadius = isMega ? 200 : isLarge ? 150 : 90;
  const eSize   = isMega ? 120 : isLarge ? 90 : 60;
  const liveDur = isMega ? 3000 : isLarge ? 2200 : 1400;

  const particles = Array.from({ length: pCount }, (_, i) => {
    const angle = (360 / pCount) * i + (Math.random() - 0.5) * 12;
    const r = pRadius * (0.7 + Math.random() * 0.6);
    const colors = ['#F39C12','#C0392B','#fff','#e74c3c','#f1c40f'];
    return { angle, r, color: colors[i % colors.length], s: 4 + Math.random() * (isMega ? 12 : 7) };
  });

  useEffect(() => {
    const t = setTimeout(onDone, liveDur);
    return () => clearTimeout(t);
  }, [liveDur, onDone]);

  return (
    <motion.div
      style={{ position: 'absolute', left: `${gift.x}%`, bottom: '28%', transform: 'translateX(-50%)', zIndex: 45, pointerEvents: 'none' }}
      initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* Full-screen flash */}
      {(isMega || isLarge) && (
        <motion.div style={{
          position: 'fixed', inset: 0, zIndex: 44, pointerEvents: 'none',
          background: isMega
            ? 'radial-gradient(ellipse 80% 80% at 50% 40%, rgba(243,156,18,0.55) 0%, rgba(192,57,43,0.2) 50%, transparent 80%)'
            : 'rgba(243,156,18,0.22)',
        }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: isMega ? 1.2 : 0.7, times: [0, 0.15, 0.5, 1] }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.div key={i} style={{
            position: 'absolute', width: p.s, height: p.s, borderRadius: '50%',
            background: p.color, top: '50%', left: '50%',
            marginLeft: -p.s / 2, marginTop: -p.s / 2,
            boxShadow: `0 0 ${p.s * 2}px ${p.color}`,
          }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * p.r, y: -Math.sin(rad) * p.r * 0.85, opacity: 0, scale: 0.1 }}
            transition={{ duration: isMega ? 1.1 : 0.75, delay: 0.05 + i * 0.008, ease: 'easeOut' }}
          />
        );
      })}

      {/* Shockwave rings */}
      {[1, 2, ...(isMega ? [3, 4] : isLarge ? [3] : [])].map(ring => (
        <motion.div key={ring} style={{
          position: 'absolute', border: `${isMega ? 4 : 3}px solid ${def.color}`,
          borderRadius: '50%', top: '50%', left: '50%',
        }}
          initial={{ width: eSize * 0.5, height: eSize * 0.5, x: '-50%', y: '-50%', opacity: 0.9 }}
          animate={{ width: pRadius * (2 + ring * 0.6), height: pRadius * (2 + ring * 0.6), x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.8 + ring * 0.15, delay: ring * 0.12, ease: 'easeOut' }}
        />
      ))}

      {/* Central emoji */}
      <motion.div style={{ fontSize: eSize, lineHeight: 1, zIndex: 46, position: 'relative',
        filter: isMega ? 'drop-shadow(0 0 40px rgba(243,156,18,1)) drop-shadow(0 0 80px rgba(243,156,18,0.7))'
          : isLarge ? 'drop-shadow(0 0 24px rgba(243,156,18,0.9))' : undefined,
      }}
        initial={{ scale: 0, opacity: 0, rotate: -30 }}
        animate={{ scale: [0, isMega ? 2.4 : 1.8, 1.1], opacity: [0, 1, 1], rotate: [-30, 10, 0], y: [0, -30, 0] }}
        transition={{ duration: 0.65, ease: [0.175, 0.885, 0.32, 1.275] }}
      >{def.emoji}</motion.div>

      {/* Label badge */}
      <motion.div style={{
        fontFamily: 'Bebas Neue', fontSize: isMega ? 22 : 16, letterSpacing: '0.06em',
        color: isMega ? '#0D0B12' : '#fff', marginTop: 6, textAlign: 'center',
        background: isMega ? '#F39C12' : isLarge ? 'rgba(243,156,18,0.9)' : 'rgba(0,0,0,0.7)',
        borderRadius: 20, padding: '3px 14px',
        boxShadow: isMega ? '0 0 30px rgba(243,156,18,0.8)' : undefined,
      }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >+{def.st} ST</motion.div>

      {/* Floater ghost */}
      <motion.div style={{ fontSize: eSize * 0.5, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: isMega ? -260 : -180, opacity: [0, 0.8, 0] }}
        transition={{ delay: 0.4, duration: isMega ? 1.6 : 1.2, ease: 'easeOut' }}
      >{def.emoji}</motion.div>
    </motion.div>
  );
}

/* ─── Floating hearts in stream area ─── */
const HEARTS = Array.from({ length: 12 }, (_, i) => ({
  id: i, x: 15 + Math.random() * 70, delay: i * 0.4,
  dur: 2.0 + Math.random() * 1.5,
  emoji: ['❤️','💛','🧡','💜','💗','💝'][i % 6],
}));

/* ─── Main Scene ─── */
export function Scene3() {
  const [phase,        setPhase]        = useState(0);
  const [gifts,        setGifts]        = useState<Gift[]>([]);
  const [chatMsgs,     setChatMsgs]     = useState<ChatMsg[]>([]);
  const [earnings,     setEarnings]     = useState(0);
  const [viewers,      setViewers]      = useState(1241);
  const [showEarnings, setShowEarnings] = useState(false);
  const nextId = useRef(0);

  const addMsg = (msg: Omit<ChatMsg, 'id'>) =>
    setChatMsgs(prev => [...prev.slice(-5), { ...msg, id: nextId.current++ }]);

  const sendGift = (size: GiftSize) => {
    const def = GIFT_DEFS[size];
    setGifts(prev => [...prev, { id: nextId.current++, size, x: 30 + Math.random() * 40 }]);
    setEarnings(prev => prev + def.st);
    setViewers(prev => prev + (size === 'mega' ? 450 : size === 'large' ? 130 : 20));
  };

  useEffect(() => {
    // Timeline locked to 20s scene duration
    const T = [
      // 0-2s: stream starts
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex',  text: 'OMG you look amazing 😍', color: USER_COLORS[0] }); }, 600),
      setTimeout(() => addMsg({ user: 'Mia',   text: 'Your eyes ✨ first time here', color: USER_COLORS[1] }), 1400),
      setTimeout(() => addMsg({ user: 'Jake',  text: 'Can\'t stop watching 🔥',       color: USER_COLORS[2] }), 2100),

      // 3s: Rose (small)
      setTimeout(() => { sendGift('small'); addMsg({ user: 'Carlos', text: '🌸 sent a Rose!', color: USER_COLORS[3], isGift: true }); }, 3000),

      // 5s: Diamond (medium)
      setTimeout(() => { sendGift('medium'); addMsg({ user: 'Luna', text: '💎 Diamond for you!', color: USER_COLORS[4], isGift: true }); }, 5000),
      setTimeout(() => addMsg({ user: 'Sam', text: 'She deserves it! 🥰', color: USER_COLORS[1] }), 6200),

      // 8s: CROWN (middle - featured)
      setTimeout(() => {
        setPhase(3);
        sendGift('large');
        addMsg({ user: '👑 Marcus', text: 'CROWN for the queen!! 👑👑', color: '#F39C12', isGift: true });
      }, 8000),
      setTimeout(() => addMsg({ user: 'Sofia', text: '👑👑👑 YAASSS!!!', color: USER_COLORS[5] }), 9400),
      setTimeout(() => addMsg({ user: 'Ryan',  text: 'She earned that crown 💯', color: USER_COLORS[2] }), 10500),

      // 12s: MEGA STAR 500ST — hero moment
      setTimeout(() => {
        setPhase(4);
        sendGift('mega');
        addMsg({ user: '⭐ VIP Tyler', text: '🌟🌟🌟 MEGA STAR!!! YOU\'RE THE BEST!! 🌟🌟🌟', color: '#F39C12', isGift: true });
      }, 12500),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '🔥🔥🔥🔥🔥 WOW WOW WOW!!!', color: '#e74c3c' }), 14000),
      setTimeout(() => addMsg({ user: 'Alex',    text: '500 tokens!!!! 😱😱😱',         color: USER_COLORS[0] }), 15000),

      // 17s: show earnings total
      setTimeout(() => setShowEarnings(true), 17000),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background glow */}
      <motion.div className="absolute inset-0" style={{ pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 55% at 50% 28%, rgba(192,57,43,0.3) 0%, transparent 70%)',
      }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }} />

      {/* ── LIVE header ── */}
      <motion.div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.4 }}
      >
        {/* LIVE badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#C0392B', borderRadius: 40, padding: '4px 10px', boxShadow: '0 0 14px rgba(192,57,43,0.7)' }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
          />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff', letterSpacing: '0.12em' }}>LIVE</span>
        </div>

        {/* Host */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <motion.div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #C0392B, #F39C12)', border: '2px solid rgba(243,156,18,0.6)' }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0)', '0 0 14px rgba(243,156,18,0.8)', '0 0 0px rgba(243,156,18,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: '#fff' }}>Sarah M.</div>
            <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>is live</div>
          </div>
        </div>

        {/* Viewer count */}
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 9px' }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.35 }} key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff' }}>{viewers.toLocaleString()}</span>
        </motion.div>
      </motion.div>

      {/* ── Stream video area ── */}
      <motion.div style={{
        margin: '0 12px', borderRadius: 16, overflow: 'hidden', position: 'relative', height: '32%', flexShrink: 0,
        background: 'linear-gradient(180deg, #2a1025 0%, #1a0d1f 100%)',
        border: '1px solid rgba(192,57,43,0.3)',
      }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(192,57,43,0.22) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* Host avatar */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C0392B 0%, #F39C12 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0.2)', '0 0 28px rgba(243,156,18,0.75)', '0 0 0px rgba(243,156,18,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >👩‍🦰</motion.div>
          <motion.div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}
            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          >● streaming live</motion.div>
        </div>

        {/* Floating hearts */}
        {phase >= 2 && HEARTS.map(h => (
          <motion.div key={h.id} style={{ position: 'absolute', bottom: -10, left: `${h.x}%`, fontSize: 13, pointerEvents: 'none', zIndex: 5 }}
            animate={{ y: [0, -130], opacity: [0, 1, 0], scale: [0.6, 1, 0.7] }}
            transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'easeOut', repeatDelay: 3 }}
          >{h.emoji}</motion.div>
        ))}

        {/* Earnings ticker */}
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.78)', borderRadius: 20,
              padding: '3px 10px', border: '1px solid rgba(243,156,18,0.55)', zIndex: 10,
              display: 'flex', alignItems: 'center', gap: 4,
            }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={earnings}>
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#F39C12' }}>+{earnings} ST</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Gift bursts ── */}
      <AnimatePresence>
        {gifts.map(g => <GiftBurst key={g.id} gift={g} onDone={() => setGifts(p => p.filter(x => x.id !== g.id))} />)}
      </AnimatePresence>

      {/* ── Chat feed ── */}
      <motion.div style={{ flex: 1, padding: '6px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 4, zIndex: 10, overflow: 'hidden' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {chatMsgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, x: -22, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                background: msg.isGift ? 'rgba(243,156,18,0.13)' : 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '5px 8px',
                border: msg.isGift ? '1px solid rgba(243,156,18,0.4)' : 'none',
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Inter', marginTop: 1 }}>
                {msg.user[0]}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: msg.color, fontWeight: 700 }}>{msg.user} </span>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: msg.isGift ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>{msg.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Gift buttons row ── */}
      <motion.div style={{ padding: '0 10px 10px', display: 'flex', gap: 6, zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.4 }}
      >
        {(['small','medium','large','mega'] as const).map((size, i) => {
          const def = GIFT_DEFS[size];
          const highlighted = (size === 'large' && phase >= 3) || (size === 'mega' && phase >= 4);
          const emojiSize = [16, 20, 26, 34][i];
          const borderColor = highlighted
            ? (size === 'mega' ? 'rgba(243,156,18,1)' : 'rgba(243,156,18,0.8)')
            : ['rgba(255,182,193,0.3)','rgba(52,152,219,0.35)','rgba(243,156,18,0.4)','rgba(243,156,18,0.4)'][i];
          const bg = highlighted
            ? (size === 'mega' ? 'rgba(243,156,18,0.3)' : 'rgba(243,156,18,0.2)')
            : ['rgba(255,182,193,0.1)','rgba(52,152,219,0.1)','rgba(243,156,18,0.1)','rgba(243,156,18,0.12)'][i];

          return (
            <motion.div key={size} style={{
              flex: size === 'mega' ? 1.4 : 1, borderRadius: 12, padding: '7px 4px', textAlign: 'center',
              background: bg, border: `1px solid ${borderColor}`, position: 'relative', overflow: 'hidden',
            }}
              animate={highlighted ? { scale: [1, 1.08, 1], boxShadow: size === 'mega' ? ['0 0 0px rgba(243,156,18,0)', '0 0 18px rgba(243,156,18,0.7)', '0 0 8px rgba(243,156,18,0.5)'] : undefined } : { scale: 1 }}
              transition={highlighted ? { duration: 0.45 } : {}}
            >
              {size === 'mega' && phase >= 4 && (
                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(243,156,18,0.25), rgba(192,57,43,0.15))', borderRadius: 12 }}
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <div style={{ fontSize: emojiSize, position: 'relative', zIndex: 1 }}>{def.emoji}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 10, color: highlighted ? '#F39C12' : 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', marginTop: 2, position: 'relative', zIndex: 1 }}>{def.label}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1, position: 'relative', zIndex: 1 }}>{def.st} ST</div>
              {highlighted && (
                <motion.div style={{ position: 'absolute', top: 2, right: 2, background: '#27ae60', borderRadius: '50%', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >✓</motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Earnings summary (final 3s) ── */}
      <AnimatePresence>
        {showEarnings && (
          <motion.div style={{
            position: 'absolute', inset: 0, zIndex: 60,
            background: 'rgba(13,11,18,0.88)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.div style={{ textAlign: 'center' }}
              initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(20px,6vw,30px)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>YOU EARNED THIS SESSION</div>
              <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(52px,15vw,72px)', color: '#F39C12', letterSpacing: '0.06em', lineHeight: 1 }}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
              >{earnings} ST</motion.div>
              <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                ≈ €{(earnings * 0.009).toFixed(2)} real money
              </div>
            </motion.div>
            <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#27ae60', letterSpacing: '0.12em', background: 'rgba(39,174,96,0.15)', borderRadius: 30, padding: '8px 24px', border: '1px solid rgba(39,174,96,0.4)' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            >WITHDRAW TO BANK →</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

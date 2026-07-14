import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── 10 gifts — medium to biggest (€5 → €300) ─── */
type GiftKey = 'teddy'|'kiss'|'diamond'|'peach'|'hat'|'spicy'|'fireworks'|'lips'|'dragon'|'rocket';

const GIFTS: Record<GiftKey, { emoji: string; label: string; st: number; tier: 'small'|'medium'|'big'|'mega'; color: string; erotic?: boolean }> = {
  teddy:     { emoji: '🧸', label: 'Teddy',     st: 500,   tier: 'small',  color: '#FF7043' },
  kiss:      { emoji: '💋', label: 'Kiss',       st: 1000,  tier: 'small',  color: '#FF5CA8', erotic: true },
  diamond:   { emoji: '💎', label: 'Diamond',    st: 2000,  tier: 'small',  color: '#3498db' },
  peach:     { emoji: '🍑', label: 'Peach',      st: 3000,  tier: 'medium', color: '#FF6B35', erotic: true },
  hat:       { emoji: '🎩', label: 'Magic Hat',  st: 4000,  tier: 'medium', color: '#9b59b6' },
  spicy:     { emoji: '🌶️', label: 'Spicy',     st: 5000,  tier: 'medium', color: '#C0392B', erotic: true },
  fireworks: { emoji: '🎆', label: 'Fireworks',  st: 7500,  tier: 'big',    color: '#FF6D00' },
  lips:      { emoji: '🫦', label: 'Lips',       st: 10000, tier: 'big',    color: '#e91e8c', erotic: true },
  dragon:    { emoji: '🐉', label: 'Dragon',     st: 15000, tier: 'big',    color: '#BF360C' },
  rocket:    { emoji: '🚀', label: 'Rocket',     st: 30000, tier: 'mega',   color: '#1565C0' },
};

const GIFT_ORDER: GiftKey[] = ['teddy','kiss','diamond','peach','hat','spicy','fireworks','lips','dragon','rocket'];

const TIER_CFG = {
  small:  { pCount: 16, pRadius: 70,  eSize: 52,  liveMs: 1500, rings: 1 },
  medium: { pCount: 26, pRadius: 100, eSize: 72,  liveMs: 2000, rings: 2 },
  big:    { pCount: 38, pRadius: 140, eSize: 96,  liveMs: 2600, rings: 3 },
  mega:   { pCount: 55, pRadius: 180, eSize: 120, liveMs: 3200, rings: 4 },
};

interface ActiveGift { id: number; key: GiftKey; x: number }
interface ChatMsg    { id: number; user: string; text: string; color: string; isGift?: boolean }

const USER_COLORS = ['#F39C12','#e74c3c','#9b59b6','#3498db','#e67e22','#1abc9c','#FF5CA8'];

/* ─── Gift Burst — stays in the CHAT area, does NOT cover the live stream ─── */
function GiftBurst({ ag, onDone }: { ag: ActiveGift; onDone: () => void }) {
  const def  = GIFTS[ag.key];
  const cfg  = TIER_CFG[def.tier];
  const isMega = def.tier === 'mega';
  const isBig  = def.tier === 'big' || isMega;

  const particles = Array.from({ length: cfg.pCount }, (_, i) => {
    const angle = (360 / cfg.pCount) * i + (Math.random() - 0.5) * 10;
    const r = cfg.pRadius * (0.65 + Math.random() * 0.7);
    const pColors = [def.color, '#F39C12', '#fff', '#e74c3c', '#f1c40f'];
    return { angle, r, c: pColors[i % pColors.length], s: 3 + Math.random() * (isMega ? 9 : isBig ? 6 : 4) };
  });

  useEffect(() => {
    const t = setTimeout(onDone, cfg.liveMs);
    return () => clearTimeout(t);
  }, [cfg.liveMs, onDone]);

  return (
    /* Burst is anchored to the CHAT / lower area — not the full screen */
    <motion.div style={{
      position: 'absolute',
      left: `${ag.x}%`,
      bottom: '28%',       /* sits in the chat zone, above the gift tray */
      transform: 'translateX(-50%)',
      zIndex: 50,
      pointerEvents: 'none',
    }} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>

      {/* Local glow halo — replaces the old full-screen flash */}
      {isBig && (
        <motion.div style={{
          position: 'absolute',
          borderRadius: '50%',
          background: isMega
            ? `radial-gradient(circle, ${def.color}99 0%, transparent 70%)`
            : `radial-gradient(circle, ${def.color}55 0%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
          initial={{ width: cfg.eSize, height: cfg.eSize, opacity: 0.95 }}
          animate={{ width: cfg.pRadius * 3.5, height: cfg.pRadius * 3.5, opacity: 0 }}
          transition={{ duration: isMega ? 1.2 : 0.85, ease: 'easeOut' }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.div key={i} style={{
            position: 'absolute', width: p.s, height: p.s, borderRadius: '50%',
            background: p.c, top: '50%', left: '50%',
            marginLeft: -p.s / 2, marginTop: -p.s / 2,
            boxShadow: `0 0 ${p.s * 2}px ${p.c}`,
          }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * p.r, y: -Math.sin(rad) * p.r * 0.9, opacity: 0, scale: 0.1 }}
            transition={{ duration: isMega ? 1.0 : isBig ? 0.8 : 0.6, delay: 0.04 + i * 0.006, ease: 'easeOut' }}
          />
        );
      })}

      {/* Shockwave rings */}
      {Array.from({ length: cfg.rings }).map((_, ring) => (
        <motion.div key={ring} style={{
          position: 'absolute', border: `${isMega ? 3 : 2}px solid ${def.color}`,
          borderRadius: '50%', top: '50%', left: '50%',
        }}
          initial={{ width: cfg.eSize * 0.4, height: cfg.eSize * 0.4, x: '-50%', y: '-50%', opacity: 0.9 }}
          animate={{ width: cfg.pRadius * (2 + ring * 0.6), height: cfg.pRadius * (2 + ring * 0.6), x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.8 + ring * 0.16, delay: ring * 0.12, ease: 'easeOut' }}
        />
      ))}

      {/* Central emoji */}
      <motion.div style={{
        fontSize: cfg.eSize, lineHeight: 1, zIndex: 51, position: 'relative',
        filter: isMega ? `drop-shadow(0 0 32px ${def.color}) drop-shadow(0 0 60px ${def.color}88)`
          : isBig ? `drop-shadow(0 0 18px ${def.color})` : undefined,
      }}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, isMega ? 2.4 : isBig ? 1.75 : 1.2, 1.05], opacity: [0, 1, 1], rotate: [-20, 8, 0], y: [0, isMega ? -24 : -12, 0] }}
        transition={{ duration: 0.55, ease: [0.175, 0.885, 0.32, 1.275] }}
      >{def.emoji}</motion.div>

      {/* ST label */}
      <motion.div style={{
        fontFamily: 'Bebas Neue', fontSize: isMega ? 20 : isBig ? 15 : 12,
        color: '#fff', marginTop: 5, textAlign: 'center',
        background: isMega ? def.color : `${def.color}cc`,
        borderRadius: 20, padding: isMega ? '3px 14px' : '2px 9px',
        boxShadow: isMega ? `0 0 20px ${def.color}99` : undefined,
      }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
      >{def.label} · {def.st >= 1000 ? `${(def.st / 1000).toFixed(def.st % 1000 === 0 ? 0 : 1)}K` : def.st} ST</motion.div>

      {/* Ghost floater drifts up */}
      <motion.div style={{ fontSize: cfg.eSize * 0.4, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: isMega ? -220 : isBig ? -160 : -110, opacity: [0, 0.7, 0] }}
        transition={{ delay: 0.35, duration: isMega ? 1.5 : 1.1, ease: 'easeOut' }}
      >{def.emoji}</motion.div>
    </motion.div>
  );
}

/* ─── Floating hearts ─── */
const HEARTS = Array.from({ length: 10 }, (_, i) => ({
  id: i, x: 14 + Math.random() * 72, delay: i * 0.5,
  dur: 2.0 + Math.random() * 1.4, emoji: ['❤️','💛','🧡','💜','💗','💝'][i % 6],
}));

export function Scene3() {
  const [phase,        setPhase]        = useState(0);
  const [activeGifts,  setActiveGifts]  = useState<ActiveGift[]>([]);
  const [sentKeys,     setSentKeys]     = useState<Set<GiftKey>>(new Set());
  const [chatMsgs,     setChatMsgs]     = useState<ChatMsg[]>([]);
  const [earnings,     setEarnings]     = useState(0);
  const [viewers,      setViewers]      = useState(1241);
  const [showMore,     setShowMore]     = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const nextId = useRef(0);

  const addMsg = (msg: Omit<ChatMsg, 'id'>) =>
    setChatMsgs(prev => [...prev.slice(-5), { ...msg, id: nextId.current++ }]);

  const sendGift = (key: GiftKey, stValue: number, viewerBoost: number) => {
    setActiveGifts(prev => [...prev, { id: nextId.current++, key, x: 25 + Math.random() * 50 }]);
    setSentKeys(prev => new Set([...prev, key]));
    setEarnings(prev => prev + stValue);
    setViewers(prev => prev + viewerBoost);
  };

  useEffect(() => {
    const T = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex',  text: 'OMG you look amazing! 😍',  color: USER_COLORS[0] }); }, 700),
      setTimeout(() => addMsg({ user: 'Mia',  text: 'First time here — love this! ✨',          color: USER_COLORS[1] }), 1500),

      // 3s — 🧸 Teddy 500 ST
      setTimeout(() => {
        sendGift('teddy', 500, 18);
        addMsg({ user: 'Jake', text: '🧸 Teddy Bear! 500 ST 🥰', color: USER_COLORS[2], isGift: true });
      }, 3000),

      // 5.5s — 💋 Kiss 1,000 ST
      setTimeout(() => {
        sendGift('kiss', 1000, 35);
        addMsg({ user: 'Carlos', text: '💋 Kiss! 1,000 ST for you gorgeous 😘', color: USER_COLORS[3], isGift: true });
      }, 5500),

      // 8s — 💎 Diamond 2,000 ST
      setTimeout(() => {
        sendGift('diamond', 2000, 60);
        addMsg({ user: 'Luna', text: '💎 Diamond! You deserve this 2,000 ST 💙', color: USER_COLORS[4], isGift: true });
      }, 8000),

      // 10.5s — 🍑 Peach 3,000 ST
      setTimeout(() => {
        sendGift('peach', 3000, 90);
        addMsg({ user: 'Sam', text: '🍑 Peach! 3,000 ST — you\'re irresistible 🔥', color: USER_COLORS[1], isGift: true });
      }, 10500),

      // 13s — 🎩 Magic Hat 4,000 ST
      setTimeout(() => {
        sendGift('hat', 4000, 120);
        addMsg({ user: '🎩 VIP Dan', text: 'Magic Hat! 4,000 ST ✨✨', color: '#9b59b6', isGift: true });
      }, 13000),

      // 15.5s — 🌶️ Spicy 5,000 ST
      setTimeout(() => {
        sendGift('spicy', 5000, 180);
        addMsg({ user: '🌶️ Diego', text: 'SPICY!!! 5,000 ST 🔥🔥🔥', color: '#C0392B', isGift: true });
      }, 15500),
      setTimeout(() => addMsg({ user: 'Sofia', text: 'She\'s on fire tonight!! 😱', color: USER_COLORS[5] }), 16800),

      // 18s — 🎆 Fireworks 7,500 ST → phase 3
      setTimeout(() => {
        setPhase(3);
        sendGift('fireworks', 7500, 280);
        addMsg({ user: '🎆 Ryan', text: 'FIREWORKS!! 7,500 ST for the queen!! 💥', color: '#FF6D00', isGift: true });
      }, 18000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '🔥🔥 7,500 ST!! The stream is WILD!!', color: '#e74c3c' }), 19500),

      // 21s — 🫦 Lips 10,000 ST
      setTimeout(() => {
        sendGift('lips', 10000, 380);
        addMsg({ user: '💋 VIP Max', text: '🫦 10,000 ST LIPS!! You\'re everything 😩🔥', color: '#e91e8c', isGift: true });
      }, 21000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱 10,000 ST!! Insane!!!', color: '#F39C12' }), 22500),

      // 25s — 🐉 Dragon 15,000 ST → phase 4
      setTimeout(() => {
        setPhase(4);
        sendGift('dragon', 15000, 550);
        addMsg({ user: '🐉 VIP Tyler', text: 'DRAGON!!! 15,000 ST — QUEEN OF THE STREAM 🔥🔥🔥', color: '#FF6B35', isGift: true });
      }, 25000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '🐉🐉🐉 15,000 ST!!! LEGENDARY!!!', color: '#BF360C' }), 26800),

      // 29s — 🚀 Rocket 30,000 ST — HERO MOMENT €300
      setTimeout(() => {
        sendGift('rocket', 30000, 1200);
        addMsg({ user: '⭐ VIP Marco', text: '🚀🚀 ROCKET!!! 30,000 ST = €300!!! YOU\'RE A GODDESS!! 🚀🚀', color: '#64B5F6', isGift: true });
      }, 29000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱😱 30,000 ST ROCKET!!!!! €300!!!!! 🚀🚀🚀', color: '#F39C12' }), 30800),

      // 32s — "many more" banner
      setTimeout(() => setShowMore(true), 32000),
      // 33.5s — earnings summary
      setTimeout(() => setShowEarnings(true), 33500),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="absolute inset-0" style={{ pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 50% at 50% 28%, rgba(192,57,43,0.28) 0%, transparent 70%)',
      }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }} />

      {/* ── 18+ badge ── */}
      <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 30, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
        <div style={{ background: '#C0392B', borderRadius: 5, padding: '2px 7px', boxShadow: '0 0 8px rgba(192,57,43,0.6)' }}>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 13, color: '#fff', letterSpacing: '0.08em' }}>18+</span>
        </div>
        <span style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>ADULT</span>
      </div>

      {/* ── LIVE header ── */}
      <motion.div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }} animate={phase >= 1 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#C0392B', borderRadius: 40, padding: '4px 10px', boxShadow: '0 0 14px rgba(192,57,43,0.7)' }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff', letterSpacing: '0.12em' }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <motion.div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #C0392B, #F39C12)', border: '2px solid rgba(243,156,18,0.6)' }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0)', '0 0 14px rgba(243,156,18,0.8)', '0 0 0px rgba(243,156,18,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity }} />
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: '#fff' }}>Sarah M.</div>
            <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>is live</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '3px 8px' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,140,0,0.85)', fontFamily: 'Inter', fontWeight: 600 }}>📱 App only</span>
        </div>
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 9px' }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.35 }} key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff' }}>{viewers.toLocaleString()}</span>
        </motion.div>
      </motion.div>

      {/* ── Stream area — streamer is ALWAYS visible ── */}
      <motion.div style={{
        margin: '0 12px', borderRadius: 16, overflow: 'hidden', position: 'relative', height: '28%', flexShrink: 0,
        background: 'linear-gradient(180deg, #2a1025 0%, #1a0d1f 100%)', border: '1px solid rgba(192,57,43,0.3)',
      }}
        initial={{ opacity: 0, scale: 0.95 }} animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(192,57,43,0.2) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #C0392B 0%, #F39C12 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0.2)', '0 0 28px rgba(243,156,18,0.75)', '0 0 0px rgba(243,156,18,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >👩‍🦰</motion.div>
          <motion.div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}
            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          >● streaming live</motion.div>
        </div>
        {phase >= 2 && HEARTS.map(h => (
          <motion.div key={h.id} style={{ position: 'absolute', bottom: -10, left: `${h.x}%`, fontSize: 12, pointerEvents: 'none', zIndex: 5 }}
            animate={{ y: [0, -120], opacity: [0, 1, 0], scale: [0.6, 1, 0.7] }}
            transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'easeOut', repeatDelay: 3.5 }}
          >{h.emoji}</motion.div>
        ))}
        {/* Earnings ticker — always on top of stream, small */}
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)', borderRadius: 20, padding: '3px 10px', border: '1px solid rgba(243,156,18,0.55)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 4 }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={earnings}
            >
              <span style={{ fontSize: 10 }}>💰</span>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#F39C12' }}>+{earnings.toLocaleString()} ST</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Gift bursts (chat zone, below the stream) ── */}
      <AnimatePresence>
        {activeGifts.map(ag => (
          <GiftBurst key={ag.id} ag={ag} onDone={() => setActiveGifts(p => p.filter(x => x.id !== ag.id))} />
        ))}
      </AnimatePresence>

      {/* ── Chat ── */}
      <motion.div style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3, zIndex: 10, overflow: 'hidden' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {chatMsgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, x: -20, y: 8 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: msg.isGift ? 'rgba(243,156,18,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '4px 8px', border: msg.isGift ? '1px solid rgba(243,156,18,0.35)' : 'none' }}
            >
              <div style={{ width: 17, height: 17, borderRadius: '50%', flexShrink: 0, background: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: 'Inter', marginTop: 1 }}>
                {msg.user[0]}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 9, color: msg.color, fontWeight: 700 }}>{msg.user} </span>
                <span style={{ fontFamily: 'Inter', fontSize: 9, color: msg.isGift ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>{msg.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Chat input bar ── */}
      <motion.div style={{ padding: '0 8px 4px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}
        initial={{ opacity: 0, y: 12 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.35 }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 22, padding: '6px 11px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 13 }}>😊</span>
          <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.3)', flex: 1 }}>Say something…</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(192,57,43,0.35)', border: '1px solid rgba(192,57,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🎁</span>
        </div>
      </motion.div>

      {/* ── Gift tray — 2 rows of 5, in the chat area ── */}
      <motion.div style={{ padding: '0 8px 6px', display: 'flex', flexWrap: 'wrap', gap: 3, zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        {GIFT_ORDER.map(key => {
          const g = GIFTS[key];
          const sent = sentKeys.has(key);
          const isHero = key === 'rocket';
          return (
            <motion.div key={key} style={{
              width: 'calc(20% - 2.4px)',
              borderRadius: 9, padding: '5px 2px', textAlign: 'center',
              background: sent ? `${g.color}28` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${sent ? g.color + '99' : g.erotic ? 'rgba(255,91,168,0.22)' : 'rgba(255,255,255,0.1)'}`,
              position: 'relative', overflow: 'hidden',
            }}
              animate={sent ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }}
            >
              {isHero && sent && (
                <motion.div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${g.color}30, rgba(243,156,18,0.2))` }}
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
              )}
              <div style={{ fontSize: isHero ? 18 : 14, position: 'relative', zIndex: 1 }}>{g.emoji}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 8, color: sent ? g.color : g.erotic ? '#FF5CA8' : 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', marginTop: 1, position: 'relative', zIndex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInline: 2 }}>{g.label}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 6.5, color: 'rgba(255,255,255,0.38)', marginTop: 1, position: 'relative', zIndex: 1 }}>
                {g.st >= 1000 ? `${(g.st / 1000).toFixed(g.st % 1000 === 0 ? 0 : 0)}K` : g.st} ST
              </div>
              {sent && (
                <motion.div style={{ position: 'absolute', top: 2, right: 2, background: '#27ae60', borderRadius: '50%', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#fff' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >✓</motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Token info ── */}
      <motion.div style={{ margin: '0 8px 6px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10, background: 'rgba(243,156,18,0.08)', borderRadius: 10, padding: '4px 10px', border: '1px solid rgba(243,156,18,0.2)' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.3 }}
      >
        <span style={{ fontSize: 11 }}>⚡</span>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 11, color: '#F39C12' }}>500 ST minimum · biggest = 🚀 30,000 ST = €300</span>
        <span style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>50 gifts available</span>
      </motion.div>

      {/* ── "Many more gifts" banner ── */}
      <AnimatePresence>
        {showMore && !showEarnings && (
          <motion.div style={{ position: 'absolute', bottom: 90, left: 12, right: 12, zIndex: 55, background: 'rgba(13,11,18,0.95)', borderRadius: 16, padding: '10px 14px', border: '1px solid rgba(243,156,18,0.4)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
          >
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#F39C12', letterSpacing: '0.08em', marginBottom: 5 }}>🎁 50 BEAUTIFUL & EROTIC GIFTS AVAILABLE!</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['🧸 500ST','💋 1K ST','💎 2K ST','🍑 3K ST','🎩 4K ST','🌶️ 5K ST','🎆 7.5K ST','🫦 10K ST','🐉 15K ST','🚀 30K ST = €300'].map(g => (
                <div key={g} style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '2px 7px', border: '1px solid rgba(255,255,255,0.1)' }}>{g}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Earnings summary ── */}
      <AnimatePresence>
        {showEarnings && (
          <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60, background: 'rgba(13,11,18,0.97)', backdropFilter: 'blur(10px)', padding: '18px 20px', borderRadius: '20px 20px 0 0', border: '1px solid rgba(243,156,18,0.3)' }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>💰</div>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>THIS SESSION YOU EARNED</div>
                <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(28px,8vw,38px)', color: '#F39C12', letterSpacing: '0.06em', lineHeight: 1 }}
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 18 }}
                >{earnings.toLocaleString()} ST</motion.div>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>= €{(earnings / 100).toLocaleString()} · convert to cash anytime</div>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: 'Bebas Neue', fontSize: 14, color: '#27ae60', background: 'rgba(39,174,96,0.15)', borderRadius: 24, padding: '6px 16px', border: '1px solid rgba(39,174,96,0.4)', textAlign: 'center' }}>
                WITHDRAW<br/><span style={{ fontSize: 10, fontFamily: 'Inter' }}>to bank</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

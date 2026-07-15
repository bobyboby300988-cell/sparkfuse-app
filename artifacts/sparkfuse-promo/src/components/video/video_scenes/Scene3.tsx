import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { GiftAnimation, type GiftKey } from '../GiftAnimations';

/* ─── Gift definitions — 1 ST = €0.01 ─── */
const GIFTS: Record<GiftKey, {
  label: string; st: number; eur: string;
  tier: 'small'|'medium'|'big'|'mega'; color: string; erotic?: boolean;
  emoji: string;
}> = {
  rose:        { label: 'Red Rose',     st: 1,     eur: '€0.01', tier: 'small',  color: '#FF416C', emoji: '🌹' },
  diamond:     { label: 'Diamond',      st: 100,   eur: '€1',    tier: 'small',  color: '#26C6DA', emoji: '💎' },
  lingerie:    { label: 'Lingerie',     st: 1000,  eur: '€10',   tier: 'medium', color: '#FF80AB', erotic: true, emoji: '🔥' },
  vibrator:    { label: 'Vibrator',     st: 2000,  eur: '€20',   tier: 'medium', color: '#E91E63', erotic: true, emoji: '🔞' },
  breast:      { label: 'Tits',         st: 3000,  eur: '€30',   tier: 'medium', color: '#FFAB91', erotic: true, emoji: '🔞' },
  rolex:       { label: 'Rolex',        st: 5000,  eur: '€50',   tier: 'big',    color: '#FFD700', emoji: '⌚' },
  bag:         { label: 'Designer Bag', st: 8000,  eur: '€80',   tier: 'big',    color: '#B0BEC5', emoji: '👜' },
  rocket:      { label: 'Rocket',       st: 10000, eur: '€100',  tier: 'big',    color: '#4FC3F7', emoji: '🚀' },
  ferrari:     { label: 'Ferrari',      st: 15000, eur: '€150',  tier: 'big',    color: '#C0392B', emoji: '🏎️' },
  lamborghini: { label: 'Lamborghini',  st: 30000, eur: '€300',  tier: 'mega',   color: '#FFD700', emoji: '🏎️' },
};

const GIFT_ORDER: GiftKey[] = ['rose', 'diamond', 'rolex', 'lamborghini'];

const TIER_CFG = {
  small:  { pCount: 14, pRadius: 65,  giftSize: 80,  liveMs: 700,  rings: 1 },
  medium: { pCount: 24, pRadius: 100, giftSize: 100, liveMs: 900,  rings: 2 },
  big:    { pCount: 36, pRadius: 140, giftSize: 120, liveMs: 1100, rings: 3 },
  mega:   { pCount: 52, pRadius: 180, giftSize: 160, liveMs: 1500, rings: 4 },
};

// Cars need landscape display — extra width
const CAR_GIFTS: Set<GiftKey> = new Set(['ferrari','lamborghini']);

interface ActiveGift { id: number; key: GiftKey; x: number }
interface ChatMsg    { id: number; user: string; text: string; color: string; isGift?: boolean }

const USER_COLORS = ['#F39C12','#e74c3c','#9b59b6','#3498db','#e67e22','#1abc9c','#FF5CA8'];
const HEARTS = Array.from({ length: 8 }, (_, i) => ({
  id: i, x: 16 + Math.random() * 68, delay: i * 0.55,
  dur: 2.0 + Math.random() * 1.4,
  emoji: ['❤️','💛','🧡','💜','💗','💝'][i % 6],
}));

/* ─── Gift Burst — animated SVG, small price pill ─── */
function GiftBurst({ ag, onDone }: { ag: ActiveGift; onDone: () => void }) {
  const def = GIFTS[ag.key];
  const cfg = TIER_CFG[def.tier];
  const isMega = def.tier === 'mega';
  const isBig  = def.tier === 'big' || isMega;
  const isCar  = CAR_GIFTS.has(ag.key);

  const particles = Array.from({ length: cfg.pCount }, (_, i) => {
    const angle = (360 / cfg.pCount) * i + (Math.random() - 0.5) * 12;
    const r = cfg.pRadius * (0.65 + Math.random() * 0.65);
    const pColors = [def.color, '#F39C12', '#fff', '#e74c3c', '#f1c40f'];
    return { angle, r, c: pColors[i % pColors.length], s: 2.5 + Math.random() * (isMega ? 9 : isBig ? 6 : 4) };
  });

  useEffect(() => { const t = setTimeout(onDone, cfg.liveMs); return () => clearTimeout(t); }, []);

  const displayW = isCar ? cfg.giftSize * 2.0 : cfg.giftSize;
  const displayH = isCar ? cfg.giftSize * 0.72 : cfg.giftSize;

  return (
    <motion.div style={{
      position: 'absolute', left: `${ag.x}%`, bottom: '30%',
      transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>

      {/* Glow halo */}
      {isBig && (
        <motion.div style={{
          position: 'absolute', borderRadius: '50%',
          background: `radial-gradient(circle, ${def.color}88 0%, transparent 70%)`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }}
          initial={{ width: cfg.giftSize, height: cfg.giftSize, opacity: 0.9 }}
          animate={{ width: cfg.pRadius * 3.5, height: cfg.pRadius * 3.5, opacity: 0 }}
          transition={{ duration: isMega ? 1.4 : 1.0, ease: 'easeOut' }}
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
            animate={{ x: Math.cos(rad) * p.r, y: -Math.sin(rad) * p.r * 0.85, opacity: 0, scale: 0.2 }}
            transition={{ duration: isMega ? 1.0 : isBig ? 0.8 : 0.65, delay: 0.04 + i * 0.006, ease: 'easeOut' }}
          />
        );
      })}

      {/* Shockwave rings */}
      {Array.from({ length: cfg.rings }).map((_, ring) => (
        <motion.div key={ring} style={{
          position: 'absolute', border: `${isMega ? 3 : 2}px solid ${def.color}`,
          borderRadius: '50%', top: '50%', left: '50%',
        }}
          initial={{ width: cfg.giftSize * 0.5, height: cfg.giftSize * 0.5, x: '-50%', y: '-50%', opacity: 0.9 }}
          animate={{ width: cfg.pRadius * (2.2 + ring * 0.7), height: cfg.pRadius * (2.2 + ring * 0.7), x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.85 + ring * 0.18, delay: ring * 0.13, ease: 'easeOut' }}
        />
      ))}

      {/* ─── Animated gift — no box, just the animated SVG ─── */}
      <motion.div style={{
        width: displayW, height: displayH,
        position: 'relative', zIndex: 51, overflow: 'visible',
        filter: isMega
          ? `drop-shadow(0 0 16px ${def.color}) drop-shadow(0 0 32px ${def.color}88)`
          : isBig
          ? `drop-shadow(0 0 10px ${def.color})`
          : `drop-shadow(0 0 6px ${def.color}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
        initial={{ scale: 0, opacity: 0, rotate: isCar ? 0 : -15 }}
        animate={{ scale: [0, isMega ? 1.8 : isBig ? 1.4 : 1.0, 1.0], opacity: [0, 1, 1], rotate: isCar ? 0 : [-15, 6, 0] }}
        transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
      >
        <GiftAnimation giftKey={ag.key} size={isCar ? displayH * 1.85 : cfg.giftSize} />
      </motion.div>

      {/* ─── Small price pill near the gift ─── */}
      <motion.div style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: isMega ? 14 : isBig ? 11 : 10,
        color: '#fff',
        background: isMega ? `${def.color}EE` : `rgba(0,0,0,0.75)`,
        borderRadius: 20,
        padding: isMega ? '2px 10px' : '1px 7px',
        border: `1px solid ${def.color}88`,
        boxShadow: isMega ? `0 0 12px ${def.color}88` : undefined,
        letterSpacing: '0.06em',
        marginTop: 4, zIndex: 52, flexShrink: 0,
      }}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        {def.label} · {def.st >= 1000 ? `${(def.st / 1000).toFixed(0)}K` : def.st} ST
        {isMega && <span style={{ marginLeft: 4, color: '#fff' }}>= €300</span>}
      </motion.div>

      {/* Ghost floater for big gifts */}
      {isBig && (
        <motion.div style={{
          fontSize: isMega ? 28 : 20, position: 'absolute', top: 0, left: '50%',
          marginLeft: isMega ? -14 : -10, zIndex: 49,
        }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: isMega ? -180 : isBig ? -130 : -90, opacity: [0, 0.8, 0] }}
          transition={{ delay: 0.4, duration: isMega ? 1.5 : 1.1, ease: 'easeOut' }}
        >{def.emoji}</motion.div>
      )}
    </motion.div>
  );
}

/* ─── Gift tray thumbnail ─── */
function GiftThumb({ giftKey, sent }: { giftKey: GiftKey; sent: boolean }) {
  const g = GIFTS[giftKey];
  const isMega = giftKey === 'lamborghini';
  return (
    <motion.div style={{
      width: 'calc(20% - 2.4px)', borderRadius: 9, overflow: 'hidden', position: 'relative',
      border: `1px solid ${sent ? g.color + '99' : g.erotic ? 'rgba(255,91,168,0.22)' : 'rgba(255,255,255,0.1)'}`,
      background: sent ? `${g.color}22` : 'rgba(255,255,255,0.05)',
      flexShrink: 0,
    }}
      animate={sent ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.4 }}
    >
      {/* Gradient icon area */}
      <div style={{
        height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: sent
          ? `linear-gradient(135deg, ${g.color}44, ${g.color}22)`
          : `linear-gradient(135deg, ${g.color}22, ${g.color}11)`,
        fontSize: 18, position: 'relative',
      }}>
        <span style={{ filter: sent ? 'none' : 'grayscale(40%)' }}>{g.emoji}</span>
        {isMega && (
          <motion.div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${g.color}28, rgba(243,156,18,0.18))`,
          }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
        )}
      </div>
      <div style={{ padding: '3px 2px', background: 'rgba(0,0,0,0.75)' }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 8,
          color: sent ? g.color : g.erotic ? '#FF5CA8' : 'rgba(255,255,255,0.5)',
          textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em',
        }}>{g.label}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          {g.st >= 1000 ? `${(g.st/1000).toFixed(0)}K` : g.st} ST
        </div>
      </div>
      {sent && (
        <motion.div style={{
          position: 'absolute', top: 2, right: 2, width: 12, height: 12,
          borderRadius: '50%', background: '#27ae60', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff',
        }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
        >✓</motion.div>
      )}
    </motion.div>
  );
}

/* ─── Main Scene ─── */
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

  const addMsg = (msg: Omit<ChatMsg,'id'>) =>
    setChatMsgs(prev => [...prev.slice(-5), { ...msg, id: nextId.current++ }]);

  const sendGift = (key: GiftKey, viewerBoost: number) => {
    setActiveGifts(prev => [...prev, { id: nextId.current++, key, x: 22 + Math.random() * 56 }]);
    setSentKeys(prev => new Set([...prev, key]));
    setEarnings(prev => prev + GIFTS[key].st);
    setViewers(prev => prev + viewerBoost);
  };

  useEffect(() => {
    const T = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex',   text: 'You look stunning tonight! 😍', color: USER_COLORS[0] }); }, 700),
      setTimeout(() => addMsg({ user: 'Mia',    text: 'First time here — love this! ✨', color: USER_COLORS[1] }), 1400),

      // 2s  Rose 1 ST
      setTimeout(() => { sendGift('rose', 8); addMsg({ user: 'Jake',     text: '🌹 Rose — 1 ST for my queen!', color: USER_COLORS[2], isGift: true }); }, 2000),
      // 5s  Diamond 100 ST
      setTimeout(() => { sendGift('diamond', 30); addMsg({ user: 'Luna',  text: '💎 Diamond! 100 ST 💙', color: USER_COLORS[4], isGift: true }); }, 5000),
      // 8s  Lingerie 1K ST
      setTimeout(() => { sendGift('lingerie', 95); addMsg({ user: 'Sam',  text: '🔥 Lingerie! 1,000 ST — irresistible 😈', color: USER_COLORS[1], isGift: true }); }, 8000),
      // 11s Vibrator 2K ST
      setTimeout(() => { setPhase(3); sendGift('vibrator', 140); addMsg({ user: '🔞 VIP', text: 'Vibrator!! 2,000 ST you\'re on fire!! 🔞', color: '#E91E63', isGift: true }); }, 11000),
      // 14s Breast 3K ST
      setTimeout(() => { sendGift('breast', 190); addMsg({ user: 'Marco', text: '🔞 Tits gift! 3,000 ST goddess!! 💋', color: USER_COLORS[3], isGift: true }); }, 14000),
      // 17s Rolex 5K ST
      setTimeout(() => { setPhase(4); sendGift('rolex', 270); addMsg({ user: '⌚ Dan', text: 'ROLEX!! 5,000 ST 👑 queen!', color: '#FFD700', isGift: true }); }, 17000),
      setTimeout(() => addMsg({ user: 'Sofia', text: 'She\'s on FIRE tonight!! 😱', color: USER_COLORS[5] }), 18400),
      // 20.5s Bag 8K ST
      setTimeout(() => { sendGift('bag', 360); addMsg({ user: '👜 Ana',  text: 'DESIGNER BAG!! 8,000 ST — fashion queen!', color: '#B0BEC5', isGift: true }); }, 20500),
      // 24s Rocket 10K ST
      setTimeout(() => { sendGift('rocket', 460); addMsg({ user: '🚀 VIP', text: 'ROCKET!! 10,000 ST!! 🚀💫', color: '#4FC3F7', isGift: true }); }, 24000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱 10K ST ROCKET!! INSANE!!!', color: '#F39C12' }), 25500),
      // 27.5s Ferrari 15K ST
      setTimeout(() => { setPhase(5); sendGift('ferrari', 620); addMsg({ user: '🏎️ Marco', text: 'FERRARI!!! 15,000 ST!! 🔥🔥🔥', color: '#C0392B', isGift: true }); }, 27500),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱 15K FERRARI!! SHE GOT A CAR!!!', color: '#C0392B' }), 29000),
      // 31s LAMBORGHINI €300 — HERO
      setTimeout(() => { sendGift('lamborghini', 1400); addMsg({ user: '⭐ Viktor', text: '🏎️🏎️ LAMBORGHINI!!! 30,000 ST = €300!!! GODDESS!!!', color: '#FFD700', isGift: true }); }, 31000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱😱 30,000 ST = €300 LAMBO!!!! 🔥🔥🔥', color: '#FFD700' }), 32800),
      setTimeout(() => setShowMore(true), 33800),
      setTimeout(() => setShowEarnings(true), 35200),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.4 }}
    >
      <motion.div className="absolute inset-0" style={{ pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 50% at 50% 28%, rgba(192,57,43,0.25) 0%, transparent 70%)',
      }} animate={{ opacity: [0.6,1,0.6] }} transition={{ duration: 3, repeat: Infinity }} />

      {/* 18+ badge */}
      <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 30, pointerEvents: 'none' }}>
        <div style={{ background: '#C0392B', borderRadius: 5, padding: '2px 7px', boxShadow: '0 0 8px rgba(192,57,43,0.6)' }}>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: '#fff', letterSpacing: '0.08em' }}>18+</span>
        </div>
      </div>

      {/* LIVE header */}
      <motion.div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}
        initial={{ opacity: 0, y: -16 }} animate={phase >= 1 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#C0392B', borderRadius: 40, padding: '4px 10px', boxShadow: '0 0 14px rgba(192,57,43,0.7)' }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#fff', letterSpacing: '0.12em' }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <motion.div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #C0392B, #F39C12)', border: '2px solid rgba(243,156,18,0.6)' }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0)', '0 0 14px rgba(243,156,18,0.8)', '0 0 0px rgba(243,156,18,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity }} />
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#fff' }}>Sarah M.</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>is live</div>
          </div>
        </div>
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 9px' }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.35 }} key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#fff' }}>{viewers.toLocaleString()}</span>
        </motion.div>
      </motion.div>

      {/* Stream area */}
      <motion.div style={{
        margin: '0 12px', borderRadius: 16, overflow: 'hidden', position: 'relative', height: '28%', flexShrink: 0,
        background: 'linear-gradient(180deg, #2a1025 0%, #1a0d1f 100%)', border: '1px solid rgba(192,57,43,0.3)',
      }}
        initial={{ opacity: 0, scale: 0.95 }} animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}} transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(192,57,43,0.2) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #C0392B 0%, #F39C12 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}
            animate={{ boxShadow: ['0 0 0px rgba(243,156,18,0.2)', '0 0 28px rgba(243,156,18,0.75)', '0 0 0px rgba(243,156,18,0.2)'] }} transition={{ duration: 2, repeat: Infinity }}
          >👩‍🦰</motion.div>
          <motion.div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}
            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          >● streaming live</motion.div>
        </div>
        {phase >= 2 && HEARTS.map(h => (
          <motion.div key={h.id} style={{ position: 'absolute', bottom: -10, left: `${h.x}%`, fontSize: 12, pointerEvents: 'none', zIndex: 5 }}
            animate={{ y: [0, -120], opacity: [0, 1, 0], scale: [0.6, 1, 0.7] }}
            transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: 'easeOut', repeatDelay: 3.5 }}
          >{h.emoji}</motion.div>
        ))}
        <AnimatePresence>
          {earnings > 0 && (
            <motion.div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)', borderRadius: 20, padding: '3px 10px', border: '1px solid rgba(243,156,18,0.55)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 4 }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={earnings}
            >
              <span style={{ fontSize: 10 }}>💰</span>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#F39C12' }}>+{earnings.toLocaleString()} ST</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Gift bursts */}
      <AnimatePresence>
        {activeGifts.map(ag => (
          <GiftBurst key={ag.id} ag={ag} onDone={() => setActiveGifts(p => p.filter(x => x.id !== ag.id))} />
        ))}
      </AnimatePresence>

      {/* Chat */}
      <motion.div style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3, zIndex: 10, overflow: 'hidden' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {chatMsgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, x: -20, y: 8 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: msg.isGift ? 'rgba(243,156,18,0.1)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '4px 8px', border: msg.isGift ? '1px solid rgba(243,156,18,0.3)' : 'none' }}
            >
              <div style={{ width: 17, height: 17, borderRadius: '50%', flexShrink: 0, background: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>{msg.user[0]}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: msg.color, fontWeight: 700 }}>{msg.user} </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: msg.isGift ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>{msg.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Chat input */}
      <motion.div style={{ padding: '0 8px 4px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}
        initial={{ opacity: 0, y: 12 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.35 }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 22, padding: '6px 11px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 13 }}>😊</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', flex: 1 }}>Say something…</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(192,57,43,0.35)', border: '1px solid rgba(192,57,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🎁</span>
        </div>
      </motion.div>

      {/* Gift tray — emoji icons, 2 rows of 5 */}
      <motion.div style={{ padding: '0 8px 6px', display: 'flex', flexWrap: 'wrap', gap: 3, zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        {GIFT_ORDER.map(key => <GiftThumb key={key} giftKey={key} sent={sentKeys.has(key)} />)}
      </motion.div>

      {/* Bottom overlays */}
      <AnimatePresence>
        {showMore && (
          <motion.div key="more" style={{ position: 'absolute', bottom: 105, left: 12, right: 12, zIndex: 20, display: 'flex', justifyContent: 'center' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          >
            <div style={{ background: 'rgba(0,0,0,0.88)', borderRadius: 20, padding: '4px 14px', border: '1px solid rgba(192,57,43,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11 }}>🎁</span>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>50 GIFTS IN APP · FROM 1 ST TO 30,000 ST = €300</span>
            </div>
          </motion.div>
        )}
        {showEarnings && (
          <motion.div key="earn" style={{ position: 'absolute', bottom: 72, left: 12, right: 12, zIndex: 21 }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, type: 'spring' }}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(243,156,18,0.25), rgba(192,57,43,0.2))', borderRadius: 14, padding: '8px 12px', border: '1px solid rgba(243,156,18,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>THIS STREAM EARNED</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#F39C12', letterSpacing: '0.04em' }}>{earnings.toLocaleString()} ST</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>= REAL MONEY</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#27ae60', letterSpacing: '0.04em' }}>€{(earnings / 100).toFixed(0)}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

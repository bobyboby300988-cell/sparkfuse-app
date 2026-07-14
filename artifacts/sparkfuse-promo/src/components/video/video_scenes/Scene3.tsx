import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── Real image URLs ─── */
const IMG = {
  rose:        'https://static.vecteezy.com/system/resources/thumbnails/063/104/555/small/hyper-realistic-rose-petals-vivid-colors-macro-artistic-floral-image-free-photo.jpeg',
  lips:        'https://static.vecteezy.com/system/resources/thumbnails/033/863/267/small/closeup-shot-of-beautiful-female-lips-with-glossy-red-lipstick-red-lips-makeup-ultra-close-up-view-of-beautiful-sexy-female-lips-ai-generated-free-photo.jpg',
  diamond:     'https://lerajewellery.com/cdn/shop/files/3-6997_1.jpg?v=1718713830&width=533',
  lingerie:    'https://images.pexels.com/photos/4118947/pexels-photo-4118947.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  champagne:   'https://static.vecteezy.com/system/resources/thumbnails/059/554/174/small/sparkling-gold-champagne-bottle-festive-celebration-drink-luxury-alcohol-elegant-design-free-png.png',
  watch:       'https://images.pexels.com/photos/3809175/pexels-photo-3809175.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  bag:         'https://png.pngtree.com/png-vector/20250220/ourmid/pngtree-luxury-designer-handbag-for-women-premium-leather-bag-fashionable-ladies-png-image_15533589.png',
  ferrari:     'https://images.pexels.com/photos/37284552/pexels-photo-37284552/free-photo-of-red-ferrari-sports-car-parked-on-a-city-street.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  castle:      'https://thumbs.dreamstime.com/b/pena-palace-sintra-lisbon-portugal-night-lights-famous-landmark-most-beautiful-castles-europe-162995510.jpg',
  lamborghini: 'https://w0.peakpx.com/wallpaper/129/612/HD-wallpaper-lamborghini-huracan-2018-yellow-sports-car-vag-performante-yellow-huracan-luxury-tuning-supercar-new-yellow-huracan-italian-cars-lamborghini-thumbnail.jpg',
};

/* ─── 10 gifts — medium to biggest (€5 → €300) ─── */
type GiftKey = 'rose'|'lips'|'diamond'|'lingerie'|'champagne'|'watch'|'bag'|'ferrari'|'castle'|'lamborghini';

const GIFTS: Record<GiftKey, {
  img: string; label: string; st: number;
  tier: 'small'|'medium'|'big'|'mega'; color: string; erotic?: boolean;
}> = {
  rose:        { img: IMG.rose,        label: 'Red Rose',     st: 500,   tier: 'small',  color: '#FF416C' },
  lips:        { img: IMG.lips,        label: 'Red Lips',     st: 1000,  tier: 'small',  color: '#FF5CA8', erotic: true },
  diamond:     { img: IMG.diamond,     label: 'Diamond Ring', st: 2000,  tier: 'small',  color: '#74EAEA' },
  lingerie:    { img: IMG.lingerie,    label: 'Lingerie',     st: 3000,  tier: 'medium', color: '#E94560', erotic: true },
  champagne:   { img: IMG.champagne,   label: 'Champagne',    st: 4000,  tier: 'medium', color: '#FFD700' },
  watch:       { img: IMG.watch,       label: 'Rolex Watch',  st: 5000,  tier: 'medium', color: '#D4A017' },
  bag:         { img: IMG.bag,         label: 'Designer Bag', st: 7500,  tier: 'big',    color: '#BDC3C7' },
  ferrari:     { img: IMG.ferrari,     label: 'Ferrari',      st: 10000, tier: 'big',    color: '#C0392B' },
  castle:      { img: IMG.castle,      label: 'Castle',       st: 15000, tier: 'big',    color: '#9B59B6' },
  lamborghini: { img: IMG.lamborghini, label: 'Lamborghini',  st: 30000, tier: 'mega',   color: '#FFD700' },
};

const GIFT_ORDER: GiftKey[] = ['rose','lips','diamond','lingerie','champagne','watch','bag','ferrari','castle','lamborghini'];

const TIER_CFG = {
  small:  { pCount: 14, pRadius: 65,  imgSize: 56,  liveMs: 1600, rings: 1 },
  medium: { pCount: 24, pRadius: 95,  imgSize: 80,  liveMs: 2100, rings: 2 },
  big:    { pCount: 36, pRadius: 135, imgSize: 105, liveMs: 2700, rings: 3 },
  mega:   { pCount: 52, pRadius: 175, imgSize: 128, liveMs: 3400, rings: 4 },
};

interface ActiveGift { id: number; key: GiftKey; x: number }
interface ChatMsg    { id: number; user: string; text: string; color: string; isGift?: boolean }

const USER_COLORS = ['#F39C12','#e74c3c','#9b59b6','#3498db','#e67e22','#1abc9c','#FF5CA8'];
const HEARTS = Array.from({ length: 8 }, (_, i) => ({ id: i, x: 16 + Math.random() * 68, delay: i * 0.55, dur: 2.0 + Math.random() * 1.4, emoji: ['❤️','💛','🧡','💜','💗','💝'][i % 6] }));

/* ─── Gift Burst — real image, stays in chat zone ─── */
function GiftBurst({ ag, onDone }: { ag: ActiveGift; onDone: () => void }) {
  const def = GIFTS[ag.key];
  const cfg = TIER_CFG[def.tier];
  const isMega = def.tier === 'mega';
  const isBig  = def.tier === 'big' || isMega;
  const [imgOk, setImgOk] = useState(true);

  const particles = Array.from({ length: cfg.pCount }, (_, i) => {
    const angle = (360 / cfg.pCount) * i + (Math.random() - 0.5) * 12;
    const r = cfg.pRadius * (0.65 + Math.random() * 0.65);
    const pColors = [def.color, '#F39C12', '#fff', '#e74c3c', '#f1c40f'];
    return { angle, r, c: pColors[i % pColors.length], s: 2.5 + Math.random() * (isMega ? 9 : isBig ? 6 : 4) };
  });

  useEffect(() => { const t = setTimeout(onDone, cfg.liveMs); return () => clearTimeout(t); }, []);

  return (
    <motion.div style={{
      position: 'absolute', left: `${ag.x}%`, bottom: '30%',
      transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none',
    }} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>

      {/* Local glow halo */}
      {isBig && (
        <motion.div style={{
          position: 'absolute', borderRadius: '50%',
          background: `radial-gradient(circle, ${def.color}99 0%, transparent 70%)`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }}
          initial={{ width: cfg.imgSize, height: cfg.imgSize, opacity: 0.9 }}
          animate={{ width: cfg.pRadius * 3.5, height: cfg.pRadius * 3.5, opacity: 0 }}
          transition={{ duration: isMega ? 1.3 : 0.9, ease: 'easeOut' }}
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
          initial={{ width: cfg.imgSize * 0.5, height: cfg.imgSize * 0.5, x: '-50%', y: '-50%', opacity: 0.9 }}
          animate={{ width: cfg.pRadius * (2.2 + ring * 0.7), height: cfg.pRadius * (2.2 + ring * 0.7), x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.85 + ring * 0.18, delay: ring * 0.13, ease: 'easeOut' }}
        />
      ))}

      {/* ─── Real image as the main visual ─── */}
      <motion.div style={{
        width: cfg.imgSize, height: cfg.imgSize,
        borderRadius: isMega ? 24 : 18,
        overflow: 'hidden', position: 'relative', zIndex: 51,
        boxShadow: isMega
          ? `0 0 40px ${def.color}, 0 0 80px ${def.color}66`
          : isBig ? `0 0 24px ${def.color}`
          : `0 0 12px ${def.color}88`,
        border: `${isMega ? 3 : 2}px solid ${def.color}`,
      }}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, isMega ? 2.0 : isBig ? 1.55 : 1.1, 1.05], opacity: [0,1,1], rotate: [-20, 8, 0] }}
        transition={{ duration: 0.55, ease: [0.175, 0.885, 0.32, 1.275] }}
      >
        {imgOk ? (
          <img
            src={def.img} alt={def.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgOk(false)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${def.color}66, ${def.color}22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: cfg.imgSize * 0.48, lineHeight: 1,
          }}>✨</div>
        )}
        {/* Gradient overlay for depth */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }} />
      </motion.div>

      {/* ST label */}
      <motion.div style={{
        fontFamily: 'Bebas Neue', fontSize: isMega ? 18 : isBig ? 14 : 11,
        color: '#fff', marginTop: 6, textAlign: 'center',
        background: isMega ? def.color : `${def.color}cc`,
        borderRadius: 20, padding: isMega ? '3px 14px' : '2px 9px',
        boxShadow: isMega ? `0 0 18px ${def.color}99` : undefined,
        zIndex: 52,
      }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
      >
        {def.label} · {def.st >= 1000 ? `${(def.st / 1000).toFixed(0)}K` : def.st} ST
        {def.st === 30000 && <span style={{ marginLeft: 4 }}>= €300</span>}
      </motion.div>

      {/* Ghost floater */}
      <motion.div style={{
        width: cfg.imgSize * 0.38, height: cfg.imgSize * 0.38, borderRadius: '50%',
        overflow: 'hidden', position: 'absolute', top: 0, left: '50%', marginLeft: -cfg.imgSize * 0.19, zIndex: 49,
      }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: isMega ? -200 : isBig ? -145 : -100, opacity: [0, 0.6, 0] }}
        transition={{ delay: 0.35, duration: isMega ? 1.5 : 1.1, ease: 'easeOut' }}
      >
        {imgOk && <img src={def.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </motion.div>
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

  const addMsg = (msg: Omit<ChatMsg,'id'>) => setChatMsgs(prev => [...prev.slice(-5), { ...msg, id: nextId.current++ }]);

  const sendGift = (key: GiftKey, viewerBoost: number) => {
    setActiveGifts(prev => [...prev, { id: nextId.current++, key, x: 22 + Math.random() * 56 }]);
    setSentKeys(prev => new Set([...prev, key]));
    setEarnings(prev => prev + GIFTS[key].st);
    setViewers(prev => prev + viewerBoost);
  };

  useEffect(() => {
    const T = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex',  text: 'You look stunning tonight! 😍', color: USER_COLORS[0] }); }, 700),
      setTimeout(() => addMsg({ user: 'Mia',  text: 'First time here — love this! ✨', color: USER_COLORS[1] }), 1400),

      // 3s Rose
      setTimeout(() => { sendGift('rose', 18); addMsg({ user: 'Jake',   text: '🌹 Rose 500 ST — for the queen!', color: USER_COLORS[2], isGift: true }); }, 3000),
      // 5.5s Red Lips
      setTimeout(() => { sendGift('lips', 35); addMsg({ user: 'Carlos', text: '💋 Red Lips! 1,000 ST gorgeous 😘', color: USER_COLORS[3], isGift: true }); }, 5500),
      // 8s Diamond Ring
      setTimeout(() => { sendGift('diamond', 65); addMsg({ user: 'Luna', text: '💎 Diamond Ring! 2,000 ST 💙', color: USER_COLORS[4], isGift: true }); }, 8000),
      // 10.5s Lingerie
      setTimeout(() => { sendGift('lingerie', 95); addMsg({ user: 'Sam',  text: '🔥 Lingerie! 3,000 ST — you\'re irresistible', color: USER_COLORS[1], isGift: true }); }, 10500),
      // 13s Champagne
      setTimeout(() => { sendGift('champagne', 130); addMsg({ user: '🥂 VIP', text: 'Champagne! 4,000 ST — celebrate! ✨', color: '#D4A017', isGift: true }); }, 13000),
      // 15.5s Rolex
      setTimeout(() => { setPhase(3); sendGift('watch', 200); addMsg({ user: '⌚ Dan', text: 'Rolex Watch!! 5,000 ST 👑', color: '#FFD700', isGift: true }); }, 15500),
      setTimeout(() => addMsg({ user: 'Sofia', text: 'She\'s on FIRE tonight!! 😱', color: USER_COLORS[5] }), 16800),
      // 18s Designer Bag
      setTimeout(() => { sendGift('bag', 280); addMsg({ user: '👜 Ana',  text: 'DESIGNER BAG!! 7,500 ST — fashion queen!', color: '#BDC3C7', isGift: true }); }, 18000),
      // 21s Ferrari
      setTimeout(() => { sendGift('ferrari', 400); addMsg({ user: '🏎️ Marco', text: 'FERRARI!!! 10,000 ST!! 🔥🔥', color: '#C0392B', isGift: true }); }, 21000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱 10K ST FERRARI!! INSANE!!!', color: '#F39C12' }), 22500),
      // 25s Castle → phase 4
      setTimeout(() => { setPhase(4); sendGift('castle', 580); addMsg({ user: '🏰 VIP Tyler', text: 'CASTLE!! 15,000 ST — ROYALTY!! 👑', color: '#9B59B6', isGift: true }); }, 25000),
      // 29s LAMBORGHINI €300 — HERO MOMENT
      setTimeout(() => { sendGift('lamborghini', 1400); addMsg({ user: '⭐ VIP Viktor', text: '🏎️🏎️ LAMBORGHINI!!! 30,000 ST = €300!!! YOU\'RE A GODDESS!! 🏎️🏎️', color: '#FFD700', isGift: true }); }, 29000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱😱 30,000 ST = €300 LAMBORGHINI!!!!! 🔥🔥🔥', color: '#FFD700' }), 30800),
      setTimeout(() => setShowMore(true), 32000),
      setTimeout(() => setShowEarnings(true), 33500),
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
      <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 30, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
        <div style={{ background: '#C0392B', borderRadius: 5, padding: '2px 7px', boxShadow: '0 0 8px rgba(192,57,43,0.6)' }}>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 13, color: '#fff', letterSpacing: '0.08em' }}>18+</span>
        </div>
      </div>

      {/* LIVE header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,140,0,0.12)', borderRadius: 20, padding: '3px 8px', border: '1px solid rgba(255,140,0,0.35)' }}>
          <span style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,140,0,0.9)', fontWeight: 600 }}>📱 App only</span>
        </div>
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 9px' }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.35 }} key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff' }}>{viewers.toLocaleString()}</span>
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

      {/* Gift bursts */}
      <AnimatePresence>
        {activeGifts.map(ag => <GiftBurst key={ag.id} ag={ag} onDone={() => setActiveGifts(p => p.filter(x => x.id !== ag.id))} />)}
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
              <div style={{ width: 17, height: 17, borderRadius: '50%', flexShrink: 0, background: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: 'Inter', marginTop: 1 }}>{msg.user[0]}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 9, color: msg.color, fontWeight: 700 }}>{msg.user} </span>
                <span style={{ fontFamily: 'Inter', fontSize: 9, color: msg.isGift ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>{msg.text}</span>
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
          <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.3)', flex: 1 }}>Say something…</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(192,57,43,0.35)', border: '1px solid rgba(192,57,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🎁</span>
        </div>
      </motion.div>

      {/* Gift tray — real image thumbnails, 2 rows of 5 */}
      <motion.div style={{ padding: '0 8px 6px', display: 'flex', flexWrap: 'wrap', gap: 3, zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        {GIFT_ORDER.map(key => {
          const g = GIFTS[key];
          const sent = sentKeys.has(key);
          const isMega = key === 'lamborghini';
          const [tImgOk, setTImgOk] = useState(true);
          return (
            <motion.div key={key} style={{
              width: 'calc(20% - 2.4px)', borderRadius: 9, overflow: 'hidden', position: 'relative',
              border: `1px solid ${sent ? g.color + '99' : g.erotic ? 'rgba(255,91,168,0.22)' : 'rgba(255,255,255,0.1)'}`,
              background: sent ? `${g.color}22` : 'rgba(255,255,255,0.05)',
            }}
              animate={sent ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }}
            >
              {/* Image background */}
              {tImgOk ? (
                <img src={g.img} alt={g.label}
                  style={{ width: '100%', height: 36, objectFit: 'cover', display: 'block', opacity: sent ? 0.95 : 0.65 }}
                  onError={() => setTImgOk(false)}
                />
              ) : (
                <div style={{ height: 36, background: `linear-gradient(135deg, ${g.color}44, ${g.color}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
              )}
              {isMega && (
                <motion.div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${g.color}28, rgba(243,156,18,0.18))` }}
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
              )}
              <div style={{ padding: '3px 2px', background: 'rgba(0,0,0,0.7)' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 7.5, color: sent ? g.color : 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 6, color: 'rgba(255,255,255,0.38)', textAlign: 'center' }}>{g.st >= 1000 ? `${g.st / 1000}K` : g.st} ST</div>
              </div>
              {sent && (
                <motion.div style={{ position: 'absolute', top: 2, right: 2, background: '#27ae60', borderRadius: '50%', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#fff' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
                >✓</motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Token info bar */}
      <motion.div style={{ margin: '0 8px 6px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10, background: 'rgba(243,156,18,0.08)', borderRadius: 10, padding: '4px 10px', border: '1px solid rgba(243,156,18,0.2)' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.3 }}
      >
        <span style={{ fontSize: 11 }}>⚡</span>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 10, color: '#F39C12' }}>10 gifts shown · 50 in app · biggest = 🏎️ Lamborghini 30,000 ST = €300</span>
      </motion.div>

      {/* More banner */}
      <AnimatePresence>
        {showMore && !showEarnings && (
          <motion.div style={{ position: 'absolute', bottom: 90, left: 12, right: 12, zIndex: 55, background: 'rgba(13,11,18,0.96)', borderRadius: 16, padding: '10px 14px', border: '1px solid rgba(243,156,18,0.4)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
          >
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, color: '#F39C12', letterSpacing: '0.08em', marginBottom: 5 }}>🎁 50 BEAUTIFUL & LUXURY GIFTS — FROM €0.50 TO €300!</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['🌹 Rose', '💋 Lips', '💎 Ring', '🔥 Lingerie', '⌚ Rolex', '👜 Bag', '🏎️ Ferrari', '🏰 Castle', '🏎️ Lambo €300'].map(g => (
                <div key={g} style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '2px 7px', border: '1px solid rgba(255,255,255,0.1)' }}>{g}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Earnings summary */}
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

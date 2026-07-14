import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── 6 gifts shown in the live stream promo ─── */
type GiftKey = 'lollipop' | 'beer' | 'teddy' | 'fireworks' | 'dragon' | 'rocket';

const GIFTS: Record<GiftKey, { emoji: string; label: string; st: number; tier: 'tiny'|'small'|'medium'|'big'|'mega'; color: string }> = {
  lollipop:  { emoji: '🍭', label: 'Lollipop',  st: 50,    tier: 'tiny',   color: '#FF5CA8' },
  beer:      { emoji: '🍺', label: 'Beer',       st: 200,   tier: 'small',  color: '#FFA000' },
  teddy:     { emoji: '🧸', label: 'Teddy Bear', st: 300,   tier: 'small',  color: '#FF7043' },
  fireworks: { emoji: '🎆', label: 'Fireworks',  st: 5000,  tier: 'medium', color: '#FF6D00' },
  dragon:    { emoji: '🐉', label: 'Dragon',     st: 10000, tier: 'big',    color: '#BF360C' },
  rocket:    { emoji: '🚀', label: 'Rocket',     st: 20000, tier: 'mega',   color: '#1565C0' },
};

const GIFT_ORDER: GiftKey[] = ['lollipop','beer','teddy','fireworks','dragon','rocket'];

const TIER_CFG = {
  tiny:   { pCount: 8,  pRadius: 55,  eSize: 40,  liveMs: 1200, rings: 0 },
  small:  { pCount: 16, pRadius: 80,  eSize: 58,  liveMs: 1600, rings: 1 },
  medium: { pCount: 28, pRadius: 120, eSize: 80,  liveMs: 2200, rings: 2 },
  big:    { pCount: 40, pRadius: 165, eSize: 105, liveMs: 2800, rings: 3 },
  mega:   { pCount: 60, pRadius: 210, eSize: 130, liveMs: 3500, rings: 4 },
};

interface ActiveGift { id: number; key: GiftKey; x: number }
interface ChatMsg    { id: number; user: string; text: string; color: string; isGift?: boolean }

const USER_COLORS = ['#F39C12','#e74c3c','#9b59b6','#3498db','#e67e22','#1abc9c','#FF5CA8'];

/* ─── Gift Burst ─── */
function GiftBurst({ ag, onDone }: { ag: ActiveGift; onDone: () => void }) {
  const def  = GIFTS[ag.key];
  const cfg  = TIER_CFG[def.tier];
  const isMega = def.tier === 'mega';
  const isBig  = def.tier === 'big' || isMega;

  const particles = Array.from({ length: cfg.pCount }, (_, i) => {
    const angle = (360 / cfg.pCount) * i + (Math.random() - 0.5) * 10;
    const r = cfg.pRadius * (0.65 + Math.random() * 0.7);
    const pColors = [def.color, '#F39C12', '#fff', '#e74c3c', '#f1c40f'];
    return { angle, r, c: pColors[i % pColors.length], s: 3 + Math.random() * (isMega ? 11 : isBig ? 7 : 5) };
  });

  useEffect(() => {
    const t = setTimeout(onDone, cfg.liveMs);
    return () => clearTimeout(t);
  }, [cfg.liveMs, onDone]);

  return (
    <motion.div style={{
      position: 'absolute', left: `${ag.x}%`, bottom: '30%',
      transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none',
    }} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>

      {/* Full-screen flash */}
      {isBig && (
        <motion.div style={{
          position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none',
          background: isMega
            ? `radial-gradient(ellipse 80% 80% at 50% 40%, ${def.color}88 0%, rgba(0,0,0,0.1) 70%)`
            : `${def.color}33`,
        }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: isMega ? 1.3 : 0.8, times: [0, 0.1, 0.5, 1] }}
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
            transition={{ duration: isMega ? 1.1 : isBig ? 0.85 : 0.65, delay: 0.04 + i * 0.006, ease: 'easeOut' }}
          />
        );
      })}

      {/* Shockwave rings */}
      {Array.from({ length: cfg.rings }).map((_, ring) => (
        <motion.div key={ring} style={{
          position: 'absolute', border: `${isMega ? 4 : 2}px solid ${def.color}`,
          borderRadius: '50%', top: '50%', left: '50%',
        }}
          initial={{ width: cfg.eSize * 0.4, height: cfg.eSize * 0.4, x: '-50%', y: '-50%', opacity: 0.95 }}
          animate={{ width: cfg.pRadius * (2.2 + ring * 0.7), height: cfg.pRadius * (2.2 + ring * 0.7), x: '-50%', y: '-50%', opacity: 0 }}
          transition={{ duration: 0.85 + ring * 0.18, delay: ring * 0.13, ease: 'easeOut' }}
        />
      ))}

      {/* Central emoji */}
      <motion.div style={{
        fontSize: cfg.eSize, lineHeight: 1, zIndex: 51, position: 'relative',
        filter: isMega ? `drop-shadow(0 0 40px ${def.color}) drop-shadow(0 0 80px ${def.color}88)`
          : isBig  ? `drop-shadow(0 0 22px ${def.color})` : undefined,
      }}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, isMega ? 2.6 : isBig ? 1.9 : 1.3, 1.1], opacity: [0, 1, 1], rotate: [-20, 8, 0], y: [0, isMega ? -28 : -14, 0] }}
        transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
      >{def.emoji}</motion.div>

      {/* ST label */}
      <motion.div style={{
        fontFamily: 'Bebas Neue', fontSize: isMega ? 22 : isBig ? 17 : 13,
        color: isMega ? '#0D0B12' : '#fff', marginTop: 6, textAlign: 'center',
        background: isMega ? def.color : isBig ? `${def.color}cc` : 'rgba(0,0,0,0.72)',
        borderRadius: 20, padding: isMega ? '4px 16px' : '2px 10px',
        boxShadow: isMega ? `0 0 24px ${def.color}99` : undefined,
      }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      >{def.label} · {def.st.toLocaleString()} ST</motion.div>

      {/* Ghost floater */}
      <motion.div style={{ fontSize: cfg.eSize * 0.45, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: isMega ? -280 : isBig ? -200 : -140, opacity: [0, 0.75, 0] }}
        transition={{ delay: 0.38, duration: isMega ? 1.7 : 1.2, ease: 'easeOut' }}
      >{def.emoji}</motion.div>
    </motion.div>
  );
}

/* ─── Floating hearts ─── */
const HEARTS = Array.from({ length: 10 }, (_, i) => ({
  id: i, x: 14 + Math.random() * 72, delay: i * 0.5,
  dur: 2.0 + Math.random() * 1.4, emoji: ['❤️','💛','🧡','💜','💗','💝'][i % 6],
}));

/* ════════════════════════════════════════════ */
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
    setActiveGifts(prev => [...prev, { id: nextId.current++, key, x: 28 + Math.random() * 44 }]);
    setSentKeys(prev => new Set([...prev, key]));
    setEarnings(prev => prev + stValue);
    setViewers(prev => prev + viewerBoost);
  };

  useEffect(() => {
    const T = [
      // 0-2s: go live
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => { setPhase(2); addMsg({ user: 'Alex',  text: 'OMG you look amazing! 😍',   color: USER_COLORS[0] }); }, 700),
      setTimeout(() => addMsg({ user: 'Mia',   text: 'First time here — love this! ✨',            color: USER_COLORS[1] }), 1500),

      // 3s — 🍭 Lollipop 50 ST
      setTimeout(() => {
        sendGift('lollipop', 50, 8);
        addMsg({ user: 'Jake',  text: '🍭 Sent a Lollipop! 50 ST 💗',           color: USER_COLORS[2], isGift: true });
      }, 3000),

      // 5s — 🍺 Beer 200 ST
      setTimeout(() => {
        sendGift('beer', 200, 22);
        addMsg({ user: 'Carlos', text: '🍺 Cheers!! 200 ST for you! ❤️',        color: USER_COLORS[3], isGift: true });
      }, 5000),

      // 7s — 🧸 Teddy 300 ST
      setTimeout(() => {
        sendGift('teddy', 300, 30);
        addMsg({ user: 'Luna',  text: '🧸 A warm hug! 300 ST 🥰',               color: USER_COLORS[4], isGift: true });
      }, 7000),
      setTimeout(() => addMsg({ user: 'Sam', text: 'She\'s adorable!! 🔥🔥',    color: USER_COLORS[1] }), 8200),

      // 9.5s — 🎆 Fireworks 5,000 ST
      setTimeout(() => {
        sendGift('fireworks', 5000, 180);
        addMsg({ user: '🎆 Ryan',  text: 'FIREWORKS!!! 5,000 ST!! 💥💥',        color: '#FF6D00', isGift: true });
      }, 9500),
      setTimeout(() => addMsg({ user: 'Sofia', text: 'WOW she is worth it!! 🥰', color: USER_COLORS[5] }), 10800),

      // 13s — 🐉 Dragon 10,000 ST
      setTimeout(() => {
        setPhase(3);
        sendGift('dragon', 10000, 320);
        addMsg({ user: '🐉 VIP Mark', text: 'DRAGON! 10,000 ST for the queen!! 🔥🔥🔥', color: '#FF6B35', isGift: true });
      }, 13000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '🔥🔥🔥 10,000 ST!! WOW!!!', color: '#e74c3c' }), 14500),

      // 17s — 🚀 Rocket 20,000 ST — HERO MOMENT
      setTimeout(() => {
        setPhase(4);
        sendGift('rocket', 20000, 750);
        addMsg({ user: '⭐ VIP Tyler', text: '🚀🚀 ROCKET!! 20,000 ST!! YOU\'RE THE BEST!! 🚀🚀', color: '#64B5F6', isGift: true });
      }, 17000),
      setTimeout(() => addMsg({ user: 'EVERYONE', text: '😱😱😱 20,000 ST ROCKET!!!!! 🚀🚀🚀', color: '#F39C12' }), 18600),

      // 20s — "many more" banner
      setTimeout(() => setShowMore(true), 20000),
      // 21.5s — earnings summary
      setTimeout(() => setShowEarnings(true), 21500),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background glow */}
      <motion.div className="absolute inset-0" style={{ pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 50% at 50% 28%, rgba(192,57,43,0.28) 0%, transparent 70%)',
      }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }} />

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
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 9px' }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.35 }} key={viewers}
        >
          <span style={{ fontSize: 10 }}>👁️</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff' }}>{viewers.toLocaleString()}</span>
        </motion.div>
      </motion.div>

      {/* ── Stream area ── */}
      <motion.div style={{
        margin: '0 12px', borderRadius: 16, overflow: 'hidden', position: 'relative', height: '30%', flexShrink: 0,
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
        {/* Earnings ticker */}
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
        {activeGifts.map(ag => (
          <GiftBurst key={ag.id} ag={ag} onDone={() => setActiveGifts(p => p.filter(x => x.id !== ag.id))} />
        ))}
      </AnimatePresence>

      {/* ── Chat ── */}
      <motion.div style={{ flex: 1, padding: '5px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3, zIndex: 10, overflow: 'hidden' }}
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
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', borderRadius: 22, padding: '6px 11px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 13 }}>😊</span>
          <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.3)', flex: 1 }}>
            {phase >= 3 ? 'Send a message…' : 'Say something…'}
          </span>
          <span style={{ fontSize: 11 }}>@</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(192,57,43,0.35)', border: '1px solid rgba(192,57,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🎁</span>
        </div>
      </motion.div>

      {/* ── Gift buttons ── */}
      <motion.div style={{ padding: '0 8px 6px', display: 'flex', gap: 4, zIndex: 10 }}
        initial={{ opacity: 0, y: 20 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
      >
        {GIFT_ORDER.map(key => {
          const g = GIFTS[key];
          const sent = sentKeys.has(key);
          const isHero = key === 'rocket';
          return (
            <motion.div key={key} style={{
              flex: isHero ? 1.3 : 1, borderRadius: 11, padding: '6px 3px', textAlign: 'center',
              background: sent ? `${g.color}28` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${sent ? g.color + '99' : 'rgba(255,255,255,0.1)'}`,
              position: 'relative', overflow: 'hidden',
            }}
              animate={sent ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.4 }}
            >
              {isHero && sent && (
                <motion.div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${g.color}30, rgba(243,156,18,0.2))` }}
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
              )}
              <div style={{ fontSize: [14, 16, 17, 22, 26, 30][GIFT_ORDER.indexOf(key)], position: 'relative', zIndex: 1 }}>{g.emoji}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 9, color: sent ? g.color : 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', marginTop: 1, position: 'relative', zIndex: 1 }}>{g.label}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 7, color: 'rgba(255,255,255,0.4)', marginTop: 1, position: 'relative', zIndex: 1 }}>{g.st >= 1000 ? `${(g.st/1000).toFixed(g.st % 1000 === 0 ? 0 : 1)}K` : g.st} ST</div>
              {sent && (
                <motion.div style={{ position: 'absolute', top: 2, right: 2, background: '#27ae60', borderRadius: '50%', width: 11, height: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >✓</motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Minimum token info ── */}
      <motion.div style={{ margin: '0 8px 6px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10, background: 'rgba(243,156,18,0.08)', borderRadius: 10, padding: '5px 10px', border: '1px solid rgba(243,156,18,0.2)' }}
        initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.3 }}
      >
        <span style={{ fontSize: 11 }}>⚡</span>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 12, color: '#F39C12' }}>50 ST minimum</span>
        <span style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>· many more gifts available</span>
      </motion.div>

      {/* ── "Many more gifts" banner ── */}
      <AnimatePresence>
        {showMore && !showEarnings && (
          <motion.div style={{ position: 'absolute', bottom: 90, left: 12, right: 12, zIndex: 55, background: 'rgba(13,11,18,0.92)', borderRadius: 16, padding: '10px 14px', border: '1px solid rgba(243,156,18,0.4)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
          >
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, color: '#F39C12', letterSpacing: '0.08em', marginBottom: 6 }}>🎁 AND MANY MORE BEAUTIFUL GIFTS!</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['🍭 50ST','🧁 100ST','🍺 200ST','🧸 300ST','🍓 500ST','🌙 1K ST','🦋 1.5K ST','🎩 2.5K ST','🍷 4K ST','🎆 5K ST','🔮 7.5K ST','🐉 10K ST','🦁 15K ST','🚀 20K ST','🌌 30K ST'].map(g => (
                <div key={g} style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '2px 7px', border: '1px solid rgba(255,255,255,0.1)' }}>{g}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Earnings summary (final 2s) ── */}
      <AnimatePresence>
        {showEarnings && (
          <motion.div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(13,11,18,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          >
            <motion.div style={{ textAlign: 'center' }} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <div style={{ fontSize: 44, marginBottom: 6 }}>💰</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(18px,5.5vw,28px)', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em' }}>THIS SESSION YOU EARNED</div>
              <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(40px,12vw,60px)', color: '#F39C12', letterSpacing: '0.06em', lineHeight: 1 }}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
              >{earnings.toLocaleString()} ST</motion.div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>from gifts · convert to cash when you withdraw</div>
            </motion.div>
            <motion.div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: '#27ae60', letterSpacing: '0.1em', background: 'rgba(39,174,96,0.15)', borderRadius: 30, padding: '7px 22px', border: '1px solid rgba(39,174,96,0.4)' }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            >WITHDRAW → €{(earnings / 100).toFixed(2)}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

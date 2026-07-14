import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

/* ─── 5 gifts shown in the DM chat (medium → big range) ─── */
type GiftKey = 'kiss' | 'diamond' | 'peach' | 'lips' | 'rocket';

const GIFT_DEFS: Record<GiftKey, { emoji: string; label: string; st: number; color: string; erotic?: boolean; size: 'small'|'medium'|'large' }> = {
  kiss:    { emoji: '💋', label: 'Kiss',    st: 1000,  color: '#FF5CA8', erotic: true, size: 'small' },
  diamond: { emoji: '💎', label: 'Diamond', st: 2000,  color: '#3498db',               size: 'small' },
  peach:   { emoji: '🍑', label: 'Peach',   st: 3000,  color: '#FF6B35', erotic: true, size: 'medium' },
  lips:    { emoji: '🫦', label: 'Lips',    st: 10000, color: '#e91e8c', erotic: true, size: 'medium' },
  rocket:  { emoji: '🚀', label: 'Rocket',  st: 30000, color: '#1565C0',               size: 'large' },
};

const GIFT_ORDER: GiftKey[] = ['kiss','diamond','peach','lips','rocket'];

const BURST_CFG = {
  small:  { pCount: 16, radius: 70,  emojiSz: 52, dur: 1500 },
  medium: { pCount: 28, radius: 110, emojiSz: 80, dur: 2000 },
  large:  { pCount: 48, radius: 165, emojiSz: 110, dur: 2800 },
};

interface BubbleItem {
  id: number;
  type: 'msg' | 'gift' | 'media';
  from: 'them' | 'me';
  text?: string;
  giftKey?: GiftKey;
  emoji?: string;
  locked?: boolean;
}

/* ─── Gift burst — anchored to BOTTOM of screen, streamer visible above ─── */
function DmGiftBurst({ giftKey, onDone }: { giftKey: GiftKey; onDone: () => void }) {
  const def = GIFT_DEFS[giftKey];
  const cfg = BURST_CFG[def.size];
  const isLarge = def.size === 'large';

  const particles = Array.from({ length: cfg.pCount }, (_, i) => {
    const angle = (360 / cfg.pCount) * i;
    const r = cfg.radius * (0.75 + Math.random() * 0.4);
    const rad = (angle * Math.PI) / 180;
    return {
      tx: Math.cos(rad) * r,
      ty: -Math.sin(rad) * r * 0.6,  /* keep within bottom zone */
      color: i % 3 === 0 ? def.color : i % 3 === 1 ? '#F39C12' : '#fff',
      s: 3 + Math.random() * (isLarge ? 8 : 5),
    };
  });

  useEffect(() => {
    const t = setTimeout(onDone, cfg.dur);
    return () => clearTimeout(t);
  }, [cfg.dur, onDone]);

  return (
    /* Burst confined to the BOTTOM 45% of the screen — chat stays visible above */
    <motion.div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '45%',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
    >
      {/* Gradient scrim — only covers the bottom area */}
      <motion.div style={{
        position: 'absolute', inset: 0,
        background: isLarge
          ? `radial-gradient(ellipse 85% 85% at 50% 70%, ${def.color}55 0%, rgba(13,11,18,0.85) 70%)`
          : `rgba(13,11,18,0.7)`,
      }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 0] }}
        transition={{ duration: isLarge ? 1.2 : 0.8, times: [0, 0.15, 0.5, 1] }}
      />

      {/* Ring pulse */}
      <motion.div style={{
        position: 'absolute', border: `${isLarge ? 4 : 2}px solid ${def.color}`, borderRadius: '50%',
      }}
        initial={{ width: cfg.emojiSz * 0.4, height: cfg.emojiSz * 0.4, opacity: 0.9 }}
        animate={{ width: cfg.radius * 2.6, height: cfg.radius * 2.6, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {isLarge && (
        <motion.div style={{ position: 'absolute', border: `2px solid rgba(243,156,18,0.5)`, borderRadius: '50%' }}
          initial={{ width: cfg.emojiSz * 0.4, height: cfg.emojiSz * 0.4, opacity: 0.6 }}
          animate={{ width: cfg.radius * 3.4, height: cfg.radius * 3.4, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.18 }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div key={i} style={{
          position: 'absolute', width: p.s, height: p.s, borderRadius: '50%',
          background: p.color, boxShadow: `0 0 ${p.s * 2}px ${p.color}88`,
        }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.8, delay: 0.04, ease: 'easeOut' }}
        />
      ))}

      {/* Main emoji */}
      <motion.div style={{
        fontSize: cfg.emojiSz, lineHeight: 1, position: 'relative', zIndex: 10,
        filter: isLarge
          ? `drop-shadow(0 0 28px ${def.color}) drop-shadow(0 0 50px ${def.color}88)`
          : `drop-shadow(0 0 16px ${def.color})`,
      }}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, isLarge ? 1.9 : 1.4, 1.05], opacity: [0, 1, 1], rotate: [-20, 10, 0] }}
        transition={{ duration: 0.55, ease: [0.175, 0.885, 0.32, 1.5] }}
      >{def.emoji}</motion.div>

      {/* ST badge */}
      <motion.div style={{
        marginTop: 12, background: 'rgba(0,0,0,0.8)', borderRadius: 20, padding: '4px 16px',
        border: `1px solid ${def.color}88`, fontFamily: 'Bebas Neue, sans-serif',
        fontSize: isLarge ? 22 : 17, color: def.color, letterSpacing: '0.08em',
        textShadow: `0 0 12px ${def.color}`, zIndex: 10,
      }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >+{def.st.toLocaleString()} ST · €{Math.round(def.st / 100)}</motion.div>

      <motion.div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, zIndex: 10 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
      >{def.label} Gift{def.erotic ? ' 🔞' : ''}</motion.div>

      {/* Floating copies */}
      {Array.from({ length: isLarge ? 4 : 2 }, (_, i) => (
        <motion.div key={i} style={{ position: 'absolute', fontSize: cfg.emojiSz * 0.45, left: `${30 + i * 12}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -(60 + i * 22), opacity: [0, 0.65, 0] }}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.95, ease: 'easeOut' }}
        >{def.emoji}</motion.div>
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
      <motion.div initial={{ opacity: 0, scale: 0.7, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
      >
        <div style={{
          background: `linear-gradient(135deg, ${def.color}22, ${def.color}10)`,
          border: `1px solid ${def.color}55`,
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: '75%',
        }}>
          <span style={{ fontSize: 22 }}>{def.emoji}</span>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: def.color, letterSpacing: '0.06em' }}>
              {def.label} Gift{def.erotic ? ' 🔞' : ''}
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
        <div style={{
          width: 100, height: 70, borderRadius: 12, overflow: 'hidden', position: 'relative',
          background: 'rgba(20,14,28,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
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
    <motion.div initial={{ opacity: 0, x: isMe ? 14 : -14, y: 4 }} animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3 }}
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

/* ─── Main Scene ─── */
export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [activeBurst, setActiveBurst] = useState<GiftKey | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [sentKeys, setSentKeys] = useState<Set<GiftKey>>(new Set());
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (item: Omit<BubbleItem, 'id'>) => {
    setBubbles(prev => [...prev.slice(-8), { ...item, id: nextId.current++ }]);
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
  };

  const sendGift = (key: GiftKey) => {
    push({ type: 'gift', from: 'me', giftKey: key });
    setActiveBurst(key);
    setBurstKey(k => k + 1);
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

      // Kiss 1,000 ST
      setTimeout(() => { setPhase(3); sendGift('kiss'); }, 2600),

      // Diamond 2,000 ST
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'You\'re amazing, I need to spoil you more 💙' }); }, 3600),
      setTimeout(() => { sendGift('diamond'); }, 4100),

      // Peach 3,000 ST
      setTimeout(() => { setPhase(4); sendGift('peach'); }, 5200),

      // Lips 10,000 ST
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'You\'re the hottest on SparkFuse 🫦🔥' }); }, 6400),
      setTimeout(() => { setPhase(5); sendGift('lips'); }, 6900),

      // Rocket 30,000 ST = €300
      setTimeout(() => { push({ type: 'msg', from: 'them', text: 'You deserve the BIGGEST gift 🚀💰' }); }, 8100),
      setTimeout(() => { setPhase(6); sendGift('rocket'); }, 8700),

      setTimeout(() => setPhase(7), 11500),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#0D0B12' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(192,57,43,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Gift burst — confined to bottom 45% only */}
      <AnimatePresence>
        {activeBurst && (
          <DmGiftBurst key={burstKey} giftKey={activeBurst} onDone={() => setActiveBurst(null)} />
        )}
      </AnimatePresence>

      {/* ── HEADER with video + voice call buttons ── */}
      <motion.div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 20, flexShrink: 0,
      }}
        initial={{ opacity: 0, y: -12 }} animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }} transition={{ duration: 0.4 }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8e44ad, #3498db)', border: '2px solid rgba(52,152,219,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👩</div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#27ae60', border: '2px solid #0D0B12' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#fff', fontWeight: 600 }}>Julia R.</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#27ae60' }}>● online now</div>
        </div>

        {/* Video call button */}
        <motion.div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'rgba(192,57,43,0.18)',
          border: '1px solid rgba(192,57,43,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }} animate={phase >= 3 ? { boxShadow: ['0 0 0px rgba(192,57,43,0)', '0 0 10px rgba(192,57,43,0.6)', '0 0 0px rgba(192,57,43,0)'] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >📹</motion.div>

        {/* Voice call button */}
        <motion.div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'rgba(39,174,96,0.15)',
          border: '1px solid rgba(39,174,96,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
        }} animate={phase >= 3 ? { boxShadow: ['0 0 0px rgba(39,174,96,0)', '0 0 10px rgba(39,174,96,0.5)', '0 0 0px rgba(39,174,96,0)'] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >📞</motion.div>

        {/* Earnings badge */}
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

      {/* ── CHAT BUBBLES ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'hidden', padding: '10px 12px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {bubbles.map(b => <Bubble key={b.id} item={b} />)}
        </AnimatePresence>
      </div>

      {/* ── GIFT TRAY ── */}
      <motion.div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, position: 'relative', zIndex: 20 }}
        initial={{ opacity: 0, y: 16 }} animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }} transition={{ duration: 0.4 }}
      >
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
          Send a Gift · 5 shown · 50 available
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {GIFT_ORDER.map((key) => {
            const def = GIFT_DEFS[key];
            const isSent = sentKeys.has(key);
            return (
              <motion.div key={key} style={{
                flex: 1, borderRadius: 13, padding: '8px 4px', textAlign: 'center',
                background: isSent ? `linear-gradient(135deg, ${def.color}28, ${def.color}18)` : 'rgba(20,16,30,0.9)',
                border: `1px solid ${isSent ? def.color + '70' : def.erotic ? 'rgba(255,91,168,0.25)' : 'rgba(255,255,255,0.08)'}`,
                position: 'relative', overflow: 'hidden',
              }}
                animate={isSent ? { scale: [1, 1.12, 1], boxShadow: [`0 0 0px ${def.color}00`, `0 0 18px ${def.color}55`, `0 0 0px ${def.color}00`] } : { scale: 1 }}
                transition={isSent ? { duration: 0.4 } : {}}
              >
                <div style={{ fontSize: key === 'rocket' ? 24 : key === 'lips' ? 20 : 17 }}>{def.emoji}</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 9, color: isSent ? def.color : def.erotic ? '#FF5CA8' : 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', marginTop: 2 }}>{def.label}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7.5, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  {def.st >= 1000 ? `${def.st / 1000}K` : def.st} ST
                </div>
                {isSent && (
                  <motion.div style={{ position: 'absolute', top: 3, right: 3, width: 13, height: 13, borderRadius: '50%', background: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700 }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                  >✓</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── BOTTOM CAPTION ── */}
      <AnimatePresence>
        {phase >= 7 && (
          <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(0deg, rgba(13,11,18,0.98) 70%, transparent)', padding: '20px 16px 14px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(16px, 5vw, 26px)', color: '#fff', letterSpacing: '0.06em', lineHeight: 1.1 }}>
              CHAT · PHOTOS · VIDEOS · <span style={{ color: '#F39C12' }}>GIFTS</span>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              50 gifts · 1,000 ST to 30,000 ST (€300)
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
              {[{ icon: '📹', label: 'Video call' }, { icon: '📞', label: 'Voice call' }].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(39,174,96,0.12)', borderRadius: 20, padding: '3px 10px', border: '1px solid rgba(39,174,96,0.35)' }}>
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#27ae60', fontWeight: 600 }}>{label} · Web &amp; App</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

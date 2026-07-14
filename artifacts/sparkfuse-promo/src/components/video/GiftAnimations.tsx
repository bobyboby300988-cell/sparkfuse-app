/**
 * GiftAnimations.tsx — Animated SVG gift components (Framer Motion)
 * SparkFuse 18+ adult gifting — luxury + erotic animated icons
 */
import { motion } from 'framer-motion';

function StarSpark({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  return (
    <motion.div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: size, height: size, background: color, pointerEvents: 'none',
      clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
    }}
      animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 0.85, delay, repeat: Infinity, repeatDelay: 0.8 + delay, ease: 'easeInOut' }}
    />
  );
}

/* ── ROSE 1 ST ── */
export function RoseGift({ size = 90 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 110" width={size} height={size}>
        <defs>
          <radialGradient id="rg1" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#FF80AB" /><stop offset="100%" stopColor="#C62828" /></radialGradient>
          <radialGradient id="rg2" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#FF6090" /><stop offset="100%" stopColor="#AD1457" /></radialGradient>
        </defs>
        {[0,72,144,216,288].map((a,i)=>{const r=(a-90)*Math.PI/180;const cx=50+22*Math.cos(r);const cy=46+22*Math.sin(r);return<ellipse key={i} cx={cx} cy={cy} rx="17" ry="12" fill="url(#rg2)" opacity="0.9" transform={`rotate(${a},${cx},${cy})`}/>})}
        {[36,108,180,252,324].map((a,i)=>{const r=(a-90)*Math.PI/180;const cx=50+13*Math.cos(r);const cy=46+13*Math.sin(r);return<ellipse key={i} cx={cx} cy={cy} rx="11" ry="8" fill="url(#rg1)" transform={`rotate(${a},${cx},${cy})`}/>})}
        <circle cx="50" cy="46" r="10" fill="url(#rg1)" />
        <circle cx="46" cy="42" r="3.5" fill="rgba(255,255,255,0.28)" />
        <line x1="50" y1="58" x2="50" y2="95" stroke="#388E3C" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="34" cy="78" rx="13" ry="6" fill="#43A047" transform="rotate(-30,34,78)" />
        <ellipse cx="66" cy="83" rx="13" ry="6" fill="#388E3C" transform="rotate(30,66,83)" />
        <circle cx="38" cy="68" r="2" fill="rgba(200,240,255,0.7)" />
      </svg>
      <StarSpark x={80} y={5}  size={7}  delay={0}   color="#FF80AB" />
      <StarSpark x={10} y={15} size={5}  delay={0.5} color="#FFD1DC" />
      <StarSpark x={65} y={-4} size={6}  delay={0.9} color="#FF416C" />
    </motion.div>
  );
}

/* ── DIAMOND 100 ST  (grows + rotates + sparkle rays) ── */
export function DiamondGift({ size = 120 }: { size?: number }) {
  const rays = [0,45,90,135,180,225,270,315];
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ scale: [0.85, 1.08, 0.85] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <radialGradient id="dg1" cx="35%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#E0F7FA" /><stop offset="40%" stopColor="#26C6DA" /><stop offset="100%" stopColor="#00838F" />
          </radialGradient>
          <radialGradient id="dg2" cx="30%" cy="20%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.85" /><stop offset="100%" stopColor="#B2EBF2" stopOpacity="0" />
          </radialGradient>
          <filter id="dGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {rays.map((angle,i)=>{const rad=angle*Math.PI/180;const x1=60+40*Math.cos(rad),y1=60+40*Math.sin(rad),x2=60+60*Math.cos(rad),y2=60+60*Math.sin(rad);return(
          <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i%2===0?'#E0F7FA':'#80DEEA'} strokeWidth={i%2===0?'2.5':'1.5'} strokeLinecap="round"
            animate={{opacity:[0,0.9,0]}} transition={{duration:1.0,delay:i*0.12,repeat:Infinity,repeatDelay:1.2}} />
        )})}
        <motion.g animate={{rotate:[0,360]}} transition={{duration:14,repeat:Infinity,ease:'linear'}} style={{transformOrigin:'60px 60px'}}>
          <polygon points="60,12 102,54 60,108 18,54" fill="url(#dg1)" filter="url(#dGlow)" />
          <polygon points="60,12 102,54 60,58" fill="rgba(224,247,250,0.55)" />
          <polygon points="60,12 18,54  60,58" fill="rgba(178,235,242,0.4)" />
          <polygon points="60,108 102,54 60,58" fill="rgba(0,100,110,0.45)" />
          <polygon points="60,108 18,54  60,58" fill="rgba(0,80,90,0.55)" />
          <polygon points="60,12 80,44 60,58 40,44" fill="rgba(255,255,255,0.18)" />
          <ellipse cx="45" cy="32" rx="13" ry="6" fill="url(#dg2)" transform="rotate(-25,45,32)" />
        </motion.g>
      </svg>
      {[{x:12,y:8,s:9,d:0},{x:80,y:4,s:11,d:0.35},{x:88,y:76,s:7,d:0.7},{x:4,y:72,s:9,d:1.0}].map((p,i)=>
        <StarSpark key={i} x={p.x} y={p.y} size={p.s} delay={p.d} color="#E0F7FA" />)}
    </motion.div>
  );
}

/* ── LINGERIE 1,000 ST  (18+ tasteful silhouette) ── */
export function LingerieGift({ size = 110 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 120" width={size} height={size}>
        <defs>
          <radialGradient id="lg1" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#FF80AB" /><stop offset="100%" stopColor="#C2185B" /></radialGradient>
          <radialGradient id="skinGrad" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#FFCCBC" /><stop offset="100%" stopColor="#E8A090" /></radialGradient>
          <filter id="lGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Body silhouette — hourglass */}
        <ellipse cx="50" cy="26" rx="16" ry="20" fill="url(#skinGrad)" />
        {/* Torso */}
        <path d="M34,46 Q28,60 30,80 Q40,90 50,90 Q60,90 70,80 Q72,60 66,46 Z" fill="url(#skinGrad)" />
        {/* Hips */}
        <ellipse cx="50" cy="82" rx="22" ry="12" fill="url(#skinGrad)" opacity="0.85" />
        {/* Bra — lace cut */}
        <path d="M34,46 Q40,38 50,40 Q60,38 66,46 Q64,56 50,58 Q36,56 34,46 Z" fill="url(#lg1)" filter="url(#lGlow)" opacity="0.95" />
        {/* Lace edge on bra */}
        <path d="M34,46 Q40,38 50,40 Q60,38 66,46" fill="none" stroke="rgba(255,182,210,0.65)" strokeWidth="1.5" strokeDasharray="2.5,2" />
        {/* Bra straps */}
        <path d="M37,40 Q34,28 38,22" fill="none" stroke="#F48FB1" strokeWidth="2" strokeLinecap="round" />
        <path d="M63,40 Q66,28 62,22" fill="none" stroke="#F48FB1" strokeWidth="2" strokeLinecap="round" />
        {/* Tanga / thong bottom — moving */}
        <motion.path d="M30,78 Q40,72 50,73 Q60,72 70,78 Q64,88 50,90 Q36,88 30,78 Z"
          fill="url(#lg1)" opacity="0.95"
          animate={{ d: ["M30,78 Q40,72 50,73 Q60,72 70,78 Q64,88 50,90 Q36,88 30,78 Z",
                         "M30,80 Q40,74 50,75 Q60,74 70,80 Q64,90 50,92 Q36,90 30,80 Z",
                         "M30,78 Q40,72 50,73 Q60,72 70,78 Q64,88 50,90 Q36,88 30,78 Z"] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Lace edge on tanga */}
        <motion.path d="M30,78 Q40,72 50,73 Q60,72 70,78"
          fill="none" stroke="rgba(255,182,210,0.6)" strokeWidth="1.5" strokeDasharray="2.5,2"
          animate={{ d: ["M30,78 Q40,72 50,73 Q60,72 70,78","M30,80 Q40,74 50,75 Q60,74 70,80","M30,78 Q40,72 50,73 Q60,72 70,78"] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Bow centre */}
        <ellipse cx="50" cy="74" rx="4" ry="3" fill="#F48FB1" />
        <polygon points="50,74 44,70 46,75" fill="#FF80AB" />
        <polygon points="50,74 56,70 54,75" fill="#FF80AB" />
        {/* Shimmer line */}
        <motion.line x1="40" y1="48" x2="44" y2="44" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"
          animate={{ opacity: [0,1,0], x1:[40,43], x2:[44,47] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }} />
      </svg>
      <StarSpark x={82} y={5} size={8} delay={0} color="#FF80AB" />
      <StarSpark x={8} y={20} size={6} delay={0.6} color="#FCE4EC" />
    </motion.div>
  );
}

/* ── VIBRATOR 2,000 ST  (18+ adult toy with vibration) ── */
export function VibratorGift({ size = 110 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ x: [-1.5, 1.5, -1.5, 1.5, 0] }}
      transition={{ duration: 0.14, repeat: Infinity, ease: 'linear' }}>
      <svg viewBox="0 0 100 120" width={size} height={size}>
        <defs>
          <linearGradient id="vg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E91E63" /><stop offset="45%" stopColor="#FF69B4" /><stop offset="100%" stopColor="#C2185B" />
          </linearGradient>
          <linearGradient id="vg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="50%" stopColor="#fff" stopOpacity="0.35" /><stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="vGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="vClip"><rect x="35" y="8" width="30" height="95" rx="15" /></clipPath>
        </defs>
        {/* Vibration wave rings */}
        {[0.1,0.3,0.5].map((d,i)=>(
          <motion.ellipse key={i} cx="50" cy="30" rx="28" ry="10" fill="none" stroke="#FF69B4" strokeWidth="1.5"
            animate={{rx:[20,38,20],ry:[7,14,7],opacity:[0.7,0,0.7]}}
            transition={{duration:0.5,delay:d,repeat:Infinity,ease:'easeOut'}} />
        ))}
        {/* Shaft body */}
        <rect x="35" y="18" width="30" height="85" rx="15" fill="url(#vg1)" filter="url(#vGlow)" />
        {/* Rounded top */}
        <ellipse cx="50" cy="20" rx="15" ry="13" fill="url(#vg1)" filter="url(#vGlow)" />
        <ellipse cx="50" cy="18" rx="13" ry="10" fill="#FF80AB" opacity="0.6" />
        {/* Highlight stripe */}
        <rect x="35" y="18" width="30" height="85" rx="15" fill="url(#vg2)" clipPath="url(#vClip)" />
        {/* Base button */}
        <ellipse cx="50" cy="103" rx="12" ry="6" fill="#AD1457" />
        <ellipse cx="50" cy="102" rx="7" ry="4" fill="#E91E63" />
        <circle cx="50" cy="101" r="3" fill="#FF80AB" />
        {/* Texture ridges */}
        {[40,54,68,82].map((y,i)=>(
          <motion.ellipse key={i} cx="50" cy={y} rx="14" ry="2.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"
            animate={{opacity:[0.2,0.5,0.2]}} transition={{duration:0.2,delay:i*0.05,repeat:Infinity}} />
        ))}
        {/* Sparkle at tip */}
        <motion.circle cx="50" cy="15" r="4" fill="#fff" opacity="0"
          animate={{opacity:[0,0.8,0],scale:[0.5,1.2,0.5]}} transition={{duration:0.6,repeat:Infinity,repeatDelay:1.2}} />
      </svg>
      <StarSpark x={75} y={5} size={9} delay={0} color="#FF69B4" />
      <StarSpark x={12} y={30} size={7} delay={0.4} color="#FCE4EC" />
      <StarSpark x={80} y={65} size={6} delay={0.8} color="#FF80AB" />
    </motion.div>
  );
}

/* ── BREAST 3,000 ST  (18+ animated bounce silhouette) ── */
export function BreastGift({ size = 115 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 120 100" width={size} height={size}>
        <defs>
          <radialGradient id="brg1" cx="42%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#FFCCBC" /><stop offset="60%" stopColor="#FFAB91" /><stop offset="100%" stopColor="#E8A090" />
          </radialGradient>
          <radialGradient id="brg2" cx="58%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#FFCCBC" /><stop offset="60%" stopColor="#FFAB91" /><stop offset="100%" stopColor="#E8A090" />
          </radialGradient>
          <radialGradient id="nipGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E57373" /><stop offset="100%" stopColor="#C62828" />
          </radialGradient>
          <filter id="brGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Left breast */}
        <motion.ellipse cx="38" cy="50" rx="30" ry="34"
          fill="url(#brg1)" filter="url(#brGlow)"
          animate={{ ry: [34, 36, 34, 32, 34], cy: [50, 48, 50, 52, 50] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Right breast */}
        <motion.ellipse cx="82" cy="50" rx="30" ry="34"
          fill="url(#brg2)" filter="url(#brGlow)"
          animate={{ ry: [34, 32, 34, 36, 34], cy: [50, 52, 50, 48, 50] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }} />
        {/* Highlight gloss left */}
        <motion.ellipse cx="30" cy="36" rx="10" ry="6" fill="rgba(255,255,255,0.35)" transform="rotate(-20,30,36)"
          animate={{ opacity: [0.25, 0.5, 0.25] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Highlight gloss right */}
        <motion.ellipse cx="74" cy="36" rx="10" ry="6" fill="rgba(255,255,255,0.35)" transform="rotate(20,74,36)"
          animate={{ opacity: [0.25, 0.5, 0.25] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        {/* Left nipple */}
        <motion.circle cx="38" cy="56" r="5" fill="url(#nipGrad)"
          animate={{ cy: [56, 54, 56, 58, 56] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Right nipple */}
        <motion.circle cx="82" cy="56" r="5" fill="url(#nipGrad)"
          animate={{ cy: [56, 58, 56, 54, 56] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }} />
        {/* Cleavage shadow */}
        <path d="M60,30 Q60,60 62,80" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" strokeLinecap="round" />
        {/* Heart sparkle */}
        <motion.text x="52" y="22" textAnchor="middle" fontSize="14" fill="#FF80AB"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          style={{ transformOrigin: '52px 22px' }}
          transition={{ duration: 1.6, repeat: Infinity }}>❤️</motion.text>
      </svg>
      <StarSpark x={8}  y={5}  size={8} delay={0}   color="#FFCCBC" />
      <StarSpark x={82} y={8}  size={7} delay={0.5} color="#FFAB91" />
      <StarSpark x={90} y={70} size={6} delay={1.0} color="#FF80AB" />
    </motion.div>
  );
}

/* ── ROLEX 5,000 ST  (watch face + gleam sweep) ── */
export function RolexGift({ size = 115 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <radialGradient id="rolexBezel" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFD700" /><stop offset="45%" stopColor="#D4A017" /><stop offset="100%" stopColor="#8B6914" />
          </radialGradient>
          <radialGradient id="rolexFace" cx="40%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#1A1A2E" /><stop offset="100%" stopColor="#0D0D1A" />
          </radialGradient>
          <radialGradient id="rolexGleam" cx="35%" cy="25%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" /><stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="rGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Crown (winding stem) */}
        <rect x="93" y="53" width="12" height="14" rx="4" fill="url(#rolexBezel)" />
        <rect x="91" y="57" width="6" height="6" rx="2" fill="#C8A228" />
        {/* Outer bezel */}
        <circle cx="60" cy="60" r="50" fill="url(#rolexBezel)" filter="url(#rGlow)" />
        {/* Inner bezel ring */}
        <circle cx="60" cy="60" r="44" fill="#1A1200" />
        {/* Minute markers on bezel */}
        {Array.from({length:60},(_,i)=>{
          const a=i*6*Math.PI/180;const r1=41,r2=i%5===0?36:38;
          return <line key={i} x1={60+r1*Math.cos(a-Math.PI/2)} y1={60+r1*Math.sin(a-Math.PI/2)} x2={60+r2*Math.cos(a-Math.PI/2)} y2={60+r2*Math.sin(a-Math.PI/2)} stroke={i%5===0?'#FFD700':'rgba(255,215,0,0.4)'} strokeWidth={i%5===0?2:1} />;
        })}
        {/* Watch face */}
        <circle cx="60" cy="60" r="35" fill="url(#rolexFace)" />
        {/* Hour markers */}
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{
          const a=i*30*Math.PI/180;return <rect key={i} x={60+26*Math.cos(a-Math.PI/2)-1} y={60+26*Math.sin(a-Math.PI/2)-3} width="2.5" height={i%3===0?8:5} fill="#FFD700" transform={`rotate(${i*30},${60+26*Math.cos(a-Math.PI/2)},${60+26*Math.sin(a-Math.PI/2)})`} />;
        })}
        {/* Date window */}
        <rect x="74" y="56" width="12" height="9" rx="2" fill="#fff" opacity="0.12" stroke="#FFD70055" strokeWidth="1" />
        <text x="80" y="63" textAnchor="middle" fontSize="5" fill="#FFD700" fontFamily="serif">14</text>
        {/* Rolex crown logo */}
        <text x="60" y="46" textAnchor="middle" fontSize="5" fill="#FFD700" fontFamily="serif">♛</text>
        <text x="60" y="52" textAnchor="middle" fontSize="3.5" fill="rgba(255,215,0,0.7)" fontFamily="serif" letterSpacing="1">ROLEX</text>
        {/* Hour hand */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 43200, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '60px 60px' }}>
          <rect x="58.5" y="42" width="3" height="20" rx="1.5" fill="#FFD700" />
        </motion.g>
        {/* Minute hand */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 3600, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '60px 60px' }}>
          <rect x="59" y="36" width="2" height="26" rx="1" fill="#fff" opacity="0.9" />
        </motion.g>
        {/* Seconds hand */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '60px 60px' }}>
          <line x1="60" y1="35" x2="60" y2="70" stroke="#C0392B" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="60" cy="60" r="2.5" fill="#C0392B" />
        </motion.g>
        {/* Centre cap */}
        <circle cx="60" cy="60" r="3" fill="#FFD700" />
        {/* Gleam sweep */}
        <motion.ellipse cx="45" cy="45" rx="18" ry="10" fill="url(#rolexGleam)"
          animate={{ opacity: [0, 0.7, 0], rotate: [0, 30] }}
          style={{ transformOrigin: '60px 60px' }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }} />
      </svg>
      <StarSpark x={80} y={5}  size={10} delay={0}   color="#FFD700" />
      <StarSpark x={8}  y={15} size={7}  delay={0.6} color="#FFF9C4" />
      <StarSpark x={88} y={78} size={8}  delay={1.2} color="#D4A017" />
    </motion.div>
  );
}

/* ── DESIGNER BAG 8,000 ST ── */
export function BagGift({ size = 110 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 110 110" width={size} height={size}>
        <defs>
          <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECEFF1" /><stop offset="35%" stopColor="#B0BEC5" /><stop offset="100%" stopColor="#546E7A" />
          </linearGradient>
          <linearGradient id="bagGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B6914" /><stop offset="50%" stopColor="#FFD700" /><stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
          <linearGradient id="bagShimmer" x1="-100%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="50%" stopColor="#fff" stopOpacity="0.45" /><stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="bagGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="bagClip"><rect x="18" y="38" width="74" height="62" rx="8" /></clipPath>
        </defs>
        {/* Handle */}
        <path d="M38,38 Q38,16 55,16 Q72,16 72,38" fill="none" stroke="url(#bagGold)" strokeWidth="5" strokeLinecap="round" />
        <path d="M38,38 Q38,18 55,18 Q72,18 72,38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
        {/* Handle rings */}
        <rect x="33" y="35" width="10" height="8" rx="3" fill="url(#bagGold)" />
        <rect x="67" y="35" width="10" height="8" rx="3" fill="url(#bagGold)" />
        {/* Bag body */}
        <rect x="18" y="38" width="74" height="62" rx="8" fill="url(#bagGrad)" filter="url(#bagGlow)" />
        {/* Leather texture lines */}
        {[52,62,72,82,92].map((y,i)=>
          <line key={i} x1="20" y1={y} x2="90" y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" />
        )}
        {/* Logo plate */}
        <rect x="40" y="60" width="30" height="18" rx="4" fill="url(#bagGold)" />
        <rect x="41" y="61" width="28" height="16" rx="3" fill="#1A0A00" />
        <text x="55" y="73" textAnchor="middle" fontSize="7" fill="#FFD700" fontFamily="serif" letterSpacing="1">SF</text>
        {/* Clasp */}
        <rect x="47" y="55" width="16" height="8" rx="3" fill="url(#bagGold)" />
        <circle cx="55" cy="59" r="2.5" fill="#FFD700" />
        {/* Shimmer sweep */}
        <motion.rect x="-30" y="38" width="40" height="62" fill="url(#bagShimmer)"
          clipPath="url(#bagClip)"
          animate={{ x: [-30, 110] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
      </svg>
      <StarSpark x={78} y={5} size={9} delay={0} color="#FFD700" />
      <StarSpark x={8}  y={20} size={7} delay={0.7} color="#CFD8DC" />
    </motion.div>
  );
}

/* ── ROCKET 10,000 ST  (comet trail) ── */
export function RocketGift({ size = 120 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ y: [4, -4, 4], rotate: [-5, 5, -5] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 110 110" width={size} height={size}>
        <defs>
          <linearGradient id="rktBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E3F2FD" /><stop offset="50%" stopColor="#42A5F5" /><stop offset="100%" stopColor="#1565C0" />
          </linearGradient>
          <linearGradient id="rktFire" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF176" /><stop offset="50%" stopColor="#FF7043" /><stop offset="100%" stopColor="#B71C1C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rktTrail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0" /><stop offset="100%" stopColor="#4FC3F7" stopOpacity="0.5" />
          </linearGradient>
          <filter id="rktGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Comet trail */}
        {[0,1,2].map(i=>(
          <motion.ellipse key={i} cx={20+i*15} cy={80+i*6} rx={4+i*3} ry={2+i*1.5}
            fill="url(#rktTrail)" opacity="0"
            animate={{ opacity: [0, 0.6, 0], cx: [20+i*15, 5+i*12] }}
            transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity, repeatDelay: 0.5 }} />
        ))}
        {/* Rocket body */}
        <path d="M55,10 Q65,10 68,30 L70,78 L55,82 L40,78 L42,30 Q45,10 55,10 Z" fill="url(#rktBody)" filter="url(#rktGlow)" />
        {/* Nose cone */}
        <path d="M55,10 Q65,10 68,30 L42,30 Q45,10 55,10 Z" fill="#E3F2FD" />
        {/* Window */}
        <circle cx="55" cy="42" r="9" fill="#0D47A1" />
        <circle cx="55" cy="42" r="7" fill="#1565C0" />
        <ellipse cx="52" cy="39" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.35)" transform="rotate(-20,52,39)" />
        {/* Wings */}
        <path d="M40,75 L28,92 L42,80 Z" fill="#1565C0" />
        <path d="M70,75 L82,92 L68,80 Z" fill="#1565C0" />
        {/* Thruster */}
        <rect x="48" y="78" width="14" height="8" rx="3" fill="#37474F" />
        {/* Flame */}
        <motion.path d="M49,86 Q52,95 55,105 Q58,95 61,86 Z" fill="url(#rktFire)"
          animate={{ scaleY: [1, 1.4, 0.8, 1.2, 1], scaleX: [1, 0.85, 1.1, 0.9, 1] }}
          style={{ transformOrigin: '55px 86px' }}
          transition={{ duration: 0.25, repeat: Infinity }} />
        {/* Stars around */}
        {[{x:22,y:20},{x:86,y:18},{x:92,y:60},{x:15,y:55}].map((p,i)=>(
          <motion.circle key={i} cx={p.x} cy={p.y} r="2" fill="#fff"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 0.8, delay: i*0.22, repeat: Infinity, repeatDelay: 1 }} />
        ))}
      </svg>
      <StarSpark x={75} y={5}  size={10} delay={0}   color="#4FC3F7" />
      <StarSpark x={5}  y={10} size={8}  delay={0.4} color="#E3F2FD" />
      <StarSpark x={85} y={80} size={7}  delay={0.9} color="#FFF176" />
    </motion.div>
  );
}

/* ── shared: CAR with spinning wheels ── */
function CarSVG({ color, accentColor, isLambo }: { color: string; accentColor: string; isLambo?: boolean }) {
  const wheelSpinStyle = { transformOrigin: 'center' } as React.CSSProperties;
  return (
    <svg viewBox="0 0 200 95" width="100%" height="100%">
      <defs>
        <linearGradient id={`carBody${isLambo?'L':''}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} /><stop offset="60%" stopColor={color} /><stop offset="100%" stopColor={`${color}BB`} />
        </linearGradient>
        <radialGradient id={`carShine${isLambo?'L':''}`} cx="40%" cy="30%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id={`carGlow${isLambo?'L':''}`}><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Shadow */}
      <ellipse cx="100" cy="88" rx="78" ry="6" fill="rgba(0,0,0,0.45)" />
      {/* Speed lines */}
      {[38,50,62].map((y,i)=>(
        <motion.line key={i} x1={0} y1={y} x2={30} y2={y} stroke={accentColor} strokeWidth={i===1?2:1.2} strokeLinecap="round" opacity="0.7"
          animate={{ x1: [0,35], x2: [30,65], opacity: [0.7,0] }}
          transition={{ duration: 0.45, delay: i*0.08, repeat: Infinity, ease: 'easeOut' }} />
      ))}
      {/* Body — main sill */}
      <rect x="12" y="58" width="172" height="20" rx={isLambo?3:6} fill={`url(#carBody${isLambo?'L':''})`} filter={`url(#carGlow${isLambo?'L':''})`} />
      {/* Cabin */}
      {isLambo ? (
        /* Lamborghini — angular wedge cabin */
        <path d="M55,58 L65,28 L90,22 L130,22 L150,40 L160,58 Z" fill={`url(#carBody${isLambo?'L':''})`} />
      ) : (
        /* Ferrari — curved cabin */
        <path d="M52,58 Q58,36 76,28 L124,28 Q145,28 152,44 L158,58 Z" fill={`url(#carBodyL)`} />
      )}
      {/* Windshield */}
      {isLambo ? (
        <path d="M70,57 L80,30 L120,25 L142,40 L145,57 Z" fill="rgba(120,200,255,0.22)" stroke="rgba(120,200,255,0.35)" strokeWidth="0.8" />
      ) : (
        <path d="M60,57 Q66,37 80,30 L118,30 Q138,30 146,46 L148,57 Z" fill="rgba(120,200,255,0.22)" stroke="rgba(120,200,255,0.35)" strokeWidth="0.8" />
      )}
      {/* Rear window */}
      {isLambo ? (
        <path d="M65,57 L72,30 L88,24 L88,57 Z" fill="rgba(80,160,220,0.18)" />
      ) : (
        <path d="M62,57 Q66,37 78,31 L78,57 Z" fill="rgba(80,160,220,0.18)" />
      )}
      {/* Body shine */}
      <path d={isLambo?"M65,40 L80,27 L100,24 L100,38 Z":"M70,40 Q76,32 86,30 L100,30 L100,43 Z"}
        fill={`url(#carShine${isLambo?'L':''})`} />
      {/* Door line */}
      <line x1="100" y1="58" x2={isLambo?105:102} y2="77" stroke="rgba(0,0,0,0.22)" strokeWidth="1" />
      {/* Headlight (front right) */}
      <ellipse cx="177" cy="65" rx="7" ry="4.5" fill="#FFFDE7" opacity="0.95" />
      <motion.ellipse cx="177" cy="65" rx="5" ry="3.5" fill="#FFF"
        animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.8, repeat: Infinity }} />
      {/* Tail light (rear left) */}
      <ellipse cx="18" cy="66" rx="5" ry="3.5" fill="#FF1744" opacity="0.85" />
      {/* Front bumper */}
      <path d={isLambo?"M168,72 L186,68 L186,76 L168,78 Z":"M168,72 Q180,68 188,70 L188,76 Q180,76 168,78 Z"}
        fill={color} opacity="0.9" />
      {/* Exhaust */}
      <ellipse cx="22" cy="76" rx="5" ry="3" fill="#444" />
      <ellipse cx="28" cy="76" rx="4" ry="2.5" fill="#555" />
      {/* Front wheel */}
      <circle cx="148" cy="77" r="16" fill="#111" />
      <circle cx="148" cy="77" r="12.5" fill="#222" />
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ ...wheelSpinStyle, transformOrigin: '148px 77px' }}>
        {[0,60,120,180,240,300].map((a,i)=>{const rad=a*Math.PI/180;return(
          <line key={i} x1={148+4*Math.cos(rad)} y1={77+4*Math.sin(rad)} x2={148+11.5*Math.cos(rad)} y2={77+11.5*Math.sin(rad)} stroke={i%2===0?'#AAA':'#777'} strokeWidth="2" strokeLinecap="round" />
        );})}
      </motion.g>
      <circle cx="148" cy="77" r="4.5" fill="#ccc" />
      <circle cx="148" cy="77" r="2.5" fill="#FFD700" />
      {/* Rear wheel */}
      <circle cx="52" cy="77" r="16" fill="#111" />
      <circle cx="52" cy="77" r="12.5" fill="#222" />
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ ...wheelSpinStyle, transformOrigin: '52px 77px' }}>
        {[0,60,120,180,240,300].map((a,i)=>{const rad=a*Math.PI/180;return(
          <line key={i} x1={52+4*Math.cos(rad)} y1={77+4*Math.sin(rad)} x2={52+11.5*Math.cos(rad)} y2={77+11.5*Math.sin(rad)} stroke={i%2===0?'#AAA':'#777'} strokeWidth="2" strokeLinecap="round" />
        );})}
      </motion.g>
      <circle cx="52" cy="77" r="4.5" fill="#ccc" />
      <circle cx="52" cy="77" r="2.5" fill="#FFD700" />
      {/* Wheel arch cutouts */}
      <path d="M30,72 Q52,58 74,72" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
      <path d="M126,72 Q148,58 170,72" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
      {/* Brand badge */}
      <circle cx="100" cy="68" r="5" fill={accentColor} opacity="0.8" />
      <text x="100" y="71" textAnchor="middle" fontSize="5" fill="#fff" fontFamily="sans-serif">⭐</text>
    </svg>
  );
}

/* ── FERRARI 15,000 ST ── */
export function FerrariGift({ size = 160 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: Math.round(size * 0.6), position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ x: 60, scale: 0.7 }}
      animate={{ x: 0, scale: [0.7, 1.08, 1.0] }}
      transition={{ duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}>
      <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 12px rgba(192,57,43,0.8))' }}>
        <CarSVG color="#C0392B" accentColor="#FF6B6B" />
      </div>
      <StarSpark x={85} y={-5} size={9} delay={0}   color="#FF6B6B" />
      <StarSpark x={5}  y={10} size={7} delay={0.5} color="#FF416C" />
      <StarSpark x={90} y={80} size={8} delay={1.0} color="#FFD700" />
    </motion.div>
  );
}

/* ── LAMBORGHINI 30,000 ST = €300  (HERO) ── */
export function LamborghiniGift({ size = 180 }: { size?: number }) {
  return (
    <motion.div style={{ width: size, height: Math.round(size * 0.6), position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ x: 80, scale: 0.6 }}
      animate={{ x: 0, scale: [0.6, 1.3, 1.0] }}
      transition={{ duration: 1.0, ease: [0.175, 0.885, 0.32, 1.275] }}>
      <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 0 40px rgba(255,140,0,0.5))' }}>
        <CarSVG color="#D4A017" accentColor="#FFD700" isLambo />
      </div>
      {[{x:82,y:-8,s:12,d:0},{x:3,y:5,s:9,d:0.3},{x:88,y:85,s:11,d:0.7},{x:5,y:75,s:10,d:1.0}].map((p,i)=>
        <StarSpark key={i} x={p.x} y={p.y} size={p.s} delay={p.d} color="#FFD700" />)}
    </motion.div>
  );
}

/* ── Dispatcher ── */
export type GiftKey = 'rose'|'diamond'|'lingerie'|'vibrator'|'breast'|'rolex'|'bag'|'rocket'|'ferrari'|'lamborghini';

export function GiftAnimation({ giftKey, size }: { giftKey: GiftKey; size?: number }) {
  const map: Record<GiftKey, React.FC<{size?:number}>> = {
    rose:        RoseGift,
    diamond:     DiamondGift,
    lingerie:    LingerieGift,
    vibrator:    VibratorGift,
    breast:      BreastGift,
    rolex:       RolexGift,
    bag:         BagGift,
    rocket:      RocketGift,
    ferrari:     FerrariGift,
    lamborghini: LamborghiniGift,
  };
  const C = map[giftKey];
  return <C size={size} />;
}

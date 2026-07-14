import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { speakScene, stopNarration, preloadNarration } from '@/lib/video/useNarration';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { SceneWithdraw } from './video_scenes/SceneWithdraw';

/* ─── Scene durations — locked to audio lengths + 500ms buffer ─── */
export const SCENE_DURATIONS: Record<string, number> = {
  hook:      6500,
  verify:   16600,
  live:     36800,
  withdraw: 18200,
  content:  22200,
  tokens:   21000,
  outro:    15700,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook:     Scene1,
  verify:   Scene2,
  live:     Scene3,
  withdraw: SceneWithdraw,
  content:  Scene4,
  tokens:   Scene5,
  outro:    Scene6,
};

const ORB_CONFIGS = [
  { color: '#C0392B', ax: ['12%','55%','22%'], ay: ['18%','55%','32%'], dur: 18 },
  { color: '#F39C12', ax: ['75%','28%','62%'], ay: ['68%','22%','52%'], dur: 22 },
  { color: '#C0392B', ax: ['50%','82%','18%'], ay: ['8%', '42%','12%'], dur: 15 },
];

/* ─── Background music (Web Audio API synthesizer) ─── */
class AmbientMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private stopped = false;

  start() {
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.setValueAtTime(0, this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3);
      this.master.connect(this.ctx.destination);
      this.scheduleLoop(this.ctx.currentTime);
    } catch (_) {}
  }

  private note(freq: number, start: number, dur: number, vol = 0.15) {
    if (!this.ctx || !this.master || this.stopped) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc1.type = 'sine'; osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.003;
    filter.type = 'lowpass'; filter.frequency.value = 800;
    const att = Math.min(2, dur * 0.3);
    const rel = Math.min(2, dur * 0.3);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + att);
    gain.gain.setValueAtTime(vol, start + dur - rel);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gain); gain.connect(this.master!);
    osc1.start(start); osc2.start(start);
    osc1.stop(start + dur + 0.1); osc2.stop(start + dur + 0.1);
  }

  private scheduleLoop(from: number) {
    if (!this.ctx || this.stopped) return;
    const beat = 4;
    const chords: [number, number, number][] = [
      [220, 261.6, 329.6],
      [174.6, 220, 261.6],
      [130.8, 164.8, 196],
      [196, 246.9, 293.7],
    ];
    chords.forEach(([r, t3, t5], i) => {
      const s = from + i * beat;
      this.note(r / 2, s, beat + 1.5, 0.18);
      this.note(r,     s, beat + 1.5, 0.14);
      this.note(t3,    s, beat + 1.5, 0.11);
      this.note(t5,    s, beat + 1.5, 0.09);
    });
    const loopDur = beat * chords.length;
    if (!this.stopped) {
      setTimeout(() => this.scheduleLoop(from + loopDur), (loopDur - 1.5) * 1000);
    }
  }

  stop() {
    this.stopped = true;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    }
    setTimeout(() => { try { this.ctx?.close(); } catch (_) {} }, 2000);
  }
}

/* ─── Tap-to-play splash screen ─── */
function TapToPlay({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden', background: '#0D0B12',
        width: 'min(100vw, calc(100vh * 9 / 16))',
        height: 'min(100vh, calc(100vw * 16 / 9))',
        aspectRatio: '9 / 16',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Orbs */}
        {ORB_CONFIGS.map((orb, i) => (
          <motion.div key={i} style={{
            position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
            width: '70%', height: '45%',
            background: `radial-gradient(circle, ${orb.color}45 0%, transparent 70%)`,
            filter: 'blur(40px)', transform: 'translate(-50%, -50%)',
            left: orb.ax[0], top: orb.ay[0],
          }}
            animate={{ left: orb.ax, top: orb.ay }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
          />
        ))}

        {/* Logo */}
        <motion.div style={{ marginBottom: 32, textAlign: 'center', position: 'relative', zIndex: 5 }}
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(40px,11vw,56px)', color: '#fff', letterSpacing: '0.12em', lineHeight: 1 }}>
            SPARK<span style={{ color: '#C0392B' }}>FUSE</span>
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginTop: 4 }}>
            THE DATING APP THAT PAYS YOU
          </div>
        </motion.div>

        {/* Play button */}
        <motion.div
          style={{
            width: 110, height: 110, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C0392B, #e74c3c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', zIndex: 5,
            marginBottom: 28,
          }}
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: ['0 0 40px rgba(192,57,43,0.5)', '0 0 80px rgba(192,57,43,0.85)', '0 0 40px rgba(192,57,43,0.5)'],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          onClick={onStart}
        >
          {/* Pulse ring */}
          <motion.div style={{
            position: 'absolute', inset: -14, borderRadius: '50%',
            border: '2px solid rgba(192,57,43,0.5)',
          }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginLeft: 6 }}>
            <path d="M12 8L38 22L12 36V8Z" fill="white"/>
          </svg>
        </motion.div>

        <motion.div
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(20px, 5.5vw, 28px)',
            color: '#fff', letterSpacing: '0.14em', marginBottom: 10,
            position: 'relative', zIndex: 5, cursor: 'pointer',
          }}
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          onClick={onStart}
        >
          TAP TO PLAY WITH SOUND
        </motion.div>

        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11,
          color: 'rgba(255,255,255,0.4)', textAlign: 'center',
          maxWidth: '78%', lineHeight: 1.6, position: 'relative', zIndex: 5,
        }}>
          🔊 Turn up your volume first<br/>
          Lady voice narration + background music
        </div>

        <div style={{
          marginTop: 14, fontFamily: 'Inter, sans-serif', fontSize: 10,
          color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em',
          position: 'relative', zIndex: 5,
        }}>~65 SECONDS · 7 SCENES</div>
      </div>
    </div>
  );
}

/* ─── Actual video player — only mounted AFTER tap ─── */
function VideoPlayer({
  durations,
  loop,
  onSceneChange,
}: {
  durations: Record<string, number>;
  loop: boolean;
  onSceneChange?: (key: string) => void;
}) {
  const musicRef = useRef<AmbientMusic | null>(null);
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  // Start music + preload all narration audio on mount
  useEffect(() => {
    preloadNarration();
    const music = new AmbientMusic();
    music.start();
    musicRef.current = music;
    return () => { music.stop(); stopNarration(); };
  }, []);

  // Narrate each scene change
  useEffect(() => {
    speakScene(currentSceneKey);
  }, [currentSceneKey]);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseKey = currentSceneKey?.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseKey];

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden', background: '#0D0B12',
        width: 'min(100vw, calc(100vh * 9 / 16))',
        height: 'min(100vh, calc(100vw * 16 / 9))',
        aspectRatio: '9 / 16',
      }}>
        {ORB_CONFIGS.map((orb, i) => (
          <motion.div key={i} style={{
            position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
            width: '70%', height: '45%',
            background: `radial-gradient(circle, ${orb.color}45 0%, transparent 70%)`,
            filter: 'blur(40px)', transform: 'translate(-50%, -50%)',
            left: orb.ax[0], top: orb.ay[0],
          }}
            animate={{ left: orb.ax, top: orb.ay }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
          />
        ))}
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (key: string) => void;
} = {}) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <TapToPlay onStart={() => setStarted(true)} />;
  }

  return <VideoPlayer durations={durations} loop={loop} onSceneChange={onSceneChange} />;
}

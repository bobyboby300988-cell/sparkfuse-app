import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { speakScene, stopNarration } from '@/lib/video/useNarration';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { SceneWithdraw } from './video_scenes/SceneWithdraw';

/* ─── Scene durations — total ~65 seconds ─── */
export const SCENE_DURATIONS: Record<string, number> = {
  hook:     5000,   // 5s  — brand intro
  verify:  14500,   // 14s — full payment flow (tap → card → pay → confirmed)
  live:    14000,   // 14s — live stream with 4 gift sizes including MEGA STAR
  withdraw:13000,   // 13s — withdraw flow (dashboard → IBAN → transfer → bank)
  content: 10000,   // 10s — DM gifts + content selling
  tokens:   8000,   // 8s  — token economy
  outro:    6000,   // 6s  — download CTA
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

/* ─── Background music synthesizer ─── */
class AmbientMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private stopped = false;

  start() {
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.setValueAtTime(0, this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3);
      this.master.connect(this.ctx.destination);
      this.scheduleLoop();
    } catch (_) {}
  }

  private note(freq: number, start: number, dur: number, vol = 0.3) {
    if (!this.ctx || !this.master || this.stopped) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine'; osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.003;

    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.5;

    const att = 2.5, rel = 2;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + att);
    gain.gain.setValueAtTime(vol, start + dur - rel);
    gain.gain.linearRampToValueAtTime(0, start + dur);

    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.master!);
    osc1.start(start); osc2.start(start);
    osc1.stop(start + dur); osc2.stop(start + dur);
    this.nodes.push(osc1, osc2, gain, filter);
  }

  private scheduleLoop() {
    if (!this.ctx || this.stopped) return;
    const t = this.ctx.currentTime;
    const beat = 4; // seconds per chord

    // Am → F → C → G chord progression (romantic minor key)
    // A minor: A C E
    const chords: [number, number, number][] = [
      [220, 261.6, 329.6], // Am: A3 C4 E4
      [174.6, 220, 261.6], // F:  F3 A3 C4
      [130.8, 164.8, 196], // C:  C3 E3 G3
      [196,   246.9, 293.7], // G: G3 B3 D4
    ];

    chords.forEach(([r, t3, t5], i) => {
      const start = t + i * beat;
      this.note(r,  start, beat + 1.5, 0.18);
      this.note(t3, start, beat + 1.5, 0.14);
      this.note(t5, start, beat + 1.5, 0.12);
      // Bass (octave below root)
      this.note(r / 2, start, beat + 1.5, 0.20);
    });

    // Schedule next loop before it ends
    const loopDur = beat * chords.length;
    if (!this.stopped) {
      setTimeout(() => this.scheduleLoop(), (loopDur - 2) * 1000);
    }
  }

  stop() {
    this.stopped = true;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    }
    setTimeout(() => {
      this.nodes.forEach(n => { try { (n as OscillatorNode).stop?.(); } catch (_) {} });
      try { this.ctx?.close(); } catch (_) {}
    }, 2000);
  }
}

/* ─── Main template ─── */
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
  const musicRef = useRef<AmbientMusic | null>(null);
  const { currentSceneKey } = useVideoPlayer({ durations: started ? durations : {}, loop });

  // Narrate each scene
  useEffect(() => {
    if (!started) return;
    speakScene(currentSceneKey);
    return () => { /* next effect call will cancel */ };
  }, [currentSceneKey, started]);

  // Stop narration on unmount
  useEffect(() => () => { stopNarration(); musicRef.current?.stop(); }, []);

  useEffect(() => {
    if (started) onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange, started]);

  const baseKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseKey];

  const handleStart = () => {
    setStarted(true);
    speakScene('hook');
    const music = new AmbientMusic();
    music.start();
    musicRef.current = music;
  };

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
        {/* Persistent drifting orbs */}
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

        {/* Scenes (only render when started) */}
        {started && (
          <AnimatePresence mode="popLayout">
            {SceneComponent && <SceneComponent key={currentSceneKey} />}
          </AnimatePresence>
        )}

        {/* Scene1 always visible as background when not started */}
        {!started && <Scene1 key="preview" />}

        {/* ── TAP TO PLAY overlay ── */}
        <AnimatePresence>
          {!started && (
            <motion.div
              key="tap-overlay"
              style={{
                position: 'absolute', inset: 0, zIndex: 100,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(13,11,18,0.72)',
                backdropFilter: 'blur(6px)',
                cursor: 'pointer',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={handleStart}
            >
              {/* Pulsing play ring */}
              <motion.div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: 'linear-gradient(135deg, #C0392B, #e74c3c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 60px rgba(192,57,43,0.7)',
                marginBottom: 24,
                position: 'relative',
              }}
                animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 40px rgba(192,57,43,0.5)', '0 0 80px rgba(192,57,43,0.9)', '0 0 40px rgba(192,57,43,0.5)'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Outer ring */}
                <motion.div style={{
                  position: 'absolute', inset: -12, borderRadius: '50%',
                  border: '2px solid rgba(192,57,43,0.4)',
                }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" style={{ marginLeft: 5 }}>
                  <path d="M14 10L34 21L14 32V10Z" fill="white"/>
                </svg>
              </motion.div>

              <motion.div style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(22px, 6vw, 30px)',
                color: '#fff', letterSpacing: '0.14em',
                marginBottom: 8,
              }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                TAP TO PLAY WITH SOUND
              </motion.div>

              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12,
                color: 'rgba(255,255,255,0.45)', textAlign: 'center',
                maxWidth: '80%', lineHeight: 1.5,
              }}>
                🔊 Turn up your volume<br/>
                Female voice narration + background music
              </div>

              <div style={{
                marginTop: 16,
                fontFamily: 'Inter, sans-serif', fontSize: 10,
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em',
              }}>~65 SECONDS</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

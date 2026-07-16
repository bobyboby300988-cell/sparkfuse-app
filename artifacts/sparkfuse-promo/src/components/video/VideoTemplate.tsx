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
import { Scene7 } from './video_scenes/Scene7';

/* ─── Scene durations — locked to actual audio lengths via ffprobe ───
 *  Formula: 300ms narration-start delay + audio_duration_ms + ~900ms buffer
 *  hook:     300 + 4362 + 838  = 5500   (audio 4.36 s)
 *  paywall:  300 + 7523 + 1177 = 9000   (audio 7.52 s)
 *  discover: 300 + 5251 + 1449 = 7000   (audio 5.25 s)
 *  messages: 300 + 7236 + 964  = 8500   (audio 7.24 s)
 *  live:     300 + 6269 + 1431 = 8000   (audio 6.27 s)
 *  earn:     300 + 6531 + 1169 = 8000   (audio 6.53 s)
 *  cta:      no audio           = 9000
 *  TOTAL = 55 000 ms = 55 s exactly ─── */
export const SCENE_DURATIONS: Record<string, number> = {
  hook:      5500,
  paywall:   9000,
  discover:  7000,
  messages:  8500,
  live:      8000,
  earn:      8000,
  cta:       9000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook:      Scene1,
  paywall:   Scene2,
  discover:  Scene3,
  messages:  Scene4,
  live:      Scene5,
  earn:      Scene6,
  cta:       Scene7,
};

const ORB_CONFIGS = [
  { color: '#C0392B', ax: ['12%','55%','22%'], ay: ['18%','55%','32%'], dur: 18 },
  { color: '#F39C12', ax: ['75%','28%','62%'], ay: ['68%','22%','52%'], dur: 22 },
  { color: '#FF6B9D', ax: ['50%','82%','18%'], ay: ['8%', '42%','12%'], dur: 15 },
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
      this.master.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.5);
      this.master.connect(this.ctx.destination);
      this.scheduleLoop(this.ctx.currentTime);
    } catch (_) {}
  }

  private note(freq: number, start: number, dur: number, vol = 0.12, type: OscillatorType = 'triangle') {
    if (!this.ctx || !this.master || this.stopped) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const att = 0.05;
    const rel = Math.min(0.15, dur * 0.4);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + att);
    gain.gain.setValueAtTime(vol, start + dur - rel);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  private noiseKick(start: number) {
    if (!this.ctx || !this.master || this.stopped) return;
    
    // Kick drum (pitch drop)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, start);
    osc.frequency.exponentialRampToValueAtTime(0.01, start + 0.5);
    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
    
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(start);
    osc.stop(start + 0.5);
  }

  private scheduleLoop(from: number) {
    if (!this.ctx || this.stopped) return;
    // Upbeat major-key melody in C major — bright and happy
    const BPM = 120; // upbeat pop feel
    const beat = 60 / BPM;
    const half = beat / 2;

    // Chord progression: C - G - Am - F (happy pop progression)
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major
      [392.00, 493.88, 587.33, 783.99], // G major
      [220.00, 261.63, 329.63, 440.00], // A minor
      [349.23, 440.00, 523.25, 698.46], // F major
    ];

    // Bass notes
    const bass = [130.81, 196.00, 110.00, 174.61];

    // Melody notes (top voice, upbeat rhythm)
    const melody = [
      [523.25, half], [587.33, half], [659.25, beat], [587.33, beat],
      [783.99, half], [698.46, half], [659.25, beat * 2],
      [440.00, half], [523.25, half], [587.33, beat], [523.25, beat],
      [349.23, half], [392.00, half], [523.25, beat * 2],
    ];

    let t = from;
    chords.forEach(([r, t3, t5, oct], ci) => {
      const s = from + ci * beat * 4;
      // Pad chord
      this.note(r, s, beat * 4, 0.04, 'sine');
      this.note(t3, s, beat * 4, 0.03, 'sine');
      this.note(t5, s, beat * 4, 0.025, 'sine');
      this.note(oct, s, beat * 4, 0.02, 'sine');
      
      // Fun bouncy bass
      this.note(bass[ci], s, beat * 1.5, 0.06, 'triangle');
      this.note(bass[ci], s + beat * 2, beat * 1.5, 0.06, 'triangle');
      
      // Kick drum on the beat
      for(let b=0; b<4; b++) {
         this.noiseKick(s + beat * b);
      }
    });

    // Play melody over the full chord progression
    melody.forEach(([freq, dur]) => {
      this.note(freq, t, dur as number, 0.05, 'square');
      t += dur as number;
    });

    const loopDur = beat * 16;
    if (!this.stopped) {
      setTimeout(() => this.scheduleLoop(from + loopDur), (loopDur - 0.5) * 1000);
    }
  }

  stop() {
    this.stopped = true;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }
    setTimeout(() => { try { this.ctx?.close(); } catch (_) {} }, 1500);
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
            SPARK<span style={{ color: '#FF6B9D' }}>FUSE</span>
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginTop: 4 }}>
            WHERE REAL CONNECTIONS HAPPEN
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
        }}>~55 SECONDS · 7 SCENES</div>
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

  const [recState, setRecState] = useState<'idle'|'waiting'|'recording'|'processing'|'done'>('idle');
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const stopFnRef   = useRef<(() => void) | null>(null);

  const handleDownload = async () => {
    if (recState !== 'idle') return;
    setRecState('waiting');
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        preferCurrentTab: true,
        video: { displaySurface: 'browser', frameRate: 30 },
        audio: { suppressLocalAudioPlayback: false },
      } as any);
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' });
      mediaRecRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setRecState('processing');
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        setTimeout(() => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href = url; a.download = 'sparkfuse-promo.webm'; a.click();
          URL.revokeObjectURL(url);
          setRecState('done');
          setTimeout(() => setRecState('idle'), 4000);
        }, 500);
      };
      mr.start(100);
      setRecState('recording');
      // Stop when the video finishes one loop (inject stopRecording override)
      stopFnRef.current = () => { if (mr.state === 'recording') mr.stop(); };
      const origStop = window.stopRecording;
      window.stopRecording = () => { stopFnRef.current?.(); origStop?.(); };
    } catch {
      setRecState('idle');
    }
  };

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

      {/* ── Download / Record overlay ── */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, maxWidth: 220 }}>

        {/* IDLE — show download button */}
        {recState === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button onClick={handleDownload} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #C0392B, #e74c3c)',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
              boxShadow: '0 2px 16px rgba(192,57,43,0.6)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              DOWNLOAD VIDEO
            </button>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.4)', textAlign: 'right', lineHeight: 1.4 }}>
              🖥️ Desktop Chrome only
            </div>
          </div>
        )}

        {/* WAITING — step-by-step instructions */}
        {recState === 'waiting' && (
          <div style={{
            background: 'rgba(0,0,0,0.88)', borderRadius: 10, padding: '10px 14px',
            fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#F39C12',
            fontWeight: 700, lineHeight: 1.8, border: '1px solid rgba(243,156,18,0.3)',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ marginBottom: 4 }}>📋 In the Chrome dialog:</div>
            <div style={{ color: '#fff', fontWeight: 400, fontSize: 10 }}>1. Click <b>"This Tab"</b> tab</div>
            <div style={{ color: '#fff', fontWeight: 400, fontSize: 10 }}>2. Click <b>"Share"</b></div>
            <div style={{ color: '#fff', fontWeight: 400, fontSize: 10 }}>3. Watch the full 55-sec video</div>
            <div style={{ color: '#fff', fontWeight: 400, fontSize: 10 }}>4. Click <b>STOP REC</b> below</div>
          </div>
        )}

        {/* RECORDING — blinking indicator + STOP button */}
        {recState === 'recording' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(192,57,43,0.92)', borderRadius: 8,
              padding: '7px 12px', color: '#fff',
              fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              ● REC — watch all 55 seconds…
            </div>
            <button
              onClick={() => stopFnRef.current?.()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.85)', border: '2px solid #e74c3c',
                borderRadius: 8, padding: '7px 14px', color: '#e74c3c',
                fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              ⏹ STOP REC &amp; SAVE
            </button>
          </div>
        )}

        {/* PROCESSING */}
        {recState === 'processing' && (
          <div style={{ background: 'rgba(0,0,0,0.85)', borderRadius: 8, padding: '8px 14px', color: '#F39C12', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700 }}>
            ⚙️ Saving your video…
          </div>
        )}

        {/* DONE */}
        {recState === 'done' && (
          <div style={{ background: 'rgba(0,128,0,0.85)', borderRadius: 8, padding: '8px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, lineHeight: 1.6 }}>
            ✅ Saved! Check your downloads.<br/>
            <span style={{ fontWeight: 400, fontSize: 10 }}>Upload the .webm file to TikTok / YouTube.</span>
          </div>
        )}
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
/* ─── Real AI-generated audio narration (Microsoft Azure Neural TTS - Jenny) ─── */

const BASE = import.meta.env.BASE_URL as string; // e.g. "/sparkfuse-promo/"

const SCENE_AUDIO: Record<string, string> = {
  hook:     BASE + 'audio/scene-hook.mp3',
  verify:   BASE + 'audio/scene-verify.mp3',
  live:     BASE + 'audio/scene-live.mp3',
  withdraw: BASE + 'audio/scene-withdraw.mp3',
  content:  BASE + 'audio/scene-content.mp3',
  tokens:   BASE + 'audio/scene-tokens.mp3',
  outro:    BASE + 'audio/scene-outro.mp3',
};

/* Pre-load all files so there's zero delay when each scene starts */
const audioCache: Record<string, HTMLAudioElement> = {};

export function preloadNarration() {
  if (typeof window === 'undefined') return;
  for (const [key, src] of Object.entries(SCENE_AUDIO)) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.volume  = 1.0;
    audioCache[key] = a;
  }
}

let current: HTMLAudioElement | null = null;

export function speakScene(sceneKey: string) {
  if (typeof window === 'undefined') return;

  // Stop whatever is playing
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }

  const baseKey = sceneKey.replace(/_r\d+$/, '');
  const audio = audioCache[baseKey];
  if (!audio) return;

  // Small pause so the scene entrance animation plays first
  setTimeout(() => {
    audio.currentTime = 0;
    audio.play().catch(() => {/* autoplay blocked — user gesture required */});
    current = audio;
  }, 300);
}

export function stopNarration() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}

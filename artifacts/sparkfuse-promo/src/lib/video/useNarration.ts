/* ─── Audio narration — all scenes use pre-recorded MP3 files ─── */

const BASE = import.meta.env.BASE_URL as string;

const SCENE_AUDIO: Record<string, string> = {
  hook:     BASE + 'audio/scene-hook.mp3',
  verify:   BASE + 'audio/scene-verify.mp3',
  live:     BASE + 'audio/scene-live.mp3',
  withdraw: BASE + 'audio/scene-withdraw.mp3',
  content:  BASE + 'audio/scene-content.mp3',
  tokens:   BASE + 'audio/scene-tokens.mp3',
  outro:    BASE + 'audio/scene-outro.mp3',
};

const audioCache: Record<string, HTMLAudioElement> = {};
let current: HTMLAudioElement | null = null;

export function preloadNarration() {
  if (typeof window === 'undefined') return;
  for (const [key, src] of Object.entries(SCENE_AUDIO)) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.volume  = 1.0;
    audioCache[key] = a;
  }
}

export function speakScene(sceneKey: string) {
  if (typeof window === 'undefined') return;

  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }

  const baseKey = sceneKey.replace(/_r\d+$/, '');
  const audio = audioCache[baseKey];
  if (!audio) return;

  setTimeout(() => {
    audio.currentTime = 0;
    audio.play().catch(() => {});
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

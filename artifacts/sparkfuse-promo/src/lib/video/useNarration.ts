/* ─── Audio narration — ElevenLabs pre-generated MP3 files ─── */

const BASE = import.meta.env.BASE_URL as string;

const SCENE_AUDIO: Record<string, string> = {
  hook:      BASE + 'audio/scene-hook.mp3',
  paywall:   BASE + 'audio/scene-paywall.mp3',
  discover:  BASE + 'audio/scene-discover.mp3',
  messages:  BASE + 'audio/scene-messages.mp3',
  live:      BASE + 'audio/scene-live.mp3',
  earn:      BASE + 'audio/scene-earn.mp3',
  cta:       BASE + 'audio/scene-cta.mp3',
};

const audioCache: Record<string, HTMLAudioElement> = {};
let current: HTMLAudioElement | null = null;

export function preloadNarration() {
  if (typeof window === 'undefined') return;
  for (const [key, src] of Object.entries(SCENE_AUDIO)) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.volume = 1.0;
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

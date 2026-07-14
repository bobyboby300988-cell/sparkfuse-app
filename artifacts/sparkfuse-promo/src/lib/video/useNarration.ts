/* ─────────────────────────────────────────────────────────────────
 *  Narration strategy:
 *    - Scenes with good pre-recorded MP3s → play the file
 *    - "live" and "content" → old MP3s had wrong gift names, so we
 *      use the Web Speech API with corrected scripts instead
 * ───────────────────────────────────────────────────────────────── */

const BASE = import.meta.env.BASE_URL as string;

/* ── MP3-backed scenes (correct narration) ── */
const SCENE_AUDIO: Record<string, string> = {
  hook:     BASE + 'audio/scene-hook.mp3',
  verify:   BASE + 'audio/scene-verify.mp3',
  withdraw: BASE + 'audio/scene-withdraw.mp3',
  tokens:   BASE + 'audio/scene-tokens.mp3',
  outro:    BASE + 'audio/scene-outro.mp3',
};

/* ── Corrected scripts for gift scenes ── */
const SCENE_SCRIPTS: Record<string, string> = {
  live: [
    'Watch fans send real luxury gifts during a live stream!',
    'A red rose for five hundred tokens.',
    'Red lips for one thousand.',
    'A diamond ring for two thousand.',
    'Hot lingerie for three thousand.',
    'Champagne for four thousand.',
    'A Rolex watch for five thousand.',
    'A designer bag for seventy-five hundred.',
    'A Ferrari for ten thousand.',
    'A royal castle for fifteen thousand.',
    'And the ultimate gift — a Lamborghini —',
    'thirty thousand tokens — three hundred euros!',
    'Go live and earn big on SparkFuse!',
  ].join(' '),

  content: [
    'Send real luxury gifts in private chats.',
    'Red lips for one thousand tokens.',
    'A diamond ring for two thousand.',
    'Hot lingerie for three thousand.',
    'A Rolex watch for five thousand.',
    'Or go all out with a Lamborghini —',
    'thirty thousand tokens, three hundred euros.',
    'Fifty stunning gifts from fifty cents to three hundred euros.',
    'Spoil your favourite creator privately on SparkFuse.',
  ].join(' '),
};

/* ── Audio cache for MP3 scenes ── */
const audioCache: Record<string, HTMLAudioElement> = {};
let currentAudio: HTMLAudioElement | null = null;

/* ── Speech synthesis state ── */
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

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
  stopNarration();

  const baseKey = sceneKey.replace(/_r\d+$/, '');

  pendingTimer = setTimeout(() => {
    /* ── MP3 path ── */
    const mp3 = audioCache[baseKey];
    if (mp3) {
      mp3.currentTime = 0;
      mp3.play().catch(() => {});
      currentAudio = mp3;
      return;
    }

    /* ── TTS script path ── */
    const script = SCENE_SCRIPTS[baseKey];
    if (!script || !('speechSynthesis' in window)) return;

    const utter = new SpeechSynthesisUtterance(script);
    utter.lang   = 'en-GB';
    utter.rate   = 0.9;
    utter.pitch  = 1.05;
    utter.volume = 1.0;

    /* Prefer a female voice if available */
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(v =>
      v.lang.startsWith('en') && /female|woman|girl|samantha|karen|victoria|moira|fiona/i.test(v.name)
    ) ?? voices.find(v => v.lang.startsWith('en')) ?? null;
    if (female) utter.voice = female;

    window.speechSynthesis.speak(utter);
  }, 350);
}

export function stopNarration() {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

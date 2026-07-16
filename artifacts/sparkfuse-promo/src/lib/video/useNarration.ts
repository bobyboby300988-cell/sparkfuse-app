/* ─── Audio narration — Web Speech API (browser TTS, no MP3 files needed) ─── */

const SCENE_SCRIPTS: Record<string, string> = {
  hook:      "SparkFuse. Where real connections happen. Meet amazing singles near you today.",
  paywall:   "For just two euros a month, unlock unlimited swipes, chat with all your matches, video calls, and live streams. No ads, ever.",
  discover:  "Discover amazing people nearby. Swipe right to like, swipe left to pass. Your perfect match is just one swipe away.",
  messages:  "Match, then chat and video call instantly. Real conversations that lead to real chemistry.",
  live:      "Go live and connect with thousands of viewers. Real-time comments and genuine new connections every day.",
  earn:      "Build your profile, get discovered, and create meaningful connections with people who share your spark.",
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('samantha') ||
     v.name.toLowerCase().includes('victoria') ||
     v.name.toLowerCase().includes('karen') ||
     v.name.toLowerCase().includes('moira') ||
     v.name.toLowerCase().includes('tessa') ||
     (v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('us')))
  );
  return preferred || voices.find(v => v.lang.startsWith('en')) || null;
}

export function preloadNarration() {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function speakScene(sceneKey: string) {
  if (typeof window === 'undefined') return;
  stopNarration();

  const baseKey = sceneKey.replace(/_r\d+$/, '');
  const text = SCENE_SCRIPTS[baseKey];
  if (!text) return;

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.08;
    utterance.volume = 1.0;
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }, 300);
}

export function stopNarration() {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

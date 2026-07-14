import { useEffect, useRef } from 'react';

/* ─── Scene narration scripts ─── */
const NARRATIONS: Record<string, string> = {
  hook: `Welcome to SparkFuse — the dating app that actually pays you.`,

  verify: `Getting started is simple. Pay just two euros, once, to verify your account.
           You can use a credit card or PayPal. That's it — full access, unlocked forever.`,

  live: `Go live and let the world see you.
         Fans join your stream and send gifts — a Rose, a Diamond, or a Crown.
         Every gift puts real money in your pocket.
         When you're ready, cash out directly to your bank.`,

  content: `Chat privately with your matches.
            Share free photos to get them interested — then sell your exclusive content.
            Fans unlock your premium photos and videos using tokens.
            They can also send you gifts in chat — small, medium, or large.
            Every gift converts to real cash for you.`,

  tokens: `SparkFuse runs on ST tokens.
           Fans buy tokens and spend them on gifts, live streams, and exclusive content.
           You earn tokens instantly every time someone supports you.
           When you're ready to withdraw, just a ten percent platform fee applies.
           The rest goes straight to your bank.`,

  outro: `SparkFuse is available right now on the web.
          The Android app on Google Play is coming very soon.
          The iPhone App Store version follows after that.
          Find your spark. Start earning today.`,
};

/* ─── Pick the best available female voice ─── */
function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Priority list — best female voices across platforms
  const preferred = [
    'Samantha',               // iOS / macOS — natural, warm
    'Google UK English Female',
    'Microsoft Aria Online',
    'Microsoft Aria',
    'Microsoft Zira',
    'Karen',                  // macOS AU
    'Moira',                  // macOS IE
    'Tessa',                  // macOS ZA
    'Serena',                 // iOS
  ];

  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }

  // Fall back: any English female-sounding voice
  const enFemale = voices.find(
    v => v.lang.startsWith('en') && /female|woman|girl/i.test(v.name)
  );
  if (enFemale) return enFemale;

  // Last resort: first English voice
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null;
}

/* ─── Hook ─── */
export function useNarration(sceneKey: string, enabled = true) {
  const voicesReadyRef = useRef(false);
  const pendingRef     = useRef<{ key: string } | null>(null);

  // Speak helper
  function speak(key: string) {
    const synth = window.speechSynthesis;
    const baseKey = key.replace(/_r\d+$/, '');
    const text    = NARRATIONS[baseKey];
    if (!text || !enabled) return;

    synth.cancel();

    const utterance     = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' ').trim());
    const voice         = pickFemaleVoice(synth.getVoices());
    if (voice) utterance.voice = voice;

    utterance.rate   = 0.90;   // slightly slower — clear and calm
    utterance.pitch  = 1.08;   // a touch higher — female warmth
    utterance.volume = 1.0;

    // Small pause so the scene's entrance animation plays first
    setTimeout(() => synth.speak(utterance), 250);
  }

  // Wait for voices to load on first mount (async in Chrome)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    if (synth.getVoices().length > 0) {
      voicesReadyRef.current = true;
    } else {
      const handler = () => {
        voicesReadyRef.current = true;
        if (pendingRef.current) {
          speak(pendingRef.current.key);
          pendingRef.current = null;
        }
        synth.removeEventListener('voiceschanged', handler);
      };
      synth.addEventListener('voiceschanged', handler);
    }

    return () => { synth.cancel(); };
  }, []);

  // Speak whenever the scene changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!enabled) { window.speechSynthesis.cancel(); return; }

    if (voicesReadyRef.current) {
      speak(sceneKey);
    } else {
      // Voices not loaded yet — queue it
      pendingRef.current = { key: sceneKey };
    }
  }, [sceneKey, enabled]);
}

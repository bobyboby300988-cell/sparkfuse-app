/* ─── Narration scripts for each scene ─── */
const NARRATIONS: Record<string, string> = {
  hook: `Welcome to SparkFuse. The dating app that actually pays you real money.`,

  verify: `Getting started is simple and safe. Just pay two euros — one single time — to verify your account. 
           Watch as you enter your card details, press pay, and in seconds your payment is confirmed. 
           Your account is now verified. Full access unlocked. You are ready to start earning.`,

  live: `Now go live and let the world see you. 
         Fans join your stream and they start sending gifts. 
         First a Rose for five tokens. Then a Diamond for fifty tokens. 
         Then a Crown for two hundred tokens! 
         And then the biggest gift of all — a Mega Star worth five hundred tokens! 
         Every single gift puts real money directly into your pocket. 
         When you are ready, just press withdraw and cash out to your bank.`,

  withdraw: `Here is your earnings dashboard. This month you earned one hundred and twenty seven euros and fifty cents. 
             From live streams, from DM gifts, and from content sales. 
             Press withdraw, enter your bank account number, and confirm. 
             Watch as the transfer processes in real time. 
             One hundred and fourteen euros and seventy five cents — sent directly to your bank. 
             Only a ten percent platform fee is deducted. The rest is all yours.`,

  content: `In private chat, you can share exclusive photos and videos. 
            Fans pay to unlock your premium content using tokens. 
            They can also send you gifts in private messages — small, medium, or large. 
            Every gift, every unlock, every tip — it all converts to real cash for you.`,

  tokens: `SparkFuse runs on ST tokens. Fans buy token packs — one hundred, five hundred, or one thousand tokens. 
           They spend those tokens on gifts, live streams, and exclusive content. 
           You earn tokens instantly every time someone supports you. 
           Withdraw anytime with just a ten percent platform fee. The rest goes straight to your bank.`,

  outro: `SparkFuse is available right now on the web. 
          The Android app on Google Play is coming very soon. 
          The iPhone App Store version follows shortly after. 
          Sign up today. Start earning tomorrow. Find your spark.`,
};

/* ─── Voice selector: picks best female voice ─── */
function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferred = [
    'Samantha', 'Google UK English Female', 'Microsoft Aria Online',
    'Microsoft Aria', 'Microsoft Zira', 'Karen', 'Moira', 'Tessa', 'Serena',
    'Google US English', 'Victoria',
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  const enFemale = voices.find(v => v.lang.startsWith('en') && /female|woman/i.test(v.name));
  if (enFemale) return enFemale;
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null;
}

/* ─── ResponsiveVoice wrapper (declared globally via CDN in index.html) ─── */
declare const responsiveVoice: {
  speak: (text: string, voice: string, params?: {
    pitch?: number; rate?: number; volume?: number;
    onstart?: () => void; onend?: () => void;
  }) => void;
  cancel: () => void;
  isPlaying: () => boolean;
  voiceSupport: () => boolean;
} | undefined;

let voicesLoaded = false;
let pendingSpeak: (() => void) | null = null;

function ensureVoicesLoaded(cb: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (voicesLoaded) { cb(); return; }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) { voicesLoaded = true; cb(); return; }
  window.speechSynthesis.addEventListener('voiceschanged', function handler() {
    voicesLoaded = true;
    window.speechSynthesis.removeEventListener('voiceschanged', handler);
    cb();
  });
}

/* ─── Main speak function ─── */
export function speakScene(sceneKey: string) {
  const baseKey = sceneKey.replace(/_r\d+$/, '');
  const text = NARRATIONS[baseKey];
  if (!text) return;

  const clean = text.replace(/\s+/g, ' ').trim();

  // Try ResponsiveVoice first (best mobile support, real Google TTS)
  if (typeof responsiveVoice !== 'undefined') {
    try {
      responsiveVoice.cancel();
      setTimeout(() => {
        responsiveVoice.speak(clean, 'UK English Female', {
          pitch: 1.05,
          rate: 0.88,
          volume: 1,
        });
      }, 300);
      return;
    } catch (_) { /* fall through */ }
  }

  // Fallback: Web Speech API
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const doSpeak = () => {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(clean);
      const voice = pickFemaleVoice(window.speechSynthesis.getVoices());
      if (voice) utter.voice = voice;
      utter.rate   = 0.88;
      utter.pitch  = 1.08;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    }, 300);
  };

  ensureVoicesLoaded(doSpeak);
}

export function stopNarration() {
  if (typeof responsiveVoice !== 'undefined') {
    try { responsiveVoice.cancel(); } catch (_) {}
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

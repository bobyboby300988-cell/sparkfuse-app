declare const responsiveVoice: {
  speak: (
    text: string,
    voice: string,
    parameters?: {
      pitch?: number;
      rate?: number;
      volume?: number;
      onstart?: () => void;
      onend?: () => void;
      onerror?: () => void;
    }
  ) => void;
  cancel: () => void;
  isPlaying: () => boolean;
  voiceSupport: () => boolean;
};

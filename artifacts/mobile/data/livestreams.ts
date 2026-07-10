export interface LiveStream {
  id: string;
  name: string;
  age: number;
  avatar: any;
  tagline: string;
  category: "Dating" | "Naughty" | "Party" | "Social" | "Flirty";
  viewers: number;
  tokens: number;
  isVerified: boolean;
  badges: string[];
}

// Demo streams removed — this list now only reflects real users currently
// broadcasting (populated at runtime from the API), so no fake profiles show up.
export const LIVE_STREAMS: LiveStream[] = [];

export const CATEGORY_COLORS: Record<string, [string, string]> = {
  Dating:  ["#FF6B9D", "#C9184A"],
  Naughty: ["#4A0000", "#CC0000"],
  Party:   ["#7B2FBE", "#C77DFF"],
  Social:  ["#0077B6", "#48CAE4"],
  Flirty:  ["#FF6B35", "#FF3366"],
};

// Demo chat messages removed — only real viewer messages appear now.
export const MOCK_CHAT: { name: string; text: string; gift?: string }[] = [];

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

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: "ls1",
    name: "Sofia",
    age: 24,
    avatar: require("../assets/images/p1.png"),
    tagline: "Come talk to me 💋",
    category: "Flirty",
    viewers: 1243,
    tokens: 8420,
    isVerified: true,
    badges: ["🔥 Top 1%", "💎 Elite"],
  },
  {
    id: "ls2",
    name: "Elena",
    age: 22,
    avatar: require("../assets/images/p2.png"),
    tagline: "Naughty night vibes 😈",
    category: "Naughty",
    viewers: 876,
    tokens: 5310,
    isVerified: true,
    badges: ["🌶️ Spicy"],
  },
  {
    id: "ls3",
    name: "Maya",
    age: 26,
    avatar: require("../assets/images/p3.png"),
    tagline: "Let's vibe together 🌙",
    category: "Social",
    viewers: 532,
    tokens: 2190,
    isVerified: false,
    badges: ["✨ Rising"],
  },
  {
    id: "ls4",
    name: "Aria",
    age: 23,
    avatar: require("../assets/images/p4.png"),
    tagline: "Party all night 🎉",
    category: "Party",
    viewers: 2105,
    tokens: 14800,
    isVerified: true,
    badges: ["🏆 Legend", "🔥 Top 1%"],
  },
  {
    id: "ls5",
    name: "Luna",
    age: 25,
    avatar: require("../assets/images/p5.png"),
    tagline: "Your midnight fantasy 🖤",
    category: "Naughty",
    viewers: 1890,
    tokens: 11230,
    isVerified: true,
    badges: ["😈 Erotic"],
  },
  {
    id: "ls6",
    name: "Zara",
    age: 21,
    avatar: require("../assets/images/p6.png"),
    tagline: "Find love with me 💘",
    category: "Dating",
    viewers: 341,
    tokens: 980,
    isVerified: false,
    badges: ["🌹 Sweet"],
  },
];

export const CATEGORY_COLORS: Record<string, [string, string]> = {
  Dating:  ["#FF6B9D", "#C9184A"],
  Naughty: ["#4A0000", "#CC0000"],
  Party:   ["#7B2FBE", "#C77DFF"],
  Social:  ["#0077B6", "#48CAE4"],
  Flirty:  ["#FF6B35", "#FF3366"],
};

export const MOCK_CHAT: { name: string; text: string; gift?: string }[] = [
  { name: "Alex",    text: "omg you're so beautiful 😍" },
  { name: "Marco",   text: "sending love from Italy 🇮🇹" },
  { name: "Jake",    text: "first time here, love it!" },
  { name: "Diego",   text: "you're insane 🔥🔥🔥",        gift: "🌹 Rose" },
  { name: "Luca",    text: "can you say hi to me?" },
  { name: "Ryan",    text: "this is the best stream ever" },
  { name: "Mike",    text: "stay longer please 🙏",        gift: "💋 Kiss" },
  { name: "Nico",    text: "❤️❤️❤️" },
  { name: "Oliver",  text: "you made my night girl 💫",    gift: "💎 Diamond" },
  { name: "Tom",     text: "where are you from?" },
  { name: "Kevin",   text: "absolute goddess 👑",          gift: "👑 Crown" },
  { name: "Sam",     text: "hello beautiful 🌹" },
  { name: "Chris",   text: "can we chat after?" },
  { name: "Paulo",   text: "incredible 😩🔥🔥",           gift: "🔥 Flame" },
  { name: "Max",     text: "you deserve everything" },
  { name: "Ethan",   text: "wow wow wow" },
  { name: "Ben",     text: "sending all my tokens 😈",     gift: "😈 Devil" },
  { name: "Carlos",  text: "te amo hermosa 💕" },
  { name: "Finn",    text: "🚀🚀🚀 SUPERNOVA!",            gift: "🚀 Supernova" },
  { name: "David",   text: "best night of my life 🌌",     gift: "🌌 Galaxy" },
];

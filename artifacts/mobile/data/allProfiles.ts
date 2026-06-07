import { AppMode } from "@/context/AppContext";

export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  interests: string[];
  photo: ReturnType<typeof require>;
  distance: number;
  height: string;
  lat: number;
  lng: number;
  mode: AppMode;
}

// ─── Dating (IDs kept as "1"–"6" for AsyncStorage backward-compat) ────────────
const DATING: Profile[] = [
  {
    id: "1", name: "Sophie", age: 24, mode: "dating",
    bio: "Coffee shop hopper and weekend hiker. Looking for someone to get lost with on a trail.",
    location: "Paris", interests: ["Hiking", "Coffee", "Photography"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'6\"",
    lat: 48.8566, lng: 2.3522,
  },
  {
    id: "2", name: "Marcus", age: 28, mode: "dating",
    bio: "Music producer by day, home chef by night. Will cook for the right person.",
    location: "London", interests: ["Music", "Cooking", "Travel"],
    photo: require("../assets/images/p2.png"), distance: 5, height: "6'1\"",
    lat: 51.5074, lng: -0.1278,
  },
  {
    id: "3", name: "Zara", age: 27, mode: "dating",
    bio: "Art director with a weakness for vintage bookshops and rooftop sunsets.",
    location: "Rome", interests: ["Art", "Reading", "Wine"],
    photo: require("../assets/images/p3.png"), distance: 3, height: "5'7\"",
    lat: 41.9028, lng: 12.4964,
  },
  {
    id: "4", name: "Liam", age: 26, mode: "dating",
    bio: "Surfer and startup founder. Still figuring it out, but having a great time doing it.",
    location: "Barcelona", interests: ["Surfing", "Tech", "Fitness"],
    photo: require("../assets/images/p4.png"), distance: 8, height: "6'0\"",
    lat: 41.3851, lng: 2.1734,
  },
  {
    id: "5", name: "Aria", age: 29, mode: "dating",
    bio: "Medical resident who needs someone to remind me there is life outside the hospital.",
    location: "Berlin", interests: ["Medicine", "Yoga", "True Crime"],
    photo: require("../assets/images/p5.png"), distance: 4, height: "5'5\"",
    lat: 52.52, lng: 13.405,
  },
  {
    id: "6", name: "Ethan", age: 31, mode: "dating",
    bio: "Literary translator. Speak 4 languages, still can not figure out what I want for dinner.",
    location: "Amsterdam", interests: ["Books", "Languages", "Food"],
    photo: require("../assets/images/p6.png"), distance: 6, height: "5'11\"",
    lat: 52.3676, lng: 4.9041,
  },
];

// ─── Naughty ──────────────────────────────────────────────────────────────────
const NAUGHTY: Profile[] = [
  {
    id: "n1", name: "Scarlett", age: 25, mode: "naughty",
    bio: "Life's too short for boring conversations. Midnight drives, rooftop wine, and a little mischief.",
    location: "Paris", interests: ["Dancing", "Wine", "Spontaneity"],
    photo: require("../assets/images/p3.png"), distance: 1, height: "5'6\"",
    lat: 48.8566, lng: 2.3522,
  },
  {
    id: "n2", name: "Dante", age: 30, mode: "naughty",
    bio: "Fluent in sarcasm and eye contact. Here for a good time, not a long explanation.",
    location: "Milan", interests: ["Fashion", "Nightlife", "Fitness"],
    photo: require("../assets/images/p4.png"), distance: 3, height: "6'1\"",
    lat: 45.4654, lng: 9.1859,
  },
  {
    id: "n3", name: "Ivy", age: 23, mode: "naughty",
    bio: "Amateur photographer, professional overthinker. Looking for someone worth losing sleep over.",
    location: "Amsterdam", interests: ["Photography", "Cocktails", "Music"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'5\"",
    lat: 52.3676, lng: 4.9041,
  },
  {
    id: "n4", name: "Remy", age: 28, mode: "naughty",
    bio: "Chef who knows exactly how to turn up the heat. Let's skip the small talk.",
    location: "Lyon", interests: ["Cooking", "Travel", "Wine"],
    photo: require("../assets/images/p2.png"), distance: 5, height: "5'11\"",
    lat: 45.7640, lng: 4.8357,
  },
  {
    id: "n5", name: "Leila", age: 26, mode: "naughty",
    bio: "Yoga teacher with a wild side. I can bend the rules as well as my spine.",
    location: "Barcelona", interests: ["Yoga", "Beach", "Parties"],
    photo: require("../assets/images/p5.png"), distance: 4, height: "5'7\"",
    lat: 41.3851, lng: 2.1734,
  },
  {
    id: "n6", name: "Kai", age: 27, mode: "naughty",
    bio: "Musician with late-night energy. My playlist will ruin you for anyone else.",
    location: "Berlin", interests: ["Music", "Clubs", "Art"],
    photo: require("../assets/images/p6.png"), distance: 6, height: "6'0\"",
    lat: 52.52, lng: 13.405,
  },
];

// ─── Business ─────────────────────────────────────────────────────────────────
const BUSINESS: Profile[] = [
  {
    id: "b1", name: "Alexandra", age: 32, mode: "business",
    bio: "VP of Product at a Series B fintech. Looking to connect with founders and operators across Europe.",
    location: "London", interests: ["FinTech", "Leadership", "Strategy"],
    photo: require("../assets/images/p3.png"), distance: 4, height: "5'7\"",
    lat: 51.5074, lng: -0.1278,
  },
  {
    id: "b2", name: "James", age: 35, mode: "business",
    bio: "Angel investor and ex-McKinsey. Happy to share deal flow, intros, or just grab a coffee.",
    location: "Zürich", interests: ["Investing", "Startups", "Finance"],
    photo: require("../assets/images/p2.png"), distance: 8, height: "6'2\"",
    lat: 47.3769, lng: 8.5417,
  },
  {
    id: "b3", name: "Nadia", age: 29, mode: "business",
    bio: "UX Lead at Google. Passionate about design systems and accessible products.",
    location: "Amsterdam", interests: ["Design", "Tech", "Research"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'6\"",
    lat: 52.3676, lng: 4.9041,
  },
  {
    id: "b4", name: "Thomas", age: 33, mode: "business",
    bio: "Co-founder of two exits. Currently advising early-stage climate tech companies.",
    location: "Berlin", interests: ["CleanTech", "SaaS", "Mentoring"],
    photo: require("../assets/images/p4.png"), distance: 5, height: "6'0\"",
    lat: 52.52, lng: 13.405,
  },
  {
    id: "b5", name: "Sara", age: 31, mode: "business",
    bio: "CMO with 10+ years in consumer brands. Let's talk growth, community, and creative strategy.",
    location: "Paris", interests: ["Marketing", "Brand", "Media"],
    photo: require("../assets/images/p5.png"), distance: 3, height: "5'5\"",
    lat: 48.8566, lng: 2.3522,
  },
  {
    id: "b6", name: "Daniel", age: 36, mode: "business",
    bio: "Corporate lawyer turned legal-tech founder. Breaking things slowly, fixing them fast.",
    location: "Brussels", interests: ["LegalTech", "Policy", "Innovation"],
    photo: require("../assets/images/p6.png"), distance: 7, height: "5'11\"",
    lat: 50.8503, lng: 4.3517,
  },
];

export const ALL_PROFILES: Profile[] = [...DATING, ...NAUGHTY, ...BUSINESS];

export function getProfilesByMode(mode: AppMode): Profile[] {
  return ALL_PROFILES.filter((p) => p.mode === mode);
}

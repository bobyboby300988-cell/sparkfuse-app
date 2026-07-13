import { AppMode } from "@/context/AppContext";

export interface LockedPhoto {
  id: string;
  photo: ReturnType<typeof require>;
  priceEur: number;
  type?: "image" | "video";
}

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
  lockedPhotos?: LockedPhoto[];
  isLive?: boolean;
}

// ─── Dating (IDs kept as "1"–"6" for AsyncStorage backward-compat) ────────────
const DATING: Profile[] = [
  {
    id: "1", name: "Sophie", age: 24, mode: "dating", isLive: true,
    bio: "Coffee shop hopper and weekend hiker. Looking for someone to get lost with on a trail.",
    location: "Paris", interests: ["Hiking", "Coffee", "Photography"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'6\"",
    lat: 48.8566, lng: 2.3522,
    lockedPhotos: [
      { id: "1_lp1", photo: require("../assets/images/p4.png"), priceEur: 0.2 },
      { id: "1_lp2", photo: require("../assets/images/p5.png"), priceEur: 0.2 },
    ],
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
    id: "5", name: "Aria", age: 29, mode: "dating", isLive: true,
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
    id: "n1", name: "Scarlett", age: 25, mode: "naughty", isLive: true,
    bio: "I kiss on the first date and I'm not sorry about it. Come find me — I'll be the one making everyone else look boring. 🔥",
    location: "Paris", interests: ["Late nights", "Skinny dipping", "Champagne"],
    photo: require("../assets/images/p3.png"), distance: 1, height: "5'6\"",
    lat: 48.8566, lng: 2.3522,
    lockedPhotos: [
      { id: "n1_lp1", photo: require("../assets/images/p1.png"), priceEur: 0.2 },
      { id: "n1_lp2", photo: require("../assets/images/p2.png"), priceEur: 0.2 },
      { id: "n1_lp3", photo: require("../assets/images/p6.png"), priceEur: 0.2 },
    ],
  },
  {
    id: "n2", name: "Dante", age: 30, mode: "naughty",
    bio: "I workout so I look good doing things I shouldn't be doing. Let's be each other's bad decision. No regrets guaranteed. 😈",
    location: "Milan", interests: ["Body confidence", "Late nights", "Flirting"],
    photo: require("../assets/images/p4.png"), distance: 3, height: "6'1\"",
    lat: 45.4654, lng: 9.1859,
  },
  {
    id: "n3", name: "Ivy", age: 23, mode: "naughty",
    bio: "My search history is either recipes or things I probably shouldn't Google. Looking for someone to get into trouble with after midnight. 👀",
    location: "Amsterdam", interests: ["Trouble", "Roleplay", "Cocktails"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'5\"",
    lat: 52.3676, lng: 4.9041,
  },
  {
    id: "n4", name: "Remy", age: 28, mode: "naughty", isLive: true,
    bio: "I cook, I flirt, and I use my hands very well. Come over — I'll feed you first and we'll figure out the rest. 🍷",
    location: "Lyon", interests: ["Seduction", "Cooking", "Hot tubs"],
    photo: require("../assets/images/p2.png"), distance: 5, height: "5'11\"",
    lat: 45.7640, lng: 4.8357,
  },
  {
    id: "n5", name: "Leila", age: 26, mode: "naughty",
    bio: "Flexible in yoga and in life. I'm told I'm a lot to handle — I prefer 'worth every second'. Swipe right if you can keep up. 💃",
    location: "Barcelona", interests: ["Flexibility", "Sensual dance", "Beach nights"],
    photo: require("../assets/images/p5.png"), distance: 4, height: "5'7\"",
    lat: 41.3851, lng: 2.1734,
    lockedPhotos: [
      { id: "n5_lp1", photo: require("../assets/images/p3.png"), priceEur: 0.2 },
      { id: "n5_lp2", photo: require("../assets/images/p4.png"), priceEur: 0.2 },
    ],
  },
  {
    id: "n6", name: "Kai", age: 27, mode: "naughty",
    bio: "I write songs about the people who break my heart and make them beg to be in the next one. Your place or mine — I'll bring the guitar. 🎸",
    location: "Berlin", interests: ["Passion", "Intensity", "After-parties"],
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
    id: "b2", name: "James", age: 35, mode: "business", isLive: true,
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

// ─── Party ────────────────────────────────────────────────────────────────────
const PARTY: Profile[] = [
  {
    id: "py1", name: "Luna", age: 24, mode: "party", isLive: true,
    bio: "DJ on weekends, chaos coordinator on weekdays. If the playlist is mine, the night is yours. 🎧",
    location: "Ibiza", interests: ["DJing", "Clubbing", "Festivals"],
    photo: require("../assets/images/p1.png"), distance: 1, height: "5'5\"",
    lat: 38.9067, lng: 1.4206,
  },
  {
    id: "py2", name: "Rico", age: 27, mode: "party",
    bio: "Event promoter who lives for the drop. Know every bouncer in every city. Come for the music, stay for the memories. 🎉",
    location: "Berlin", interests: ["Techno", "Events", "Nightlife"],
    photo: require("../assets/images/p2.png"), distance: 3, height: "6'0\"",
    lat: 52.52, lng: 13.405,
  },
  {
    id: "py3", name: "Mia", age: 26, mode: "party",
    bio: "Professional festival-goer. My summer is already fully booked — but I saved a wristband for the right person. 🌈",
    location: "Amsterdam", interests: ["Festivals", "Rave", "Road trips"],
    photo: require("../assets/images/p3.png"), distance: 2, height: "5'6\"",
    lat: 52.3676, lng: 4.9041,
  },
  {
    id: "py4", name: "Jax", age: 29, mode: "party", isLive: true,
    bio: "Bartender who makes cocktails look like art. Last call is just the beginning. Find me at the after-party. 🍸",
    location: "London", interests: ["Mixology", "Parties", "Live music"],
    photo: require("../assets/images/p4.png"), distance: 4, height: "6'1\"",
    lat: 51.5074, lng: -0.1278,
  },
  {
    id: "py5", name: "Zoe", age: 25, mode: "party",
    bio: "Dancer and light-chaser. I'm the one who's always on the dance floor when everyone else is sitting down. 💃",
    location: "Paris", interests: ["Dancing", "EDM", "Rooftop bars"],
    photo: require("../assets/images/p5.png"), distance: 2, height: "5'7\"",
    lat: 48.8566, lng: 2.3522,
  },
  {
    id: "py6", name: "Nico", age: 28, mode: "party",
    bio: "Comedian and karaoke champion. I'll make you laugh so hard you forget what you were worried about. 🎤",
    location: "Barcelona", interests: ["Comedy", "Karaoke", "Bar crawls"],
    photo: require("../assets/images/p6.png"), distance: 5, height: "5'11\"",
    lat: 41.3851, lng: 2.1734,
  },
];

// ─── Travel ───────────────────────────────────────────────────────────────────
const TRAVEL: Profile[] = [
  {
    id: "tr1", name: "Isla", age: 28, mode: "travel", isLive: true,
    bio: "68 countries, 1 carry-on. Digital nomad and sunrise chaser. Currently in Lisbon, next week: who knows? ✈️",
    location: "Lisbon", interests: ["Backpacking", "Photography", "Street food"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'6\"",
    lat: 38.7169, lng: -9.1399,
  },
  {
    id: "tr2", name: "Marco", age: 31, mode: "travel",
    bio: "Mountain climber and paraglider. I've seen the world from above — now looking for someone to share the view. 🏔️",
    location: "Innsbruck", interests: ["Hiking", "Paragliding", "Adventure"],
    photo: require("../assets/images/p2.png"), distance: 6, height: "6'2\"",
    lat: 47.2682, lng: 11.3923,
  },
  {
    id: "tr3", name: "Yuki", age: 26, mode: "travel",
    bio: "Travel blogger and ramen researcher. I rate cities by their public transport and noodle quality. 🍜",
    location: "Tokyo", interests: ["Food tourism", "Blogging", "Japan"],
    photo: require("../assets/images/p3.png"), distance: 10, height: "5'4\"",
    lat: 35.6762, lng: 139.6503,
  },
  {
    id: "tr4", name: "Leo", age: 30, mode: "travel",
    bio: "Sailing instructor and ocean lover. Life is better with salt water and a good compass. ⛵",
    location: "Santorini", interests: ["Sailing", "Diving", "Islands"],
    photo: require("../assets/images/p4.png"), distance: 5, height: "6'0\"",
    lat: 36.3932, lng: 25.4615,
  },
  {
    id: "tr5", name: "Sofia", age: 27, mode: "travel",
    bio: "Volunteer traveller. I build schools in the morning and find hidden bars at night. The world is my home. 🌍",
    location: "Cape Town", interests: ["Volunteering", "Safari", "Culture"],
    photo: require("../assets/images/p5.png"), distance: 8, height: "5'5\"",
    lat: -33.9249, lng: 18.4241,
  },
  {
    id: "tr6", name: "Finn", age: 32, mode: "travel",
    bio: "Road trip addict. I've driven across 12 countries with no fixed plan and zero regrets. Passenger seat is free. 🚗",
    location: "Copenhagen", interests: ["Road trips", "Camping", "Van life"],
    photo: require("../assets/images/p6.png"), distance: 7, height: "6'1\"",
    lat: 55.6761, lng: 12.5683,
  },
];

// ─── Social ───────────────────────────────────────────────────────────────────
const SOCIAL: Profile[] = [
  {
    id: "so1", name: "Priya", age: 27, mode: "social", isLive: true,
    bio: "Community organiser and TEDx speaker. I believe every stranger is a friend you haven't met yet. 🤝",
    location: "London", interests: ["Community", "Public speaking", "Volunteering"],
    photo: require("../assets/images/p1.png"), distance: 2, height: "5'5\"",
    lat: 51.5074, lng: -0.1278,
  },
  {
    id: "so2", name: "Tom", age: 29, mode: "social",
    bio: "Board game champion and trivia night host. Looking for people to fill my table and my life with good conversation. 🎲",
    location: "Brussels", interests: ["Board games", "Trivia", "Meetups"],
    photo: require("../assets/images/p2.png"), distance: 4, height: "5'11\"",
    lat: 50.8503, lng: 4.3517,
  },
  {
    id: "so3", name: "Amara", age: 25, mode: "social",
    bio: "Language exchange addict. Currently learning my 5th language. Let's meet for coffee and talk about everything. ☕",
    location: "Paris", interests: ["Languages", "Cultural exchange", "Coffee"],
    photo: require("../assets/images/p3.png"), distance: 1, height: "5'6\"",
    lat: 48.8566, lng: 2.3522,
  },
  {
    id: "so4", name: "Oliver", age: 33, mode: "social", isLive: true,
    bio: "Urban gardener and neighbourhood activist. I grow tomatoes and friendships. Both need water and patience. 🌱",
    location: "Amsterdam", interests: ["Gardening", "Sustainability", "Activism"],
    photo: require("../assets/images/p4.png"), distance: 3, height: "6'0\"",
    lat: 52.3676, lng: 4.9041,
  },
  {
    id: "so5", name: "Chloe", age: 26, mode: "social",
    bio: "Podcast host and storyteller. I've interviewed 200+ people about their lives — now I want to hear yours. 🎙️",
    location: "Berlin", interests: ["Podcasting", "Storytelling", "Networking"],
    photo: require("../assets/images/p5.png"), distance: 3, height: "5'7\"",
    lat: 52.52, lng: 13.405,
  },
  {
    id: "so6", name: "Mateo", age: 31, mode: "social",
    bio: "Yoga teacher and meditation guide. Building calm in chaotic cities, one breath and one connection at a time. 🧘",
    location: "Barcelona", interests: ["Yoga", "Meditation", "Wellness"],
    photo: require("../assets/images/p6.png"), distance: 5, height: "5'10\"",
    lat: 41.3851, lng: 2.1734,
  },
];

export const ALL_PROFILES: Profile[] = [...DATING, ...NAUGHTY, ...BUSINESS, ...PARTY, ...TRAVEL, ...SOCIAL];

export function getProfilesByMode(mode: AppMode): Profile[] {
  return ALL_PROFILES.filter((p) => p.mode === mode);
}

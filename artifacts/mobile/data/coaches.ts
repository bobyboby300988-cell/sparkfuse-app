export interface SessionType {
  id: string;
  label: string;
  duration: number;
  price: number;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: ReturnType<typeof require>;
  rating: number;
  reviewCount: number;
  location: string;
  specialties: string[];
  sessions: SessionType[];
  availability: string[];
  yearsExperience: number;
  totalClients: number;
  stripeConnectId?: string;
}

export const MOCK_COACHES: Coach[] = [
  {
    id: "c1",
    name: "Dr. Priya Mehta",
    title: "Relationship Psychologist",
    bio: "I help ambitious professionals break dating patterns, build real confidence, and find lasting connections. Trained at Columbia, 9 years working with singles in NYC.",
    photo: require("../assets/images/p1.png"),
    rating: 4.9,
    reviewCount: 214,
    location: "New York, NY",
    specialties: ["Attachment styles", "Confidence", "First date prep"],
    yearsExperience: 9,
    totalClients: 340,
    sessions: [
      { id: "s1a", label: "Quick Consult", duration: 30, price: 49 },
      { id: "s1b", label: "Deep Dive", duration: 60, price: 89 },
      { id: "s1c", label: "4-Session Package", duration: 60, price: 299 },
    ],
    availability: ["Mon", "Wed", "Fri"],
  },
  {
    id: "c2",
    name: "Jordan Hayes",
    title: "Dating & Confidence Coach",
    bio: "Former introvert turned social skills trainer. I teach men and women how to show up authentically in dating — from app bio to first kiss.",
    photo: require("../assets/images/p2.png"),
    rating: 4.8,
    reviewCount: 178,
    location: "Los Angeles, CA",
    specialties: ["Online dating", "Body language", "Conversation skills"],
    yearsExperience: 6,
    totalClients: 520,
    sessions: [
      { id: "s2a", label: "Profile Audit", duration: 30, price: 39 },
      { id: "s2b", label: "Coaching Session", duration: 60, price: 75 },
      { id: "s2c", label: "Monthly Mentorship", duration: 60, price: 249 },
    ],
    availability: ["Tue", "Thu", "Sat"],
  },
  {
    id: "c3",
    name: "Isabelle Laurent",
    title: "Love & Mindset Coach",
    bio: "I blend neuroscience and mindfulness to help you rewire limiting beliefs about love. My clients go from 'I'll never find anyone' to 'I can't believe this person exists.'",
    photo: require("../assets/images/p3.png"),
    rating: 5.0,
    reviewCount: 96,
    location: "Miami, FL",
    specialties: ["Mindset work", "Anxiety in dating", "Self-worth"],
    yearsExperience: 5,
    totalClients: 190,
    sessions: [
      { id: "s3a", label: "Clarity Call", duration: 45, price: 65 },
      { id: "s3b", label: "Transformation Session", duration: 90, price: 120 },
    ],
    availability: ["Mon", "Tue", "Thu", "Fri"],
  },
  {
    id: "c4",
    name: "Marcus Webb",
    title: "Men's Dating Coach",
    bio: "I work specifically with men who want to stop chasing and start attracting. No gimmicks — just real psychology, honest feedback, and actionable strategy.",
    photo: require("../assets/images/p4.png"),
    rating: 4.7,
    reviewCount: 312,
    location: "Chicago, IL",
    specialties: ["Masculine energy", "Rejection recovery", "Long-term strategy"],
    yearsExperience: 8,
    totalClients: 680,
    sessions: [
      { id: "s4a", label: "Intro Session", duration: 30, price: 45 },
      { id: "s4b", label: "Full Coaching", duration: 60, price: 85 },
      { id: "s4c", label: "6-Week Program", duration: 60, price: 449 },
    ],
    availability: ["Wed", "Thu", "Sat", "Sun"],
  },
  {
    id: "c5",
    name: "Sofia Reyes",
    title: "Breakup & Healing Coach",
    bio: "Specializing in post-breakup recovery and re-entering the dating world with clarity. You don't have to rush — but I'll make sure you come back stronger.",
    photo: require("../assets/images/p5.png"),
    rating: 4.9,
    reviewCount: 143,
    location: "Austin, TX",
    specialties: ["Healing", "Moving on", "Rebuilding identity"],
    yearsExperience: 4,
    totalClients: 210,
    sessions: [
      { id: "s5a", label: "Heart-to-Heart", duration: 60, price: 70 },
      { id: "s5b", label: "3-Session Reset", duration: 60, price: 189 },
    ],
    availability: ["Mon", "Wed", "Fri", "Sat"],
  },
];

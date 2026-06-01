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
}

export const MOCK_PROFILES: Profile[] = [
  {
    id: "1",
    name: "Sophie",
    age: 24,
    bio: "Coffee shop hopper and weekend hiker. Looking for someone to get lost with on a trail.",
    location: "New York",
    interests: ["Hiking", "Coffee", "Photography"],
    photo: require("../assets/images/p1.png"),
    distance: 2,
    height: "5'6\"",
  },
  {
    id: "2",
    name: "Marcus",
    age: 28,
    bio: "Music producer by day, home chef by night. Will cook for the right person.",
    location: "Brooklyn",
    interests: ["Music", "Cooking", "Travel"],
    photo: require("../assets/images/p2.png"),
    distance: 5,
    height: "6'1\"",
  },
  {
    id: "3",
    name: "Zara",
    age: 27,
    bio: "Art director with a weakness for vintage bookshops and rooftop sunsets.",
    location: "Manhattan",
    interests: ["Art", "Reading", "Wine"],
    photo: require("../assets/images/p3.png"),
    distance: 3,
    height: "5'7\"",
  },
  {
    id: "4",
    name: "Liam",
    age: 26,
    bio: "Surfer and startup founder. Still figuring it out, but having a great time doing it.",
    location: "Jersey City",
    interests: ["Surfing", "Tech", "Fitness"],
    photo: require("../assets/images/p4.png"),
    distance: 8,
    height: "6'0\"",
  },
  {
    id: "5",
    name: "Aria",
    age: 29,
    bio: "Medical resident who needs someone to remind me there is life outside the hospital.",
    location: "Upper West Side",
    interests: ["Medicine", "Yoga", "True Crime"],
    photo: require("../assets/images/p5.png"),
    distance: 4,
    height: "5'5\"",
  },
  {
    id: "6",
    name: "Ethan",
    age: 31,
    bio: "Literary translator. Speak 4 languages, still can not figure out what I want for dinner.",
    location: "Williamsburg",
    interests: ["Books", "Languages", "Food"],
    photo: require("../assets/images/p6.png"),
    distance: 6,
    height: "5'11\"",
  },
];

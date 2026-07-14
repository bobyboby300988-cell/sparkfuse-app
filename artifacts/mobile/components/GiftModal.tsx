import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { buyTokensWithStripe, buyTokensWithPayPal } from "@/config/payments";

/* ─── Image URLs ─── */
const I = {
  rose:        "https://static.vecteezy.com/system/resources/thumbnails/063/104/555/small/hyper-realistic-rose-petals-vivid-colors-macro-artistic-floral-image-free-photo.jpeg",
  chocolate:   "https://asiriblooms.com/cdn/shop/products/81pI2SWoFiL._SL1500_0ff5e4d0-0884-463b-ba6d-b1e2d3099cd4.jpg?v=1675259612&width=400",
  strawberry:  "https://thumbs.dreamstime.com/b/macro-chocolate-strawberry-fondue-stick-13394953.jpg",
  perfume:     "https://i.pinimg.com/originals/94/40/a2/9440a26cada25d725f60a514b5ecdc64.jpg",
  heels:       "https://thumbs.dreamstime.com/b/red-high-heels-carpet-red-high-heels-carpet-closeup-photo-390103019.jpg",
  champagne:   "https://static.vecteezy.com/system/resources/thumbnails/059/554/174/small/sparkling-gold-champagne-bottle-festive-celebration-drink-luxury-alcohol-elegant-design-free-png.png",
  lips:        "https://static.vecteezy.com/system/resources/thumbnails/033/863/267/small/closeup-shot-of-beautiful-female-lips-with-glossy-red-lipstick-red-lips-makeup-ultra-close-up-view-of-beautiful-sexy-female-lips-ai-generated-free-photo.jpg",
  lingerie:    "https://images.pexels.com/photos/4118947/pexels-photo-4118947.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  crown:       "https://static.vecteezy.com/system/resources/thumbnails/045/388/189/small/gold-ornate-crown-with-gemstones-symbol-of-royalty-and-luxury-intricate-craftsmanship-detail-photo.jpg",
  diamond:     "https://lerajewellery.com/cdn/shop/files/3-6997_1.jpg?v=1718713830&width=533",
  watch:       "https://images.pexels.com/photos/3809175/pexels-photo-3809175.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  bag:         "https://png.pngtree.com/png-vector/20250220/ourmid/pngtree-luxury-designer-handbag-for-women-premium-leather-bag-fashionable-ladies-png-image_15533589.png",
  yacht:       "https://static.vecteezy.com/system/resources/thumbnails/055/978/578/small/sunset-over-the-ocean-viewed-from-a-luxury-yacht-showcasing-vibrant-colors-and-peaceful-waters-free-photo.jpeg",
  jet:         "https://thumbs.dreamstime.com/b/generated-image-luxury-private-jet-interior-champagne-glasses-table-440304177.jpg",
  ferrari:     "https://images.pexels.com/photos/37284552/pexels-photo-37284552/free-photo-of-red-ferrari-sports-car-parked-on-a-city-street.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  island:      "https://media.istockphoto.com/id/1459590636/photo/aerial-view-of-a-tropical-paradise-luxury-resort-on-cousine-island-villas-and-private-beach.webp?a=1&b=1&s=612x612&w=0&k=20&c=NE94J3q8d-OhG7yw7DzJlCy_jTToKdtO7_y3k1jK0co=",
  castle:      "https://thumbs.dreamstime.com/b/pena-palace-sintra-lisbon-portugal-night-lights-famous-landmark-most-beautiful-castles-europe-162995510.jpg",
  lamborghini: "https://w0.peakpx.com/wallpaper/129/612/HD-wallpaper-lamborghini-huracan-2018-yellow-sports-car-vag-performante-yellow-huracan-luxury-tuning-supercar-new-yellow-huracan-italian-cars-lamborghini-thumbnail.jpg",
  galaxy:      "https://static.vecteezy.com/system/resources/thumbnails/057/282/604/small/the-launch-of-spacecraft-deep-cosmos-mission-in-an-open-galaxy-photo.jpg",
};

/* ─── 50 gifts — 1 ST = €0.01 · matches promo video · biggest = Lamborghini 30,000 ST = €300 ─── */
const GIFTS = [
  /* ══ SWEET  (1 – 90 ST) ══ */
  { tokens: 1,   label: "Red Rose",    emoji: "🌹", desc: "Timeless beauty",        tier: "Sweet",     grad: ["#FF416C","#FF4B2B"] as [string,string], glow: "#FF416C80", tierColor: "#FF6B9D", img: I.rose,       erotic: false },
  { tokens: 3,   label: "Kiss",        emoji: "💋", desc: "A sweet peck",           tier: "Sweet",     grad: ["#FF80AB","#C2185B"] as [string,string], glow: "#FF80AB80", tierColor: "#FF6B9D", img: null,         erotic: false },
  { tokens: 5,   label: "Heart",       emoji: "❤️", desc: "Straight from the heart", tier: "Sweet",     grad: ["#FF1744","#B71C1C"] as [string,string], glow: "#FF174480", tierColor: "#FF6B9D", img: null,         erotic: false },
  { tokens: 10,  label: "Love Letter", emoji: "💌", desc: "Sweet note",             tier: "Sweet",     grad: ["#FFB7C5","#FF5CA8"] as [string,string], glow: "#FF5CA870", tierColor: "#FF6B9D", img: null,         erotic: false },
  { tokens: 20,  label: "Candle",      emoji: "🕯️", desc: "Romantic glow",          tier: "Sweet",     grad: ["#FFECD2","#FCB69F"] as [string,string], glow: "#FCB69F80", tierColor: "#FF6B9D", img: null,         erotic: false },
  { tokens: 30,  label: "Chocolate",   emoji: "🍫", desc: "Dark & delicious",       tier: "Sweet",     grad: ["#7B3F00","#3E1A00"] as [string,string], glow: "#7B3F0080", tierColor: "#FF6B9D", img: I.chocolate,  erotic: false },
  { tokens: 50,  label: "Strawberry",  emoji: "🍓", desc: "Dipped in chocolate",    tier: "Sweet",     grad: ["#FF4757","#C0392B"] as [string,string], glow: "#FF475780", tierColor: "#FF6B9D", img: I.strawberry, erotic: false },
  { tokens: 60,  label: "Macarons",    emoji: "🫐", desc: "Delicate & sweet",        tier: "Sweet",     grad: ["#E0B0FF","#9B59B6"] as [string,string], glow: "#9B59B680", tierColor: "#FF6B9D", img: null,         erotic: false },
  { tokens: 75,  label: "Teddy Bear",  emoji: "🧸", desc: "Soft hug for you",        tier: "Sweet",     grad: ["#FFCCBC","#FF7043"] as [string,string], glow: "#FF704380", tierColor: "#FF6B9D", img: null,         erotic: false },
  { tokens: 90,  label: "Bouquet",     emoji: "💐", desc: "Blooming feelings",       tier: "Sweet",     grad: ["#FEC89A","#FD79A8"] as [string,string], glow: "#FD79A880", tierColor: "#FF6B9D", img: null,         erotic: false },

  /* ══ DREAMY  (100 – 900 ST) ══ */
  { tokens: 100, label: "Diamond",     emoji: "💎", desc: "Rare & precious",         tier: "Dreamy",    grad: ["#74EAEA","#0078FF"] as [string,string], glow: "#74EAEA90", tierColor: "#9C27B0", img: I.diamond,    erotic: false },
  { tokens: 150, label: "Red Lips",    emoji: "💋", desc: "A kiss just for you",      tier: "Dreamy",    grad: ["#FF416C","#C0392B"] as [string,string], glow: "#FF416C90", tierColor: "#9C27B0", img: I.lips,       erotic: true  },
  { tokens: 200, label: "Champagne",   emoji: "🥂", desc: "Pop for the star",         tier: "Dreamy",    grad: ["#F7DC6F","#D4A017"] as [string,string], glow: "#D4A01790", tierColor: "#9C27B0", img: I.champagne,  erotic: false },
  { tokens: 300, label: "Perfume",     emoji: "✨", desc: "Irresistible scent",       tier: "Dreamy",    grad: ["#F8CDDA","#1D2B64"] as [string,string], glow: "#F8CDDA80", tierColor: "#9C27B0", img: I.perfume,    erotic: false },
  { tokens: 400, label: "High Heels",  emoji: "👠", desc: "Dangerous elegance",       tier: "Dreamy",    grad: ["#C0392B","#7F0000"] as [string,string], glow: "#C0392B90", tierColor: "#9C27B0", img: I.heels,      erotic: true  },
  { tokens: 500, label: "Crown",       emoji: "👑", desc: "You're royalty",            tier: "Dreamy",    grad: ["#FFD700","#C8860A"] as [string,string], glow: "#FFD70090", tierColor: "#9C27B0", img: I.crown,      erotic: false },
  { tokens: 600, label: "Red Wine",    emoji: "🍷", desc: "A sensual evening",         tier: "Dreamy",    grad: ["#8B0000","#2D0000"] as [string,string], glow: "#8B000090", tierColor: "#9C27B0", img: null,         erotic: false },
  { tokens: 700, label: "Ring",        emoji: "💍", desc: "Sparkling promise",         tier: "Dreamy",    grad: ["#E0E0E0","#9E9E9E"] as [string,string], glow: "#E0E0E090", tierColor: "#9C27B0", img: I.diamond,    erotic: false },
  { tokens: 800, label: "Crystal Ball",emoji: "🔮", desc: "Mysterious desires",        tier: "Dreamy",    grad: ["#80CBC4","#00695C"] as [string,string], glow: "#00695C90", tierColor: "#9C27B0", img: null,         erotic: false },
  { tokens: 900, label: "Silk Sheets", emoji: "🌙", desc: "Slip into the night",       tier: "Dreamy",    grad: ["#1A1A2E","#9C27B0"] as [string,string], glow: "#9C27B090", tierColor: "#9C27B0", img: null,         erotic: true  },

  /* ══ LUXURY  (1,000 – 4,900 ST) — erotic zone ══ */
  { tokens: 1000,  label: "Lingerie",      emoji: "🔥", desc: "Dangerously beautiful 🔞",  tier: "Luxury",    grad: ["#1A1A2E","#E94560"] as [string,string], glow: "#E9456090", tierColor: "#FF6B35", img: I.lingerie,   erotic: true  },
  { tokens: 2000,  label: "Vibrator",      emoji: "🔞", desc: "Pleasure device 🔞",         tier: "Luxury",    grad: ["#880E4F","#E91E63"] as [string,string], glow: "#E91E6390", tierColor: "#FF6B35", img: null,         erotic: true  },
  { tokens: 3000,  label: "Tits",          emoji: "🔞", desc: "Erotic gift 🔞",              tier: "Luxury",    grad: ["#FF7043","#BF360C"] as [string,string], glow: "#FF704390", tierColor: "#FF6B35", img: null,         erotic: true  },
  { tokens: 3500,  label: "Silk Blindfold",emoji: "🌙", desc: "Surrender to pleasure 🔞",   tier: "Luxury",    grad: ["#1A237E","#7B1FA2"] as [string,string], glow: "#7B1FA290", tierColor: "#FF6B35", img: null,         erotic: true  },
  { tokens: 4000,  label: "Crystal Toy",   emoji: "💎", desc: "Premium pleasure 🔞",         tier: "Luxury",    grad: ["#26C6DA","#00838F"] as [string,string], glow: "#26C6DA90", tierColor: "#FF6B35", img: null,         erotic: true  },
  { tokens: 4200,  label: "Velvet Whip",   emoji: "💋", desc: "Playful & daring 🔞",         tier: "Luxury",    grad: ["#6A1B9A","#4A148C"] as [string,string], glow: "#6A1B9A90", tierColor: "#FF6B35", img: null,         erotic: true  },
  { tokens: 4400,  label: "Lace Set",      emoji: "🔥", desc: "Sultry & sensual 🔞",          tier: "Luxury",    grad: ["#C62828","#B71C1C"] as [string,string], glow: "#C6282890", tierColor: "#FF6B35", img: null,         erotic: true  },
  { tokens: 4600,  label: "Champagne Bath",emoji: "🛁", desc: "Luxury soak for you",          tier: "Luxury",    grad: ["#F7DC6F","#A0721A"] as [string,string], glow: "#F7DC6F90", tierColor: "#FF6B35", img: I.champagne,  erotic: false },
  { tokens: 4750,  label: "Necklace",      emoji: "💎", desc: "Diamonds for darling",         tier: "Luxury",    grad: ["#E0E0E0","#757575"] as [string,string], glow: "#E0E0E090", tierColor: "#FF6B35", img: I.diamond,    erotic: false },
  { tokens: 4900,  label: "Private Show",  emoji: "🎬", desc: "Just for you 🔞",              tier: "Luxury",    grad: ["#1A1A2E","#FF416C"] as [string,string], glow: "#FF416C90", tierColor: "#FF6B35", img: null,         erotic: true  },

  /* ══ ELITE  (5,000 – 14,000 ST) ══ */
  { tokens: 5000,  label: "Rolex",        emoji: "⌚", desc: "Time is precious",         tier: "Elite",     grad: ["#FFD700","#8B6914"] as [string,string], glow: "#FFD70090", tierColor: "#C0392B", img: I.watch,      erotic: false },
  { tokens: 6000,  label: "Penthouse",    emoji: "🏙️", desc: "Skyline views",             tier: "Elite",     grad: ["#0F2027","#2C5364"] as [string,string], glow: "#2C536490", tierColor: "#C0392B", img: null,         erotic: false },
  { tokens: 7000,  label: "Yacht",        emoji: "🛥️", desc: "Sail into the sunset",      tier: "Elite",     grad: ["#1CB5E0","#000851"] as [string,string], glow: "#1CB5E090", tierColor: "#C0392B", img: I.yacht,      erotic: false },
  { tokens: 8000,  label: "Designer Bag", emoji: "👜", desc: "Iconic style",              tier: "Elite",     grad: ["#2C3E50","#BDC3C7"] as [string,string], glow: "#BDC3C790", tierColor: "#C0392B", img: I.bag,        erotic: false },
  { tokens: 9000,  label: "Private Jet",  emoji: "✈️", desc: "Fly first class",            tier: "Elite",     grad: ["#1A1A2E","#16213E"] as [string,string], glow: "#4CC9F090", tierColor: "#C0392B", img: I.jet,        erotic: false },
  { tokens: 10000, label: "Rocket",       emoji: "🚀", desc: "Into the cosmos",            tier: "Elite",     grad: ["#0F0C29","#4286F4"] as [string,string], glow: "#4286F490", tierColor: "#C0392B", img: I.galaxy,     erotic: false },
  { tokens: 11000, label: "Tropic Isle",  emoji: "🏝️", desc: "Private paradise",           tier: "Elite",     grad: ["#00B4DB","#0083B0"] as [string,string], glow: "#00B4DB90", tierColor: "#C0392B", img: I.island,     erotic: false },
  { tokens: 12000, label: "Castle",       emoji: "🏰", desc: "Live like royalty",           tier: "Elite",     grad: ["#654EA3","#EAAFC8"] as [string,string], glow: "#654EA390", tierColor: "#C0392B", img: I.castle,     erotic: false },
  { tokens: 13000, label: "Gold Bar",     emoji: "🪙", desc: "Pure gold",                   tier: "Elite",     grad: ["#F7971E","#FFD200"] as [string,string], glow: "#FFD20090", tierColor: "#C0392B", img: null,         erotic: false },
  { tokens: 14000, label: "Helicopter",   emoji: "🚁", desc: "Rise above it all",            tier: "Elite",     grad: ["#373B44","#4286F4"] as [string,string], glow: "#4286F490", tierColor: "#C0392B", img: null,         erotic: false },

  /* ══ LEGENDARY  (15,000 – 30,000 ST) ══ */
  { tokens: 15000, label: "Ferrari",      emoji: "🏎️", desc: "€150 — Power & passion",      tier: "Legendary", grad: ["#C0392B","#7B0000"] as [string,string], glow: "#C0392B90", tierColor: "#FFD700", img: I.ferrari,    erotic: false },
  { tokens: 17000, label: "Rolls Royce",  emoji: "🚗", desc: "Pinnacle of luxury",            tier: "Legendary", grad: ["#1A1A1A","#C0C0C0"] as [string,string], glow: "#C0C0C090", tierColor: "#FFD700", img: null,         erotic: false },
  { tokens: 19000, label: "Mega Yacht",   emoji: "🛳️", desc: "Your private ocean",            tier: "Legendary", grad: ["#005C97","#363795"] as [string,string], glow: "#005C9790", tierColor: "#FFD700", img: I.yacht,      erotic: false },
  { tokens: 21000, label: "Dragon",       emoji: "🐉", desc: "Fierce & majestic",              tier: "Legendary", grad: ["#FF4500","#8B0000"] as [string,string], glow: "#FF450090", tierColor: "#FFD700", img: null,         erotic: false },
  { tokens: 23000, label: "Crown Jewels", emoji: "👑", desc: "Imperial treasure",              tier: "Legendary", grad: ["#FFD700","#FFA500"] as [string,string], glow: "#FFD70090", tierColor: "#FFD700", img: I.crown,      erotic: false },
  { tokens: 25000, label: "Galaxy",       emoji: "🌌", desc: "Infinite & beautiful",           tier: "Legendary", grad: ["#1A1A2E","#4CC9F0"] as [string,string], glow: "#4CC9F090", tierColor: "#FFD700", img: I.galaxy,     erotic: false },
  { tokens: 27000, label: "Phoenix",      emoji: "🦅", desc: "Rise from the flames",           tier: "Legendary", grad: ["#FF4500","#FFD700"] as [string,string], glow: "#FF450090", tierColor: "#FFD700", img: null,         erotic: false },
  { tokens: 28500, label: "God's Gift",   emoji: "⚡", desc: "Sent from above",               tier: "Legendary", grad: ["#8360C3","#2EBF91"] as [string,string], glow: "#8360C390", tierColor: "#FFD700", img: null,         erotic: false },
  { tokens: 29500, label: "Diamond God",  emoji: "💎", desc: "Beyond priceless",               tier: "Legendary", grad: ["#74EAEA","#FFD700"] as [string,string], glow: "#FFD70090", tierColor: "#FFD700", img: I.diamond,    erotic: false },
  { tokens: 30000, label: "Lamborghini",  emoji: "🏎️", desc: "€300 — Ultimate gift 🔥",        tier: "Legendary", grad: ["#F7971E","#FFD200"] as [string,string], glow: "#FFD20099", tierColor: "#FFD700", img: I.lamborghini,erotic: false },
];

const TIER_ORDER = ["Sweet", "Dreamy", "Luxury", "Elite", "Legendary"];
const TIER_ICONS: Record<string, string> = {
  Sweet: "🌸", Dreamy: "💜", Luxury: "✨", Elite: "🔥", Legendary: "👑",
};
const TIER_COLORS: Record<string, string> = {
  Sweet: "#FF6B9D", Dreamy: "#9C27B0", Luxury: "#FF6B35", Elite: "#C0392B", Legendary: "#FFD700",
};

const FEE = 0.10;

/* ── Per-tier animation config (TikTok-style: scales with price) ── */
const TIER_CFG: Record<string, {
  floatDur: number; floatH: number; breathAmt: number; breathDur: number;
  shimmerInterval: number; particleCount: number; swayDeg: number; glowSpeed: number; rings: number;
}> = {
  Sweet:     { floatDur: 1600, floatH:  7, breathAmt: 1.02, breathDur: 2400, shimmerInterval: 4800, particleCount: 1, swayDeg: 0,  glowSpeed: 1000, rings: 0 },
  Dreamy:    { floatDur: 1200, floatH:  9, breathAmt: 1.03, breathDur: 1900, shimmerInterval: 3200, particleCount: 2, swayDeg: 3,  glowSpeed: 750,  rings: 1 },
  Luxury:    { floatDur:  900, floatH: 12, breathAmt: 1.05, breathDur: 1300, shimmerInterval: 2200, particleCount: 4, swayDeg: 6,  glowSpeed: 520,  rings: 2 },
  Elite:     { floatDur:  700, floatH: 15, breathAmt: 1.07, breathDur:  900, shimmerInterval: 1500, particleCount: 6, swayDeg: 10, glowSpeed: 360,  rings: 3 },
  Legendary: { floatDur:  520, floatH: 18, breathAmt: 1.10, breathDur:  600, shimmerInterval: 1100, particleCount: 8, swayDeg: 14, glowSpeed: 220,  rings: 4 },
};

const RANK_LABEL: Record<string, { text: string; color: string } | undefined> = {
  Sweet: undefined, Dreamy: undefined,
  Luxury:    { text: "⭐ LUXURY",    color: "#FF6B35" },
  Elite:     { text: "🔥 ELITE",     color: "#C0392B" },
  Legendary: { text: "👑 LEGENDARY", color: "#FFD700" },
};

/* ── Floating particle ── */
function Particle({ color }: { color: string }) {
  const y  = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;
  const x  = useRef(new Animated.Value((Math.random() - 0.5) * 70)).current;
  useEffect(() => {
    const run = () => {
      y.setValue(0); op.setValue(0); x.setValue((Math.random() - 0.5) * 70);
      Animated.parallel([
        Animated.timing(y,  { toValue: -55, duration: 1900 + Math.random() * 600, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(op, { toValue: 0.85, duration: 350, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0,    duration: 1100, useNativeDriver: true }),
        ]),
      ]).start(() => setTimeout(run, 400 + Math.random() * 1800));
    };
    const t = setTimeout(run, Math.random() * 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute", bottom: 10, left: "50%",
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: color,
        transform: [{ translateX: x }, { translateY: y }],
        opacity: op,
      }}
    />
  );
}

/* ── Gift card — real image + TikTok-style tiered effects ── */
function GiftCard({
  gift, selected, canAfford, onPress,
}: {
  gift: typeof GIFTS[0]; selected: boolean; canAfford: boolean; onPress: () => void;
}) {
  const cfg = TIER_CFG[gift.tier];
  const [imgErr, setImgErr] = useState(false);
  const showImg = !!gift.img && !imgErr;

  const floatY     = useRef(new Animated.Value(0)).current;
  const breathS    = useRef(new Animated.Value(1)).current;
  const shimmerX   = useRef(new Animated.Value(-160)).current;
  const swayR      = useRef(new Animated.Value(0)).current;
  const pressS     = useRef(new Animated.Value(1)).current;
  const shakeX     = useRef(new Animated.Value(0)).current;
  const selectS    = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const glowOp     = useRef(new Animated.Value(0)).current;
  const ringS      = useRef(new Animated.Value(0.8)).current;
  const cardEntryS = useRef(new Animated.Value(0.6)).current;
  const cardEntryO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = (gift.tokens % 19) * 22;
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardEntryS, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 16 }),
        Animated.timing(cardEntryO, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -cfg.floatH, duration: cfg.floatDur, useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0,           duration: cfg.floatDur, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathS, { toValue: cfg.breathAmt, duration: cfg.breathDur, useNativeDriver: true }),
      Animated.timing(breathS, { toValue: 1,             duration: cfg.breathDur, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    const run = () => {
      shimmerX.setValue(-160);
      Animated.timing(shimmerX, { toValue: 220, duration: 680, useNativeDriver: true }).start(() => {
        setTimeout(run, cfg.shimmerInterval);
      });
    };
    const t = setTimeout(run, (gift.tokens * 31) % cfg.shimmerInterval);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cfg.swayDeg === 0) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(swayR, { toValue:  1, duration: 480, useNativeDriver: true }),
      Animated.timing(swayR, { toValue: -1, duration: 480, useNativeDriver: true }),
      Animated.timing(swayR, { toValue:  0, duration: 240, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (selected) {
      Animated.spring(selectS, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
      const gLoop = Animated.loop(Animated.sequence([
        Animated.timing(glowOp, { toValue: 1,   duration: cfg.glowSpeed, useNativeDriver: true }),
        Animated.timing(glowOp, { toValue: 0.3, duration: cfg.glowSpeed, useNativeDriver: true }),
      ]));
      gLoop.start();
      if (cfg.rings > 0) {
        const rLoop = Animated.loop(Animated.sequence([
          Animated.timing(ringS, { toValue: 1.4, duration: cfg.glowSpeed * 1.2, useNativeDriver: true }),
          Animated.timing(ringS, { toValue: 0.8, duration: cfg.glowSpeed * 1.2, useNativeDriver: true }),
        ]));
        rLoop.start();
      }
      return () => { gLoop.stop(); };
    } else {
      Animated.spring(selectS, { toValue: 0, useNativeDriver: true, speed: 14 }).start();
      glowOp.setValue(0); ringS.setValue(0.8);
    }
  }, [selected]);

  function handlePress() {
    if (!canAfford) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue:  9, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -9, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  6, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 45, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onPress();
      return;
    }
    Animated.sequence([
      Animated.spring(pressS, { toValue: 0.87, useNativeDriver: true, speed: 30, bounciness: 0 }),
      Animated.spring(pressS, { toValue: 1,    useNativeDriver: true, speed: 16, bounciness: 20 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  const emojiRot   = swayR.interpolate({ inputRange: [-1, 1], outputRange: [`-${cfg.swayDeg}deg`, `${cfg.swayDeg}deg`] });
  const glowOpI    = glowOp.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const fee   = Math.round(gift.tokens * FEE);
  const total = gift.tokens + fee;
  const rank  = RANK_LABEL[gift.tier];
  const isLegendary = gift.tier === "Legendary";
  const isElite     = gift.tier === "Elite";

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={[styles.giftCardWrap, { opacity: canAfford ? 1 : 0.3 }]}
    >
      <Animated.View style={{
        transform: [
          { scale: Animated.multiply(Animated.multiply(pressS, breathS), cardEntryS) },
          { translateX: shakeX },
        ],
        opacity: cardEntryO,
      }}>

        {/* Outer glow ring(s) */}
        {selected && Array.from({ length: cfg.rings }).map((_, ri) => (
          <Animated.View key={ri} style={[
            styles.glowRing,
            {
              borderColor: gift.glow,
              shadowColor: gift.grad[1],
              shadowRadius: 18 + ri * 8,
              opacity: glowOpI,
              transform: [{ scale: Animated.add(ringS, new Animated.Value(ri * 0.15)) }],
            },
          ]} />
        ))}

        <View style={[styles.giftCard, {
          borderColor: selected ? gift.grad[0] : gift.tierColor + "22",
          borderWidth: selected ? 2 : 1,
          overflow: "hidden",
        }]}>

          {/* ── Real Image background ── */}
          {showImg && (
            <Image
              source={{ uri: gift.img! }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setImgErr(true)}
            />
          )}

          {/* ── Gradient overlay (darkens image bottom for readability, or fills card without image) ── */}
          <LinearGradient
            colors={showImg
              ? (selected
                  ? ["transparent", gift.grad[1] + "BB"] as [string,string]
                  : ["rgba(0,0,0,0.08)", "rgba(0,0,0,0.78)"] as [string,string])
              : (selected ? gift.grad : ["#141428", "#1E1E38"] as [string,string])
            }
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* ── Shimmer sweep ── */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { overflow: "hidden", borderRadius: 18, transform: [{ translateX: shimmerX }] },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.16)", "rgba(255,255,255,0.08)", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: 90, height: "100%", transform: [{ rotate: "18deg" }] }}
            />
          </Animated.View>

          {/* ── Particles (higher tiers only) ── */}
          {Array.from({ length: cfg.particleCount }).map((_, pi) => (
            <Particle key={pi} color={gift.grad[0]} />
          ))}

          {/* ── Rank badge ── */}
          {rank && (
            <View style={[styles.rankBadge, { backgroundColor: rank.color + "22", borderColor: rank.color + "55" }]}>
              <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.text}</Text>
            </View>
          )}

          {/* ── Tier badge ── */}
          <View style={[styles.tierBadge, { backgroundColor: gift.tierColor + "22", borderColor: gift.tierColor + "50" }]}>
            <Text style={[styles.tierBadgeText, { color: selected ? "#fff" : gift.tierColor }]}>
              {TIER_ICONS[gift.tier]} {gift.tier}
            </Text>
          </View>

          {/* ── Emoji (shown only when no real image) ── */}
          {!showImg && (
            <Animated.Text style={[
              styles.giftEmoji,
              { transform: [{ translateY: floatY }, { rotate: emojiRot }] },
            ]}>
              {gift.emoji}
            </Animated.Text>
          )}

          {/* ── Float animation overlay on image ── */}
          {showImg && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute", inset: 0,
                transform: [{ translateY: Animated.multiply(floatY, new Animated.Value(0.3)) }],
              }}
            />
          )}

          {/* ── Text overlay at bottom ── */}
          <View style={styles.giftTextBottom}>
            <Text style={[styles.giftName, { color: "#fff" }]} numberOfLines={1}>
              {gift.label}
            </Text>
            <Text style={[styles.giftCost, { color: isLegendary ? "#FFD700" : isElite ? "#FF6B6B" : "#fff" }]}>
              {total.toLocaleString()} ST
            </Text>
            <Text style={styles.giftEur}>
              €{(total / 100).toFixed(0)}
            </Text>
          </View>

          {selected && (
            <Animated.View style={[styles.checkBadge, { backgroundColor: gift.grad[1] + "cc", transform: [{ scale: selectS }] }]}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </Animated.View>
          )}
          {!canAfford && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={9} color="#fff" />
            </View>
          )}

          {/* Legendary: extra golden shimmer ring */}
          {isLegendary && selected && (
            <Animated.View pointerEvents="none" style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: 18, borderWidth: 2, borderColor: "#FFD700", opacity: glowOpI },
            ]} />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ── Tier section header ── */
function TierHeader({ tier }: { tier: string }) {
  return (
    <View style={[styles.tierHeader, { borderLeftColor: TIER_COLORS[tier] }]}>
      <Text style={[styles.tierHeaderText, { color: TIER_COLORS[tier] }]}>
        {TIER_ICONS[tier]}  {tier}
      </Text>
    </View>
  );
}

/* ══ Main modal ══ */
export interface GiftSentInfo {
  emoji: string; label: string; tokens: number; grad: [string, string];
}
interface Props {
  visible: boolean; onClose: () => void; recipientName: string;
  onGiftSent?: (gift: GiftSentInfo) => void;
}

export default function GiftModal({ visible, onClose, recipientName, onGiftSent }: Props) {
  const { coinBalance, addCoins, spendCoins, addEarning } = useApp();
  const [step,         setStep]         = useState<"buy" | "send">("send");
  const [selectedGift, setSelectedGift] = useState(GIFTS[0]);
  const [sent,         setSent]         = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const successAnim = useRef(new Animated.Value(0)).current;
  const successRot  = useRef(new Animated.Value(0)).current;

  const fee       = Math.round(selectedGift.tokens * FEE);
  const totalCost = selectedGift.tokens + fee;
  const canSend   = coinBalance >= totalCost;

  useEffect(() => {
    if (visible) {
      setSent(false);
      setStep(coinBalance > 0 ? "send" : "buy");
      successAnim.setValue(0); successRot.setValue(0);
    }
  }, [visible]);

  function playSentAnimation() {
    Animated.parallel([
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 20 }),
      Animated.timing(successRot,  { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
  }

  async function completeBuy(tokens: number, eur: number, method: "stripe" | "paypal") {
    try {
      const paid = method === "stripe"
        ? await buyTokensWithStripe(tokens, eur)
        : await buyTokensWithPayPal(tokens, eur);
      if (!paid) return;
      addCoins(tokens);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Spark Tokens added! 🔥", `${tokens} ST added to your wallet!`);
      setCustomAmount(""); setStep("send");
    } catch (err: any) {
      Alert.alert("Payment failed", err.message ?? "Something went wrong. Try again.");
    }
  }

  function handleBuy(tokens: number, eur: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") { completeBuy(tokens, eur, "stripe"); return; }
    Alert.alert(`Buy ${tokens} ST · €${eur.toFixed(2)}`, "Choose a payment method", [
      { text: "💳 Card (Stripe)", onPress: () => completeBuy(tokens, eur, "stripe") },
      { text: "💸 PayPal",        onPress: () => completeBuy(tokens, eur, "paypal") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const MIN_TOKENS = 50;
  const customTokens = Math.floor(Number(customAmount)) || 0;
  const customEur    = parseFloat((customTokens * 0.01).toFixed(2));
  const customValid  = customTokens >= MIN_TOKENS;

  function handleSend() {
    if (!canSend) { setStep("buy"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(totalCost);
    addEarning(parseFloat((selectedGift.tokens * 0.1).toFixed(2)));
    setSent(true); playSentAnimation();
    onGiftSent?.({ emoji: selectedGift.emoji, label: selectedGift.label, tokens: selectedGift.tokens, grad: selectedGift.grad });
  }

  function handleClose() { setSent(false); onClose(); }

  const successScale  = successAnim.interpolate({ inputRange: [0,1], outputRange: [0.2, 1] });
  const successRotDeg = successRot.interpolate({ inputRange: [0,1], outputRange: ["-25deg","0deg"] });

  const sections = TIER_ORDER.map(tier => ({ tier, gifts: GIFTS.filter(g => g.tier === tier) }));

  const [imgErrSent, setImgErrSent] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{sent ? "Gift Sent! 🎉" : "🎁 Send a Gift"}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top:12,bottom:12,left:12,right:12 }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.successBlock}>
              <Animated.View style={{ transform: [{ scale: successScale }, { rotate: successRotDeg }] }}>
                <LinearGradient colors={selectedGift.grad} style={styles.successCircle}>
                  {selectedGift.img && !imgErrSent ? (
                    <Image
                      source={{ uri: selectedGift.img }}
                      style={{ width: "100%", height: "100%", borderRadius: 50 }}
                      resizeMode="cover"
                      onError={() => setImgErrSent(true)}
                    />
                  ) : (
                    <Text style={styles.successEmoji}>{selectedGift.emoji}</Text>
                  )}
                </LinearGradient>
              </Animated.View>
              <Animated.View style={{
                opacity: successAnim,
                transform: [{ translateY: successAnim.interpolate({ inputRange:[0,1], outputRange:[28,0] }) }],
                alignItems: "center", gap: 6,
              }}>
                <Text style={styles.successTitle}>{selectedGift.label} sent!</Text>
                <Text style={styles.successSub}>{recipientName} received {selectedGift.tokens.toLocaleString()} ST 💝</Text>
              </Animated.View>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.85}>
                <LinearGradient colors={selectedGift.grad} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.doneBtn}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Step pills */}
              <View style={styles.stepRow}>
                {(["buy","send"] as const).map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && <View style={styles.stepArrow} />}
                    <TouchableOpacity
                      style={[styles.stepPill, step === s && styles.stepPillActive]}
                      onPress={() => setStep(s)} activeOpacity={0.8}
                    >
                      <Text style={[styles.stepNum, step === s && styles.stepNumActive]}>{i+1}</Text>
                      <Text style={[styles.stepLabel, { color: step === s ? "#fff" : "#444" }]}>
                        {s === "buy" ? "Buy ST" : "Send Gift"}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>

              {/* Balance */}
              <View style={styles.balanceBar}>
                <Text style={styles.balanceIcon}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceLabel}>Your Spark Tokens</Text>
                  <Text style={styles.balanceValue}>{coinBalance.toLocaleString()} ST</Text>
                </View>
                {step === "send" && (
                  <TouchableOpacity style={styles.topUpChip} onPress={() => setStep("buy")} activeOpacity={0.8}>
                    <Ionicons name="add" size={13} color="#FF3366" />
                    <Text style={styles.topUpText}>Top up</Text>
                  </TouchableOpacity>
                )}
              </View>

              {step === "buy" ? (
                <>
                  <View style={styles.infoBanner}>
                    <Text style={styles.infoEmoji}>💡</Text>
                    <Text style={styles.infoText}>
                      Buy Spark Tokens to send beautiful gifts.{"\n"}
                      <Text style={{ color: "#444" }}>1 ST = €0.01 · Smallest 50 ST · Biggest 30,000 ST = €300</Text>
                    </Text>
                  </View>

                  {/* ST packs */}
                  {[
                    { tokens: 500,   eur: 4.50,  label: "500 ST",   popular: false },
                    { tokens: 1000,  eur: 8.50,  label: "1,000 ST", popular: true  },
                    { tokens: 5000,  eur: 40.00, label: "5,000 ST", popular: false },
                    { tokens: 10000, eur: 75.00, label: "10,000 ST",popular: false },
                    { tokens: 30000, eur: 270.00,label: "30,000 ST",popular: false },
                  ].map(pack => (
                    <TouchableOpacity key={pack.tokens} style={[styles.packRow, pack.popular && styles.packRowPopular]} onPress={() => handleBuy(pack.tokens, pack.eur)} activeOpacity={0.8}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.packTokens}>⚡ {pack.label}</Text>
                        <Text style={styles.packEur}>€{pack.eur.toFixed(2)}</Text>
                      </View>
                      {pack.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>BEST VALUE</Text></View>}
                      <Ionicons name="chevron-forward" size={16} color="#555" />
                    </TouchableOpacity>
                  ))}

                  <View style={styles.customRow}>
                    <Text style={styles.customLabel}>Custom amount (min 50 ST)</Text>
                    <View style={styles.customInputRow}>
                      <TextInput
                        style={styles.customInput}
                        placeholder="Enter ST amount"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={customAmount}
                        onChangeText={setCustomAmount}
                      />
                      <TouchableOpacity
                        style={[styles.customBuyBtn, !customValid && { opacity: 0.4 }]}
                        onPress={() => customValid && handleBuy(customTokens, customEur)}
                        disabled={!customValid}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.customBuyText}>Buy €{customEur.toFixed(2)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Gift grid by tier */}
                  {sections.map(({ tier, gifts }) => (
                    <View key={tier}>
                      <TierHeader tier={tier} />
                      <View style={styles.giftGrid}>
                        {gifts.map(g => (
                          <GiftCard
                            key={g.tokens}
                            gift={g}
                            selected={selectedGift.tokens === g.tokens}
                            canAfford={coinBalance >= g.tokens + Math.round(g.tokens * FEE)}
                            onPress={() => {
                              if (coinBalance >= g.tokens + Math.round(g.tokens * FEE)) {
                                setSelectedGift(g);
                              }
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  ))}

                  {/* Send button */}
                  <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
                    <TouchableOpacity onPress={handleSend} activeOpacity={0.88} disabled={!canSend}>
                      <LinearGradient
                        colors={canSend ? selectedGift.grad : ["#1a1a1a", "#333"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.sendBtn}
                      >
                        <Text style={styles.sendBtnText}>
                          {canSend
                            ? `Send ${selectedGift.label} · ${totalCost.toLocaleString()} ST`
                            : `Need ${(totalCost - coinBalance).toLocaleString()} more ST`}
                        </Text>
                        {canSend && <Text style={styles.sendBtnSub}>€{(totalCost / 100).toFixed(0)} · +10% fee included</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  sheet:   { backgroundColor: "#0D0B12", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%", paddingBottom: 0 },
  handle:  { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 6 },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10 },
  title:   { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },

  /* ── Step pills ── */
  stepRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 8, marginBottom: 10 },
  stepArrow:       { width: 16, height: 1.5, backgroundColor: "#333" },
  stepPill:        { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#1A1A2E", borderWidth: 1, borderColor: "#333" },
  stepPillActive:  { backgroundColor: "#C0392B", borderColor: "#C0392B" },
  stepNum:         { width: 18, height: 18, borderRadius: 9, backgroundColor: "#333", textAlign: "center", fontSize: 10, fontFamily: "Inter_700Bold", color: "#888", lineHeight: 18 },
  stepNumActive:   { backgroundColor: "rgba(255,255,255,0.3)", color: "#fff" },
  stepLabel:       { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  /* ── Balance ── */
  balanceBar:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#141428", borderRadius: 16, padding: 12, marginHorizontal: 16, marginBottom: 10 },
  balanceIcon:  { fontSize: 24 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  balanceValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#F39C12" },
  topUpChip:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1A1A2E", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#FF3366" },
  topUpText:    { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#FF3366" },

  /* ── Info banner ── */
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#141428", borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 10 },
  infoEmoji:  { fontSize: 16, marginTop: 1 },
  infoText:   { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: "#888", lineHeight: 16 },

  /* ── ST Packs ── */
  packRow:         { flexDirection: "row", alignItems: "center", backgroundColor: "#141428", borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: "#1E1E38" },
  packRowPopular:  { borderColor: "#C0392B", backgroundColor: "#1A0A0A" },
  packTokens:      { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  packEur:         { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666", marginTop: 2 },
  popularBadge:    { backgroundColor: "#C0392B", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  popularText:     { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },

  /* ── Custom ── */
  customRow:      { padding: 16 },
  customLabel:    { fontSize: 12, fontFamily: "Inter_400Regular", color: "#555", marginBottom: 8 },
  customInputRow: { flexDirection: "row", gap: 8 },
  customInput:    { flex: 1, backgroundColor: "#141428", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", color: "#fff", borderWidth: 1, borderColor: "#1E1E38" },
  customBuyBtn:   { backgroundColor: "#C0392B", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, justifyContent: "center" },
  customBuyText:  { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  /* ── Tier header ── */
  tierHeader: { marginHorizontal: 16, marginTop: 14, marginBottom: 6, borderLeftWidth: 3, paddingLeft: 10 },
  tierHeaderText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  /* ── Gift grid ── */
  giftGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },

  /* ── Gift card ── */
  giftCardWrap: { width: "22%", minWidth: 70 },
  giftCard: {
    borderRadius: 18, height: 108, position: "relative",
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  glowRing: {
    position: "absolute", inset: -4, borderRadius: 22,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8,
    elevation: 12,
  },

  /* ── Emoji (no-image gifts) ── */
  giftEmoji: { fontSize: 34, textAlign: "center", marginTop: 12 },

  /* ── Text overlay at bottom of card ── */
  giftTextBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 5, paddingBottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  giftName: { fontSize: 9,  fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  giftCost: { fontSize: 9,  fontFamily: "Inter_700Bold", color: "#F39C12", textAlign: "center" },
  giftEur:  { fontSize: 7.5,fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", textAlign: "center" },

  /* ── Rank / tier badge ── */
  rankBadge:     { position: "absolute", top: 4, right: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 2 },
  rankBadgeText: { fontSize: 7, fontFamily: "Inter_700Bold" },
  tierBadge:     { position: "absolute", top: 4, left: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 2 },
  tierBadgeText: { fontSize: 7, fontFamily: "Inter_600SemiBold" },

  /* ── Check / lock ── */
  checkBadge: { position: "absolute", bottom: 34, right: 5, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lockBadge:  { position: "absolute", bottom: 34, right: 5, width: 14, height: 14, borderRadius: 7, backgroundColor: "#0008", alignItems: "center", justifyContent: "center" },

  /* ── Send button ── */
  sendBtn:    { borderRadius: 18, paddingVertical: 16, alignItems: "center", gap: 4 },
  sendBtnText:{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  sendBtnSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)" },

  /* ── Success ── */
  successBlock:  { alignItems: "center", paddingVertical: 32, gap: 18, paddingHorizontal: 24 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  successEmoji:  { fontSize: 52 },
  successTitle:  { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  successSub:    { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
  doneBtn:       { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 48 },
  doneBtnText:   { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";

/* ─── 30 gift tiers — sweet → romantic → flirty → spicy → erotic ─── */
const GIFTS = [
  /* ── Sweet (1–15 ST) ── */
  { tokens: 1,    label: "Rose",         emoji: "🌹", desc: "A sweet gesture",        tier: "Sweet",    grad: ["#FFD6E7","#FF8FAB"] as [string,string], glow: "#FF8FAB90", tierColor: "#FF6B9D" },
  { tokens: 3,    label: "Blossom",      emoji: "🌸", desc: "Gentle and soft",         tier: "Sweet",    grad: ["#FFC8DD","#FF85A1"] as [string,string], glow: "#FF85A190", tierColor: "#FF6B9D" },
  { tokens: 5,    label: "Love Letter",  emoji: "💌", desc: "From the heart",          tier: "Sweet",    grad: ["#FFAFCC","#FF5C8A"] as [string,string], glow: "#FF5C8A90", tierColor: "#FF6B9D" },
  { tokens: 8,    label: "Two Hearts",   emoji: "💕", desc: "Feelings growing",        tier: "Sweet",    grad: ["#FF9EBC","#FF4D79"] as [string,string], glow: "#FF4D7990", tierColor: "#FF6B9D" },
  { tokens: 10,   label: "Daisy",        emoji: "🌼", desc: "Pure and sunny",          tier: "Sweet",    grad: ["#FFF3B0","#FFD23F"] as [string,string], glow: "#FFD23F90", tierColor: "#FF6B9D" },
  { tokens: 15,   label: "Cupid",        emoji: "💘", desc: "Love arrow struck",       tier: "Sweet",    grad: ["#FF7BAC","#E63974"] as [string,string], glow: "#E6397490", tierColor: "#FF6B9D" },

  /* ── Romantic (20–75 ST) ── */
  { tokens: 20,   label: "Butterfly",    emoji: "🦋", desc: "Flutter of feelings",    tier: "Romantic", grad: ["#BDB2FF","#7B2D8B"] as [string,string], glow: "#7B2D8B90", tierColor: "#C77DFF" },
  { tokens: 30,   label: "Tulip",        emoji: "🌷", desc: "Delicate desire",         tier: "Romantic", grad: ["#E0AAFF","#9D4EDD"] as [string,string], glow: "#9D4EDD90", tierColor: "#C77DFF" },
  { tokens: 40,   label: "Kiss",         emoji: "💋", desc: "Soft lips on yours",      tier: "Romantic", grad: ["#C77DFF","#7B2FBE"] as [string,string], glow: "#C77DFF90", tierColor: "#C77DFF" },
  { tokens: 55,   label: "Wine",         emoji: "🍷", desc: "A sensual evening",       tier: "Romantic", grad: ["#9E2A2B","#540B0E"] as [string,string], glow: "#9E2A2B90", tierColor: "#C77DFF" },
  { tokens: 65,   label: "Diamond",      emoji: "💎", desc: "You shine bright",        tier: "Romantic", grad: ["#48CAE4","#0077B6"] as [string,string], glow: "#48CAE490", tierColor: "#C77DFF" },
  { tokens: 75,   label: "Night Glow",   emoji: "🌙", desc: "Under the stars",         tier: "Romantic", grad: ["#1E3A5F","#4895EF"] as [string,string], glow: "#4895EF90", tierColor: "#C77DFF" },

  /* ── Flirty (100–300 ST) ── */
  { tokens: 100,  label: "Cherries",     emoji: "🍒", desc: "Sweet & naughty",         tier: "Flirty",   grad: ["#FF4D6D","#C9184A"] as [string,string], glow: "#FF4D6D90", tierColor: "#FF6B35" },
  { tokens: 125,  label: "Hot Pepper",   emoji: "🌶️", desc: "Getting spicy",           tier: "Flirty",   grad: ["#FF6B35","#D62828"] as [string,string], glow: "#FF6B3590", tierColor: "#FF6B35" },
  { tokens: 150,  label: "Juicy Lips",   emoji: "🫦", desc: "Kiss me right now",       tier: "Flirty",   grad: ["#CC2936","#8B0000"] as [string,string], glow: "#CC293690", tierColor: "#FF6B35" },
  { tokens: 200,  label: "Flame",        emoji: "🔥", desc: "Pure desire burning",     tier: "Flirty",   grad: ["#FF4500","#B22222"] as [string,string], glow: "#FF450090", tierColor: "#FF6B35" },
  { tokens: 250,  label: "Bikini",       emoji: "👙", desc: "Strip it off for me",     tier: "Flirty",   grad: ["#FF69B4","#C2185B"] as [string,string], glow: "#FF69B490", tierColor: "#FF6B35" },
  { tokens: 300,  label: "Lipstick",     emoji: "💄", desc: "Leave your mark",         tier: "Flirty",   grad: ["#C0392B","#922B21"] as [string,string], glow: "#C0392B90", tierColor: "#FF6B35" },

  /* ── Spicy (350–700 ST) ── */
  { tokens: 350,  label: "Stiletto",     emoji: "👠", desc: "Dangerously attractive",  tier: "Spicy",    grad: ["#6B0000","#CC0000"] as [string,string], glow: "#CC000090", tierColor: "#FF1744" },
  { tokens: 450,  label: "Wet",          emoji: "💦", desc: "All worked up",           tier: "Spicy",    grad: ["#0077B6","#023E8A"] as [string,string], glow: "#0077B690", tierColor: "#FF1744" },
  { tokens: 500,  label: "Booty",        emoji: "🍑", desc: "That perfect shape",      tier: "Spicy",    grad: ["#FF8C69","#C1440E"] as [string,string], glow: "#FF8C6990", tierColor: "#FF1744" },
  { tokens: 600,  label: "Titties",      emoji: "🍈", desc: "Can't stop staring",      tier: "Spicy",    grad: ["#FF6B9D","#A0003A"] as [string,string], glow: "#FF6B9D90", tierColor: "#FF1744" },
  { tokens: 650,  label: "Handcuffs",    emoji: "⛓️", desc: "You're mine tonight",     tier: "Spicy",    grad: ["#2C0057","#6A00F4"] as [string,string], glow: "#6A00F490", tierColor: "#FF1744" },
  { tokens: 700,  label: "Dark Moon",    emoji: "🌑", desc: "Forbidden pleasure",      tier: "Spicy",    grad: ["#0D0221","#1B1B3A"] as [string,string], glow: "#6B35FF90", tierColor: "#FF1744" },

  /* ── Erotic (750–2000 ST) ── */
  { tokens: 750,  label: "Devil",        emoji: "😈", desc: "Embrace the naughty",    tier: "Erotic",   grad: ["#4A0000","#CC0000"] as [string,string], glow: "#CC000090", tierColor: "#FF3366" },
  { tokens: 900,  label: "Dildo",        emoji: "🍆", desc: "The ultimate toy",        tier: "Erotic",   grad: ["#1A3A00","#4A7C00"] as [string,string], glow: "#4A7C0090", tierColor: "#FF3366" },
  { tokens: 1000, label: "Ass",          emoji: "🍑", desc: "Thicc & irresistible",   tier: "Erotic",   grad: ["#7F1D1D","#CC3700"] as [string,string], glow: "#CC370090", tierColor: "#FF3366" },
  { tokens: 1250, label: "OnlyFans",     emoji: "🔥", desc: "Exclusive content 🔞",   tier: "Erotic",   grad: ["#3A0000","#FF2D00"] as [string,string], glow: "#FF2D0090", tierColor: "#FF3366" },
  { tokens: 1500, label: "Galaxy",       emoji: "🌌", desc: "Universe of desire",     tier: "Erotic",   grad: ["#0D0221","#3A0CA3"] as [string,string], glow: "#3A0CA390", tierColor: "#FF3366" },
  { tokens: 2000, label: "Supernova",    emoji: "🚀", desc: "Explosive chemistry",    tier: "Erotic",   grad: ["#2D0057","#9B2FBE"] as [string,string], glow: "#9B2FBE90", tierColor: "#FF3366" },
];

const TIER_ORDER = ["Sweet", "Romantic", "Flirty", "Spicy", "Erotic"];
const TIER_ICONS: Record<string, string> = {
  Sweet: "🍭", Romantic: "💜", Flirty: "🌶️", Spicy: "🔥", Erotic: "😈",
};

/* ─── ST packages ─── */
const ST_PACKAGES = [
  { tokens: 50,   eur: 5,  icon: "💌", label: "Starter", hint: "50 Roses or a Kiss 💋",              highlight: false },
  { tokens: 100,  eur: 10, icon: "💋", label: "Popular", hint: "1 Diamond or 2 Wines 🍷",             highlight: true  },
  { tokens: 500,  eur: 50, icon: "🔥", label: "Spicy",   hint: "1 Lipstick or 5 Hot Peppers 🌶️",     highlight: false },
  { tokens: 2000, eur: 20, icon: "😈", label: "Erotic",  hint: "1 Supernova or 2 Galaxies 🌌",        highlight: false },
];

const FEE = 0.10;

/* ── Per-tier animation config ── */
const TIER_CFG: Record<string, { floatDur: number; floatH: number; breathAmt: number; breathDur: number; shimmerInterval: number; particleCount: number; swayDeg: number; glowSpeed: number }> = {
  Sweet:    { floatDur: 1500, floatH:  8, breathAmt: 1.02, breathDur: 2200, shimmerInterval: 4200, particleCount: 2, swayDeg: 0,  glowSpeed: 900 },
  Romantic: { floatDur: 1200, floatH:  9, breathAmt: 1.03, breathDur: 1800, shimmerInterval: 3400, particleCount: 2, swayDeg: 0,  glowSpeed: 750 },
  Flirty:   { floatDur: 1000, floatH: 11, breathAmt: 1.04, breathDur: 1400, shimmerInterval: 2800, particleCount: 3, swayDeg: 6,  glowSpeed: 600 },
  Spicy:    { floatDur:  800, floatH: 13, breathAmt: 1.06, breathDur: 1000, shimmerInterval: 2000, particleCount: 4, swayDeg: 10, glowSpeed: 450 },
  Erotic:   { floatDur:  620, floatH: 15, breathAmt: 1.08, breathDur:  700, shimmerInterval: 1400, particleCount: 5, swayDeg: 14, glowSpeed: 300 },
};

const RANK_LABEL: Record<string, { text: string; color: string } | undefined> = {
  Sweet: undefined, Romantic: undefined,
  Flirty:  { text: "🌶️ HOT",       color: "#FF6B35" },
  Spicy:   { text: "🔥 RARE",      color: "#FF1744" },
  Erotic:  { text: "⚡ LEGENDARY", color: "#C77DFF" },
};

/* ── Single floating particle ── */
function Particle({ color }: { color: string }) {
  const y   = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(0)).current;
  const x   = useRef(new Animated.Value((Math.random() - 0.5) * 70)).current;

  useEffect(() => {
    const run = () => {
      y.setValue(0);
      op.setValue(0);
      x.setValue((Math.random() - 0.5) * 70);
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
      style={{
        position: "absolute",
        bottom: 10,
        left: "50%",
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: color,
        transform: [{ translateX: x }, { translateY: y }],
        opacity: op,
      }}
      pointerEvents="none"
    />
  );
}

/* ══ Animated gift card ══ */
function GiftCard({
  gift, selected, canAfford, onPress,
}: {
  gift: typeof GIFTS[0];
  selected: boolean;
  canAfford: boolean;
  onPress: () => void;
}) {
  const cfg = TIER_CFG[gift.tier];

  const floatY     = useRef(new Animated.Value(0)).current;
  const breathS    = useRef(new Animated.Value(1)).current;
  const shimmerX   = useRef(new Animated.Value(-160)).current;
  const swayR      = useRef(new Animated.Value(0)).current;
  const pressS     = useRef(new Animated.Value(1)).current;
  const shakeX     = useRef(new Animated.Value(0)).current;
  const selectS    = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const glowOp     = useRef(new Animated.Value(0)).current;
  const cardEntryS = useRef(new Animated.Value(0.7)).current;
  const cardEntryO = useRef(new Animated.Value(0)).current;

  /* Card entry pop */
  useEffect(() => {
    const delay = (gift.tokens % 17) * 28;
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardEntryS, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }),
        Animated.timing(cardEntryO, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  /* Float */
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -cfg.floatH, duration: cfg.floatDur, useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0,           duration: cfg.floatDur, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  /* Breath */
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathS, { toValue: cfg.breathAmt, duration: cfg.breathDur, useNativeDriver: true }),
      Animated.timing(breathS, { toValue: 1,             duration: cfg.breathDur, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  /* Shimmer sweep */
  useEffect(() => {
    const run = () => {
      shimmerX.setValue(-160);
      Animated.timing(shimmerX, { toValue: 220, duration: 680, useNativeDriver: true }).start(() => {
        setTimeout(run, cfg.shimmerInterval);
      });
    };
    const t = setTimeout(run, (gift.tokens * 37) % cfg.shimmerInterval);
    return () => clearTimeout(t);
  }, []);

  /* Emoji sway (Flirty → Erotic) */
  useEffect(() => {
    if (cfg.swayDeg === 0) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(swayR, { toValue:  1, duration: 520, useNativeDriver: true }),
      Animated.timing(swayR, { toValue: -1, duration: 520, useNativeDriver: true }),
      Animated.timing(swayR, { toValue:  0, duration: 260, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  /* Glow on select */
  useEffect(() => {
    if (selected) {
      Animated.spring(selectS, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(glowOp, { toValue: 1,   duration: cfg.glowSpeed, useNativeDriver: true }),
        Animated.timing(glowOp, { toValue: 0.3, duration: cfg.glowSpeed, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    } else {
      Animated.spring(selectS, { toValue: 0, useNativeDriver: true, speed: 14 }).start();
      glowOp.setValue(0);
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

  const emojiRot = swayR.interpolate({ inputRange: [-1, 1], outputRange: [`-${cfg.swayDeg}deg`, `${cfg.swayDeg}deg`] });
  const glowOpInterp = glowOp.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const fee   = Math.round(gift.tokens * FEE);
  const total = gift.tokens + fee;
  const rank  = RANK_LABEL[gift.tier];

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={[styles.giftCardWrap, { opacity: canAfford ? 1 : 0.28 }]}
    >
      <Animated.View style={{
        transform: [
          { scale: Animated.multiply(Animated.multiply(pressS, breathS), cardEntryS) },
          { translateX: shakeX },
        ],
        opacity: cardEntryO,
      }}>
        {/* Outer glow ring */}
        {selected && (
          <Animated.View style={[
            styles.glowRing,
            { borderColor: gift.glow, shadowColor: gift.grad[1], shadowRadius: 18, opacity: glowOpInterp },
          ]} />
        )}

        <LinearGradient
          colors={selected ? gift.grad : ["#141428", "#1E1E38"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.giftCard, {
            borderColor: selected ? gift.grad[0] : gift.tierColor + "22",
            borderWidth: selected ? 2 : 1,
          }]}
        >
          {/* ── Shimmer sweep overlay ── */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { overflow: "hidden", borderRadius: 18, transform: [{ translateX: shimmerX }] },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.14)", "rgba(255,255,255,0.07)", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: 90, height: "100%", transform: [{ rotate: "18deg" }] }}
            />
          </Animated.View>

          {/* ── Particles ── */}
          {Array.from({ length: cfg.particleCount }).map((_, i) => (
            <Particle key={i} color={gift.grad[0]} />
          ))}

          {/* ── Rank badge (HOT / RARE / LEGENDARY) ── */}
          {rank && (
            <View style={[styles.rankBadge, { backgroundColor: rank.color + "25", borderColor: rank.color + "60" }]}>
              <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.text}</Text>
            </View>
          )}

          {/* ── Tier badge ── */}
          <View style={[styles.tierBadge, { backgroundColor: gift.tierColor + "22", borderColor: gift.tierColor + "50" }]}>
            <Text style={[styles.tierBadgeText, { color: selected ? "#fff" : gift.tierColor }]}>
              {TIER_ICONS[gift.tier]} {gift.tier}
            </Text>
          </View>

          {/* ── Emoji — float + sway ── */}
          <Animated.Text style={[
            styles.giftEmoji,
            { transform: [{ translateY: floatY }, { rotate: emojiRot }] },
          ]}>
            {gift.emoji}
          </Animated.Text>

          <Text style={[styles.giftName, { color: selected ? "#fff" : "#ccc" }]} numberOfLines={1}>
            {gift.label}
          </Text>
          <Text style={[styles.giftCost, { color: selected ? "#fff" : gift.tierColor }]}>
            {total} ST
          </Text>
          <Text style={[styles.giftDesc, { color: selected ? "rgba(255,255,255,0.6)" : "#484860" }]} numberOfLines={1}>
            {gift.desc}
          </Text>

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
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ══ Tier section header ══ */
function TierHeader({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    Sweet: "#FF6B9D", Romantic: "#C77DFF", Flirty: "#FF6B35", Spicy: "#FF1744", Erotic: "#9B2FBE",
  };
  return (
    <View style={[styles.tierHeader, { borderLeftColor: colors[tier] }]}>
      <Text style={[styles.tierHeaderText, { color: colors[tier] }]}>
        {TIER_ICONS[tier]}  {tier}
      </Text>
    </View>
  );
}

/* ══ Main modal ══ */
interface Props {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
}

export default function GiftModal({ visible, onClose, recipientName }: Props) {
  const { coinBalance, addCoins, spendCoins, addEarning } = useApp();

  const [step,         setStep]         = useState<"buy" | "send">("send");
  const [selectedGift, setSelectedGift] = useState(GIFTS[0]);
  const [sent,         setSent]         = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;
  const successRot  = useRef(new Animated.Value(0)).current;

  const fee       = Math.round(selectedGift.tokens * FEE);
  const totalCost = selectedGift.tokens + fee;
  const canSend   = coinBalance >= totalCost;

  useEffect(() => {
    if (visible) {
      setSent(false);
      setStep(coinBalance > 0 ? "send" : "buy");
      successAnim.setValue(0);
      successRot.setValue(0);
    }
  }, [visible]);

  function playSentAnimation() {
    Animated.parallel([
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 20 }),
      Animated.timing(successRot,  { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
  }

  async function handleBuy(pkg: typeof ST_PACKAGES[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url =
      "https://www.paypal.com/cgi-bin/webscr?" +
      "cmd=_xclick&business=dumitru8830%40gmail.com" +
      `&amount=${pkg.eur}.00&currency_code=EUR` +
      `&item_name=Spark+${pkg.tokens}+Tokens`;
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
    addCoins(pkg.tokens);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Spark Tokens added! 🔥", `${pkg.tokens} ST added to your wallet!`);
    setStep("send");
  }

  function handleSend() {
    if (!canSend) { setStep("buy"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(totalCost);
    addEarning(parseFloat((selectedGift.tokens * 0.1).toFixed(2)));
    setSent(true);
    playSentAnimation();
  }

  function handleClose() { setSent(false); onClose(); }

  const successScale  = successAnim.interpolate({ inputRange: [0,1], outputRange: [0.2, 1] });
  const successRotDeg = successRot.interpolate({ inputRange: [0,1], outputRange: ["-25deg","0deg"] });

  /* Build grid sections by tier */
  const sections = TIER_ORDER.map((tier) => ({
    tier,
    gifts: GIFTS.filter((g) => g.tier === tier),
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{sent ? "Gift Sent! 🎉" : "🎁 Send a Gift"}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top:12,bottom:12,left:12,right:12 }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {sent ? (
            /* ── Success ── */
            <View style={styles.successBlock}>
              <Animated.View style={{ transform: [{ scale: successScale }, { rotate: successRotDeg }] }}>
                <LinearGradient colors={selectedGift.grad} style={styles.successCircle}>
                  <Text style={styles.successEmoji}>{selectedGift.emoji}</Text>
                </LinearGradient>
              </Animated.View>
              <Animated.View style={{
                opacity: successAnim,
                transform: [{ translateY: successAnim.interpolate({ inputRange:[0,1], outputRange:[28,0] }) }],
                alignItems: "center", gap: 6,
              }}>
                <Text style={styles.successTitle}>{selectedGift.label} sent!</Text>
                <Text style={styles.successSub}>{recipientName} received {selectedGift.tokens} ST 💝</Text>
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
                  <Text style={styles.balanceValue}>{coinBalance} ST</Text>
                </View>
                {step === "send" && (
                  <TouchableOpacity style={styles.topUpChip} onPress={() => setStep("buy")} activeOpacity={0.8}>
                    <Ionicons name="add" size={13} color="#FF3366" />
                    <Text style={styles.topUpText}>Top up</Text>
                  </TouchableOpacity>
                )}
              </View>

              {step === "buy" ? (
                /* ═ Buy ST ═ */
                <>
                  <View style={styles.infoBanner}>
                    <Text style={styles.infoEmoji}>💡</Text>
                    <Text style={styles.infoText}>
                      Buy Spark Tokens to send gifts — from sweet roses to erotic gifts.{"\n"}
                      <Text style={{ color: "#444" }}>1 ST = €0.10 · 20 gifts · 1 ST to 2,000 ST</Text>
                    </Text>
                  </View>
                  <Text style={styles.sectionLabel}>Choose a package</Text>
                  {ST_PACKAGES.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.tokens}
                      style={[styles.pkgRow, pkg.highlight && styles.pkgRowHL]}
                      onPress={() => handleBuy(pkg)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.pkgIcon}>{pkg.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pkgTokens}>
                          {pkg.tokens} ST{pkg.highlight ? <Text style={styles.pkgPopular}>  ⭐ Popular</Text> : null}
                        </Text>
                        <Text style={styles.pkgHint}>{pkg.hint}</Text>
                      </View>
                      <LinearGradient colors={["#FF3366","#FF6B35"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.pkgBtn}>
                        <Text style={styles.pkgBtnText}>€{pkg.eur}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.buyNote}>Payment via PayPal · Tokens added instantly</Text>
                </>
              ) : (
                /* ═ Send Gift — sectioned by tier ═ */
                <>
                  {sections.map(({ tier, gifts }) => (
                    <View key={tier}>
                      <TierHeader tier={tier} />
                      <View style={styles.giftGrid}>
                        {gifts.map((g) => {
                          const gTotal = g.tokens + Math.round(g.tokens * FEE);
                          return (
                            <GiftCard
                              key={g.tokens}
                              gift={g}
                              selected={selectedGift.tokens === g.tokens}
                              canAfford={coinBalance >= gTotal}
                              onPress={() => {
                                if (coinBalance < gTotal) { setStep("buy"); return; }
                                setSelectedGift(g);
                              }}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ))}

                  {/* Fee breakdown */}
                  <View style={styles.feeBox}>
                    <Text style={styles.feeTitle}>Payment breakdown</Text>
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>{selectedGift.emoji}  {selectedGift.label}</Text>
                      <Text style={styles.feeVal}>{selectedGift.tokens} ST</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>Platform fee (10%)</Text>
                      <Text style={[styles.feeVal, { color: "#EF4444" }]}>+{fee} ST</Text>
                    </View>
                    <View style={styles.feeLine} />
                    <View style={styles.feeRow}>
                      <Text style={styles.feeBold}>You spend</Text>
                      <Text style={[styles.feeBoldVal, { color: selectedGift.tierColor }]}>{totalCost} ST</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>{recipientName} receives</Text>
                      <Text style={[styles.feeVal, { color: "#22C55E" }]}>{selectedGift.tokens} ST</Text>
                    </View>
                  </View>

                  {!canSend && coinBalance > 0 && (
                    <View style={styles.warnRow}>
                      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                      <Text style={styles.warnText}>Need {totalCost - coinBalance} more ST.</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={handleSend} activeOpacity={0.88}>
                    <LinearGradient
                      colors={canSend ? selectedGift.grad : ["#2A2A3E","#333350"]}
                      start={{x:0,y:0}} end={{x:1,y:0}}
                      style={styles.sendBtn}
                    >
                      <Text style={styles.sendBtnEmoji}>{selectedGift.emoji}</Text>
                      <Text style={styles.sendBtnText}>
                        {canSend ? `Send ${selectedGift.label}  ·  ${totalCost} ST` : "Buy Spark Tokens first"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: 36 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.80)" },
  sheet: {
    backgroundColor: "#0A0A1A",
    borderTopLeftRadius: 34, borderTopRightRadius: 34,
    paddingHorizontal: 18, paddingBottom: 40, maxHeight: "95%",
  },
  handle: {
    width: 42, height: 4, borderRadius: 2,
    backgroundColor: "#ffffff20", alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 14,
  },
  title: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#fff" },

  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  stepPill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#ffffff10",
  },
  stepPillActive: { backgroundColor: "#FF3366", borderColor: "#FF3366" },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, textAlign: "center", lineHeight: 22,
    fontSize: 12, fontFamily: "Inter_700Bold",
    backgroundColor: "#ffffff10", color: "#444", overflow: "hidden",
  },
  stepNumActive: { backgroundColor: "#ffffff28", color: "#fff" },
  stepLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepArrow: { width: 20, height: 2, marginHorizontal: 6, backgroundColor: "#ffffff10" },

  balanceBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
    borderColor: "#ffffff10", backgroundColor: "#14142A", marginBottom: 14,
  },
  balanceIcon: { fontSize: 26 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#444" },
  balanceValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 28 },
  topUpChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#FF3366",
  },
  topUpText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF3366" },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderColor: "#FF336625", borderRadius: 14,
    padding: 13, marginBottom: 14, backgroundColor: "#FF33660A",
  },
  infoEmoji: { fontSize: 18 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1, color: "#aaa" },

  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, color: "#444",
  },

  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: "#ffffff10", borderRadius: 16,
    padding: 14, marginBottom: 10, backgroundColor: "#14142A",
  },
  pkgRowHL: { backgroundColor: "#FF336610", borderColor: "#FF336635" },
  pkgIcon: { fontSize: 26 },
  pkgTokens: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  pkgPopular: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#FF6B9D" },
  pkgHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#444", marginTop: 2 },
  pkgBtn: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20 },
  pkgBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  buyNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", color: "#333", marginTop: 8 },

  /* Tier section header */
  tierHeader: {
    borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10, marginTop: 4,
  },
  tierHeaderText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  /* Gift grid */
  giftGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  giftCardWrap: { width: "48%" },

  glowRing: {
    position: "absolute", top: -5, left: -5, right: -5, bottom: -5,
    borderRadius: 22, borderWidth: 2,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 16, shadowOpacity: 1,
    elevation: 12,
  },
  giftCard: {
    padding: 11, borderRadius: 18,
    alignItems: "center", gap: 2, overflow: "hidden",
  },

  rankBadge: {
    position: "absolute", top: 6, left: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2,
  },
  rankBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold" },

  tierBadge: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2,
    marginBottom: 4, alignSelf: "center",
  },
  tierBadgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },

  giftEmoji: { fontSize: 40, marginBottom: 2 },
  giftName:  { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  giftCost:  { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  giftDesc:  { fontSize: 9,  fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 13 },

  checkBadge: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#ffffff30", alignItems: "center", justifyContent: "center",
  },
  lockBadge: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#00000070", alignItems: "center", justifyContent: "center",
  },

  feeBox: {
    borderWidth: 1, borderColor: "#ffffff08", borderRadius: 16,
    padding: 14, gap: 8, marginBottom: 12, backgroundColor: "#14142A",
  },
  feeTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  feeRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#444", flex: 1, marginRight: 8 },
  feeVal:   { fontSize: 13, fontFamily: "Inter_500Medium", color: "#888" },
  feeBold:  { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  feeBoldVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  feeLine:  { height: 1, backgroundColor: "#ffffff08", marginVertical: 2 },

  warnRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#EF444425",
    borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: "#EF44440A",
  },
  warnText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#EF4444", flex: 1 },

  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 17, borderRadius: 30,
  },
  sendBtnEmoji: { fontSize: 22 },
  sendBtnText:  { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  successBlock: { alignItems: "center", paddingVertical: 36, gap: 18 },
  successCircle: {
    width: 148, height: 148, borderRadius: 74,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 40, shadowOpacity: 1,
    elevation: 16,
  },
  successEmoji: { fontSize: 74 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  successSub:   { fontSize: 14, fontFamily: "Inter_400Regular", color: "#555", textAlign: "center", lineHeight: 21 },
  doneBtn: { paddingHorizontal: 60, paddingVertical: 16, borderRadius: 30 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

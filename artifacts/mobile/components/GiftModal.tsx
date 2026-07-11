import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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

/* ─── 9 gift tiers scaled to real euro values (1 ST = €0.01) ─── */
const GIFTS = [
  /* ── Sweet ── */
  { tokens: 500,   label: "Rose",        emoji: "🌹", desc: "A sweet gesture",        tier: "Sweet",    grad: ["#FFD6E7","#FF8FAB"] as [string,string], glow: "#FF8FAB90", tierColor: "#FF6B9D" },
  { tokens: 1000,  label: "Love Letter", emoji: "💌", desc: "From the heart",          tier: "Sweet",    grad: ["#FFAFCC","#FF5C8A"] as [string,string], glow: "#FF5C8A90", tierColor: "#FF6B9D" },

  /* ── Romantic ── */
  { tokens: 2000,  label: "Butterfly",   emoji: "🦋", desc: "Flutter of feelings",    tier: "Romantic", grad: ["#BDB2FF","#7B2D8B"] as [string,string], glow: "#7B2D8B90", tierColor: "#C77DFF" },
  { tokens: 2500,  label: "Wine",        emoji: "🍷", desc: "A sensual evening",       tier: "Romantic", grad: ["#9E2A2B","#540B0E"] as [string,string], glow: "#9E2A2B90", tierColor: "#C77DFF" },

  /* ── Flirty ── */
  { tokens: 5000,  label: "Diamond",     emoji: "💎", desc: "You shine bright",        tier: "Flirty",   grad: ["#48CAE4","#0077B6"] as [string,string], glow: "#48CAE490", tierColor: "#FF6B35" },
  { tokens: 8000,  label: "Flame",       emoji: "🔥", desc: "Pure desire burning",     tier: "Flirty",   grad: ["#FF4500","#B22222"] as [string,string], glow: "#FF450090", tierColor: "#FF6B35" },

  /* ── Spicy ── */
  { tokens: 10000, label: "Crown",       emoji: "👑", desc: "Royalty treatment",       tier: "Spicy",    grad: ["#FFD700","#C8860A"] as [string,string], glow: "#FFD70090", tierColor: "#FF1744" },

  /* ── Erotic ── */
  { tokens: 15000, label: "Yacht",       emoji: "🛥️", desc: "Luxury on the waves",     tier: "Erotic",   grad: ["#0D0221","#3A0CA3"] as [string,string], glow: "#3A0CA390", tierColor: "#FF3366" },
  { tokens: 30000, label: "Galaxy",      emoji: "🌌", desc: "Universe of desire",      tier: "Erotic",   grad: ["#2D0057","#9B2FBE"] as [string,string], glow: "#9B2FBE90", tierColor: "#FF3366" },
];

const TIER_ORDER = ["Sweet", "Romantic", "Flirty", "Spicy", "Erotic"];
const TIER_ICONS: Record<string, string> = {
  Sweet: "🍭", Romantic: "💜", Flirty: "🌶️", Spicy: "🔥", Erotic: "😈",
};


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
          <Text style={[styles.giftEur, { color: selected ? "rgba(255,255,255,0.7)" : "#666" }]}>
            €{(total / 100).toFixed(0)}
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

  async function completeBuy(tokens: number, eur: number, method: "stripe" | "paypal") {
    try {
      const paid = method === "stripe"
        ? await buyTokensWithStripe(tokens, eur)
        : await buyTokensWithPayPal(tokens, eur);
      if (!paid) return;
      addCoins(tokens);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Spark Tokens added! 🔥", `${tokens} ST added to your wallet!`);
      setCustomAmount("");
      setStep("send");
    } catch (err: any) {
      Alert.alert("Payment failed", err.message ?? "Something went wrong. Try again.");
    }
  }

  function handleBuy(tokens: number, eur: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // React Native's Alert doesn't support custom multi-button choices on
    // web, so the "choose a payment method" dialog never actually shows
    // there — go straight to Stripe checkout on web instead of a picker.
    if (Platform.OS === "web") {
      completeBuy(tokens, eur, "stripe");
      return;
    }
    Alert.alert(
      `Buy ${tokens} ST · €${eur.toFixed(2)}`,
      "Choose a payment method",
      [
        { text: "Card (Stripe)", onPress: () => completeBuy(tokens, eur, "stripe") },
        { text: "PayPal", onPress: () => completeBuy(tokens, eur, "paypal") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }

  const MIN_TOKENS = 50; // €0.50 minimum (Stripe floor)
  const customTokens = Math.floor(Number(customAmount)) || 0;
  const customEur = parseFloat((customTokens * 0.01).toFixed(2));
  const customValid = customTokens >= MIN_TOKENS;

  function handleBuyCustom() {
    if (!customValid) return;
    handleBuy(customTokens, customEur);
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
                  <Text style={styles.sectionLabel}>How many Spark Tokens?</Text>
                  <View style={styles.customAmountRow}>
                    <TextInput
                      style={styles.customAmountInput}
                      value={customAmount}
                      onChangeText={(t) => setCustomAmount(t.replace(/[^0-9]/g, ""))}
                      placeholder="e.g. 25"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                      inputMode="numeric"
                    />
                    <Text style={styles.customAmountUnit}>ST</Text>
                  </View>
                  <Text style={styles.customAmountEur}>
                    = €{customTokens > 0 ? customEur.toFixed(2) : "0.00"}
                    {customTokens > 0 && !customValid ? "  ·  min 5 ST (€0.50)" : ""}
                  </Text>

                  <View style={styles.quickChipsRow}>
                    {[1, 2, 3, 4, 10, 20, 50, 100].map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={styles.quickChip}
                        onPress={() => setCustomAmount(String(n))}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickChipText}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity onPress={handleBuyCustom} activeOpacity={0.85} disabled={!customValid}>
                    <LinearGradient
                      colors={customValid ? ["#FF3366","#FF6B35"] : ["#ddd","#ccc"]}
                      start={{x:0,y:0}} end={{x:1,y:0}}
                      style={styles.customBuyBtn}
                    >
                      <Text style={styles.customBuyBtnText}>
                        {customTokens > 0 ? `Buy ${customTokens} ST · €${customEur.toFixed(2)}` : "Enter an amount"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.buyNote}>Pay by card (Stripe) or PayPal · Tokens added instantly</Text>
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

  buyNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", color: "#333", marginTop: 8 },

  customAmountRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#ffffff18", borderRadius: 14,
    backgroundColor: "#14142A", paddingHorizontal: 16, paddingVertical: 4,
  },
  customAmountInput: {
    flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", paddingVertical: 12,
  },
  customAmountUnit: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FF6B9D" },
  customAmountEur: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#888", marginTop: 8, marginBottom: 14 },

  quickChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#ffffff10", borderWidth: 1, borderColor: "#ffffff18",
  },
  quickChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },

  customBuyBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center", marginBottom: 6 },
  customBuyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

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
  giftEur:   { fontSize: 10, fontFamily: "Inter_400Regular" },
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

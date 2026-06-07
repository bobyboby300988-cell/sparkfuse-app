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
import { useColors } from "@/hooks/useColors";

/* ─── 16 Gift tiers ─── */
const GIFTS = [
  { tokens: 1,    label: "Rose",          emoji: "🌹", desc: "A sweet gesture",     grad: ["#FF6B9D","#FF3366"] as [string,string], glow: "#FF336680" },
  { tokens: 3,    label: "Blossom",       emoji: "🌸", desc: "Gentle and soft",      grad: ["#FFB3C6","#FF758C"] as [string,string], glow: "#FF758C80" },
  { tokens: 10,   label: "Burning Heart", emoji: "❤️‍🔥", desc: "Heart on fire",        grad: ["#FF8C42","#FF3300"] as [string,string], glow: "#FF440080" },
  { tokens: 20,   label: "Cupid",         emoji: "💘", desc: "Love arrow struck",    grad: ["#FF6F91","#C9184A"] as [string,string], glow: "#C9184A80" },
  { tokens: 35,   label: "Butterfly",     emoji: "🦋", desc: "Flutter of feelings",  grad: ["#7B9EFF","#4361EE"] as [string,string], glow: "#4361EE80" },
  { tokens: 50,   label: "Kiss",          emoji: "💋", desc: "Send a kiss",          grad: ["#C77DFF","#7B2FBE"] as [string,string], glow: "#C77DFF80" },
  { tokens: 75,   label: "Rainbow",       emoji: "🌈", desc: "Color their world",    grad: ["#F72585","#7209B7"] as [string,string], glow: "#F7258580" },
  { tokens: 100,  label: "Diamond",       emoji: "💎", desc: "Shine bright",         grad: ["#48CAE4","#0077B6"] as [string,string], glow: "#48CAE480" },
  { tokens: 150,  label: "Crystal Ball",  emoji: "🔮", desc: "Mystical energy",      grad: ["#9D4EDD","#5A189A"] as [string,string], glow: "#9D4EDD80" },
  { tokens: 250,  label: "Crown",         emoji: "👑", desc: "Feel like royalty",    grad: ["#FFD166","#EF9B20"] as [string,string], glow: "#FFD16680" },
  { tokens: 350,  label: "Unicorn",       emoji: "🦄", desc: "Rare and magical",     grad: ["#F0A6CA","#B5179E"] as [string,string], glow: "#B5179E80" },
  { tokens: 500,  label: "Gold Star",     emoji: "🌟", desc: "You're a star",        grad: ["#FFF176","#F9A825"] as [string,string], glow: "#FFF17680" },
  { tokens: 700,  label: "Comet",         emoji: "☄️", desc: "Blazing brilliance",   grad: ["#F77F00","#D62828"] as [string,string], glow: "#F77F0080" },
  { tokens: 1000, label: "Trophy",        emoji: "🏆", desc: "Champion of hearts",   grad: ["#FFB347","#FF6B00"] as [string,string], glow: "#FFB34780" },
  { tokens: 1500, label: "Galaxy",        emoji: "🌌", desc: "Universe of love",     grad: ["#0096C7","#023E8A"] as [string,string], glow: "#0096C780" },
  { tokens: 2000, label: "Supernova",     emoji: "🚀", desc: "Out of this world",    grad: ["#A78BFA","#4C1D95"] as [string,string], glow: "#A78BFA80" },
];

/* ─── ST packages ─── */
const ST_PACKAGES = [
  { tokens: 50,   eur: 5,  icon: "💰", label: "Starter", hint: "50 Roses or 5 Burning Hearts",     highlight: false },
  { tokens: 100,  eur: 10, icon: "⭐", label: "Popular", hint: "1 Diamond or 2 Crystal Balls",      highlight: true  },
  { tokens: 200,  eur: 20, icon: "🔥", label: "Value",   hint: "4 Crowns or 5 Unicorns",            highlight: false },
  { tokens: 500,  eur: 50, icon: "💎", label: "Premium", hint: "1 Supernova or 1 Galaxy + extras",  highlight: false },
];

const FEE = 0.10;

/* ══════════════════════════════════════════
   Animated gift card
══════════════════════════════════════════ */
function GiftCard({
  gift, selected, canAfford, onPress,
}: {
  gift: typeof GIFTS[0];
  selected: boolean;
  canAfford: boolean;
  onPress: () => void;
}) {
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  /* Continuous float — each gift has slightly different speed */
  useEffect(() => {
    const dur = 1200 + (gift.tokens % 7) * 120;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -9, duration: dur, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:  0, duration: dur, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  /* Glow pulse on selection */
  useEffect(() => {
    if (selected) {
      Animated.spring(selectAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 850, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 850, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.spring(selectAnim, { toValue: 0, useNativeDriver: true, speed: 14 }).start();
      glowAnim.setValue(0);
    }
  }, [selected]);

  function handlePress() {
    if (!canAfford) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue:  7, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  4, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 55, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onPress();
      return;
    }
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.91, useNativeDriver: true, speed: 24, bounciness: 0 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 16, bounciness: 16 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const cardScale = selectAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const glowOp    = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const fee       = Math.round(gift.tokens * FEE);
  const total     = gift.tokens + fee;

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress} style={styles.giftCardWrap}>
      <Animated.View
        style={{
          transform: [
            { scale: Animated.multiply(scaleAnim, cardScale) },
            { translateX: shakeAnim },
          ],
          opacity: canAfford ? 1 : 0.38,
        }}
      >
        {/* Glow ring */}
        {selected && (
          <Animated.View
            style={[
              styles.glowRing,
              { borderColor: gift.glow, shadowColor: gift.glow, opacity: glowOp },
            ]}
          />
        )}

        <LinearGradient
          colors={selected ? gift.grad : ["#1C1C2E", "#252540"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.giftCard,
            { borderColor: selected ? gift.grad[0] : "#ffffff12", borderWidth: selected ? 2 : 1.5 },
          ]}
        >
          {/* Floating emoji */}
          <Animated.Text style={[styles.giftEmoji, { transform: [{ translateY: floatAnim }] }]}>
            {gift.emoji}
          </Animated.Text>

          <Text style={[styles.giftName, { color: selected ? "#fff" : "#bbb" }]} numberOfLines={1}>
            {gift.label}
          </Text>
          <Text style={[styles.giftCost, { color: selected ? "#fff" : "#FF6B9D" }]}>
            {total} ST
          </Text>
          <Text style={[styles.giftDesc, { color: selected ? "rgba(255,255,255,0.7)" : "#666" }]} numberOfLines={1}>
            {gift.desc}
          </Text>

          {selected && (
            <Animated.View style={[styles.checkBadge, { transform: [{ scale: selectAnim }] }]}>
              <Ionicons name="checkmark" size={11} color="#fff" />
            </Animated.View>
          )}
          {!canAfford && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════════
   Main modal
══════════════════════════════════════════ */
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
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 18 }),
      Animated.timing(successRot,  { toValue: 1, duration: 600, useNativeDriver: true }),
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
    Alert.alert("Spark Tokens added! 🔥", `${pkg.tokens} ST added to your wallet. Send a gift!`);
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

  function handleClose() {
    setSent(false);
    onClose();
  }

  const successScale  = successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const successRotDeg = successRot.interpolate({ inputRange: [0, 1], outputRange: ["-20deg", "0deg"] });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{sent ? "Gift Sent! 🎉" : "🎁 Send a Gift"}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color="#666" />
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
                transform: [{ translateY: successAnim.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }],
                alignItems: "center", gap: 6,
              }}>
                <Text style={styles.successTitle}>{selectedGift.label} sent to {recipientName}!</Text>
                <Text style={styles.successSub}>{recipientName} received {selectedGift.tokens} ST as a gift 💝</Text>
              </Animated.View>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.85}>
                <LinearGradient colors={["#FF3366","#FF6B35"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.doneBtn}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

              {/* Step pills */}
              <View style={styles.stepRow}>
                <TouchableOpacity
                  style={[styles.stepPill, step === "buy" && styles.stepPillActive]}
                  onPress={() => setStep("buy")} activeOpacity={0.8}
                >
                  <Text style={[styles.stepNum, step === "buy" && styles.stepNumActive]}>1</Text>
                  <Text style={[styles.stepLabel, { color: step === "buy" ? "#fff" : "#555" }]}>Buy ST</Text>
                </TouchableOpacity>
                <View style={styles.stepArrow} />
                <TouchableOpacity
                  style={[styles.stepPill, step === "send" && styles.stepPillActive]}
                  onPress={() => setStep("send")} activeOpacity={0.8}
                >
                  <Text style={[styles.stepNum, step === "send" && styles.stepNumActive]}>2</Text>
                  <Text style={[styles.stepLabel, { color: step === "send" ? "#fff" : "#555" }]}>Send Gift</Text>
                </TouchableOpacity>
              </View>

              {/* Balance bar */}
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
                /* ══ STEP 1 — Buy ST ══ */
                <>
                  <View style={styles.infoBanner}>
                    <Text style={styles.infoEmoji}>💡</Text>
                    <Text style={styles.infoText}>
                      Buy ST then use them to send beautiful gifts.{"\n"}
                      <Text style={{ color: "#555" }}>1 ST = €0.10 · 16 gifts · from 1 ST to 2,000 ST</Text>
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
                /* ══ STEP 2 — Send Gift ══ */
                <>
                  <Text style={styles.sectionLabel}>Choose a gift for {recipientName}</Text>

                  <View style={styles.giftGrid}>
                    {GIFTS.map((g) => {
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
                      <Text style={[styles.feeBoldVal, { color: "#FF3366" }]}>{totalCost} ST</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>{recipientName} receives</Text>
                      <Text style={[styles.feeVal, { color: "#22C55E" }]}>{selectedGift.tokens} ST</Text>
                    </View>
                  </View>

                  {!canSend && coinBalance > 0 && (
                    <View style={styles.warnRow}>
                      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                      <Text style={styles.warnText}>Need {totalCost - coinBalance} more ST to send this gift.</Text>
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
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.75)" },
  sheet: {
    backgroundColor: "#0F0F1E",
    borderTopLeftRadius: 34, borderTopRightRadius: 34,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: "94%",
  },
  handle: {
    width: 42, height: 4, borderRadius: 2,
    backgroundColor: "#ffffff25", alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 14,
  },
  title: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#fff" },

  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepPill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 11, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#ffffff12",
  },
  stepPillActive: { backgroundColor: "#FF3366", borderColor: "#FF3366" },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    textAlign: "center", lineHeight: 22,
    fontSize: 12, fontFamily: "Inter_700Bold",
    backgroundColor: "#ffffff12", color: "#555", overflow: "hidden",
  },
  stepNumActive: { backgroundColor: "#ffffff30", color: "#fff" },
  stepLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepArrow: { width: 22, height: 2, marginHorizontal: 6, backgroundColor: "#ffffff12" },

  balanceBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
    borderColor: "#ffffff12", backgroundColor: "#1A1A30", marginBottom: 16,
  },
  balanceIcon: { fontSize: 28 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  balanceValue: { fontSize: 23, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 29 },
  topUpChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: "#FF3366",
  },
  topUpText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF3366" },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderColor: "#FF336628", borderRadius: 14,
    padding: 13, marginBottom: 16, backgroundColor: "#FF33660E",
  },
  infoEmoji: { fontSize: 18 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1, color: "#bbb" },

  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 13, color: "#555",
  },

  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: "#ffffff12", borderRadius: 16,
    padding: 14, marginBottom: 10, backgroundColor: "#1A1A30",
  },
  pkgRowHL: { backgroundColor: "#FF336610", borderColor: "#FF336638" },
  pkgIcon: { fontSize: 28 },
  pkgTokens: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  pkgPopular: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#FF6B9D" },
  pkgHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#555", marginTop: 2 },
  pkgBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pkgBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  buyNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", color: "#444", marginTop: 8 },

  /* Gift grid — 2 columns, 16 items = 8 rows, scrollable */
  giftGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  giftCardWrap: { width: "47.5%" },

  glowRing: {
    position: "absolute", top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 22, borderWidth: 2,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 14, shadowOpacity: 1,
    elevation: 10,
  },
  giftCard: {
    padding: 13, borderRadius: 18,
    alignItems: "center", gap: 3, overflow: "hidden",
  },
  giftEmoji: { fontSize: 38, marginBottom: 3 },
  giftName:  { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  giftCost:  { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  giftDesc:  { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  checkBadge: {
    position: "absolute", top: 7, right: 7,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#ffffff35", alignItems: "center", justifyContent: "center",
  },
  lockBadge: {
    position: "absolute", top: 7, right: 7,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#00000070", alignItems: "center", justifyContent: "center",
  },

  feeBox: {
    borderWidth: 1, borderColor: "#ffffff10", borderRadius: 16,
    padding: 14, gap: 8, marginBottom: 12, backgroundColor: "#1A1A30",
  },
  feeTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  feeRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#555", flex: 1, marginRight: 8 },
  feeVal:   { fontSize: 13, fontFamily: "Inter_500Medium", color: "#aaa" },
  feeBold:  { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  feeBoldVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  feeLine:  { height: 1, backgroundColor: "#ffffff10", marginVertical: 2 },

  warnRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#EF444428",
    borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: "#EF44440E",
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
    width: 150, height: 150, borderRadius: 75,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 36, shadowOpacity: 0.9,
    elevation: 14,
  },
  successEmoji: { fontSize: 76 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  successSub:   { fontSize: 14, fontFamily: "Inter_400Regular", color: "#666", textAlign: "center", lineHeight: 21 },
  doneBtn: { paddingHorizontal: 60, paddingVertical: 16, borderRadius: 30 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

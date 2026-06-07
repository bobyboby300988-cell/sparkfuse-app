import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const ST_PACKAGES = [
  { tokens: 50,  eur: 5,  label: "Starter",  icon: "💰",                 highlight: false },
  { tokens: 100, eur: 10, label: "Popular",   icon: "⭐",                 highlight: true  },
  { tokens: 200, eur: 20, label: "Value",     icon: "🔥",                 highlight: false },
  { tokens: 500, eur: 50, label: "Premium",   icon: "💎",                 highlight: false },
];

const GIFTS = [
  { tokens: 1,    label: "Rose",         emoji: "🌹",   desc: "A sweet gesture"       },
  { tokens: 10,   label: "Burning Heart",emoji: "❤️‍🔥", desc: "Heart on fire"          },
  { tokens: 50,   label: "Kiss",         emoji: "💋",   desc: "Send a kiss"            },
  { tokens: 100,  label: "Diamond",      emoji: "💎",   desc: "Shine bright"           },
  { tokens: 250,  label: "Crown",        emoji: "👑",   desc: "Feel like royalty"      },
  { tokens: 500,  label: "Gold Star",    emoji: "🌟",   desc: "You're a star"          },
  { tokens: 1000, label: "Trophy",       emoji: "🏆",   desc: "Champion of hearts"     },
  { tokens: 2000, label: "Supernova",    emoji: "🚀",   desc: "Out of this world"      },
];

const FEE = 0.10;

interface Props {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
}

export default function GiftModal({ visible, onClose, recipientName }: Props) {
  const colors = useColors();
  const { coinBalance, addCoins, spendCoins, addEarning } = useApp();

  const [step, setStep] = useState<"buy" | "send">("send");
  const [selectedGift, setSelectedGift] = useState(GIFTS[0]);
  const [sent, setSent] = useState(false);

  const fee        = Math.round(selectedGift.tokens * FEE);
  const totalCost  = selectedGift.tokens + fee;
  const canSend    = coinBalance >= totalCost;

  useEffect(() => {
    if (visible) {
      setSent(false);
      setStep(coinBalance > 0 ? "send" : "buy");
    }
  }, [visible]);

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
    Alert.alert("Spark Tokens added! 🔥", `${pkg.tokens} ST are now in your wallet. Send a gift!`);
    setStep("send");
  }

  function handleSend() {
    if (!canSend) { setStep("buy"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(totalCost);
    addEarning(parseFloat((selectedGift.tokens * 0.1).toFixed(2)));
    setSent(true);
  }

  function handleClose() {
    setSent(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {sent ? "Gift Sent! 🎉" : "🎁 Send a Gift"}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {sent ? (
            /* ── Success ── */
            <View style={styles.successBlock}>
              <Text style={styles.successEmoji}>{selectedGift.emoji}</Text>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                {selectedGift.label} sent to {recipientName}!
              </Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                {recipientName} received {selectedGift.tokens} Spark Tokens as a gift.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

              {/* ── Step banner ── */}
              <View style={styles.stepRow}>
                <TouchableOpacity
                  style={[styles.stepPill, step === "buy" && styles.stepPillActive]}
                  onPress={() => setStep("buy")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.stepNum, step === "buy" && styles.stepNumActive]}>1</Text>
                  <Text style={[styles.stepLabel, { color: step === "buy" ? "#fff" : colors.mutedForeground }]}>
                    Buy ST
                  </Text>
                </TouchableOpacity>

                <View style={[styles.stepArrow, { backgroundColor: colors.border }]} />

                <TouchableOpacity
                  style={[styles.stepPill, step === "send" && styles.stepPillActive]}
                  onPress={() => setStep("send")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.stepNum, step === "send" && styles.stepNumActive]}>2</Text>
                  <Text style={[styles.stepLabel, { color: step === "send" ? "#fff" : colors.mutedForeground }]}>
                    Send Gift
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Wallet balance ── */}
              <View style={[styles.balanceBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={styles.balanceIcon}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Spark Token balance</Text>
                  <Text style={[styles.balanceValue, { color: colors.foreground }]}>{coinBalance} ST</Text>
                </View>
                {step === "send" && (
                  <TouchableOpacity
                    style={styles.topUpChip}
                    onPress={() => setStep("buy")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={13} color="#FF3366" />
                    <Text style={styles.topUpText}>Top up</Text>
                  </TouchableOpacity>
                )}
              </View>

              {step === "buy" ? (
                /* ════════ STEP 1 — Buy Tokens ════════ */
                <>
                  <View style={[styles.infoBanner, { backgroundColor: "#FF336610", borderColor: "#FF336630" }]}>
                    <Text style={styles.infoEmoji}>💡</Text>
                    <Text style={[styles.infoText, { color: colors.foreground }]}>
                      Buy Spark Tokens (ST) and use them to send gifts to {recipientName}.{"\n"}
                      <Text style={{ color: colors.mutedForeground }}>1 ST = €0.10 · Gifts from 1 ST 🌹 up to 2,000 ST 🚀</Text>
                    </Text>
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Choose a package</Text>

                  {ST_PACKAGES.map((pkg) => {
                    const hint =
                      pkg.tokens === 50  ? "50 Roses 🌹 or 5 Burning Hearts ❤️‍🔥" :
                      pkg.tokens === 100 ? "2 Diamonds 💎 or 100 Roses 🌹" :
                      pkg.tokens === 200 ? "4 Diamonds 💎 or 20 Burning Hearts ❤️‍🔥" :
                      "1 Supernova 🚀 or 2 Trophies 🏆";
                    return (
                      <TouchableOpacity
                        key={pkg.tokens}
                        style={[
                          styles.pkgRow,
                          {
                            backgroundColor: pkg.highlight ? "#FF336612" : colors.background,
                            borderColor: pkg.highlight ? "#FF3366" : colors.border,
                          },
                        ]}
                        onPress={() => handleBuy(pkg)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.pkgIcon}>{pkg.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pkgTokens, { color: colors.foreground }]}>
                            {pkg.tokens} ST
                            {pkg.highlight && <Text style={styles.pkgPopular}>  ⭐ Most Popular</Text>}
                          </Text>
                          <Text style={[styles.pkgSub, { color: colors.mutedForeground }]}>
                            {hint}
                          </Text>
                        </View>
                        <LinearGradient
                          colors={["#FF3366", "#FF6B35"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={styles.pkgBtn}
                        >
                          <Text style={styles.pkgBtnText}>€{pkg.eur}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}

                  <Text style={[styles.buyNote, { color: colors.mutedForeground }]}>
                    Payment via PayPal · Tokens added instantly to your wallet
                  </Text>
                </>
              ) : (
                /* ════════ STEP 2 — Send Gift ════════ */
                <>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    Pick a gift for {recipientName}
                  </Text>

                  <View style={styles.giftGrid}>
                    {GIFTS.map((g) => {
                      const active = selectedGift.tokens === g.tokens;
                      const gFee   = Math.round(g.tokens * FEE);
                      const gTotal = g.tokens + gFee;
                      const canAfford = coinBalance >= gTotal;
                      return (
                        <TouchableOpacity
                          key={g.tokens}
                          style={[
                            styles.giftCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: active ? "#FF3366" : canAfford ? colors.border : colors.border,
                              opacity: canAfford ? 1 : 0.5,
                            },
                          ]}
                          onPress={() => {
                            if (!canAfford) { setStep("buy"); return; }
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedGift(g);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.giftEmoji}>{g.emoji}</Text>
                          <Text style={[styles.giftName, { color: colors.foreground }]}>{g.label}</Text>
                          <Text style={[styles.giftCost, { color: active ? "#FF3366" : colors.mutedForeground }]}>
                            {gTotal} ST
                          </Text>
                          <Text style={[styles.giftDesc, { color: colors.mutedForeground }]}>{g.desc}</Text>
                          {active && (
                            <View style={styles.checkBadge}>
                              <Ionicons name="checkmark" size={11} color="#fff" />
                            </View>
                          )}
                          {!canAfford && (
                            <View style={styles.lockBadge}>
                              <Ionicons name="lock-closed" size={10} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Fee breakdown */}
                  <View style={[styles.feeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.feeTitle, { color: colors.foreground }]}>Payment breakdown</Text>
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>Gift · {selectedGift.label}</Text>
                      <Text style={[styles.feeVal, { color: colors.foreground }]}>{selectedGift.tokens} ST</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>Platform fee (10% from you)</Text>
                      <Text style={[styles.feeVal, { color: "#EF4444" }]}>+{fee} ST</Text>
                    </View>
                    <View style={[styles.feeLine, { backgroundColor: colors.border }]} />
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeBold, { color: colors.foreground }]}>You spend</Text>
                      <Text style={[styles.feeBoldVal, { color: "#FF3366" }]}>{totalCost} ST</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>{recipientName} receives</Text>
                      <Text style={[styles.feeVal, { color: "#22C55E" }]}>{selectedGift.tokens} ST</Text>
                    </View>
                    <View style={[styles.feeNote, { backgroundColor: "#22C55E10", borderColor: "#22C55E30" }]}>
                      <Ionicons name="information-circle-outline" size={14} color="#22C55E" />
                      <Text style={[styles.feeNoteText, { color: colors.mutedForeground }]}>
                        {recipientName} pays a 10% fee when withdrawing — that fee goes to Spark.
                      </Text>
                    </View>
                  </View>

                  {!canSend && coinBalance > 0 && (
                    <View style={[styles.warnRow, { backgroundColor: "#EF444412", borderColor: "#EF444430" }]}>
                      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                      <Text style={[styles.warnText, { color: "#EF4444" }]}>
                        Need {totalCost - coinBalance} more ST. Buy tokens in Step 1.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: canSend ? "#FF3366" : colors.muted }]}
                    onPress={handleSend}
                    activeOpacity={0.85}
                  >
                    {canSend ? (
                      <>
                        <Text style={styles.sendBtnEmoji}>{selectedGift.emoji}</Text>
                        <Text style={styles.sendBtnText}>Send {selectedGift.label} · {totalCost} ST</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="cart-outline" size={18} color="#fff" />
                        <Text style={styles.sendBtnText}>Buy Spark Tokens first</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: "92%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 14,
  },
  title: { fontSize: 19, fontFamily: "Inter_700Bold" },

  /* Steps */
  stepRow: {
    flexDirection: "row", alignItems: "center",
    gap: 0, marginBottom: 16,
  },
  stepPill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 14,
    backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)",
  },
  stepPillActive: {
    backgroundColor: "#FF3366", borderColor: "#FF3366",
  },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, textAlign: "center", lineHeight: 22,
    fontSize: 12, fontFamily: "Inter_700Bold",
    backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  stepNumActive: { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" },
  stepLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepArrow: { width: 24, height: 2, marginHorizontal: 6 },

  /* Balance */
  balanceBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  balanceIcon: { fontSize: 26 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  balanceValue: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  topUpChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#FF3366",
  },
  topUpText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF3366" },

  /* Info banner */
  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  infoEmoji: { fontSize: 18 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },

  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },

  /* Packages */
  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10,
  },
  pkgIcon: { fontSize: 28 },
  pkgTokens: { fontSize: 16, fontFamily: "Inter_700Bold" },
  pkgPopular: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#FF3366" },
  pkgSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pkgBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pkgBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  buyNote: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 18, marginTop: 6,
  },

  /* Gift grid */
  giftGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  giftCard: {
    width: "47%", padding: 14, borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", gap: 3, position: "relative",
  },
  giftEmoji: { fontSize: 36 },
  giftName: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 4 },
  giftCost: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  giftDesc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  checkBadge: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#FF3366", alignItems: "center", justifyContent: "center",
  },
  lockBadge: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#94A3B8", alignItems: "center", justifyContent: "center",
  },

  /* Fee box */
  feeBox: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8, marginBottom: 12 },
  feeTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 4 },
  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, marginRight: 8 },
  feeVal: { fontSize: 13, fontFamily: "Inter_500Medium" },
  feeBold: { fontSize: 14, fontFamily: "Inter_700Bold" },
  feeBoldVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  feeLine: { height: 1, marginVertical: 2 },
  feeNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 4,
  },
  feeNoteText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, flex: 1 },

  /* Warn */
  warnRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12,
  },
  warnText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  /* Send btn */
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 28,
  },
  sendBtnEmoji: { fontSize: 20 },
  sendBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  /* Success */
  successBlock: { alignItems: "center", paddingVertical: 36, gap: 12 },
  successEmoji: { fontSize: 76 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  doneBtn: {
    backgroundColor: "#FF3366",
    paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28, marginTop: 8,
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

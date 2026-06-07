import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
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

const APP_DOMAIN = "https://match-maker-dumitru8830.replit.app";

const COIN_PACKAGES = [
  { coins: 50,  eur: 5,  label: "Starter",  icon: "💰" },
  { coins: 100, eur: 10, label: "Popular",   icon: "⭐", highlight: true },
  { coins: 200, eur: 20, label: "Value",     icon: "🔥" },
  { coins: 500, eur: 50, label: "Premium",   icon: "💎" },
];

const GIFT_OPTIONS = [
  { coins: 10,  label: "Rose",       emoji: "🌹" },
  { coins: 25,  label: "Heart",      emoji: "💖" },
  { coins: 50,  label: "Diamond",    emoji: "💎" },
  { coins: 100, label: "Crown",      emoji: "👑" },
];

const PLATFORM_FEE_RATE = 0.10;

interface Props {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
}

export default function GiftModal({ visible, onClose, recipientName }: Props) {
  const colors = useColors();
  const { coinBalance, addCoins, spendCoins, addEarning } = useApp();

  const [tab, setTab] = useState<"send" | "buy">("send");
  const [selectedGift, setSelectedGift] = useState(GIFT_OPTIONS[0]);
  const [sent, setSent] = useState(false);

  const fee = Math.round(selectedGift.coins * PLATFORM_FEE_RATE);
  const totalCost = selectedGift.coins + fee;
  const canSend = coinBalance >= totalCost;

  function handleSend() {
    if (!canSend) {
      setTab("buy");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(totalCost);
    addEarning(parseFloat((selectedGift.coins * 0.1).toFixed(2)));
    setSent(true);
  }

  async function handleBuyPayPal(pkg: typeof COIN_PACKAGES[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url =
      "https://www.paypal.com/cgi-bin/webscr?" +
      "cmd=_xclick&business=dumitru8830%40gmail.com" +
      `&amount=${pkg.eur}.00&currency_code=EUR` +
      `&item_name=Spark+${pkg.coins}+Coins`;
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
    addCoins(pkg.coins);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Coins added! 🎉", `${pkg.coins} coins have been added to your wallet.`);
    setTab("send");
  }

  function handleClose() {
    setSent(false);
    setTab("send");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {sent ? "Gift Sent! 🎉" : `Send a Gift to ${recipientName}`}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {sent ? (
            /* ── Success ── */
            <View style={styles.successBlock}>
              <Text style={styles.successEmoji}>{selectedGift.emoji}</Text>
              <Text style={[styles.successLabel, { color: colors.foreground }]}>
                {selectedGift.label} sent to {recipientName}!
              </Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                They received {selectedGift.coins} coins worth of gifts.
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: "#FF3366" }]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Coin balance */}
              <View style={[styles.balanceRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={styles.coinIcon}>🪙</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Your coin balance</Text>
                  <Text style={[styles.balanceValue, { color: colors.foreground }]}>{coinBalance} coins</Text>
                </View>
                <TouchableOpacity
                  style={[styles.topUpBtn, { borderColor: "#FF3366" }]}
                  onPress={() => setTab("buy")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.topUpText, { color: "#FF3366" }]}>+ Top up</Text>
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={[styles.tabRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {(["send", "buy"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tabBtn, tab === t && { backgroundColor: "#FF3366" }]}
                    onPress={() => { Haptics.selectionAsync(); setTab(t); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabLabel, { color: tab === t ? "#fff" : colors.mutedForeground }]}>
                      {t === "send" ? "🎁  Send Gift" : "🪙  Buy Coins"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tab === "send" ? (
                <>
                  {/* Gift picker */}
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Choose a gift</Text>
                  <View style={styles.giftGrid}>
                    {GIFT_OPTIONS.map((g) => {
                      const active = selectedGift.coins === g.coins;
                      return (
                        <TouchableOpacity
                          key={g.coins}
                          style={[
                            styles.giftCard,
                            { backgroundColor: colors.background, borderColor: active ? "#FF3366" : colors.border },
                          ]}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedGift(g); }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.giftEmoji}>{g.emoji}</Text>
                          <Text style={[styles.giftName, { color: colors.foreground }]}>{g.label}</Text>
                          <Text style={[styles.giftCoins, { color: active ? "#FF3366" : colors.mutedForeground }]}>
                            {g.coins} coins
                          </Text>
                          {active && (
                            <View style={styles.checkBadge}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Fee breakdown */}
                  <View style={[styles.feeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>Gift amount</Text>
                      <Text style={[styles.feeValue, { color: colors.foreground }]}>{selectedGift.coins} coins</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>Platform fee (10% from you)</Text>
                      <Text style={[styles.feeValue, { color: "#EF4444" }]}>+{fee} coins</Text>
                    </View>
                    <View style={[styles.feeDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabelBold, { color: colors.foreground }]}>You pay total</Text>
                      <Text style={[styles.feeValueBold, { color: "#FF3366" }]}>{totalCost} coins</Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>{recipientName} receives</Text>
                      <Text style={[styles.feeValue, { color: "#22C55E" }]}>{selectedGift.coins} coins</Text>
                    </View>
                    <Text style={[styles.feeNote, { color: colors.mutedForeground }]}>
                      Note: {recipientName} pays an additional 10% platform fee when they withdraw their coins.
                    </Text>
                  </View>

                  {!canSend && (
                    <View style={[styles.insufficientRow, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
                      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                      <Text style={[styles.insufficientText, { color: "#EF4444" }]}>
                        Not enough coins. Need {totalCost - coinBalance} more. Buy coins below.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: canSend ? "#FF3366" : colors.muted }]}
                    onPress={handleSend}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.sendBtnIcon}>{selectedGift.emoji}</Text>
                    <Text style={styles.sendBtnText}>
                      {canSend ? `Send ${selectedGift.label} · ${totalCost} coins` : "Buy coins to send"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Buy coins */}
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Select a coin package</Text>
                  {COIN_PACKAGES.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.coins}
                      style={[
                        styles.pkgRow,
                        {
                          backgroundColor: pkg.highlight ? "#FF336612" : colors.background,
                          borderColor: pkg.highlight ? "#FF3366" : colors.border,
                        },
                      ]}
                      onPress={() => handleBuyPayPal(pkg)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.pkgIcon}>{pkg.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pkgLabel, { color: colors.foreground }]}>
                          {pkg.coins} coins{pkg.highlight ? "  ⭐ Popular" : ""}
                        </Text>
                        <Text style={[styles.pkgSub, { color: colors.mutedForeground }]}>
                          €{pkg.eur}.00 · via PayPal
                        </Text>
                      </View>
                      <LinearGradient
                        colors={["#FF3366", "#FF6B35"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.pkgBuyBtn}
                      >
                        <Text style={styles.pkgBuyText}>€{pkg.eur}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                  <Text style={[styles.buyNote, { color: colors.mutedForeground }]}>
                    Coins are added instantly after payment. 1 coin = €0.10
                  </Text>
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
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 16,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, marginRight: 8 },

  /* Balance */
  balanceRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14,
  },
  coinIcon: { fontSize: 28 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  balanceValue: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  topUpBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  topUpText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* Tabs */
  tabRow: {
    flexDirection: "row", borderRadius: 12, borderWidth: 1,
    overflow: "hidden", marginBottom: 18,
  },
  tabBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 11,
  },
  tabLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12,
  },

  /* Gift grid */
  giftGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16,
  },
  giftCard: {
    width: "47%", padding: 14, borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", gap: 4, position: "relative",
  },
  giftEmoji: { fontSize: 36 },
  giftName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  giftCoins: { fontSize: 12, fontFamily: "Inter_400Regular" },
  checkBadge: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#FF3366",
    alignItems: "center", justifyContent: "center",
  },

  /* Fee box */
  feeBox: {
    borderWidth: 1, borderRadius: 14, padding: 14, gap: 8, marginBottom: 14,
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, marginRight: 8 },
  feeValue: { fontSize: 13, fontFamily: "Inter_500Medium" },
  feeLabelBold: { fontSize: 14, fontFamily: "Inter_700Bold" },
  feeValueBold: { fontSize: 15, fontFamily: "Inter_700Bold" },
  feeDivider: { height: 1, marginVertical: 4 },
  feeNote: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    lineHeight: 16, marginTop: 4,
  },

  /* Insufficient */
  insufficientRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12,
  },
  insufficientText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  /* Send btn */
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 28,
  },
  sendBtnIcon: { fontSize: 20 },
  sendBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  /* Buy packages */
  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10,
  },
  pkgIcon: { fontSize: 28 },
  pkgLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  pkgSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pkgBuyBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  pkgBuyText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  buyNote: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 18, marginTop: 4,
  },

  /* Success */
  successBlock: { alignItems: "center", paddingVertical: 32, gap: 12 },
  successEmoji: { fontSize: 72 },
  successLabel: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneBtn: { paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28, marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_COACHES } from "@/data/coaches";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { buyTokensWithStripe, buyTokensWithPayPal } from "@/config/payments";

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
];

const ST_PACKAGES = [
  { tokens: 500,  eur: 50,  icon: "💰", label: "Starter"  },
  { tokens: 1000, eur: 100, icon: "⭐", label: "Popular", highlight: true },
  { tokens: 2000, eur: 200, icon: "🔥", label: "Value"    },
  { tokens: 5000, eur: 500, icon: "💎", label: "Premium"  },
];

function getDaysFromToday(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      date: d,
      dayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum:   d.getDate(),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });
}

export default function BookScreen() {
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { coinBalance, addCoins, spendCoins } = useApp();

  const coach   = useMemo(() => MOCK_COACHES.find((c) => c.id === id), [id]);
  const session = useMemo(() => coach?.sessions.find((s) => s.id === sessionId), [coach, sessionId]);

  const days = useMemo(() => getDaysFromToday(10), []);
  const [selectedDay,  setSelectedDay]  = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showBuyST,    setShowBuyST]    = useState(false);
  const [booked,       setBooked]       = useState(false);

  const totalST       = session ? session.tokenPrice : 0;
  const platformFee   = session ? Math.round(session.tokenPrice * 0.10) : 0;
  const coachReceives = totalST - platformFee;
  const canPay        = coinBalance >= totalST;
  const needMore      = totalST - coinBalance;

  function handlePay() {
    if (!canPay) { setShowBuyST(true); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(totalST);
    setBooked(true);
  }

  async function completeBuyST(pkg: typeof ST_PACKAGES[0], method: "stripe" | "paypal") {
    try {
      const paid = method === "stripe"
        ? await buyTokensWithStripe(pkg.tokens, pkg.eur)
        : await buyTokensWithPayPal(pkg.tokens, pkg.eur);
      if (!paid) return;
      addCoins(pkg.tokens);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Spark Tokens added! 🔥", `${pkg.tokens} ST are now in your wallet.`);
      setShowBuyST(false);
    } catch (err: any) {
      Alert.alert("Payment failed", err.message ?? "Something went wrong. Try again.");
    }
  }

  function handleBuyST(pkg: typeof ST_PACKAGES[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // React Native's Alert doesn't support custom multi-button choices on
    // web, so the "choose a payment method" dialog never actually shows
    // there — go straight to Stripe checkout on web instead of a picker.
    if (Platform.OS === "web") {
      completeBuyST(pkg, "stripe");
      return;
    }
    Alert.alert(
      `Buy ${pkg.tokens} ST · €${pkg.eur}`,
      "Choose a payment method",
      [
        { text: "Card (Stripe)", onPress: () => completeBuyST(pkg, "stripe") },
        { text: "PayPal", onPress: () => completeBuyST(pkg, "paypal") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }

  if (!coach || !session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Book Session</Text>
        {/* Wallet mini-badge */}
        <View style={[styles.walletBadge, { backgroundColor: "#FF336615", borderColor: "#FF336640" }]}>
          <Text style={styles.walletBadgeText}>🔥 {coinBalance} ST</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Coach summary */}
        <View style={[styles.coachSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={coach.photo} style={styles.coachAvatar} contentFit="cover" />
          <View style={styles.coachSummaryInfo}>
            <Text style={[styles.coachSummaryName, { color: colors.foreground }]}>{coach.name}</Text>
            <Text style={[styles.coachSummaryTitle, { color: colors.primary }]}>{coach.title}</Text>
            <Text style={[styles.sessionSummary, { color: colors.mutedForeground }]}>
              {session.label} · {session.duration} min · video call
            </Text>
          </View>
        </View>

        {/* ST info banner */}
        <View style={[styles.stBanner, { backgroundColor: "#FF336610", borderColor: "#FF336630" }]}>
          <Text style={styles.stBannerIcon}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stBannerTitle, { color: colors.foreground }]}>Pay with Spark Tokens</Text>
            <Text style={[styles.stBannerSub, { color: colors.mutedForeground }]}>
              Your balance: {coinBalance} ST · This session: {totalST.toLocaleString()} ST
            </Text>
          </View>
          {!canPay && (
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => setShowBuyST(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={13} color="#FF3366" />
              <Text style={styles.topUpBtnText}>Top up</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pick a day */}
        <SectionHeader title="Select a Date" colors={colors} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPicker}>
          {days.map((d, i) => {
            const avail    = coach.availability.includes(d.dayShort);
            const selected = selectedDay === i;
            return (
              <TouchableOpacity
                key={i}
                disabled={!avail}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: selected ? colors.primary : avail ? colors.card : colors.muted,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: avail ? 1 : 0.45,
                  },
                ]}
                onPress={() => { setSelectedDay(i); setSelectedTime(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayBtnShort, { color: selected ? "#fff" : colors.mutedForeground }]}>{d.dayShort}</Text>
                <Text style={[styles.dayBtnNum,   { color: selected ? "#fff" : colors.foreground }]}>{d.dayNum}</Text>
                <Text style={[styles.dayBtnMonth, { color: selected ? "#ffffffbb" : colors.mutedForeground }]}>{d.monthShort}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pick a time */}
        <SectionHeader title="Select a Time" colors={colors} />
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((t) => {
            const sel = selectedTime === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timeBtn,
                  { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border },
                ]}
                onPress={() => setSelectedTime(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeBtnText, { color: sel ? "#fff" : colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price breakdown */}
        <SectionHeader title="Payment Breakdown" colors={colors} />
        <View style={[styles.priceBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <PriceRow label={session.label} value={`${totalST.toLocaleString()} ST`} colors={colors} bold accent />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PriceRow label="Coach receives" value={`${coachReceives.toLocaleString()} ST`} colors={colors} muted />
          <PriceRow label="Spark platform fee (10% from coach)" value={`${platformFee} ST`} colors={colors} muted />
        </View>
        <View style={[styles.userNote, { backgroundColor: "#22C55E10", borderColor: "#22C55E30" }]}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#22C55E" />
          <Text style={[styles.userNoteText, { color: colors.mutedForeground }]}>
            You pay exactly what the coach asks. The 10% platform fee comes from the coach's side — not from you.
          </Text>
        </View>

        {/* Not enough ST warning */}
        {!canPay && selectedTime && (
          <View style={[styles.warnBox, { backgroundColor: "#EF444412", borderColor: "#EF444430" }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={[styles.warnText, { color: "#EF4444" }]}>
              You need {needMore.toLocaleString()} more ST to book this session.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: selectedTime ? (canPay ? "#FF3366" : colors.muted) : colors.muted, opacity: selectedTime ? 1 : 0.55 }]}
          disabled={!selectedTime}
          onPress={() => setShowConfirm(true)}
          activeOpacity={0.85}
        >
          {selectedTime ? (
            canPay ? (
              <>
                <Text style={styles.payBtnFire}>🔥</Text>
                <Text style={styles.payBtnText}>Pay {totalST.toLocaleString()} ST — Confirm</Text>
              </>
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={styles.payBtnText}>Buy ST to Book · Need {needMore.toLocaleString()} more</Text>
              </>
            )
          ) : (
            <Text style={styles.payBtnText}>Select a time to continue</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Confirm modal ── */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            {booked ? (
              <View style={styles.successBox}>
                <View style={[styles.successIcon, { backgroundColor: "#22C55E22" }]}>
                  <Ionicons name="checkmark-circle" size={52} color="#22C55E" />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>Booking Confirmed!</Text>
                <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                  Your session with {coach.name} is booked for {days[selectedDay].dayShort}{" "}
                  {days[selectedDay].dayNum} {days[selectedDay].monthShort} at {selectedTime}.
                </Text>
                <View style={[styles.successST, { backgroundColor: "#FF336612", borderColor: "#FF336630" }]}>
                  <Text style={styles.successSTText}>🔥 {totalST.toLocaleString()} ST deducted from your wallet</Text>
                </View>
                <Text style={[styles.successNote, { color: colors.mutedForeground }]}>
                  You'll receive a video call link 15 minutes before your session.
                </Text>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={() => { setShowConfirm(false); router.replace("/(tabs)/coaches"); }}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Confirm Booking</Text>
                <View style={[styles.modalSummary, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.modalCoach,   { color: colors.foreground }]}>{coach.name}</Text>
                  <Text style={[styles.modalSession, { color: colors.mutedForeground }]}>
                    {session.label} · {days[selectedDay].dayShort} {days[selectedDay].dayNum} at {selectedTime}
                  </Text>
                  <View style={styles.modalSTRow}>
                    <Text style={styles.modalSTFire}>🔥</Text>
                    <Text style={[styles.modalSTAmount, { color: "#FF3366" }]}>{totalST.toLocaleString()} ST</Text>
                  </View>
                  <Text style={[styles.modalBalance, { color: colors.mutedForeground }]}>
                    Your balance after: {(coinBalance - totalST).toLocaleString()} ST
                  </Text>
                  <Text style={[styles.modalBalance, { color: colors.mutedForeground }]}>
                    Coach receives: {coachReceives.toLocaleString()} ST · Spark fee: {platformFee} ST
                  </Text>
                </View>

                {canPay ? (
                  <View style={[styles.stNote, { backgroundColor: "#22C55E10", borderColor: "#22C55E30" }]}>
                    <Ionicons name="shield-checkmark-outline" size={15} color="#22C55E" />
                    <Text style={[styles.stNoteText, { color: colors.mutedForeground }]}>
                      Spark Tokens deducted instantly from your wallet. Secure &amp; instant.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.stNote, { backgroundColor: "#EF444412", borderColor: "#EF444430" }]}>
                    <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                    <Text style={[styles.stNoteText, { color: "#EF4444" }]}>
                      Not enough ST. You need {needMore.toLocaleString()} more tokens.
                    </Text>
                  </View>
                )}

                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setShowConfirm(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  {canPay ? (
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={handlePay}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={["#FF3366", "#FF6B35"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.confirmGrad}
                      >
                        <Text style={styles.confirmBtnText}>Pay {totalST.toLocaleString()} ST →</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: "#6366F1" }]}
                      onPress={() => { setShowConfirm(false); setShowBuyST(true); }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.confirmBtnText}>Buy Spark Tokens</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Buy ST modal ── */}
      <Modal visible={showBuyST} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Buy Spark Tokens 🔥</Text>
            <Text style={[styles.buySub, { color: colors.mutedForeground }]}>
              You need {needMore > 0 ? `${needMore.toLocaleString()} more ST` : "ST"} to book this session.
              {"\n"}Pay by card (Stripe) or PayPal — tokens added instantly.
            </Text>

            {ST_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.tokens}
                style={[
                  styles.pkgRow,
                  {
                    backgroundColor: pkg.highlight ? "#FF336612" : colors.background,
                    borderColor: pkg.highlight ? "#FF3366" : colors.border,
                  },
                ]}
                onPress={() => handleBuyST(pkg)}
                activeOpacity={0.85}
              >
                <Text style={styles.pkgIcon}>{pkg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pkgTokens, { color: colors.foreground }]}>
                    {pkg.tokens.toLocaleString()} ST
                    {pkg.highlight ? <Text style={styles.pkgPopular}>  ⭐ Popular</Text> : null}
                  </Text>
                  <Text style={[styles.pkgSub, { color: colors.mutedForeground }]}>{pkg.label}</Text>
                </View>
                <LinearGradient
                  colors={["#FF3366", "#FF6B35"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.pkgBtn}
                >
                  <Text style={styles.pkgBtnText}>€{pkg.eur}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.closeBuyBtn, { borderColor: colors.border }]}
              onPress={() => setShowBuyST(false)}
            >
              <Text style={[styles.closeBuyText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>;
}

function PriceRow({ label, value, colors, muted, bold, accent }: {
  label: string; value: string; colors: any; muted?: boolean; bold?: boolean; accent?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceRowLabel, {
        color: muted ? colors.mutedForeground : colors.foreground,
        fontFamily: bold ? "Inter_700Bold" : "Inter_400Regular",
      }]}>{label}</Text>
      <Text style={[styles.priceRowValue, {
        color: accent ? "#FF3366" : muted ? colors.mutedForeground : colors.foreground,
        fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold",
      }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  walletBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  walletBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FF3366" },

  stBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 14,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  stBannerIcon: { fontSize: 24 },
  stBannerTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  stBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  topUpBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#FF3366",
  },
  topUpBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF3366" },

  coachSummary: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginTop: 16, padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  coachAvatar: { width: 56, height: 56, borderRadius: 28 },
  coachSummaryInfo: { flex: 1, gap: 2 },
  coachSummaryName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  coachSummaryTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sessionSummary: { fontSize: 12, fontFamily: "Inter_400Regular" },

  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginLeft: 16, marginTop: 24, marginBottom: 10 },
  dayPicker: { paddingHorizontal: 16, gap: 8 },
  dayBtn: {
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, minWidth: 58, gap: 2,
  },
  dayBtnShort: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dayBtnNum:   { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  dayBtnMonth: { fontSize: 10, fontFamily: "Inter_400Regular" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8 },
  timeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  timeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },

  priceBox: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceRowLabel: { fontSize: 14 },
  priceRowValue: { fontSize: 14 },
  divider: { height: 1 },

  userNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginHorizontal: 16, marginTop: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  userNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  warnBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 12,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  warnText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 28,
  },
  payBtnFire: { fontSize: 20 },
  payBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },

  /* Modals */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  modalSummary: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4, alignItems: "center" },
  modalCoach:   { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalSession: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modalSTRow:   { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  modalSTFire:  { fontSize: 24 },
  modalSTAmount:{ fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalBalance: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  stNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modalBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 22,
    borderWidth: 1.5, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confirmBtn: { flex: 2, borderRadius: 22, overflow: "hidden" },
  confirmGrad: { paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  confirmBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },

  successBox: { alignItems: "center", gap: 12, paddingVertical: 8 },
  successIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  successSub:   { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  successST: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  successSTText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FF3366" },
  successNote:  { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  doneBtn: { marginTop: 8, paddingHorizontal: 40, paddingVertical: 13, borderRadius: 26 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },

  /* Buy ST sheet */
  buySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderRadius: 16, padding: 14,
  },
  pkgIcon: { fontSize: 26 },
  pkgTokens: { fontSize: 15, fontFamily: "Inter_700Bold" },
  pkgPopular: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#FF3366" },
  pkgSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pkgBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pkgBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  closeBuyBtn: { paddingVertical: 13, borderRadius: 22, borderWidth: 1.5, alignItems: "center" },
  closeBuyText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

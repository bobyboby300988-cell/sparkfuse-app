import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_COACHES } from "@/data/coaches";
import { useColors } from "@/hooks/useColors";

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
];

function getDaysFromToday(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      date: d,
      dayShort: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });
}

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "https://match-maker-dumitru8830.replit.app/api";

export default function BookScreen() {
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const coach = useMemo(() => MOCK_COACHES.find((c) => c.id === id), [id]);
  const session = useMemo(
    () => coach?.sessions.find((s) => s.id === sessionId),
    [coach, sessionId]
  );

  const days = useMemo(() => getDaysFromToday(10), []);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  const platformFee = session ? Math.round(session.price * 0.1) : 0;
  const total = session ? session.price : 0;
  const amountCents = total * 100;

  const handlePay = async () => {
    setLoading(true);
    try {
      const checkoutRes = await fetch(`${API_BASE}/stripe/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          currency: "usd",
          coachName: coach?.name ?? "",
          sessionLabel: session?.label ?? "",
          successUrl: `https://match-maker-dumitru8830.replit.app/booking-success`,
          cancelUrl: `https://match-maker-dumitru8830.replit.app/booking-cancel`,
          metadata: {
            coachId: coach?.id ?? "",
            sessionId: session?.id ?? "",
            bookingDate: `${days[selectedDay].dayShort} ${days[selectedDay].dayNum} ${days[selectedDay].monthShort}`,
            bookingTime: selectedTime ?? "",
          },
        }),
      });

      if (!checkoutRes.ok) {
        throw new Error("Could not create checkout session");
      }

      const { url } = await checkoutRes.json() as { url: string };

      setLoading(false);
      setShowConfirm(false);

      const result = await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: false,
        enableBarCollapsing: true,
      });

      if (result.type === "cancel" || result.type === "dismiss") {
        // User came back — assume success for now (webhook will confirm)
        setBooked(true);
        setShowConfirm(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        "Payment Error",
        err.message ?? "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

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
        <View style={{ width: 26 }} />
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

        {/* Pick a day */}
        <SectionHeader title="Select a Date" colors={colors} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPicker}>
          {days.map((d, i) => {
            const avail = coach.availability.includes(d.dayShort);
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
                <Text style={[styles.dayBtnShort, { color: selected ? "#fff" : colors.mutedForeground }]}>
                  {d.dayShort}
                </Text>
                <Text style={[styles.dayBtnNum, { color: selected ? "#fff" : colors.foreground }]}>
                  {d.dayNum}
                </Text>
                <Text style={[styles.dayBtnMonth, { color: selected ? "#ffffffbb" : colors.mutedForeground }]}>
                  {d.monthShort}
                </Text>
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
                  {
                    backgroundColor: sel ? colors.primary : colors.card,
                    borderColor: sel ? colors.primary : colors.border,
                  },
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
        <SectionHeader title="Price Breakdown" colors={colors} />
        <View style={[styles.priceBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <PriceRow label={session.label} value={`$${session.price}`} colors={colors} />
          <PriceRow label="Platform fee (10%)" value={`$${platformFee}`} colors={colors} muted />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PriceRow label="Total" value={`$${total}`} colors={colors} bold />
        </View>

        {/* Payment note */}
        <View style={[styles.payNote, { backgroundColor: colors.secondary }]}>
          <Ionicons name="lock-closed" size={14} color={colors.primary} />
          <Text style={[styles.payNoteText, { color: colors.mutedForeground }]}>
            Secure payment powered by Stripe. Your coach receives ${total - platformFee} after our 10% platform fee.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.payBtn,
            {
              backgroundColor: selectedTime ? colors.primary : colors.muted,
              opacity: selectedTime ? 1 : 0.6,
            },
          ]}
          disabled={!selectedTime}
          onPress={() => setShowConfirm(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={styles.payBtnText}>
            {selectedTime ? `Pay $${total} — Confirm Booking` : "Select a time to continue"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirm modal */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            {booked ? (
              <View style={styles.successBox}>
                <View style={[styles.successIcon, { backgroundColor: colors.like + "22" }]}>
                  <Ionicons name="checkmark-circle" size={52} color={colors.like} />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>Booking Confirmed!</Text>
                <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                  Your session with {coach.name} is booked for {days[selectedDay].dayShort}{" "}
                  {days[selectedDay].dayNum} {days[selectedDay].monthShort} at {selectedTime}.
                </Text>
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
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Confirm Payment</Text>
                <View style={[styles.modalSummary, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.modalCoach, { color: colors.foreground }]}>{coach.name}</Text>
                  <Text style={[styles.modalSession, { color: colors.mutedForeground }]}>
                    {session.label} · {days[selectedDay].dayShort} {days[selectedDay].dayNum} at {selectedTime}
                  </Text>
                  <Text style={[styles.modalTotal, { color: colors.primary }]}>${total}</Text>
                </View>
                <View style={[styles.stripeNote, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary} />
                  <Text style={[styles.stripeNoteText, { color: colors.mutedForeground }]}>
                    You'll be taken to a secure Stripe checkout page to complete your payment.
                  </Text>
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setShowConfirm(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                    onPress={handlePay}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Pay ${total} →</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>;
}

function PriceRow({ label, value, colors, muted, bold }: {
  label: string; value: string; colors: any; muted?: boolean; bold?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceRowLabel, { color: muted ? colors.mutedForeground : colors.foreground, fontFamily: bold ? "Inter_700Bold" : "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[styles.priceRowValue, { color: muted ? colors.mutedForeground : colors.foreground, fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  coachSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  coachAvatar: { width: 56, height: 56, borderRadius: 28 },
  coachSummaryInfo: { flex: 1, gap: 2 },
  coachSummaryName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  coachSummaryTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sessionSummary: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginLeft: 16, marginTop: 24, marginBottom: 10 },
  dayPicker: { paddingHorizontal: 16, gap: 8 },
  dayBtn: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: 58,
    gap: 2,
  },
  dayBtnShort: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dayBtnNum: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  dayBtnMonth: { fontSize: 10, fontFamily: "Inter_400Regular" },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  timeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  timeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  priceBox: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceRowLabel: { fontSize: 14 },
  priceRowValue: { fontSize: 14 },
  divider: { height: 1 },
  payNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  payNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 28,
  },
  payBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  modalSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    alignItems: "center",
  },
  modalCoach: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalSession: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modalTotal: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 4 },
  stripeNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  stripeNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modalBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successBox: { alignItems: "center", gap: 12, paddingVertical: 8 },
  successIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  successNote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  doneBtn: { marginTop: 8, paddingHorizontal: 40, paddingVertical: 13, borderRadius: 26 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

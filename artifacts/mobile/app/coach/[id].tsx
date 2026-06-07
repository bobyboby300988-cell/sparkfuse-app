import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_COACHES, SessionType } from "@/data/coaches";
import { useColors } from "@/hooks/useColors";

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= Math.round(rating) ? "star" : "star-outline"} size={14} color="#F59E0B" />
      ))}
      <Text style={{ color: "#F59E0B", fontFamily: "Inter_600SemiBold", fontSize: 14, marginLeft: 4 }}>
        {rating.toFixed(1)}
      </Text>
      <Text style={{ color: "#9A93B3", fontFamily: "Inter_400Regular", fontSize: 13, marginLeft: 4 }}>
        ({count} reviews)
      </Text>
    </View>
  );
}

export default function CoachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const coach = useMemo(() => MOCK_COACHES.find((c) => c.id === id), [id]);
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(
    coach?.sessions[0] ?? null
  );

  if (!coach) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Coach not found</Text>
      </View>
    );
  }

  const commission = selectedSession ? Math.round(selectedSession.price * 0.1) : 0;
  const coachEarns = selectedSession ? selectedSession.price - commission : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={coach.photo} style={styles.heroImage} contentFit="cover" />
          <View style={[styles.heroOverlay, { backgroundColor: colors.background + "CC" }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.card }]}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {/* Name & title */}
          <Text style={[styles.name, { color: colors.foreground }]}>{coach.name}</Text>
          <Text style={[styles.title, { color: colors.primary }]}>{coach.title}</Text>
          <StarRow rating={coach.rating} count={coach.reviewCount} />

          {/* Stats row */}
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StatBox value={`${coach.yearsExperience}y`} label="Experience" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatBox value={coach.totalClients.toString()} label="Clients" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatBox value={coach.location.split(",")[0]} label="Location" colors={colors} />
          </View>

          {/* Bio */}
          <Section title="About" colors={colors}>
            <Text style={[styles.bio, { color: colors.mutedForeground }]}>{coach.bio}</Text>
          </Section>

          {/* Specialties */}
          <Section title="Specialties" colors={colors}>
            <View style={styles.tags}>
              {coach.specialties.map((s) => (
                <View key={s} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                  <Text style={[styles.tagText, { color: colors.foreground }]}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Availability */}
          <Section title="Available Days" colors={colors}>
            <View style={styles.days}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
                const available = coach.availability.includes(d);
                return (
                  <View
                    key={d}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: available ? colors.primary + "22" : colors.card,
                        borderColor: available ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: available ? colors.primary : colors.mutedForeground },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>

          {/* Session types */}
          <Section title="Choose a Session" colors={colors}>
            <View style={styles.sessions}>
              {coach.sessions.map((s) => {
                const selected = selectedSession?.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: selected ? colors.primary + "18" : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSession(s)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.sessionLabel, { color: colors.foreground }]}>{s.label}</Text>
                        <Text style={[styles.sessionDuration, { color: colors.mutedForeground }]}>
                          {s.duration} min · video call
                        </Text>
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={[styles.sessionPrice, { color: colors.foreground }]}>${s.price}</Text>
                        {selected && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>
        </View>
      </ScrollView>

      {/* Sticky booking footer */}
      {selectedSession && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.footerLeft}>
            <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>
              {selectedSession.label} · {selectedSession.duration} min
            </Text>
            <Text style={[styles.footerPrice, { color: colors.foreground }]}>
              ${selectedSession.price}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/book/[id]",
                params: { id: coach.id, sessionId: selectedSession.id },
              })
            }
          >
            <Ionicons name="calendar" size={18} color="#fff" />
            <Text style={styles.bookBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function StatBox({ value, label, colors }: { value: string; label: string; colors: any }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { position: "relative", height: 280 },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  name: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold" },
  title: { fontSize: 15, fontFamily: "Inter_500Medium", marginBottom: 6 },
  starRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 8,
  },
  statBox: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, marginVertical: 4 },
  section: { marginTop: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bio: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  days: { flexDirection: "row", gap: 8 },
  dayChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  sessions: { gap: 10 },
  sessionCard: { borderRadius: 14, borderWidth: 1.5, padding: 14 },
  sessionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionInfo: { gap: 3 },
  sessionLabel: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sessionDuration: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sessionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sessionPrice: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: { gap: 2 },
  footerLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footerPrice: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 26,
  },
  bookBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

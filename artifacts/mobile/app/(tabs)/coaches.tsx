import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_COACHES } from "@/data/coaches";
import { useColors } from "@/hooks/useColors";

const FILTERS = ["All", "Confidence", "Online dating", "Healing", "Mindset work", "Conversation skills"];

function StarRating({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={11}
          color="#F59E0B"
        />
      ))}
      <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export default function CoachesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = MOCK_COACHES.filter(
    (c) =>
      activeFilter === "All" ||
      c.specialties.some((s) => s.toLowerCase() === activeFilter.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Dating Coaches</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Book a 1-on-1 session with an expert
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Verified</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chip,
              {
                backgroundColor: activeFilter === f ? colors.primary : colors.card,
                borderColor: activeFilter === f ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                { color: activeFilter === f ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Coach cards */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: coach }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.88}
            onPress={() => router.push({ pathname: "/coach/[id]", params: { id: coach.id } })}
          >
            <View style={styles.cardTop}>
              <Image source={coach.photo} style={styles.avatar} contentFit="cover" />
              <View style={styles.cardInfo}>
                <Text style={[styles.coachName, { color: colors.foreground }]}>{coach.name}</Text>
                <Text style={[styles.coachTitle, { color: colors.primary }]}>{coach.title}</Text>
                <StarRating rating={coach.rating} />
                <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
                  {coach.reviewCount} reviews · {coach.yearsExperience}y exp
                </Text>
              </View>
            </View>

            <Text style={[styles.bio, { color: colors.mutedForeground }]} numberOfLines={2}>
              {coach.bio}
            </Text>

            {/* Specialties */}
            <View style={styles.tags}>
              {coach.specialties.slice(0, 3).map((s) => (
                <View key={s} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.foreground }]}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Price + CTA */}
            <View style={styles.cardBottom}>
              <View>
                <Text style={[styles.fromText, { color: colors.mutedForeground }]}>From</Text>
                <Text style={[styles.price, { color: colors.foreground }]}>
                  ${Math.min(...coach.sessions.map((s) => s.price))}
                  <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}> / session</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: "/coach/[id]", params: { id: coach.id } })}
                activeOpacity={0.8}
              >
                <Text style={styles.bookBtnText}>Book</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: { flexDirection: "row", gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  cardInfo: { flex: 1, gap: 3 },
  coachName: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  coachTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stars: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  ratingText: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 4 },
  reviewCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bio: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fromText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  price: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  priceUnit: { fontSize: 13, fontWeight: "400", fontFamily: "Inter_400Regular" },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  bookBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

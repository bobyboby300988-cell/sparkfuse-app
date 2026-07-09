import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateSwipe, useGetFeed } from "@workspace/api-client-react";
import { MatchModal } from "@/components/MatchModal";
import { SwipeCard, type SwipeProfile } from "@/components/SwipeCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useLocation } from "@/hooks/useLocation";
import { getPhotoUrl } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addMatch } = useApp();
  const [matchedProfile, setMatchedProfile] = useState<SwipeProfile | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  useLocation();

  const { data, isLoading, refetch } = useGetFeed();
  const createSwipe = useCreateSwipe();

  const profiles: SwipeProfile[] = useMemo(() => {
    const list = data?.profiles ?? [];
    return list.map((p) => ({
      id: p.userId,
      name: p.name,
      age: p.age,
      bio: p.bio,
      location: "",
      interests: [],
      photo: getPhotoUrl(p.photoUrl)
        ? { uri: getPhotoUrl(p.photoUrl) as string }
        : require("../../assets/images/p1.png"),
    }));
  }, [data]);

  const visible = useMemo(
    () => profiles.filter((p) => !dismissed.includes(p.id)).slice(0, 2),
    [profiles, dismissed]
  );

  const swipe = async (targetUserId: string, direction: "like" | "pass" | "superlike") => {
    setDismissed((prev) => [...prev, targetUserId]);
    try {
      const res = await createSwipe.mutateAsync({
        data: { targetUserId, direction },
      });
      if (res?.matched) {
        const profile = profiles.find((p) => p.id === targetUserId) ?? null;
        addMatch(targetUserId);
        setMatchedProfile(profile);
        setMatchModalVisible(true);
      }
    } catch {
      // ignore swipe errors, profile stays dismissed locally
    }
    if (visible.length <= 2) {
      refetch();
    }
  };

  const handleSwipeRight = () => {
    if (visible.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipe(visible[0].id, "like");
  };

  const handleSwipeLeft = () => {
    if (visible.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipe(visible[0].id, "pass");
  };

  const handleSuperLike = () => {
    if (visible.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    swipe(visible[0].id, "superlike");
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.logoRow}>
          <Ionicons name="flame" size={26} color={colors.primary} />
          <View>
            <Text style={[styles.logoText, { color: colors.foreground }]}>SparkFuse</Text>
            <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
              Find your person
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => {}}
        >
          <Ionicons name="options-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              You've seen everyone
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Check back later for new profiles nearby
            </Text>
          </View>
        ) : (
          [...visible]
            .map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                isTop={index === 0}
                cardIndex={index}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onSwipeSuperLike={handleSuperLike}
              />
            ))
            .reverse()
        )}
      </View>

      {/* Action buttons */}
      {visible.length > 0 && (
        <View style={[styles.actions, { paddingBottom: bottomPadding + 96 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.smallBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSwipeLeft}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color={colors.nope} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.largeBtn, { backgroundColor: colors.primary }]}
            onPress={handleSwipeRight}
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.smallBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSuperLike}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={24} color={colors.superLike} />
          </TouchableOpacity>
        </View>
      )}

      {visible.length > 0 && (
        <View style={styles.swipeHint}>
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Swipe or use buttons to discover
          </Text>
        </View>
      )}

      <MatchModal
        visible={matchModalVisible}
        profile={matchedProfile}
        onMessage={() => {
          setMatchModalVisible(false);
          if (matchedProfile) {
            router.push({ pathname: "/chat/[id]", params: { id: matchedProfile.id } });
          }
        }}
        onKeepSwiping={() => {
          setMatchModalVisible(false);
          setMatchedProfile(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  modeHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingTop: 16,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  smallBtn: { width: 58, height: 58 },
  largeBtn: { width: 72, height: 72, borderWidth: 0 },
  swipeHint: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

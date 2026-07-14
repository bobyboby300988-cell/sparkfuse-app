import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateSwipe, useGetFeed, useGetMyProfile, useUpsertMyProfile } from "@workspace/api-client-react";
import BrandLogo from "@/components/BrandLogo";
import { MatchModal } from "@/components/MatchModal";
import { SwipeCard, type SwipeProfile } from "@/components/SwipeCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useLocation } from "@/hooks/useLocation";
import { getPhotoUrl } from "@/lib/api";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DISTANCE_OPTIONS: { label: string; km: number | null }[] = [
  { label: "25 km",  km: 25  },
  { label: "50 km",  km: 50  },
  { label: "100 km", km: 100 },
  { label: "Anywhere", km: null },
];

const GENDER_OPTIONS: { label: string; value: string }[] = [
  { label: "Everyone", value: "everyone" },
  { label: "Women",    value: "women"    },
  { label: "Men",      value: "men"      },
];

const FILTER_STORAGE_KEY = "discover_filters_v1";

/* ── Filter bottom sheet ── */
function FilterSheet({
  visible,
  onClose,
  seeking,
  maxKm,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  seeking: string;
  maxKm: number | null;
  onApply: (seeking: string, maxKm: number | null) => void;
}) {
  const colors = useColors();
  const [localSeeking, setLocalSeeking] = useState(seeking);
  const [localKm, setLocalKm]           = useState(maxKm);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setLocalSeeking(seeking);
      setLocalKm(maxKm);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.filterOverlay} onPress={onClose} />
      <Animated.View style={[styles.filterSheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={[styles.filterHandle, { backgroundColor: colors.border }]} />

        <Text style={[styles.filterTitle, { color: colors.foreground }]}>Filters</Text>

        {/* Looking for */}
        <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>I'M LOOKING FOR</Text>
        <View style={styles.filterRow}>
          {GENDER_OPTIONS.map((g) => {
            const active = localSeeking === g.value;
            return (
              <Pressable
                key={g.value}
                onPress={() => setLocalSeeking(g.value)}
                style={[styles.filterChip, {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.filterChipText, { color: active ? "#fff" : colors.foreground }]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Distance */}
        <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>MAX DISTANCE</Text>
        <View style={styles.filterRow}>
          {DISTANCE_OPTIONS.map((d) => {
            const active = localKm === d.km;
            return (
              <Pressable
                key={String(d.km)}
                onPress={() => setLocalKm(d.km)}
                style={[styles.filterChip, {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.filterChipText, { color: active ? "#fff" : colors.foreground }]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Apply */}
        <Pressable
          onPress={() => { onApply(localSeeking, localKm); onClose(); }}
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addMatch } = useApp();
  const [matchedProfile, setMatchedProfile] = useState<SwipeProfile | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { location } = useLocation();
  const { data: myProfileData } = useGetMyProfile();
  const upsertMyProfile = useUpsertMyProfile();
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterSeeking, setFilterSeeking] = useState("everyone");
  const [filterMaxKm, setFilterMaxKm] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetFeed();
  const createSwipe = useCreateSwipe();

  // Load saved filters on mount
  useEffect(() => {
    AsyncStorage.getItem(FILTER_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.seeking) setFilterSeeking(saved.seeking);
        if ("maxKm" in saved) setFilterMaxKm(saved.maxKm);
      } catch {}
    });
  }, []);

  // Push location to profile if it changed
  useEffect(() => {
    if (!location || !myProfileData?.profile) return;
    const { latitude, longitude, name, age, bio, seeking, photoUrl } = myProfileData.profile;
    const moved =
      latitude == null ||
      longitude == null ||
      Math.abs(latitude - location.latitude) > 0.01 ||
      Math.abs(longitude - location.longitude) > 0.01;
    if (!moved) return;
    upsertMyProfile.mutate({
      data: { name, age, bio, seeking, photoUrl, latitude: location.latitude, longitude: location.longitude },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, myProfileData?.profile]);

  const handleApplyFilters = async (seeking: string, maxKm: number | null) => {
    setFilterSeeking(seeking);
    setFilterMaxKm(maxKm);
    await AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ seeking, maxKm }));

    // Also save seeking preference to profile if changed
    if (myProfileData?.profile && seeking !== myProfileData.profile.seeking) {
      const p = myProfileData.profile;
      upsertMyProfile.mutate({
        data: { name: p.name, age: p.age, bio: p.bio, seeking, photoUrl: p.photoUrl,
          city: p.city ?? null, country: p.country ?? null,
          latitude: p.latitude ?? null, longitude: p.longitude ?? null },
      });
    }
  };

  const profiles: (SwipeProfile & { distanceKm: number | null })[] = useMemo(() => {
    const list = data?.profiles ?? [];
    return list
      .filter((p) => {
        // Distance filter
        if (filterMaxKm !== null && p.distanceKm != null && p.distanceKm > filterMaxKm) return false;
        // Seeking filter — filter by what the OTHER person is seeking:
        // if I want "women", show me profiles that say they're seeking "men" or "everyone"
        // (rough heuristic since we have no explicit gender field)
        if (filterSeeking !== "everyone" && p.seeking && p.seeking !== "everyone") {
          // If their seeking doesn't include what we represent, skip
          // We can't fully filter without a gender field — so we just filter
          // by whether their seeking overlaps with ours (symmetric check)
          const theyWant = p.seeking.toLowerCase();
          const iWant    = filterSeeking.toLowerCase();
          // Heuristic: if both have explicit preferences and they don't match, hide
          if (theyWant !== "everyone" && theyWant !== iWant) return false;
        }
        return true;
      })
      .map((p) => ({
        id: p.userId,
        name: p.name,
        age: p.age,
        bio: p.bio,
        location: "",
        interests: [],
        distanceKm: p.distanceKm ?? null,
        photo: getPhotoUrl(p.photoUrl)
          ? { uri: getPhotoUrl(p.photoUrl) as string }
          : require("../../assets/images/p1.png"),
      }));
  }, [data, filterMaxKm, filterSeeking]);

  const visible = useMemo(
    () => profiles.filter((p) => !dismissed.includes(p.id)).slice(0, 2),
    [profiles, dismissed]
  );

  const swipe = async (targetUserId: string, direction: "like" | "pass" | "superlike") => {
    setDismissed((prev) => [...prev, targetUserId]);
    try {
      const res = await createSwipe.mutateAsync({ data: { targetUserId, direction } });
      if (res?.matched) {
        const profile = profiles.find((p) => p.id === targetUserId) ?? null;
        addMatch(targetUserId);
        setMatchedProfile(profile);
        setMatchModalVisible(true);
      }
    } catch {
      // ignore swipe errors
    }
    if (visible.length <= 2) refetch();
  };

  const handleSwipeRight = () => { if (visible.length === 0) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); swipe(visible[0].id, "like"); };
  const handleSwipeLeft  = () => { if (visible.length === 0) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);  swipe(visible[0].id, "pass"); };
  const handleSuperLike  = () => { if (visible.length === 0) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);  swipe(visible[0].id, "superlike"); };

  const topPadding    = insets.top    + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const filtersActive = filterSeeking !== "everyone" || filterMaxKm !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.logoRow}>
          <BrandLogo size={24} color={colors.primary} />
          <View>
            <Text style={[styles.logoText, { color: colors.foreground }]}>SparkFuse</Text>
            <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
              {t("discover.findYourPerson")}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: filtersActive ? colors.primary : colors.card }]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={filtersActive ? "#fff" : colors.foreground} />
          {filtersActive && <View style={[styles.filterDot, { backgroundColor: "#fff" }]} />}
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {filtersActive && (
        <View style={styles.activeFilters}>
          {filterSeeking !== "everyone" && (
            <View style={[styles.activeChip, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
              <Text style={[styles.activeChipText, { color: colors.primary }]}>
                {GENDER_OPTIONS.find(g => g.value === filterSeeking)?.label}
              </Text>
            </View>
          )}
          {filterMaxKm !== null && (
            <View style={[styles.activeChip, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
              <Text style={[styles.activeChipText, { color: colors.primary }]}>≤ {filterMaxKm} km</Text>
            </View>
          )}
          <Pressable onPress={() => { setFilterSeeking("everyone"); setFilterMaxKm(null); AsyncStorage.removeItem(FILTER_STORAGE_KEY); }}>
            <Text style={[styles.activeChipText, { color: colors.mutedForeground }]}>Clear ✕</Text>
          </Pressable>
        </View>
      )}

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filtersActive ? "No matches for these filters" : t("discover.seenEveryone")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {filtersActive ? "Try adjusting or clearing your filters" : t("discover.checkBackLater")}
            </Text>
            {filtersActive && (
              <TouchableOpacity
                style={[styles.clearFiltersBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setFilterSeeking("everyone"); setFilterMaxKm(null); AsyncStorage.removeItem(FILTER_STORAGE_KEY); }}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Clear Filters</Text>
              </TouchableOpacity>
            )}
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
                distanceLabel={
                  profile.distanceKm == null
                    ? undefined
                    : profile.distanceKm < 1
                      ? t("discover.lessThan1km")
                      : t("discover.kmAway", { n: Math.round(profile.distanceKm) })
                }
              />
            ))
            .reverse()
        )}
      </View>

      {/* Action buttons */}
      {visible.length > 0 && (
        <View style={[styles.actions, { paddingBottom: bottomPadding + 96 }]}>
          <TouchableOpacity style={[styles.actionBtn, styles.smallBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSwipeLeft} activeOpacity={0.8}>
            <Ionicons name="close" size={26} color={colors.nope} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.largeBtn, { backgroundColor: colors.primary }]} onPress={handleSwipeRight} activeOpacity={0.85}>
            <Ionicons name="heart" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.smallBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSuperLike} activeOpacity={0.8}>
            <Ionicons name="star" size={24} color={colors.superLike} />
          </TouchableOpacity>
        </View>
      )}

      {visible.length > 0 && (
        <View style={styles.swipeHint}>
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>{t("discover.swipeHint")}</Text>
        </View>
      )}

      <MatchModal
        visible={matchModalVisible}
        profile={matchedProfile}
        onMessage={() => { setMatchModalVisible(false); if (matchedProfile) router.push({ pathname: "/chat/[id]", params: { id: matchedProfile.id } }); }}
        onKeepSwiping={() => { setMatchModalVisible(false); setMatchedProfile(null); }}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        seeking={filterSeeking}
        maxKm={filterMaxKm}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 4 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 24, fontWeight: "800", fontFamily: "Inter_700Bold", letterSpacing: -0.5, lineHeight: 26 },
  modeHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  filterDot: { position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 4 },
  activeFilters: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingBottom: 4, flexWrap: "wrap" },
  activeChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  activeChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  emptyState: { alignItems: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  clearFiltersBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, paddingTop: 16 },
  actionBtn: { alignItems: "center", justifyContent: "center", borderRadius: 50, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  smallBtn: { width: 58, height: 58 },
  largeBtn: { width: 72, height: 72, borderWidth: 0 },
  swipeHint: { position: "absolute", bottom: 80, left: 0, right: 0, alignItems: "center" },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Filter sheet
  filterOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  filterSheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  filterHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  filterTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 20 },
  filterLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5 },
  filterChipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  applyBtn: { borderRadius: 24, paddingVertical: 14, alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

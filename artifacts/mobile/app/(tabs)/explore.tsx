import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { ModeSelector } from "@/components/ModeSelector";
import { useColors } from "@/hooks/useColors";
import { useGetFeed, useCreateSwipe } from "@workspace/api-client-react";
import { getPhotoUrl } from "@/lib/api";
import { LockedMediaGrid } from "@/components/LockedMediaGrid";

const { width: W } = Dimensions.get("window");
const COLS = 3;
const TILE = (W - 4) / COLS;

const MODE_ACCENT: Record<string, string> = {
  dating:   "#FF3366",
  naughty:  "#FF6B35",
  business: "#0EA5E9",
  party:    "#A855F7",
  travel:   "#14B8A6",
  social:   "#F59E0B",
};

const GOLD = "#E8C468";
const PURPLE_DEEP = "#4B1F63";
const PURPLE_DARK = "#1A0B24";

function ExploreLiveBadge() {
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <LinearGradient
      colors={[PURPLE_DEEP, GOLD]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={styles.liveBadgeWrap}
    >
      <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </LinearGradient>
  );
}

type ServerProfile = {
  userId: string;
  name: string;
  age: number;
  bio?: string | null;
  photoUrl?: string | null;
  city?: string | null;
  country?: string | null;
  distanceKm?: number | null;
};

function ServerProfileModal({
  profile,
  visible,
  onClose,
}: {
  profile: ServerProfile | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const { addMatch, matches } = useApp();
  const createSwipe = useCreateSwipe();
  if (!profile) return null;
  const alreadyMatched = matches.some((m) => m.profileId === profile.userId);
  const photoUrl = getPhotoUrl(profile.photoUrl);

  const handleLike = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await createSwipe.mutateAsync({ data: { targetUserId: profile.userId, direction: "like" } });
    } catch { /* ignore — local match state still works */ }
    if (!alreadyMatched) addMatch(profile.userId);
    onClose();
    router.push({ pathname: "/chat/[id]", params: { id: profile.userId } });
  };

  const handleNope = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createSwipe.mutateAsync({ data: { targetUserId: profile.userId, direction: "pass" } });
    } catch { /* ignore */ }
    onClose();
  };

  const locationStr = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modalStyles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={modalStyles.photo} contentFit="cover" />
          ) : (
            <LinearGradient colors={["#FF3366", "#6B21A8"]} style={modalStyles.photo}>
              <Text style={{ fontSize: 60 }}>👤</Text>
            </LinearGradient>
          )}
          <View style={modalStyles.info}>
            <View style={modalStyles.nameRow}>
              <Text style={[modalStyles.name, { color: colors.foreground }]}>
                {profile.name}, {profile.age}
              </Text>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </View>
            {locationStr ? (
              <View style={modalStyles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                <Text style={[modalStyles.meta, { color: colors.mutedForeground }]}>{locationStr}</Text>
                {profile.distanceKm != null && (
                  <>
                    <Text style={[modalStyles.meta, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[modalStyles.meta, { color: colors.mutedForeground }]}>{profile.distanceKm} km away</Text>
                  </>
                )}
              </View>
            ) : null}
            {profile.bio ? (
              <Text style={[modalStyles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
            ) : (
              <Text style={[modalStyles.bio, { color: colors.mutedForeground }]}>No bio yet.</Text>
            )}
          </View>

          {/* ── Locked media grid ── */}
          <LockedMediaGrid userId={profile.userId} />
        </ScrollView>

        <View style={[modalStyles.actions, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[modalStyles.nopeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleNope}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FF4D6D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.likeBtn, { backgroundColor: colors.primary }]}
            onPress={handleLike}
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={24} color="#fff" />
            <Text style={modalStyles.likeBtnText}>{alreadyMatched ? "Message" : "Like"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: "absolute", top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
  },
  photo: { width: "100%", height: W * 1.1 },
  info: { padding: 24, gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 26, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bio: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  actions: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 16, padding: 20, borderTopWidth: StyleSheet.hairlineWidth,
  },
  nopeBtn: {
    width: 58, height: 58, borderRadius: 29, borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  likeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, height: 58, borderRadius: 29,
  },
  likeBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appMode, setAppMode } = useApp();
  const [selected, setSelected] = useState<ServerProfile | null>(null);
  const { data: feedData, isLoading } = useGetFeed();

  const profiles: ServerProfile[] = feedData?.profiles ?? [];
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {isLoading ? "Finding people near you…" : `${profiles.length} people to discover`}
            </Text>
          </View>
        </View>
      </View>

      <ModeSelector value={appMode} onChange={setAppMode} />

      {!isLoading && profiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.primary }]}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No profiles yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Be the first! More people join every day.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.userId}
          numColumns={COLS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: bottomPadding + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const photoUrl = getPhotoUrl(item.photoUrl);
            return (
              <TouchableOpacity
                style={styles.tile}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelected(item);
                }}
                activeOpacity={0.88}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.tileImg} contentFit="cover" />
                ) : (
                  <LinearGradient colors={["#FF3366", "#6B21A8"]} style={styles.tileImg}>
                    <Text style={{ fontSize: 36 }}>👤</Text>
                  </LinearGradient>
                )}
                <LinearGradient
                  colors={["transparent", PURPLE_DARK + "E6"]}
                  style={styles.tileOverlay}
                >
                  <Text style={styles.tileName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.tileAge}>{item.age}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <ServerProfileModal
        profile={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 4 },
  headerTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  liveOnlyBtnOuter: { marginTop: 4 },
  liveOnlyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  liveOnlyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  row: { gap: 2, marginBottom: 2, paddingHorizontal: 2 },
  tile: {
    width: TILE, height: TILE * 1.25, borderRadius: 10, margin: 1,
    overflow: "hidden", position: "relative",
  },
  tileImg: { width: "100%", height: "100%" },
  tileOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 7, paddingBottom: 7, paddingTop: 26,
  },
  tileName: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tileAge: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Inter_400Regular" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingHorizontal: 40, paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  liveBadgeAnchor: { position: "absolute", top: 6, left: 6 },
  liveBadgeWrap: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FF000099", borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.6 },
});

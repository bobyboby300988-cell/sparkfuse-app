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
import { ALL_PROFILES, getProfilesByMode } from "@/data/allProfiles";
import type { Profile } from "@/data/allProfiles";
import { LockedPhotoGrid } from "@/components/LockedPhotoGrid";
import { ModeSelector } from "@/components/ModeSelector";
import { useColors } from "@/hooks/useColors";

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
      colors={["#FF3366", "#FF6B35"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={styles.liveBadgeWrap}
    >
      <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </LinearGradient>
  );
}

function ProfileModal({
  profile,
  visible,
  onClose,
}: {
  profile: Profile | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const { addMatch, matches } = useApp();
  if (!profile) return null;
  const alreadyMatched = matches.some((m) => m.profileId === profile.id);
  const accent = MODE_ACCENT[profile.mode] ?? colors.primary;

  const handleLike = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!alreadyMatched) addMatch(profile.id);
    onClose();
    router.push({ pathname: "/chat/[id]", params: { id: profile.id } });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[modalStyles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <Image source={profile.photo} style={modalStyles.photo} contentFit="cover" />
          <View style={modalStyles.info}>
            <View style={modalStyles.nameRow}>
              <Text style={[modalStyles.name, { color: colors.foreground }]}>
                {profile.name}, {profile.age}
              </Text>
              <Ionicons name="checkmark-circle" size={22} color={accent} />
            </View>
            <View style={modalStyles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
              <Text style={[modalStyles.meta, { color: colors.mutedForeground }]}>{profile.location}</Text>
              <Text style={[modalStyles.meta, { color: colors.mutedForeground }]}>·</Text>
              <Text style={[modalStyles.meta, { color: colors.mutedForeground }]}>{profile.height}</Text>
            </View>
            <Text style={[modalStyles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
            <Text style={[modalStyles.sectionLabel, { color: colors.mutedForeground }]}>Interests</Text>
            <View style={modalStyles.chips}>
              {profile.interests.map((interest) => (
                <View key={interest} style={[modalStyles.chip, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
                  <Text style={[modalStyles.chipText, { color: accent }]}>{interest}</Text>
                </View>
              ))}
            </View>

            {profile.lockedPhotos && profile.lockedPhotos.length > 0 && (
              <LockedPhotoGrid profileName={profile.name} lockedPhotos={profile.lockedPhotos} />
            )}
          </View>
        </ScrollView>

        <View style={[modalStyles.actions, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[modalStyles.nopeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FF4D6D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.likeBtn, { backgroundColor: accent }]}
            onPress={handleLike}
            activeOpacity={0.85}
          >
            <Ionicons
              name={
                profile.mode === "business" ? "briefcase" :
                profile.mode === "party" ? "musical-notes" :
                profile.mode === "travel" ? "airplane" :
                profile.mode === "social" ? "people" :
                "heart"
              }
              size={24} color="#fff"
            />
            <Text style={modalStyles.likeBtnText}>
              {alreadyMatched ? "Message" :
               profile.mode === "business" ? "Connect" :
               profile.mode === "party" ? "Join" :
               profile.mode === "travel" ? "Explore" :
               profile.mode === "social" ? "Meet" :
               "Like"}
            </Text>
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
  const [selected, setSelected] = useState<Profile | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);

  const profiles = liveOnly
    ? ALL_PROFILES.filter((p) => p.isLive)
    : getProfilesByMode(appMode);
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {liveOnly
                ? `${profiles.length} people live now`
                : `${profiles.length} people in ${appMode} mode`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLiveOnly((v) => !v);
            }}
            activeOpacity={0.85}
            style={styles.liveOnlyBtnOuter}
          >
            {liveOnly ? (
              <LinearGradient
                colors={["#FF3366", "#FF6B35"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.liveOnlyBtn}
              >
                <Ionicons name="radio" size={14} color="#fff" />
                <Text style={[styles.liveOnlyBtnText, { color: "#fff" }]}>Live</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.liveOnlyBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: "#FF336640" }]}>
                <Ionicons name="radio" size={14} color="#FF3366" />
                <Text style={[styles.liveOnlyBtnText, { color: colors.foreground }]}>Live</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {!liveOnly && <ModeSelector value={appMode} onChange={setAppMode} />}

      <FlatList
        data={profiles}
        keyExtractor={(p) => p.id}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: bottomPadding + 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (item.isLive) {
                router.push(`/live/${item.id}` as any);
              } else {
                setSelected(item);
              }
            }}
            activeOpacity={0.88}
          >
            <Image source={item.photo} style={styles.tileImg} contentFit="cover" />
            <LinearGradient
              colors={["transparent", (MODE_ACCENT[item.mode] ?? "#FF3366") + "CC"]}
              style={styles.tileOverlay}
            >
              <Text style={styles.tileName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.tileAge}>{item.age}</Text>
            </LinearGradient>
            {item.isLive && (
              <View style={styles.liveBadgeAnchor}>
                <ExploreLiveBadge />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <ProfileModal
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
  liveBadgeAnchor: { position: "absolute", top: 6, left: 6 },
  liveBadgeWrap: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FF000099", borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.6 },
});

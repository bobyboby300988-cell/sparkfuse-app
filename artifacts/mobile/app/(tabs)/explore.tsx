import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useApp } from "@/context/AppContext";
import { ModeSelector } from "@/components/ModeSelector";
import { useColors } from "@/hooks/useColors";
import { useCreateSwipe } from "@workspace/api-client-react";
import { getApiUrl, getPhotoUrl } from "@/lib/api";
import { buildDemoMedia, type DemoItem } from "@/components/LockedMediaGrid";
import { fetchActiveLiveSessions, type LiveSession } from "@/lib/liveApi";

const { width: W } = Dimensions.get("window");
const GALLERY_H = W * 1.15;
const COLS = 3;
const GAP = 10;
const TILE = (W - GAP * (COLS + 1)) / COLS;

const MODE_ACCENT: Record<string, string> = {
  dating:   "#FF3366",
  naughty:  "#FF6B35",
  business: "#0EA5E9",
  party:    "#A855F7",
  travel:   "#14B8A6",
  social:   "#F59E0B",
};

const MODE_LABEL: Record<string, string> = {
  dating:   "People Near You",
  naughty:  "Hot & Wild 🔥",
  business: "Professionals 💼",
  party:    "Party People 🎉",
  travel:   "Travellers ✈️",
  social:   "Social Circle 🤝",
};

type BrowseProfile = {
  userId: string;
  name: string;
  age: number;
  bio?: string | null;
  photoUrl?: string | null;
  city?: string | null;
  country?: string | null;
  distanceKm?: number | null;
  isOnline?: boolean;
};

function useBrowse() {
  const [profiles, setProfiles] = useState<BrowseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getToken } = useAuth();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const base = getApiUrl();
      const tok = await getToken();
      const res = await fetch(`${base}/api/browse`, {
        headers: tok ? { Authorization: `Bearer ${tok}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  return { profiles, loading, refreshing, refresh: () => load(true) };
}

function useLiveSessions() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const load = useCallback(async () => {
    try { setSessions(await fetchActiveLiveSessions()); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);
  return { sessions, reload: load };
}

/* ── Photo gallery (swipeable) ──────────────────────────────────────── */
function PhotoGallery({
  profile,
}: {
  profile: BrowseProfile;
}) {
  const { coinBalance, addCoins, unlockedPhotos, unlockPhoto } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const demoItems = buildDemoMedia(profile.userId);
  const photoUrl = getPhotoUrl(profile.photoUrl);
  const totalItems = 1 + demoItems.length;

  const handleUnlock = (item: DemoItem) => {
    const price = item.type === "video" ? 500 : 50;
    const priceEur = item.type === "video" ? "€5.00" : "€0.50";
    const label = item.type === "video" ? "video" : "photo";
    if (coinBalance < price) {
      Alert.alert(
        "Not enough tokens 🔥",
        `You need ${price} CT (${priceEur}) to unlock this ${label}.\n\nYou have ${coinBalance} CT. Buy more in your wallet.`,
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      `Unlock ${label}`,
      `Spend ${price} CT (${priceEur}) to unlock this exclusive ${label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Unlock · ${price} CT`,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addCoins(-price);
            unlockPhoto(item.id);
          },
        },
      ]
    );
  };

  return (
    <View style={{ width: W, height: GALLERY_H }}>
      {/* Tinder-style progress bars */}
      <View style={gStyles.bars} pointerEvents="none">
        {Array.from({ length: totalItems }).map((_, i) => (
          <View
            key={i}
            style={[
              gStyles.bar,
              { backgroundColor: i <= currentIndex ? "#fff" : "rgba(255,255,255,0.35)" },
            ]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / W))
        }
        scrollEventThrottle={16}
        style={{ width: W, height: GALLERY_H }}
      >
        {/* Slide 0: main profile photo */}
        <View style={{ width: W, height: GALLERY_H }}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: W, height: GALLERY_H }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={["#FF3366", "#6B21A8"]}
              style={{ width: W, height: GALLERY_H, justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ fontSize: 88 }}>👤</Text>
            </LinearGradient>
          )}
        </View>

        {/* Demo slides */}
        {demoItems.map((item) => {
          const isUnlocked = unlockedPhotos.includes(item.id);
          const locked = item.exclusive && !isUnlocked;
          return (
            <View key={item.id} style={{ width: W, height: GALLERY_H }}>
              <LinearGradient
                colors={item.grad}
                style={{ width: W, height: GALLERY_H, justifyContent: "center", alignItems: "center" }}
              >
                {!locked && (
                  <Text style={{ fontSize: W * 0.32 }}>{item.emoji}</Text>
                )}
                {!locked && item.type === "video" && (
                  <View style={gStyles.videoBadge}>
                    <Ionicons name="play" size={28} color="#fff" />
                  </View>
                )}
              </LinearGradient>

              {/* Lock overlay */}
              {locked && (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => handleUnlock(item)}
                  style={StyleSheet.absoluteFill}
                >
                  <BlurView intensity={88} tint="dark" style={StyleSheet.absoluteFill} />
                  {/* Faint emoji hint */}
                  <Text
                    style={{
                      fontSize: W * 0.22,
                      opacity: 0.07,
                      position: "absolute",
                      alignSelf: "center",
                      top: GALLERY_H * 0.3,
                    }}
                  >
                    {item.emoji}
                  </Text>
                  {/* Lock card */}
                  <View style={gStyles.lockCard}>
                    <View style={gStyles.lockIconRing}>
                      <Ionicons name="lock-closed" size={30} color="#fff" />
                    </View>
                    <Text style={gStyles.lockPrice}>
                      {item.type === "video" ? "500 CT" : "20 CT"}
                    </Text>
                    <Text style={gStyles.lockEur}>
                      {item.type === "video" ? "= €5.00" : "= €0.20"}
                    </Text>
                    <View style={gStyles.lockTypePill}>
                      <Ionicons
                        name={item.type === "video" ? "videocam" : "camera"}
                        size={11}
                        color="#fff"
                      />
                      <Text style={gStyles.lockTypeText}>
                        {item.type === "video" ? "Exclusive Video" : "Exclusive Photo"}
                      </Text>
                    </View>
                    <Text style={gStyles.lockTap}>Tap to unlock</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Unlocked checkmark */}
              {item.exclusive && isUnlocked && (
                <View style={gStyles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#27ae60" />
                  <Text style={gStyles.unlockedText}>Unlocked</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ── Gallery styles ─────────────────────────────────────────────────── */
const gStyles = StyleSheet.create({
  bars: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: "row",
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  videoBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  lockCard: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lockIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  lockPrice: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  lockEur: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  lockTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockTypeText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  lockTap: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  unlockedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unlockedText: {
    color: "#27ae60",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});

/* ── Profile modal ──────────────────────────────────────────────────── */
function ProfileModal({
  profile,
  visible,
  onClose,
}: {
  profile: BrowseProfile | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const { addMatch, matches } = useApp();
  const createSwipe = useCreateSwipe();
  if (!profile) return null;

  const alreadyMatched = matches.some((m) => m.profileId === profile.userId);
  const locationStr = [profile.city, profile.country].filter(Boolean).join(", ");
  const photoUrl = getPhotoUrl(profile.photoUrl);

  const handleLike = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await createSwipe.mutateAsync({ data: { targetUserId: profile.userId, direction: "like" } });
    } catch { /* ignore */ }
    if (!alreadyMatched) addMatch(profile.userId, profile.name, photoUrl);
    onClose();
  };

  const handleNope = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createSwipe.mutateAsync({ data: { targetUserId: profile.userId, direction: "pass" } });
    } catch { /* ignore */ }
    onClose();
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!alreadyMatched) addMatch(profile.userId, profile.name, photoUrl);
    onClose();
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: profile.userId,
        name: profile.name,
        photo: photoUrl ?? "",
      },
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[mStyles.container, { backgroundColor: colors.background }]}>
        {/* Close X */}
        <TouchableOpacity style={mStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* ── Swipeable photo gallery ── */}
          <PhotoGallery profile={profile} />

          {/* ── Info section ── */}
          <View style={mStyles.info}>
            <View style={mStyles.nameRow}>
              <Text style={[mStyles.name, { color: colors.foreground }]}>
                {profile.name}, {profile.age}
              </Text>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </View>
            {locationStr ? (
              <View style={mStyles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                <Text style={[mStyles.meta, { color: colors.mutedForeground }]}>{locationStr}</Text>
                {profile.distanceKm != null && (
                  <Text style={[mStyles.meta, { color: colors.mutedForeground }]}>
                    {" "}· {profile.distanceKm} km away
                  </Text>
                )}
              </View>
            ) : null}
            {profile.bio ? (
              <Text style={[mStyles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
            ) : (
              <Text style={[mStyles.bio, { color: colors.mutedForeground }]}>No bio yet.</Text>
            )}
          </View>
        </ScrollView>

        {/* ── Action bar: Nope | Like | Message ── */}
        <View
          style={[
            mStyles.actions,
            { borderTopColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          {/* Nope */}
          <TouchableOpacity
            style={[mStyles.roundBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleNope}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FF4D6D" />
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            style={[mStyles.wideBtn, { backgroundColor: "#FF3366" }]}
            onPress={handleLike}
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={22} color="#fff" />
            <Text style={mStyles.wideBtnText}>Like</Text>
          </TouchableOpacity>

          {/* Message */}
          <TouchableOpacity
            style={[mStyles.roundBtn, { backgroundColor: colors.primary, borderColor: "transparent" }]}
            onPress={handleMessage}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  info: { padding: 24, gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 26, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bio: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  roundBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  wideBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 58,
    borderRadius: 29,
  },
  wideBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});

/* ── Explore screen ─────────────────────────────────────────────────── */
export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appMode, setAppMode } = useApp();
  const [selected, setSelected] = useState<BrowseProfile | null>(null);
  const { profiles, loading, refreshing, refresh } = useBrowse();
  const { sessions: liveSessions, reload: reloadLive } = useLiveSessions();

  const isLiveMode = appMode === "live";
  const accentColor = isLiveMode ? "#FF3366" : (MODE_ACCENT[appMode] ?? colors.primary);
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  // Build set of live userIds for badge overlay on browse tiles
  const liveUserIds = new Set(liveSessions.map((s) => s.hostUserId).filter(Boolean));

  const headerSubtitle = isLiveMode
    ? (liveSessions.length === 0 ? "Nimeni live acum" : `${liveSessions.length} live acum 🔴`)
    : (loading ? "Se încarcă…" : `${profiles.length} persoane găsite`);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={[accentColor + "28", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {isLiveMode ? "🔴 Live Acum" : (MODE_LABEL[appMode] ?? "Explore")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {headerSubtitle}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: accentColor + "22", borderColor: accentColor + "55" }]}
            onPress={isLiveMode ? reloadLive : refresh}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={accentColor} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ModeSelector value={appMode} onChange={setAppMode} />

      {/* ── LIVE MODE ── */}
      {isLiveMode ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GAP, paddingBottom: bottomPadding + 100 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reloadLive} tintColor="#FF3366" />}
        >
          {liveSessions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <LinearGradient colors={["#FF336630", "#FF336610"]} style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔴</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nimeni nu e live acum</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Fii primul care pornește un live stream!
                </Text>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: "#FF3366" }]} onPress={reloadLive} activeOpacity={0.8}>
                  <Text style={styles.emptyBtnText}>Reîncarcă</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.grid}>
              {liveSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.tile, { borderColor: "#FF336655" }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: "/live/[id]", params: { id: session.id } });
                  }}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#1a0510", "#2d0a1a", "#0a0010"]}
                    style={[styles.tileImg, { justifyContent: "center", alignItems: "center" }]}
                  >
                    <Text style={{ fontSize: 44 }}>🎥</Text>
                  </LinearGradient>

                  {/* Pulsing LIVE badge */}
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDotBadge} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>

                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={styles.overlay}>
                    <Text style={styles.tileName} numberOfLines={1}>{session.name}</Text>
                    <Text style={styles.tileCategory} numberOfLines={1}>{session.category}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        /* ── BROWSE MODE ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GAP, paddingBottom: bottomPadding + 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accentColor} />}
        >
          {!loading && profiles.length === 0 ? (
            <View style={styles.emptyWrap}>
              <LinearGradient colors={[accentColor + "30", accentColor + "10"]} style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No profiles yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Be the first! More people join every day.
                </Text>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: accentColor }]} onPress={refresh} activeOpacity={0.8}>
                  <Text style={styles.emptyBtnText}>Refresh</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.grid}>
              {profiles.map((item) => {
                const photoUrl = getPhotoUrl(item.photoUrl);
                const isLive = liveUserIds.has(item.userId);
                const liveSession = isLive ? liveSessions.find((s) => s.hostUserId === item.userId) : undefined;
                return (
                  <TouchableOpacity
                    key={item.userId}
                    style={[styles.tile, { borderColor: isLive ? "#FF336688" : accentColor + "33" }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (isLive && liveSession) {
                        router.push({ pathname: "/live/[id]", params: { id: liveSession.id } });
                      } else {
                        setSelected(item);
                      }
                    }}
                    activeOpacity={0.88}
                  >
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.tileImg} contentFit="cover" />
                    ) : (
                      <LinearGradient
                        colors={[accentColor, accentColor + "88"]}
                        style={[styles.tileImg, { justifyContent: "center", alignItems: "center" }]}
                      >
                        <Text style={{ fontSize: 48 }}>👤</Text>
                      </LinearGradient>
                    )}

                    {/* LIVE badge (overrides online dot) */}
                    {isLive ? (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDotBadge} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    ) : item.isOnline ? (
                      <View style={[styles.onlineDot, { backgroundColor: "#22c55e", borderColor: colors.background }]} />
                    ) : null}

                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.82)"]} style={styles.overlay}>
                      <Text style={styles.tileName} numberOfLines={1}>{item.name}, {item.age}</Text>
                      {item.distanceKm != null && (
                        <View style={styles.distRow}>
                          <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.7)" />
                          <Text style={styles.tileDistance}>
                            {item.distanceKm < 1 ? "<1 km" : `${item.distanceKm} km`}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>

                    {!isLive && (
                      <View style={[styles.modeBadge, { backgroundColor: accentColor }]}>
                        <Text style={styles.modeBadgeText}>
                          {appMode === "naughty" ? "🔥" : appMode === "party" ? "🎉" : "💕"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <ProfileModal profile={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1,
    justifyContent: "center", alignItems: "center", marginTop: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, marginTop: GAP },
  tile: {
    width: TILE, height: TILE * 1.4,
    borderRadius: 16, overflow: "hidden",
    position: "relative", borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  tileImg: { width: "100%", height: "100%" },
  onlineDot: {
    position: "absolute", top: 10, right: 10,
    width: 10, height: 10, borderRadius: 5, borderWidth: 2,
  },
  overlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 32,
  },
  tileName: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  tileDistance: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  modeBadge: {
    position: "absolute", top: 10, left: 10,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  modeBadgeText: { fontSize: 12 },
  liveBadge: {
    position: "absolute", top: 10, left: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FF0000CC", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  liveDotBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tileCategory: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyWrap: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },
  emptyCard: { borderRadius: 24, padding: 40, alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
  emptyBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});

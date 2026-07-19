import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getApiUrl, getPhotoUrl } from "@/lib/api";
import { ALL_PROFILES } from "@/data/allProfiles";
import { LockedPhotoGrid } from "@/components/LockedPhotoGrid";
import { fetchActiveLiveSessions } from "@/lib/liveApi";

const { width: W } = Dimensions.get("window");
const TILE = (W - 40 - 8) / 3;
const CAROUSEL_H = W * 1.35;

type ServerProfile = {
  userId: string;
  name: string;
  age: number;
  bio: string;
  seeking: string;
  photoUrl: string | null;
  city: string | null;
  country: string | null;
  lastSeenAt: string | null;
};

type ServerPhoto = {
  id: string;
  objectPath: string;
  isExclusive: boolean;
  mediaType: "image" | "video";
  sortOrder: number;
};

function formatLastSeen(iso: string | null): { label: string; online: boolean } {
  if (!iso) return { label: "Offline", online: false };
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return { label: "Online acum", online: true };
  if (mins < 60) return { label: `Văzut acum ${mins} min`, online: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `Văzut acum ${hrs}h`, online: false };
  return { label: `Văzut acum ${Math.floor(hrs / 24)}z`, online: false };
}

function LightboxModal({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={lb.overlay} activeOpacity={1} onPress={onClose}>
        <Image source={{ uri }} style={lb.img} contentFit="contain" />
        <TouchableOpacity style={lb.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function VideoPlayerModal({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const isPlaying = status?.isPlaying ?? false;
  const duration = status?.durationMillis ?? 0;
  const position = status?.positionMillis ?? 0;

  useEffect(() => {
    if (!visible) {
      videoRef.current?.pauseAsync().catch(() => {});
    }
  }, [visible]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };

  const seek = (ms: number) => {
    const next = Math.max(0, Math.min(duration, position + ms));
    videoRef.current?.setPositionAsync(next);
  };

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={vp.container}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={vp.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          useNativeControls={false}
          onPlaybackStatusUpdate={(s) => {
            setStatus(s);
            if (!isSeeking && (s as any).positionMillis != null && (s as any).durationMillis) {
              setSliderValue((s as any).positionMillis / (s as any).durationMillis);
            }
          }}
        />

        {/* Back button */}
        <TouchableOpacity style={vp.back} onPress={onClose} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Controls overlay */}
        <View style={vp.controls}>
          {/* Progress bar */}
          <View style={vp.progressRow}>
            <Text style={vp.timeText}>{formatTime(position)}</Text>
            <View
              style={vp.progressTrack}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                setIsSeeking(true);
                const x = e.nativeEvent.locationX;
                const w = W - 80;
                const ratio = Math.max(0, Math.min(1, x / w));
                setSliderValue(ratio);
                videoRef.current?.setPositionAsync(ratio * duration);
              }}
              onResponderMove={(e) => {
                const x = e.nativeEvent.locationX;
                const w = W - 80;
                const ratio = Math.max(0, Math.min(1, x / w));
                setSliderValue(ratio);
              }}
              onResponderRelease={(e) => {
                const x = e.nativeEvent.locationX;
                const w = W - 80;
                const ratio = Math.max(0, Math.min(1, x / w));
                videoRef.current?.setPositionAsync(ratio * duration);
                setIsSeeking(false);
              }}
            >
              <View style={[vp.progressFill, { width: `${sliderValue * 100}%` }]} />
              <View style={[vp.progressThumb, { left: `${sliderValue * 100}%` }]} />
            </View>
            <Text style={vp.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Buttons row */}
          <View style={vp.btnRow}>
            <TouchableOpacity onPress={() => seek(-10000)} style={vp.seekBtn} activeOpacity={0.7}>
              <Ionicons name="play-back" size={28} color="#fff" />
              <Text style={vp.seekLabel}>10s</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlay} style={vp.playBtn} activeOpacity={0.85}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={36} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => seek(10000)} style={vp.seekBtn} activeOpacity={0.7}>
              <Ionicons name="play-forward" size={28} color="#fff" />
              <Text style={vp.seekLabel}>10s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileViewScreen() {
  const { id, name: nameParam, photo: photoParam } = useLocalSearchParams<{
    id: string;
    name?: string;
    photo?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { addMatch, coinBalance, addCoins, unlockedPhotos, unlockPhoto } = useApp();

  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<ServerPhoto[]>([]);
  const [liked, setLiked] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);

  const mockProfile = ALL_PROFILES.find((p) => p.id === id);

  useEffect(() => {
    if (!id) return;
    if (mockProfile) { setLoading(false); return; }
    (async () => {
      try {
        const token = await getToken();
        const base = getApiUrl();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [profileRes, photosRes] = await Promise.all([
          fetch(`${base}/api/users/${id}/profile`, { headers }),
          fetch(`${base}/api/users/${id}/photos`, { headers }),
        ]);
        if (profileRes.ok) { const d = await profileRes.json(); setProfile(d.profile); }
        if (photosRes.ok) { const d = await photosRes.json(); setPhotos(d.photos ?? []); }
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  // Check if this user is currently live
  useEffect(() => {
    if (!id) return;
    fetchActiveLiveSessions().then((sessions) => {
      const found = sessions.find((s) => s.hostUserId === id);
      if (found) { setIsLive(true); setLiveSessionId(found.id); }
    }).catch(() => {});
  }, [id]);

  const displayName = mockProfile?.name ?? profile?.name ?? nameParam ?? "Utilizator";
  const displayAge = mockProfile?.age ?? profile?.age ?? null;
  const displayBio = mockProfile?.bio ?? profile?.bio ?? "";
  const displayCity = mockProfile?.location ?? profile?.city ?? null;
  const displayCountry = profile?.country ?? null;
  const displaySeeking = profile?.seeking ?? null;
  const displayInterests = mockProfile?.interests ?? [];
  const displayLastSeen = formatLastSeen(profile?.lastSeenAt ?? null);

  const heroSource = mockProfile?.photo
    ?? (profile?.photoUrl ? { uri: getPhotoUrl(profile.photoUrl) ?? profile.photoUrl } : null)
    ?? (photoParam ? { uri: photoParam } : null)
    ?? require("../../assets/images/p1.png");

  const freePhotos = photos.filter((p) => !p.isExclusive);
  const exclusivePhotos = photos.filter((p) => p.isExclusive);

  const lockedPhotoItems = exclusivePhotos.map((p) => ({
    id: p.id,
    photo: { uri: getPhotoUrl(p.objectPath) ?? p.objectPath } as any,
    priceEur: p.mediaType === "video" ? 5 : 0.2,
    type: p.mediaType,
  }));

  const heroUri = typeof heroSource === "object" && "uri" in heroSource ? heroSource.uri : null;

  const galleryPhotos: Array<{ id: string; uri: string; isVideo: boolean }> = freePhotos.length > 0
    ? freePhotos.map((p) => ({ id: p.id, uri: getPhotoUrl(p.objectPath) ?? p.objectPath, isVideo: p.mediaType === "video" }))
    : heroUri && !mockProfile
      ? [{ id: "hero", uri: heroUri, isVideo: false }]
      : [];

  type CarouselSlide = { id: string; source: any; isLocked: boolean; isVideo: boolean; price?: string };
  const carouselItems = useMemo<CarouselSlide[]>(() => {
    const items: CarouselSlide[] = [{ id: "hero", source: heroSource, isLocked: false, isVideo: false }];
    if (!mockProfile) {
      freePhotos.forEach((p) => {
        const uri = getPhotoUrl(p.objectPath) ?? p.objectPath;
        items.push({ id: p.id, source: { uri }, isLocked: false, isVideo: p.mediaType === "video" });
      });
      exclusivePhotos.forEach((p) => {
        const uri = getPhotoUrl(p.objectPath) ?? p.objectPath;
        items.push({
          id: p.id, source: { uri }, isLocked: true, isVideo: p.mediaType === "video",
          price: p.mediaType === "video" ? "500 ST · €5.00" : "20 ST · €0.20",
        });
      });
    }
    return items;
  }, [heroSource, mockProfile, freePhotos, exclusivePhotos]);

  const handleMessage = () => {
    const photoUri = heroUri ?? "";
    addMatch(id, displayName, photoUri);
    router.push({ pathname: "/chat/[id]", params: { id, name: displayName, photo: photoUri } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

        {/* ── Photo Carousel ── */}
        <View style={{ width: W, height: CAROUSEL_H }}>
          <FlatList
            ref={flatRef}
            horizontal
            pagingEnabled
            data={carouselItems}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) =>
              setCarouselIndex(Math.round(e.nativeEvent.contentOffset.x / W))
            }
            renderItem={({ item }) => {
              const locked = item.isLocked && !unlockedPhotos.includes(item.id);
              return (
                <TouchableOpacity
                  activeOpacity={locked ? 0.88 : 0.95}
                  style={{ width: W, height: CAROUSEL_H }}
                  onPress={() => {
                    if (locked) {
                      const price = item.isVideo ? 500 : 20;
                      const priceEur = item.isVideo ? "€5.00" : "€0.20";
                      const label = item.isVideo ? "video" : "foto";
                      if (coinBalance < price) {
                        Alert.alert("Jetoane insuficiente 🔥", `Ai nevoie de ${price} CT (${priceEur}) pentru a debloca acest ${label}.\n\nAi ${coinBalance} CT.`, [{ text: "OK" }]);
                        return;
                      }
                      Alert.alert(`Deblochează ${label}`, `Cheltuiești ${price} CT (${priceEur}) pentru a debloca?`, [
                        { text: "Anulează", style: "cancel" },
                        { text: `Deblochează · ${price} CT`, onPress: () => { addCoins(-price); unlockPhoto(item.id); } },
                      ]);
                    } else if (item.isVideo && item.source?.uri) {
                      setVideoUri(item.source.uri);
                    } else if (!item.isVideo && item.source?.uri) {
                      setLightboxUri(item.source.uri);
                    }
                  }}
                >
                  <Image
                    source={item.source}
                    style={{ width: W, height: CAROUSEL_H }}
                    contentFit="cover"
                    blurRadius={locked ? 22 : 0}
                  />
                  {locked && (
                    <View style={styles.lockOverlay}>
                      <View style={styles.lockCircle}>
                        <Ionicons name={item.isVideo ? "videocam" : "lock-closed"} size={30} color="#fff" />
                      </View>
                      <Text style={styles.lockPrice}>{item.price}</Text>
                      <Text style={styles.lockHint}>Atinge pentru a debloca</Text>
                    </View>
                  )}
                  {!locked && item.isVideo && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="play" size={28} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
            style={styles.heroGradient}
            pointerEvents="none"
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 10 }]}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Name + status overlay */}
          <View style={[styles.heroInfo, { bottom: 24 }]} pointerEvents="none">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Text style={styles.heroName}>
                {displayName}{displayAge ? `, ${displayAge}` : ""}
              </Text>
              {!mockProfile && (
                <View style={[styles.onlinePill, { backgroundColor: displayLastSeen.online ? "#22C55E" : "rgba(255,255,255,0.2)" }]}>
                  <View style={[styles.onlineDot, { backgroundColor: displayLastSeen.online ? "#fff" : "rgba(255,255,255,0.6)" }]} />
                  <Text style={styles.onlinePillText}>{displayLastSeen.online ? "Online" : "Offline"}</Text>
                </View>
              )}
            </View>
            {displayCity && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroLocation}>
                  {displayCity}{displayCountry ? `, ${displayCountry}` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Dot indicators */}
          {carouselItems.length > 1 && (
            <View style={styles.dotsRow} pointerEvents="none">
              {carouselItems.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, {
                    backgroundColor: i === carouselIndex ? "#fff" : "rgba(255,255,255,0.38)",
                    width: i === carouselIndex ? 18 : 6,
                  }]}
                />
              ))}
            </View>
          )}

          {/* Photo counter */}
          <View style={styles.photoCounter} pointerEvents="none">
            <Text style={styles.photoCounterText}>{carouselIndex + 1} / {carouselItems.length}</Text>
          </View>
        </View>

        {/* ── Este LIVE banner ── */}
        {isLive && liveSessionId && (
          <TouchableOpacity
            style={styles.liveBanner}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/live/[id]", params: { id: liveSessionId } })}
          >
            <View style={styles.liveBannerDot} />
            <Text style={styles.liveBannerText}>Este live acum • Intră pe stream</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF3366" />
          </TouchableOpacity>
        )}

        {loading && !mockProfile && (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {/* ── Info chips ── */}
        <View style={[styles.chipsRow, { borderBottomColor: colors.border }]}>
          {displayAge && (
            <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{displayAge} ani</Text>
            </View>
          )}
          {displayCity && (
            <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{displayCity}</Text>
            </View>
          )}
          {displaySeeking && (
            <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="heart-outline" size={14} color="#e74c3c" />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{displaySeeking}</Text>
            </View>
          )}
          {!mockProfile && (
            <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{displayLastSeen.label}</Text>
            </View>
          )}
        </View>

        {/* ── Bio ── */}
        {displayBio ? (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Despre mine</Text>
            <Text style={[styles.bioText, { color: colors.foreground }]}>{displayBio}</Text>
          </View>
        ) : null}

        {/* ── Interese ── */}
        {displayInterests.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Interese</Text>
            <View style={styles.tagsRow}>
              {displayInterests.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Galerie publică ── */}
        {galleryPhotos.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Galerie · {galleryPhotos.length} {galleryPhotos.length === 1 ? "poză" : "poze"}
            </Text>
            <View style={styles.photoGrid}>
              {galleryPhotos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.photoTile}
                  onPress={() => setLightboxUri(p.uri)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: p.uri }} style={styles.photoTileImg} contentFit="cover" />
                  {p.isVideo && (
                    <View style={styles.videoIconBadge}>
                      <Ionicons name="videocam" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Galerie exclusivă ── */}
        {lockedPhotoItems.length > 0 && (
          <View style={styles.section}>
            <LockedPhotoGrid profileName={displayName} lockedPhotos={lockedPhotoItems} />
          </View>
        )}

        {/* ── Nicio poză ── */}
        {!mockProfile && !loading && galleryPhotos.length === 0 && lockedPhotoItems.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
            <Ionicons name="images-outline" size={44} color={colors.border} />
            <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" }}>
              Nicio poză în galerie
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bara jos ── */}
      <View style={[
        styles.bottomBar,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 8) }
      ]}>
        <TouchableOpacity
          style={[styles.likeBtn, { borderColor: liked ? "#e74c3c" : colors.border, backgroundColor: liked ? "#e74c3c18" : colors.card }]}
          onPress={() => setLiked((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#e74c3c" : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.messageBtn, { backgroundColor: colors.primary }]} onPress={handleMessage} activeOpacity={0.85}>
          <Ionicons name="chatbubble" size={18} color="#fff" />
          <Text style={styles.messageBtnText}>Trimite mesaj</Text>
        </TouchableOpacity>
      </View>

      <LightboxModal uri={lightboxUri ?? ""} visible={!!lightboxUri} onClose={() => setLightboxUri(null)} />
      <VideoPlayerModal uri={videoUri ?? ""} visible={!!videoUri} onClose={() => setVideoUri(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 280 },
  backBtn: {
    position: "absolute", left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  heroInfo: { position: "absolute", left: 20, right: 20 },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  lockCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  lockPrice: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  lockHint: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "Inter_400Regular" },
  videoBadge: {
    position: "absolute", bottom: 20, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
  },
  dotsRow: {
    position: "absolute", bottom: 10, alignSelf: "center",
    flexDirection: "row", gap: 5, alignItems: "center",
  },
  dot: { height: 5, borderRadius: 3, backgroundColor: "#fff" },
  photoCounter: {
    position: "absolute", top: 14, right: 14,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  photoCounterText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  liveBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 2,
    backgroundColor: "#FF336612", borderWidth: 1.5, borderColor: "#FF336640",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
  },
  liveBannerDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF3366",
  },
  liveBannerText: { flex: 1, color: "#FF3366", fontSize: 14, fontFamily: "Inter_700Bold" },
  heroName: {
    color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  heroLocation: { color: "rgba(255,255,255,0.88)", fontSize: 14, fontFamily: "Inter_400Regular" },
  onlinePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlinePillText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  chipsRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  section: {
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 1 },
  bioText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  photoTile: { width: TILE, height: TILE * 1.35, borderRadius: 12, overflow: "hidden" },
  photoTileImg: { width: "100%", height: "100%" },
  videoIconBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
  },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 12,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  likeBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
  messageBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 26, height: 52,
  },
  messageBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

const lb = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.93)", justifyContent: "center", alignItems: "center" },
  img: { width: "100%", height: "82%" },
  closeBtn: {
    position: "absolute", top: 52, right: 20,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20,
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
  },
});

const { height: SCREEN_H } = Dimensions.get("window");

const vp = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#000",
    justifyContent: "center", alignItems: "center",
  },
  video: {
    width: W,
    height: SCREEN_H,
  },
  back: {
    position: "absolute", top: 52, left: 16,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 22,
    width: 44, height: 44, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  controls: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 44, paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    gap: 12,
  },
  progressRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  timeText: {
    color: "#fff", fontSize: 12, fontFamily: "Inter_500Medium",
    minWidth: 36, textAlign: "center",
  },
  progressTrack: {
    flex: 1, height: 36,
    justifyContent: "center",
  },
  progressFill: {
    height: 4, borderRadius: 2,
    backgroundColor: "#FF3366",
  },
  progressThumb: {
    position: "absolute",
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#FF3366",
    marginLeft: -8,
    top: "50%",
    marginTop: -8,
  },
  btnRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 40,
  },
  seekBtn: {
    alignItems: "center", gap: 2,
  },
  seekLabel: {
    color: "rgba(255,255,255,0.7)", fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FF3366",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF3366", shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 8,
  },
});

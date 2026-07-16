import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const { width: W } = Dimensions.get("window");
const TILE = (W - 40 - 8) / 3;

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

export default function ProfileViewScreen() {
  const { id, name: nameParam, photo: photoParam } = useLocalSearchParams<{
    id: string;
    name?: string;
    photo?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { addMatch } = useApp();

  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<ServerPhoto[]>([]);
  const [liked, setLiked] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

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

  const handleMessage = () => {
    const photoUri = heroUri ?? "";
    addMatch(id, displayName, photoUri);
    router.push({ pathname: "/chat/[id]", params: { id, name: displayName, photo: photoUri } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

        {/* ── Hero foto cu gradient ── */}
        <View style={styles.heroWrap}>
          <Image source={heroSource} style={styles.heroImg} contentFit="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
            style={styles.heroGradient}
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 10 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Name + badges */}
          <View style={[styles.heroInfo, { bottom: 24 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Text style={styles.heroName}>
                {displayName}{displayAge ? `, ${displayAge}` : ""}
              </Text>
              {!mockProfile && (
                <View style={[
                  styles.onlinePill,
                  { backgroundColor: displayLastSeen.online ? "#22C55E" : "rgba(255,255,255,0.2)" }
                ]}>
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
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroWrap: { width: "100%", height: 500, position: "relative" },
  heroImg: { width: "100%", height: "100%" },
  heroGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 260 },
  backBtn: {
    position: "absolute", left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  heroInfo: { position: "absolute", left: 20, right: 20 },
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

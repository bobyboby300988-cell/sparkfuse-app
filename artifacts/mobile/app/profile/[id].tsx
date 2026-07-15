import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

  const mockProfile = ALL_PROFILES.find((p) => p.id === id);

  useEffect(() => {
    if (!id) return;
    if (mockProfile) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${getApiUrl()}/api/users/${id}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
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

  const photoSource = mockProfile?.photo
    ?? (profile?.photoUrl ? { uri: getPhotoUrl(profile.photoUrl) ?? profile.photoUrl } : null)
    ?? (photoParam ? { uri: photoParam } : null)
    ?? require("../../assets/images/p1.png");

  const handleMessage = () => {
    const photoUri = typeof photoSource === "object" && "uri" in photoSource ? photoSource.uri : "";
    addMatch(id, displayName, photoUri);
    router.push({
      pathname: "/chat/[id]",
      params: { id, name: displayName, photo: photoUri },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        bounces={true}
      >
        {/* Fotografie mare */}
        <View style={styles.photoContainer}>
          <Image
            source={photoSource}
            style={styles.photo}
            contentFit="cover"
          />
          {/* Gradient overlay */}
          <View style={styles.photoOverlay} />

          {/* Buton înapoi */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 12 }]}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Nume + vârstă pe foto */}
          <View style={[styles.nameOverlay, { bottom: 24 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={styles.nameText}>
                {displayName}{displayAge ? `, ${displayAge}` : ""}
              </Text>
              {!mockProfile && (
                <View style={[
                  styles.onlineBadge,
                  { backgroundColor: displayLastSeen.online ? "#22C55E" : "rgba(255,255,255,0.25)" }
                ]}>
                  <Text style={styles.onlineBadgeText}>
                    {displayLastSeen.online ? "● Online" : "● Offline"}
                  </Text>
                </View>
              )}
            </View>
            {displayCity && (
              <Text style={styles.locationText}>
                📍 {displayCity}{displayCountry ? `, ${displayCountry}` : ""}
              </Text>
            )}
          </View>
        </View>

        {loading && !mockProfile && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {/* Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>

          {/* Status online (pentru useri reali) */}
          {!mockProfile && !displayLastSeen.online && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="time-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {displayLastSeen.label}
              </Text>
            </View>
          )}

          {/* Bio */}
          {displayBio ? (
            <View style={styles.bioSection}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Despre mine</Text>
              <Text style={[styles.bioText, { color: colors.foreground }]}>{displayBio}</Text>
            </View>
          ) : null}

          {/* Caută */}
          {displaySeeking ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="heart-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                Caută: {displaySeeking}
              </Text>
            </View>
          ) : null}

          {/* Interese */}
          {displayInterests.length > 0 && (
            <View style={styles.bioSection}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Interese</Text>
              <View style={styles.tagsRow}>
                {displayInterests.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.foreground }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Buton Trimite Mesaj */}
      <View style={[
        styles.bottomBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 8),
        },
      ]}>
        <TouchableOpacity
          style={[styles.messageBtn, { backgroundColor: colors.primary }]}
          onPress={handleMessage}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble" size={20} color="#fff" />
          <Text style={styles.messageBtnText}>Trimite mesaj</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoContainer: { width: "100%", height: 480, position: "relative" },
  photo: { width: "100%", height: "100%" },
  photoOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backBtn: {
    position: "absolute", left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  nameOverlay: { position: "absolute", left: 20, right: 20 },
  nameText: {
    color: "#fff", fontSize: 30, fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  locationText: {
    color: "rgba(255,255,255,0.85)", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6,
  },
  onlineBadge: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  onlineBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  infoSection: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  bioSection: { paddingVertical: 16, gap: 10 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  bioText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  messageBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 28, paddingVertical: 16,
  },
  messageBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

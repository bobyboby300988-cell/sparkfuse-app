import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMatches, useGetMyProfile } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getPhotoUrl } from "@/lib/api";
import { useTranslation } from "react-i18next";

type LocationFilter = "everywhere" | "myCity" | "myCountry" | "nearby";
type DistanceUnit = "km" | "mi";
const MI_TO_KM = 1.60934;

const { width: W } = Dimensions.get("window");
const SWIPE_THRESHOLD = 60;
const AVATAR_SIZE = 62;

const AD_EVERY = 20;

const ADS = [
  { id: "ad_1", emoji: "💎", headline: "Boost your profile", body: "Get 10× more matches this week.", cta: "Try Boost", accent: "#7C3AED" },
  { id: "ad_2", emoji: "📸", headline: "Look your best", body: "Pro photos triple your matches.", cta: "Book a shoot", accent: "#0EA5E9" },
  { id: "ad_3", emoji: "🎯", headline: "Find someone specific", body: "Advanced filters by values & lifestyle.", cta: "Upgrade now", accent: "#F59E0B" },
];

function AdBanner({ adIndex }: { adIndex: number }) {
  const ad = ADS[adIndex % ADS.length];
  return (
    <View style={[adStyles.card, { borderColor: ad.accent + "40", backgroundColor: ad.accent + "12" }]}>
      <Text style={adStyles.sponsoredLabel}>{/* Sponsored label — uses i18n in the parent component */}Sponsored</Text>
      <View style={adStyles.body}>
        <Text style={adStyles.emoji}>{ad.emoji}</Text>
        <View style={adStyles.textWrap}>
          <Text style={adStyles.headline}>{ad.headline}</Text>
          <Text style={adStyles.bodyText}>{ad.body}</Text>
        </View>
      </View>
      <TouchableOpacity style={[adStyles.ctaBtn, { backgroundColor: ad.accent }]} activeOpacity={0.85}>
        <Text style={adStyles.ctaText}>{ad.cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface SwipeAvatarProps {
  photo: any;
  onLike: () => void;
  onNope: () => void;
  colors: any;
}

function SwipeAvatar({ photo, onLike, onNope, colors }: SwipeAvatarProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = translateX.interpolate({ inputRange: [-80, 0, 80], outputRange: ["-18deg", "0deg", "18deg"] });

  const likeOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: "clamp" });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => translateX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        if (g.dx > SWIPE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(translateX, { toValue: W, useNativeDriver: true }).start(() => {
            onLike();
            translateX.setValue(0);
          });
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.spring(translateX, { toValue: -W, useNativeDriver: true }).start(() => {
            onNope();
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.avatarWrap}>
      {/* NOPE stamp */}
      <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
        <Text style={styles.stampTextNope}>NOPE</Text>
      </Animated.View>

      {/* LIKE stamp */}
      <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
        <Text style={styles.stampTextLike}>LIKE</Text>
      </Animated.View>

      {/* Avatar */}
      <Animated.View
        style={{ transform: [{ translateX }, { rotate }] }}
        {...panResponder.panHandlers}
      >
        <Image source={photo} style={styles.avatar} resizeMode="cover" />
      </Animated.View>

      <View style={[styles.onlineDot, { backgroundColor: colors.like }]} />
    </View>
  );
}

type MatchItem = { type: "match"; match: any; profile: any; lastMsg: any };
type AdItem = { type: "ad"; adIndex: number; id: string };
type ListItem = MatchItem | AdItem;

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { matches, addMatch, removeMatch } = useApp();
  const { data } = useGetMatches();
  const { data: myProfileData } = useGetMyProfile();
  const myProfile = myProfileData?.profile ?? null;
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("everywhere");
  const [customDistanceKm, setCustomDistanceKm] = useState(50);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [showDistancePicker, setShowDistancePicker] = useState(false);

  // Sync any server-side matches that aren't yet in local AsyncStorage.
  // This handles the case where someone matched you but you never swiped them
  // through the Explore tab on this device (so addMatch was never called locally).
  useEffect(() => {
    const serverMatches = data?.matches ?? [];
    serverMatches.forEach((sp) => {
      addMatch(sp.userId);
    });
  }, [data?.matches]);

  const matchData = useMemo(() => {
    const serverMatches = data?.matches ?? [];
    // Iterate SERVER matches so every mutual like appears, even if this
    // device's AsyncStorage has no local entry yet.
    return serverMatches
      .map((serverProfile) => {
        const localMatch = matches.find((m) => m.profileId === serverProfile.userId) ?? {
          profileId: serverProfile.userId,
          matchedAt: Date.now(),
          messages: [],
        };
        const photoUrl = getPhotoUrl(serverProfile.photoUrl);
        const profile = {
          id: serverProfile.userId,
          name: serverProfile.name,
          photo: photoUrl ? { uri: photoUrl } : require("../../assets/images/p1.png"),
          city: serverProfile.city ?? null,
          country: serverProfile.country ?? null,
          distanceKm: serverProfile.distanceKm ?? null,
        };
        const lastMsg = localMatch.messages[localMatch.messages.length - 1];
        return { match: localMatch, profile, lastMsg };
      })
      .sort((a, b) => b.match.matchedAt - a.match.matchedAt);
  }, [matches, data]);

  const filteredMatchData = useMemo(() => {
    if (locationFilter === "everywhere") return matchData;
    return matchData.filter((item) => {
      if (!item) return false;
      const { city, country, distanceKm } = item.profile;
      if (locationFilter === "myCity") {
        return myProfile?.city && city && city.toLowerCase() === myProfile.city.toLowerCase();
      }
      if (locationFilter === "myCountry") {
        return myProfile?.country && country && country.toLowerCase() === myProfile.country.toLowerCase();
      }
      if (locationFilter === "nearby") {
        return distanceKm !== null && distanceKm <= customDistanceKm;
      }
      return true;
    });
  }, [matchData, locationFilter, myProfile]);

  const listItems = useMemo<ListItem[]>(() => {
    const result: ListItem[] = [];
    let adCount = 0;
    filteredMatchData.forEach((item, index) => {
      result.push({ type: "match", ...item! } as MatchItem);
      if ((index + 1) % AD_EVERY === 0) {
        result.push({ type: "ad", adIndex: adCount, id: `ad_${adCount}` });
        adCount++;
      }
    });
    return result;
  }, [filteredMatchData]);

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const displayDistance = distanceUnit === "km"
    ? `${customDistanceKm} km`
    : `${Math.round(customDistanceKm / MI_TO_KM)} mi`;

  const filterOptions: { key: LocationFilter; label: string }[] = [
    { key: "everywhere", label: t("matches.filterEverywhere") },
    { key: "myCity", label: t("matches.filterMyCity") },
    { key: "myCountry", label: t("matches.filterMyCountry") },
    { key: "nearby", label: `Within ${displayDistance}` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("matches.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {filteredMatchData.length === 1
            ? t("matches.matchCount_one", { count: filteredMatchData.length })
            : t("matches.matchCount_other", { count: filteredMatchData.length })} · {t("matches.swipeHint")}
        </Text>

        {/* Location filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
          style={{ marginTop: 10 }}
        >
          {filterOptions.map((opt) => {
            const active = locationFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setLocationFilter(opt.key);
                  if (opt.key === "nearby") setShowDistancePicker(true);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, { color: active ? "#fff" : colors.foreground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Distance picker — shown when "nearby" is active */}
        {locationFilter === "nearby" && (
          <View style={[styles.distancePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* km/miles toggle */}
            <View style={styles.distanceUnitRow}>
              <TouchableOpacity
                style={[styles.unitBtn, distanceUnit === "km" && { backgroundColor: colors.primary }]}
                onPress={() => { setDistanceUnit("km"); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.unitBtnText, { color: distanceUnit === "km" ? "#fff" : colors.foreground }]}>km</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, distanceUnit === "mi" && { backgroundColor: colors.primary }]}
                onPress={() => { setDistanceUnit("mi"); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.unitBtnText, { color: distanceUnit === "mi" ? "#fff" : colors.foreground }]}>mi</Text>
              </TouchableOpacity>
            </View>
            {/* +/- controls */}
            <View style={styles.distanceControls}>
              {[5, 10, 25, 50, 100, 250].map((val) => {
                const displayVal = distanceUnit === "km" ? val : Math.round(val / MI_TO_KM);
                const kmVal = distanceUnit === "km" ? val : Math.round(val * MI_TO_KM);
                const active = customDistanceKm === kmVal;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.distanceChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
                    onPress={() => { setCustomDistanceKm(kmVal); Haptics.selectionAsync(); }}
                  >
                    <Text style={[styles.distanceChipText, { color: active ? "#fff" : colors.foreground }]}>{displayVal}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {filteredMatchData.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="heart-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("matches.noMatchesYet")}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {t("matches.startSwiping")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => (item.type === "ad" ? item.id : item.match.profileId)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPadding + 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === "ad") return <AdBanner adIndex={item.adIndex} />;
            const { profile, match, lastMsg } = item;
            return (
              <View style={[styles.matchRow, { borderBottomColor: colors.border }]}>
                <SwipeAvatar
                  photo={profile.photo}
                  colors={colors}
                  onLike={() =>
                    router.push({ pathname: "/chat/[id]", params: { id: profile.id } })
                  }
                  onNope={() => removeMatch(profile.id)}
                />

                <TouchableOpacity
                  style={styles.matchInfo}
                  onPress={() =>
                    router.push({ pathname: "/chat/[id]", params: { id: profile.id } })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.matchNameRow}>
                    <Text style={[styles.matchName, { color: colors.foreground }]}>
                      {profile.name}
                    </Text>
                    <Text style={[styles.matchTime, { color: colors.mutedForeground }]}>
                      {formatTime(match.matchedAt)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.lastMessage, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {lastMsg
                      ? lastMsg.text || t("matches.attachment")
                      : t("matches.sayHello", { name: profile.name })}
                  </Text>
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const adStyles = StyleSheet.create({
  card: { marginVertical: 8, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sponsoredLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#9A93B3", textTransform: "uppercase", letterSpacing: 0.8 },
  body: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 32 },
  textWrap: { flex: 1, gap: 3 },
  headline: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  bodyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9A93B3", lineHeight: 18 },
  ctaBtn: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  ctaText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  filterBar: { paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  distancePicker: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  distanceUnitRow: { flexDirection: "row", gap: 8 },
  unitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  unitBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  distanceControls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  distanceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  distanceChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 20 },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
    overflow: "visible",
  },

  avatarWrap: {
    position: "relative",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  onlineDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 10,
  },

  stamp: {
    position: "absolute",
    zIndex: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 2,
  },
  stampLike: {
    top: 4,
    left: -8,
    borderColor: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.15)",
    transform: [{ rotate: "-15deg" }],
  },
  stampNope: {
    top: 4,
    right: -8,
    borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.15)",
    transform: [{ rotate: "15deg" }],
  },
  stampTextLike: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#22c55e",
    letterSpacing: 1,
  },
  stampTextNope: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#ef4444",
    letterSpacing: 1,
  },

  matchInfo: { flex: 1 },
  matchNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  matchName: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  matchTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  lastMessage: { fontSize: 14, fontFamily: "Inter_400Regular" },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});

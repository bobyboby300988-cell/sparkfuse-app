import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useMemo } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { ALL_PROFILES } from "@/data/allProfiles";
import { useColors } from "@/hooks/useColors";

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
      <Text style={adStyles.sponsoredLabel}>Sponsored</Text>
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
  const { matches, removeMatch } = useApp();

  const matchData = useMemo(() => {
    return matches
      .map((m) => {
        const profile = ALL_PROFILES.find((p) => p.id === m.profileId);
        if (!profile) return null;
        const lastMsg = m.messages[m.messages.length - 1];
        return { match: m, profile, lastMsg };
      })
      .filter(Boolean)
      .sort((a, b) => b!.match.matchedAt - a!.match.matchedAt);
  }, [matches]);

  const listItems = useMemo<ListItem[]>(() => {
    const result: ListItem[] = [];
    let adCount = 0;
    matchData.forEach((item, index) => {
      result.push({ type: "match", ...item! } as MatchItem);
      if ((index + 1) % AD_EVERY === 0) {
        result.push({ type: "ad", adIndex: adCount, id: `ad_${adCount}` });
        adCount++;
      }
    });
    return result;
  }, [matchData]);

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Matches</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {matchData.length} {matchData.length === 1 ? "match" : "matches"} · swipe photo to like or pass
        </Text>
      </View>

      {matchData.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="heart-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Start swiping to connect with people near you
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
                      ? lastMsg.text || "📎 Attachment"
                      : `Say hello to ${profile.name}!`}
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
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
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

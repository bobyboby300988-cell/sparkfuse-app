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
const SWIPE_THRESHOLD = W * 0.35;
const ROW_HEIGHT = 90;

const AD_EVERY = 20;

const ADS = [
  { id: "ad_1", emoji: "💎", headline: "Boost your profile", body: "Get 10× more matches this week with a Profile Boost.", cta: "Try Boost", accent: "#7C3AED" },
  { id: "ad_2", emoji: "📸", headline: "Look your best", body: "Professional dating photos proven to triple your matches.", cta: "Book a shoot", accent: "#0EA5E9" },
  { id: "ad_3", emoji: "🎯", headline: "Find someone specific", body: "Use advanced filters to match by values, lifestyle & more.", cta: "Upgrade now", accent: "#F59E0B" },
];

function AdBanner({ adIndex }: { adIndex: number }) {
  const ad = ADS[adIndex % ADS.length];
  return (
    <View style={[adStyles.card, { borderColor: ad.accent + "40", backgroundColor: ad.accent + "12" }]}>
      <View style={adStyles.topRow}>
        <Text style={adStyles.sponsoredLabel}>Sponsored</Text>
      </View>
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

interface SwipeableRowProps {
  profile: any;
  match: any;
  lastMsg: any;
  onChat: () => void;
  onRemove: () => void;
  colors: any;
}

function SwipeableMatchRow({ profile, match, lastMsg, onChat, onRemove, colors }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const dx = g.dx;

        if (dx > SWIPE_THRESHOLD) {
          // Swipe right → open chat
          Animated.spring(translateX, { toValue: W, useNativeDriver: true }).start(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onChat();
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          });
        } else if (dx < -SWIPE_THRESHOLD) {
          // Swipe left → unmatch with fade-out
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.parallel([
            Animated.timing(translateX, { toValue: -W, duration: 250, useNativeDriver: true }),
            Animated.timing(rowOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]).start(() => onRemove());
        } else {
          // Snap back
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // Background color based on direction
  const rightBg = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: ["rgba(34,197,94,0)", "rgba(34,197,94,1)"],
    extrapolate: "clamp",
  });
  const leftBg = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: ["rgba(239,68,68,1)", "rgba(239,68,68,0)"],
    extrapolate: "clamp",
  });
  const rightIconOp = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.5], outputRange: [0, 1], extrapolate: "clamp" });
  const leftIconOp = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD * 0.5, 0], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Animated.View style={[styles.rowOuter, { opacity: rowOpacity }]}>
      {/* Right action bg (chat) */}
      <Animated.View style={[styles.actionBg, styles.actionBgRight, { backgroundColor: rightBg }]}>
        <Animated.View style={{ opacity: rightIconOp, alignItems: "center" }}>
          <Ionicons name="chatbubble" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Chat</Text>
        </Animated.View>
      </Animated.View>

      {/* Left action bg (unmatch) */}
      <Animated.View style={[styles.actionBg, styles.actionBgLeft, { backgroundColor: leftBg }]}>
        <Animated.View style={{ opacity: leftIconOp, alignItems: "center" }}>
          <Ionicons name="heart-dislike" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Unmatch</Text>
        </Animated.View>
      </Animated.View>

      {/* Sliding row */}
      <Animated.View
        style={[
          styles.matchRow,
          { borderBottomColor: colors.border, backgroundColor: colors.background, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.rowInner} onPress={onChat} activeOpacity={0.75}>
          <View style={styles.avatarWrap}>
            <Image source={profile.photo} style={styles.avatar} resizeMode="cover" />
            <View style={[styles.onlineDot, { backgroundColor: colors.like }]} />
          </View>

          <View style={styles.matchInfo}>
            <View style={styles.matchNameRow}>
              <Text style={[styles.matchName, { color: colors.foreground }]}>{profile.name}</Text>
              <Text style={[styles.matchTime, { color: colors.mutedForeground }]}>{formatTime(match.matchedAt)}</Text>
            </View>
            <Text style={[styles.lastMessage, { color: colors.mutedForeground }]} numberOfLines={1}>
              {lastMsg ? lastMsg.text || "📎 Attachment" : `Say hello to ${profile.name}!`}
            </Text>
          </View>

          <View style={styles.hintIcons}>
            <Ionicons name="arrow-back" size={12} color={colors.mutedForeground} />
            <Ionicons name="arrow-forward" size={12} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
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
        <View style={styles.headerSub}>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {matchData.length} {matchData.length === 1 ? "match" : "matches"}
          </Text>
          <View style={styles.swipeHint}>
            <Ionicons name="arrow-back" size={11} color={colors.mutedForeground} />
            <Text style={[styles.swipeHintText, { color: colors.mutedForeground }]}>swipe rows</Text>
            <Ionicons name="arrow-forward" size={11} color={colors.mutedForeground} />
          </View>
        </View>
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
              <SwipeableMatchRow
                key={profile.id}
                profile={profile}
                match={match}
                lastMsg={lastMsg}
                colors={colors}
                onChat={() => router.push({ pathname: "/chat/[id]", params: { id: profile.id } })}
                onRemove={() => removeMatch(profile.id)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const adStyles = StyleSheet.create({
  card: { marginHorizontal: 0, marginVertical: 8, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  topRow: { flexDirection: "row", alignItems: "center" },
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
  headerSub: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  title: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  swipeHintText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 20 },

  rowOuter: { height: ROW_HEIGHT, overflow: "hidden", position: "relative" },
  actionBg: {
    position: "absolute", top: 0, bottom: 0,
    justifyContent: "center", alignItems: "center", width: "50%",
  },
  actionBgRight: { left: 0, alignItems: "flex-start", paddingLeft: 24 },
  actionBgLeft: { right: 0, alignItems: "flex-end", paddingRight: 24 },
  actionLabel: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 3 },

  matchRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowInner: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 0, gap: 14,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  onlineDot: {
    position: "absolute", width: 14, height: 14, borderRadius: 7,
    bottom: 1, right: 1, borderWidth: 2, borderColor: "white",
  },
  matchInfo: { flex: 1 },
  matchNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  matchName: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  matchTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  lastMessage: { fontSize: 14, fontFamily: "Inter_400Regular" },
  hintIcons: { flexDirection: "row", gap: 2, opacity: 0.4 },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});

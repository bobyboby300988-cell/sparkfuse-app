import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { MOCK_PROFILES } from "@/data/profiles";
import { useColors } from "@/hooks/useColors";

const AD_EVERY = 20;

const ADS = [
  {
    id: "ad_1",
    emoji: "💎",
    headline: "Boost your profile",
    body: "Get 10× more matches this week with a Profile Boost.",
    cta: "Try Boost",
    accent: "#7C3AED",
  },
  {
    id: "ad_2",
    emoji: "📸",
    headline: "Look your best",
    body: "Professional dating photos proven to triple your matches.",
    cta: "Book a shoot",
    accent: "#0EA5E9",
  },
  {
    id: "ad_3",
    emoji: "🎯",
    headline: "Find someone specific",
    body: "Use advanced filters to match by values, lifestyle & more.",
    cta: "Upgrade now",
    accent: "#F59E0B",
  },
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

type MatchItem = { type: "match"; match: any; profile: any; lastMsg: any };
type AdItem = { type: "ad"; adIndex: number; id: string };
type ListItem = MatchItem | AdItem;

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { matches } = useApp();

  const matchData = useMemo(() => {
    return matches
      .map((m) => {
        const profile = MOCK_PROFILES.find((p) => p.id === m.profileId);
        if (!profile) return null;
        const lastMsg = m.messages[m.messages.length - 1];
        return { match: m, profile, lastMsg };
      })
      .filter(Boolean)
      .sort((a, b) => b!.match.matchedAt - a!.match.matchedAt);
  }, [matches]);

  // Interleave an ad after every AD_EVERY match items
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
          {matchData.length} {matchData.length === 1 ? "match" : "matches"}
        </Text>
      </View>

      {matchData.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="heart-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No matches yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Start swiping to connect with people near you
          </Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) =>
            item.type === "ad" ? item.id : item.match.profileId
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPadding + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === "ad") {
              return <AdBanner adIndex={item.adIndex} />;
            }
            const { profile, match, lastMsg } = item;
            return (
              <TouchableOpacity
                style={[styles.matchRow, { borderBottomColor: colors.border }]}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[id]",
                    params: { id: profile.id },
                  })
                }
                activeOpacity={0.75}
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={profile.photo}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                  <View style={[styles.onlineDot, { backgroundColor: colors.like }]} />
                </View>

                <View style={styles.matchInfo}>
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
                    {lastMsg ? lastMsg.text : "Say hello to " + profile.name + "!"}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const adStyles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sponsoredLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#9A93B3",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  headline: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  bodyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9A93B3",
    lineHeight: 18,
  },
  ctaBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 20,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
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
  },
  matchInfo: {
    flex: 1,
  },
  matchNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  matchName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  matchTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});

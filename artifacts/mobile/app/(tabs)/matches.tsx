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

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

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
          data={matchData}
          keyExtractor={(item) => item!.match.profileId}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPadding + 100 },
          ]}
          scrollEnabled={!!matchData.length}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (!item) return null;
            const { profile, match, lastMsg } = item;
            return (
              <TouchableOpacity
                style={[
                  styles.matchRow,
                  { borderBottomColor: colors.border },
                ]}
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
                  <View
                    style={[styles.onlineDot, { backgroundColor: colors.like }]}
                  />
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

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

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

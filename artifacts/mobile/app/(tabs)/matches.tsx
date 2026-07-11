import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMatches } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getPhotoUrl } from "@/lib/api";
import { useTranslation } from "react-i18next";

const AVATAR_NEW = 68;
const AVATAR_CONV = 56;

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function Avatar({ uri, size }: { uri: string | null; size: number }) {
  const colors = useColors();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.muted,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="person" size={size * 0.45} color={colors.mutedForeground} />
    </View>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { matches, addMatch, removeMatch } = useApp();
  const { data } = useGetMatches();

  // Sync server matches → local AsyncStorage so chat works even without swiping
  useEffect(() => {
    (data?.matches ?? []).forEach((sp) => addMatch(sp.userId));
  }, [data?.matches]);

  const { newMatches, conversations } = useMemo(() => {
    const serverMatches = data?.matches ?? [];
    const all = serverMatches.map((sp) => {
      const local = matches.find((m) => m.profileId === sp.userId) ?? {
        profileId: sp.userId,
        matchedAt: Date.now(),
        messages: [],
      };
      return {
        profileId: sp.userId,
        name: sp.name,
        photoUri: getPhotoUrl(sp.photoUrl),
        matchedAt: local.matchedAt,
        messages: local.messages,
        lastMsg: local.messages[local.messages.length - 1] ?? null,
      };
    });

    return {
      newMatches: all.filter((m) => m.messages.length === 0).sort((a, b) => b.matchedAt - a.matchedAt),
      conversations: all.filter((m) => m.messages.length > 0).sort((a, b) => {
        const aTime = a.lastMsg?.timestamp ?? a.matchedAt;
        const bTime = b.lastMsg?.timestamp ?? b.matchedAt;
        return bTime - aTime;
      }),
    };
  }, [matches, data]);

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const hasAnything = newMatches.length > 0 || conversations.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
      </View>

      {!hasAnything ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Start swiping to find your spark ✨
          </Text>
        </View>
      ) : (
        <FlatList
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding + 100 }}
          ListHeaderComponent={
            <>
              {/* ── New Matches row ── */}
              {newMatches.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    NEW MATCHES · {newMatches.length}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.newMatchesRow}
                  >
                    {newMatches.map((m) => (
                      <Pressable
                        key={m.profileId}
                        style={({ pressed }) => [styles.newMatchItem, { opacity: pressed ? 0.75 : 1 }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          router.push({ pathname: "/chat/[id]", params: { id: m.profileId } });
                        }}
                      >
                        <View style={[styles.newMatchAvatarWrap, { borderColor: colors.primary }]}>
                          <Avatar uri={m.photoUri} size={AVATAR_NEW} />
                        </View>
                        <Text style={[styles.newMatchName, { color: colors.foreground }]} numberOfLines={1}>
                          {m.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* ── Conversations header ── */}
              {conversations.length > 0 && (
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginHorizontal: 20, marginTop: 4, marginBottom: 6 }]}>
                  MESSAGES · {conversations.length}
                </Text>
              )}
            </>
          }
          data={conversations}
          keyExtractor={(item) => item.profileId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.convRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({ pathname: "/chat/[id]", params: { id: item.profileId } });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.convAvatarWrap}>
                <Avatar uri={item.photoUri} size={AVATAR_CONV} />
                {/* online dot */}
                <View style={[styles.onlineDot, { borderColor: colors.background }]} />
              </View>

              <View style={styles.convInfo}>
                <View style={styles.convNameRow}>
                  <Text style={[styles.convName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                    {formatTime(item.lastMsg?.timestamp ?? item.matchedAt)}
                  </Text>
                </View>
                <Text style={[styles.convLastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.lastMsg?.text || (item.lastMsg ? "📎 Attachment" : `Say hi to ${item.name}!`)}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: "800", fontFamily: "Inter_700Bold" },

  section: { marginBottom: 4 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.9,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  newMatchesRow: { paddingHorizontal: 20, gap: 16, paddingBottom: 8 },
  newMatchItem: { alignItems: "center", gap: 6, width: AVATAR_NEW + 12 },
  newMatchAvatarWrap: {
    width: AVATAR_NEW + 4,
    height: AVATAR_NEW + 4,
    borderRadius: (AVATAR_NEW + 4) / 2,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  newMatchName: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },

  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  convAvatarWrap: { position: "relative", width: AVATAR_CONV, height: AVATAR_CONV },
  onlineDot: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 7,
    bottom: 1,
    right: 1,
    backgroundColor: "#22c55e",
    borderWidth: 2,
  },
  convInfo: { flex: 1 },
  convNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  convName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  convTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  convLastMsg: { fontSize: 13, fontFamily: "Inter_400Regular" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORY_COLORS, LIVE_STREAMS, LiveStream } from "@/data/livestreams";
import { fetchActiveLiveSessions } from "@/lib/liveApi";

type StreamCardItem = LiveStream & { isReal?: boolean };

function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveBadgeWrap}>
      <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.liveBadgeText}>LIVE</Text>
    </View>
  );
}

function StreamCard({ item, onPress }: { item: StreamCardItem; onPress: () => void }) {
  const grad = CATEGORY_COLORS[item.category] ?? ["#333", "#111"];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  }
  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }).start();
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardWrap}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.card}>
          {item.isReal ? (
            <LinearGradient colors={grad} style={styles.cardImg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.realPlaceholder}>
                <Ionicons name="videocam" size={30} color="#ffffffcc" />
              </View>
            </LinearGradient>
          ) : (
            <Image source={item.avatar} style={styles.cardImg} resizeMode="cover" />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.82)"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Top row */}
          <View style={styles.cardTop}>
            <LiveBadge />
            <View style={styles.viewerChip}>
              <Ionicons name="eye" size={11} color="#fff" />
              <Text style={styles.viewerText}>
                {item.viewers >= 1000
                  ? `${(item.viewers / 1000).toFixed(1)}k`
                  : item.viewers}
              </Text>
            </View>
          </View>
          {/* Category */}
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.categoryPill}
          >
            <Text style={styles.categoryText}>{item.category}</Text>
          </LinearGradient>
          {/* Badges */}
          <View style={styles.badgeRow}>
            {item.badges.slice(0, 2).map((b) => (
              <View key={b} style={styles.badge}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
          {/* Bottom info */}
          <View style={styles.cardBottom}>
            <Text style={styles.cardName}>
              {item.name}{item.isReal ? "" : `, ${item.age}`}
              {item.isVerified ? "  ✓" : ""}
            </Text>
            <Text style={styles.cardTagline} numberOfLines={1}>{item.tagline}</Text>
            <View style={styles.tokenRow}>
              <Text style={styles.tokenIcon}>🔥</Text>
              <Text style={styles.tokenCount}>{item.tokens.toLocaleString()} ST earned</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function LiveTab() {
  const router = useRouter();
  const [streams, setStreams] = useState<StreamCardItem[]>(LIVE_STREAMS);

  /* Fluctuate viewer counts */
  useEffect(() => {
    const t = setInterval(() => {
      setStreams((prev) =>
        prev.map((s) => ({
          ...s,
          viewers: Math.max(1, s.viewers + Math.floor((Math.random() - 0.45) * 18)),
        }))
      );
    }, 3000);
    return () => clearInterval(t);
  }, []);

  /* Poll for real people currently broadcasting */
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const sessions = await fetchActiveLiveSessions().catch(() => []);
      if (cancelled) return;
      setStreams((prev) => {
        const mocks = prev.filter((s) => !s.isReal);
        const real: StreamCardItem[] = sessions.map((s) => ({
          id: s.id,
          name: s.name,
          age: 0,
          avatar: LIVE_STREAMS[0].avatar,
          tagline: "Broadcasting live right now",
          category: (s.category as LiveStream["category"]) ?? "Dating",
          viewers: 1,
          tokens: 0,
          isVerified: false,
          badges: ["🔴 Live now"],
          isReal: true,
        }));
        return [...real, ...mocks];
      });
    }
    poll();
    const t = setInterval(poll, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔴  Live Now</Text>
        <TouchableOpacity
          style={styles.goLiveBtn}
          onPress={() => router.push("/live/go-live" as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#4B1F63", "#E8C468"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goLiveGrad}
          >
            <Ionicons name="radio" size={14} color="#fff" />
            <Text style={styles.goLiveText}>Go Live</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={streams}
        keyExtractor={(s) => s.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StreamCard
            item={item}
            onPress={() => router.push(`/live/${item.id}` as any)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08080F" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 16 : 8, paddingBottom: 12,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },

  goLiveBtn: { borderRadius: 22, overflow: "hidden" },
  goLiveGrad: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22,
  },
  goLiveText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  grid: { paddingHorizontal: 10, paddingBottom: 100, gap: 10 },

  cardWrap: { flex: 1 },
  card: {
    borderRadius: 18, overflow: "hidden",
    height: 260, backgroundColor: "#1A1A2E",
  },
  cardImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  realPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },

  cardTop: {
    position: "absolute", top: 10, left: 10, right: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  liveBadgeWrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#4B1F63CC", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "#E8C468",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E8C468" },
  liveBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },

  viewerChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#00000066", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  viewerText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },

  categoryPill: {
    position: "absolute", top: 42, left: 10,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3,
  },
  categoryText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },

  badgeRow: {
    position: "absolute", top: 68, left: 10, flexDirection: "row", gap: 4, flexWrap: "wrap",
  },
  badge: { backgroundColor: "#ffffff18", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#fff" },

  cardBottom: { position: "absolute", bottom: 10, left: 10, right: 10 },
  cardName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  cardTagline: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  tokenIcon: { fontSize: 12 },
  tokenCount: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#E8C468" },
});

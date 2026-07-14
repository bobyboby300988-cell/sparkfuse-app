import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width: W } = Dimensions.get("window");
const COLS = 3;
const GAP = 3;
const TILE = (W - 32 - GAP * (COLS - 1)) / COLS;

const PHOTO_PRICE = 20;   // ST
const VIDEO_PRICE = 500;  // ST

/* ── Demo media for creator profiles ─────────────────────────────────── */
type DemoItem = {
  id: string;
  type: "image" | "video";
  exclusive: boolean;
  grad: [string, string];
  emoji: string;
};

function buildDemoMedia(userId: string): DemoItem[] {
  const seed = userId ? userId.charCodeAt(0) % 4 : 0;
  const sets: DemoItem[][] = [
    [
      { id: `${userId}-1`, type: "image", exclusive: false, grad: ["#FF6B9D","#FF3366"], emoji: "🌸" },
      { id: `${userId}-2`, type: "image", exclusive: false, grad: ["#FFE082","#FFA000"], emoji: "☀️" },
      { id: `${userId}-3`, type: "image", exclusive: true,  grad: ["#B39DDB","#673AB7"], emoji: "🌙" },
      { id: `${userId}-4`, type: "video", exclusive: true,  grad: ["#80CBC4","#00695C"], emoji: "🎬" },
      { id: `${userId}-5`, type: "image", exclusive: false, grad: ["#80DEEA","#0097A7"], emoji: "💙" },
      { id: `${userId}-6`, type: "image", exclusive: true,  grad: ["#FF7043","#BF360C"], emoji: "🔥" },
      { id: `${userId}-7`, type: "video", exclusive: true,  grad: ["#CE93D8","#7B1FA2"], emoji: "✨" },
      { id: `${userId}-8`, type: "image", exclusive: false, grad: ["#A5D6A7","#388E3C"], emoji: "🌿" },
      { id: `${userId}-9`, type: "image", exclusive: true,  grad: ["#EF9A9A","#C62828"], emoji: "❤️" },
    ],
    [
      { id: `${userId}-1`, type: "image", exclusive: false, grad: ["#FFD6B0","#FF9F68"], emoji: "🍊" },
      { id: `${userId}-2`, type: "image", exclusive: true,  grad: ["#CE93D8","#7B1FA2"], emoji: "🔮" },
      { id: `${userId}-3`, type: "image", exclusive: false, grad: ["#80DEEA","#0097A7"], emoji: "💎" },
      { id: `${userId}-4`, type: "video", exclusive: true,  grad: ["#FF7043","#BF360C"], emoji: "🎥" },
      { id: `${userId}-5`, type: "image", exclusive: false, grad: ["#FFE082","#F57F17"], emoji: "⭐" },
      { id: `${userId}-6`, type: "image", exclusive: true,  grad: ["#F48FB1","#C2185B"], emoji: "💋" },
      { id: `${userId}-7`, type: "image", exclusive: false, grad: ["#B39DDB","#512DA8"], emoji: "🦋" },
      { id: `${userId}-8`, type: "video", exclusive: true,  grad: ["#80CBC4","#00796B"], emoji: "🎬" },
      { id: `${userId}-9`, type: "image", exclusive: true,  grad: ["#FF8A65","#E64A19"], emoji: "🌶️" },
    ],
    [
      { id: `${userId}-1`, type: "image", exclusive: false, grad: ["#80DEEA","#0097A7"], emoji: "🌊" },
      { id: `${userId}-2`, type: "image", exclusive: false, grad: ["#A5D6A7","#2E7D32"], emoji: "🌿" },
      { id: `${userId}-3`, type: "video", exclusive: true,  grad: ["#FF6B9D","#C2185B"], emoji: "🎞️" },
      { id: `${userId}-4`, type: "image", exclusive: false, grad: ["#FFD54F","#F57F17"], emoji: "🌻" },
      { id: `${userId}-5`, type: "image", exclusive: true,  grad: ["#9575CD","#311B92"], emoji: "🔮" },
      { id: `${userId}-6`, type: "image", exclusive: false, grad: ["#FF8A65","#BF360C"], emoji: "🍂" },
      { id: `${userId}-7`, type: "image", exclusive: true,  grad: ["#F06292","#880E4F"], emoji: "🌹" },
      { id: `${userId}-8`, type: "video", exclusive: true,  grad: ["#4DB6AC","#00695C"], emoji: "🎬" },
      { id: `${userId}-9`, type: "image", exclusive: false, grad: ["#FFF176","#F9A825"], emoji: "✨" },
    ],
    [
      { id: `${userId}-1`, type: "image", exclusive: false, grad: ["#F48FB1","#AD1457"], emoji: "💗" },
      { id: `${userId}-2`, type: "image", exclusive: true,  grad: ["#64B5F6","#1565C0"], emoji: "💙" },
      { id: `${userId}-3`, type: "image", exclusive: false, grad: ["#FFD54F","#E65100"], emoji: "🔆" },
      { id: `${userId}-4`, type: "image", exclusive: true,  grad: ["#CE93D8","#4A148C"], emoji: "👑" },
      { id: `${userId}-5`, type: "video", exclusive: true,  grad: ["#FF8A65","#BF360C"], emoji: "🎬" },
      { id: `${userId}-6`, type: "image", exclusive: false, grad: ["#80CBC4","#00695C"], emoji: "🌊" },
      { id: `${userId}-7`, type: "image", exclusive: true,  grad: ["#EF9A9A","#B71C1C"], emoji: "❤️‍🔥" },
      { id: `${userId}-8`, type: "image", exclusive: false, grad: ["#B0BEC5","#37474F"], emoji: "🌫️" },
      { id: `${userId}-9`, type: "video", exclusive: true,  grad: ["#9575CD","#4527A0"], emoji: "🎥" },
    ],
  ];
  return sets[seed];
}

/* ── Single tile ─────────────────────────────────────────────────────── */
function MediaTile({
  item,
  isUnlocked,
  onUnlock,
}: {
  item: DemoItem;
  isUnlocked: boolean;
  onUnlock: () => void;
}) {
  const locked = item.exclusive && !isUnlocked;

  return (
    <TouchableOpacity
      activeOpacity={locked ? 0.85 : 0.95}
      onPress={locked ? onUnlock : undefined}
      style={[st.tile, { width: TILE, height: TILE }]}
    >
      <LinearGradient colors={item.grad} style={st.tileGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {!locked && (
          <Text style={[st.tileEmoji, { fontSize: TILE * 0.38 }]}>{item.emoji}</Text>
        )}
        {!locked && item.type === "video" && (
          <View style={st.playBadge}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        )}
      </LinearGradient>

      {/* ── Locked overlay ── */}
      {locked && (
        <View style={StyleSheet.absoluteFill}>
          {/* Pixelated/blurred base */}
          <LinearGradient
            colors={[item.grad[0] + "CC", item.grad[1] + "CC"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <BlurView
            intensity={85}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          {/* Emoji visible but very faded to hint at content */}
          <Text
            style={[st.tileEmoji, st.blurredEmoji, { fontSize: TILE * 0.38 }]}
          >{item.emoji}</Text>
          {/* Lock badge */}
          <View style={st.lockOverlay}>
            <View style={st.lockBadge}>
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={st.lockPrice}>
                {item.type === "video" ? "500 ST" : "20 ST"}
              </Text>
              <Text style={st.lockEur}>
                {item.type === "video" ? "= €5" : "= €0.20"}
              </Text>
            </View>
            <Text style={st.lockTap}>Tap to unlock</Text>
          </View>
        </View>
      )}

      {/* Unlocked checkmark flash */}
      {item.exclusive && isUnlocked && (
        <View style={st.unlockedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ── Main exported component ─────────────────────────────────────────── */
export function LockedMediaGrid({ userId }: { userId: string }) {
  const colors = useColors();
  const { coinBalance, addCoins, unlockedPhotos, unlockPhoto } = useApp();
  const [items] = useState(() => buildDemoMedia(userId));

  const handleUnlock = (item: DemoItem) => {
    const price = item.type === "video" ? VIDEO_PRICE : PHOTO_PRICE;
    const priceEur = item.type === "video" ? "€5.00" : "€0.20";
    const label = item.type === "video" ? "video" : "photo";

    if (coinBalance < price) {
      Alert.alert(
        "Not enough tokens 🔥",
        `You need ${price} ST (${priceEur}) to unlock this ${label}.\n\nYou have ${coinBalance} ST. Buy more tokens in your wallet.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      `Unlock ${label} 🔒`,
      `Spend ${price} ST (${priceEur}) to unlock this exclusive ${label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Unlock · ${price} ST`,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addCoins(-price);
            unlockPhoto(item.id);
          },
        },
      ]
    );
  };

  const freeCount  = items.filter((i) => !i.exclusive).length;
  const lockedCount = items.filter((i) => i.exclusive).length;
  const videoCount = items.filter((i) => i.exclusive && i.type === "video").length;
  const photoExclCount = lockedCount - videoCount;

  return (
    <View style={[st.container, { borderColor: colors.border }]}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={{ fontSize: 18 }}>📸</Text>
          <Text style={[st.headerTitle, { color: colors.foreground }]}>Photos & Videos</Text>
        </View>
        <View style={st.pricePills}>
          <View style={[st.pricePill, { backgroundColor: "#FF336618" }]}>
            <Ionicons name="lock-closed" size={10} color="#FF3366" />
            <Text style={[st.pricePillText, { color: "#FF3366" }]}>Photo · 20 ST</Text>
          </View>
          <View style={[st.pricePill, { backgroundColor: "#FF6B3518" }]}>
            <Ionicons name="lock-closed" size={10} color="#FF6B35" />
            <Text style={[st.pricePillText, { color: "#FF6B35" }]}>Video · 500 ST</Text>
          </View>
        </View>
      </View>

      {/* Summary line */}
      <Text style={[st.summary, { color: colors.mutedForeground }]}>
        {freeCount} free · {photoExclCount} exclusive photos · {videoCount} exclusive videos
      </Text>

      {/* Grid */}
      <View style={st.grid}>
        {items.map((item) => (
          <MediaTile
            key={item.id}
            item={item}
            isUnlocked={unlockedPhotos.includes(item.id)}
            onUnlock={() => handleUnlock(item)}
          />
        ))}
      </View>

      {/* Bottom hint */}
      <Text style={[st.hint, { color: colors.mutedForeground }]}>
        🔥 Your Spark Tokens: {coinBalance} ST · Unlock exclusive content directly here
      </Text>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────── */
const st = StyleSheet.create({
  container: {
    marginTop: 4,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  pricePills: {
    flexDirection: "row",
    gap: 4,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pricePillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  summary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  tileGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileEmoji: {
    textAlign: "center",
  },
  blurredEmoji: {
    opacity: 0.12,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  playBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    padding: 3,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  lockBadge: {
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  lockPrice: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    marginTop: 2,
  },
  lockEur: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
  lockTap: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
  unlockedBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 1,
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    textAlign: "center",
  },
});

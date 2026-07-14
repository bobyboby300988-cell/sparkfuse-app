import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface SplashGift {
  emoji: string;
  label: string;
  tokens: number;
  grad: [string, string];
}

interface Props {
  gift: SplashGift | null;
  recipientName?: string;
  onHide: () => void;
}

const { width } = Dimensions.get("window");

/* ─── thresholds ─── */
const BIG_THRESHOLD  = 1000;   // ≥ €10 → Lottie full-screen
const EPIC_THRESHOLD = 5000;   // ≥ €50 → bigger Lottie
const MEGA_THRESHOLD = 10000;  // ≥ €100 → most impressive Lottie

function getLottieSource(tokens: number) {
  if (tokens >= MEGA_THRESHOLD) return require("../assets/animations/explosion.json");
  if (tokens >= EPIC_THRESHOLD) return require("../assets/animations/confetti.json");
  return require("../assets/animations/sparkle.json");
}

/* ══════════════════════════════════════════════
   SMALL TOAST  — gift < €10
   Slides in from right, floats up, fades in 1 s
══════════════════════════════════════════════ */
function SmallToast({ gift, onHide }: { gift: SplashGift; onHide: () => void }) {
  const translateX = useRef(new Animated.Value(200)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 10 }),
      Animated.timing(opacity,    { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -32, duration: 380, useNativeDriver: true }),
      ]).start(() => onHide());
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toastWrap, { opacity, transform: [{ translateX }, { translateY }] }]}
    >
      <LinearGradient colors={gift.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.toastCard}>
        <Text style={styles.toastEmoji}>{gift.emoji}</Text>
        <View style={styles.toastText}>
          <Text style={styles.toastLabel} numberOfLines={1}>{gift.label}</Text>
          <Text style={styles.toastST}>{gift.tokens} ST</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/* ══════════════════════════════════════════════
   BIG SPLASH  — gift ≥ €10
   Slides up from the BOTTOM — streamer/chat still visible above
══════════════════════════════════════════════ */
function BigSplash({ gift, recipientName, onHide }: { gift: SplashGift; recipientName?: string; onHide: () => void }) {
  const slideY    = useRef(new Animated.Value(340)).current;
  const cardScale = useRef(new Animated.Value(0.4)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const labelOp   = useRef(new Animated.Value(0)).current;
  const panelOp   = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  /* auto-hide duration: bigger gift = longer display */
  const displayMs = gift.tokens >= MEGA_THRESHOLD ? 4000 : gift.tokens >= EPIC_THRESHOLD ? 3400 : 2800;

  useEffect(() => {
    slideY.setValue(340);
    cardScale.setValue(0.4);
    cardOp.setValue(0);
    labelOp.setValue(0);
    panelOp.setValue(0);

    Animated.parallel([
      Animated.timing(panelOp, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 8 }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 7, bounciness: 18 }),
      Animated.timing(cardOp,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Animated.timing(labelOp, { toValue: 1, duration: 320, delay: 300, useNativeDriver: true }).start();

    setTimeout(() => lottieRef.current?.play(), 60);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(panelOp, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(slideY,  { toValue: 340, duration: 380, useNativeDriver: true }),
      ]).start(() => onHide());
    }, displayMs);

    return () => clearTimeout(timer);
  }, []);

  const eurLabel = gift.tokens >= 100
    ? `€${Math.round(gift.tokens / 100)}`
    : `€${(gift.tokens / 100).toFixed(2)}`;

  return (
    /* Positioned at the BOTTOM only — chat/stream visible above */
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bigPanel,
        {
          opacity: panelOp,
          transform: [{ translateY: slideY }],
          borderColor: gift.grad[0] + "55",
        },
      ]}
    >
      {/* Lottie confined to the bottom panel */}
      <LottieView
        ref={lottieRef}
        source={getLottieSource(gift.tokens)}
        style={StyleSheet.absoluteFillObject}
        autoPlay={false}
        loop={false}
        resizeMode="cover"
        renderMode={Platform.OS === "web" ? "AUTOMATIC" : "HARDWARE"}
      />

      {/* Dark gradient scrim — only on the panel */}
      <LinearGradient
        colors={["rgba(0,0,0,0.78)", "rgba(0,0,0,0.55)"]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Content row */}
      <View style={styles.bigPanelContent}>
        {/* Gift card */}
        <Animated.View style={[styles.bigCard, { transform: [{ scale: cardScale }], opacity: cardOp }]}>
          <LinearGradient colors={gift.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigCardGrad}>
            <Text style={styles.bigEmoji}>{gift.emoji}</Text>
            <Text style={styles.bigName}>{gift.label}</Text>
            <Text style={styles.bigValue}>{gift.tokens.toLocaleString()} ST · {eurLabel}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Label */}
        <Animated.View style={{ opacity: labelOp, flex: 1 }}>
          <Text style={styles.bigLabelText}>
            🎁 {recipientName ? `${recipientName} received` : "Gift sent"}{"\n"}
            <Text style={{ fontFamily: "Inter_700Bold", color: "#fff" }}>{gift.label}</Text>
            {"  "}
            <Text style={{ color: "rgba(255,255,255,0.55)" }}>{gift.tokens.toLocaleString()} ST</Text>
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/* ══════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════ */
export default function GiftSplashOverlay({ gift, recipientName, onHide }: Props) {
  if (!gift) return null;
  if (gift.tokens >= BIG_THRESHOLD) {
    return <BigSplash gift={gift} recipientName={recipientName} onHide={onHide} />;
  }
  return <SmallToast gift={gift} onHide={onHide} />;
}

const styles = StyleSheet.create({
  /* ── Toast ── */
  toastWrap: {
    position: "absolute",
    bottom: 120,
    right: 16,
    zIndex: 9999,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 12,
    minWidth: 150,
  },
  toastEmoji: { fontSize: 36 },
  toastText:  { gap: 2 },
  toastLabel: { fontSize: 13, fontFamily: "Inter_700Bold",      color: "#fff" },
  toastST:    { fontSize: 11, fontFamily: "Inter_400Regular",   color: "rgba(255,255,255,0.8)" },

  /* ── Big splash (bottom panel — does NOT cover the stream/chat above) ── */
  bigPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    zIndex: 9990,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  bigPanelContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 16,
    zIndex: 2,
  },
  bigCard: {
    width: width * 0.38,
    borderRadius: 18,
    overflow: "hidden",
    flexShrink: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 18,
  },
  bigCardGrad: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 6,
  },
  bigEmoji: {
    fontSize: 52,
    lineHeight: 60,
  },
  bigName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bigValue: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.85)",
  },
  bigLabelText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
});

import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
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
   Full-screen Lottie animation + gift card
══════════════════════════════════════════════ */
function BigSplash({ gift, recipientName, onHide }: { gift: SplashGift; recipientName?: string; onHide: () => void }) {
  const overlayOp  = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0)).current;
  const cardOp     = useRef(new Animated.Value(0)).current;
  const labelOp    = useRef(new Animated.Value(0)).current;
  const labelY     = useRef(new Animated.Value(24)).current;
  const lottieRef  = useRef<LottieView>(null);

  /* auto-hide duration: bigger gift = longer display */
  const displayMs = gift.tokens >= MEGA_THRESHOLD ? 4200 : gift.tokens >= EPIC_THRESHOLD ? 3600 : 3000;

  useEffect(() => {
    overlayOp.setValue(0); cardScale.setValue(0.4); cardOp.setValue(0);
    labelOp.setValue(0); labelY.setValue(24);

    Animated.parallel([
      Animated.timing(overlayOp, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 18 }),
      Animated.timing(cardOp,    { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(labelOp, { toValue: 1, duration: 350, delay: 350, useNativeDriver: true }),
      Animated.timing(labelY,  { toValue: 0,  duration: 350, delay: 350, useNativeDriver: true }),
    ]).start();

    setTimeout(() => lottieRef.current?.play(), 80);

    const timer = setTimeout(() => {
      Animated.timing(overlayOp, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onHide());
    }, displayMs);

    return () => clearTimeout(timer);
  }, []);

  const eurLabel = gift.tokens >= 100
    ? `€${Math.round(gift.tokens / 100)}`
    : `€${(gift.tokens / 100).toFixed(2)}`;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={[styles.bigOverlay, { opacity: overlayOp }]} pointerEvents="none">

        {/* Dark scrim */}
        <LinearGradient
          colors={["rgba(0,0,0,0.80)", "rgba(0,0,0,0.50)", "rgba(0,0,0,0.80)"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* ── Lottie full-screen background animation ── */}
        <LottieView
          ref={lottieRef}
          source={getLottieSource(gift.tokens)}
          style={styles.lottieFullscreen}
          autoPlay={false}
          loop={false}
          resizeMode="cover"
          renderMode={Platform.OS === "web" ? "AUTOMATIC" : "HARDWARE"}
        />

        {/* ── Gift info card ── */}
        <Animated.View style={[styles.bigCard, { transform: [{ scale: cardScale }], opacity: cardOp }]}>
          <LinearGradient colors={gift.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigCardGrad}>
            <View style={[styles.bigGlow, { backgroundColor: gift.grad[1] + "66" }]} />
            <Text style={styles.bigEmoji}>{gift.emoji}</Text>
            <Text style={styles.bigName}>{gift.label}</Text>
            <Text style={styles.bigValue}>{gift.tokens.toLocaleString()} ST · {eurLabel}</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Sender label ── */}
        <Animated.View style={[styles.bigLabel, { opacity: labelOp, transform: [{ translateY: labelY }] }]}>
          <Text style={styles.bigLabelText}>
            🎁 You gifted{recipientName ? ` ${recipientName}` : ""} a{" "}
            <Text style={{ fontFamily: "Inter_700Bold" }}>{gift.label}</Text>!
          </Text>
        </Animated.View>

      </Animated.View>
    </Modal>
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

  /* ── Big splash ── */
  bigOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
  },
  lottieFullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bigCard: {
    width: width * 0.60,
    borderRadius: 26,
    overflow: "hidden",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    elevation: 28,
  },
  bigCardGrad: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 22,
    gap: 10,
  },
  bigGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    top: "10%",
  },
  bigEmoji: {
    fontSize: 96,
    lineHeight: 112,
    zIndex: 1,
  },
  bigName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    zIndex: 1,
  },
  bigValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.85)",
    zIndex: 1,
  },
  bigLabel: {
    paddingHorizontal: 26,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 22,
    zIndex: 1,
  },
  bigLabelText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    textAlign: "center",
  },
});

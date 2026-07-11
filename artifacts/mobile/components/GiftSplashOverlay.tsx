import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
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

/* ─── threshold: €10 = 1000 ST triggers the big animation ─── */
const BIG_THRESHOLD = 1000;

/* ══════════════════════════════════════════════
   SMALL TOAST  — gift < €10
   Slides in from right, floats up, fades out ~1 s
   No modal backdrop — just a floating card
══════════════════════════════════════════════ */
function SmallToast({ gift, onHide }: { gift: SplashGift; onHide: () => void }) {
  const translateX = useRef(new Animated.Value(160)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 10 }),
      Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -28, duration: 400, useNativeDriver: true }),
      ]).start(() => onHide());
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastWrap,
        { opacity, transform: [{ translateX }, { translateY }] },
      ]}
    >
      <LinearGradient
        colors={gift.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toastCard}
      >
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
   Full-screen modal with large emoji + particles
══════════════════════════════════════════════ */
function FloatingParticle({ color, delay }: { color: string; delay: number }) {
  const y  = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;
  const x  = useRef(new Animated.Value((Math.random() - 0.5) * width * 0.7)).current;

  useEffect(() => {
    const run = () => {
      y.setValue(0); op.setValue(0);
      x.setValue((Math.random() - 0.5) * width * 0.7);
      Animated.parallel([
        Animated.timing(y,  { toValue: -120, duration: 1800 + Math.random() * 700, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(op, { toValue: 0.9, duration: 300, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0,   duration: 900, useNativeDriver: true }),
        ]),
      ]).start(() => setTimeout(run, 200 + Math.random() * 800));
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: "40%",
        left: "50%",
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: color,
        transform: [{ translateX: x }, { translateY: y }],
        opacity: op,
      }}
    />
  );
}

function BigSplash({ gift, recipientName, onHide }: { gift: SplashGift; recipientName?: string; onHide: () => void }) {
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const textAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    floatAnim.setValue(0);
    textAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 20 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -20, duration: 850, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 850, useNativeDriver: true }),
      ])),
    ]).start();

    Animated.timing(textAnim, { toValue: 1, duration: 380, delay: 320, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, { toValue: 0, duration: 550, useNativeDriver: true }).start(() => onHide());
    }, 3400);

    return () => clearTimeout(timer);
  }, []);

  const eurValue = gift.tokens >= 100
    ? `€${Math.round(gift.tokens / 100)}`
    : `€${(gift.tokens / 100).toFixed(2)}`;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={[styles.bigOverlay, { opacity: opacityAnim }]} pointerEvents="none">
        {/* Dark scrim */}
        <LinearGradient
          colors={["rgba(0,0,0,0.82)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.82)"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <FloatingParticle key={i} color={i % 2 === 0 ? gift.grad[0] : gift.grad[1]} delay={i * 180} />
        ))}

        {/* Gift card */}
        <Animated.View style={[styles.bigCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={gift.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigCardGrad}>
            <View style={[styles.bigGlow, { backgroundColor: gift.grad[1] + "55" }]} />
            <Animated.Text style={[styles.bigEmoji, { transform: [{ translateY: floatAnim }] }]}>
              {gift.emoji}
            </Animated.Text>
            <Text style={styles.bigName}>{gift.label}</Text>
            <Text style={styles.bigTokens}>{gift.tokens.toLocaleString()} ST · {eurValue}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Label */}
        <Animated.View style={[styles.bigLabel, {
          opacity: textAnim,
          transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
        }]}>
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
   MAIN EXPORT — routes between small / big
══════════════════════════════════════════════ */
export default function GiftSplashOverlay({ gift, recipientName, onHide }: Props) {
  if (!gift) return null;

  if (gift.tokens >= BIG_THRESHOLD) {
    return <BigSplash gift={gift} recipientName={recipientName} onHide={onHide} />;
  }

  return <SmallToast gift={gift} onHide={onHide} />;
}

const styles = StyleSheet.create({
  /* ── Small toast ── */
  toastWrap: {
    position: "absolute",
    bottom: 110,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 14,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    minWidth: 140,
  },
  toastEmoji: { fontSize: 34 },
  toastText:  { gap: 2 },
  toastLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  toastST:    { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },

  /* ── Big splash ── */
  bigOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  bigCard: {
    width: width * 0.62,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 26,
  },
  bigCardGrad: {
    alignItems: "center",
    paddingVertical: 44,
    paddingHorizontal: 24,
    gap: 12,
  },
  bigGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: "8%",
  },
  bigEmoji: { fontSize: 110, lineHeight: 126 },
  bigName:  {
    fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bigTokens: {
    fontSize: 16, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.85)",
  },
  bigLabel: {
    paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
  },
  bigLabelText: {
    fontSize: 16, fontFamily: "Inter_400Regular", color: "#fff", textAlign: "center",
  },
});

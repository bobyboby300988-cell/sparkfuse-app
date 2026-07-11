import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, StyleSheet, Text, View } from "react-native";

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

const { width, height } = Dimensions.get("window");
const AUTO_HIDE_MS = 3200;

export default function GiftSplashOverlay({ gift, recipientName, onHide }: Props) {
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const textAnim   = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gift) return;

    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    floatAnim.setValue(0);
    textAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 6,
        bounciness: 18,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -18, duration: 900, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
        ])
      ),
    ]).start();

    Animated.timing(textAnim, {
      toValue: 1,
      duration: 400,
      delay: 300,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onHide());
    }, AUTO_HIDE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gift]);

  if (!gift) return null;

  const eurValue = (gift.tokens / 100).toFixed(gift.tokens < 100 ? 2 : 0);

  return (
    <Modal transparent animationType="none" visible={!!gift} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Dark scrim */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LinearGradient
            colors={["rgba(0,0,0,0.78)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.78)"]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Gift card */}
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={gift.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGrad}
          >
            {/* Glow circle behind emoji */}
            <View style={[styles.glowCircle, { backgroundColor: gift.grad[1] + "55" }]} />

            {/* Floating emoji */}
            <Animated.Text style={[styles.emoji, { transform: [{ translateY: floatAnim }] }]}>
              {gift.emoji}
            </Animated.Text>

            <Text style={styles.giftName}>{gift.label}</Text>
            <Text style={styles.giftTokens}>{gift.tokens.toLocaleString()} ST · €{eurValue}</Text>
          </LinearGradient>
        </Animated.View>

        {/* "You gifted …" label */}
        <Animated.View style={[styles.label, {
          opacity: textAnim,
          transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Text style={styles.labelText}>
            🎁 You gifted{recipientName ? ` ${recipientName}` : ""} a{" "}
            <Text style={{ fontFamily: "Inter_700Bold" }}>{gift.label}</Text>!
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  card: {
    width: width * 0.62,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 24,
  },
  cardGrad: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  glowCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: "10%",
  },
  emoji: {
    fontSize: 100,
    lineHeight: 115,
  },
  giftName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  giftTokens: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.85)",
  },
  label: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
  },
  labelText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    textAlign: "center",
  },
});

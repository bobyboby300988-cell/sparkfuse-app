import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

const KEYWORDS = [
  { label: "Love",           icon: "❤️",  color: "#FF3366" },
  { label: "Pleasure",       icon: "🔥",  color: "#FF6B35" },
  { label: "Business",       icon: "💼",  color: "#6366F1" },
  { label: "Video Calls",    icon: "📹",  color: "#22C55E" },
  { label: "Socialization",  icon: "🌍",  color: "#F59E0B" },
];

function KeywordPill({
  label,
  icon,
  color,
  delay,
}: {
  label: string;
  icon: string;
  color: string;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pill,
        { opacity, transform: [{ translateY }], borderColor: color + "55", backgroundColor: color + "18" },
      ]}
    >
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslateY = useRef(new Animated.Value(30)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Tagline
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Button
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.spring(btnTranslateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.18, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={["#0D0D1A", "#1A0A14", "#0D0D1A"]}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}
    >
      {/* Background glow */}
      <Animated.View
        style={[styles.glow, { transform: [{ scale: glowScale }] }]}
        pointerEvents="none"
      />

      {/* Logo block */}
      <Animated.View
        style={[styles.logoBlock, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <View style={styles.flameWrap}>
          <Ionicons name="flame" size={72} color="#FF3366" />
        </View>
        <Text style={styles.appName}>SPARK</Text>
        <Text style={styles.appSub}>Connect. Explore. Thrive.</Text>
      </Animated.View>

      {/* Keywords */}
      <Animated.View style={[styles.keywordsBlock, { opacity: taglineOpacity }]}>
        <Text style={styles.keywordsTitle}>Everything in one place</Text>
        <View style={styles.pillsRow}>
          {KEYWORDS.map((kw, i) => (
            <KeywordPill
              key={kw.label}
              label={kw.label}
              icon={kw.icon}
              color={kw.color}
              delay={600 + i * 120}
            />
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View
        style={[
          styles.ctaBlock,
          {
            opacity: btnOpacity,
            transform: [{ translateY: btnTranslateY }],
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.joinBtn}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/onboarding");
          }}
        >
          <LinearGradient
            colors={["#FF3366", "#FF6B35"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.joinGradient}
          >
            <Ionicons name="flame" size={20} color="#fff" />
            <Text style={styles.joinText}>Get Started — It's Free</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our Terms & Privacy Policy.
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  glow: {
    position: "absolute",
    top: H * 0.15,
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: W * 0.425,
    backgroundColor: "rgba(255,51,102,0.12)",
    alignSelf: "center",
  },
  logoBlock: {
    alignItems: "center",
    marginTop: H * 0.1,
    gap: 12,
  },
  flameWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,51,102,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,51,102,0.3)",
  },
  appName: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 10,
  },
  appSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  keywordsBlock: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  keywordsTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 16,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  ctaBlock: {
    width: "100%",
    paddingHorizontal: 24,
    gap: 12,
    alignItems: "center",
  },
  joinBtn: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  joinGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  joinText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
  },
});

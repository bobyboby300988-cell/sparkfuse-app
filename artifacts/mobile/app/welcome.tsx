import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import BrandLogo from "@/components/BrandLogo";
import { useApp } from "@/context/AppContext";
import { buildPayPalCheckoutUrl } from "@/config/payments";
import { useTranslation } from "react-i18next";

const { width: W } = Dimensions.get("window");

const API_BASE = "https://match-maker-2025ap.replit.app/api";
const APP_DOMAIN = "https://match-maker-2025ap.replit.app";

const KEYWORDS = [
  { label: "Love",          icon: "❤️", color: "#FF3366" },
  { label: "Pleasure",      icon: "🔥", color: "#FF6B35" },
  { label: "Business",      icon: "💼", color: "#818CF8" },
  { label: "Video Calls",   icon: "📹", color: "#22C55E" },
  { label: "Socialization", icon: "🌍", color: "#F59E0B" },
];

const BENEFITS = [
  { icon: "infinite-outline",       label: "Unlimited swipes & matches" },
  { icon: "chatbubbles-outline",    label: "Chat, voice & media sharing" },
  { icon: "videocam-outline",       label: "Live video calls" },
  { icon: "briefcase-outline",      label: "Dating & business coaches" },
  { icon: "lock-open-outline",      label: "Exclusive creator content" },
  { icon: "ban-outline",            label: "No ads. No restrictions. Ever." },
];

function Pill({ label, icon, color, delay }: { label: string; icon: string; color: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(ty, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.pill, { opacity, transform: [{ translateY: ty }], borderColor: color + "55", backgroundColor: color + "18" }]}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setSubscribed } = useApp();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const isAuthenticated = !!isSignedIn;
  // Mirror the 6-second timeout from _layout.tsx: stop blocking buttons even
  // if Clerk's isLoaded stalls after a payment redirect on web.
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const clerkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (authLoaded) return;
    clerkTimerRef.current = setTimeout(() => setClerkTimedOut(true), 6000);
    return () => { if (clerkTimerRef.current) clearTimeout(clerkTimerRef.current); };
  }, [authLoaded]);
  const authLoading = !authLoaded && !clerkTimedOut;
  const login = async () => router.push("/sign-in");
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingPayPal, setLoadingPayPal] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showUnderage, setShowUnderage] = useState(false);
  const gateOpacity = useRef(new Animated.Value(1)).current;

  // Restore age verification from storage so the gate doesn't reappear
  // after a payment redirect causes the page to reload.
  useEffect(() => {
    AsyncStorage.getItem("ageVerified").then((val) => {
      if (val === "1") setAgeVerified(true);
    });
  }, []);

  const handleConfirmAdult = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AsyncStorage.setItem("ageVerified", "1");
    Animated.timing(gateOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setAgeVerified(true);
    });
  };

  const handleDenyAdult = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowUnderage(true);
  };

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(cardTY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleStripe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mark subscribed before opening the browser — payment redirects reload
    // the page so the code after openBrowserAsync may never run.
    await AsyncStorage.setItem("@spark/subscribed", "true");
    setLoadingStripe(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/subscription-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${APP_DOMAIN}/sign-up`,
          cancelUrl: `${APP_DOMAIN}/welcome`,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Checkout failed");
      const { url } = await res.json();
      setLoadingStripe(false);
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
      await setSubscribed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Pay first → then account: if already signed in go to onboarding, else sign up
      if (isAuthenticated) {
        router.replace("/onboarding");
      } else {
        router.replace("/sign-up");
      }
    } catch (err: any) {
      setLoadingStripe(false);
      Alert.alert("Error", err.message ?? "Something went wrong. Try again.");
    }
  };

  const handlePayPal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mark subscribed before opening the browser — PayPal redirect reloads
    // the page so the code after openBrowserAsync may never run.
    await AsyncStorage.setItem("@spark/subscribed", "true");
    setLoadingPayPal(true);
    const paypalUrl = buildPayPalCheckoutUrl({
      amountEur: 2,
      itemName: "SparkFuse Premium — 1 month",
      returnUrl: `${APP_DOMAIN}/sign-up`,
      cancelUrl: `${APP_DOMAIN}/welcome`,
    });
    try {
      setLoadingPayPal(false);
      await WebBrowser.openBrowserAsync(paypalUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
      await setSubscribed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isAuthenticated) {
        router.replace("/onboarding");
      } else {
        router.replace("/sign-up");
      }
    } catch (err: any) {
      setLoadingPayPal(false);
      Alert.alert("Error", err.message ?? "Something went wrong. Try again.");
    }
  };

  const anyLoading = loadingStripe || loadingPayPal;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 16);

  return (
    <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
      {/* Glow blob */}
      <Animated.View style={[styles.glow, { transform: [{ scale: glowAnim }] }]} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 12 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Logo ── */}
        <Animated.View style={[styles.logoBlock, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.flameRing}>
            <BrandLogo size={56} />
          </View>
          <Text style={styles.appName}>SPARKFUSE</Text>
          <Text style={styles.appSub}>{t("welcome.tagline")}</Text>
        </Animated.View>

        {/* ── Keyword pills ── */}
        <View style={styles.pillsSection}>
          <Text style={styles.pillsTitle}>{t("welcome.everythingInOne")}</Text>
          <View style={styles.pillsRow}>
            {KEYWORDS.map((kw, i) => (
              <Pill key={kw.label} label={kw.label} icon={kw.icon} color={kw.color} delay={400 + i * 100} />
            ))}
          </View>
        </View>

        {/* ── Payment card ── */}
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTY }] }]}>

          {/* Price badge */}
          <View style={styles.priceBadge}>
            <View style={styles.priceLeft}>
              <Text style={styles.priceAmount}>€2</Text>
              <View>
                <Text style={styles.pricePer}>/ month</Text>
                <Text style={styles.priceNote}>Cancel anytime</Text>
              </View>
            </View>
            <View style={styles.noRestrTag}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={styles.noRestrText}>No restrictions</Text>
            </View>
          </View>

          {/* Benefits list */}
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.label} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={b.icon as any} size={16} color="#FF3366" />
                </View>
                <Text style={styles.benefitLabel}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Stripe button */}
          <TouchableOpacity
            style={[styles.stripeBtn, anyLoading && { opacity: 0.6 }]}
            onPress={handleStripe}
            disabled={anyLoading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#FF3366", "#FF6B35"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stripeBtnInner}
            >
              {loadingStripe ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.stripeBtnText}>Pay €2 / month with Card</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divLabel}>or</Text>
            <View style={styles.divLine} />
          </View>

          {/* PayPal button */}
          <TouchableOpacity
            style={[styles.paypalBtn, anyLoading && { opacity: 0.6 }]}
            onPress={handlePayPal}
            disabled={anyLoading}
            activeOpacity={0.88}
          >
            {loadingPayPal ? (
              <ActivityIndicator color="#003087" />
            ) : (
              <Text style={styles.paypalBtnText}>
                <Text style={{ color: "#003087" }}>Pay</Text>
                <Text style={{ color: "#009CDE" }}>Pal</Text>
                <Text style={{ color: "#003087", fontSize: 14, fontFamily: "Inter_500Medium" }}>  · €2 / month</Text>
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.finePrint}>
            €2 billed monthly · All features included · No restrictions{"\n"}Cancel anytime · By joining you agree to our Terms
          </Text>
        </Animated.View>

        {/* ── Already have an account? Big login card ── */}
        {!isAuthenticated && (
          <Animated.View style={[styles.loginCard, { opacity: cardOpacity, transform: [{ translateY: cardTY }] }]}>
            <Text style={styles.loginCardTitle}>{t("welcome.alreadySubscribed")}</Text>
            <Text style={styles.loginCardSubtitle}>{t("welcome.loginDescription")}</Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await login();
              }}
              activeOpacity={0.88}
              disabled={authLoading}
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.loginBtnText}>{t("welcome.logIn")}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Browse / create account link */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            Haptics.selectionAsync();
            if (isAuthenticated) {
              router.push("/onboarding");
            } else {
              router.push("/sign-up");
            }
          }}
          activeOpacity={0.7}
          disabled={authLoading}
        >
          <Text style={styles.skipText}>
            {isAuthenticated ? t("welcome.browseFirst") : t("welcome.createAccount")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Age gate ── */}
      {!ageVerified && (
        <Animated.View style={[styles.ageGate, { opacity: gateOpacity }]}>
          {showUnderage ? (
            <View style={styles.ageCard}>
              <Ionicons name="alert-circle" size={44} color="#FF3366" />
              <Text style={styles.ageTitle}>Sorry</Text>
              <Text style={styles.ageBody}>
                SparkFuse is only available to adults 18 years or older. Please come back once you meet the age requirement.
              </Text>
            </View>
          ) : (
            <View style={styles.ageCard}>
              <View style={styles.age18Badge}>
                <Text style={styles.age18Text}>18+</Text>
              </View>
              <Text style={styles.ageTitle}>Adults Only</Text>
              <Text style={styles.ageBody}>
                SparkFuse contains dating content intended for adults. You must be at least 18 years old to continue.
              </Text>
              <TouchableOpacity style={styles.ageConfirmBtn} onPress={handleConfirmAdult} activeOpacity={0.88}>
                <LinearGradient
                  colors={["#FF3366", "#FF6B35"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ageConfirmBtnInner}
                >
                  <Text style={styles.ageConfirmText}>I am 18 or older</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ageDenyBtn} onPress={handleDenyAdult} activeOpacity={0.7}>
                <Text style={styles.ageDenyText}>I am under 18</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: "absolute",
    top: "10%",
    alignSelf: "center",
    width: W * 0.8,
    height: W * 0.8,
    borderRadius: W * 0.4,
    backgroundColor: "rgba(255,51,102,0.10)",
  },
  scroll: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 28,
  },

  /* Logo */
  logoBlock: { alignItems: "center", gap: 10 },
  flameRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(255,51,102,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,51,102,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 46,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 10,
  },
  appSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },

  /* Pills */
  pillsSection: { alignItems: "center", gap: 12 },
  pillsTitle: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* Payment card */
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,51,102,0.25)",
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },

  /* Price badge */
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,51,102,0.12)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,51,102,0.3)",
  },
  priceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  priceAmount: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#FF3366", lineHeight: 52 },
  pricePer: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  priceNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", marginTop: 2 },
  noRestrTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  noRestrText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#22C55E" },

  /* Benefits */
  benefits: { gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,51,102,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#E0DCF0", flex: 1 },

  /* Stripe btn */
  stripeBtn: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  stripeBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  stripeBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  /* Divider */
  divRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  divLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)" },

  /* PayPal btn */
  paypalBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFC439",
    paddingVertical: 15,
    borderRadius: 28,
    shadowColor: "#FFC439",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  paypalBtnText: { fontSize: 19, fontFamily: "Inter_700Bold" },

  /* Fine print */
  finePrint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 16,
  },

  /* Big login card */
  loginCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    padding: 22,
    gap: 14,
    alignItems: "center",
  },
  loginCardTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  loginCardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 18,
  },
  loginBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 28,
    paddingVertical: 17,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  /* Skip */
  skipBtn: { paddingVertical: 8 },
  skipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    textDecorationLine: "underline",
  },

  /* Age gate */
  ageGate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,10,0.97)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  ageCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,51,102,0.3)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  age18Badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,51,102,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,51,102,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  age18Text: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FF3366" },
  ageTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 4 },
  ageBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  ageConfirmBtn: { width: "100%", borderRadius: 26, overflow: "hidden" },
  ageConfirmBtnInner: { paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  ageConfirmText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  ageDenyBtn: { paddingVertical: 10 },
  ageDenyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
    textDecorationLine: "underline",
  },
});

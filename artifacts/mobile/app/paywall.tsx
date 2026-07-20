import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@clerk/expo";
import { buildPayPalCheckoutUrl } from "@/config/payments";
import { getApiUrl } from "@/lib/api";

const PAID_PENDING_KEY = "@spark/paid_pending";

const PERK_ICONS = ["heart", "chatbubbles", "videocam", "star", "shield-checkmark"] as const;
const PERK_KEYS = ["swipes", "chat", "videoCalls", "coaches", "noAds"] as const;

function getAppOrigin(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://workspace.2025ap.replit.app";
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { setSubscribed } = useApp();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingPayPal, setLoadingPayPal] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  const handleStripe = async () => {
    setLoadingStripe(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const origin = getAppOrigin();
      const base = getApiUrl();

      // Success URL goes to /sign-up so new users can register immediately after paying.
      // Existing users landing on /sign-up will be redirected to / by the layout.
      const successUrl = Platform.OS === "web"
        ? `${origin}/sign-up?paid=1`
        : `${origin}/success`;
      const cancelUrl = Platform.OS === "web"
        ? `${origin}/?stripe_sub=cancel`
        : `${origin}/cancel`;

      const res = await fetch(`${base}/api/stripe/subscription-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ successUrl, cancelUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Could not start checkout");
      }
      const { url } = (await res.json()) as { url: string };

      if (Platform.OS === "web" && typeof window !== "undefined") {
        // Store pending flag before leaving the page so it survives the Stripe redirect
        try { localStorage.setItem(PAID_PENDING_KEY, "true"); } catch {}
        setLoadingStripe(false);
        window.location.href = url;
        return;
      }

      setLoadingStripe(false);
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: false,
      });
      // Mark payment as pending locally so AppContext can sync with server after sign-up
      await AsyncStorage.setItem(PAID_PENDING_KEY, "true");
      await setSubscribed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/sign-up");
    } catch (err: any) {
      setLoadingStripe(false);
      Alert.alert("Error", err.message ?? "Something went wrong. Please try again.");
    }
  };

  const handlePayPal = async () => {
    setLoadingPayPal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const origin = getAppOrigin();
      const paypalUrl = buildPayPalCheckoutUrl({
        amountEur: 2,
        itemName: "SparkFuse Premium — 1 lună",
        returnUrl: Platform.OS === "web" ? `${origin}/sign-up?paid=1` : `${origin}/success`,
        cancelUrl: Platform.OS === "web" ? `${origin}/?paypal=cancel` : `${origin}/cancel`,
      });
      setLoadingPayPal(false);

      if (Platform.OS === "web" && typeof window !== "undefined") {
        // On web: redirect the full page to PayPal (same as Stripe), not a popup.
        // PayPal will send the user back to returnUrl (/sign-up?paid=1).
        try { localStorage.setItem(PAID_PENDING_KEY, "true"); } catch {}
        window.location.href = paypalUrl;
        return;
      }

      await WebBrowser.openBrowserAsync(paypalUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: false,
      });
      // Mark payment as pending locally — AppContext syncs after sign-up
      await AsyncStorage.setItem(PAID_PENDING_KEY, "true");
      await setSubscribed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/sign-up");
    } catch (err: any) {
      setLoadingPayPal(false);
      Alert.alert("Error", err.message ?? "Something went wrong. Please try again.");
    }
  };

  const handleRestore = async () => {
    setLoadingRestore(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await getToken();
      const base = getApiUrl();
      const res = await fetch(`${base}/api/subscription/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as any).restored) {
        await setSubscribed();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ " + t("paywall.restoredTitle"), t("paywall.restoredDesc"), [
          { text: t("paywall.continue"), onPress: () => router.replace("/onboarding") },
        ]);
      } else {
        Alert.alert(t("paywall.notFoundTitle"), t("paywall.notFoundDesc"));
      }
    } catch {
      Alert.alert(t("paywall.error"), t("paywall.errorVerify"));
    } finally {
      setLoadingRestore(false);
    }
  };

  const anyLoading = loadingStripe || loadingPayPal || loadingRestore;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Text style={styles.logoEmoji}>✦</Text>
          </View>
          <Text style={styles.appName}>SparkFuse</Text>
          <Text style={styles.tagline}>{t("paywall.hero")}</Text>
          <Text style={styles.subtitle}>{t("paywall.subtitle")}</Text>
        </View>

        <View style={styles.priceBadge}>
          <Text style={styles.priceAmount}>€2</Text>
          <View>
            <Text style={styles.pricePer}>{t("paywall.perMonth")}</Text>
            <Text style={styles.priceCancel}>{t("paywall.cancelAnytime")}</Text>
          </View>
        </View>

        <View style={styles.perks}>
          {PERK_KEYS.map((key, i) => (
            <View key={key} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons name={PERK_ICONS[i] as any} size={18} color="#FF3366" />
              </View>
              <Text style={styles.perkLabel}>{t(`paywall.perks.${key}`)}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, anyLoading && styles.btnDisabled]}
          onPress={handleStripe}
          disabled={anyLoading}
          activeOpacity={0.88}
        >
          {loadingStripe ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.btnText}>Plătește cu Cardul (Stripe)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>sau</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.btnPayPal, anyLoading && styles.btnDisabled]}
          onPress={handlePayPal}
          disabled={anyLoading}
          activeOpacity={0.88}
        >
          {loadingPayPal ? (
            <ActivityIndicator color="#003087" />
          ) : (
            <Text style={styles.btnPayPalText}>
              <Text style={{ color: "#003087" }}>Pay</Text>
              <Text style={{ color: "#009cde" }}>Pal</Text>
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ai plătit deja?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.btnRestore, anyLoading && styles.btnDisabled]}
          onPress={handleRestore}
          disabled={anyLoading}
          activeOpacity={0.88}
        >
          {loadingRestore ? (
            <ActivityIndicator color="#FF3366" />
          ) : (
            <>
              <Ionicons name="refresh-circle-outline" size={20} color="#FF3366" />
              <Text style={styles.btnRestoreText}>{t("paywall.restoreBtn")}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.finePrint}>{t("paywall.finePrint")}</Text>
        <Text style={styles.copyright}>© 2026 SparkFuse</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0B12" },
  scroll: { paddingHorizontal: 28, paddingBottom: 48, alignItems: "center" },
  hero: { alignItems: "center", paddingTop: 48, gap: 8, marginBottom: 32 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#FF336620", borderWidth: 2, borderColor: "#FF3366",
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  logoEmoji: { fontSize: 32, color: "#FF3366" },
  appName: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1 },
  tagline: { fontSize: 20, fontFamily: "Inter_600SemiBold", color: "#FF3366" },
  subtitle: {
    fontSize: 15, fontFamily: "Inter_400Regular", color: "#9A93B3",
    textAlign: "center", lineHeight: 22, marginTop: 4,
  },
  priceBadge: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FF336615", borderWidth: 1.5, borderColor: "#FF336640",
    borderRadius: 20, paddingHorizontal: 28, paddingVertical: 18, marginBottom: 32,
  },
  priceAmount: { fontSize: 52, fontFamily: "Inter_700Bold", color: "#FF3366", lineHeight: 56 },
  pricePer: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  priceCancel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9A93B3", marginTop: 2 },
  perks: { width: "100%", gap: 14, marginBottom: 36 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  perkIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FF336618", justifyContent: "center", alignItems: "center",
  },
  perkLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#E8E4F0" },
  btn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#FF3366", paddingVertical: 17, borderRadius: 32,
    shadowColor: "#FF3366", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10, marginBottom: 14,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  dividerRow: {
    flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 14, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2A253A" },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B6480" },
  btnPayPal: {
    width: "100%", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFC439", paddingVertical: 16, borderRadius: 32,
    shadowColor: "#FFC439", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, marginBottom: 20,
  },
  btnPayPalText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  btnRestore: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: "#FF336640", backgroundColor: "#FF336610",
    paddingVertical: 14, borderRadius: 32, marginBottom: 20,
  },
  btnRestoreText: { color: "#FF3366", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  finePrint: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B6480",
    textAlign: "center", lineHeight: 17,
  },
  copyright: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.18)", textAlign: "center",
    letterSpacing: 0.5, marginTop: 8,
  },
});

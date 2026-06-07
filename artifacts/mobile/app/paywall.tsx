import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "https://match-maker-dumitru8830.replit.app/api";

const PERKS = [
  { icon: "heart", label: "Unlimited swipes & matches" },
  { icon: "chatbubbles", label: "Chat with all your matches" },
  { icon: "videocam", label: "Free video calls" },
  { icon: "star", label: "Book dating coaches" },
  { icon: "shield-checkmark", label: "No ads, ever" },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { setSubscribed } = useApp();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await fetch(`${API_BASE}/stripe/subscription-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: "https://match-maker-dumitru8830.replit.app/success",
          cancelUrl: "https://match-maker-dumitru8830.replit.app/cancel",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Could not start checkout");
      }

      const { url } = await res.json() as { url: string };
      setLoading(false);

      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: false,
      });

      // When browser closes, mark as subscribed and enter the app
      await setSubscribed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo / headline */}
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Text style={styles.logoEmoji}>✦</Text>
          </View>
          <Text style={styles.appName}>Spark</Text>
          <Text style={styles.tagline}>Find your person.</Text>
          <Text style={styles.subtitle}>
            Get full access to every feature — for less than a coffee a month.
          </Text>
        </View>

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceAmount}>€1</Text>
          <View>
            <Text style={styles.pricePer}>per month</Text>
            <Text style={styles.priceCancel}>Cancel anytime</Text>
          </View>
        </View>

        {/* Perks */}
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon as any} size={18} color="#FF3366" />
              </View>
              <Text style={styles.perkLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnLoading]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.btnText}>Start for €1 / month</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Fine print */}
        <Text style={styles.finePrint}>
          Billed monthly via Stripe. Cancel any time from your Stripe account.
          By subscribing you agree to our Terms of Service.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0B12",
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
    marginBottom: 32,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF336620",
    borderWidth: 2,
    borderColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 32,
    color: "#FF3366",
  },
  appName: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#FF3366",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#9A93B3",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FF336615",
    borderWidth: 1.5,
    borderColor: "#FF336640",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 18,
    marginBottom: 32,
  },
  priceAmount: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    color: "#FF3366",
    lineHeight: 56,
  },
  pricePer: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  priceCancel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9A93B3",
    marginTop: 2,
  },
  perks: {
    width: "100%",
    gap: 14,
    marginBottom: 36,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF336618",
    justifyContent: "center",
    alignItems: "center",
  },
  perkLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#E8E4F0",
  },
  btn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FF3366",
    paddingVertical: 17,
    borderRadius: 32,
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
  },
  btnLoading: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  finePrint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#6B6480",
    textAlign: "center",
    lineHeight: 17,
  },
});

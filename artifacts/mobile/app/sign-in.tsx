import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useSSO } from "@clerk/expo";
import BrandLogo from "@/components/BrandLogo";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router, type Href } from "expo-router";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function SignInScreen() {
  useWarmUpBrowser();
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const finish = useCallback(() => {
    router.replace("/onboarding" as Href);
  }, []);

  const handleSubmit = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          finish();
        },
      });
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) return;
            finish();
          },
        });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const canSubmit = !!emailAddress && !!password && fetchStatus !== "fetching";

  return (
    <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.flameRing}>
            <BrandLogo size={40} />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to keep the sparks flying</Text>

          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && { opacity: 0.6 }]}
            onPress={handleGoogle}
            disabled={googleLoading}
            activeOpacity={0.88}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1F1F1F" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#1F1F1F" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divLabel}>or</Text>
            <View style={styles.divLine} />
          </View>

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={emailAddress}
            onChangeText={setEmailAddress}
          />
          {errors.fields.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={password}
            onChangeText={setPassword}
          />
          {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#FF3366", "#FF6B35"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnInner}
            >
              {fetchStatus === "fetching" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign in</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href={"/sign-up" as Href}>
              <Text style={styles.linkAction}>Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, alignItems: "center", gap: 6 },
  flameRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,51,102,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,51,102,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginBottom: 24 },
  googleBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 26,
  },
  googleBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1F1F1F" },
  divRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  divLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)" },
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  error: { color: "#FF6B6B", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, alignSelf: "flex-start" },
  submitBtn: { width: "100%", borderRadius: 26, overflow: "hidden", marginTop: 24 },
  submitBtnInner: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { flexDirection: "row", marginTop: 20 },
  linkText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  linkAction: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FF3366" },
});

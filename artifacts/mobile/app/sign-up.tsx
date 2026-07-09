import { Ionicons } from "@expo/vector-icons";
import { useSignUp, useSSO } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router, type Href } from "expo-router";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
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
import { useWarmUpBrowser } from "./sign-in";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  useWarmUpBrowser();
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finish = useCallback(() => {
    router.replace("/onboarding" as Href);
  }, []);

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress, password });
    if (error) return;

    await signUp.verifications.sendEmailCode();
    setPendingVerification(true);
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
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
      console.error("Google sign-up error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const canSubmit = !!emailAddress && !!password && fetchStatus !== "fetching";

  if (pendingVerification) {
    return (
      <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>We sent a code to {emailAddress}</Text>

          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="123456"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={code}
            onChangeText={setCode}
          />
          {errors.fields.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}

          <TouchableOpacity style={styles.submitBtn} onPress={handleVerify} activeOpacity={0.88}>
            <LinearGradient colors={["#FF3366", "#FF6B35"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
              <Text style={styles.submitBtnText}>Verify</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => signUp.verifications.sendEmailCode()}>
            <Text style={styles.linkAction}>Resend code</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.flameRing}>
            <Ionicons name="flame" size={44} color="#FF3366" />
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join SparkFuse today</Text>

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
          {errors.fields.emailAddress && <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>}

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
                <Text style={styles.submitBtnText}>Sign up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href={"/sign-in" as Href}>
              <Text style={styles.linkAction}>Sign in</Text>
            </Link>
          </View>

          <View nativeID="clerk-captcha" />
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

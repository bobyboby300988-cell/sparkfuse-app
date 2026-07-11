import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useAuth } from "@clerk/expo";
import BrandLogo from "@/components/BrandLogo";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, fetchStatus } = useSignIn();
  const { signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isLoading = fetchStatus === "fetching" || loading;

  const attemptSignIn = async () => {
    if (!signIn) return false;
    const { error } = await signIn.password({
      emailAddress: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      const code: string = (error as any)?.code ?? "";
      const msg =
        code === "form_password_incorrect"
          ? "Incorrect password. Please try again."
          : code === "form_identifier_not_found"
          ? "No account found with that email."
          : code === "form_param_format_invalid"
          ? "Please enter a valid email address."
          : (error as any)?.longMessage ?? (error as any)?.message ?? "Sign in failed. Please try again.";
      setErrorMsg(msg);
      return false;
    }
    if (signIn.status === "complete") {
      await signIn.finalize();
      return true;
    }
    setErrorMsg("Sign in incomplete. Please try again.");
    return false;
  };

  const isSessionError = (err: any) => {
    const code: string = err?.errors?.[0]?.code ?? err?.code ?? "";
    const msg: string = (err?.errors?.[0]?.message ?? err?.message ?? "").toLowerCase();
    return (
      code === "single_session_mode" ||
      code.includes("session") ||
      msg.includes("already signed in") ||
      msg.includes("already logged in") ||
      msg.includes("session exists")
    );
  };

  const handleSubmit = async () => {
    if (!signIn) return;
    if (!email.trim() || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await attemptSignIn();
    } catch (err: any) {
      if (isSessionError(err)) {
        // Stale session left over from a previous logout — clear it and retry once.
        try { await signOut(); } catch (_) {}
        try {
          await attemptSignIn();
        } catch (retryErr: any) {
          const code: string = retryErr?.errors?.[0]?.code ?? retryErr?.code ?? "";
          const msg =
            code === "form_password_incorrect"
              ? "Incorrect password. Please try again."
              : code === "form_identifier_not_found"
              ? "No account found with that email."
              : retryErr?.errors?.[0]?.longMessage ?? retryErr?.message ?? "Sign in failed. Please try again.";
          setErrorMsg(msg);
        }
      } else {
        const code: string = err?.errors?.[0]?.code ?? err?.code ?? "";
        const msg =
          code === "form_password_incorrect"
            ? "Incorrect password. Please try again."
            : code === "form_identifier_not_found"
            ? "No account found with that email."
            : code === "form_param_format_invalid"
            ? "Please enter a valid email address."
            : err?.errors?.[0]?.longMessage ?? err?.message ?? "Sign in failed. Please try again.";
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + (Platform.OS === "web" ? 80 : 20), paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoBlock}>
            <View style={styles.flameRing}>
              <BrandLogo size={44} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to keep the sparks flying</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrorMsg(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrorMsg(""); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.35)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#FF3366", "#FF6B35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnInner}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/sign-up" as Href)} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 28 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBlock: { alignItems: "center", gap: 10 },
  flameRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,51,102,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,51,102,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", textAlign: "center" },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.55)", marginLeft: 4 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 52,
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: { padding: 8 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.25)",
  },
  errorText: { color: "#FF6B6B", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  submitBtn: {
    borderRadius: 28,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnInner: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  footerLink: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FF3366" },
});

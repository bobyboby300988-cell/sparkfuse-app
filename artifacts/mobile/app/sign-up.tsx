import { Ionicons } from "@expo/vector-icons";
import { useSignUp } from "@clerk/expo/legacy";
import { useAuth } from "@clerk/expo";
import BrandLogo from "@/components/BrandLogo";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, type Href } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, isLoaded, setActive } = useSignUp();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ paid?: string }>();
  const justPaid = params.paid === "1";

  // Guard: sign-up is only accessible after payment (Stripe/PayPal redirect
  // passes ?paid=1). Anyone landing here directly gets sent to the welcome page.
  useEffect(() => {
    if (!justPaid) {
      router.replace("/welcome" as Href);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [accountExistsEmail, setAccountExistsEmail] = useState("");

  // Safety-net timeout: in production Clerk initialises through the API proxy
  // which may take a few seconds on a cold start. 20s gives it plenty of time;
  // the button activates as soon as isLoaded becomes true (usually < 3s).
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoaded) return;
    timerRef.current = setTimeout(() => setClerkTimedOut(true), 20000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isLoaded]);
  const canSubmit = isLoaded || clerkTimedOut;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMsg("Still connecting — please wait a moment and tap again.");
      return;
    }
    if (!signUp) {
      setErrorMsg("Authentication unavailable. Please refresh the page and try again.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const errCode: string = clerkError?.code ?? "";
      if (errCode === "form_identifier_exists") {
        setAccountExistsEmail(email.trim().toLowerCase());
      }
      const msg =
        errCode === "form_identifier_exists"
          ? t("signUp.errorAccountExists")
          : errCode === "form_password_pwned"
          ? t("signUp.errorPasswordWeak")
          : errCode === "form_param_format_invalid"
          ? t("signUp.errorInvalidEmail")
          : clerkError?.longMessage ?? clerkError?.message ?? err?.message ?? t("signUp.errorFailed");
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !signUp || !setActive) {
      setVerifyError("Still loading — please wait a moment and try again.");
      return;
    }
    if (!code.trim()) {
      setVerifyError("Please enter the verification code.");
      return;
    }
    setVerifyError("");
    setVerifyLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Mark subscription active on the server now that the Clerk session exists.
        // Non-fatal: _layout.tsx also falls back to local isSubscribed cache.
        try {
          const token = await getToken();
          if (token) {
            const apiBase = process.env.EXPO_PUBLIC_DOMAIN
              ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
              : "";
            await fetch(`${apiBase}/api/auth/subscription/activate`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (_) { /* non-fatal */ }
        router.replace("/onboarding" as Href);
      } else {
        setVerifyError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const errCode: string = clerkError?.code ?? "";
      const msg =
        errCode === "form_code_incorrect"
          ? "Incorrect code. Please check and try again."
          : errCode === "verification_expired"
          ? "The code has expired. Please request a new one."
          : clerkError?.longMessage ?? clerkError?.message ?? err?.message ?? "Verification failed. Try again.";
      setVerifyError(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifyError("A new code was sent.");
    } catch {
      setVerifyError("Could not resend. Please wait a moment and try again.");
    }
  };

  if (pendingVerification) {
    return (
      <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + (Platform.OS === "web" ? 100 : 60), paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoBlock}>
            <View style={[styles.flameRing, { backgroundColor: "rgba(34,197,94,0.14)", borderColor: "rgba(34,197,94,0.35)" }]}>
              <Ionicons name="mail-open-outline" size={40} color="#22C55E" />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <Text style={{ color: "#FF3366", fontFamily: "Inter_600SemiBold" }}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification code</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="keypad-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { letterSpacing: 8, fontSize: 22, fontFamily: "Inter_700Bold" }]}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={code}
                  onChangeText={(v) => { setCode(v); setVerifyError(""); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                />
              </View>
            </View>

            {!!verifyError && (
              <View style={[styles.errorBox, verifyError.includes("sent") && styles.successBox]}>
                <Ionicons
                  name={verifyError.includes("sent") ? "checkmark-circle-outline" : "alert-circle-outline"}
                  size={16}
                  color={verifyError.includes("sent") ? "#22C55E" : "#FF6B6B"}
                />
                <Text style={[styles.errorText, verifyError.includes("sent") && { color: "#22C55E" }]}>
                  {verifyError}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, verifyLoading && { opacity: 0.6 }]}
              onPress={handleVerify}
              disabled={verifyLoading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#FF3366", "#FF6B35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnInner}
              >
                {verifyLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={resendCode} style={styles.resendBtn} activeOpacity={0.7}>
              <Text style={styles.resendText}>Didn't get the code? </Text>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={styles.logoBlock}>
            <View style={styles.flameRing}>
              <BrandLogo size={44} />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              {justPaid ? "Payment successful! Now create your account to access SparkFuse." : "Join SparkFuse and start connecting"}
            </Text>
          </View>

          {justPaid && (
            <View style={styles.paidBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              <Text style={styles.paidBannerText}>€2 plătit cu succes — contul tău va fi activat automat.</Text>
            </View>
          )}

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
                  placeholder="At least 8 characters"
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

            {!!accountExistsEmail && (
              <View style={styles.existsActions}>
                <TouchableOpacity
                  style={styles.existsBtn}
                  onPress={() => router.replace("/sign-in" as Href)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={16} color="#fff" />
                  <Text style={styles.existsBtnText}>{t("signUp.signInBtn")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.existsBtn, { backgroundColor: "rgba(255,255,255,0.08)" }]}
                  onPress={() => router.push("/forgot-password" as Href)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="key-outline" size={16} color="#FF3366" />
                  <Text style={[styles.existsBtnText, { color: "#FF3366" }]}>{t("signUp.resetPasswordBtn")}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (loading || !canSubmit) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading || !canSubmit}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#FF3366", "#FF6B35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnInner}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : !canSubmit ? (
                  <Text style={styles.submitBtnText}>Connecting…</Text>
                ) : (
                  <Text style={styles.submitBtnText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.finePrint}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>
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
  successBox: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.25)",
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
  finePrint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 16,
  },
  resendBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  resendLink: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FF3366" },
  existsActions: { flexDirection: "row", gap: 10 },
  existsBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#FF3366", paddingVertical: 12, borderRadius: 20,
  },
  existsBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  footerLink: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FF3366" },
  paidBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  paidBannerText: { color: "#22C55E", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
});

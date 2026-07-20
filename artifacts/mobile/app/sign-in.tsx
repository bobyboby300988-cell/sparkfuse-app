import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useAuth } from "@clerk/expo";
import BrandLogo from "@/components/BrandLogo";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "@/lib/api";
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

type VerifyMode = "emailCode" | "mfaEmailCode";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, fetchStatus } = useSignIn();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // OTP verification step
  const [verifyMode, setVerifyMode] = useState<VerifyMode | null>(null);
  const [otp, setOtp] = useState("");

  // Reset password flow (inline, no navigation)
  const [resetStep, setResetStep] = useState<"none" | "email" | "newPassword">("none");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const isLoading = fetchStatus === "fetching" || loading;

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

  const isLockedError = (err: any): boolean => {
    const code: string = err?.errors?.[0]?.code ?? err?.code ?? "";
    const msg: string = (err?.errors?.[0]?.message ?? err?.message ?? "").toLowerCase();
    return code === "user_locked" || msg.includes("locked") || msg.includes("too many attempts");
  };

  const parseError = (err: any): string => {
    const code: string = err?.errors?.[0]?.code ?? err?.code ?? (err as any)?.code ?? "";
    if (isLockedError(err)) return t("signIn.errorLocked");
    return code === "form_password_incorrect"
      ? t("signIn.errorWrongPassword")
      : code === "form_identifier_not_found"
      ? t("signIn.errorEmailNotFound")
      : code === "form_param_format_invalid"
      ? t("signIn.errorInvalidEmail")
      : err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? t("signIn.errorLoginFailed");
  };

  const handleSubmit = async () => {
    if (!signIn) return;
    if (!email.trim() || !password) {
      setErrorMsg(t("signIn.errorEnterCredentials"));
      return;
    }
    setErrorMsg("");
    setIsLocked(false);
    setLoading(true);
    try {
      // Use server-side ticket auth: verifies password via Clerk Admin API
      // (bypasses the FAPI proxy IP rate-limit at frontend-api.clerk.dev)
      const ticketRes = await fetch(`${getApiUrl()}/api/auth/sign-in-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const ticketData = await ticketRes.json() as any;

      if (!ticketRes.ok || !ticketData.ticket) {
        const errCode: string = ticketData?.error ?? "";
        if (errCode === "form_password_incorrect") {
          setErrorMsg(t("signIn.errorWrongPassword"));
        } else if (errCode === "form_identifier_not_found") {
          setErrorMsg(t("signIn.errorEmailNotFound"));
        } else if (errCode === "user_locked") {
          setIsLocked(true);
          setErrorMsg(t("signIn.errorLocked"));
        } else {
          setErrorMsg(t("signIn.errorLoginFailed"));
        }
        return;
      }

      // Use the one-time ticket to complete sign-in via Clerk SDK
      const result = await (signIn as any).create({
        strategy: "ticket",
        ticket: ticketData.ticket,
      });

      if (result?.status === "complete") {
        await (signIn as any).finalize();
        router.replace("/");
        return;
      }

      // Ticket sign-in should never need further factors, but handle gracefully
      setErrorMsg(t("signIn.errorIncomplete"));
    } catch (err: any) {
      if (isSessionError(err)) {
        // Already signed in — just go home; _layout will handle paywall redirect
        router.replace("/");
        return;
      } else {
        setErrorMsg(parseError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!signIn || !verifyMode) return;
    if (!otp.trim()) {
      setErrorMsg("Introdu codul primit pe email.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      let verifyError: any = null;

      if (verifyMode === "emailCode") {
        const { error } = await signIn.emailCode.verifyCode({ code: otp.trim() });
        verifyError = error;
      } else {
        const { error } = await signIn.mfa.verifyEmailCode({ code: otp.trim() });
        verifyError = error;
      }

      if (verifyError) {
        const code: string = (verifyError as any)?.code ?? "";
        setErrorMsg(
          code === "form_code_incorrect"
            ? t("signIn.errorInvalidCode")
            : code === "verification_expired"
            ? t("signIn.errorCodeExpired")
            : (verifyError as any)?.longMessage ?? (verifyError as any)?.message ?? t("signIn.errorInvalidCode")
        );
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        router.replace("/");
      } else {
        setErrorMsg(t("signIn.errorVerifyIncomplete"));
      }
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.longMessage ?? err?.message ?? t("signIn.errorVerification"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!signIn || !verifyMode) return;
    setErrorMsg("");
    setLoading(true);
    try {
      if (verifyMode === "emailCode") {
        await signIn.emailCode.sendCode();
      } else {
        await signIn.mfa.sendEmailCode();
      }
      setErrorMsg("Cod nou trimis pe email.");
    } catch (err: any) {
      setErrorMsg("Could not resend the code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password handlers ─────────────────────────────────────────────────
  const handleResetSendCode = async () => {
    if (!resetEmail.trim()) { setResetError("Introdu adresa de email."); return; }
    setResetError(""); setResetSuccess(""); setResetLoading(true);
    try {
      // Clear any stale session first so signIn.create() works even when
      // the user is already signed in (e.g. after sign-up without payment)
      try { await signOut(); } catch (_) {}
      if (!signIn) { setResetError("Eroare de autentificare. Reîncearcă."); return; }
      await (signIn as any).create({
        strategy: "reset_password_email_code",
        identifier: resetEmail.trim().toLowerCase(),
      });
      setResetSuccess("Cod trimis! Verifică email-ul.");
      setResetStep("newPassword");
    } catch (err: any) {
      const c: string = err?.errors?.[0]?.code ?? "";
      setResetError(
        c === "form_identifier_not_found" ? "Email-ul nu există în sistem." :
        c === "form_param_format_invalid" ? "Email invalid." :
        c === "single_session_mode" ? "Eroare sesiune. Reîncearcă." :
        err?.errors?.[0]?.message ?? "Eroare. Încearcă din nou."
      );
    } finally { setResetLoading(false); }
  };

  const handleResetSave = async () => {
    if (!signIn) return;
    if (!resetCode.trim()) { setResetError("Introdu codul primit pe email."); return; }
    if (!resetNewPassword || resetNewPassword.length < 8) { setResetError("Parola trebuie să aibă cel puțin 8 caractere."); return; }
    setResetError(""); setResetSuccess(""); setResetLoading(true);
    try {
      const result = await (signIn as any).attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: resetNewPassword,
      });
      if (result.status === "complete") {
        setResetSuccess("✓ Parola schimbată! Te poți loga acum cu parola nouă.");
        setTimeout(() => {
          setResetStep("none");
          setResetCode(""); setResetNewPassword(""); setResetEmail("");
          setEmail(resetEmail.trim().toLowerCase());
        }, 2000);
      } else {
        setResetError("Ceva nu a mers. Încearcă din nou.");
      }
    } catch (err: any) {
      const c: string = err?.errors?.[0]?.code ?? "";
      setResetError(
        c === "form_code_incorrect" ? "Cod greșit. Verifică email-ul." :
        c === "verification_expired" ? "Codul a expirat. Solicită un cod nou." :
        c === "form_password_pwned" ? "Parolă prea slabă. Alege alta." :
        "Eroare. Încearcă din nou."
      );
    } finally { setResetLoading(false); }
  };

  // ── OTP Screen ─────────────────────────────────────────────────────────────
  if (verifyMode) {
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
            <TouchableOpacity onPress={() => setVerifyMode(null)} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            <View style={styles.logoBlock}>
              <View style={styles.flameRing}>
                <BrandLogo size={44} />
              </View>
              <Text style={styles.title}>Verificare email</Text>
              <Text style={styles.subtitle}>
                Am trimis un cod de 6 cifre la{"\n"}{email.trim().toLowerCase()}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cod de verificare</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={otp}
                    onChangeText={(v) => { setOtp(v); setErrorMsg(""); }}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                    autoFocus
                  />
                </View>
              </View>

              {!!errorMsg && (
                <View style={[styles.errorBox, errorMsg.includes("trimis") && { borderColor: "rgba(100,220,100,0.3)", backgroundColor: "rgba(100,220,100,0.1)" }]}>
                  <Ionicons
                    name={errorMsg.includes("trimis") ? "checkmark-circle-outline" : "alert-circle-outline"}
                    size={16}
                    color={errorMsg.includes("trimis") ? "#6adc6a" : "#FF6B6B"}
                  />
                  <Text style={[styles.errorText, errorMsg.includes("trimis") && { color: "#6adc6a" }]}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleVerifyOtp}
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
                    <Text style={styles.submitBtnText}>Verifică</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResendOtp} disabled={isLoading} style={{ alignItems: "center", marginTop: 4 }}>
                <Text style={styles.footerLink}>Retrimite codul</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ── Reset Password Screen (inline, no navigation) ──────────────────────────
  if (resetStep !== "none") {
    return (
      <LinearGradient colors={["#0D0D1A", "#15080F", "#0D0D1A"]} style={styles.root}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === "web" ? 80 : 20), paddingBottom: insets.bottom + 40 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={() => { setResetStep("none"); setResetError(""); setResetSuccess(""); }} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            <View style={styles.logoBlock}>
              <View style={styles.flameRing}>
                <BrandLogo size={44} />
              </View>
              <Text style={styles.title}>{resetStep === "email" ? "Resetare parolă" : "Parolă nouă"}</Text>
              <Text style={styles.subtitle}>
                {resetStep === "email"
                  ? "Introdu email-ul contului tău și îți trimitem un cod de verificare."
                  : `Am trimis un cod la\n${resetEmail.trim().toLowerCase()}\n\nIntrodu codul și parola nouă.`}
              </Text>
            </View>

            <View style={styles.form}>
              {resetStep === "email" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adresă email</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={resetEmail}
                      onChangeText={(v) => { setResetEmail(v); setResetError(""); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleResetSendCode}
                      autoFocus
                    />
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cod de confirmare (primit pe email)</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="keypad-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 6, fontSize: 20, fontFamily: "Inter_700Bold" }]}
                        placeholder="000000"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={resetCode}
                        onChangeText={(v) => { setResetCode(v); setResetError(""); }}
                        keyboardType="number-pad"
                        maxLength={6}
                        returnKeyType="next"
                        autoFocus
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Parola nouă (min. 8 caractere)</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Parola nouă"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={resetNewPassword}
                        onChangeText={(v) => { setResetNewPassword(v); setResetError(""); }}
                        secureTextEntry={!showResetPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleResetSave}
                      />
                      <TouchableOpacity onPress={() => setShowResetPassword((v) => !v)} style={styles.eyeBtn}>
                        <Ionicons name={showResetPassword ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.35)" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {!!resetError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{resetError}</Text>
                </View>
              )}
              {!!resetSuccess && (
                <View style={[styles.errorBox, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)" }]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#22C55E" />
                  <Text style={[styles.errorText, { color: "#22C55E" }]}>{resetSuccess}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, resetLoading && { opacity: 0.6 }]}
                onPress={resetStep === "email" ? handleResetSendCode : handleResetSave}
                disabled={resetLoading}
                activeOpacity={0.88}
              >
                <LinearGradient colors={["#FF3366", "#FF6B35"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                  {resetLoading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.submitBtnText}>
                      {resetStep === "email" ? "Trimite cod pe email" : "Salvează parola nouă"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {resetStep === "newPassword" && (
                <TouchableOpacity onPress={() => { setResetStep("email"); setResetCode(""); setResetError(""); setResetSuccess(""); }} style={{ alignItems: "center", marginTop: 4 }}>
                  <Text style={styles.footerLink}>Trimite cod din nou</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ── Sign In Screen ──────────────────────────────────────────────────────────
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to keep the sparks flying</Text>
          </View>

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

            <TouchableOpacity
              onPress={() => { setResetEmail(email.trim()); setResetStep("email"); setResetError(""); setResetSuccess(""); }}
              style={{
                alignSelf: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 20,
                backgroundColor: "transparent",
                marginTop: 2,
              }}
              activeOpacity={0.6}
            >
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "Inter_500Medium" }}>
                {t("signIn.resetPassword")}
              </Text>
            </TouchableOpacity>

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
  forgotLink: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FF3366", opacity: 0.85 },
});

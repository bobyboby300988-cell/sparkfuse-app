import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetMyProfile, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { ClerkProvider, useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Platform, Text, ScrollView } from "react-native";
import { getApiUrl } from "@/lib/api";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import "@/lib/api";
import i18n, { getSavedLanguage } from "@/i18n";

async function registerPushToken(getToken: () => Promise<string | null>) {
  if (Platform.OS === "web") return;
  if (!Device.isDevice) return;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;
    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
    const tok = await getToken();
    if (!tok || !pushToken) return;
    await fetch(`${getApiUrl()}/api/calls/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ token: pushToken }),
    });
  } catch {}
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;
// In production, Clerk must route through the API proxy (/api/__clerk).
// EXPO_PUBLIC_CLERK_PROXY_URL is empty in dev (Clerk hits FAPI directly)
// and auto-populated at build time in prod. Do NOT gate on NODE_ENV.
const CLERK_PROXY_URL = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

// Session guard key — written to AsyncStorage when user is authenticated,
// cleared only on explicit sign-out. Used to distinguish "Clerk still loading"
// from "user genuinely not signed in" on cold start.
const SESSION_GUARD_KEY = "@spark/session_guard";

// Token cache backed by expo-secure-store (Android Keystore / iOS Keychain).
// SecureStore survives OS storage management that can clear AsyncStorage,
// making it more reliable for persisting Clerk sessions across app restarts.
// On web Clerk manages tokens internally via localStorage/cookies.
const tokenCache = Platform.OS === "web" ? undefined : {
  async getToken(key: string) {
    try {
      const val = await SecureStore.getItemAsync(key);
      return val ?? null;
    } catch {
      // Fallback to AsyncStorage if SecureStore unavailable (emulator/old device)
      try { return await AsyncStorage.getItem(key); } catch { return null; }
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      try { await AsyncStorage.setItem(key, value); } catch {}
    }
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key); } catch {}
    try { await AsyncStorage.removeItem(key); } catch {}
  },
};

// Global crash reporter — catches unhandled JS errors before React renders
let globalCrashMessage: string | null = null;
if (typeof global !== "undefined" && (global as any).ErrorUtils) {
  (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    const msg = `${isFatal ? "FATAL: " : ""}${error?.message ?? String(error)}`;
    globalCrashMessage = msg + "\n\n" + (error?.stack ?? "");
    // Show native alert — visible even before React mounts, reveals exact error
    try {
      const { Alert } = require("react-native");
      Alert.alert("SparkFuse — Error", msg.slice(0, 500), [{ text: "OK" }]);
    } catch {}
    // Hide splash so user sees the alert instead of being stuck
    try { SplashScreen.hideAsync(); } catch {}
  });
}

function CrashScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ color: "#FF3366", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>SparkFuse — Startup Error</Text>
      <ScrollView style={{ maxHeight: 400 }}>
        <Text style={{ color: "#fff", fontSize: 12, fontFamily: "monospace" }}>{message}</Text>
      </ScrollView>
    </View>
  );
}


function RootLayoutNav() {
  const { isSubscribed, isLoaded: appLoaded } = useApp();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const isAuthenticated = !!isSignedIn;
  const { data: profileData, isLoading: profileLoading, isError: profileError } = useGetMyProfile({
    query: { enabled: isAuthenticated, queryKey: ["myProfile"], retry: 3 },
  });
  // Server-confirmed subscription status — prevents paywall redirect before server responds
  const { data: authUserData, isLoading: authUserLoading } = useGetCurrentAuthUser({
    query: { enabled: isAuthenticated, queryKey: ["currentAuthUser"] },
  });
  const serverSubscribed = authUserData?.user?.isSubscribed ?? isSubscribed;
  // Only treat subscription as "not subscribed" once server has answered (avoids post-reinstall paywall flash)
  const subscriptionChecked = !authUserLoading || !isAuthenticated;
  const segments = useSegments();
  const [timedOut, setTimedOut] = useState(false);

  // Session guard: tracks whether the user had an active session.
  // Set to true when Clerk confirms isSignedIn=true.
  // Cleared only when the user explicitly presses Log Out.
  // Used to decide: redirect to /sign-in (session expired) vs /welcome (new user).
  const [sessionGuard, setSessionGuard] = useState(false);
  const [sessionGuardLoaded, setSessionGuardLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_GUARD_KEY)
      .then((val) => setSessionGuard(val === "true"))
      .catch(() => setSessionGuard(false))
      .finally(() => setSessionGuardLoaded(true));
  }, []);

  // Persist session guard whenever Clerk confirms the user is signed in.
  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    setSessionGuard(true);
    AsyncStorage.setItem(SESSION_GUARD_KEY, "true").catch(() => {});
  }, [authLoaded, isSignedIn]);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  // Register push notification token whenever user signs in
  useEffect(() => {
    if (!isAuthenticated) return;
    registerPushToken(getToken);
  }, [isAuthenticated]);

  // Poll for incoming calls when app is in foreground (every 4s)
  useEffect(() => {
    if (!isAuthenticated) return;

    
    let polling = true;
    const pollIncoming = async () => {
      while (polling) {
        try {
          const tok = await getToken();
          const res = await fetch(`${getApiUrl()}/api/calls/incoming`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const { call } = (await res.json()) as { call: { id: string; callerId: string; callerName: string; callerPhoto: string; isVoice: boolean } | null };
            if (call) {
              const currentRoute = segments.join("/");
              if (!currentRoute.includes("incoming-call") && !currentRoute.includes("call/")) {
                router.push({
                  pathname: "/incoming-call",
                  params: {
                    callId: call.id,
                    callerId: call.callerId,
                    callerName: call.callerName ?? "Unknown",
                    callerPhoto: call.callerPhoto ?? "",
                    isVoice: String(call.isVoice),
                  },
                });
              }
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 2000));
      }
    };
    pollIncoming();

    return () => { polling = false; };
  }, [isAuthenticated]);

  const hasProfile = !!profileData?.profile;
  // Only treat profile as "done loading" when we have a definitive answer (data or non-retryable error).
  // Never count a network error as "no profile" — that would falsely log the user out.
  const profileDone = !profileLoading;
  const isLoaded = (authLoaded || timedOut) && appLoaded && sessionGuardLoaded && (!isAuthenticated || profileDone);

  // Safety net: if Clerk takes too long (slow network / proxy issue) show a
  // retry screen instead of falsely redirecting to /welcome and logging the
  // user out. We never redirect on timeout — only Clerk definitively saying
  // "not signed in" triggers that redirect.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (authLoaded) return;
    timeoutRef.current = setTimeout(() => setTimedOut(true), 30000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [authLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    // Do NOT redirect while Clerk is still loading auth state.
    // isSignedIn===undefined means "Clerk is refreshing" (e.g. app returning from background).
    // Treating undefined as false would send an authenticated user to sign-in by mistake.
    if (!authLoaded) return;

    const inOnboarding = segments[0] === "onboarding";
    const inPaywall = segments[0] === "paywall";
    const inWelcome = segments[0] === "welcome";
    const inSignIn = segments[0] === "sign-in";
    const inSignUp = segments[0] === "sign-up";

    const inForgotPassword = segments[0] === "forgot-password";

    // Use strict false — undefined means Clerk is still loading, not "logged out"
    if (isSignedIn === false) {
      if (isSubscribed && !inSignUp) {
        // User paid but has no Clerk account yet → create account
        // This handles the case where Stripe browser closes and isSubscribed becomes
        // true before the router.replace("/sign-up") in paywall.tsx fires.
        router.replace("/sign-up");
      } else if (!isSubscribed && !sessionGuard && !inWelcome && !inSignIn && !inSignUp && !inPaywall && !inOnboarding && !inForgotPassword) {
        // Brand-new user (never had a session) → welcome screen
        router.replace("/welcome");
      }
      // sessionGuard === true means user previously authenticated.
      // Do NOT auto-redirect — only a manual Sign Out press clears sessionGuard.
      // This prevents accidental logout caused by Clerk token refresh delays.
    } else if (isAuthenticated && !hasProfile && !profileError && !profileLoading && !inOnboarding && !inWelcome && !inSignIn && !inSignUp && !inPaywall) {
      // New user: must pay BEFORE creating a profile.
      // Wait for server to confirm subscription status to avoid false paywall flash.
      if (subscriptionChecked && !serverSubscribed) {
        router.replace("/paywall");
      } else if (subscriptionChecked && serverSubscribed) {
        router.replace("/onboarding");
      }
      // subscriptionChecked=false → server still loading, wait before deciding
    } else if (isAuthenticated && !hasProfile && isSubscribed && inPaywall) {
      // User paid but has no profile yet → create profile
      router.replace("/onboarding");
    } else if (isAuthenticated && hasProfile && inOnboarding) {
      if (!isSubscribed) {
        router.replace("/paywall");
      } else {
        router.replace("/");
      }
    } else if (isAuthenticated && hasProfile && !serverSubscribed && subscriptionChecked && !inPaywall) {
      router.replace("/paywall");
    } else if (isAuthenticated && hasProfile && isSubscribed && inPaywall) {
      router.replace("/");
    } else if (isAuthenticated && hasProfile && isSubscribed && (inSignIn || inWelcome)) {
      router.replace("/");
    }
  }, [isLoaded, authLoaded, isSignedIn, isAuthenticated, hasProfile, isSubscribed, serverSubscribed, subscriptionChecked, sessionGuard, segments]);

  const inAuthPage = segments[0] === "sign-up" || segments[0] === "sign-in";

  if (!isLoaded && !inAuthPage) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="call/[id]" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="incoming-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="live/go-live" options={{ headerShown: false }} />
      <Stack.Screen name="live/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="coach/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [crashMessage, setCrashMessage] = useState<string | null>(globalCrashMessage);

  // Auto-apply OTA updates immediately on launch (production only)
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (_) {}
    })();
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    getSavedLanguage().then((lang) => {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Fallback: hide splash after 4s regardless of font load state
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 4000);
    return () => clearTimeout(t);
  }, []);

  if (crashMessage) {
    return <CrashScreen message={crashMessage} />;
  }

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} proxyUrl={CLERK_PROXY_URL} tokenCache={tokenCache}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AppProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

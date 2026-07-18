import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetMyProfile } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache as nativeTokenCache } from "@clerk/expo/token-cache";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;
// In production, Clerk must route through the API proxy (/api/__clerk).
// EXPO_PUBLIC_CLERK_PROXY_URL is empty in dev (Clerk hits FAPI directly)
// and auto-populated at build time in prod. Do NOT gate on NODE_ENV.
const CLERK_PROXY_URL = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;
// On web, Clerk manages tokens via cookies/localStorage internally.
// The native tokenCache (expo-secure-store) silently fails in a browser
// and prevents Clerk from ever finishing initialisation.
const tokenCache = Platform.OS === "web" ? undefined : nativeTokenCache;

// Global crash reporter — catches unhandled JS errors before React renders
let globalCrashMessage: string | null = null;
if (typeof global !== "undefined" && (global as any).ErrorUtils) {
  const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    globalCrashMessage = `${isFatal ? "FATAL: " : ""}${error?.message ?? String(error)}\n\n${error?.stack ?? ""}`;
    originalHandler(error, isFatal);
  });
}

function CrashScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ color: "#FF3366", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>SparkFuse — Eroare startup</Text>
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
  const segments = useSegments();
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

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
        await new Promise((r) => setTimeout(r, 4000));
      }
    };
    pollIncoming();

    return () => { polling = false; };
  }, [isAuthenticated]);

  const hasProfile = !!profileData?.profile;
  // Only treat profile as "done loading" when we have a definitive answer (data or non-retryable error).
  // Never count a network error as "no profile" — that would falsely log the user out.
  const profileDone = !profileLoading;
  const isLoaded = (authLoaded || timedOut) && appLoaded && (!isAuthenticated || profileDone);

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

    const inOnboarding = segments[0] === "onboarding";
    const inPaywall = segments[0] === "paywall";
    const inWelcome = segments[0] === "welcome";
    const inSignIn = segments[0] === "sign-in";
    const inSignUp = segments[0] === "sign-up";

    // Only redirect to /welcome when Clerk definitively says the user is NOT
    // signed in. A timeout alone is NOT a definitive answer — the user may
    // simply have a slow connection. Redirect also if someone tries to reach
    // /sign-up without having completed payment first (isSubscribed check).
    if (!isAuthenticated && !inOnboarding && !inWelcome && !inSignIn) {
      // Allow /sign-up ONLY if the user has already paid (isSubscribed from
      // AsyncStorage is set right before opening the Stripe/PayPal browser).
      if (!inSignUp || !isSubscribed) {
        router.replace("/welcome");
      }
    } else if (isAuthenticated && !hasProfile && !profileError && !profileLoading && !inOnboarding && !inWelcome && !inSignIn && !inSignUp) {
      // Signed in but genuinely has no profile yet → send to onboarding
      router.replace("/onboarding");
    } else if (isAuthenticated && hasProfile && inOnboarding) {
      if (!isSubscribed) {
        router.replace("/paywall");
      } else {
        router.replace("/");
      }
    } else if (isAuthenticated && hasProfile && !isSubscribed && !inPaywall) {
      router.replace("/paywall");
    } else if (isAuthenticated && hasProfile && isSubscribed && inPaywall) {
      router.replace("/");
    } else if (isAuthenticated && hasProfile && isSubscribed && (inSignIn || inWelcome)) {
      router.replace("/");
    }
  }, [isLoaded, isAuthenticated, hasProfile, isSubscribed, segments]);

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
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="call/[id]" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="incoming-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="coach/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [crashMessage, setCrashMessage] = useState<string | null>(globalCrashMessage);

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
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

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

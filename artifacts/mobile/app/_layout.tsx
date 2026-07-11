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
import { tokenCache } from "@clerk/expo/token-cache";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
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

function RootLayoutNav() {
  const { isSubscribed, isLoaded: appLoaded } = useApp();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const isAuthenticated = !!isSignedIn;
  const { data: profileData, isLoading: profileLoading } = useGetMyProfile({
    query: { enabled: isAuthenticated, queryKey: ["myProfile"] },
  });
  const segments = useSegments();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  const hasProfile = !!profileData?.profile;
  const isLoaded = (authLoaded || timedOut) && appLoaded && (!isAuthenticated || !profileLoading);

  // Safety net: if Clerk takes more than 6 s to initialise (network issue,
  // missing publishable key, etc.) treat auth as "not signed in" and redirect
  // to welcome so the user never gets stuck on the tabs screen.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (authLoaded) return;
    timeoutRef.current = setTimeout(() => setTimedOut(true), 6000);
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

    if ((!isAuthenticated || !hasProfile) && !inOnboarding && !inWelcome && !inSignIn && !inSignUp) {
      router.replace("/welcome");
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
    }
  }, [isLoaded, isAuthenticated, hasProfile, isSubscribed, segments]);

  // Don't unmount auth pages while Clerk is reinitialising mid-flow (e.g.
  // after signUp.password() briefly sets isSignedIn=true before email
  // verification). Those pages manage their own loading state, and unmounting
  // them would wipe form state and make the page appear to "reload".
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
      <Stack.Screen name="coach/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
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

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AppProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

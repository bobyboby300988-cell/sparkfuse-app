import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALL_PROFILES } from "@/data/allProfiles";
import { useGetMatches } from "@workspace/api-client-react";
import { getPhotoUrl } from "@/lib/api";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreen() {
  const { id, mode, name: nameParam, photo: photoParam, roomUrl, token } =
    useLocalSearchParams<{
      id: string;
      mode?: string;
      name?: string;
      photo?: string;
      roomUrl?: string;
      token?: string;
    }>();
  const insets = useSafeAreaInsets();
  const isVoice = mode === "voice";

  const { data: matchesServerData } = useGetMatches();
  const profile = useMemo(() => {
    const mock = ALL_PROFILES.find((p) => p.id === id);
    if (mock) return mock;
    if (!id) return null;
    const srv = matchesServerData?.matches?.find((p) => p.userId === id);
    if (srv) {
      const photoUrl = getPhotoUrl(srv.photoUrl);
      return {
        id: srv.userId,
        name: srv.name,
        photo: photoUrl
          ? { uri: photoUrl }
          : require("../../assets/images/p1.png"),
      };
    }
    if (nameParam) {
      return {
        id,
        name: nameParam,
        photo: photoParam
          ? { uri: photoParam }
          : require("../../assets/images/p1.png"),
      };
    }
    return null;
  }, [id, matchesServerData, nameParam, photoParam]);

  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Build final Daily.co URL with token
  const dailyUrl = useMemo(() => {
    if (!roomUrl) return null;
    const base = roomUrl.includes("?") ? roomUrl : roomUrl;
    return token ? `${base}?t=${token}` : base;
  }, [roomUrl, token]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    // Show connecting screen briefly, then reveal the Daily iframe
    const t = setTimeout(() => {
      setReady(true);
      pulse.stop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
    return () => {
      pulse.stop();
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [ready]);

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: "#FF3366", fontSize: 15 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dailyUrl) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#FF3366" size="large" />
        <Text style={{ color: "#fff", fontSize: 15, marginTop: 12 }}>Setting up call…</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: "#FF3366", fontSize: 15 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // On web, Daily.co works natively in the browser — render a full-page iframe
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          src={dailyUrl}
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
          allow="camera; microphone; autoplay; display-capture; fullscreen"
          title="Video Call"
        />
        <TouchableOpacity
          style={[styles.endCallBtn, { position: "absolute", bottom: 40, alignSelf: "center" }]}
          onPress={handleEndCall}
          activeOpacity={0.8}
        >
          <Ionicons
            name="call"
            size={30}
            color="#fff"
            style={{ transform: [{ rotate: "135deg" }] }}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!ready ? (
        /* ─── Connecting screen ─── */
        <>
          <Image
            source={profile.photo}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(13,11,18,0.72)" }]} />

          <View style={[styles.topBar, { paddingTop: (insets.top || 0) + 16 }]}>
            <TouchableOpacity onPress={handleEndCall} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={styles.callerName}>{profile.name}</Text>
              <Text style={styles.callStatus}>
                {isVoice ? "Calling…" : "Starting video…"}
              </Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.center}>
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
            />
            <Image
              source={profile.photo}
              style={styles.connectingAvatar}
              contentFit="cover"
            />
            <Text style={styles.connectingLabel}>
              {isVoice ? "📞 Voice call" : "📹 Video call"}
            </Text>
          </View>

          <View style={[styles.controls, { paddingBottom: (insets.bottom || 0) + 28 }]}>
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={handleEndCall}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call"
                size={30}
                color="#fff"
                style={{ transform: [{ rotate: "135deg" }] }}
              />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* ─── Live Daily.co call inside the app ─── */
        <>
          <WebView
            source={{ uri: dailyUrl }}
            style={StyleSheet.absoluteFill}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            // Grant camera + microphone access automatically on iOS
            mediaCapturePermissionGrantType="grant"
            // Grant on Android
            onPermissionRequest={(event) => {
              event.nativeEvent.grant(event.nativeEvent.resources);
            }}
          />

          {/* Floating end-call button */}
          <View
            style={[styles.endCallOverlay, { bottom: (insets.bottom || 0) + 28 }]}
            pointerEvents="box-none"
          >
            <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={handleEndCall}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call"
                size={30}
                color="#fff"
                style={{ transform: [{ rotate: "135deg" }] }}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0B12" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  callerName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  callStatus: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },

  pulseRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(255,51,102,0.4)",
    backgroundColor: "rgba(255,51,102,0.08)",
  },
  connectingAvatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#FF3366",
  },
  connectingLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },

  controls: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 32,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  endCallOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
  timerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
});

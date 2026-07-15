import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { ALL_PROFILES } from "@/data/allProfiles";
import { getOrCreateRoom, createMeetingToken } from "@/lib/daily";
import { useGetMatches } from "@workspace/api-client-react";
import { getPhotoUrl } from "@/lib/api";

type CallPhase = "connecting" | "ready" | "error";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreen() {
  const { id, mode, name: nameParam, photo: photoParam } = useLocalSearchParams<{ id: string; mode?: string; name?: string; photo?: string }>();
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
        photo: photoUrl ? { uri: photoUrl } : require("../../assets/images/p1.png"),
      };
    }
    // Fallback: use route params passed from chat screen
    if (nameParam) {
      return {
        id,
        name: nameParam,
        photo: photoParam ? { uri: photoParam } : require("../../assets/images/p1.png"),
      };
    }
    return null;
  }, [id, matchesServerData, nameParam, photoParam]);

  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [callUrl, setCallUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiKey = process.env.EXPO_PUBLIC_DAILY_API_KEY;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setPhase("error");
      setErrorMsg("Daily.co API key not configured.");
      return;
    }

    (async () => {
      try {
        const room = await getOrCreateRoom(id ?? "default");
        // For voice calls, create a token that disables the camera so the UI
        // defaults to audio-only. For video calls we skip the token and let
        // Daily.co default to camera+mic on.
        if (isVoice) {
          const token = await createMeetingToken(room.name, {
            isOwner: false,
            userName: "You",
            startVideoOff: true,
          });
          setCallUrl(`${room.url}?t=${token}`);
        } else {
          setCallUrl(room.url);
        }
        setPhase("ready");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        setPhase("error");
        setErrorMsg(err.message ?? "Could not start call.");
      }
    })();
  }, [id, apiKey, isVoice]);

  useEffect(() => {
    if (phase !== "ready") return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const showControlsTemporarily = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() =>
        setShowControls(false)
      );
    }, 4000);
  };

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff" }}>Profile not found</Text>
      </View>
    );
  }

  // ── Web platform: use iframe instead of WebView ──────────────────────────
  // Daily.co rooms are standard WebRTC pages that work in any browser.
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { paddingTop: (insets.top || 0) + 8 }]}>
        {/* Minimal header */}
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={handleEndCall} style={styles.webBackBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={profile.photo} style={styles.webAvatar} contentFit="cover" />
            <View>
              <Text style={styles.webName}>{profile.name}</Text>
              <Text style={styles.webCallType}>{isVoice ? "📞 Voice call" : "📹 Video call"}</Text>
            </View>
          </View>
          {phase === "ready" && (
            <View style={styles.timerPill}>
              <View style={styles.liveIndicator} />
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            </View>
          )}
        </View>

        {phase === "connecting" && (
          <View style={styles.center}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <Image source={profile.photo} style={styles.connectingAvatar} contentFit="cover" />
            <Text style={styles.callStatus}>Connecting…</Text>
          </View>
        )}

        {phase === "error" && (
          <View style={styles.center}>
            <Ionicons name="warning-outline" size={48} color="#FF3366" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {phase === "ready" && callUrl && (
          <iframe
            src={callUrl}
            style={{ flex: 1, border: "none", borderRadius: 12 } as React.CSSProperties}
            allow="camera; microphone; fullscreen; display-capture"
            title={`${isVoice ? "Voice" : "Video"} call with ${profile.name}`}
          />
        )}

        {/* End call */}
        <View style={[styles.controls, { paddingBottom: (insets.bottom || 0) + 16 }]}>
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} activeOpacity={0.8}>
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Native (iOS / Android): use WebView ──────────────────────────────────
  return (
    <View style={styles.container}>
      {phase !== "ready" && (
        <>
          <Image source={profile.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.callerName}>{profile.name}</Text>
            <Text style={styles.callStatus}>
              {phase === "connecting"
                ? isVoice ? "Starting voice call…" : "Starting video call…"
                : "Could not connect"}
            </Text>
          </View>

          {phase === "connecting" && (
            <View style={styles.center}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
              <Image source={profile.photo} style={styles.connectingAvatar} contentFit="cover" />
              <Text style={[styles.callStatus, { marginTop: 12 }]}>
                {isVoice ? "📞" : "📹"} {isVoice ? "Voice call" : "Video call"}
              </Text>
            </View>
          )}

          {phase === "error" && (
            <View style={styles.center}>
              <Ionicons name="warning-outline" size={48} color="#FF3366" />
              <Text style={styles.errorText}>{errorMsg}</Text>
              {!apiKey && (
                <Text style={styles.errorHint}>
                  Add your Daily.co API key as{"\n"}EXPO_PUBLIC_DAILY_API_KEY
                </Text>
              )}
            </View>
          )}

          <View style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}>
            <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} activeOpacity={0.8}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {phase === "ready" && callUrl && (
        <>
          <WebView
            source={{ uri: callUrl }}
            style={styles.webview}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            onTouchStart={showControlsTemporarily}
            mediaCapturePermissionGrantType={
              Platform.OS === "ios" ? "grantIfSameHostElsePrompt" : undefined
            }
          />

          {showControls && (
            <Animated.View
              style={[styles.floatingControls, { opacity: controlsOpacity, paddingBottom: insets.bottom + 20 }]}
              pointerEvents="box-none"
            >
              <View style={styles.timerPill}>
                <View style={styles.liveIndicator} />
                <Text style={styles.timerText}>{formatDuration(duration)}</Text>
              </View>
              <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} activeOpacity={0.8}>
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0B12" },
  webview: { flex: 1 },

  webHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  webBackBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff18",
    alignItems: "center", justifyContent: "center",
  },
  webAvatar: { width: 34, height: 34, borderRadius: 17 },
  webName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  webCallType: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },

  topBar: { alignItems: "center", paddingHorizontal: 24, gap: 6 },
  callerName: {
    fontSize: 28, fontWeight: "700", color: "#ffffff",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  callStatus: { fontSize: 15, color: "#ffffffaa", fontFamily: "Inter_400Regular", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  pulseRing: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: "#FF336660", backgroundColor: "#FF336615",
  },
  connectingAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#FF3366" },
  errorText: {
    color: "#fff", fontSize: 15, fontFamily: "Inter_400Regular",
    textAlign: "center", paddingHorizontal: 32,
  },
  errorHint: {
    color: "#9A93B3", fontSize: 13, fontFamily: "Inter_400Regular",
    textAlign: "center", marginTop: 8, lineHeight: 20,
  },
  controls: { alignItems: "center", paddingTop: 12 },
  floatingControls: {
    position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", gap: 16,
  },
  timerPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  timerText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  endCallBtn: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: "#FF3366",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#FF3366", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
    elevation: 8,
  },
});

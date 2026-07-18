import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { createMeetingToken, getOrCreateRoom } from "@/lib/daily";
import { endLiveSession, heartbeatLiveSession, startLiveSession } from "@/lib/liveApi";

type Phase = "connecting" | "live" | "error";

const CATEGORIES = ["Dating", "Flirty", "Naughty", "Party", "Social"] as const;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function GoLiveScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { setIsLive } = useApp();
  const { data: profileData } = useGetMyProfile();
  const userProfile = profileData?.profile ?? null;

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Dating");
  const [phase, setPhase] = useState<Phase>("connecting");
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [started, setStarted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const apiKey = process.env.EXPO_PUBLIC_DAILY_API_KEY;
  const hostName = userProfile?.name || "You";

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

  async function goLive() {
    if (!apiKey) {
      setPhase("error");
      setErrorMsg("Daily.co API key not configured.");
      return;
    }
    // Request camera and microphone OS permissions before opening WebView.
    // On Android the WebView cannot access hardware without these grants.
    if (Platform.OS === "android") {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const camOk = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const micOk = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      if (!camOk || !micOk) {
        Alert.alert(
          "Permissions required",
          "SparkFuse needs access to your camera and microphone to go live. Please allow them in Settings.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    setStarted(true);
    try {
      const roomName = `live-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const room = await getOrCreateRoom(roomName);
      const [ownerToken, id] = await Promise.all([
        createMeetingToken(room.name, { isOwner: true, userName: hostName }),
        startLiveSession({ name: hostName, category, roomUrl: room.url, roomName: room.name, hostUserId: userId ?? undefined }),
      ]);
      setSessionId(id);
      setJoinUrl(`${room.url}?t=${ownerToken}`);
      setPhase("live");
      setIsLive(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(err.message ?? "Could not start your live stream.");
    }
  }

  /* Timer + heartbeat while live */
  useEffect(() => {
    if (phase !== "live" || !sessionId) return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    const beat = setInterval(() => heartbeatLiveSession(sessionId), 15000);
    const viewerSim = setInterval(() => {
      setViewers((n) => Math.max(0, n + Math.floor((Math.random() - 0.3) * 4)));
    }, 4000);
    return () => {
      clearInterval(timer);
      clearInterval(beat);
      clearInterval(viewerSim);
    };
  }, [phase, sessionId]);

  async function handleEndLive() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (sessionId) await endLiveSession(sessionId);
    await setIsLive(false);
    router.back();
  }

  // Live streaming uses Daily.co via WebView — not available in web browsers.
  // Show a clear "download the app" screen instead of a broken experience.
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingHorizontal: 28 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{ position: "absolute", top: (insets.top || 0) + 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff18", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={{ fontSize: 56, marginBottom: 16 }}>📱</Text>

        <Text style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", lineHeight: 32 }}>
          Live Streaming is{"\n"}
          <Text style={{ color: "#FF3366" }}>App Only</Text>
        </Text>

        <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#9A93B3", textAlign: "center", marginTop: 14, lineHeight: 22 }}>
          Go Live with your real camera is only available in the SparkFuse mobile app. Download it to broadcast live to your audience — they can watch and send you gifts in real time.
        </Text>

        <View style={{ width: "100%", marginTop: 36, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, backgroundColor: "#1a1a2e", borderRadius: 16, borderWidth: 1, borderColor: "#ffffff20" }}>
            <Text style={{ fontSize: 34 }}>▶️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#F39C12", letterSpacing: 1.5, marginBottom: 3 }}>COMING SOON</Text>
              <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" }}>Google Play</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)" }}>Android — full live streaming</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, backgroundColor: "#13131f", borderRadius: 16, borderWidth: 1, borderColor: "#ffffff12" }}>
            <Text style={{ fontSize: 34 }}>🍎</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 3 }}>COMING LATER</Text>
              <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.5)" }}>App Store</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)" }}>iOS — after Google Play launch</Text>
            </View>
          </View>
        </View>

        <Text style={{ marginTop: 24, fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 17 }}>
          All other features — matches, chat, profiles, coaches —{"\n"}are fully available in your browser right now.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {phase === "connecting" && !started && (
        <View style={[styles.setup, { paddingTop: insets.top + 40 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.setupEmoji}>🔴</Text>
          <Text style={styles.setupTitle}>Go Live</Text>
          <Text style={styles.setupSub}>
            Broadcast your real camera to viewers on SparkFuse. They can watch and send you real gifts.
          </Text>

          <Text style={styles.categoryLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={goLive} activeOpacity={0.85} style={styles.goLiveBtnWrap}>
            <LinearGradient colors={["#FF3366", "#FF6B35"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goLiveBtn}>
              <Ionicons name="radio" size={18} color="#fff" />
              <Text style={styles.goLiveBtnText}>Start Streaming</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {phase === "connecting" && started && (
        <View style={styles.center}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Ionicons name="radio" size={40} color="#FF3366" />
          <Text style={styles.connectingText}>Starting your live stream…</Text>
        </View>
      )}

      {phase === "error" && (
        <View style={[styles.center, { paddingHorizontal: 32 }]}>
          <Ionicons name="warning-outline" size={48} color="#FF3366" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === "live" && joinUrl && (
        <>
          <WebView
            source={{ uri: joinUrl }}
            style={styles.webview}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            onPermissionRequest={(event) => {
              // Android: grant camera/mic access to the Daily.co web page
              event.grant(event.resources);
            }}
          />

          <View style={[styles.liveTopBar, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
              <Text style={styles.liveTimer}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.viewerChip}>
              <Ionicons name="eye" size={12} color="#fff" />
              <Text style={styles.viewerChipText}>{viewers}</Text>
            </View>
          </View>

          <View style={[styles.liveBottomBar, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity onPress={handleEndLive} activeOpacity={0.85} style={styles.endBtn}>
              <Ionicons name="stop-circle" size={20} color="#fff" />
              <Text style={styles.endBtnText}>End Live</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  webview: { flex: 1 },

  setup: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  closeBtn: {
    position: "absolute", top: 50, left: 16, width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#ffffff18", alignItems: "center", justifyContent: "center",
  },
  setupEmoji: { fontSize: 48, marginTop: 20 },
  setupTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 10 },
  setupSub: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: "#9A93B3",
    textAlign: "center", marginTop: 10, lineHeight: 20, paddingHorizontal: 8,
  },
  categoryLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff", marginTop: 36, alignSelf: "flex-start" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#ffffff33", backgroundColor: "#ffffff10",
  },
  categoryChipActive: { backgroundColor: "#FF3366", borderColor: "#FF3366" },
  categoryChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#9A93B3" },
  categoryChipTextActive: { color: "#fff" },
  goLiveBtnWrap: { marginTop: 48, width: "100%", borderRadius: 26, overflow: "hidden" },
  goLiveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 26 },
  goLiveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  pulseRing: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: "#FF336660", backgroundColor: "#FF336615",
  },
  connectingText: { color: "#fff", fontSize: 15, fontFamily: "Inter_500Medium" },
  errorText: { color: "#fff", fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  backLinkBtn: { marginTop: 8 },
  backLinkText: { color: "#FF6B9D", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  liveTopBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16,
  },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FF000088", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  liveBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  liveTimer: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff", marginLeft: 4 },
  viewerChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#00000066", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6,
  },
  viewerChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },

  liveBottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  endBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FF3366", paddingHorizontal: 22, paddingVertical: 14, borderRadius: 28,
    shadowColor: "#FF3366", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  endBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { createBroadcast, endLiveSession, heartbeatLiveSession } from "@/lib/liveApi";
import { getApiUrl } from "@/lib/api";

const AgoraModule = (() => { try { return require("react-native-agora"); } catch { return null; } })();
const AgoraRTC = (() => {
  try {
    if (Platform.OS !== "web") return null;
    return require("agora-rtc-sdk-ng").default;
  } catch { return null; }
})();

type Phase = "setup" | "connecting" | "live" | "error";

const CATEGORIES = ["Dating", "Flirty", "Naughty", "Party", "Social"] as const;
const REACTION_EMOJIS = ["❤️", "💋", "🔥", "😍", "💕", "🌹", "😈", "🍑", "👑", "⚡"];
const NAME_COLORS = ["#FF6B9D", "#C77DFF", "#48CAE4", "#FFD166", "#FF6B35", "#FF3366"];
const MOCK_COMMENTS = [
  "You're amazing 😍", "Great live!", "Hey! 👋", "❤️❤️❤️", "Love this!",
  "Wow 🔥🔥", "Following you!", "You're beautiful!", "😍😍", "SparkFuse best!",
  "First time seeing you live!", "🔥🔥🔥", "Good evening!", "💋💋", "So brave!",
];

interface ChatMsg { id: string; name: string; text: string; color: string; }

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function GoLiveScreen() {
  const insets = useSafeAreaInsets();
  const { userId, getToken } = useAuth();
  const { setIsLive } = useApp();
  const { data: profileData } = useGetMyProfile();
  const hostName = profileData?.profile?.name ?? "Tu";

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Dating");
  const [phase, setPhase] = useState<Phase>("setup");
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState("");
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [msgIdx, setMsgIdx] = useState(0);

  // Native Agora ref
  const engineRef = useRef<any>(null);
  // Web Agora refs
  const webClientRef = useRef<any>(null);
  const webCamRef = useRef<any>(null);
  const webMicRef = useRef<any>(null);
  const webCameraContainerRef = useRef<any>(null);

  const listRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== "connecting") return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [phase]);

  // Play web camera into container when phase becomes live
  useEffect(() => {
    if (Platform.OS === "web" && phase === "live" && webCamRef.current && webCameraContainerRef.current) {
      try { webCamRef.current.play(webCameraContainerRef.current); } catch {}
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "live" || !sessionId) return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    const beat = setInterval(() => heartbeatLiveSession(sessionId), 15000);
    const viewerSim = setInterval(() => {
      setViewers((n) => Math.max(1, n + Math.floor((Math.random() - 0.3) * 4)));
    }, 4000);
    const chatSim = setInterval(() => {
      setMsgIdx((i) => {
        const idx = i % MOCK_COMMENTS.length;
        const names = ["Ana", "Bogdan", "Cris", "Delia", "Emil", "Fiona", "Gabi", "Horia"];
        const name = names[Math.floor(Math.random() * names.length)];
        const color = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
        setMessages((prev) => [...prev.slice(-40), {
          id: Date.now().toString() + Math.random(),
          name, text: MOCK_COMMENTS[idx], color,
        }]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
        return i + 1;
      });
    }, 2500);
    return () => { clearInterval(timer); clearInterval(beat); clearInterval(viewerSim); clearInterval(chatSim); };
  }, [phase, sessionId]);

  function spawnReaction(emoji: string) {
    const id = Math.random().toString(36);
    const x = 20 + Math.random() * 50;
    setReactions((r) => [...r, { id, emoji, x }]);
    setTimeout(() => setReactions((r) => r.filter((rx) => rx.id !== id)), 2200);
  }

  async function handleGoLive() {
    // Request permissions on Android only
    if (Platform.OS === "android") {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const ok =
        result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      if (!ok) {
        Alert.alert("Permissions required", "SparkFuse needs camera and microphone access.", [{ text: "OK" }]);
        return;
      }
    }

    // On web, request browser permissions proactively
    if (Platform.OS === "web") {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        Alert.alert("Permissions required", "Please allow camera and microphone access in your browser to go live.");
        return;
      }
    }

    setPhase("connecting");
    try {
      const data = await createBroadcast({
        name: hostName, category, hostUserId: userId ?? undefined, hostName,
      });

      // ── Web path ─────────────────────────────────────────────────────────
      if (Platform.OS === "web" && AgoraRTC) {
        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        await client.setClientRole("host");
        await client.join(data.appId, data.channelName, data.token, 0);
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        webClientRef.current = client;
        webCamRef.current = camTrack;
        webMicRef.current = micTrack;
        await client.publish([micTrack, camTrack]);
      }

      // ── Native path ───────────────────────────────────────────────────────
      if (AgoraModule && Platform.OS !== "web") {
        if (engineRef.current) { try { engineRef.current.release(); } catch {} }
        const eng = AgoraModule.createAgoraRtcEngine();
        eng.initialize({
          appId: data.appId,
          channelProfile: AgoraModule.ChannelProfileType.ChannelProfileLiveBroadcasting,
        });
        eng.enableVideo();
        eng.enableAudio();
        eng.startPreview();
        eng.setClientRole(AgoraModule.ClientRoleType.ClientRoleBroadcaster);
        eng.registerEventHandler({
          onJoinChannelSuccess: (_connection: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: (errCode: number, msg: string) => {
            console.error("[Agora Live] error", errCode, msg);
          },
        });
        eng.joinChannel(data.token, data.channelName, 0, {
          clientRoleType: AgoraModule.ClientRoleType.ClientRoleBroadcaster,
        });
        engineRef.current = eng;
      }

      setSessionId(data.sessionId);
      setViewers(1);
      setPhase("live");
      await setIsLive(true);
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(err.message ?? "Could not start the live stream.");
    }
  }

  async function handleEndLive() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Web cleanup
    if (Platform.OS === "web") {
      try {
        webCamRef.current?.stop(); webCamRef.current?.close();
        webMicRef.current?.stop(); webMicRef.current?.close();
        await webClientRef.current?.leave();
      } catch {}
    } else {
      try { engineRef.current?.leaveChannel(); engineRef.current?.release(); engineRef.current = null; } catch {}
    }
    if (sessionId) await endLiveSession(sessionId);
    // Log minute statistics (informational, no billing)
    if (duration > 0) {
      try {
        const tok = await getToken();
        const mins = Math.max(1, Math.ceil(duration / 60));
        fetch(`${getApiUrl()}/api/usage/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ type: "live", minutes: mins }),
        }).catch(() => {});
      } catch {}
    }
    await setIsLive(false);
    router.back();
  }

  function handleSendMsg() {
    if (!inputText.trim()) return;
    const color = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
    setMessages((prev) => [...prev.slice(-40), { id: Date.now().toString(), name: "Me", text: inputText.trim(), color }]);
    setInputText("");
    spawnReaction(REACTION_EMOJIS[Math.floor(Math.random() * 4)]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }

  if (phase === "error") {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }]}>
        <Ionicons name="warning-outline" size={48} color="#FF3366" />
        <Text style={{ color: "#fff", fontSize: 15, textAlign: "center", marginTop: 16, fontFamily: "Inter_400Regular" }}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => setPhase("setup")} style={{ marginTop: 20 }}>
          <Text style={{ color: "#FF6B9D", fontFamily: "Inter_600SemiBold" }}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular" }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "connecting") {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
        <Ionicons name="radio" size={44} color="#FF3366" />
        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Inter_500Medium", marginTop: 20 }}>
          Se pornește live-ul…
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* ── Camera feed background ── */}
      {/* Web: always-mounted div for Agora camera preview */}
      {Platform.OS === "web" && (
        <View
          ref={webCameraContainerRef}
          style={[StyleSheet.absoluteFill, {
            backgroundColor: "#08080F",
            display: phase === "live" ? "flex" : "none",
          }]}
        />
      )}
      {/* Native: Agora RtcSurfaceView */}
      {Platform.OS !== "web" && AgoraModule && phase === "live" && engineRef.current ? (
        <AgoraModule.RtcSurfaceView
          canvas={{ uid: 0, sourceType: AgoraModule.VideoSourceType.VideoSourceCamera }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {/* Dark background for setup phase */}
      {phase !== "live" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#08080F" }]} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.8)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ─── SETUP phase overlay ─── */}
      {phase === "setup" && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end", paddingBottom: insets.bottom + 44 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { top: insets.top + 14 }]}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.livePill, { top: insets.top + 12 }]}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            <Text style={styles.setupTitle}>Intră Live</Text>
            <Text style={styles.setupSub}>Selectează categoria și transmite live</Text>

            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} activeOpacity={0.85}
                  style={[styles.chip, category === c && styles.chipActive]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleGoLive} activeOpacity={0.88} style={{ marginTop: 28, borderRadius: 28, overflow: "hidden" }}>
              <LinearGradient colors={["#FF3366", "#FF6B35"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goLiveBtn}>
                <Ionicons name="radio" size={18} color="#fff" />
                <Text style={styles.goLiveBtnText}>Începe Live</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── LIVE phase overlay ─── */}
      {phase === "live" && (
        <>
          {/* Top bar */}
          <View style={[styles.liveTopBar, { paddingTop: insets.top + 10 }]}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE</Text>
              <Text style={styles.liveTimer}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.viewerChip}>
              <Ionicons name="eye" size={12} color="#fff" />
              <Text style={styles.viewerText}>{viewers}</Text>
            </View>
          </View>

          {/* Floating reactions */}
          {reactions.map((r) => (
            <Animated.Text key={r.id} style={[styles.floatingReaction, { left: `${r.x}%` as any }]}>
              {r.emoji}
            </Animated.Text>
          ))}

          {/* Chat list */}
          <View style={styles.chatArea}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <View style={styles.chatRow}>
                  <Text style={[styles.chatName, { color: item.color }]}>{item.name}  </Text>
                  <Text style={styles.chatText}>{item.text}</Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 4, paddingVertical: 6 }}
            />
          </View>

          {/* Bottom: input + stop */}
          <View style={[styles.liveBottom, { paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.inputWrap}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Scrie ceva…"
                placeholderTextColor="#555"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={handleSendMsg}
              />
              {inputText.trim() ? (
                <TouchableOpacity onPress={handleSendMsg}>
                  <Ionicons name="send" size={16} color="#FF3366" />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={handleEndLive} activeOpacity={0.85} style={styles.endBtn}>
              <Ionicons name="stop-circle" size={18} color="#fff" />
              <Text style={styles.endBtnText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  closeBtn: {
    position: "absolute", left: 16, width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#ffffff18", alignItems: "center", justifyContent: "center", zIndex: 20,
  },
  livePill: {
    position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#CC000099", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, zIndex: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  livePillText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  setupTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 6 },
  setupSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", marginBottom: 20 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ffffff30", backgroundColor: "#ffffff0f" },
  chipActive: { backgroundColor: "#FF3366", borderColor: "#FF3366" },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#9A93B3" },
  chipTextActive: { color: "#fff" },
  goLiveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 28 },
  goLiveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  pulseRing: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: "#FF336655", backgroundColor: "#FF336612" },
  liveTopBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#CC000088", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  liveTimer: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff", marginLeft: 4 },
  viewerChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#00000066", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  viewerText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  floatingReaction: { position: "absolute", bottom: 180, fontSize: 30, zIndex: 99 },
  chatArea: { position: "absolute", bottom: 80, left: 0, width: "68%", maxHeight: 260, paddingLeft: 12 },
  chatRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", backgroundColor: "#00000066", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", maxWidth: "100%", marginBottom: 4 },
  chatName: { fontSize: 12, fontFamily: "Inter_700Bold" },
  chatText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#fff", flexShrink: 1 },
  liveBottom: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: "rgba(0,0,0,0.55)" },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff15", borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#ffffff12" },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#fff" },
  endBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FF3366", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, shadowColor: "#FF3366", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  endBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});

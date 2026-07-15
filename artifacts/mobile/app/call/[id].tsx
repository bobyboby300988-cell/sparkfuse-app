import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALL_PROFILES } from "@/data/allProfiles";
import { useGetMatches } from "@workspace/api-client-react";
import { getPhotoUrl } from "@/lib/api";

type CallPhase = "connecting" | "connected";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreen() {
  const { id, mode, name: nameParam, photo: photoParam } = useLocalSearchParams<{
    id: string;
    mode?: string;
    name?: string;
    photo?: string;
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
        photo: photoUrl ? { uri: photoUrl } : require("../../assets/images/p1.png"),
      };
    }
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
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse ring while connecting
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Auto-connect after 2.5 seconds (simulated ring)
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase("connected");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  // Duration timer once connected
  useEffect(() => {
    if (phase !== "connected") return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const handleMute = () => {
    setMuted((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCamera = () => {
    setCameraOff((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSpeaker = () => {
    setSpeakerOn((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  return (
    <View style={styles.container}>
      {/* Background — person's photo always */}
      <Image
        source={profile.photo}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <BlurView
        intensity={phase === "connected" && !isVoice ? 0 : 70}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      {/* Extra dark overlay for voice calls */}
      {(isVoice || phase === "connecting") && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(13,11,18,0.7)" }]} />
      )}

      {/* ── TOP BAR ── */}
      <View style={[styles.topBar, { paddingTop: (insets.top || 0) + 16 }]}>
        <TouchableOpacity onPress={handleEndCall} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={styles.callerName}>{profile.name}</Text>
          <Text style={styles.callStatus}>
            {phase === "connecting"
              ? (isVoice ? "Calling…" : "Starting video call…")
              : (phase === "connected" && isVoice ? `🔊 ${formatDuration(duration)}` : formatDuration(duration))}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── CONNECTING PHASE ── */}
      {phase === "connecting" && (
        <View style={styles.center}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Image source={profile.photo} style={styles.connectingAvatar} contentFit="cover" />
          <Text style={styles.connectingLabel}>
            {isVoice ? "📞 Voice call" : "📹 Video call"}
          </Text>
        </View>
      )}

      {/* ── CONNECTED PHASE ── */}
      {phase === "connected" && (
        <Animated.View style={[styles.connectedContainer, { opacity: fadeAnim }]}>
          {isVoice ? (
            // Voice call: show large avatar centered
            <View style={styles.center}>
              <Image source={profile.photo} style={styles.voiceAvatar} contentFit="cover" />
              <Text style={styles.voiceConnectedLabel}>Connected</Text>
              <Text style={styles.voiceDuration}>{formatDuration(duration)}</Text>
            </View>
          ) : (
            // Video call: full blurred background + self-view
            <View style={styles.videoContainer}>
              {/* Self-view (camera off or on) */}
              <View style={[styles.selfView, { right: 16, top: (insets.top || 0) + 70 }]}>
                {cameraOff ? (
                  <View style={styles.selfViewOff}>
                    <Ionicons name="videocam-off" size={22} color="rgba(255,255,255,0.6)" />
                  </View>
                ) : (
                  <View style={styles.selfViewOn}>
                    <Ionicons name="person" size={30} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── CONTROLS ── */}
      <View style={[styles.controls, { paddingBottom: (insets.bottom || 0) + 28 }]}>
        {/* Row 1: Mute / Speaker or Camera / End call */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.controlBtn, muted && styles.controlBtnActive]} onPress={handleMute}>
            <Ionicons name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
            <Text style={styles.controlLabel}>{muted ? "Unmute" : "Mute"}</Text>
          </TouchableOpacity>

          {!isVoice && (
            <TouchableOpacity style={[styles.controlBtn, cameraOff && styles.controlBtnActive]} onPress={handleCamera}>
              <Ionicons name={cameraOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
              <Text style={styles.controlLabel}>{cameraOff ? "Camera on" : "Camera off"}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.controlBtn, speakerOn && styles.controlBtnActive]} onPress={handleSpeaker}>
            <Ionicons name={speakerOn ? "volume-high" : "volume-low"} size={24} color="#fff" />
            <Text style={styles.controlLabel}>{speakerOn ? "Speaker" : "Earpiece"}</Text>
          </TouchableOpacity>
        </View>

        {/* End call button */}
        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} activeOpacity={0.8}>
          <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>
      </View>
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
    backgroundColor: "rgba(255,255,255,0.15)",
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

  connectedContainer: { flex: 1 },

  videoContainer: { flex: 1 },
  selfView: {
    position: "absolute",
    width: 90,
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  selfViewOff: {
    flex: 1,
    backgroundColor: "#1a1828",
    alignItems: "center",
    justifyContent: "center",
  },
  selfViewOn: {
    flex: 1,
    backgroundColor: "#2a2638",
    alignItems: "center",
    justifyContent: "center",
  },

  voiceAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  voiceConnectedLabel: {
    fontSize: 18,
    color: "#22C55E",
    fontFamily: "Inter_600SemiBold",
  },
  voiceDuration: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },

  controls: {
    alignItems: "center",
    gap: 24,
    paddingTop: 16,
    paddingHorizontal: 32,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
  },
  controlBtn: {
    alignItems: "center",
    gap: 6,
    width: 64,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  controlLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
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

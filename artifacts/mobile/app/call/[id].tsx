import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_PROFILES } from "@/data/profiles";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const profile = useMemo(
    () => MOCK_PROFILES.find((p) => p.id === id),
    [id]
  );

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callState, setCallState] = useState<"connecting" | "connected">("connecting");
  const [duration, setDuration] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const connectingDots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const connectTimer = setTimeout(() => {
      setCallState("connected");
      pulse.stop();
      pulseAnim.setValue(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);

    return () => {
      pulse.stop();
      clearTimeout(connectTimer);
    };
  }, []);

  useEffect(() => {
    if (callState !== "connected") return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const toggleMute = () => {
    setIsMuted((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCamera = () => {
    setIsCameraOff((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: "#0D0B12" }]}>
        <Text style={{ color: "#fff" }}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-screen partner "video" background */}
      <Image
        source={profile.photo}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <BlurView
        intensity={callState === "connecting" ? 60 : 20}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      {/* Top info */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.callerName}>{profile.name}</Text>
        {callState === "connecting" ? (
          <Text style={styles.callStatus}>Connecting…</Text>
        ) : (
          <Text style={styles.callTimer}>{formatDuration(duration)}</Text>
        )}
      </View>

      {/* Connecting pulse avatar */}
      {callState === "connecting" && (
        <View style={styles.connectingCenter}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Image source={profile.photo} style={styles.connectingAvatar} resizeMode="cover" />
        </View>
      )}

      {/* Own camera preview (corner) */}
      {callState === "connected" && !isCameraOff && (
        <View
          style={[
            styles.selfPreview,
            { top: insets.top + 80, right: 16 },
          ]}
        >
          <View style={styles.selfPreviewInner}>
            <Ionicons name="person" size={32} color="#ffffff88" />
            <Text style={styles.selfPreviewLabel}>You</Text>
          </View>
        </View>
      )}

      {callState === "connected" && isCameraOff && (
        <View style={[styles.selfPreview, { top: insets.top + 80, right: 16 }]}>
          <View style={[styles.selfPreviewInner, { backgroundColor: "#1A1826" }]}>
            <Ionicons name="videocam-off" size={24} color="#9A93B3" />
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}>
        <ControlButton
          icon={isMuted ? "mic-off" : "mic"}
          label={isMuted ? "Unmute" : "Mute"}
          active={isMuted}
          onPress={toggleMute}
        />
        <ControlButton
          icon={isCameraOff ? "videocam-off" : "videocam"}
          label={isCameraOff ? "Start video" : "Stop video"}
          active={isCameraOff}
          onPress={toggleCamera}
        />
        <ControlButton
          icon={isSpeakerOn ? "volume-high" : "volume-mute"}
          label="Speaker"
          active={!isSpeakerOn}
          onPress={toggleSpeaker}
        />

        {/* End call */}
        <TouchableOpacity
          style={styles.endCallBtn}
          onPress={handleEndCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.controlBtnWrap} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.controlBtn, active && styles.controlBtnActive]}>
        <Ionicons name={icon} size={24} color={active ? "#FF3366" : "#ffffff"} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0B12",
  },
  topBar: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 6,
  },
  callerName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  callStatus: {
    fontSize: 16,
    color: "#ffffffaa",
    fontFamily: "Inter_400Regular",
  },
  callTimer: {
    fontSize: 18,
    color: "#22C55E",
    fontFamily: "Inter_500Medium",
    fontWeight: "600",
  },
  connectingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "#FF336660",
    backgroundColor: "#FF336615",
  },
  connectingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FF3366",
  },
  selfPreview: {
    position: "absolute",
    width: 90,
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ffffff30",
  },
  selfPreviewInner: {
    flex: 1,
    backgroundColor: "#241F35",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  selfPreviewLabel: {
    color: "#ffffffaa",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    gap: 20,
  },
  controlBtnWrap: {
    alignItems: "center",
    gap: 8,
  },
  controlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  controlLabel: {
    color: "#ffffffcc",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  endCallBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});

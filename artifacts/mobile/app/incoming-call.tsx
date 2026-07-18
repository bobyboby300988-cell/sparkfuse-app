import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { getApiUrl } from "@/lib/api";
import { useGetMyProfile } from "@workspace/api-client-react";

export default function IncomingCallScreen() {
  const { callId, callerId, callerName, callerPhoto, isVoice } =
    useLocalSearchParams<{ callId: string; callerId: string; callerName: string; callerPhoto?: string; isVoice?: string }>();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { data: profileData } = useGetMyProfile();
  const [busy, setBusy] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    const ring = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    ring.start();

    // Auto-dismiss after 60s
    const timer = setTimeout(() => router.back(), 60_000);
    return () => { pulse.stop(); ring.stop(); clearTimeout(timer); };
  }, []);

  const handleAccept = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const tok = await getToken();
      const calleeName = profileData?.profile?.name ?? "User";
      const res = await fetch(`${getApiUrl()}/api/calls/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ callId, accept: true, calleeName }),
      });
      const data = (await res.json()) as { roomUrl: string; token: string; isVoice: boolean };
      router.replace({
        pathname: "/call/[id]",
        params: {
          id: callerId,
          mode: data.isVoice ? "voice" : "video",
          roomUrl: data.roomUrl,
          token: data.token,
          name: callerName,
          photo: callerPhoto ?? "",
        },
      });
    } catch {
      router.back();
    }
  };

  const handleDecline = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    try {
      const tok = await getToken();
      await fetch(`${getApiUrl()}/api/calls/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ callId, accept: false }),
      });
    } catch {}
    router.back();
  };

  const ringRotate = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ["-10deg", "10deg"] });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}>
      <Text style={styles.calling}>{isVoice === "true" ? "Apel vocal incoming" : "Apel video incoming"}</Text>

      <Animated.View style={[styles.avatarWrap, { transform: [{ scale: pulseAnim }] }]}>
        {callerPhoto ? (
          <Image source={{ uri: callerPhoto }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{(callerName ?? "?")[0].toUpperCase()}</Text>
          </View>
        )}
      </Animated.View>

      <Text style={styles.name}>{callerName}</Text>
      <Text style={styles.subtitle}>te sună…</Text>

      <Animated.View style={{ transform: [{ rotate: ringRotate }], marginBottom: 16 }}>
        <Ionicons name={isVoice === "true" ? "call" : "videocam"} size={36} color="#FF3366" />
      </Animated.View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={handleDecline} disabled={busy}>
          <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          <Text style={styles.btnLabel}>Refuză</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept} disabled={busy}>
          <Ionicons name={isVoice === "true" ? "call" : "videocam"} size={32} color="#fff" />
          <Text style={styles.btnLabel}>Răspunde</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calling: {
    color: "#aaa",
    fontSize: 15,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  avatarWrap: {
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: "#FF3366",
  },
  avatarFallback: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 64,
    color: "#FF3366",
    fontWeight: "bold",
  },
  name: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#aaa",
    fontSize: 18,
  },
  buttons: {
    flexDirection: "row",
    gap: 60,
    alignItems: "center",
  },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  declineBtn: { backgroundColor: "#E53935" },
  acceptBtn: { backgroundColor: "#43A047" },
  btnLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    position: "absolute",
    bottom: -22,
  },
});

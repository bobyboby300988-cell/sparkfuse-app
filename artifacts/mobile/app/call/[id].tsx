import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMatches } from "@workspace/api-client-react";
import { getApiUrl, getPhotoUrl } from "@/lib/api";
import { ALL_PROFILES } from "@/data/allProfiles";
import { useAuth } from "@clerk/expo";

const AgoraModule = (() => { try { return require("react-native-agora"); } catch { return null; } })();
const AgoraRTC = (() => {
  try {
    if (Platform.OS !== "web") return null;
    return require("agora-rtc-sdk-ng").default;
  } catch { return null; }
})();

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallScreen() {
  const {
    id, mode, name: nameParam, photo: photoParam,
    channelName, token, appId, callId,
  } = useLocalSearchParams<{
    id: string; mode?: string; name?: string; photo?: string;
    channelName?: string; token?: string; appId?: string; callId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const isVoice = mode === "voice";

  const { data: matchesServerData } = useGetMatches();
  const profile = (() => {
    const mock = ALL_PROFILES.find((p) => p.id === id);
    if (mock) return mock;
    const srv = matchesServerData?.matches?.find((p) => p.userId === id);
    if (srv) return { id: srv.userId, name: srv.name, photo: getPhotoUrl(srv.photoUrl) ? { uri: getPhotoUrl(srv.photoUrl) as string } : require("../../assets/images/p1.png") };
    if (nameParam) return { id: id ?? "", name: nameParam, photo: photoParam ? { uri: photoParam } : require("../../assets/images/p1.png") };
    return null;
  })();

  const [connected, setConnected] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // Native Agora ref
  const engineRef = useRef<any>(null);
  // Web Agora refs
  const webClientRef = useRef<any>(null);
  const webAudioTrackRef = useRef<any>(null);
  const webVideoTrackRef = useRef<any>(null);
  const remoteVideoDivRef = useRef<any>(null);
  const localVideoDivRef = useRef<any>(null);
  const webRemoteVideoTrackRef = useRef<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Play remote video track into div when it arrives (web)
  useEffect(() => {
    if (Platform.OS === "web" && webRemoteVideoTrackRef.current && remoteVideoDivRef.current && remoteUid !== null) {
      try { webRemoteVideoTrackRef.current.play(remoteVideoDivRef.current); } catch {}
    }
  }, [remoteUid]);

  // Play local video into PiP div when connected (web)
  useEffect(() => {
    if (Platform.OS === "web" && webVideoTrackRef.current && localVideoDivRef.current && connected && !isVoice) {
      try { webVideoTrackRef.current.play(localVideoDivRef.current); } catch {}
    }
  }, [connected]);

  // Initialize Agora and join channel
  useEffect(() => {
    if (!channelName || !token || !appId) return;

    // ── Web path ──────────────────────────────────────────────────────────
    if (Platform.OS === "web" && AgoraRTC) {
      let client: any = null;
      (async () => {
        try {
          client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
          webClientRef.current = client;

          client.on("user-published", async (user: any, mediaType: string) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
              webRemoteVideoTrackRef.current = user.videoTrack;
              setRemoteUid(user.uid);
            }
            if (mediaType === "audio") {
              user.audioTrack.play();
            }
          });

          client.on("user-unpublished", () => {
            webRemoteVideoTrackRef.current = null;
            setRemoteUid(null);
          });

          await client.join(appId, channelName, token, 0);

          let audioTrack: any, videoTrack: any;
          if (isVoice) {
            audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          } else {
            [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          }
          webAudioTrackRef.current = audioTrack;
          webVideoTrackRef.current = videoTrack ?? null;

          const tracks = isVoice ? [audioTrack] : [audioTrack, videoTrack];
          await client.publish(tracks);
          // Connected as soon as we join and publish — don't wait for remote
          setConnected(true);
        } catch (e: any) {
          console.error("[Agora Web] failed:", e?.message ?? e);
          Alert.alert("Call error", `Could not connect: ${e?.message ?? "browser may block camera/mic"}`);
        }
      })();
      return () => {
        try {
          webAudioTrackRef.current?.stop(); webAudioTrackRef.current?.close();
          webVideoTrackRef.current?.stop(); webVideoTrackRef.current?.close();
          client?.leave();
        } catch {}
      };
    }

    // ── Native path ───────────────────────────────────────────────────────
    if (!AgoraModule) {
      console.warn("[Call] react-native-agora not available on this platform");
      return;
    }

    let eng: any = null;
    (async () => {
      try {
        // Request mic (and camera for video) before Agora init on Android
        if (Platform.OS === "android") {
          const perms = isVoice
            ? [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]
            : [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, PermissionsAndroid.PERMISSIONS.CAMERA];
          const result = await PermissionsAndroid.requestMultiple(perms);
          const micOk = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
          if (!micOk) {
            Alert.alert("Permission required", "Microphone access is required for calls.");
            return;
          }
        }

        eng = AgoraModule.createAgoraRtcEngine();
        eng.initialize({
          appId,
          channelProfile: AgoraModule.ChannelProfileType.ChannelProfileCommunication,
        });
        eng.enableAudio();
        if (!isVoice) {
          eng.enableVideo();
          eng.startPreview();
        }
        eng.registerEventHandler({
          onJoinChannelSuccess: (_connection: any, _elapsed: number) => {
            setConnected(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          // react-native-agora v4: onRemoteVideoStateChanged replaces onUserPublished
          onRemoteVideoStateChanged: (_connection: any, uid: number, state: number) => {
            if (state === 2) setRemoteUid(uid);    // 2 = Decoding/playing
            else if (state === 0) setRemoteUid(null); // 0 = Stopped
          },
          onRemoteAudioStateChanged: (_connection: any, uid: number, state: number) => {
            // 2 = Decoding — remote audio is flowing
            if (state === 2 && isVoice) setRemoteUid(uid);
          },
          onUserOffline: (_connection: any) => setRemoteUid(null),
          onError: (errCode: number, msg: string) => {
            console.error("[Agora] error", errCode, msg);
          },
        });
        eng.joinChannel(token, channelName, 0, {
          clientRoleType: AgoraModule.ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: !isVoice,
          autoSubscribeAudio: true,
          autoSubscribeVideo: !isVoice,
        });
        engineRef.current = eng;
      } catch (err: any) {
        console.error("[Agora] init failed:", err?.message ?? err);
        Alert.alert("Call error", `Could not initialize call: ${err?.message ?? "unknown error"}`);
      }
    })();

    return () => {
      try { engineRef.current?.leaveChannel(); engineRef.current?.release(); engineRef.current = null; } catch {}
    };
  }, [channelName, token, appId]);

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [connected]);

  function toggleMute() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !muted;
    setMuted(next);
    if (Platform.OS === "web") {
      try { webAudioTrackRef.current?.setEnabled(!next); } catch {}
    } else {
      try { engineRef.current?.muteLocalAudioStream(next); } catch {}
    }
  }

  function toggleCamera() {
    if (isVoice) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !cameraOff;
    setCameraOff(next);
    if (Platform.OS === "web") {
      try { webVideoTrackRef.current?.setEnabled(!next); } catch {}
    } else {
      try { engineRef.current?.muteLocalVideoStream(next); } catch {}
    }
  }

  async function handleEndCall() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === "web") {
      try {
        webAudioTrackRef.current?.stop(); webAudioTrackRef.current?.close();
        webVideoTrackRef.current?.stop(); webVideoTrackRef.current?.close();
        await webClientRef.current?.leave();
      } catch {}
    } else {
      try { engineRef.current?.leaveChannel(); engineRef.current?.release(); engineRef.current = null; } catch {}
    }
    if (callId) {
      try {
        const tok = await getToken();
        await fetch(`${getApiUrl()}/api/calls/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ callId }),
        });
      } catch {}
    }
    // Log minute statistics (informational, no billing)
    if (duration > 0) {
      try {
        const tok = await getToken();
        const mins = Math.max(1, Math.ceil(duration / 60));
        fetch(`${getApiUrl()}/api/usage/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ type: isVoice ? "voice" : "video", minutes: mins }),
        }).catch(() => {});
      } catch {}
    }
    router.back();
  }

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Profil negăsit</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: "#FF3366", fontSize: 15 }}>Înapoi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showRemoteWebVideo = Platform.OS === "web" && !isVoice && remoteUid !== null && connected;
  const showLocalWebVideo = Platform.OS === "web" && !isVoice && connected && !cameraOff;

  return (
    <View style={styles.container}>
      {/* ─── Remote video (full screen) ─── */}
      {/* Web: always-mounted div, shown when remote is connected */}
      {Platform.OS === "web" && !isVoice && (
        <View
          ref={remoteVideoDivRef}
          style={[StyleSheet.absoluteFill, { display: showRemoteWebVideo ? "flex" : "none", backgroundColor: "#000" }]}
        />
      )}
      {/* Fallback background when no remote video */}
      {(!showRemoteWebVideo && !(AgoraModule && !isVoice && remoteUid !== null && connected)) && (
        <>
          <Image source={profile.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,8,18,0.65)" }]} />
        </>
      )}
      {/* Native remote video */}
      {AgoraModule && !isVoice && remoteUid !== null && connected && Platform.OS !== "web" && (
        <AgoraModule.RtcSurfaceView
          canvas={{ uid: remoteUid }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* ─── Top bar ─── */}
      <View style={[styles.topBar, { paddingTop: (insets.top || 0) + 14 }]}>
        <TouchableOpacity onPress={handleEndCall} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={styles.callerName}>{profile.name}</Text>
          <Text style={styles.callStatus}>
            {!connected
              ? (isVoice ? t("call.connecting") : t("call.initializingVideo"))
              : (isVoice ? `📞 ${formatDuration(duration)}` : `📹 ${formatDuration(duration)}`)}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ─── Connecting animation ─── */}
      {!connected && (
        <View style={styles.center}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Image source={profile.photo} style={styles.connectingAvatar} contentFit="cover" />
        </View>
      )}

      {/* ─── Local camera PiP ─── */}
      {/* Web local PiP */}
      {Platform.OS === "web" && !isVoice && (
        <View
          ref={localVideoDivRef}
          style={[styles.localPip, { top: (insets.top || 0) + 70, display: showLocalWebVideo ? "flex" : "none" }]}
        />
      )}
      {/* Native local PiP */}
      {AgoraModule && !isVoice && connected && engineRef.current && !cameraOff && Platform.OS !== "web" && (
        <View style={[styles.localPip, { top: (insets.top || 0) + 70 }]}>
          <AgoraModule.RtcSurfaceView
            canvas={{ uid: 0, sourceType: AgoraModule.VideoSourceType.VideoSourceCamera }}
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
          />
        </View>
      )}

      {/* ─── Controls ─── */}
      <View style={[styles.controls, { paddingBottom: (insets.bottom || 0) + 32 }]}>
        {connected && (
          <Text style={styles.timerText}>{formatDuration(duration)}</Text>
        )}
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={toggleMute} style={[styles.controlBtn, muted && styles.controlBtnActive]} activeOpacity={0.8}>
            <Ionicons name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEndCall} style={styles.endCallBtn} activeOpacity={0.8}>
            <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>

          {!isVoice ? (
            <TouchableOpacity onPress={toggleCamera} style={[styles.controlBtn, cameraOff && styles.controlBtnActive]} activeOpacity={0.8}>
              <Ionicons name={cameraOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.controlBtn} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0B12" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  callerName: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  callStatus: { fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pulseRing: { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: "rgba(255,51,102,0.4)", backgroundColor: "rgba(255,51,102,0.07)" },
  connectingAvatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: "#FF3366" },
  localPip: { position: "absolute", right: 16, width: 100, height: 140, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "#FF3366", backgroundColor: "#000" },
  controls: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  timerText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 20 },
  controlRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  controlBtnActive: { backgroundColor: "rgba(255,51,102,0.4)" },
  endCallBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#FF3366", alignItems: "center", justifyContent: "center", shadowColor: "#FF3366", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
});

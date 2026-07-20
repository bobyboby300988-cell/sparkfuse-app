import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useCreateBlock } from "@workspace/api-client-react";
import GiftModal, { GiftSentInfo } from "@/components/GiftModal";
import GiftSplashOverlay from "@/components/GiftSplashOverlay";
import { CATEGORY_COLORS, LIVE_STREAMS, MOCK_CHAT, LiveStream } from "@/data/livestreams";
import { ALL_PROFILES } from "@/data/allProfiles";
import { useApp } from "@/context/AppContext";
import { fetchLiveSession, fetchViewerToken, LiveSession } from "@/lib/liveApi";
import { acquireAgoraEngine, releaseAgoraEngine } from "@/lib/agoraEngine";

const AgoraModule = (() => { try { return require("react-native-agora"); } catch { return null; } })();
const AgoraRTC = (() => {
  try {
    if (Platform.OS !== "web") return null;
    return require("agora-rtc-sdk-ng").default;
  } catch { return null; }
})();

const MODE_TO_CATEGORY: Record<string, LiveStream["category"]> = {
  dating: "Dating",
  naughty: "Naughty",
  party: "Party",
  social: "Social",
  business: "Dating",
  travel: "Social",
};

function streamFromProfile(profileId: string): LiveStream | null {
  const profile = ALL_PROFILES.find((p) => p.id === profileId && p.isLive);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    avatar: profile.photo,
    tagline: profile.bio.split(".")[0],
    category: MODE_TO_CATEGORY[profile.mode] ?? "Dating",
    viewers: 200 + (profile.id.length * 37) % 900,
    tokens: 500 + (profile.id.length * 211) % 8000,
    isVerified: true,
    badges: ["🔥 Live now"],
  };
}

/* ── floating reaction (hearts / emojis) ── */
const REACTION_EMOJIS = ["❤️","💋","🔥","😍","💕","🌹","😈","🍑","👑","⚡"];

function FloatingReaction({ emoji, startX }: { emoji: string; startX: number }) {
  const y   = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(1)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,   { toValue: -260, duration: 2200, useNativeDriver: true }),
      Animated.timing(op,  { toValue: 0,    duration: 2200, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(rot, { toValue:  1, duration: 400, useNativeDriver: true }),
        Animated.timing(rot, { toValue: -1, duration: 400, useNativeDriver: true }),
        Animated.timing(rot, { toValue:  0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ["-18deg", "18deg"] });

  return (
    <Animated.Text style={[
      styles.floatingReaction,
      { left: startX, transform: [{ translateY: y }, { rotate }], opacity: op },
    ]}>
      {emoji}
    </Animated.Text>
  );
}

/* ── chat message row ── */
interface ChatMsg {
  id: string;
  name: string;
  text: string;
  gift?: string;
  isGift: boolean;
  color: string;
}

const NAME_COLORS = ["#FF6B9D","#C77DFF","#48CAE4","#FFD166","#FF6B35","#FF3366","#4895EF"];

function ChatRow({ msg, onPressName }: { msg: ChatMsg; onPressName: (name: string) => void }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 10 }),
      Animated.timing(opAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const canModerate = msg.name !== "You";

  if (msg.isGift) {
    return (
      <Animated.View style={[styles.giftMsgRow, { transform: [{ translateX: slideAnim }], opacity: opAnim }]}>
        <LinearGradient colors={["#FF336620","#FF6B3520"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.giftMsgBg}>
          <Text style={styles.giftMsgEmoji}>{msg.gift?.split(" ")[0]}</Text>
          <View style={{ flex: 1 }}>
            <TouchableOpacity disabled={!canModerate} onPress={() => onPressName(msg.name)} hitSlop={8}>
              <Text style={[styles.chatName, { color: msg.color }]}>{msg.name}</Text>
            </TouchableOpacity>
            <Text style={styles.giftMsgText}>sent  <Text style={{ color: "#FF6B35" }}>{msg.gift}</Text> 🎁</Text>
          </View>
          <Text style={styles.giftMsgST}>+ST</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.chatRow, { transform: [{ translateX: slideAnim }], opacity: opAnim }]}>
      <TouchableOpacity disabled={!canModerate} onPress={() => onPressName(msg.name)} hitSlop={8}>
        <Text style={[styles.chatName, { color: msg.color }]}>{msg.name}  </Text>
      </TouchableOpacity>
      <Text style={styles.chatText}>{msg.text}</Text>
    </Animated.View>
  );
}

/* ══ Main Live Screen ══ */
export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { coinBalance, spendCoins, addEarning } = useApp();
  const { mutateAsync: blockUser } = useCreateBlock();

  const handleBlockPress = () => {
    Alert.alert(
      `Block ${mockStream.name}?`,
      "You won't see their live streams, profile, or messages anymore. This can't be undone from here.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            if (id) {
              try {
                await blockUser({ data: { targetUserId: id } });
              } catch {
                // still leave the stream even if the request fails
              }
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const FALLBACK_STREAM: LiveStream = {
    id: id ?? "unknown",
    name: "Live host",
    age: 0,
    avatar: require("../../assets/images/p1.png"),
    tagline: "Broadcasting live right now",
    category: "Dating",
    viewers: 1,
    tokens: 0,
    isVerified: false,
    badges: ["🔴 Live now"],
  };
  const mockStream = LIVE_STREAMS.find((s) => s.id === id) ?? streamFromProfile(id) ?? FALLBACK_STREAM;

  /* Real broadcast lookup — if this id matches an active live session on the
     server, we join the Agora channel as an audience member. */
  const [realSession, setRealSession] = useState<LiveSession | null>(null);
  const [agoraData, setAgoraData] = useState<{ token: string; channelName: string; appId: string } | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const engineRef = useRef<any>(null);
  // Web Agora refs
  const webClientRef = useRef<any>(null);
  const webRemoteVideoTrackRef = useRef<any>(null);
  const webVideoContainerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLiveSession(id ?? "")
      .then(async (session) => {
        if (cancelled || !session) return;
        setRealSession(session);
        const data = await fetchViewerToken(session.id);
        if (!cancelled) setAgoraData(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!agoraData) return;

    // ── Web viewer path ──────────────────────────────────────────────────
    if (Platform.OS === "web" && AgoraRTC) {
      let client: any = null;
      (async () => {
        try {
          client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
          webClientRef.current = client;
          await client.setClientRole("audience");
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
          await client.join(agoraData.appId, agoraData.channelName, agoraData.token, 0);
        } catch {}
      })();
      return () => {
        try { client?.leave(); } catch {}
      };
    }

    // ── Native viewer path ───────────────────────────────────────────────
    if (!AgoraModule) return;
    let eng: any = null;
    try {
      eng = acquireAgoraEngine(
        AgoraModule,
        agoraData.appId,
        AgoraModule.ChannelProfileType.ChannelProfileLiveBroadcasting,
      );
      eng.enableVideo();
      eng.setClientRole(AgoraModule.ClientRoleType.ClientRoleAudience);
      eng.registerEventHandler({
        // Primary: fires when a remote user starts/stops publishing
        onUserPublished: (_connection: any, uid: number, mediaType: string) => {
          if (mediaType === "video" || mediaType === "all") {
            setRemoteUid(uid);
          }
        },
        onUserUnpublished: (_connection: any, uid: number, mediaType: string) => {
          if (mediaType === "video" || mediaType === "all") {
            setRemoteUid((prev) => (prev === uid ? null : prev));
          }
        },
        // Fallback: state=2 means video is playing
        onRemoteVideoStateChanged: (_connection: any, uid: number, state: number) => {
          if (state === 2) setRemoteUid(uid);
          else if (state === 0) setRemoteUid((prev) => (prev === uid ? null : prev));
        },
        onUserOffline: (_connection: any, uid: number) => {
          setRemoteUid((prev) => (prev === uid ? null : prev));
        },
        onError: (errCode: number, msg: string) => {
          console.error("[Agora Viewer] error", errCode, msg);
        },
      });
      eng.joinChannel(agoraData.token, agoraData.channelName, 0, {
        clientRoleType: AgoraModule.ClientRoleType.ClientRoleAudience,
      });
      engineRef.current = eng;
    } catch (err: any) {
      console.error("[Agora Viewer] init failed:", err?.message ?? err);
    }
    return () => { releaseAgoraEngine(); };
  }, [agoraData]);

  // Play web remote video into container div when remoteUid changes
  useEffect(() => {
    if (Platform.OS === "web" && webRemoteVideoTrackRef.current && webVideoContainerRef.current && remoteUid !== null) {
      try { webRemoteVideoTrackRef.current.play(webVideoContainerRef.current); } catch {}
    }
  }, [remoteUid]);

  const isRealLive = !!realSession;
  const stream = isRealLive
    ? { ...mockStream, name: realSession!.name, category: realSession!.category as LiveStream["category"], isVerified: false, badges: ["🔴 Live now"] }
    : mockStream;
  const grad = CATEGORY_COLORS[stream.category] ?? ["#FF3366","#4A0000"];

  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [viewers,    setViewers]    = useState(mockStream.viewers);
  const [reactions,  setReactions]  = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [giftOpen,   setGiftOpen]   = useState(false);
  const [giftSplash, setGiftSplash] = useState<GiftSentInfo | null>(null);
  const [inputText,  setInputText]  = useState("");
  const [msgIdx,     setMsgIdx]     = useState(0);
  const [tokens,     setTokens]     = useState(mockStream.tokens);
  const [isLiked,    setIsLiked]    = useState(false);
  const [blockedNames, setBlockedNames] = useState<Set<string>>(new Set());
  const mutedUntilRef = useRef<Record<string, number>>({});

  const listRef = useRef<FlatList>(null);

  function isSilenced(name: string) {
    if (blockedNames.has(name)) return true;
    const until = mutedUntilRef.current[name];
    return !!until && Date.now() < until;
  }

  function handlePressChatName(name: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const options = ["View profile", "Mute 5 min", "Mute 10 min", "Mute for entire live", "Block", "Cancel"];
    const destructiveButtonIndex = 4;
    const cancelButtonIndex = 5;

    const runAction = (index: number) => {
      switch (index) {
        case 0:
          Alert.alert(name, "Viewer profiles aren't available for live chat commenters yet.");
          break;
        case 1:
          mutedUntilRef.current[name] = Date.now() + 5 * 60 * 1000;
          Alert.alert("Muted", `${name} can't chat for 5 minutes.`);
          break;
        case 2:
          mutedUntilRef.current[name] = Date.now() + 10 * 60 * 1000;
          Alert.alert("Muted", `${name} can't chat for 10 minutes.`);
          break;
        case 3:
          mutedUntilRef.current[name] = Infinity;
          Alert.alert("Muted", `${name} can't chat for the rest of this live.`);
          break;
        case 4:
          setBlockedNames((prev) => new Set(prev).add(name));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Blocked", `${name} has been blocked and removed from chat.`);
          break;
        default:
          break;
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex, cancelButtonIndex, title: name },
        (index) => runAction(index),
      );
    } else {
      Alert.alert(
        name,
        undefined,
        [
          { text: "View profile", onPress: () => runAction(0) },
          { text: "Mute 5 min", onPress: () => runAction(1) },
          { text: "Mute 10 min", onPress: () => runAction(2) },
          { text: "Mute for entire live", onPress: () => runAction(3) },
          { text: "Block", style: "destructive", onPress: () => runAction(4) },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }
  }

  function pushMsg(msg: Omit<ChatMsg, "id" | "color">) {
    const color = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
    setMessages((prev) => [...prev.slice(-60), { ...msg, id: Date.now().toString(), color }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }

  /* Auto chat messages */
  useEffect(() => {
    if (MOCK_CHAT.length === 0) return;
    const t = setInterval(() => {
      const entry = MOCK_CHAT[msgIdx % MOCK_CHAT.length];
      setMsgIdx((i) => i + 1);
      if (isSilenced(entry.name)) return;
      pushMsg({ name: entry.name, text: entry.text, gift: entry.gift, isGift: !!entry.gift });
      if (entry.gift) {
        setTokens((n) => n + Math.floor(Math.random() * 50 + 10));
        spawnReaction(REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)]);
      }
    }, 2200);
    return () => clearInterval(t);
  }, [msgIdx]);

  /* Viewer count fluctuation */
  useEffect(() => {
    const t = setInterval(() => {
      setViewers((n) => Math.max(1, n + Math.floor((Math.random() - 0.42) * 22)));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  function spawnReaction(emoji: string) {
    const id = Math.random().toString(36);
    const x  = 30 + Math.random() * 60;
    setReactions((r) => [...r, { id, emoji, x }]);
    setTimeout(() => setReactions((r) => r.filter((rx) => rx.id !== id)), 2400);
  }

  function handleLike() {
    setIsLiked((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spawnReaction("❤️");
  }

  function handleSendMsg() {
    if (!inputText.trim()) return;
    pushMsg({ name: "You", text: inputText.trim(), isGift: false });
    setInputText("");
    spawnReaction(REACTION_EMOJIS[Math.floor(Math.random() * 4)]);
  }

  const handleGiftSent = useCallback(() => {
    setTokens((n) => n + 20);
    spawnReaction("🎁");
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Full-screen stream video or mock background ── */}
      {/* Web: always-mounted div for Agora remote video */}
      {Platform.OS === "web" && (
        <View
          ref={webVideoContainerRef}
          style={[StyleSheet.absoluteFillObject, {
            backgroundColor: "#000",
            display: isRealLive && remoteUid !== null ? "flex" : "none",
          }]}
        />
      )}
      {/* Native: RtcSurfaceView for remote stream */}
      {Platform.OS !== "web" && isRealLive && AgoraModule && remoteUid !== null ? (
        <AgoraModule.RtcSurfaceView
          canvas={{ uid: remoteUid }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {/* Fallback: mock avatar background when no live video */}
      {!(isRealLive && remoteUid !== null) && (
        <Image source={mockStream.avatar} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.85)"]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* ── Floating reactions ── */}
      {reactions.map((r) => (
        <FloatingReaction key={r.id} emoji={r.emoji} startX={r.x} />
      ))}

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBlockPress} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Streamer info — tap → host profile */}
        <TouchableOpacity
          style={styles.streamerInfo}
          activeOpacity={0.82}
          onPress={() => {
            const hostId = realSession?.hostUserId;
            if (hostId) router.push({ pathname: "/profile/[id]", params: { id: hostId } });
          }}
        >
          <Image source={stream.avatar} style={styles.streamerAvatar} />
          <View>
            <Text style={styles.streamerName}>
              {stream.name}{stream.isVerified ? " ✓" : ""}
            </Text>
            <LinearGradient colors={grad} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{stream.category}</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Viewer count */}
        <View style={styles.viewerBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.viewerCount}>
            {viewers >= 1000 ? `${(viewers / 1000).toFixed(1)}k` : viewers}
          </Text>
          <Ionicons name="eye" size={12} color="#fff" />
        </View>
      </View>

      {/* ── Token earnings bar ── */}
      <View style={styles.tokenBar}>
        <Text style={styles.tokenBarEmoji}>🔥</Text>
        <Text style={styles.tokenBarText}>{tokens.toLocaleString()} ST earned</Text>
      </View>

      {/* ── Badges row ── */}
      <View style={styles.badgesRow}>
        {stream.badges.map((b) => (
          <View key={b} style={styles.badge}>
            <Text style={styles.badgeText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* ── Chat messages ── */}
      <View style={styles.chatArea}>
        <FlatList
          ref={listRef}
          data={messages.filter((m) => !blockedNames.has(m.name))}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatRow msg={item} onPressName={handlePressChatName} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 4, paddingVertical: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      {/* ── Bottom controls ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        {/* Text input */}
        <View style={styles.inputWrap}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Say something..."
            placeholderTextColor="#666"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSendMsg}
          />
          {inputText.trim() ? (
            <TouchableOpacity onPress={handleSendMsg} style={styles.sendBtn}>
              <Ionicons name="send" size={16} color="#FF3366" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Like */}
        <TouchableOpacity onPress={handleLike} style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#FF3366" : "#fff"} />
          <Text style={styles.iconBtnLabel}>Apreciez</Text>
        </TouchableOpacity>

        {/* ── GIFT ── */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setGiftOpen(true); }}
          style={styles.giftIconBtn}
          activeOpacity={0.82}
        >
          <LinearGradient
            colors={["#FF3366", "#FF6B35"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.giftIconCircle}
          >
            <Text style={styles.giftIconEmoji}>🎁</Text>
          </LinearGradient>
          <Text style={styles.iconBtnLabel}>Cadou</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity onPress={() => spawnReaction("🚀")} style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="share-social" size={24} color="#fff" />
          <Text style={styles.iconBtnLabel}>Trimite</Text>
        </TouchableOpacity>
      </View>

      {/* ── Gift modal ── */}
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        recipientName={stream.name}
        onGiftSent={async (gift) => {
          setGiftOpen(false);
          setGiftSplash(gift);
          handleGiftSent();
          pushMsg({ name: "You", text: `🎁 Gifted a ${gift.label} · ${gift.tokens} ST`, isGift: true, gift: `${gift.emoji} ${gift.label}` });
          if (realSession?.hostUserId) {
            try {
              const token = await getToken();
              const { API_BASE } = await import("@/config/payments");
              await fetch(`${API_BASE}/gifts/send`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  receiverId: realSession.hostUserId,
                  giftLabel: gift.label,
                  giftEmoji: gift.emoji,
                  tokens: gift.tokens,
                }),
              });
            } catch {
              // best-effort — local gift animation already shown
            }
          }
        }}
      />

      <GiftSplashOverlay
        gift={giftSplash}
        recipientName={stream.name}
        onHide={() => setGiftSplash(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  floatingReaction: {
    position: "absolute", bottom: 180, fontSize: 30, zIndex: 99,
  },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#00000066", alignItems: "center", justifyContent: "center",
  },
  streamerInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  streamerAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "#FF3366" },
  streamerName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  categoryChip: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 2 },
  categoryChipText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },

  viewerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FF000088", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  viewerCount: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },

  tokenBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 10, marginLeft: 14,
    backgroundColor: "#00000055", alignSelf: "flex-start",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  tokenBarEmoji: { fontSize: 14 },
  tokenBarText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF6B35" },

  badgesRow: {
    flexDirection: "row", gap: 6, flexWrap: "wrap",
    marginTop: 8, marginLeft: 14,
  },
  badge: { backgroundColor: "#ffffff22", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#fff" },

  chatArea: {
    flex: 1, justifyContent: "flex-end",
    paddingHorizontal: 12, paddingBottom: 4,
    maxHeight: 300,
    marginTop: "auto",
  },
  chatRow: {
    flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end",
    backgroundColor: "#00000066", borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", maxWidth: "80%",
  },
  chatName: { fontSize: 12, fontFamily: "Inter_700Bold" },
  chatText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#fff", flexShrink: 1 },

  giftMsgRow: { alignSelf: "flex-start", maxWidth: "88%" },
  giftMsgBg: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: "#FF336630",
  },
  giftMsgEmoji: { fontSize: 22 },
  giftMsgText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#fff" },
  giftMsgST: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#FF6B35" },

  bottomBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingTop: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#ffffff18", borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#ffffff15",
  },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#fff" },
  sendBtn: { paddingLeft: 6 },
  iconBtn: { padding: 4, alignItems: "center", gap: 3 },
  iconBtnLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontFamily: "Inter_500Medium" },
  giftIconBtn: { alignItems: "center", gap: 3 },
  giftIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF3366", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55, shadowRadius: 8, elevation: 8,
  },
  giftIconEmoji: { fontSize: 24 },
  giftBtn: { borderRadius: 22, overflow: "hidden" },
  giftBtnGrad: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 22,
  },
  giftBtnEmoji: { fontSize: 16 },
  giftBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});

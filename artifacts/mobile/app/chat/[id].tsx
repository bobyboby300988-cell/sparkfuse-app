import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateBlock } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { ALL_PROFILES } from "@/data/allProfiles";
import { useColors } from "@/hooks/useColors";
import GiftModal from "@/components/GiftModal";
import { useTranslation } from "react-i18next";
import { translateMessage } from "@/lib/translateMessage";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function VoiceBubble({
  uri,
  duration,
  fromMe,
  colors,
}: {
  uri: string;
  duration: number;
  fromMe: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const togglePlay = async () => {
    if (playing) {
      await soundRef.current?.pauseAsync();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaying(false);
      return;
    }
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlaying(false);
              setProgress(0);
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          }
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.playAsync();
      }
      setPlaying(true);
      const start = Date.now() - progress * duration * 1000;
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        setProgress(Math.min(elapsed / duration, 1));
      }, 100);
    } catch {
      Alert.alert("Error", "Could not play voice message.");
    }
  };

  const bg = fromMe ? colors.primary : colors.card;
  const iconColor = fromMe ? "#fff" : colors.primary;
  const textColor = fromMe ? "#fff" : colors.foreground;
  const trackColor = fromMe ? "rgba(255,255,255,0.3)" : colors.border;
  const fillColor = fromMe ? "rgba(255,255,255,0.85)" : colors.primary;

  return (
    <View style={[voiceStyles.container, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={togglePlay} activeOpacity={0.7} style={voiceStyles.playBtn}>
        <Ionicons name={playing ? "pause" : "play"} size={20} color={iconColor} />
      </TouchableOpacity>
      <View style={voiceStyles.trackWrap}>
        <View style={[voiceStyles.track, { backgroundColor: trackColor }]}>
          <View style={[voiceStyles.fill, { backgroundColor: fillColor, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[voiceStyles.dur, { color: textColor }]}>{formatDuration(duration)}</Text>
      </View>
    </View>
  );
}

const voiceStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    minWidth: 180,
    maxWidth: 260,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  trackWrap: { flex: 1, gap: 4 },
  track: { height: 3, borderRadius: 2, overflow: "hidden", width: "100%" },
  fill: { height: 3, borderRadius: 2 },
  dur: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

const EMOJI_CATEGORIES = [
  {
    label: "😄 Smileys",
    emojis: ["😀","😂","🥹","😍","🥰","😘","😜","🤩","😏","🙃","😎","🤭","😇","🥳","🤗","😋","😛","😝","🫦","🙈","😬","😴","🤤","😤","🫡"],
  },
  {
    label: "❤️ Love",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💖","💗","💓","💞","💕","💌","💝","💘","🫶","❣️","💟","😻","💑","👫","💋","🫂","🥂"],
  },
  {
    label: "🔥 Spicy",
    emojis: ["🔥","💥","✨","⚡","🌶️","🍑","🍒","🫠","😈","👿","💦","🌊","🎉","🎊","🍾","🥵","😮‍💨","😩","🫣","🤫","🫦","👅","💅","🕯️","🌹"],
  },
  {
    label: "👋 Gestures",
    emojis: ["👋","🤙","👌","🤌","🫰","✌️","🤞","🫵","☝️","👆","👇","👍","👎","🙌","👏","🤝","💪","🦵","🦶","🤲","🫶","✋","🖐️","🤚","🖖"],
  },
  {
    label: "🎵 Fun",
    emojis: ["🎵","🎶","🎸","🥂","🍷","🍸","🍹","🎲","🎯","🎳","🃏","🎭","💃","🕺","🎤","🎧","🎨","📸","🌅","🌙","⭐","🌟","💫","☀️","🌈"],
  },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { matches, sendMessage, sendMedia, sendVoice, removeMatch } = useApp();
  const { mutateAsync: blockUser } = useCreateBlock();
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingStart = useRef<number>(0);
  const inputRef = useRef<TextInput>(null);

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  const handleTranslate = useCallback(async (msgId: string, text: string) => {
    setTranslating((prev) => ({ ...prev, [msgId]: true }));
    try {
      const result = await translateMessage(text);
      setTranslations((prev) => ({ ...prev, [msgId]: result }));
    } catch {
      Alert.alert(t("chat.translationFailed"), undefined, [{ text: "OK" }]);
    } finally {
      setTranslating((prev) => ({ ...prev, [msgId]: false }));
    }
  }, [t]);

  const clearTranslation = useCallback((msgId: string) => {
    setTranslations((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
  }, []);

  const profile = useMemo(() => ALL_PROFILES.find((p) => p.id === id), [id]);
  const match = useMemo(() => matches.find((m) => m.profileId === id), [matches, id]);
  const reversedMessages = useMemo(() => {
    if (!match) return [];
    return [...match.messages].reverse();
  }, [match]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !id) return;
    sendMessage(id, text);
    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleEmojiPicker = () => {
    if (!showEmojiPicker) {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    } else {
      setShowEmojiPicker(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const onEmojiPress = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVideoCall = () => {
    router.push({ pathname: "/call/[id]", params: { id: id! } });
  };

  const doBlock = async () => {
    if (!id) return;
    try {
      await blockUser({ data: { targetUserId: id } });
    } catch {
      // even if the network call fails, still remove locally so the person disappears
    }
    removeMatch(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const confirmBlock = () => {
    if (!profile) return;
    Alert.alert(
      `Block ${profile.name}?`,
      "They won't be able to message you, appear in your feed, or see your live streams again. This can't be undone from here.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: doBlock },
      ]
    );
  };

  const handleMorePress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Block"], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) confirmBlock();
        }
      );
    } else {
      confirmBlock();
    }
  };

  const pickMedia = async (type: "image" | "video") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets.length > 0 && id) {
      sendMedia(id, result.assets[0].uri, type);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMediaPress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Photo", "Video"], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickMedia("image");
          if (idx === 2) pickMedia("video");
        }
      );
    } else {
      Alert.alert("Send Media", "What would you like to send?", [
        { text: "Cancel", style: "cancel" },
        { text: "Photo", onPress: () => pickMedia("image") },
        { text: "Video", onPress: () => pickMedia("video") },
      ]);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Allow microphone access to send voice messages.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingStart.current = Date.now();
      setRecording(rec);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      Alert.alert("Error", "Could not start recording.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording || !id) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      const duration = (Date.now() - recordingStart.current) / 1000;
      setRecording(null);
      setIsRecording(false);
      if (uri && duration > 0.5) {
        sendVoice(id, uri, duration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setRecording(null);
      setIsRecording(false);
    }
  }, [recording, id, sendVoice]);

  const cancelRecording = useCallback(async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    setRecording(null);
    setIsRecording(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [recording]);

  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const showMic = inputText.trim().length === 0;

  if (!profile) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.foreground }}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>

        <Image source={profile.photo} style={styles.headerAvatar} contentFit="cover" />

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{profile.name}</Text>
          <Text style={[styles.headerStatus, { color: colors.like }]}>Active now</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: colors.card }]}
          onPress={handleVideoCall}
          activeOpacity={0.7}
        >
          <Ionicons name="videocam" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: colors.card }]}
          onPress={handleMorePress}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {/* Messages */}
        {reversedMessages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Image
              source={profile.photo}
              style={styles.emptyChatAvatar}
              contentFit="cover"
            />
            <Text style={[styles.emptyChatName, { color: colors.foreground }]}>{profile.name}</Text>
            <Text style={[styles.emptyChatHint, { color: colors.mutedForeground }]}>
              You matched! Say something to start the conversation.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reversedMessages}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleWrap,
                  item.fromMe ? styles.bubbleWrapMe : styles.bubbleWrapThem,
                ]}
              >
                {item.mediaType === "voice" && item.mediaUri ? (
                  <VoiceBubble
                    uri={item.mediaUri}
                    duration={item.voiceDuration ?? 1}
                    fromMe={item.fromMe}
                    colors={colors}
                  />
                ) : item.mediaUri ? (
                  <View style={[styles.mediaBubble, item.fromMe && { alignSelf: "flex-end" }]}>
                    {item.mediaType === "image" ? (
                      <Image
                        source={{ uri: item.mediaUri }}
                        style={styles.mediaImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.mediaImage,
                          styles.videoPlaceholder,
                          { backgroundColor: colors.card },
                        ]}
                      >
                        <Ionicons name="play-circle" size={48} color={colors.primary} />
                        <Text style={[styles.videoLabel, { color: colors.mutedForeground }]}>
                          Video
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ alignSelf: item.fromMe ? "flex-end" : "flex-start" }}>
                    <View
                      style={[
                        styles.bubble,
                        item.fromMe
                          ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                          : [styles.bubbleThem, { backgroundColor: colors.card }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: item.fromMe ? "#FFFFFF" : colors.foreground },
                        ]}
                      >
                        {translations[item.id] ?? item.text}
                      </Text>
                      {translations[item.id] && !item.fromMe && (
                        <Text
                          style={[
                            styles.translatedLabel,
                            { color: item.fromMe ? "rgba(255,255,255,0.6)" : colors.mutedForeground },
                          ]}
                        >
                          {t("chat.translatedFrom")}
                        </Text>
                      )}
                    </View>
                    {!item.fromMe && item.text && (
                      <TouchableOpacity
                        onPress={() =>
                          translations[item.id]
                            ? clearTranslation(item.id)
                            : handleTranslate(item.id, item.text!)
                        }
                        activeOpacity={0.7}
                        style={styles.translateBtn}
                      >
                        <Ionicons
                          name="language"
                          size={12}
                          color={colors.primary}
                          style={{ marginRight: 3 }}
                        />
                        <Text style={[styles.translateBtnText, { color: colors.primary }]}>
                          {translating[item.id]
                            ? t("chat.translating")
                            : translations[item.id]
                            ? t("chat.showOriginal")
                            : t("chat.translate")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            )}
          />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={[styles.recordingBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.recordingDot} />
            <Text style={[styles.recordingText, { color: colors.foreground }]}>Recording… release to send</Text>
            <TouchableOpacity onPress={cancelRecording} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Emoji picker panel */}
        {showEmojiPicker && (
          <View style={[styles.emojiPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {EMOJI_CATEGORIES.map((cat) => (
                <View key={cat.label} style={styles.emojiCat}>
                  <Text style={[styles.emojiCatLabel, { color: colors.mutedForeground }]}>{cat.label}</Text>
                  <View style={styles.emojiGrid}>
                    {cat.emojis.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.emojiBtn}
                        onPress={() => onEmojiPress(emoji)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.emojiChar}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomInset + 8,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: colors.card }]}
            onPress={handleMediaPress}
            activeOpacity={0.7}
          >
            <Ionicons name="image" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: showEmojiPicker ? colors.primary : colors.card }]}
            onPress={toggleEmojiPicker}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>😊</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mediaBtn, { backgroundColor: colors.card }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowGiftModal(true); }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🎁</Text>
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder={`Message ${profile.name}…`}
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setShowEmojiPicker(false)}
            multiline
            maxLength={500}
          />

          {showMic ? (
            <Pressable
              onPressIn={startRecording}
              onPressOut={stopRecording}
              style={({ pressed }) => [
                styles.micBtn,
                { backgroundColor: isRecording ? "#FF3366" : colors.primary },
                pressed && styles.micBtnPressed,
              ]}
            >
              <Ionicons name={isRecording ? "radio-button-on" : "mic"} size={20} color="#fff" />
            </Pressable>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim().length > 0 ? colors.primary : colors.muted },
              ]}
              onPress={handleSend}
              disabled={inputText.trim().length === 0}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {profile && (
        <GiftModal
          visible={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          recipientName={profile.name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  headerStatus: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyChatAvatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 4 },
  emptyChatName: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyChatHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  bubbleWrap: { marginVertical: 3 },
  bubbleWrapMe: { alignItems: "flex-end" },
  bubbleWrapThem: { alignItems: "flex-start" },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMe: { borderBottomRightRadius: 6 },
  bubbleThem: { borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 21 },
  mediaBubble: { maxWidth: "78%", borderRadius: 16, overflow: "hidden" },
  mediaImage: { width: 220, height: 220, borderRadius: 16 },
  videoPlaceholder: { justifyContent: "center", alignItems: "center", gap: 6 },
  videoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  timeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginHorizontal: 4,
  },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3366",
  },
  recordingText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  mediaBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  micBtnPressed: {
    transform: [{ scale: 1.15 }],
  },
  emojiPanel: {
    height: 260,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  emojiCat: { marginBottom: 12 },
  emojiCatLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 4,
  },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap" },
  emojiBtn: { width: "12.5%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  emojiChar: { fontSize: 26 },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 4,
    marginLeft: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  translateBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  translatedLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    opacity: 0.7,
  },
});

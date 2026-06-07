import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { MOCK_PROFILES } from "@/data/profiles";
import { useColors } from "@/hooks/useColors";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { matches, sendMessage, sendMedia } = useApp();
  const [inputText, setInputText] = useState("");

  const profile = useMemo(() => MOCK_PROFILES.find((p) => p.id === id), [id]);
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

  const handleVideoCall = () => {
    router.push({ pathname: "/call/[id]", params: { id: id! } });
  };

  const pickMedia = async (type: "image" | "video") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "image"
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

  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
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
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {/* Messages */}
        {reversedMessages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Image source={profile.photo} style={styles.emptyChatAvatar} contentFit="cover" />
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
                {item.mediaUri ? (
                  <View style={[styles.mediaBubble, item.fromMe && { alignSelf: "flex-end" }]}>
                    {item.mediaType === "image" ? (
                      <Image
                        source={{ uri: item.mediaUri }}
                        style={styles.mediaImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.mediaImage, styles.videoPlaceholder, { backgroundColor: colors.card }]}>
                        <Ionicons name="play-circle" size={48} color={colors.primary} />
                        <Text style={[styles.videoLabel, { color: colors.mutedForeground }]}>Video</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.bubble,
                      item.fromMe
                        ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                        : [styles.bubbleThem, { backgroundColor: colors.card }],
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: item.fromMe ? "#FFFFFF" : colors.foreground }]}>
                      {item.text}
                    </Text>
                  </View>
                )}
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            )}
          />
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

          <TextInput
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
            multiline
            maxLength={500}
          />

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
        </View>
      </KeyboardAvoidingView>
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
  emptyChatHint: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
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
  timeText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, marginHorizontal: 4 },
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
});

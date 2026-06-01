import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
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
  const { matches, sendMessage } = useApp();
  const [inputText, setInputText] = useState("");

  const profile = useMemo(
    () => MOCK_PROFILES.find((p) => p.id === id),
    [id]
  );

  const match = useMemo(
    () => matches.find((m) => m.profileId === id),
    [matches, id]
  );

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
      {/* Custom header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8,
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

        <Image source={profile.photo} style={styles.headerAvatar} resizeMode="cover" />

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>
            {profile.name}
          </Text>
          <Text style={[styles.headerStatus, { color: colors.like }]}>
            Active now
          </Text>
        </View>

        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="information-circle-outline" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {reversedMessages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Image
              source={profile.photo}
              style={styles.emptyChatAvatar}
              resizeMode="cover"
            />
            <Text style={[styles.emptyChatName, { color: colors.foreground }]}>
              {profile.name}
            </Text>
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
                    {item.text}
                  </Text>
                </View>
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
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder={`Message ${profile.name}...`}
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  inputText.trim().length > 0 ? colors.primary : colors.muted,
              },
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  headerAction: {
    padding: 4,
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyChatAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 4,
  },
  emptyChatName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyChatHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  bubbleWrap: {
    marginVertical: 3,
  },
  bubbleWrapMe: {
    alignItems: "flex-end",
  },
  bubbleWrapThem: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMe: {
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
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

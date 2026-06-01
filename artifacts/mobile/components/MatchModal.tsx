import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Profile } from "@/data/profiles";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MatchModalProps {
  visible: boolean;
  profile: Profile | null;
  onMessage: () => void;
  onKeepSwiping: () => void;
}

export function MatchModal({
  visible,
  profile,
  onMessage,
  onKeepSwiping,
}: MatchModalProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.sequence([
          Animated.timing(heartAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(heartAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
          Animated.timing(heartAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      heartAnim.setValue(0);
    }
  }, [visible]);

  if (!profile) return null;

  const heartScale = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View style={[styles.heartIcon, { transform: [{ scale: heartScale }] }]}>
            <Ionicons name="heart" size={48} color={colors.primary} />
          </Animated.View>

          <Text style={[styles.title, { color: colors.primary }]}>It's a Match!</Text>
          <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.7)" }]}>
            You and {profile.name} liked each other
          </Text>

          <View style={styles.photos}>
            <View style={[styles.photoWrapper, styles.photoLeft]}>
              <Image source={profile.photo} style={styles.photo} resizeMode="cover" />
            </View>
            <View style={[styles.photoWrapper, styles.photoRight]}>
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={44} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.messageBtn, { backgroundColor: colors.primary }]}
            onPress={onMessage}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
            <Text style={styles.messageBtnText}>Send a Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keepBtn, { borderColor: "rgba(255,255,255,0.25)" }]}
            onPress={onKeepSwiping}
            activeOpacity={0.7}
          >
            <Text style={[styles.keepBtnText, { color: "rgba(255,255,255,0.7)" }]}>
              Keep Swiping
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: "#1A1826",
  },
  heartIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
  },
  photos: {
    flexDirection: "row",
    marginBottom: 36,
    width: SCREEN_WIDTH * 0.45,
    justifyContent: "center",
  },
  photoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FF3366",
    position: "absolute",
  },
  photoLeft: {
    left: -30,
    zIndex: 1,
  },
  photoRight: {
    right: -30,
    zIndex: 2,
    borderColor: "#241F35",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50,
    width: "100%",
    marginBottom: 12,
  },
  messageBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  keepBtn: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 50,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
  },
  keepBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

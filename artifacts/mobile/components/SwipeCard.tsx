import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface SwipeProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  interests: string[];
  photo: any;
  height?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.62;

interface SwipeCardProps {
  profile: SwipeProfile;
  isTop: boolean;
  cardIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeSuperLike: () => void;
  distanceLabel?: string;
}

export function SwipeCard({
  profile,
  isTop,
  cardIndex,
  onSwipeLeft,
  onSwipeRight,
  onSwipeSuperLike,
  distanceLabel,
}: SwipeCardProps) {
  const colors = useColors();
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp",
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.6],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.6, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const superLikeOpacity = position.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.6, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH * 1.6, y: gesture.dy },
            duration: 300,
            useNativeDriver: true,
          }).start(onSwipeRight);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH * 1.6, y: gesture.dy },
            duration: 300,
            useNativeDriver: true,
          }).start(onSwipeLeft);
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: gesture.dx, y: -SCREEN_HEIGHT },
            duration: 300,
            useNativeDriver: true,
          }).start(onSwipeSuperLike);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
            tension: 80,
          }).start();
        }
      },
    })
  ).current;

  const scale = 1 - cardIndex * 0.05;
  const translateY = cardIndex * -14;

  const cardStyle = isTop
    ? [
        styles.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]
    : [
        styles.card,
        {
          transform: [{ scale }, { translateY }],
          zIndex: -1,
        },
      ];

  return (
    <Animated.View
      style={cardStyle}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      <Image source={profile.photo as ImageSourcePropType} style={styles.image} resizeMode="cover" />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.92)"]}
        style={styles.gradient}
        locations={[0.3, 1]}
      />

      {isTop && (
        <>
          <Animated.View
            style={[styles.overlayBadge, styles.likeBadge, { opacity: likeOpacity }]}
          >
            <Text style={[styles.overlayText, { color: colors.like }]}>LIKE</Text>
          </Animated.View>

          <Animated.View
            style={[styles.overlayBadge, styles.nopeBadge, { opacity: nopeOpacity }]}
          >
            <Text style={[styles.overlayText, { color: colors.nope }]}>NOPE</Text>
          </Animated.View>

          <Animated.View
            style={[styles.overlayBadge, styles.superBadge, { opacity: superLikeOpacity }]}
          >
            <Text style={[styles.overlayText, { color: colors.superLike }]}>SUPER</Text>
          </Animated.View>
        </>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {profile.name}, {profile.age}
          </Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.locationText}>
            {distanceLabel ?? `${profile.location}`}
          </Text>
          {!!profile.height && <Text style={styles.heightText}>{profile.height}</Text>}
        </View>

        <Text style={styles.bio} numberOfLines={2}>
          {profile.bio}
        </Text>

        <View style={styles.chips}>
          {profile.interests.slice(0, 3).map((interest) => (
            <View key={interest} style={styles.chip}>
              <Text style={styles.chipText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: SCREEN_WIDTH - 24,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1A1826",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
  overlayBadge: {
    position: "absolute",
    top: 44,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    left: 24,
    borderColor: "#22C55E",
    transform: [{ rotate: "-20deg" }],
  },
  nopeBadge: {
    right: 24,
    borderColor: "#FF4D6D",
    transform: [{ rotate: "20deg" }],
  },
  superBadge: {
    alignSelf: "center",
    left: "35%",
    borderColor: "#60A5FA",
  },
  overlayText: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 22,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
  },
  heightText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginLeft: 8,
    fontFamily: "Inter_400Regular",
  },
  bio: {
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 21,
    marginBottom: 14,
    fontFamily: "Inter_400Regular",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  chipText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
  },
});

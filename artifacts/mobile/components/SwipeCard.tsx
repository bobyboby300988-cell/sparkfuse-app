import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const rotate = useDerivedValue(() =>
    `${(translateX.value / (SCREEN_WIDTH / 2)) * 12}deg`
  );

  const likeOpacity = useDerivedValue(() =>
    Math.min(translateX.value / (SWIPE_THRESHOLD * 0.6), 1)
  );
  const nopeOpacity = useDerivedValue(() =>
    Math.min(-translateX.value / (SWIPE_THRESHOLD * 0.6), 1)
  );
  const superOpacity = useDerivedValue(() =>
    Math.min(-translateY.value / (SWIPE_THRESHOLD * 0.6), 1)
  );

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.6, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.6, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
      } else if (event.translationY < -SWIPE_THRESHOLD) {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
          runOnJS(onSwipeSuperLike)();
        });
      } else {
        translateX.value = withSpring(0, { friction: 5, tension: 80 });
        translateY.value = withSpring(0, { friction: 5, tension: 80 });
      }
    });

  const scale = 1 - cardIndex * 0.05;
  const stackTranslateY = cardIndex * -14;

  const cardAnimStyle = useAnimatedStyle(() => {
    if (!isTop) return {};
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: rotate.value },
      ],
    };
  });

  const stackStyle = !isTop
    ? { transform: [{ scale }, { translateY: stackTranslateY }], zIndex: -1 }
    : {};

  const likeAnimStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, likeOpacity.value) }));
  const nopeAnimStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, nopeOpacity.value) }));
  const superAnimStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, superOpacity.value) }));

  const card = (
    <Animated.View style={[styles.card, stackStyle, cardAnimStyle]}>
      <Image source={profile.photo as ImageSourcePropType} style={styles.image} resizeMode="cover" />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.92)"]}
        style={styles.gradient}
        locations={[0.3, 1]}
      />

      {isTop && (
        <>
          <Animated.View style={[styles.overlayBadge, styles.likeBadge, likeAnimStyle]}>
            <Text style={[styles.overlayText, { color: colors.like }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.overlayBadge, styles.nopeBadge, nopeAnimStyle]}>
            <Text style={[styles.overlayText, { color: colors.nope }]}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.overlayBadge, styles.superBadge, superAnimStyle]}>
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

  if (!isTop) return card;

  return <GestureDetector gesture={panGesture}>{card}</GestureDetector>;
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

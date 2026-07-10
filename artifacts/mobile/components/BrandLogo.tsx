import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface BrandLogoProps {
  size?: number;
  color?: string;
  flameColor?: string;
}

export default function BrandLogo({ size = 28, color = "#FF3366", flameColor = "#FF6B35" }: BrandLogoProps) {
  const boxSize = size * 1.9;

  return (
    <View style={{ width: boxSize, height: boxSize, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Angel — sweet side */}
      <Text
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: size * 0.5,
        }}
      >
        👼
      </Text>

      {/* Devil — naughty side */}
      <Text
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          fontSize: size * 0.5,
        }}
      >
        😈
      </Text>

      {/* Flame crest on top of the heart */}
      <View style={{ position: "absolute", top: size * 0.28, alignSelf: "center", zIndex: 2 }}>
        <Ionicons name="flame" size={size * 0.5} color={flameColor} />
      </View>

      <Ionicons name="heart" size={size} color={color} />
    </View>
  );
}

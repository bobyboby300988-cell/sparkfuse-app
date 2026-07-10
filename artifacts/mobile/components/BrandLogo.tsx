import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

interface BrandLogoProps {
  size?: number;
  color?: string;
  flameColor?: string;
}

export default function BrandLogo({ size = 28, color = "#FF3366", flameColor = "#FF6B35" }: BrandLogoProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Ionicons name="heart" size={size} color={color} />
      <View
        style={{
          position: "absolute",
          right: -size * 0.12,
          bottom: -size * 0.12,
        }}
      >
        <Ionicons name="flame" size={size * 0.52} color={flameColor} />
      </View>
    </View>
  );
}

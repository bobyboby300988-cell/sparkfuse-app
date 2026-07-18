import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { AppMode } from "@/context/AppContext";

interface Mode {
  key: AppMode;
  label: string;
  emoji: string;
  color: string;
}

const MODES: Mode[] = [
  { key: "live",     label: "LIVE",     emoji: "🔴", color: "#FF3366" },
  { key: "dating",   label: "Dating",   emoji: "💕", color: "#FF3366" },
  { key: "naughty",  label: "Naughty",  emoji: "🔥", color: "#FF6B35" },
  { key: "business", label: "Business", emoji: "💼", color: "#0EA5E9" },
  { key: "party",    label: "Party",    emoji: "🎉", color: "#A855F7" },
  { key: "travel",   label: "Travel",   emoji: "✈️", color: "#14B8A6" },
  { key: "social",   label: "Social",   emoji: "🤝", color: "#F59E0B" },
];

interface Props {
  value: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeSelector({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MODES.map((m) => {
        const active = value === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.pill,
              active
                ? { backgroundColor: m.color }
                : { backgroundColor: m.color + "18", borderColor: m.color + "40" },
            ]}
            onPress={() => {
              if (!active) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(m.key);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.label, { color: active ? "#fff" : m.color }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "transparent",
  },
  emoji: { fontSize: 14 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

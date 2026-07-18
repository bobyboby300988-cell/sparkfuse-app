import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Politică de confidențialitate</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* PLACEHOLDER — replace this block with actual privacy policy content */}
        <Text style={styles.placeholder}>
          Politica de confidențialitate va fi adăugată în curând.
        </Text>
        {/* END PLACEHOLDER */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  title: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { padding: 20, gap: 16 },
  section: { gap: 8 },
  heading: { color: "#FF3366", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  body: { color: "#ccc", fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  placeholder: { color: "#888", fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 40 },
});

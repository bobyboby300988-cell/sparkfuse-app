import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIVACY_URL = "https://privacypolicyurl.com/spark/privacy-policy.html";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    WebBrowser.openBrowserAsync(PRIVACY_URL, {
      toolbarColor: "#0A0A0F",
      controlsColor: "#FF3366",
      dismissButtonStyle: "close",
    }).then(() => {
      router.back();
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Politică de confidențialitate</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3366" />
        <Text style={styles.hint}>Se deschide…</Text>
      </View>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  hint: { color: "#888", fontSize: 14, fontFamily: "Inter_400Regular" },
});

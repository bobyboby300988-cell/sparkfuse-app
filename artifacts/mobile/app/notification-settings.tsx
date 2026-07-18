import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiUrl } from "@/lib/api";

export default function NotificationSettingsScreen() {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const tok = await getToken();
        const res = await fetch(`${getApiUrl()}/api/account/notifications`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { prefs: { notifCalls: boolean; notifMessages: boolean; notifMatches: boolean } };
          // Enabled = at least one is on
          setEnabled(data.prefs.notifCalls || data.prefs.notifMessages || data.prefs.notifMatches);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const tok = await getToken();
      await fetch(`${getApiUrl()}/api/account/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ notifCalls: next, notifMessages: next, notifMatches: next }),
      });
    } catch {}
    setSaving(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notificări</Text>
        {saving ? <ActivityIndicator size="small" color="#FF3366" /> : <View style={{ width: 24 }} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF3366" style={{ marginTop: 60 }} />
      ) : (
        <View style={styles.body}>
          <View style={[styles.card, { opacity: 1 }]}>
            <View style={styles.cardIcon}>
              <Ionicons name="notifications-outline" size={26} color="#FF3366" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Notificări active</Text>
              <Text style={styles.cardDesc}>
                Mesaje · Match-uri · Apeluri vocale · Video call-uri
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggle}
              trackColor={{ false: "#2a2a3a", true: "#FF336680" }}
              thumbColor={enabled ? "#FF3366" : "#666"}
            />
          </View>

          <Text style={styles.hint}>
            {enabled
              ? "Vei primi notificări pe telefon când nu ești în aplicație."
              : "Nu vei primi nicio notificare când nu ești în aplicație."}
            {"\n\n"}
            Dacă ai dezactivat notificările pentru SparkFuse din setările telefonului, nu vei primi nimic indiferent de această setare.
          </Text>
        </View>
      )}
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
  title: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold" },
  body: { padding: 20, gap: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12121f",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#1e1e35",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF336618",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardDesc: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  hint: {
    color: "#666",
    fontSize: 12,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
  },
});

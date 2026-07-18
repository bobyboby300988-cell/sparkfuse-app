import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiUrl } from "@/lib/api";

type Prefs = { notifCalls: boolean; notifMessages: boolean; notifMatches: boolean };

const ITEMS: { key: keyof Prefs; icon: string; title: string; desc: string; color: string }[] = [
  { key: "notifMessages",  icon: "chatbubble-outline",      title: "Mesaje",         desc: "Când primești un mesaj nou",          color: "#6366f1" },
  { key: "notifMatches",   icon: "heart-outline",           title: "Match-uri",      desc: "Când ai un match nou",                color: "#ec4899" },
  { key: "notifCalls",     icon: "call-outline",            title: "Apeluri & Video","desc": "Când te sună cineva (vocal sau video)", color: "#10b981" },
];

export default function NotificationSettingsScreen() {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Prefs>({ notifCalls: true, notifMessages: true, notifMatches: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const tok = await getToken();
        const res = await fetch(`${getApiUrl()}/api/account/notifications`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { prefs: Prefs };
          setPrefs(data.prefs);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(key);
    try {
      const tok = await getToken();
      await fetch(`${getApiUrl()}/api/account/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ [key]: next[key] }),
      });
    } catch {}
    setSaving(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notificări</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.hint}>
        Alege ce notificări primești când nu ești în aplicație.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF3366" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {ITEMS.map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              {saving === item.key
                ? <ActivityIndicator size="small" color="#FF3366" />
                : <Switch
                    value={prefs[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: "#2a2a3a", true: "#FF336660" }}
                    thumbColor={prefs[item.key] ? "#FF3366" : "#666"}
                  />
              }
            </View>
          ))}

          <Text style={styles.footer}>
            Dacă ai dezactivat notificările pentru SparkFuse din setările telefonului, nu vei primi nimic indiferent de setările de mai sus.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#1a1a2e",
  },
  title: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold" },
  hint: {
    color: "#888", fontSize: 13, lineHeight: 20,
    marginHorizontal: 20, marginTop: 16, marginBottom: 4,
    fontFamily: "Inter_400Regular",
  },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#12121f", borderRadius: 16,
    padding: 16, gap: 14,
    borderWidth: 1, borderColor: "#1e1e35",
  },
  icon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowDesc: { color: "#888", fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  footer: {
    color: "#555", fontSize: 11, lineHeight: 18,
    fontFamily: "Inter_400Regular", marginTop: 8, paddingHorizontal: 4,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiUrl } from "@/lib/api";

type Prefs = { notifCalls: boolean; notifMessages: boolean; notifMatches: boolean };

export default function NotificationSettingsScreen() {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Prefs>({ notifCalls: true, notifMessages: true, notifMatches: true });
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
          const data = (await res.json()) as { prefs: Prefs };
          setPrefs(data.prefs);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (key: keyof Prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    try {
      const tok = await getToken();
      await fetch(`${getApiUrl()}/api/account/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ [key]: updated[key] }),
      });
    } catch {}
    setSaving(false);
  };

  const items: { key: keyof Prefs; icon: string; title: string; desc: string }[] = [
    {
      key: "notifCalls",
      icon: "call-outline",
      title: "Apeluri",
      desc: "Primești notificare când cineva te sună",
    },
    {
      key: "notifMessages",
      icon: "chatbubble-outline",
      title: "Mesaje",
      desc: "Primești notificare pentru mesaje noi",
    },
    {
      key: "notifMatches",
      icon: "heart-outline",
      title: "Match-uri",
      desc: "Primești notificare când ai un match nou",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notificări</Text>
        {saving ? <ActivityIndicator size="small" color="#FF3366" /> : <View style={{ width: 24 }} />}
      </View>

      <Text style={styles.hint}>
        Aceste setări controlează ce notificări primești când nu ești în aplicație.
        {"\n"}Dacă ai dezactivat notificările pentru SparkFuse din setările telefonului, nu vei primi nicio notificare indiferent de opțiunile de mai jos.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF3366" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon as any} size={22} color="#FF3366" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: "#333", true: "#FF336680" }}
                thumbColor={prefs[item.key] ? "#FF3366" : "#888"}
              />
            </View>
          ))}
        </ScrollView>
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
  hint: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12121f",
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF336615",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowDesc: { color: "#888", fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
});

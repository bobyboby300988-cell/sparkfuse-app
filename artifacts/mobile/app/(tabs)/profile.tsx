import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile, matches } = useApp();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name ?? "");
  const [editBio, setEditBio] = useState(userProfile?.bio ?? "");

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditBio(userProfile.bio);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;
    await setUserProfile({ ...userProfile, name: editName.trim(), bio: editBio.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Profile",
      "This will clear all your data and restart onboarding.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const initial = userProfile?.name?.[0]?.toUpperCase() ?? "?";

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo / Avatar area */}
      <View style={[styles.photoSection, { paddingTop: topPadding + 24 }]}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={styles.avatarCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.initialText}>{initial}</Text>
        </LinearGradient>

        <TouchableOpacity
          style={[styles.editPhotoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <Ionicons name="camera-outline" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Name + age */}
      <View style={styles.nameSection}>
        {editing ? (
          <TextInput
            style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
            value={editName}
            onChangeText={setEditName}
            maxLength={30}
            autoFocus
          />
        ) : (
          <Text style={[styles.nameText, { color: colors.foreground }]}>
            {userProfile?.name}, {userProfile?.age}
          </Text>
        )}
        <Text style={[styles.seekingText, { color: colors.mutedForeground }]}>
          Looking for {userProfile?.seeking}
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{matches.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Matches</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            {matches.reduce((acc, m) => acc + m.messages.length, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Messages</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>2</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>mi away</Text>
        </View>
      </View>

      {/* Bio */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About me</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <TextInput
              style={[
                styles.bioInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={editBio}
              onChangeText={setEditBio}
              multiline
              maxLength={200}
              placeholder="Tell people about yourself..."
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setEditing(false);
                  setEditName(userProfile?.name ?? "");
                  setEditBio(userProfile?.bio ?? "");
                }}
              >
                <Text style={[styles.editBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.editBtnText, { color: "#FFFFFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>
            {userProfile?.bio || "No bio yet. Tap the pencil to add one."}
          </Text>
        )}
      </View>

      {/* Preferences */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
        <View style={styles.prefRow}>
          <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.prefText, { color: colors.foreground }]}>New York, NY</Text>
        </View>
        <View style={styles.prefRow}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.prefText, { color: colors.foreground }]}>
            {userProfile?.seeking ? userProfile.seeking.charAt(0).toUpperCase() + userProfile.seeking.slice(1) : "Everyone"}
          </Text>
        </View>
        <View style={styles.prefRow}>
          <Ionicons name="resize-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.prefText, { color: colors.foreground }]}>Within 25 miles</Text>
        </View>
      </View>

      {/* Reset */}
      <TouchableOpacity
        style={[styles.resetBtn, { borderColor: colors.destructive }]}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={16} color={colors.destructive} />
        <Text style={[styles.resetText, { color: colors.destructive }]}>Reset Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    paddingBottom: 8,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    fontSize: 44,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  editPhotoBtn: {
    position: "absolute",
    bottom: 8,
    right: "36%",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  nameSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 4,
  },
  nameText: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    borderBottomWidth: 2,
    paddingBottom: 4,
    textAlign: "center",
    minWidth: 160,
  },
  seekingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNum: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  bioText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  bioInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveBtn: {
    borderWidth: 0,
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  prefText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});

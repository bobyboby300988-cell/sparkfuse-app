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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import WithdrawModal from "@/components/WithdrawModal";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRICE_OPTIONS = [1, 2, 3, 5, 10];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile, matches, creatorMode, creatorPrice, setCreatorMode, setCreatorPrice, earnings, coinBalance, isLive, setIsLive } = useApp();
  const [withdrawVisible, setWithdrawVisible] = useState(false);

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
    <>
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

      {/* Wallet — visible to every user */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>💰</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Wallet</Text>
          </View>
        </View>

        <View style={[styles.walletGrid, { borderColor: colors.border }]}>
          <View style={[styles.walletCell, { borderRightColor: colors.border }]}>
            <Text style={styles.walletCoin}>🔥</Text>
            <Text style={[styles.walletValue, { color: colors.foreground }]}>{coinBalance} ST</Text>
            <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>Spark Tokens</Text>
          </View>
          <View style={styles.walletCell}>
            <Text style={styles.walletCoin}>🎁</Text>
            <Text style={[styles.walletValue, { color: colors.foreground }]}>€{earnings.toFixed(2)}</Text>
            <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>Gift balance</Text>
          </View>
        </View>

        <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
          Send & receive Spark Tokens (ST) as gifts. Platform fee: 10% from sender + 10% on withdrawal.
        </Text>

        <TouchableOpacity
          style={[styles.earningsRow, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => {
            if (earnings >= 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setWithdrawVisible(true);
            } else {
              Alert.alert("Not enough balance", "You need at least €1.00 to withdraw.");
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up-circle-outline" size={18} color="#FF3366" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>Available to withdraw</Text>
            <Text style={[styles.earningsValue, { color: colors.foreground }]}>€{earnings.toFixed(2)}</Text>
          </View>
          <View style={[styles.withdrawChip, { backgroundColor: earnings >= 1 ? "#FF3366" : colors.muted }]}>
            <Ionicons name="arrow-up-outline" size={12} color="#fff" />
            <Text style={styles.withdrawChipText}>Withdraw</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Go Live */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>🔴</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Go Live</Text>
          </View>
          <Switch
            value={isLive}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsLive(v);
              if (v) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push("/live" as any);
              }
            }}
            trackColor={{ false: colors.muted, true: "#FF3366" }}
            thumbColor="#fff"
          />
        </View>
        <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
          {isLive
            ? "You're live! Your profile shows a LIVE badge on Explore and in the Live tab."
            : "Go live to appear with a LIVE badge on Explore and start streaming to earn Spark Tokens."}
        </Text>
      </View>

      {/* Creator Mode */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Creator Mode</Text>
          </View>
          <Switch
            value={creatorMode}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCreatorMode(v);
            }}
            trackColor={{ false: colors.muted, true: "#FF3366" }}
            thumbColor="#fff"
          />
        </View>

        {creatorMode ? (
          <>
            <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
              Your profile shows a 🔒 locked section. Others pay to see your exclusive photos.
            </Text>

            <Text style={[styles.prefText, { color: colors.foreground, marginTop: 12, marginBottom: 8 }]}>
              Price per unlock
            </Text>
            <View style={styles.priceRow}>
              {PRICE_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priceChip,
                    {
                      backgroundColor: creatorPrice === p ? "#FF3366" : colors.background,
                      borderColor: creatorPrice === p ? "#FF3366" : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCreatorPrice(p);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.priceChipText, { color: creatorPrice === p ? "#fff" : colors.foreground }]}>
                    €{p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </>
        ) : (
          <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
            Turn on Creator Mode to lock exclusive photos behind a paywall and earn from your profile.
          </Text>
        )}
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

    <WithdrawModal visible={withdrawVisible} onClose={() => setWithdrawVisible(false)} />
    </>
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
  creatorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  priceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  priceChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  earningsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  earningsLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  earningsValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  withdrawChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  withdrawChipText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  walletGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  walletCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
    borderRightWidth: 1,
  },
  walletCoin: { fontSize: 26 },
  walletValue: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  walletLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
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

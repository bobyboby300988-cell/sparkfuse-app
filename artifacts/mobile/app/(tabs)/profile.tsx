import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/expo";
import {
  Alert,
  FlatList,
  Modal,
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
import { useGetMyProfile, useUpsertMyProfile } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import WithdrawModal from "@/components/WithdrawModal";
import { useColors } from "@/hooks/useColors";
import { getPhotoUrl } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_LANGUAGES, saveLanguage, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_FLAGS, LANGUAGE_NATIVE_NAMES, type LanguageCode } from "@/i18n/locales/_languages";
import { buyTokensWithStripe } from "@/config/payments";

const PRICE_OPTIONS = [1, 2, 3, 5, 10];

const TOKEN_PACKS = [
  { tokens: 100, priceEur: 1.00 },
  { tokens: 500, priceEur: 5.00 },
  { tokens: 1000, priceEur: 10.00 },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { matches, creatorMode, creatorPrice, setCreatorMode, setCreatorPrice, earnings, coinBalance, addCoins, isLive, setIsLive } = useApp();
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(i18n.language as SupportedLanguage || "en");

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await saveLanguage(lang);
    await i18n.changeLanguage(lang);
    setCurrentLang(lang);
    setLanguageModalVisible(false);
  };

  const { data: profileData } = useGetMyProfile();
  const userProfile = profileData?.profile ?? null;
  const upsertProfile = useUpsertMyProfile();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name ?? "");
  const [editBio, setEditBio] = useState(userProfile?.bio ?? "");
  const [editCity, setEditCity] = useState(userProfile?.city ?? "");
  const [editCountry, setEditCountry] = useState(userProfile?.country ?? "");
  const [buyingTokens, setBuyingTokens] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditBio(userProfile.bio);
      setEditCity(userProfile.city ?? "");
      setEditCountry(userProfile.country ?? "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;
    await upsertProfile.mutateAsync({
      data: {
        name: editName.trim(),
        age: userProfile.age,
        bio: editBio.trim(),
        seeking: userProfile.seeking,
        photoUrl: userProfile.photoUrl,
        city: editCity.trim() || null,
        country: editCountry.trim() || null,
        latitude: userProfile.latitude ?? null,
        longitude: userProfile.longitude ?? null,
      },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/welcome");
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      t("profile.resetProfile"),
      t("profile.resetConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.reset"),
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
        {getPhotoUrl(userProfile?.photoUrl) ? (
          <Image
            source={{ uri: getPhotoUrl(userProfile?.photoUrl) as string }}
            style={styles.avatarCircle}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.avatarCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.initialText}>{initial}</Text>
          </LinearGradient>
        )}

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
          {t("profile.lookingFor", { gender: userProfile?.seeking ?? "" })}
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{matches.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("profile.matches")}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            {matches.reduce((acc, m) => acc + m.messages.length, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("profile.messages")}</Text>
        </View>
        {userProfile?.city ? (
          <>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                {userProfile.city}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Bio */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("profile.aboutMe")}</Text>
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
              placeholder={t("profile.bioPH")}
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[
                styles.locationInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City (e.g. Paris, Lagos)"
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
            />
            <TextInput
              style={[
                styles.locationInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={editCountry}
              onChangeText={setEditCountry}
              placeholder="Country"
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setEditing(false);
                  setEditName(userProfile?.name ?? "");
                  setEditBio(userProfile?.bio ?? "");
                  setEditCity(userProfile?.city ?? "");
                  setEditCountry(userProfile?.country ?? "");
                }}
              >
                <Text style={[styles.editBtnText, { color: colors.mutedForeground }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.editBtnText, { color: "#FFFFFF" }]}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>
            {userProfile?.bio || t("profile.noBio")}
          </Text>
        )}
      </View>

      {/* Preferences */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
        <View style={styles.prefRow}>
          <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.prefText, { color: colors.foreground }]}>
            {userProfile?.city
              ? [userProfile.city, userProfile.country].filter(Boolean).join(", ")
              : t("profile.noLocation")}
          </Text>
        </View>
        <View style={styles.prefRow}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.prefText, { color: colors.foreground }]}>
            {userProfile?.seeking ? userProfile.seeking.charAt(0).toUpperCase() + userProfile.seeking.slice(1) : "Everyone"}
          </Text>
        </View>
      </View>

      {/* Log Out — placed prominently before the wallet */}
      <TouchableOpacity
        style={[styles.resetBtn, { borderColor: "#FF3366", marginBottom: 4 }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={16} color="#FF3366" />
        <Text style={[styles.resetText, { color: "#FF3366" }]}>Log Out</Text>
      </TouchableOpacity>

      {/* Wallet — visible to every user */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>💰</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("profile.wallet")}</Text>
          </View>
        </View>

        <View style={[styles.walletGrid, { borderColor: colors.border }]}>
          <View style={[styles.walletCell, { borderRightColor: colors.border }]}>
            <Text style={styles.walletCoin}>🔥</Text>
            <Text style={[styles.walletValue, { color: colors.foreground }]}>{coinBalance} ST</Text>
            <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>{t("profile.sparkTokens")}</Text>
          </View>
          <View style={styles.walletCell}>
            <Text style={styles.walletCoin}>🎁</Text>
            <Text style={[styles.walletValue, { color: colors.foreground }]}>€{earnings.toFixed(2)}</Text>
            <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>{t("profile.giftBalance")}</Text>
          </View>
        </View>

        <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
          {t("profile.giftBalanceDesc")}
        </Text>

        {/* Buy ST token packs */}
        <Text style={[styles.tokenPackTitle, { color: colors.foreground }]}>Buy Spark Tokens 🔥</Text>
        <View style={styles.tokenPackRow}>
          {TOKEN_PACKS.map((pack) => (
            <TouchableOpacity
              key={pack.tokens}
              style={[styles.tokenPackCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              activeOpacity={0.8}
              disabled={buyingTokens}
              onPress={async () => {
                try {
                  setBuyingTokens(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const paid = await buyTokensWithStripe(pack.tokens, pack.priceEur);
                  if (paid) {
                    addCoins(pack.tokens);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert("🔥 Tokens added!", `${pack.tokens} ST credited to your wallet.`);
                  }
                } catch (e: any) {
                  Alert.alert("Purchase failed", e?.message ?? "Please try again.");
                } finally {
                  setBuyingTokens(false);
                }
              }}
            >
              <Text style={[styles.tokenPackAmount, { color: colors.primary }]}>{pack.tokens} ST</Text>
              <Text style={[styles.tokenPackPrice, { color: colors.foreground }]}>€{pack.priceEur.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>{t("profile.availableToWithdraw")}</Text>
            <Text style={[styles.earningsValue, { color: colors.foreground }]}>€{earnings.toFixed(2)}</Text>
          </View>
          <View style={[styles.withdrawChip, { backgroundColor: earnings >= 1 ? "#FF3366" : colors.muted }]}>
            <Ionicons name="arrow-up-outline" size={12} color="#fff" />
            <Text style={styles.withdrawChipText}>{t("profile.withdraw")}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Go Live */}
      <View style={[styles.section, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: isLive ? "#E8C468" : "#E8C46833" }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>🔴</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("profile.goLive")}</Text>
          </View>
          <Switch
            value={isLive}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (v) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push("/live/go-live" as any);
              } else {
                setIsLive(false);
              }
            }}
            trackColor={{ false: colors.muted, true: "#FF3366" }}
            thumbColor="#fff"
          />
        </View>
        <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
          {isLive ? t("profile.youAreLive") : t("profile.goLiveDesc")}
        </Text>
      </View>

      {/* Creator Mode */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("profile.creatorMode")}</Text>
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
              {t("profile.creatorModeActive")}
            </Text>

            <Text style={[styles.prefText, { color: colors.foreground, marginTop: 12, marginBottom: 8 }]}>
              {t("profile.pricePerUnlock")}
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
            {t("profile.creatorModeDesc")}
          </Text>
        )}
      </View>

      {/* Language */}
      <TouchableOpacity
        style={[styles.languageRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setLanguageModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.langFlag}>{LANGUAGE_FLAGS[currentLang] ?? "🌐"}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.langLabel, { color: colors.mutedForeground }]}>{t("profile.language")}</Text>
          <Text style={[styles.langValue, { color: colors.foreground }]}>
            {t(`languages.${currentLang}` as any)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Reset */}
      <TouchableOpacity
        style={[styles.resetBtn, { borderColor: colors.destructive }]}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={16} color={colors.destructive} />
        <Text style={[styles.resetText, { color: colors.destructive }]}>{t("profile.resetProfile")}</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Language picker modal */}
    <Modal
      visible={languageModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setLanguageModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setLanguageModalVisible(false)}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t("profile.selectLanguage")}</Text>
          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item}
            renderItem={({ item: lang }) => (
              <TouchableOpacity
                style={[
                  styles.langItem,
                  { borderBottomColor: colors.border },
                  currentLang === lang && { backgroundColor: colors.primary + "18" },
                ]}
                onPress={() => handleLanguageChange(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.langItemFlag}>{LANGUAGE_FLAGS[lang]}</Text>
                <Text style={[styles.langItemText, { color: colors.foreground }]}>
                  {t(`languages.${lang}` as any)}
                </Text>
                {currentLang === lang && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>

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
  locationInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
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
  tokenPackTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 12, marginBottom: 8 },
  tokenPackRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tokenPackCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tokenPackAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  tokenPackPrice: { fontSize: 12, fontFamily: "Inter_400Regular" },
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
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  langFlag: { fontSize: 26 },
  langLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  langValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langItemFlag: { fontSize: 24 },
  langItemText: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
});

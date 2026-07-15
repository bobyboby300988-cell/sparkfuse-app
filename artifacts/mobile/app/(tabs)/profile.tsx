import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/expo";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMyProfile, useUpsertMyProfile, useResetAccount, useDeleteAccount } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import WithdrawModal from "@/components/WithdrawModal";
import { useColors } from "@/hooks/useColors";
import { getPhotoUrl, getApiUrl } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_LANGUAGES, saveLanguage, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_FLAGS, LANGUAGE_NATIVE_NAMES, type LanguageCode } from "@/i18n/locales/_languages";
import { buyTokensWithStripe } from "@/config/payments";

const PRICE_OPTIONS = [1, 2, 3, 5, 10];

const ST_MIN = 50; // Stripe minimum is €0.50

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { matches, creatorMode, creatorPrice, setCreatorMode, setCreatorPrice, earnings, coinBalance, addCoins, isLive, setIsLive, myPhotos, addMyPhoto, removeMyPhoto, togglePhotoExclusive } = useApp();
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
  const [editingLocation, setEditingLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [buyingTokens, setBuyingTokens] = useState(false);
  const [customTokenAmount, setCustomTokenAmount] = useState("");
  const [photoEditMode, setPhotoEditMode] = useState(false);
  const [addPhotoVisible, setAddPhotoVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  const handleSaveLocation = async () => {
    if (!userProfile) return;
    await upsertProfile.mutateAsync({
      data: {
        name: userProfile.name,
        age: userProfile.age,
        bio: userProfile.bio,
        seeking: userProfile.seeking,
        photoUrl: userProfile.photoUrl,
        city: editCity.trim() || null,
        country: editCountry.trim() || null,
        latitude: userProfile.latitude ?? null,
        longitude: userProfile.longitude ?? null,
      },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingLocation(false);
  };

  const handleGPS = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location access to auto-fill your city.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (geo) {
        setEditCity(geo.city ?? geo.subregion ?? "");
        setEditCountry(geo.country ?? "");
      }
    } catch {
      Alert.alert("Location error", "Could not detect your location. Please type it manually.");
    } finally {
      setLocating(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch (_) {}
    router.replace("/welcome");
    setLoggingOut(false);
  };

  const resetAccountMutation  = useResetAccount();
  const deleteAccountMutation = useDeleteAccount();

  const handleResetAccount = () => {
    Alert.alert(
      "Reset Account",
      "This will permanently delete:\n• Your profile & photos\n• All matches\n• All conversations\n• Your swipe history\n\nYour email, password and subscription stay active. You will be taken back to set up your profile again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Account",
          style: "destructive",
          onPress: async () => {
            try {
              await resetAccountMutation.mutateAsync();
            } catch {}
            await AsyncStorage.multiRemove(["discover_filters_v1"]);
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete all your data — profile, photos, matches, messages — from our servers.\n\nYour email and password stay in the system, so you can sign back in with the same email at any time. You will need to create a new profile and pay the subscription again.\n\nThis cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccountMutation.mutateAsync();
            } catch {}
            try { await signOut(); } catch {}
            await AsyncStorage.clear();
            router.replace("/welcome");
          },
        },
      ]
    );
  };

  const pickMainPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !userProfile) return;
    const uri = result.assets[0].uri;
    try {
      setUploadingAvatar(true);
      const urlRes = await fetch(`${getApiUrl()}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "avatar.jpg" }),
      });
      const { uploadUrl, objectPath } = await urlRes.json();
      const blob = await (await fetch(uri)).blob();
      await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
      await upsertProfile.mutateAsync({
        data: {
          name: userProfile.name, age: userProfile.age, bio: userProfile.bio,
          seeking: userProfile.seeking, photoUrl: objectPath,
          city: userProfile.city ?? null, country: userProfile.country ?? null,
          latitude: userProfile.latitude ?? null, longitude: userProfile.longitude ?? null,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Upload failed", "Could not save photo. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const pickGalleryPhoto = async (exclusive: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to add pictures.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    addMyPhoto(result.assets[0].uri, exclusive, "image");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddPhotoVisible(false);
  };

  const pickGalleryVideo = async (exclusive: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo/video access to add videos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    addMyPhoto(result.assets[0].uri, exclusive, "video");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddPhotoVisible(false);
  };

  const initial = userProfile?.name?.[0]?.toUpperCase() ?? "?";

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;
  const bottomPadding = insets.bottom + tabBarHeight + (Platform.OS === "web" ? 34 : 0);

  return (
    <>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <ScrollView
      style={{ flex: 1 }}
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
          onPress={pickMainPhoto}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar
            ? <Ionicons name="hourglass-outline" size={16} color={colors.foreground} />
            : <Ionicons name="camera-outline" size={16} color={colors.foreground} />
          }
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

      {/* ── My Photos Gallery ── */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.creatorTitleRow}>
            <Text style={{ fontSize: 18 }}>📸</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Photos</Text>
          </View>
          <TouchableOpacity onPress={() => setPhotoEditMode((v) => !v)} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
              {photoEditMode ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.creatorHint, { color: colors.mutedForeground }]}>
          Free photos are visible to everyone. Exclusive photos are blurred — people pay 20 ST (€0.20) to unlock them.
        </Text>

        <View style={gallSt.grid}>
          {myPhotos.map((photo) => (
            <View key={photo.id} style={gallSt.tile}>
              {photo.type === "video" ? (
                <Video
                  source={{ uri: photo.uri }}
                  style={gallSt.tileImg as any}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isMuted
                  isLooping={false}
                />
              ) : (
                <Image source={{ uri: photo.uri }} style={gallSt.tileImg} contentFit="cover" />
              )}

              {/* Video play icon overlay */}
              {photo.type === "video" && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 20, padding: 4 }}>
                    <Ionicons name="play" size={18} color="#fff" />
                  </View>
                </View>
              )}

              {/* Free / Exclusive badge */}
              <View style={[gallSt.badge, { backgroundColor: photo.exclusive ? "rgba(255,51,102,0.85)" : "rgba(34,197,94,0.85)" }]}>
                <Text style={gallSt.badgeText}>{photo.exclusive ? "🔒 EXCL" : "FREE"}</Text>
              </View>

              {photoEditMode ? (
                <>
                  {/* Delete button */}
                  <TouchableOpacity
                    style={gallSt.deleteBtn}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removeMyPhoto(photo.id); }}
                  >
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                  {/* Toggle exclusive / free */}
                  <TouchableOpacity
                    style={gallSt.toggleBtn}
                    onPress={() => { Haptics.selectionAsync(); togglePhotoExclusive(photo.id); }}
                  >
                    <Text style={gallSt.toggleText}>{photo.exclusive ? "Make Free" : "Make Excl."}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          ))}

          {/* Add photo tile */}
          <TouchableOpacity
            style={[gallSt.tile, gallSt.addTile, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => setAddPhotoVisible(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={30} color={colors.primary} />
            <Text style={[gallSt.addLabel, { color: colors.mutedForeground }]}>Add photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
          {!editingLocation && (
            <TouchableOpacity onPress={() => setEditingLocation(true)}>
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {editingLocation ? (
          <>
            <TextInput
              style={[styles.locationInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City (e.g. Paris, Lagos)"
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
            />
            <TextInput
              style={[styles.locationInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, marginTop: 8 }]}
              value={editCountry}
              onChangeText={setEditCountry}
              placeholder="Country"
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
            />
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}
              onPress={handleGPS}
              disabled={locating}
              activeOpacity={0.75}
            >
              <Ionicons name="navigate-outline" size={15} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                {locating ? "Detecting…" : "Use GPS"}
              </Text>
            </TouchableOpacity>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: colors.border }]}
                onPress={() => { setEditingLocation(false); setEditCity(userProfile?.city ?? ""); setEditCountry(userProfile?.country ?? ""); }}
              >
                <Text style={[styles.editBtnText, { color: colors.mutedForeground }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveLocation}
                disabled={upsertProfile.isPending}
              >
                <Text style={[styles.editBtnText, { color: "#FFFFFF" }]}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.prefRow, { gap: 8 }]} onPress={() => setEditingLocation(true)} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.prefText, { color: colors.foreground, flex: 1 }]}>
                {userProfile?.city
                  ? [userProfile.city, userProfile.country].filter(Boolean).join(", ")
                  : t("profile.noLocation")}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={styles.prefRow}>
              <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.prefText, { color: colors.foreground }]}>
                {userProfile?.seeking ? userProfile.seeking.charAt(0).toUpperCase() + userProfile.seeking.slice(1) : "Everyone"}
              </Text>
            </View>
          </>
        )}
      </View>

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

        {/* Buy ST tokens — free-form amount */}
        <Text style={[styles.tokenPackTitle, { color: colors.foreground }]}>Buy Spark Tokens 🔥</Text>
        <Text style={[styles.tokenRateHint, { color: colors.mutedForeground }]}>
          1 ST = €0.01 · 1 rose = 1 ST · minimum 50 ST
        </Text>
        <View style={[styles.tokenInputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.tokenInput, { color: colors.foreground }]}
            value={customTokenAmount}
            onChangeText={(v) => setCustomTokenAmount(v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="e.g. 20, 50, 200…"
            placeholderTextColor={colors.mutedForeground}
            maxLength={6}
            editable={!buyingTokens}
          />
          <Text style={[styles.tokenInputSuffix, { color: colors.mutedForeground }]}>ST</Text>
          {!!customTokenAmount && parseInt(customTokenAmount, 10) >= ST_MIN && (
            <Text style={[styles.tokenInputPrice, { color: colors.primary }]}>
              = €{(parseInt(customTokenAmount, 10) / 100).toFixed(2)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.tokenBuyBtn,
            {
              backgroundColor:
                !customTokenAmount || parseInt(customTokenAmount, 10) < ST_MIN || buyingTokens
                  ? colors.muted
                  : colors.primary,
            },
          ]}
          activeOpacity={0.8}
          disabled={!customTokenAmount || parseInt(customTokenAmount, 10) < ST_MIN || buyingTokens}
          onPress={async () => {
            const amount = parseInt(customTokenAmount, 10);
            if (!amount || amount < ST_MIN) return;
            const priceEur = parseFloat((amount / 100).toFixed(2));
            try {
              setBuyingTokens(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const paid = await buyTokensWithStripe(amount, priceEur);
              if (paid) {
                addCoins(amount);
                setCustomTokenAmount("");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("🔥 Tokens added!", `${amount} ST credited to your wallet.`);
              }
            } catch (e: any) {
              Alert.alert("Purchase failed", e?.message ?? "Please try again.");
            } finally {
              setBuyingTokens(false);
            }
          }}
        >
          <Text style={styles.tokenBuyBtnText}>
            {buyingTokens ? "Processing…" : "Buy Tokens"}
          </Text>
        </TouchableOpacity>

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

      {/* Account actions — three buttons */}
      <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: bottomPadding + 24, gap: 10 }}>

        {/* Log Out */}
        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            paddingVertical: 13, borderRadius: 14, borderWidth: 1,
            borderColor: "rgba(255,51,102,0.4)",
            backgroundColor: "rgba(255,51,102,0.07)",
            opacity: pressed || loggingOut ? 0.5 : 1,
          })}
        >
          <Ionicons name="log-out-outline" size={16} color="#FF3366" />
          <Text style={{ color: "#FF3366", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
            {loggingOut ? "Logging out…" : "Log Out"}
          </Text>
        </Pressable>

        {/* Reset Account */}
        <Pressable
          onPress={handleResetAccount}
          disabled={resetAccountMutation.isPending}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            paddingVertical: 13, borderRadius: 14, borderWidth: 1,
            borderColor: "rgba(251,146,60,0.4)",
            backgroundColor: "rgba(251,146,60,0.07)",
            opacity: pressed || resetAccountMutation.isPending ? 0.5 : 1,
          })}
        >
          <Ionicons name="refresh-circle-outline" size={16} color="#FB923C" />
          <Text style={{ color: "#FB923C", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
            {resetAccountMutation.isPending ? "Resetting…" : "Reset Account"}
          </Text>
        </Pressable>

        {/* Delete Account */}
        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            paddingVertical: 13, borderRadius: 14, borderWidth: 1,
            borderColor: "rgba(239,68,68,0.35)",
            backgroundColor: "rgba(239,68,68,0.07)",
            opacity: pressed || deleteAccountMutation.isPending ? 0.5 : 1,
          })}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
            {deleteAccountMutation.isPending ? "Deleting…" : "Delete Account"}
          </Text>
        </Pressable>

        <Text style={{ textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 4, lineHeight: 16 }}>
          Reset keeps your email & subscription.{"\n"}Delete removes all data — your email stays so you can return.
        </Text>
      </View>
    </ScrollView>

    </View>

    {/* Add Photo/Video modal */}
    <Modal visible={addPhotoVisible} transparent animationType="fade" onRequestClose={() => setAddPhotoVisible(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAddPhotoVisible(false)}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Photo or Video</Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 12 }]}>
            Free = visible to everyone. Exclusive = blurred, people pay 20 ST (€0.20) to unlock.
          </Text>

          {/* Free Photo */}
          <TouchableOpacity
            style={[gallSt.addOptionBtn, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)" }]}
            onPress={() => pickGalleryPhoto(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={22} color="#22c55e" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#22c55e" }}>Free Photo</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Visible to everyone</Text>
            </View>
          </TouchableOpacity>

          {/* Exclusive Photo */}
          <TouchableOpacity
            style={[gallSt.addOptionBtn, { backgroundColor: "rgba(255,51,102,0.10)", borderColor: "rgba(255,51,102,0.4)" }]}
            onPress={() => pickGalleryPhoto(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#FF3366" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#FF3366" }}>🔒 Exclusive Photo</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Blurred — pay 20 ST (€0.20) to unlock</Text>
            </View>
          </TouchableOpacity>

          {/* Free Video */}
          <TouchableOpacity
            style={[gallSt.addOptionBtn, { backgroundColor: "rgba(99,102,241,0.10)", borderColor: "rgba(99,102,241,0.4)" }]}
            onPress={() => pickGalleryVideo(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam-outline" size={22} color="#6366f1" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#6366f1" }}>Free Video</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Short video, visible to everyone</Text>
            </View>
          </TouchableOpacity>

          {/* Exclusive Video */}
          <TouchableOpacity
            style={[gallSt.addOptionBtn, { backgroundColor: "rgba(168,85,247,0.10)", borderColor: "rgba(168,85,247,0.4)" }]}
            onPress={() => pickGalleryVideo(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#a855f7" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#a855f7" }}>🔒 Exclusive Video</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Blurred — pay 20 ST (€0.20) to unlock</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setAddPhotoVisible(false)} style={{ paddingVertical: 8, marginTop: 4 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>

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
  tokenPackTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 12, marginBottom: 4 },
  tokenRateHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  tokenInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
    marginBottom: 8,
  },
  tokenInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    paddingVertical: 10,
  },
  tokenInputSuffix: { fontSize: 15, fontFamily: "Inter_500Medium" },
  tokenInputPrice: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tokenBuyBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  tokenBuyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
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

const GALLERY_TILE = (Dimensions.get("window").width - 48 - 8) / 3;
const gallSt = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tile: { width: GALLERY_TILE, height: GALLERY_TILE * 1.25, borderRadius: 10, overflow: "hidden", position: "relative" },
  tileImg: { width: "100%", height: "100%" },
  badge: {
    position: "absolute", bottom: 4, left: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  deleteBtn: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 11 },
  toggleBtn: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  toggleText: { color: "#fff", fontSize: 9, fontFamily: "Inter_600SemiBold" },
  addTile: {
    borderWidth: 1.5, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  addLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  addOptionBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10,
  },
});

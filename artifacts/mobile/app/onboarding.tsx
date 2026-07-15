import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRequestUploadUrl, useUpsertMyProfile } from "@workspace/api-client-react";
import BrandLogo from "@/components/BrandLogo";
import { useColors } from "@/hooks/useColors";
import { useLocation } from "@/hooks/useLocation";
import { useTranslation } from "react-i18next";
import i18n, {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  getSavedLanguage,
  saveLanguage,
} from "@/i18n";
import { LANGUAGE_NATIVE_NAMES, LANGUAGE_FLAGS, LanguageCode } from "@/i18n/locales/_languages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Steps: 0=language, 1=photo, 2=name, 3=age, 4=city/country, 5=bio
const STEP_COUNT = 6;

type Seeking = "men" | "women" | "everyone";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || "en"
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [seeking, setSeeking] = useState<Seeking>("everyone");
  const [submitting, setSubmitting] = useState(false);

  const requestUploadUrl = useRequestUploadUrl();
  const upsertMyProfile = useUpsertMyProfile();
  const { location } = useLocation();

  const slideAnim = useRef(new Animated.Value(0)).current;

  const canAdvance =
    step === 0
      ? true // language always has a default
      : step === 1
        ? !!photoUri
        : step === 2
          ? name.trim().length >= 2
          : step === 3
            ? age.trim().length > 0 && Number(age) >= 18 && Number(age) <= 99
            : step === 4
              ? true // city is optional
              : bio.trim().length >= 10;

  const animateForward = (onComplete: () => void) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -40,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("onboarding.permissionNeeded"),
        t("onboarding.photoPermissionMsg")
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (): Promise<string> => {
    const response = await fetch(photoUri!);
    const blob = await response.blob();
    const contentType = blob.type || "image/jpeg";
    const data = await requestUploadUrl.mutateAsync({
      data: { fileName: "profile-photo.jpg", contentType },
    });
    const putRes = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!putRes.ok) {
      throw new Error("Failed to upload photo");
    }
    return data.objectPath;
  };

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
    Haptics.selectionAsync();
  };

  const handleNext = () => {
    if (!canAdvance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < STEP_COUNT - 1) {
      animateForward(() => setStep((s) => s + 1));
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    setSubmitting(true);
    try {
      const objectPath = await uploadPhoto();
      await upsertMyProfile.mutateAsync({
        data: {
          name: name.trim(),
          age: Number(age),
          bio: bio.trim(),
          seeking,
          photoUrl: objectPath,
          city: city.trim() || null,
          country: country.trim() || null,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
        },
      });
      router.replace("/");
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message ?? "Failed to save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const seekingOptions: { label: string; value: Seeking }[] = [
    { label: t("onboarding.men"), value: "men" },
    { label: t("onboarding.women"), value: "women" },
    { label: t("onboarding.everyone"), value: "everyone" },
  ];

  const stepLabels = [
    t("onboarding.steps.language"),
    t("onboarding.steps.addPhoto"),
    t("onboarding.steps.yourName"),
    t("onboarding.steps.yourAge"),
    t("onboarding.steps.yourCity"),
    t("onboarding.steps.aboutYou"),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(255,51,102,0.12)", "transparent"]}
        style={styles.topGradient}
      />

      {/* Language banner — always visible top-right */}
      <TouchableOpacity
        style={[styles.langBannerBtn, { top: insets.top + 14 }]}
        onPress={() => setShowLangPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.langBannerFlag}>
          {LANGUAGE_FLAGS[selectedLanguage as LanguageCode] ?? "🌐"}
        </Text>
        <Text style={[styles.langBannerLabel, { color: colors.foreground }]} numberOfLines={1}>
          {(LANGUAGE_NATIVE_NAMES[selectedLanguage as LanguageCode] ?? selectedLanguage.toUpperCase()).substring(0, 10)}
        </Text>
        <Ionicons name="chevron-down" size={12} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) },
        ]}
      >
        <View style={styles.logoRow}>
          <BrandLogo size={26} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.primary }]}>SparkFuse</Text>
        </View>

        {/* Step indicators */}
        <View style={styles.stepIndicator}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Language step uses a FlatList — no ScrollView wrapper */}
        {step === 0 ? (
          <View style={{ flex: 1 }}>
            <Animated.View style={[styles.stepHeader, { transform: [{ translateY: slideAnim }] }]}>
              <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
                {t("onboarding.step", { current: 1, total: STEP_COUNT })}
              </Text>
              <Text style={[styles.question, { color: colors.foreground }]}>
                {stepLabels[0]}
              </Text>
            </Animated.View>

            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item}
              numColumns={2}
              contentContainerStyle={styles.languageGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedLanguage === item;
                const flag = LANGUAGE_FLAGS[item as LanguageCode] ?? "🌐";
                const native = LANGUAGE_NATIVE_NAMES[item as LanguageCode] ?? item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.langCard,
                      {
                        backgroundColor: isSelected ? colors.primary + "18" : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectLanguage(item as SupportedLanguage)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.langFlag}>{flag}</Text>
                    <Text
                      style={[
                        styles.langName,
                        { color: isSelected ? colors.primary : colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {native}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.langCheck} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
              ]}
            >
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={[styles.nextBtnText, { color: "#FFFFFF" }]}>
                  {t("common.continue")}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
                  {t("onboarding.step", { current: step + 1, total: STEP_COUNT })}
                </Text>
                <Text style={[styles.question, { color: colors.foreground }]}>
                  {stepLabels[step]}
                </Text>

                {/* Step 1: Photo */}
                {step === 1 && (
                  <View style={styles.photoStep}>
                    <TouchableOpacity
                      style={[
                        styles.photoPicker,
                        {
                          backgroundColor: colors.card,
                          borderColor: photoUri ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={handlePickPhoto}
                      activeOpacity={0.85}
                    >
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="camera-outline" size={36} color={colors.mutedForeground} />
                          <Text style={[styles.photoPlaceholderText, { color: colors.mutedForeground }]}>
                            {t("onboarding.tapToAddPhoto")}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 2: Name */}
                {step === 2 && (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: name.length > 0 ? colors.primary : colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder={t("onboarding.namePlaceholder")}
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    maxLength={30}
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                )}

                {/* Step 3: Age */}
                {step === 3 && (
                  <>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: age.length > 0 ? colors.primary : colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder={t("onboarding.agePlaceholder")}
                      placeholderTextColor={colors.mutedForeground}
                      value={age}
                      onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                      autoFocus
                      maxLength={2}
                      returnKeyType="next"
                      onSubmitEditing={handleNext}
                    />
                    {Number(age) > 0 && Number(age) < 18 && (
                      <Text style={[styles.errorText, { color: colors.destructive }]}>
                        {t("onboarding.mustBe18")}
                      </Text>
                    )}
                  </>
                )}

                {/* Step 4: City / Country */}
                {step === 4 && (
                  <>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: city.length > 0 ? colors.primary : colors.border,
                          color: colors.foreground,
                          marginBottom: 14,
                        },
                      ]}
                      placeholder={t("onboarding.cityPlaceholder")}
                      placeholderTextColor={colors.mutedForeground}
                      value={city}
                      onChangeText={setCity}
                      autoFocus
                      maxLength={80}
                      returnKeyType="next"
                    />
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: country.length > 0 ? colors.primary : colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder={t("onboarding.countryPlaceholder")}
                      placeholderTextColor={colors.mutedForeground}
                      value={country}
                      onChangeText={setCountry}
                      maxLength={80}
                      returnKeyType="done"
                      onSubmitEditing={handleNext}
                    />
                    <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                      This helps match you with nearby people. Optional.
                    </Text>
                  </>
                )}

                {/* Step 5: Bio */}
                {step === 5 && (
                  <>
                    <TextInput
                      style={[
                        styles.bioInput,
                        {
                          backgroundColor: colors.card,
                          borderColor: bio.length > 0 ? colors.primary : colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder={t("onboarding.bioPlaceholder")}
                      placeholderTextColor={colors.mutedForeground}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      autoFocus
                      maxLength={200}
                      returnKeyType="done"
                    />
                    <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                      {bio.length}/200
                    </Text>

                    <Text style={[styles.seekingLabel, { color: colors.foreground }]}>
                      {t("onboarding.interestedIn")}
                    </Text>
                    <View style={styles.seekingRow}>
                      {seekingOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.seekingBtn,
                            {
                              backgroundColor:
                                seeking === opt.value ? colors.primary : colors.card,
                              borderColor:
                                seeking === opt.value ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => {
                            setSeeking(opt.value);
                            Haptics.selectionAsync();
                          }}
                        >
                          <Text
                            style={[
                              styles.seekingBtnText,
                              {
                                color:
                                  seeking === opt.value ? "#FFFFFF" : colors.foreground,
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </Animated.View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  {
                    backgroundColor: canAdvance && !submitting ? colors.primary : colors.muted,
                  },
                ]}
                onPress={handleNext}
                disabled={!canAdvance || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.nextBtnText,
                        { color: canAdvance ? "#FFFFFF" : colors.mutedForeground },
                      ]}
                    >
                      {step === STEP_COUNT - 1 ? t("onboarding.getStarted") : t("common.continue")}
                    </Text>
                    <Ionicons
                      name={step === STEP_COUNT - 1 ? "heart" : "arrow-forward"}
                      size={18}
                      color={canAdvance ? "#FFFFFF" : colors.mutedForeground}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Language picker modal — accessible from banner at any step */}
      <Modal
        visible={showLangPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLangPicker(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setShowLangPicker(false)}
        >
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 16,
              maxHeight: "82%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 18, fontFamily: "Inter_700Bold" }}>
                Choose Language
              </Text>
              <TouchableOpacity onPress={() => setShowLangPicker(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item}
              numColumns={2}
              contentContainerStyle={{ padding: 12 }}
              columnWrapperStyle={{ gap: 8 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedLanguage === item;
                const flag = LANGUAGE_FLAGS[item as LanguageCode] ?? "🌐";
                const native = LANGUAGE_NATIVE_NAMES[item as LanguageCode] ?? item;
                return (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 14,
                      backgroundColor: isSelected ? colors.primary + "20" : colors.card,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={async () => {
                      await handleSelectLanguage(item as SupportedLanguage);
                      setShowLangPicker(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 22 }}>{flag}</Text>
                    <Text
                      style={{ flex: 1, color: isSelected ? colors.primary : colors.foreground, fontSize: 13, fontFamily: "Inter_600SemiBold" }}
                      numberOfLines={1}
                    >
                      {native}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  stepHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  languageGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  langCard: {
    flex: 1,
    margin: 5,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  langFlag: {
    fontSize: 22,
  },
  langName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  langCheck: {
    marginLeft: "auto",
  },
  photoStep: {
    alignItems: "center",
    marginTop: 12,
  },
  photoPicker: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  photoPlaceholderText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  question: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 32,
    lineHeight: 36,
  },
  input: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    fontFamily: "Inter_400Regular",
  },
  bioInput: {
    fontSize: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 6,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
  },
  seekingLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 14,
  },
  seekingRow: {
    flexDirection: "row",
    gap: 10,
  },
  seekingBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  seekingBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 50,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  langBannerBtn: {
    position: "absolute",
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  langBannerFlag: {
    fontSize: 16,
  },
  langBannerLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 80,
  },
});

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
  KeyboardAvoidingView,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
  { id: 0, label: "Add a photo" },
  { id: 1, label: "What's your name?" },
  { id: 2, label: "How old are you?" },
  { id: 3, label: "Tell us about yourself" },
];

type Seeking = "men" | "women" | "everyone";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [seeking, setSeeking] = useState<Seeking>("everyone");
  const [submitting, setSubmitting] = useState(false);

  const requestUploadUrl = useRequestUploadUrl();
  const upsertMyProfile = useUpsertMyProfile();
  const { location } = useLocation();

  const slideAnim = useRef(new Animated.Value(0)).current;

  const canAdvance =
    step === 0
      ? !!photoUri
      : step === 1
        ? name.trim().length >= 2
        : step === 2
          ? age.trim().length > 0 && Number(age) >= 18 && Number(age) <= 99
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
      Alert.alert("Permission needed", "Please allow photo library access to add a profile photo.");
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

  const handleNext = () => {
    if (!canAdvance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < STEPS.length - 1) {
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
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
        },
      });
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const seekingOptions: { label: string; value: Seeking }[] = [
    { label: "Men", value: "men" },
    { label: "Women", value: "women" },
    { label: "Everyone", value: "everyone" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(255,51,102,0.12)", "transparent"]}
        style={styles.topGradient}
      />

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

        <View style={styles.stepIndicator}>
          {STEPS.map((s) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    s.id <= step ? colors.primary : colors.border,
                  width: s.id === step ? 24 : 8,
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
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
              Step {step + 1} of {STEPS.length}
            </Text>
            <Text style={[styles.question, { color: colors.foreground }]}>
              {STEPS[step].label}
            </Text>

            {step === 0 && (
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
                        Tap to add a photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 1 && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: name.length > 0 ? colors.primary : colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Your first name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={30}
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            )}

            {step === 2 && (
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
                  placeholder="Your age"
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
                    Must be 18 or older
                  </Text>
                )}
              </>
            )}

            {step === 3 && (
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
                  placeholder="Write something interesting about yourself..."
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
                  Interested in
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
                              seeking === opt.value
                                ? "#FFFFFF"
                                : colors.foreground,
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
                  {step === STEPS.length - 1 ? "Get Started" : "Continue"}
                </Text>
                <Ionicons
                  name={step === STEPS.length - 1 ? "heart" : "arrow-forward"}
                  size={18}
                  color={canAdvance ? "#FFFFFF" : colors.mutedForeground}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
});

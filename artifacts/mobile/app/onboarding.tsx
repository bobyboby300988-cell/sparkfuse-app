import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
  { id: 0, label: "What's your name?" },
  { id: 1, label: "How old are you?" },
  { id: 2, label: "Tell us about yourself" },
];

type Seeking = "men" | "women" | "everyone";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserProfile } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [seeking, setSeeking] = useState<Seeking>("everyone");

  const slideAnim = useRef(new Animated.Value(0)).current;

  const canAdvance =
    step === 0
      ? name.trim().length >= 2
      : step === 1
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
    await setUserProfile({
      name: name.trim(),
      age: Number(age),
      bio: bio.trim(),
      seeking,
    });
    router.replace("/");
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
          <Ionicons name="flame" size={28} color={colors.primary} />
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

            {step === 1 && (
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

            {step === 2 && (
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
                backgroundColor: canAdvance ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleNext}
            disabled={!canAdvance}
            activeOpacity={0.85}
          >
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

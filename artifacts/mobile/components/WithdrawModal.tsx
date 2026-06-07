import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const API_BASE = "https://match-maker-dumitru8830.replit.app/api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Method = "bank" | "paypal";

export default function WithdrawModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { earnings, clearEarnings } = useApp();

  const [method, setMethod] = useState<Method>("bank");
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    message: string;
    ref: string;
    gross: number;
    fee: number;
    net: number;
  } | null>(null);

  const PLATFORM_FEE = 0.10;
  const fee = parseFloat((earnings * PLATFORM_FEE).toFixed(2));
  const netAmount = parseFloat((earnings - fee).toFixed(2));
  const canWithdraw = earnings >= 1;

  async function handleWithdraw() {
    if (!canWithdraw) {
      Alert.alert("Not enough balance", "Minimum withdrawal is €1.00");
      return;
    }
    if (method === "bank" && (!iban.trim() || !accountHolder.trim())) {
      Alert.alert("Missing details", "Please enter your IBAN and account holder name.");
      return;
    }
    if (method === "paypal" && !paypalEmail.trim()) {
      Alert.alert("Missing details", "Please enter your PayPal email address.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: earnings,
          method,
          details:
            method === "bank"
              ? { iban: iban.trim(), accountHolder: accountHolder.trim() }
              : { paypalEmail: paypalEmail.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      await clearEarnings();
      setSuccess({
        message: data.message,
        ref: data.referenceId,
        gross: data.grossAmount ?? earnings,
        fee: data.fee ?? fee,
        net: data.netAmount ?? netAmount,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Withdrawal failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSuccess(null);
    setIban("");
    setAccountHolder("");
    setPaypalEmail("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Withdraw Earnings</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {success ? (
            /* ── Success screen ── */
            <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
              <View style={[styles.successIcon, { backgroundColor: "#E8FFF3" }]}>
                <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Withdrawal Sent!</Text>
              <Text style={[styles.successMsg, { color: colors.mutedForeground }]}>{success.message}</Text>

              {/* Fee breakdown */}
              <View style={[styles.breakdownBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Gross earnings</Text>
                  <Text style={[styles.breakdownValue, { color: colors.foreground }]}>€{success.gross.toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Platform fee (10%)</Text>
                  <Text style={[styles.breakdownValue, { color: "#EF4444" }]}>−€{success.fee.toFixed(2)}</Text>
                </View>
                <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabelBold, { color: colors.foreground }]}>You receive</Text>
                  <Text style={[styles.breakdownValueBold, { color: "#22C55E" }]}>€{success.net.toFixed(2)}</Text>
                </View>
              </View>

              <View style={[styles.refRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="receipt-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.refText, { color: colors.mutedForeground }]}>{success.ref}</Text>
              </View>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: "#FF3366" }]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Balance */}
              <View style={[styles.balanceBox, { backgroundColor: "#FF336615", borderColor: "#FF336640" }]}>
                <Ionicons name="wallet" size={22} color="#FF3366" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Available balance</Text>
                  <Text style={[styles.balanceValue, { color: colors.foreground }]}>
                    €{earnings.toFixed(2)}
                  </Text>
                </View>
                {!canWithdraw && (
                  <Text style={[styles.minNote, { color: colors.mutedForeground }]}>Min €1.00</Text>
                )}
              </View>

              {/* Method tabs */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Withdrawal method</Text>
              <View style={[styles.methodRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {(["bank", "paypal"] as Method[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.methodTab,
                      method === m && { backgroundColor: "#FF3366" },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMethod(m);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={m === "bank" ? "business-outline" : "logo-paypal"}
                      size={16}
                      color={method === m ? "#fff" : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: method === m ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {m === "bank" ? "Bank Transfer" : "PayPal"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bank fields */}
              {method === "bank" && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Account holder name</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="Full name as on bank account"
                    placeholderTextColor={colors.mutedForeground}
                    value={accountHolder}
                    onChangeText={setAccountHolder}
                    autoCapitalize="words"
                  />
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>IBAN</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    placeholderTextColor={colors.mutedForeground}
                    value={iban}
                    onChangeText={setIban}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                    Bank transfers arrive in 3–5 business days.
                  </Text>
                </>
              )}

              {/* PayPal fields */}
              {method === "paypal" && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>PayPal email address</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={paypalEmail}
                    onChangeText={setPaypalEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                    PayPal transfers usually arrive within 24 hours.
                  </Text>
                </>
              )}

              {/* Fee summary */}
              {canWithdraw && (
                <View style={[styles.feeSummary, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.feeRow}>
                    <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>Gross earnings</Text>
                    <Text style={[styles.feeValue, { color: colors.foreground }]}>€{earnings.toFixed(2)}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>Platform fee (10%)</Text>
                    <Text style={[styles.feeValue, { color: "#EF4444" }]}>−€{fee.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.feeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.feeRow}>
                    <Text style={[styles.feeLabelBold, { color: colors.foreground }]}>You receive</Text>
                    <Text style={[styles.feeValueBold, { color: "#22C55E" }]}>€{netAmount.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {/* Withdraw button */}
              <TouchableOpacity
                style={[
                  styles.withdrawBtn,
                  { backgroundColor: canWithdraw ? "#FF3366" : colors.muted },
                ]}
                onPress={handleWithdraw}
                disabled={loading || !canWithdraw}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
                    <Text style={styles.withdrawBtnText}>
                      Withdraw · receive €{netAmount.toFixed(2)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  balanceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
  },
  minNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  methodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  methodTabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
    lineHeight: 18,
  },
  feeSummary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  feeValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  feeLabelBold: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  feeValueBold: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  feeDivider: {
    height: 1,
    marginVertical: 4,
  },
  breakdownBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  breakdownValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  breakdownLabelBold: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  breakdownValueBold: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  breakdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  withdrawBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  successMsg: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 28,
  },
  refText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  doneBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});

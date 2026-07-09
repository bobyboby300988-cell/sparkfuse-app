import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { API_BASE } from "@/config/payments";

const CONNECT_RETURN_URL = "mobile://connect-return";
const CONNECT_REFRESH_URL = "mobile://connect-refresh";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { earnings, clearEarnings, stripeConnectAccountId, setStripeConnectAccountId } = useApp();

  const [method, setMethod] = useState<"stripe" | "paypal">("stripe");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [onboarding, setOnboarding] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
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

  async function checkStatus(accountId: string) {
    setCheckingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/connect/status/${accountId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not check payout account status");
      setPayoutsEnabled(!!data.payoutsEnabled);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not check payout account status");
    } finally {
      setCheckingStatus(false);
      setStatusChecked(true);
    }
  }

  React.useEffect(() => {
    if (visible && stripeConnectAccountId) {
      checkStatus(stripeConnectAccountId);
    }
  }, [visible, stripeConnectAccountId]);

  async function handleVerifyIdentity() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOnboarding(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/connect/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: stripeConnectAccountId ?? undefined,
          refreshUrl: CONNECT_REFRESH_URL,
          returnUrl: CONNECT_RETURN_URL,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start verification");

      if (!stripeConnectAccountId) {
        await setStripeConnectAccountId(data.accountId);
      }

      await WebBrowser.openAuthSessionAsync(data.url, CONNECT_RETURN_URL);
      await checkStatus(data.accountId);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not start verification");
    } finally {
      setOnboarding(false);
    }
  }

  async function handleWithdrawStripe() {
    if (!stripeConnectAccountId || !payoutsEnabled) {
      Alert.alert("Verify your account first", "You need to finish identity verification with Stripe before withdrawing.");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: earnings,
          connectedAccountId: stripeConnectAccountId,
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
      setWithdrawing(false);
    }
  }

  async function handleWithdrawPayPal() {
    const trimmedEmail = payoutEmail.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert("PayPal email required", "Enter the PayPal email you want to receive your payout at.");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_BASE}/paypal/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: earnings,
          payoutEmail: trimmedEmail,
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
      setWithdrawing(false);
    }
  }

  async function handleWithdraw() {
    if (!canWithdraw) {
      Alert.alert("Not enough balance", "Minimum withdrawal is €1.00");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (method === "stripe") {
      await handleWithdrawStripe();
    } else {
      await handleWithdrawPayPal();
    }
  }

  function handleClose() {
    setSuccess(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Withdraw Earnings</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {success ? (
            <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
              <View style={[styles.successIcon, { backgroundColor: "#E8FFF3" }]}>
                <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Withdrawal Sent!</Text>
              <Text style={[styles.successMsg, { color: colors.mutedForeground }]}>{success.message}</Text>

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
            <ScrollView showsVerticalScrollIndicator={false}>
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

              <View style={[styles.methodRow, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    method === "stripe" && { backgroundColor: "#FF3366" },
                  ]}
                  onPress={() => setMethod("stripe")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.methodBtnText, { color: method === "stripe" ? "#fff" : colors.mutedForeground }]}>
                    Bank (Stripe)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    method === "paypal" && { backgroundColor: "#FF3366" },
                  ]}
                  onPress={() => setMethod("paypal")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.methodBtnText, { color: method === "paypal" ? "#fff" : colors.mutedForeground }]}>
                    PayPal
                  </Text>
                </TouchableOpacity>
              </View>

              {method === "stripe" ? (
                checkingStatus ? (
                  <View style={styles.statusBox}>
                    <ActivityIndicator color={colors.mutedForeground} />
                  </View>
                ) : !payoutsEnabled ? (
                  <View style={[styles.verifyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="shield-checkmark-outline" size={28} color="#FF3366" />
                    <Text style={[styles.verifyTitle, { color: colors.foreground }]}>
                      Verify your identity to get paid
                    </Text>
                    <Text style={[styles.verifyMsg, { color: colors.mutedForeground }]}>
                      Real payouts to your bank account require a quick one-time identity check
                      with Stripe (name, ID, bank details). This is required by law for anyone
                      receiving automated payouts.
                    </Text>
                    <TouchableOpacity
                      style={[styles.verifyBtn, { backgroundColor: "#FF3366" }]}
                      onPress={handleVerifyIdentity}
                      disabled={onboarding}
                      activeOpacity={0.85}
                    >
                      {onboarding ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="lock-open-outline" size={18} color="#fff" />
                          <Text style={styles.verifyBtnText}>
                            {stripeConnectAccountId ? "Continue verification" : "Verify with Stripe"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {statusChecked && stripeConnectAccountId && (
                      <TouchableOpacity onPress={() => checkStatus(stripeConnectAccountId)} style={{ marginTop: 10 }}>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                          Already verified? Tap to refresh status
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={[styles.verifiedBox, { backgroundColor: "#22C55E15", borderColor: "#22C55E40" }]}>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                    <Text style={[styles.verifiedText, { color: colors.foreground }]}>
                      Payout account verified — withdrawals go straight to your bank.
                    </Text>
                  </View>
                )
              ) : (
                <View style={[styles.verifyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="logo-paypal" size={28} color="#FF3366" />
                  <Text style={[styles.verifyTitle, { color: colors.foreground }]}>
                    Get paid via PayPal
                  </Text>
                  <Text style={[styles.verifyMsg, { color: colors.mutedForeground }]}>
                    Enter the PayPal email you want your payout sent to.
                  </Text>
                  <TextInput
                    style={[
                      styles.emailInput,
                      { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
                    ]}
                    placeholder="you@paypal.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={payoutEmail}
                    onChangeText={setPayoutEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              )}

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

              <TouchableOpacity
                style={[
                  styles.withdrawBtn,
                  {
                    backgroundColor:
                      canWithdraw && (method === "paypal" || payoutsEnabled) ? "#FF3366" : colors.muted,
                  },
                ]}
                onPress={handleWithdraw}
                disabled={withdrawing || !canWithdraw || (method === "stripe" && !payoutsEnabled)}
                activeOpacity={0.85}
              >
                {withdrawing ? (
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
      </View>
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
  statusBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  methodRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  methodBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  emailInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  verifyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  verifyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  verifyMsg: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 6,
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
  },
  verifyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  verifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
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

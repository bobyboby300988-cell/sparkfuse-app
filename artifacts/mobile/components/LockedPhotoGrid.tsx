import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";
import { LockedPhoto } from "@/data/allProfiles";
import { useColors } from "@/hooks/useColors";

const { width: W } = Dimensions.get("window");
const API_BASE = "https://match-maker-dumitru8830.replit.app/api";
const APP_URL = "https://match-maker-dumitru8830.replit.app";

interface Props {
  profileName: string;
  lockedPhotos: LockedPhoto[];
}

function UnlockModal({
  photo,
  profileName,
  visible,
  onClose,
  onUnlocked,
}: {
  photo: LockedPhoto | null;
  profileName: string;
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const colors = useColors();
  const { addEarning } = useApp();
  const [loading, setLoading] = useState(false);

  if (!photo) return null;

  const handleStripe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/unlock-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: photo.id,
          profileName,
          price: photo.priceEur * 100,
          currency: "eur",
          successUrl: `${APP_URL}/?unlocked=${photo.id}`,
          cancelUrl: `${APP_URL}/?cancelled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        await Linking.openURL(data.url);
        // Mark as unlocked after returning (optimistic)
        onUnlocked();
        onClose();
      } else {
        Alert.alert("Error", data.error ?? "Could not start checkout.");
      }
    } catch {
      Alert.alert("Error", "Could not connect to payment server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEarning(photo.priceEur);
    onUnlocked();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalSt.overlay}>
        <View style={[modalSt.sheet, { backgroundColor: colors.card }]}>
          <View style={modalSt.lockIcon}>
            <Ionicons name="lock-closed" size={32} color="#FF3366" />
          </View>
          <Text style={[modalSt.title, { color: colors.foreground }]}>Exclusive Photo</Text>
          <Text style={[modalSt.sub, { color: colors.mutedForeground }]}>
            Unlock this photo from {profileName} for a one-time payment.
          </Text>

          <View style={[modalSt.priceRow, { backgroundColor: colors.background }]}>
            <Ionicons name="pricetag" size={16} color="#FF3366" />
            <Text style={[modalSt.price, { color: colors.foreground }]}>€{photo.priceEur.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[modalSt.payBtn, loading && { opacity: 0.6 }]}
            onPress={handleStripe}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={modalSt.payBtnText}>Pay with Stripe</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[modalSt.demoBtn, { borderColor: colors.border }]} onPress={handleDemo} activeOpacity={0.8}>
            <Text style={[modalSt.demoBtnText, { color: colors.mutedForeground }]}>
              ✓ Simulate unlock (demo)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={modalSt.cancelBtn}>
            <Text style={[modalSt.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const TILE = (W - 48 - 8) / 3;

export function LockedPhotoGrid({ profileName, lockedPhotos }: Props) {
  const colors = useColors();
  const { unlockedPhotos, unlockPhoto } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<LockedPhoto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  if (!lockedPhotos || lockedPhotos.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="lock-closed" size={14} color="#FF3366" />
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Exclusive Content · {lockedPhotos.length} photo{lockedPhotos.length > 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.grid}>
        {lockedPhotos.map((lp) => {
          const isUnlocked = unlockedPhotos.includes(lp.id);
          return (
            <TouchableOpacity
              key={lp.id}
              style={styles.tile}
              onPress={() => {
                if (!isUnlocked) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedPhoto(lp);
                  setModalVisible(true);
                }
              }}
              activeOpacity={isUnlocked ? 1 : 0.85}
            >
              <Image source={lp.photo} style={styles.tileImg} contentFit="cover" />

              {!isUnlocked && (
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={22} color="#fff" />
                  <Text style={styles.lockPrice}>€{lp.priceEur.toFixed(2)}</Text>
                  <Text style={styles.lockTap}>Tap to unlock</Text>
                </View>
              )}

              {isUnlocked && (
                <View style={styles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <UnlockModal
        photo={selectedPhoto}
        profileName={profileName}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelectedPhoto(null); }}
        onUnlocked={() => selectedPhoto && unlockPhoto(selectedPhoto.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  grid: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tile: { width: TILE, height: TILE * 1.3, borderRadius: 10, overflow: "hidden" },
  tileImg: { width: "100%", height: "100%" },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  lockPrice: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  lockTap: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: "Inter_400Regular" },
  unlockedBadge: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, padding: 2,
  },
});

const modalSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, gap: 14, alignItems: "center" },
  lockIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,51,102,0.12)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  priceRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  price: { fontSize: 18, fontFamily: "Inter_700Bold" },
  payBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 54, borderRadius: 27, backgroundColor: "#FF3366",
  },
  payBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  demoBtn: {
    width: "100%", height: 46, borderRadius: 23, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  demoBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  cancelBtn: { paddingVertical: 4 },
  cancelText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

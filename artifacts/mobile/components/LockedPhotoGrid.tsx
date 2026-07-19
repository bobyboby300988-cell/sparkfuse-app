import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
const TILE = (W - 48 - 8) / 3;

const PHOTO_PRICE_ST = 50;
const VIDEO_PRICE_ST = 500;

function getPrice(lp: LockedPhoto) {
  return lp.type === "video" ? VIDEO_PRICE_ST : PHOTO_PRICE_ST;
}
function getPriceEur(lp: LockedPhoto) {
  return lp.type === "video" ? "€5.00" : "€0.50";
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
  const { coinBalance, spendCoins } = useApp();

  if (!photo) return null;

  const price = getPrice(photo);
  const priceEur = getPriceEur(photo);
  const isVideo = photo.type === "video";
  const canAfford = coinBalance >= price;
  const needMore = price - coinBalance;

  const handleUnlock = () => {
    spendCoins(price);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUnlocked();
    onClose();
  };

  const handleBuy = () => {
    onClose();
    router.push("/(tabs)/profile");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalSt.overlay}>
        <View style={[modalSt.sheet, { backgroundColor: colors.card }]}>

          <View style={modalSt.lockCircle}>
            <Ionicons name={isVideo ? "videocam" : "lock-closed"} size={32} color="#FF3366" />
          </View>

          <Text style={[modalSt.title, { color: colors.foreground }]}>
            Exclusive {isVideo ? "Video" : "Photo"}
          </Text>
          <Text style={[modalSt.sub, { color: colors.mutedForeground }]}>
            Unlock this exclusive {isVideo ? "video" : "photo"} from {profileName} using your ST points.
          </Text>

          <View style={[modalSt.priceBadge, { backgroundColor: "rgba(255,51,102,0.10)" }]}>
            <Text style={modalSt.priceST}>🔥 {price} ST</Text>
            <Text style={[modalSt.priceHint, { color: colors.mutedForeground }]}>≈ {priceEur}</Text>
          </View>

          <View style={[modalSt.balanceRow, { backgroundColor: colors.background }]}>
            <Text style={[modalSt.balanceLabel, { color: colors.mutedForeground }]}>Your balance</Text>
            <Text style={[modalSt.balanceValue, { color: canAfford ? "#22c55e" : "#ef4444" }]}>
              {coinBalance} ST
            </Text>
          </View>

          {canAfford ? (
            <TouchableOpacity style={modalSt.unlockBtn} onPress={handleUnlock} activeOpacity={0.85}>
              <Ionicons name="lock-open-outline" size={18} color="#fff" />
              <Text style={modalSt.unlockBtnText}>Unlock for {price} ST</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={[modalSt.warningBox, { backgroundColor: "rgba(239,68,68,0.10)" }]}>
                <Ionicons name="warning-outline" size={16} color="#ef4444" />
                <Text style={[modalSt.warningText, { color: "#ef4444" }]}>
                  You need {needMore} more ST points to unlock this {isVideo ? "video" : "photo"}.
                </Text>
              </View>
              <TouchableOpacity style={modalSt.buyBtn} onPress={handleBuy} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={modalSt.buyBtnText}>Buy ST Points</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={modalSt.cancelBtn}>
            <Text style={[modalSt.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function LockedPhotoGrid({ profileName, lockedPhotos }: { profileName: string; lockedPhotos: LockedPhoto[] }) {
  const colors = useColors();
  const { unlockedPhotos, unlockPhoto } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<LockedPhoto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  if (!lockedPhotos || lockedPhotos.length === 0) return null;

  const photoCount = lockedPhotos.filter((lp) => lp.type !== "video").length;
  const videoCount = lockedPhotos.filter((lp) => lp.type === "video").length;

  const headerParts: string[] = [];
  if (photoCount > 0) headerParts.push(`${photoCount} photo${photoCount > 1 ? "s" : ""} · 20 ST (€0.20) each`);
  if (videoCount > 0) headerParts.push(`${videoCount} video${videoCount > 1 ? "s" : ""} · 500 ST (€5.00) each`);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="lock-closed" size={14} color="#FF3366" />
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Exclusive · {headerParts.join(" · ")}
        </Text>
      </View>

      <View style={styles.grid}>
        {lockedPhotos.map((lp) => {
          const isUnlocked = unlockedPhotos.includes(lp.id);
          const price = getPrice(lp);
          const isVideo = lp.type === "video";
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
              activeOpacity={isUnlocked ? 1 : 0.9}
            >
              <Image
                source={lp.photo as any}
                style={styles.tileImg}
                contentFit="cover"
                blurRadius={isUnlocked ? 0 : 18}
              />

              {isVideo && (
                <View style={styles.videoIcon}>
                  <Ionicons name="videocam" size={14} color="#fff" />
                </View>
              )}

              {!isUnlocked && (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockIconWrap}>
                    <Ionicons name={isVideo ? "videocam" : "lock-closed"} size={20} color="#fff" />
                  </View>
                  <Text style={styles.lockPrice}>{price} ST</Text>
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
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8, flex: 1, flexWrap: "wrap" },
  grid: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tile: { width: TILE, height: TILE * 1.3, borderRadius: 10, overflow: "hidden" },
  tileImg: { width: "100%", height: "100%" },

  videoIcon: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },

  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  lockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  lockPrice: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  unlockedBadge: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 12, padding: 2,
  },
});

const modalSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 14, alignItems: "center" },

  lockCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(255,51,102,0.12)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 2,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  priceBadge: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
  },
  priceST: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FF3366" },
  priceHint: { fontSize: 13, fontFamily: "Inter_400Regular" },

  balanceRow: {
    width: "100%", flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  balanceLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  balanceValue: { fontSize: 16, fontFamily: "Inter_700Bold" },

  unlockBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 54, borderRadius: 27, backgroundColor: "#FF3366",
  },
  unlockBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  warningBox: {
    width: "100%", flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  buyBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 54, borderRadius: 27, backgroundColor: "#FF3366",
  },
  buyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  cancelBtn: { paddingVertical: 6 },
  cancelText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

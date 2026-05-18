import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const settingsItems = [
  { icon: "person-outline" as const, label: "Edit Profile", arrow: true },
  { icon: "body-outline" as const, label: "Skin Profile", arrow: true },
  { icon: "notifications-outline" as const, label: "Notifications", arrow: true },
  { icon: "alarm-outline" as const, label: "Reminders", arrow: true },
  { icon: "language-outline" as const, label: "Language", value: "English", arrow: false },
  { icon: "help-circle-outline" as const, label: "Help & Support", arrow: true },
  { icon: "shield-checkmark-outline" as const, label: "Privacy Policy", arrow: true },
  { icon: "log-out-outline" as const, label: "Logout", arrow: false, danger: true },
];

export default function ProfileScreen() {
  const { user, setIsLoggedIn, setHasOnboarded } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60 + 16;

  const handleItemPress = async (label: string) => {
    if (label === "Logout") {
      await setIsLoggedIn(false);
      router.replace("/auth");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <GlassCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
            {user.isPremium ? (
              <View style={[styles.premiumBadge, { backgroundColor: colors.lavender }]}>
                <Ionicons name="crown-outline" size={12} color={colors.primary} />
                <Text style={[styles.premiumText, { color: colors.primary }]}>Premium Member</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => router.push("/premium")} style={[styles.upgradeBadge, { backgroundColor: "#EEE9FF" }]}>
                <Ionicons name="crown-outline" size={12} color={colors.primary} />
                <Text style={[styles.premiumText, { color: colors.primary }]}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statsRow}>
          {[
            { label: "Scans", value: "12" },
            { label: "Glow Score", value: "82" },
            { label: "Skin Type", value: user.skinType },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <TouchableOpacity onPress={() => router.push("/premium")} activeOpacity={0.9}>
        <LinearGradient
          colors={["#7B61FF", "#A58BFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.premiumBanner}
        >
          <View>
            <Text style={styles.bannerTitle}>GlowAI Premium</Text>
            <Text style={styles.bannerSub}>Unlock unlimited scans & AI analysis</Text>
          </View>
          <View style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Upgrade</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.settingsSection}>
        {settingsItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.settingsItem,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
              i === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
              i === settingsItems.length - 1 && { borderBottomWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
            ]}
            onPress={() => handleItemPress(item.label)}
            activeOpacity={0.7}
          >
            <View style={[styles.settingsIcon, { backgroundColor: item.danger ? "#FEE2E2" : colors.lavender }]}>
              <Ionicons
                name={item.icon}
                size={18}
                color={item.danger ? colors.destructive : colors.primary}
              />
            </View>
            <Text style={[styles.settingsLabel, { color: item.danger ? colors.destructive : colors.foreground }]}>
              {item.label}
            </Text>
            <View style={{ flex: 1 }} />
            {item.value && (
              <Text style={[styles.settingsValue, { color: colors.mutedForeground }]}>{item.value}</Text>
            )}
            {item.arrow && (
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { margin: 20 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 24, fontFamily: "Poppins_700Bold", color: "white" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  upgradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  premiumText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  divider: { height: 1, marginBottom: 14 },
  statsRow: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
  statValue: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  premiumBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "white", marginBottom: 2 },
  bannerSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.8)" },
  bannerBtn: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerBtnText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#7B61FF" },
  settingsSection: {
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  settingsValue: { fontSize: 13, fontFamily: "Poppins_400Regular", marginRight: 4 },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { GlowScoreRing } from "@/components/GlowScoreRing";
import { MetricBar } from "@/components/MetricBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const quickActions = [
  { icon: "scan-outline" as const, label: "Scan Skin", route: "/scan" as const },
  { icon: "chatbubble-ellipses-outline" as const, label: "AI Doctor", route: "/(tabs)/chat" as const },
  { icon: "calendar-outline" as const, label: "Routine", route: "/routine" as const },
  { icon: "bag-outline" as const, label: "Products", route: "/products" as const },
];

const reminders = [
  { icon: "water-outline" as const, text: "Drink 8 glasses of water today", color: "#3B82F6" },
  { icon: "sunny-outline" as const, text: "Apply SPF 50 before going out", color: "#F59E0B" },
];

export default function HomeScreen() {
  const { user, latestScan } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60 + 16;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Hello, {user.name.split(" ")[0]} 👋
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Ready to glow today?
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/premium")} style={[styles.premiumBadge, { backgroundColor: colors.lavender }]}>
          <Ionicons name="crown-outline" size={14} color={colors.primary} />
          <Text style={[styles.premiumText, { color: colors.primary }]}>Premium</Text>
        </TouchableOpacity>
      </View>

      {latestScan && (
        <GlassCard style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <GlowScoreRing score={latestScan.glowScore} size={120} />
            <View style={styles.scoreRight}>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                Skin Health Score
              </Text>
              <Text style={[styles.scoreImprove, { color: colors.success }]}>
                +12% from last month
              </Text>
              <View style={[styles.tipBubble, { backgroundColor: colors.lavender }]}>
                <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.primary }]}>
                  Drink more water today
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionItem, { backgroundColor: colors.card }]}
            onPress={() => router.push(a.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.lavender }]}>
              <Ionicons name={a.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {latestScan && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Metrics</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.metricsCard}>
            <MetricBar label="Hydration" value={latestScan.hydration} color={colors.info} />
            <MetricBar label="Clarity" value={latestScan.clarity} color={colors.primary} />
            <MetricBar label="Smoothness" value={latestScan.smoothness} color={colors.success} />
            <MetricBar label="Glow" value={latestScan.glow} color={colors.accent} />
          </GlassCard>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reminders</Text>
      {reminders.map((r, i) => (
        <GlassCard key={i} style={styles.reminderCard} padding={14}>
          <View style={styles.reminderRow}>
            <View style={[styles.reminderIcon, { backgroundColor: `${r.color}15` }]}>
              <Ionicons name={r.icon} size={20} color={r.color} />
            </View>
            <Text style={[styles.reminderText, { color: colors.foreground }]}>{r.text}</Text>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.border} />
          </View>
        </GlassCard>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Progress</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <GlassCard style={styles.progressTeaser}>
        <View style={styles.progressTeaserRow}>
          <Text style={[styles.progressBig, { color: colors.primary }]}>+38%</Text>
          <View style={styles.progressTeaserRight}>
            <Text style={[styles.progressDesc, { color: colors.foreground }]}>Improvement</Text>
            <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>from last month</Text>
          </View>
        </View>
        <Text style={[styles.progressCaption, { color: colors.success }]}>
          Your skin is healthy & glowing ✦
        </Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontFamily: "Poppins_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  scoreCard: { marginHorizontal: 20, marginBottom: 24 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  scoreRight: { flex: 1 },
  scoreLabel: { fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 4 },
  scoreImprove: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },
  tipBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tipText: { fontSize: 11, fontFamily: "Poppins_500Medium", flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
    marginTop: 4,
  },
  seeAll: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 24,
  },
  actionItem: {
    width: "21.5%",
    aspectRatio: 0.9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", textAlign: "center" },
  metricsCard: { marginHorizontal: 20, marginBottom: 24 },
  reminderCard: { marginHorizontal: 20, marginBottom: 10 },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  reminderIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  reminderText: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular" },
  progressTeaser: { marginHorizontal: 20, marginBottom: 20 },
  progressTeaserRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  progressBig: { fontSize: 36, fontFamily: "Poppins_700Bold" },
  progressTeaserRight: {},
  progressDesc: { fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  progressSub: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  progressCaption: { fontSize: 13, fontFamily: "Poppins_500Medium" },
});

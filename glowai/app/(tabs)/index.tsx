import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
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
  { icon: "scan-outline" as const, label: "Skin Scan", route: "/scan" as const, color: "#00D4FF" },
  { icon: "flask-outline" as const, label: "Ingredients", route: "/ingredient-scanner" as const, color: "#7B61FF" },
  { icon: "journal-outline" as const, label: "Skin Diary", route: "/skin-diary" as const, color: "#00FFA3" },
  { icon: "bag-outline" as const, label: "Products", route: "/products" as const, color: "#FFB800" },
];

const reminders = [
  { icon: "water-outline" as const, text: "Drink 8 glasses of water today", color: "#3B82F6" },
  { icon: "sunny-outline" as const, text: "Apply SPF 50 before going out", color: "#FFB800" },
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Hello, {user.name.split(" ")[0]}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Skin Diagnostics
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/premium")}
          style={styles.premiumBadge}
        >
          <LinearGradient
            colors={["rgba(0,212,255,0.2)", "rgba(123,97,255,0.2)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.premiumBadgeInner}
          >
            <Ionicons name="crown-outline" size={12} color="#00D4FF" />
            <Text style={[styles.premiumText, { color: "#00D4FF" }]}>Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Score card */}
      {latestScan ? (
        <GlassCard style={styles.scoreCard} glow>
          <View style={styles.scoreRow}>
            <GlowScoreRing score={latestScan.glowScore} size={120} />
            <View style={styles.scoreRight}>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                Skin Health Score
              </Text>
              <Text style={[styles.scoreImprove, { color: colors.success }]}>
                +12% from last month
              </Text>
              <View style={styles.tipBubble}>
                <Ionicons name="bulb-outline" size={13} color="#00D4FF" />
                <Text style={[styles.tipText, { color: colors.foreground }]}>
                  Increase hydration intake
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      ) : (
        <TouchableOpacity onPress={() => router.push("/scan")} activeOpacity={0.88}>
          <GlassCard style={styles.noScanCard} glow>
            <View style={styles.noScanContent}>
              <View style={styles.noScanIcon}>
                <Ionicons name="scan-outline" size={28} color="#00D4FF" />
              </View>
              <View>
                <Text style={[styles.noScanTitle, { color: colors.foreground }]}>No scan yet</Text>
                <Text style={[styles.noScanSub, { color: colors.mutedForeground }]}>Run your first AI skin analysis</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#00D4FF" />
            </View>
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Access</Text>
        <View style={styles.sectionDivider} />
      </View>
      <View style={styles.actionsGrid}>
        {quickActions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionItem, { backgroundColor: colors.card, borderColor: `${a.color}20` }]}
            onPress={() => router.push(a.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${a.color}12`, borderColor: `${a.color}25` }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Skin Metrics */}
      {latestScan && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Metrics</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Full Report</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.metricsCard}>
            <MetricBar label="Hydration" value={latestScan.hydration} color="#00D4FF" />
            <MetricBar label="Clarity" value={latestScan.clarity} color="#7B61FF" />
            <MetricBar label="Smoothness" value={latestScan.smoothness} color="#00FFA3" />
            <MetricBar label="Glow Index" value={latestScan.glow} color="#FFB800" />
          </GlassCard>
        </>
      )}

      {/* Reminders */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reminders</Text>
      </View>
      {reminders.map((r, i) => (
        <GlassCard key={i} style={styles.reminderCard} padding={14}>
          <View style={styles.reminderRow}>
            <View style={[styles.reminderIcon, { backgroundColor: `${r.color}18` }]}>
              <Ionicons name={r.icon} size={18} color={r.color} />
            </View>
            <Text style={[styles.reminderText, { color: colors.foreground }]}>{r.text}</Text>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
          </View>
        </GlassCard>
      ))}

      {/* Progress teaser */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>30-Day Progress</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
      <GlassCard style={styles.progressTeaser} glow>
        <View style={styles.progressTeaserRow}>
          <Text style={[styles.progressBig, { color: colors.primary }]}>+38%</Text>
          <View style={styles.progressTeaserRight}>
            <Text style={[styles.progressDesc, { color: colors.foreground }]}>Improvement</Text>
            <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>from last month</Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: "rgba(0,232,122,0.12)" }]}>
            <Ionicons name="trending-up-outline" size={14} color={colors.success} />
            <Text style={[styles.trendText, { color: colors.success }]}>Optimal</Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingHorizontal: 20, marginBottom: 20,
  },
  greeting: { fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 2, letterSpacing: 0.5 },
  headerTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", letterSpacing: 0.5 },
  premiumBadge: { borderRadius: 10, overflow: "hidden", marginTop: 4 },
  premiumBadgeInner: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(0,212,255,0.25)", borderRadius: 10,
  },
  premiumText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  scoreCard: { marginHorizontal: 20, marginBottom: 24 },
  noScanCard: { marginHorizontal: 20, marginBottom: 24 },
  noScanContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  noScanIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  noScanTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  noScanSub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 2 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  scoreRight: { flex: 1, gap: 6 },
  scoreLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", letterSpacing: 0.5 },
  scoreImprove: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  tipBubble: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,212,255,0.08)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    marginTop: 2,
  },
  tipText: { fontSize: 11, fontFamily: "Poppins_500Medium", flex: 1 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.3 },
  sectionDivider: {
    flex: 1, height: 1,
    backgroundColor: "rgba(0,212,255,0.1)", marginLeft: 12,
  },
  seeAll: { fontSize: 12, fontFamily: "Poppins_500Medium", letterSpacing: 0.5 },
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 14, gap: 10, marginBottom: 24,
  },
  actionItem: {
    width: "21.5%", aspectRatio: 0.88,
    borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  actionLabel: { fontSize: 10, fontFamily: "Poppins_600SemiBold", textAlign: "center", letterSpacing: 0.3 },
  metricsCard: { marginHorizontal: 20, marginBottom: 24 },
  reminderCard: { marginHorizontal: 20, marginBottom: 10 },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  reminderIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reminderText: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular" },
  progressTeaser: { marginHorizontal: 20, marginBottom: 20 },
  progressTeaserRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBig: { fontSize: 36, fontFamily: "Poppins_700Bold" },
  progressTeaserRight: { flex: 1 },
  progressDesc: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  progressSub: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  trendBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  trendText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
});

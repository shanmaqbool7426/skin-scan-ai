import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
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

export default function HomeScreen() {
  const { user, latestScan, scanHistory } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60 + 16;

  // ── Dynamic Reminders based on latest scan ──
  const dynamicReminders = useMemo(() => {
    if (!latestScan || !latestScan.issues) return [
      { icon: "sunny-outline" as const, text: "Apply SPF 50 daily to protect skin", color: "#FFB800" },
      { icon: "water-outline" as const, text: "Maintain hydration for skin barrier", color: "#3B82F6" },
    ];
    
    const rems = [];
    const hasAcne = latestScan.issues.some(i => i.type.toLowerCase().includes("acne"));
    const hasDryness = latestScan.issues.some(i => i.type.toLowerCase().includes("dry"));
    const hasPores = latestScan.issues.some(i => i.type.toLowerCase().includes("pore"));
    
    if (hasAcne) rems.push({ icon: "medical-outline" as const, text: "Apply BHA/Salicylic Acid tonight", color: "#FF6B6B" });
    if (hasDryness) rems.push({ icon: "water-outline" as const, text: "Use hyaluronic acid on damp skin", color: "#3B82F6" });
    if (hasPores) rems.push({ icon: "sparkles-outline" as const, text: "Niacinamide routine recommended", color: "#7B61FF" });
    
    if (rems.length < 2) rems.push({ icon: "sunny-outline" as const, text: "Daily SPF 50 is essential", color: "#FFB800" });
    if (rems.length < 2) rems.push({ icon: "moon-outline" as const, text: "Ensure 8 hours of sleep for recovery", color: "#8B5CF6" });
    
    return rems.slice(0, 2);
  }, [latestScan]);

  // ── Dynamic Progress Stats ──
  const progressStats = useMemo(() => {
    if (scanHistory.length < 2) return null;
    const current = scanHistory[0].glowScore;
    const previous = scanHistory[1].glowScore;
    const diff = current - previous;
    const percentage = previous > 0 ? Math.round((Math.abs(diff) / previous) * 100) : 0;
    
    return {
      isUp: diff >= 0,
      diffVal: diff,
      percentage,
      text: diff >= 0 ? "Improvement" : "Decline",
      color: diff >= 0 ? colors.success : colors.destructive,
      icon: diff >= 0 ? "trending-up-outline" as const : "trending-down-outline" as const,
      badgeText: diff >= 0 ? "Optimal" : "Needs Care",
      badgeColor: diff >= 0 ? "rgba(0,232,122,0.12)" : "rgba(255,107,107,0.12)"
    };
  }, [scanHistory, colors]);

  // ── Dynamic Top Tip ──
  const topTip = useMemo(() => {
    if (!latestScan || !latestScan.issues || latestScan.issues.length === 0) return "Keep up your current routine";
    // Get highest severity issue
    const sorted = [...latestScan.issues].sort((a, b) => b.count - a.count);
    const primary = sorted[0];
    if (primary.type.toLowerCase().includes("acne")) return "Focus on gentle exfoliation";
    if (primary.type.toLowerCase().includes("dry")) return "Increase barrier repair creams";
    if (primary.type.toLowerCase().includes("dark")) return "Incorporate Vitamin C";
    return `Manage ${primary.type.toLowerCase()} concerns`;
  }, [latestScan]);

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
            Patient Dashboard
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {user.name.split(" ")[0]}'s Skin
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
            <Ionicons name="star-outline" size={12} color="#00D4FF" />
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
                Clinical Health Score
              </Text>
              
              {progressStats && (
                <Text style={[styles.scoreImprove, { color: progressStats.color }]}>
                  {progressStats.isUp ? "+" : "-"}{progressStats.percentage}% from last scan
                </Text>
              )}
              {!progressStats && (
                <Text style={[styles.scoreImprove, { color: colors.success }]}>
                  Baseline Scan Established
                </Text>
              )}

              <View style={styles.tipBubble}>
                <Ionicons name="bulb-outline" size={13} color="#00D4FF" />
                <Text style={[styles.tipText, { color: colors.foreground }]} numberOfLines={2}>
                  {topTip}
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
                <Text style={[styles.noScanTitle, { color: colors.foreground }]}>Awaiting Diagnostics</Text>
                <Text style={[styles.noScanSub, { color: colors.mutedForeground }]}>Run your first clinical AI scan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#00D4FF" />
            </View>
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tools</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Epidermal Metrics</Text>
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

      {/* Dynamic Reminders */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Recommendations</Text>
      </View>
      {dynamicReminders.map((r, i) => (
        <GlassCard key={i} style={styles.reminderCard} padding={14}>
          <View style={styles.reminderRow}>
            <View style={[styles.reminderIcon, { backgroundColor: `${r.color}18` }]}>
              <Ionicons name={r.icon} size={18} color={r.color} />
            </View>
            <Text style={[styles.reminderText, { color: colors.foreground }]}>{r.text}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </View>
        </GlassCard>
      ))}

      {/* Dynamic Progress teaser */}
      {progressStats && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trend Analysis</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/progress")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.progressTeaser} glow>
            <View style={styles.progressTeaserRow}>
              <Text style={[styles.progressBig, { color: progressStats.color }]}>
                {progressStats.isUp ? "+" : "-"}{progressStats.percentage}%
              </Text>
              <View style={styles.progressTeaserRight}>
                <Text style={[styles.progressDesc, { color: colors.foreground }]}>{progressStats.text}</Text>
                <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>since last scan</Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: progressStats.badgeColor }]}>
                <Ionicons name={progressStats.icon} size={14} color={progressStats.color} />
                <Text style={[styles.trendText, { color: progressStats.color }]}>{progressStats.badgeText}</Text>
              </View>
            </View>
          </GlassCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingHorizontal: 20, marginBottom: 20,
  },
  greeting: { fontSize: 12, fontFamily: "Poppins_600SemiBold", marginBottom: 2, letterSpacing: 1, textTransform: "uppercase" },
  headerTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  premiumBadge: { borderRadius: 10, overflow: "hidden", marginTop: 4 },
  premiumBadgeInner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(0,212,255,0.25)", borderRadius: 10,
  },
  premiumText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.5 },
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
  scoreLabel: { fontSize: 11, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  scoreImprove: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  tipBubble: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,212,255,0.08)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    marginTop: 4,
  },
  tipText: { fontSize: 11, fontFamily: "Poppins_500Medium", flex: 1, lineHeight: 16 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.3, textTransform: "uppercase", opacity: 0.9 },
  sectionDivider: {
    flex: 1, height: 1,
    backgroundColor: "rgba(255,255,255,0.05)", marginLeft: 16,
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
  reminderText: { flex: 1, fontSize: 13, fontFamily: "Poppins_500Medium" },
  progressTeaser: { marginHorizontal: 20, marginBottom: 20 },
  progressTeaserRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  progressBig: { fontSize: 36, fontFamily: "Poppins_700Bold" },
  progressTeaserRight: { flex: 1 },
  progressDesc: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  progressSub: { fontSize: 12, fontFamily: "Poppins_400Regular", opacity: 0.7 },
  trendBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  trendText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
});


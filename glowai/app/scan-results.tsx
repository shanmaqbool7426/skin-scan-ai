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

export default function ScanResultsScreen() {
  const { latestScan } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!latestScan) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Ionicons name="scan-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No scan results yet</Text>
        <TouchableOpacity onPress={() => router.push("/scan")}>
          <Text style={[styles.scanLink, { color: colors.primary }]}>Run AI Scan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Scan Results</Text>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={[styles.headerSub, { color: colors.success }]}>Analysis Complete</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <GlassCard style={styles.scoreCard} glow>
        <View style={styles.scoreRow}>
          <GlowScoreRing score={latestScan.glowScore} size={110} />
          <View style={styles.scoreRight}>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Skin Health Score</Text>
            <Text style={[styles.scoreSub, { color: colors.mutedForeground }]}>{latestScan.date}</Text>
            <View style={styles.detectedRow}>
              <Text style={[styles.detectedNum, { color: colors.primary }]}>{latestScan.issues.length}</Text>
              <Text style={[styles.detectedLabel, { color: colors.mutedForeground }]}> Issues Found</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/heatmap")} activeOpacity={0.85}>
              <LinearGradient
                colors={["#00D4FF", "#00A8CC"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.analysisBtn}
              >
                <Text style={styles.analysisBtnText}>View Heatmap</Text>
                <Ionicons name="map-outline" size={13} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Issues Detected</Text>
      <View style={styles.issuesGrid}>
        {latestScan.issues.map((issue, i) => (
          <GlassCard key={i} style={styles.issueCard} padding={14}>
            <View style={[styles.issueDot, { backgroundColor: issue.color }]} />
            <Text style={[styles.issueType, { color: colors.foreground }]}>{issue.type}</Text>
            <View style={[styles.severityChip, { backgroundColor: `${issue.color}18`, borderColor: `${issue.color}30` }]}>
              <Text style={[styles.severityText, { color: issue.color }]}>{issue.severity}</Text>
            </View>
            <Text style={[styles.issueCount, { color: colors.primary }]}>{issue.count}</Text>
          </GlassCard>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Metrics</Text>
      <GlassCard style={styles.metricsCard}>
        <MetricBar label="Hydration" value={latestScan.hydration} color="#00D4FF" />
        <MetricBar label="Clarity" value={latestScan.clarity} color="#7B61FF" />
        <MetricBar label="Smoothness" value={latestScan.smoothness} color="#00FFA3" />
        <MetricBar label="Glow Index" value={latestScan.glow} color="#FFB800" />
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Profile</Text>
      <GlassCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Skin Type</Text>
          <Text style={[styles.profileValue, { color: colors.foreground }]}>{latestScan.skinType}</Text>
        </View>
      </GlassCard>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => router.push("/routine")}
          style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>View Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/scan")} style={styles.rescanBtn}>
          <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.rescanBtnInner}>
            <Ionicons name="scan-outline" size={18} color="#000" />
            <Text style={styles.rescanBtnText}>Re-Scan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  emptyText: { fontFamily: "Poppins_500Medium", fontSize: 16 },
  scanLink: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,212,255,0.08)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSub: { fontFamily: "Poppins_500Medium", fontSize: 11, letterSpacing: 0.5 },
  scoreCard: { marginHorizontal: 20, marginBottom: 24 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  scoreRight: { flex: 1, gap: 6 },
  scoreLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  scoreSub: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  detectedRow: { flexDirection: "row", alignItems: "baseline" },
  detectedNum: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  detectedLabel: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  analysisBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, marginTop: 4,
  },
  analysisBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#000" },
  sectionTitle: {
    fontSize: 15, fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20, marginBottom: 12, marginTop: 4, letterSpacing: 0.3,
  },
  issuesGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 14, gap: 10, marginBottom: 24,
  },
  issueCard: {
    width: "44%", marginHorizontal: "1%",
    borderRadius: 14, gap: 6, alignItems: "flex-start",
    borderLeftWidth: 3,
  },
  issueDot: { width: 8, height: 8, borderRadius: 4 },
  issueType: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  severityChip: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  severityText: { fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 0.5 },
  issueCount: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  metricsCard: { marginHorizontal: 20, marginBottom: 24 },
  profileCard: { marginHorizontal: 20, marginBottom: 20 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, flex: 1 },
  profileValue: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  actionBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  rescanBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  rescanBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
  },
  rescanBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#000" },
});

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
          <Text style={[styles.scanLink, { color: colors.primary }]}>Start a scan</Text>
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Scan Completed</Text>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.headerSub, { color: colors.success }]}>Here's your skin overview</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <GlassCard style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <GlowScoreRing score={latestScan.glowScore} size={110} />
          <View style={styles.scoreRight}>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Skin Health Score</Text>
            <Text style={[styles.scoreSub, { color: colors.mutedForeground }]}>{latestScan.date}</Text>
            <View style={styles.detectedRow}>
              <Text style={[styles.detectedNum, { color: colors.foreground }]}>{latestScan.issues.length}</Text>
              <Text style={[styles.detectedLabel, { color: colors.mutedForeground }]}>Issues Found</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/heatmap")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#7B61FF", "#A58BFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analysisBtn}
              >
                <Text style={styles.analysisBtnText}>View Full Analysis</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <View style={styles.tabRow}>
        {["Overview", "Heatmap", "Details", "Advice"].map((t, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => t === "Heatmap" && router.push("/heatmap")}
            style={[styles.tabItem, i === 0 && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: i === 0 ? colors.primary : colors.mutedForeground }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Issues Detected</Text>
      {latestScan.issues.map((issue, i) => (
        <GlassCard key={i} style={styles.issueCard} padding={14}>
          <View style={styles.issueRow}>
            <View style={[styles.issueDot, { backgroundColor: issue.color }]} />
            <Text style={[styles.issueType, { color: colors.foreground }]}>{issue.type}</Text>
            <View style={styles.issueCenter}>
              <View style={styles.issueBar}>
                <View style={[
                  styles.issueFill,
                  {
                    backgroundColor: issue.color,
                    width: issue.severity === "High" ? "75%"
                      : issue.severity === "Moderate" ? "50%"
                        : "25%",
                  },
                ]} />
              </View>
            </View>
            <View style={[
              styles.severityChip,
              {
                backgroundColor: issue.severity === "High" ? "#FEE2E2"
                  : issue.severity === "Moderate" ? "#FEF3C7"
                    : "#F0FDF4",
              },
            ]}>
              <Text style={[
                styles.severityText,
                {
                  color: issue.severity === "High" ? "#EF4444"
                    : issue.severity === "Moderate" ? "#F59E0B"
                      : "#22C55E",
                },
              ]}>
                {issue.severity}
              </Text>
            </View>
          </View>
        </GlassCard>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recommendations</Text>
      {[
        { icon: "water-outline" as const, text: "Increase daily water intake to 8 glasses", color: "#3B82F6" },
        { icon: "sunny-outline" as const, text: "Apply SPF 50+ every morning without fail", color: "#F59E0B" },
        { icon: "leaf-outline" as const, text: "Use a Vitamin C serum for dark spot treatment", color: "#22C55E" },
      ].map((rec, i) => (
        <GlassCard key={i} style={styles.recCard} padding={14}>
          <View style={styles.recRow}>
            <View style={[styles.recIcon, { backgroundColor: `${rec.color}15` }]}>
              <Ionicons name={rec.icon} size={20} color={rec.color} />
            </View>
            <Text style={[styles.recText, { color: colors.foreground }]}>{rec.text}</Text>
          </View>
        </GlassCard>
      ))}

      <TouchableOpacity
        onPress={() => router.push("/products")}
        activeOpacity={0.85}
        style={styles.shopBtnWrap}
      >
        <LinearGradient
          colors={["#7B61FF", "#A58BFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shopBtn}
        >
          <Ionicons name="bag-outline" size={18} color="white" />
          <Text style={styles.shopBtnText}>View Recommended Products</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Poppins_500Medium" },
  scanLink: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSub: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  scoreCard: { marginHorizontal: 20, marginBottom: 20 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreRight: { flex: 1 },
  scoreLabel: { fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 2 },
  scoreSub: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 8 },
  detectedRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 12 },
  detectedNum: { fontSize: 28, fontFamily: "Poppins_700Bold" },
  detectedLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  analysisBtn: {
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  analysisBtnText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "white" },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E9E9EF" },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  issueCard: { marginHorizontal: 20, marginBottom: 8 },
  issueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  issueDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  issueType: { fontSize: 14, fontFamily: "Poppins_500Medium", width: 90 },
  issueCenter: { flex: 1 },
  issueBar: { height: 4, backgroundColor: "#E9E9EF", borderRadius: 2, overflow: "hidden" },
  issueFill: { height: 4, borderRadius: 2 },
  severityChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  severityText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  recCard: { marginHorizontal: 20, marginBottom: 8 },
  recRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recText: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 18 },
  shopBtnWrap: { marginHorizontal: 20, marginTop: 12 },
  shopBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  shopBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "white" },
});

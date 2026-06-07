import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
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
import { getRecommendedProducts, ProductItem } from "@/data/productDB";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const CARD_W = width * 0.58;

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={11}
          color="#FFB800"
        />
      ))}
      <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function ProductCard({ item }: { item: ProductItem }) {
  return (
    <View style={[styles.productCard, { borderColor: item.accentColor + "30" }]}>
      <View style={[styles.productImgWrap, { backgroundColor: item.accentColor + "12" }]}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImg}
          resizeMode="cover"
        />
        {item.badge && (
          <View style={[styles.badgeChip, { backgroundColor: item.accentColor }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.productBody}>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <StarRating rating={item.rating} />

        <View style={[styles.ingredientTag, { backgroundColor: item.accentColor + "15", borderColor: item.accentColor + "35" }]}>
          <Ionicons name="flask-outline" size={11} color={item.accentColor} />
          <Text style={[styles.ingredientText, { color: item.accentColor }]}>
            {item.keyIngredient}
          </Text>
        </View>

        <Text style={styles.productBenefit} numberOfLines={2}>{item.benefit}</Text>

        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: item.accentColor }]}>{item.price}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.addBtn, { backgroundColor: item.accentColor }]}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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

  const products = getRecommendedProducts(latestScan.issues, latestScan.skinType);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
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

      {/* Score Card */}
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

      {/* Dermatologist Verdict */}
      {latestScan.clinicalSummary && (
        <GlassCard style={styles.verdictCard} glow>
          <View style={styles.verdictHeader}>
            <View style={styles.verdictIcon}>
              <Ionicons name="medical" size={14} color="#00D4FF" />
            </View>
            <Text style={[styles.verdictTitle, { color: colors.foreground }]}>Dermatologist Verdict</Text>
          </View>
          <Text style={[styles.verdictText, { color: colors.mutedForeground }]}>
            {latestScan.clinicalSummary}
          </Text>
        </GlassCard>
      )}

      {/* Issues Detected */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Issues Detected</Text>
      <View style={styles.issuesGrid}>
        {latestScan.issues.map((issue, i) => (
          <GlassCard key={i} style={[styles.issueCard, { borderLeftColor: issue.color }]} padding={14}>
            <View style={[styles.issueDot, { backgroundColor: issue.color }]} />
            <Text style={[styles.issueType, { color: colors.foreground }]}>{issue.type}</Text>
            <View style={[styles.severityChip, { backgroundColor: `${issue.color}18`, borderColor: `${issue.color}30` }]}>
              <Text style={[styles.severityText, { color: issue.color }]}>{issue.severity}</Text>
            </View>
            <Text style={[styles.issueCount, { color: colors.primary }]}>{issue.count}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Skin Metrics */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Metrics</Text>
      <GlassCard style={styles.metricsCard}>
        <MetricBar label="Hydration" value={latestScan.hydration} color="#00D4FF" />
        <MetricBar label="Clarity" value={latestScan.clarity} color="#7B61FF" />
        <MetricBar label="Smoothness" value={latestScan.smoothness} color="#00FFA3" />
        <MetricBar label="Glow Index" value={latestScan.glow} color="#FFB800" />
      </GlassCard>

      {/* AI Action Plan */}
      {latestScan.recommendations && latestScan.recommendations.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Clinical Action Plan</Text>
          <GlassCard style={styles.recCard}>
            {latestScan.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#00FFA3" />
                <Text style={[styles.recText, { color: colors.foreground }]}>{rec}</Text>
              </View>
            ))}
          </GlassCard>
        </>
      )}

      {/* ── Product Recommendations ── */}
      {products.length > 0 && (
        <>
          <View style={styles.prodHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 2 }]}>
                Recommended Products
              </Text>
              <Text style={[styles.prodSubtitle, { color: colors.mutedForeground }]}>
                AI-selected for your skin concerns
              </Text>
            </View>
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={11} color="#FFB800" />
              <Text style={styles.aiTagText}>AI Pick</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prodScroll}
          >
            {products.map((p) => (
              <ProductCard key={p.key} item={p} />
            ))}
          </ScrollView>

          {/* Targets legend */}
          <View style={styles.targetsWrap}>
            {products.map((p) => (
              <View key={p.key} style={[styles.targetChip, { borderColor: p.accentColor + "40", backgroundColor: p.accentColor + "10" }]}>
                <View style={[styles.targetDot, { backgroundColor: p.accentColor }]} />
                <Text style={[styles.targetChipText, { color: p.accentColor }]}>{p.targets}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Skin Profile */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Profile</Text>
      <GlassCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Skin Type</Text>
          <Text style={[styles.profileValue, { color: colors.foreground }]}>{latestScan.skinType}</Text>
        </View>
      </GlassCard>

      {/* Actions */}
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
  verdictCard: { marginHorizontal: 20, marginBottom: 24, borderColor: "rgba(0,212,255,0.2)", borderWidth: 1.5 },
  verdictHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  verdictIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(0,212,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  verdictTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, letterSpacing: 0.5 },
  verdictText: { fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 },
  issuesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 10, marginBottom: 24 },
  issueCard: { width: "44%", marginHorizontal: "1%", borderRadius: 14, gap: 6, alignItems: "flex-start", borderLeftWidth: 3 },
  issueDot: { width: 8, height: 8, borderRadius: 4 },
  issueType: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  severityChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  severityText: { fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 0.5 },
  issueCount: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  metricsCard: { marginHorizontal: 20, marginBottom: 24 },
  recCard: { marginHorizontal: 20, marginBottom: 24, gap: 12 },
  recRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  recText: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 13, lineHeight: 18 },
  // ── Products ──
  prodHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 4,
  },
  prodSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 12, paddingHorizontal: 20, marginBottom: 12 },
  aiTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,184,0,0.12)",
    borderWidth: 1, borderColor: "rgba(255,184,0,0.3)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4,
  },
  aiTagText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#FFB800" },
  prodScroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  productCard: {
    width: CARD_W,
    backgroundColor: "rgba(10,21,37,0.95)",
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 8,
  },
  productImgWrap: { width: "100%", height: 160, position: "relative" },
  productImg: { width: "100%", height: "100%" },
  badgeChip: {
    position: "absolute", top: 10, left: 10,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: "#000", letterSpacing: 0.5 },
  productBody: { padding: 14, gap: 6 },
  productBrand: { fontFamily: "Poppins_500Medium", fontSize: 10, color: "#5A7A9F", letterSpacing: 1.5, textTransform: "uppercase" },
  productName: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#E2EEFF", lineHeight: 18 },
  starRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingNum: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#FFB800", marginLeft: 4 },
  ingredientTag: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start",
  },
  ingredientText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  productBenefit: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#A2C3EC", lineHeight: 16 },
  productFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  productPrice: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#000" },
  targetsWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 8, marginTop: 8, marginBottom: 24 },
  targetChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  targetDot: { width: 6, height: 6, borderRadius: 3 },
  targetChipText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, letterSpacing: 0.3 },
  // ── Profile & Actions ──
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

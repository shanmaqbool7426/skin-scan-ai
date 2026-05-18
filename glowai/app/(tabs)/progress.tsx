import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGrad,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { GlassCard } from "@/components/GlassCard";
import { GlowScoreRing } from "@/components/GlowScoreRing";
import { MetricBar } from "@/components/MetricBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CHART_W = 300;
const CHART_H = 120;
const PADDING = 16;

const historyData = [
  { week: "W1", score: 68 },
  { week: "W2", score: 72 },
  { week: "W3", score: 70 },
  { week: "W4", score: 76 },
  { week: "W5", score: 74 },
  { week: "W6", score: 80 },
  { week: "W7", score: 83 },
];

function MiniLineChart({ data }: { data: { week: string; score: number }[] }) {
  const pts = data.map((d, i) => {
    const x = PADDING + (i * (CHART_W - PADDING * 2)) / (data.length - 1);
    const y = CHART_H - PADDING - ((d.score - 60) / 40) * (CHART_H - PADDING * 2);
    return { x, y, label: d.week, score: d.score };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${CHART_H} L ${pts[0].x} ${CHART_H} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H} style={{ alignSelf: "center" }}>
      <Defs>
        <SvgGrad id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
        </SvgGrad>
        <SvgGrad id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#7B61FF" />
          <Stop offset="100%" stopColor="#00D4FF" />
        </SvgGrad>
      </Defs>
      <Path d={areaD} fill="url(#areaGrad)" />
      <Path d={pathD} stroke="url(#lineGrad)" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
            fill={i === pts.length - 1 ? "#00D4FF" : "#0C1525"}
            stroke={i === pts.length - 1 ? "#00FFA3" : "#00D4FF"}
            strokeWidth={i === pts.length - 1 ? 2.5 : 1.5}
          />
          <SvgText x={p.x} y={CHART_H - 2} textAnchor="middle" fontSize={9}
            fill="#5A7A9F" fontFamily="Poppins_400Regular"
          >
            {p.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

const PERIOD_TABS = ["7D", "1M", "3M", "1Y"];

export default function ProgressScreen() {
  const { scans, latestScan } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState("1M");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60 + 16;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Skin Progress</Text>
        <View style={[styles.headerBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.headerBadgeText, { color: colors.primary }]}>30-Day Report</Text>
        </View>
      </View>

      {/* Period tabs */}
      <View style={[styles.periodWrap, { backgroundColor: colors.muted }]}>
        {PERIOD_TABS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setActivePeriod(p)}
            style={[styles.periodTab, activePeriod === p && styles.periodTabActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.periodText, { color: activePeriod === p ? "#00D4FF" : colors.mutedForeground }]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Score chart */}
      <GlassCard style={styles.chartCard} glow>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Glow Score Trend</Text>
            <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>7-week progression</Text>
          </View>
          <View style={[styles.trendChip, { backgroundColor: "rgba(0,232,122,0.12)" }]}>
            <Ionicons name="trending-up" size={13} color={colors.success} />
            <Text style={[styles.trendText, { color: colors.success }]}>+22%</Text>
          </View>
        </View>
        <MiniLineChart data={historyData} />
      </GlassCard>

      {/* Current score */}
      {latestScan && (
        <GlassCard style={styles.currentScore}>
          <View style={styles.currentScoreRow}>
            <GlowScoreRing score={latestScan.glowScore} size={110} />
            <View style={styles.currentRight}>
              <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>Current Score</Text>
              <Text style={[styles.currentDate, { color: colors.mutedForeground }]}>{latestScan.date}</Text>
              <View style={styles.deltaRow}>
                <Ionicons name="arrow-up" size={14} color={colors.success} />
                <Text style={[styles.deltaText, { color: colors.success }]}>+12 from last scan</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Metrics */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Metrics</Text>
      {latestScan ? (
        <GlassCard style={styles.metricsCard}>
          <MetricBar label="Hydration Index" value={latestScan.hydration} color="#00D4FF" />
          <MetricBar label="Clarity Score" value={latestScan.clarity} color="#7B61FF" />
          <MetricBar label="Smoothness" value={latestScan.smoothness} color="#00FFA3" />
          <MetricBar label="Glow Index" value={latestScan.glow} color="#FFB800" />
        </GlassCard>
      ) : (
        <GlassCard style={styles.metricsCard}>
          <Text style={[styles.noDataText, { color: colors.mutedForeground }]}>
            Run a scan to see your metrics
          </Text>
        </GlassCard>
      )}

      {/* Improvement areas */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Focus Areas</Text>
      <GlassCard style={styles.focusCard}>
        {[
          { label: "Hydration", delta: "+18%", color: "#00D4FF", icon: "water-outline" as const },
          { label: "Dark Spots", delta: "-24%", color: "#FFB800", icon: "sunny-outline" as const },
          { label: "Pore Size", delta: "-11%", color: "#7B61FF", icon: "resize-outline" as const },
          { label: "Redness", delta: "-32%", color: "#FF3B5C", icon: "flame-outline" as const },
        ].map((item) => (
          <View key={item.label} style={styles.focusRow}>
            <View style={[styles.focusIcon, { backgroundColor: `${item.color}18` }]}>
              <Ionicons name={item.icon} size={16} color={item.color} />
            </View>
            <Text style={[styles.focusLabel, { color: colors.foreground }]}>{item.label}</Text>
            <View style={[styles.deltaBadge, { backgroundColor: `${item.color}15`, borderColor: `${item.color}25` }]}>
              <Text style={[styles.deltaLabel, { color: item.color }]}>{item.delta}</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Scan history */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scan History</Text>
      <GlassCard style={styles.historyCard}>
        {scans.length === 0 ? (
          <Text style={[styles.noDataText, { color: colors.mutedForeground }]}>No scans yet</Text>
        ) : (
          scans.slice(0, 5).map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={styles.historyRow}
              onPress={() => router.push("/scan-results")}
            >
              <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
              <View style={styles.historyInfo}>
                <Text style={[styles.historyDate, { color: colors.foreground }]}>{scan.date}</Text>
                <Text style={[styles.historySkin, { color: colors.mutedForeground }]}>{scan.skinType}</Text>
              </View>
              <View style={[styles.historyScore, { backgroundColor: "rgba(0,212,255,0.1)" }]}>
                <Text style={[styles.historyScoreText, { color: colors.primary }]}>{scan.glowScore}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 16,
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, letterSpacing: 0.3 },
  headerBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  headerBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 0.5 },
  periodWrap: {
    flexDirection: "row", marginHorizontal: 20, marginBottom: 16,
    borderRadius: 12, padding: 3,
  },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  periodTabActive: { backgroundColor: "rgba(0,212,255,0.12)", borderWidth: 1, borderColor: "rgba(0,212,255,0.25)" },
  periodText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  chartCard: { marginHorizontal: 20, marginBottom: 16 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  chartTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  chartSub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 2 },
  trendChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  trendText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  currentScore: { marginHorizontal: 20, marginBottom: 24 },
  currentScoreRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  currentRight: { flex: 1, gap: 4 },
  currentLabel: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  currentDate: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  deltaText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  sectionTitle: {
    fontSize: 15, fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20, marginBottom: 12, marginTop: 4, letterSpacing: 0.3,
  },
  metricsCard: { marginHorizontal: 20, marginBottom: 24 },
  noDataText: { fontFamily: "Poppins_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 8 },
  focusCard: { marginHorizontal: 20, marginBottom: 24, gap: 14 },
  focusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  focusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  focusLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, flex: 1 },
  deltaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  deltaLabel: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  historyCard: { marginHorizontal: 20, marginBottom: 24, gap: 14 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyInfo: { flex: 1 },
  historyDate: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  historySkin: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 },
  historyScore: {
    width: 38, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  historyScoreText: { fontFamily: "Poppins_700Bold", fontSize: 13 },
});

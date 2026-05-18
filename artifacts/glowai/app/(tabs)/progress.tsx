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

function MiniLineChart({ data }: { data: { week: string; score: number }[] }) {
  const colors = useColors();
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
          <Stop offset="0%" stopColor="#7B61FF" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={areaD} fill="url(#areaGrad)" />
      <Path d={pathD} stroke="#7B61FF" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#7B61FF" strokeWidth={2} />
          <SvgText x={p.x} y={CHART_H - 2} textAnchor="middle" fontSize={10} fill="#6B6B6B" fontFamily="Poppins_400Regular">
            {p.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

const periods = ["Week", "Month", "Year"] as const;

export default function ProgressScreen() {
  const { latestScan, weeklyScores } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60 + 16;
  const [period, setPeriod] = useState<(typeof periods)[number]>("Week");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Progress</Text>
        <TouchableOpacity onPress={() => router.push("/heatmap")} style={[styles.heatmapBtn, { backgroundColor: colors.lavender }]}>
          <Ionicons name="map-outline" size={14} color={colors.primary} />
          <Text style={[styles.heatmapText, { color: colors.primary }]}>Heatmap</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodRow}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.periodBtn,
              period === p && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[
              styles.periodText,
              { color: period === p ? "white" : colors.mutedForeground },
            ]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <GlassCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>Improvement</Text>
            <Text style={[styles.chartBig, { color: colors.primary }]}>+38%</Text>
            <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>from last month</Text>
          </View>
        </View>
        <MiniLineChart data={weeklyScores} />
      </GlassCard>

      {latestScan && (
        <>
          <View style={styles.scoreRow}>
            <GlassCard style={[styles.scoreCard, { flex: 1 }]}>
              <GlowScoreRing score={latestScan.glowScore} size={100} />
              <Text style={[styles.cardLabel, { color: colors.mutedForeground, textAlign: "center", marginTop: 8 }]}>
                Glow Score
              </Text>
            </GlassCard>
            <GlassCard style={[styles.scoreCard, { flex: 1 }]}>
              <Text style={[styles.bigNumber, { color: colors.foreground }]}>{latestScan.issues.length}</Text>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Issues Found</Text>
              <TouchableOpacity onPress={() => router.push("/scan-results")}>
                <Text style={[styles.viewLink, { color: colors.primary }]}>View Details</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin Metrics</Text>
          <GlassCard style={styles.metricsCard}>
            <MetricBar label="Smoothness" value={latestScan.smoothness} color={colors.primary} />
            <MetricBar label="Hydration" value={latestScan.hydration} color={colors.info} />
            <MetricBar label="Clarity" value={latestScan.clarity} color={colors.success} />
            <MetricBar label="Glow" value={latestScan.glow} color={colors.accent} />
          </GlassCard>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Before / After</Text>
          <GlassCard style={styles.beforeAfter}>
            <View style={styles.baRow}>
              <View style={styles.baItem}>
                <View style={[styles.baImg, { backgroundColor: colors.border }]}>
                  <Ionicons name="person-outline" size={40} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.baLabel, { color: colors.mutedForeground }]}>Before</Text>
              </View>
              <View style={styles.baArrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </View>
              <View style={styles.baItem}>
                <View style={[styles.baImg, { backgroundColor: colors.lavender }]}>
                  <Ionicons name="sparkles-outline" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.baLabel, { color: colors.primary }]}>After</Text>
              </View>
            </View>
            <Text style={[styles.baCaption, { color: colors.success }]}>
              Your skin improved significantly this month!
            </Text>
          </GlassCard>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Issues Detected</Text>
          {latestScan.issues.map((issue, i) => (
            <GlassCard key={i} style={styles.issueCard} padding={14}>
              <View style={styles.issueRow}>
                <View style={[styles.issueDot, { backgroundColor: issue.color }]} />
                <Text style={[styles.issueType, { color: colors.foreground }]}>{issue.type}</Text>
                <View style={{ flex: 1 }} />
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
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontFamily: "Poppins_700Bold" },
  heatmapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  heatmapText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  periodRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(123,97,255,0.08)",
  },
  periodText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  chartCard: { marginHorizontal: 20, marginBottom: 16 },
  chartHeader: { marginBottom: 12 },
  chartLabel: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  chartBig: { fontSize: 28, fontFamily: "Poppins_700Bold" },
  chartSub: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  scoreRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 16 },
  scoreCard: { padding: 16, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  bigNumber: { fontSize: 36, fontFamily: "Poppins_700Bold" },
  viewLink: { fontSize: 12, fontFamily: "Poppins_500Medium", marginTop: 6 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  metricsCard: { marginHorizontal: 20, marginBottom: 20 },
  beforeAfter: { marginHorizontal: 20, marginBottom: 20 },
  baRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 12 },
  baItem: { alignItems: "center", gap: 8 },
  baImg: {
    width: 100,
    height: 100,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  baLabel: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  baArrow: { alignSelf: "center" },
  baCaption: { fontSize: 13, fontFamily: "Poppins_500Medium", textAlign: "center" },
  issueCard: { marginHorizontal: 20, marginBottom: 8 },
  issueRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  issueDot: { width: 10, height: 10, borderRadius: 5 },
  issueType: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  severityChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  severityText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
});

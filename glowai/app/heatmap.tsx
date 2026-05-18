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
  Ellipse,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

const LEGEND = [
  { color: "#FF6B6B", label: "Acne" },
  { color: "#F59E0B", label: "Dark Spots" },
  { color: "#FACC15", label: "Pores" },
  { color: "#3B82F6", label: "Dryness" },
  { color: "#22C55E", label: "Healthy" },
];

const TABS = ["Overview", "Heatmap", "Details", "Advice"] as const;

function FaceHeatmap() {
  return (
    <Svg width={220} height={260} viewBox="0 0 220 260">
      <Defs>
        <RadialGradient id="healthy" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="acne" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="dark" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="dry" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pores" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FACC15" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Face silhouette */}
      <Ellipse cx={110} cy={120} rx={70} ry={88} fill="#F5E6D8" stroke="#E0C8B0" strokeWidth={1.5} />
      {/* Chin */}
      <Path d="M 70 175 Q 110 210 150 175" fill="#F5E6D8" stroke="#E0C8B0" strokeWidth={1.5} />
      {/* Neck */}
      <Rect x={95} y={195} width={30} height={30} rx={4} fill="#F5E6D8" />

      {/* Heatmap zones */}
      <Circle cx={110} cy={100} r={50} fill="url(#healthy)" />
      {/* Forehead acne */}
      <Circle cx={100} cy={75} r={18} fill="url(#acne)" />
      <Circle cx={125} cy={72} r={12} fill="url(#acne)" />
      {/* Cheek dark spots */}
      <Circle cx={75} cy={125} r={20} fill="url(#dark)" />
      <Circle cx={148} cy={120} r={16} fill="url(#dark)" />
      {/* T-zone pores */}
      <Circle cx={110} cy={105} r={14} fill="url(#pores)" />
      {/* Chin dryness */}
      <Circle cx={110} cy={170} r={14} fill="url(#dry)" />
      {/* Cheeks redness */}
      <Circle cx={82} cy={145} r={12} fill="url(#acne)" />

      {/* Eyes */}
      <Ellipse cx={88} cy={108} rx={13} ry={8} fill="white" />
      <Ellipse cx={134} cy={108} rx={13} ry={8} fill="white" />
      <Circle cx={88} cy={108} r={5} fill="#6B4C3B" />
      <Circle cx={134} cy={108} r={5} fill="#6B4C3B" />

      {/* Nose */}
      <Path d="M 105 118 Q 103 138 96 142 Q 110 148 124 142 Q 117 138 115 118" fill="none" stroke="#D4A882" strokeWidth={1.5} />

      {/* Lips */}
      <Path d="M 94 162 Q 110 172 126 162" stroke="#D4827A" strokeWidth={2} fill="none" />
      <Path d="M 94 162 Q 110 158 126 162" stroke="#D4827A" strokeWidth={2} fill="none" />

      {/* Dot markers */}
      <Circle cx={100} cy={78} r={3} fill="#FF6B6B" opacity={0.9} />
      <Circle cx={124} cy={74} r={2.5} fill="#FF6B6B" opacity={0.9} />
      <Circle cx={76} cy={127} r={3} fill="#F59E0B" opacity={0.9} />
      <Circle cx={147} cy={122} r={2.5} fill="#F59E0B" opacity={0.9} />
      <Circle cx={110} cy={107} r={2.5} fill="#FACC15" opacity={0.9} />
    </Svg>
  );
}

const adviceItems = [
  { icon: "water-outline" as const, title: "Hydration", text: "Use hyaluronic acid serum morning and night to combat dryness on the chin area.", color: "#3B82F6" },
  { icon: "shield-checkmark-outline" as const, title: "Acne Treatment", text: "Apply salicylic acid 2% to the forehead twice daily. Avoid touching your face.", color: "#FF6B6B" },
  { icon: "sunny-outline" as const, title: "SPF Protection", text: "Dark spots worsen with sun exposure. Apply SPF 50 every morning, reapply every 2 hours.", color: "#F59E0B" },
  { icon: "leaf-outline" as const, title: "Vitamin C", text: "Use a 10-20% Vitamin C serum in the morning to brighten dark spots on your cheeks.", color: "#22C55E" },
];

export default function HeatmapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Heatmap");

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Issue Heatmap</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tabItem,
              activeTab === t && { borderBottomWidth: 2, borderBottomColor: colors.primary },
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === t ? colors.primary : colors.mutedForeground },
            ]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <GlassCard style={styles.mapCard}>
        <View style={styles.mapContainer}>
          <FaceHeatmap />
        </View>
        <View style={styles.legend}>
          {LEGEND.map((l, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{l.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          {[
            { label: "Score", value: "82", color: colors.primary },
            { label: "Issues", value: "6", color: colors.destructive },
            { label: "Severity", value: "Mild", color: colors.success },
          ].map((s, i) => (
            <View key={i} style={[styles.summaryItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Advice</Text>
      {adviceItems.map((item, i) => (
        <GlassCard key={i} style={styles.adviceCard} padding={14}>
          <View style={styles.adviceRow}>
            <View style={[styles.adviceIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.adviceContent}>
              <Text style={[styles.adviceTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.adviceText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9EF",
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  mapCard: { marginHorizontal: 20, marginBottom: 16, alignItems: "center" },
  mapContainer: { alignItems: "center", marginBottom: 16 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  summaryCard: { marginHorizontal: 20, marginBottom: 20, padding: 0, overflow: "hidden" },
  summaryRow: { flexDirection: "row" },
  summaryItem: { flex: 1, paddingVertical: 16, alignItems: "center" },
  summaryValue: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  adviceCard: { marginHorizontal: 20, marginBottom: 10 },
  adviceRow: { flexDirection: "row", gap: 12 },
  adviceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  adviceContent: { flex: 1 },
  adviceTitle: { fontSize: 14, fontFamily: "Poppins_600SemiBold", marginBottom: 4 },
  adviceText: { fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
});

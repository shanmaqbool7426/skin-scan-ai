import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { DEMO_ANALYSIS, type Ingredient, type IngredientAnalysisResponse, type SafetyLevel } from "@/services/ingredientApi";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

type FilterTab = "all" | "safe" | "caution" | "avoid";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "safe", label: "Safe" },
  { key: "caution", label: "Caution" },
  { key: "avoid", label: "Avoid" },
];

const SAFETY_CONFIG: Record<SafetyLevel, { color: string; bg: string; icon: string; label: string }> = {
  safe: { color: "#22C55E", bg: "#F0FDF4", icon: "checkmark-circle", label: "SAFE" },
  caution: { color: "#F59E0B", bg: "#FFFBEB", icon: "warning", label: "CAUTION" },
  avoid: { color: "#EF4444", bg: "#FFF5F5", icon: "close-circle", label: "AVOID" },
};

const RING_SIZE = 110;
const RING_STROKE = 10;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function ScoreRing({ score }: { score: number }) {
  const progress = score / 100;
  const strokeDash = RING_CIRCUMFERENCE * progress;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  const color = score >= 75 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          stroke="#E9E9EF"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${strokeDash} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={-offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={[styles.ringScore, { color }]}>{score}</Text>
        <Text style={styles.ringScoreSub}>/ 100</Text>
      </View>
    </View>
  );
}

function SafetyBadge({ level }: { level: SafetyLevel }) {
  const { color, bg, icon, label } = SAFETY_CONFIG[level];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function FunctionTag({ label }: { label: string }) {
  return (
    <View style={styles.funcTag}>
      <Text style={styles.funcTagText}>{label}</Text>
    </View>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.scoreBarBg}>
      <View style={[styles.scoreBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

function IngredientCard({ ingredient, index }: { ingredient: Ingredient; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { color, bg } = SAFETY_CONFIG[ingredient.safetyLevel];

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.88}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.colorDot, { backgroundColor: color }]} />
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardName} numberOfLines={1}>{ingredient.name}</Text>
              {ingredient.inci !== ingredient.name && (
                <Text style={styles.cardInci} numberOfLines={1}>{ingredient.inci}</Text>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <SafetyBadge level={ingredient.safetyLevel} />
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color="#6B6B6B"
            />
          </View>
        </View>

        <View style={styles.cardMeta}>
          <FunctionTag label={ingredient.function} />
          {ingredient.comedogenic > 0 && (
            <FunctionTag label={`Comedogenic ${ingredient.comedogenic}/5`} />
          )}
          {ingredient.irritancy !== "None" && (
            <FunctionTag label={`${ingredient.irritancy} irritancy`} />
          )}
        </View>

        <View style={styles.safetyBarRow}>
          <Text style={styles.safetyBarLabel}>Safety</Text>
          <ScoreBar value={ingredient.safetyScore} color={color} />
          <Text style={[styles.safetyBarValue, { color }]}>{ingredient.safetyScore}</Text>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            <Text style={styles.descText}>{ingredient.description}</Text>

            {ingredient.benefit && (
              <View style={styles.insightRow}>
                <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                <Text style={styles.insightText}>{ingredient.benefit}</Text>
              </View>
            )}
            {ingredient.concern && (
              <View style={styles.insightRow}>
                <Ionicons name="alert-circle" size={15} color="#F59E0B" />
                <Text style={styles.insightText}>{ingredient.concern}</Text>
              </View>
            )}

            {ingredient.skinTypes.length > 0 && (
              <View style={styles.skinTypesRow}>
                <Text style={styles.skinTypesLabel}>Best for: </Text>
                {ingredient.skinTypes.map((t) => (
                  <View key={t} style={styles.skinTypeChip}>
                    <Text style={styles.skinTypeText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function IngredientResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data?: string }>();

  const analysis: IngredientAnalysisResponse = useMemo(() => {
    if (params.data) {
      try {
        return JSON.parse(params.data);
      } catch {
        return DEMO_ANALYSIS;
      }
    }
    return DEMO_ANALYSIS;
  }, [params.data]);

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    if (activeFilter === "all") return analysis.ingredients;
    return analysis.ingredients.filter((i) => i.safetyLevel === activeFilter);
  }, [analysis.ingredients, activeFilter]);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const scoreColor =
    analysis.overallScore >= 75 ? "#22C55E" :
    analysis.overallScore >= 50 ? "#F59E0B" : "#EF4444";

  const scoreLabel =
    analysis.overallScore >= 75 ? "Clean Formula" :
    analysis.overallScore >= 50 ? "Use with Caution" : "Concern Detected";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#7B61FF", "#9B7DFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Ingredient Analysis</Text>
            {analysis.productName && (
              <Text style={styles.headerSub} numberOfLines={1}>{analysis.productName}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/ingredient-scanner")}
            style={styles.rescanBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Score summary */}
        <View style={styles.scoreSummary}>
          <View style={styles.ringArea}>
            <ScoreRing score={analysis.overallScore} />
            <View>
              <Text style={styles.scoreLabel}>{scoreLabel}</Text>
              <Text style={styles.totalIngredients}>{analysis.totalIngredients} ingredients scanned</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: "#22C55E" }]}>{analysis.safeCount}</Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: "#F59E0B" }]}>{analysis.cautionCount}</Text>
              <Text style={styles.statLabel}>Caution</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: "#EF4444" }]}>{analysis.avoidCount}</Text>
              <Text style={styles.statLabel}>Avoid</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Key insights */}
        {(analysis.topBenefits.length > 0 || analysis.topConcerns.length > 0) && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Key Insights</Text>

            {analysis.topBenefits.map((b, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: "#22C55E" }]} />
                <Text style={styles.insightText}>{b}</Text>
              </View>
            ))}
            {analysis.topConcerns.map((c, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.insightText}>{c}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Filter tabs */}
        <View style={styles.filterWrap}>
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? analysis.totalIngredients
                : tab.key === "safe"
                ? analysis.safeCount
                : tab.key === "caution"
                ? analysis.cautionCount
                : analysis.avoidCount;
            const active = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                style={[styles.filterTab, active && styles.filterTabActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.filterCount, { backgroundColor: active ? "rgba(255,255,255,0.25)" : "#EEE9FF" }]}>
                  <Text style={[styles.filterCountText, { color: active ? "#fff" : "#7B61FF" }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ingredient cards */}
        <View style={styles.cardsList}>
          {filtered.map((ingredient, i) => (
            <IngredientCard key={ingredient.inci + i} ingredient={ingredient} index={i} />
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={14} color="#6B6B6B" />
          <Text style={styles.disclaimerText}>
            Analysis is for educational reference only. Consult a dermatologist before changing your skincare routine.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rescanBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  scoreSummary: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  ringArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ringLabel: {
    position: "absolute",
    alignItems: "center",
  },
  ringScore: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    lineHeight: 30,
  },
  ringScoreSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  scoreLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
  },
  totalIngredients: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  statItem: { alignItems: "center" },
  statNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  scroll: { flex: 1 },
  insightsCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#7B61FF",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 10,
  },
  insightsTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#111",
    marginBottom: 4,
  },
  filterWrap: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E9E9EF",
  },
  filterTabActive: {
    backgroundColor: "#7B61FF",
    borderColor: "#7B61FF",
  },
  filterTabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#6B6B6B",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterCountText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
  },
  cardsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  cardTitleWrap: { flex: 1 },
  cardName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#111",
  },
  cardInci: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B6B6B",
    marginTop: 1,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 10,
  },
  funcTag: {
    backgroundColor: "#F0EFF8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  funcTagText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B6B6B",
  },
  safetyBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  safetyBarLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B6B6B",
    width: 40,
  },
  scoreBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#F0EFF8",
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  safetyBarValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    width: 28,
    textAlign: "right",
  },
  expandedContent: {
    gap: 8,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EFF8",
    marginVertical: 4,
  },
  descText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#444",
    lineHeight: 18,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  insightDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 5,
    flexShrink: 0,
  },
  insightText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
    flex: 1,
  },
  skinTypesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  skinTypesLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#6B6B6B",
  },
  skinTypeChip: {
    backgroundColor: "#EEE9FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skinTypeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#7B61FF",
  },
  disclaimer: {
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 12,
    backgroundColor: "#F0EFF8",
    borderRadius: 12,
    alignItems: "flex-start",
  },
  disclaimerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B6B6B",
    lineHeight: 16,
    flex: 1,
  },
});

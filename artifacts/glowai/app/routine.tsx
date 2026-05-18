import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

type TimeOfDay = "Morning" | "Night";

interface RoutineStep {
  step: number;
  product: string;
  brand: string;
  desc: string;
  icon: string;
  color: string;
}

const MORNING: RoutineStep[] = [
  { step: 1, product: "Cleanser", brand: "CeraVe Hydrating Cleanser", desc: "Gentle cleanse to start your day", icon: "water-outline", color: "#3B82F6" },
  { step: 2, product: "Vitamin C Serum", brand: "The Ordinary Vitamin C", desc: "Brightens and protects against free radicals", icon: "sunny-outline", color: "#F59E0B" },
  { step: 3, product: "Moisturizer", brand: "Neutrogena Hydro Boost", desc: "Locks in moisture for all day hydration", icon: "leaf-outline", color: "#22C55E" },
  { step: 4, product: "Sunscreen", brand: "La Roche-Posay SPF 50+", desc: "Essential daily UV protection", icon: "shield-checkmark-outline", color: "#7B61FF" },
];

const NIGHT: RoutineStep[] = [
  { step: 1, product: "Cleanser", brand: "CeraVe Foaming Cleanser", desc: "Deep cleanse to remove impurities", icon: "water-outline", color: "#3B82F6" },
  { step: 2, product: "Niacinamide", brand: "The Ordinary Niacinamide 10%", desc: "Reduces dark spots and pores", icon: "medical-outline", color: "#A58BFF" },
  { step: 3, product: "Retinol", brand: "RoC Retinol Correxion", desc: "Stimulates cell renewal overnight", icon: "moon-outline", color: "#6B6B6B" },
  { step: 4, product: "Night Cream", brand: "Olay Regenerist Night", desc: "Deep nourishment while you sleep", icon: "bed-outline", color: "#22C55E" },
];

export default function RoutineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("Morning");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const routine = timeOfDay === "Morning" ? MORNING : NIGHT;

  const toggleStep = (step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const progress = (completedSteps.size / routine.length) * 100;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Daily Routine</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.toggleRow}>
        {(["Morning", "Night"] as TimeOfDay[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => { setTimeOfDay(t); setCompletedSteps(new Set()); }}
            activeOpacity={0.85}
            style={{ flex: 1 }}
          >
            {timeOfDay === t ? (
              <LinearGradient
                colors={["#7B61FF", "#A58BFF"]}
                style={styles.toggleBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name={t === "Morning" ? "sunny-outline" : "moon-outline"} size={16} color="white" />
                <Text style={[styles.toggleText, { color: "white" }]}>{t}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.toggleBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                <Ionicons name={t === "Morning" ? "sunny-outline" : "moon-outline"} size={16} color={colors.mutedForeground} />
                <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>{t}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <GlassCard style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.foreground }]}>
            {completedSteps.size}/{routine.length} steps completed
          </Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{Math.round(progress)}%</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress}%` as unknown as number, backgroundColor: colors.primary }]} />
        </View>
      </GlassCard>

      {routine.map((step, i) => {
        const done = completedSteps.has(step.step);
        return (
          <TouchableOpacity key={i} onPress={() => toggleStep(step.step)} activeOpacity={0.8}>
            <GlassCard style={[styles.stepCard, done && { borderColor: colors.success, borderWidth: 1.5 }]} padding={14}>
              <View style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: done ? colors.success : colors.lavender }]}>
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Text style={[styles.stepNumText, { color: colors.primary }]}>{step.step}</Text>
                  )}
                </View>
                <View style={[styles.stepIcon, { backgroundColor: `${step.color}15` }]}>
                  <Ionicons name={step.icon as any} size={20} color={step.color} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepProduct, { color: done ? colors.mutedForeground : colors.foreground }]}>
                    {step.product}
                  </Text>
                  <Text style={[styles.stepBrand, { color: colors.primary }]}>{step.brand}</Text>
                  <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
                </View>
                <Ionicons
                  name={done ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={done ? colors.success : colors.border}
                />
              </View>
            </GlassCard>
          </TouchableOpacity>
        );
      })}

      <GlassCard style={styles.tipCard} padding={14}>
        <View style={styles.tipRow}>
          <Ionicons name="heart-outline" size={18} color={colors.destructive} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>
            Follow daily for best results
          </Text>
        </View>
      </GlassCard>
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
  headerTitle: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  toggleRow: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 16 },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 22,
  },
  toggleText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  progressCard: { marginHorizontal: 20, marginBottom: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  progressPct: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  stepCard: { marginHorizontal: 20, marginBottom: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontFamily: "Poppins_700Bold" },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepContent: { flex: 1 },
  stepProduct: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  stepBrand: { fontSize: 11, fontFamily: "Poppins_500Medium", marginTop: 2 },
  stepDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  tipCard: { marginHorizontal: 20, marginTop: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
});

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type TimeOfDay = "Morning" | "Night";

interface RoutineStep {
  _id?: string;
  id?: string;
  order: number;
  product: string;
  brand: string;
  description: string;
  icon: string;
  color: string;
}

interface RoutineDetails {
  id: string;
  timeOfDay: TimeOfDay;
  steps: RoutineStep[];
  completedSteps: string[];
  isAIGenerated?: boolean;
  lastUpdatedBy?: string;
}

interface DayAnalytics {
  date: string;
  day: string;
  completionPct: number;
  completedSteps: number;
  totalSteps: number;
}

interface Analytics {
  days: DayAnalytics[];
  avgCompletion: number;
}

// Rotating skincare tips based on skin concerns
const SKINCARE_TIPS = [
  { icon: "💧", tip: "Always apply skincare to slightly damp skin — it locks in 40% more hydration." },
  { icon: "☀️", tip: "SPF is non-negotiable, even on cloudy days. UV rays penetrate through clouds." },
  { icon: "🌙", tip: "Night is when your skin repairs itself. A rich moisturizer before sleep works wonders." },
  { icon: "🔄", tip: "Double cleansing removes sunscreen properly. Oil-based cleanser first, then foam." },
  { icon: "⏰", tip: "Consistency beats expensive products. A basic routine done daily outperforms a luxury routine done rarely." },
  { icon: "🧴", tip: "Layer from thinnest to thickest: toner → serum → moisturizer → oil → SPF." },
  { icon: "🌡️", tip: "Use lukewarm water, never hot — hot water strips your skin barrier." },
  { icon: "🫶", tip: "Pat, don't rub! Gentle patting motions absorb product without irritation." },
  { icon: "🧘", tip: "Stress spikes cortisol which triggers breakouts. Self-care counts as skincare too." },
  { icon: "💤", tip: "Aim for 7-8 hours of sleep. Growth hormone released at night repairs skin cells." },
];

export default function RoutineScreen() {
  const { apiFetch, user } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("Morning");
  const [morningRoutine, setMorningRoutine] = useState<RoutineDetails | null>(null);
  const [nightRoutine, setNightRoutine] = useState<RoutineDetails | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const [longPressedStep, setLongPressedStep] = useState<string | null>(null);

  // Celebration animation
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);

  // Daily tip (rotates based on day of year)
  const tipIndex = new Date().getDate() % SKINCARE_TIPS.length;
  const dailyTip = SKINCARE_TIPS[tipIndex];

  const fetchRoutines = useCallback(async () => {
    try {
      setLoading(true);
      const [data, streakData, analyticsData] = await Promise.all([
        apiFetch("/api/routines"),
        apiFetch("/api/routines/streak"),
        apiFetch("/api/routines/analytics?days=7"),
      ]);
      if (data.morning) setMorningRoutine(data.morning);
      if (data.night) setNightRoutine(data.night);
      if (streakData) setStreak(streakData);
      if (analyticsData) setAnalytics(analyticsData);
    } catch (err: any) {
      console.error("Fetch routines error:", err);
      Alert.alert("Error", err.message || "Failed to load routines.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const activeRoutine = timeOfDay === "Morning" ? morningRoutine : nightRoutine;
  const steps = activeRoutine?.steps || [];
  const completedSteps = activeRoutine?.completedSteps || [];
  const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  const triggerCelebration = () => {
    setShowCelebration(true);
    Animated.sequence([
      Animated.timing(celebrationAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(celebrationAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowCelebration(false));
  };

  const toggleStep = async (stepId: string) => {
    if (!activeRoutine) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isCompleted = completedSteps.includes(stepId);
    const updatedCompletions = isCompleted
      ? completedSteps.filter((id) => id !== stepId)
      : [...completedSteps, stepId];

    // Optimistic update
    const updated = (r: RoutineDetails) => ({ ...r, completedSteps: updatedCompletions });
    if (timeOfDay === "Morning" && morningRoutine) setMorningRoutine(updated(morningRoutine));
    else if (timeOfDay === "Night" && nightRoutine) setNightRoutine(updated(nightRoutine));

    // Check for 100% completion
    if (!isCompleted && updatedCompletions.length === steps.length) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerCelebration();
    }

    try {
      await apiFetch(`/api/routines/${activeRoutine.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ completedSteps: updatedCompletions }),
      });
      const [streakData, analyticsData] = await Promise.all([
        apiFetch("/api/routines/streak"),
        apiFetch("/api/routines/analytics?days=7"),
      ]);
      if (streakData) setStreak(streakData);
      if (analyticsData) setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to sync step:", err);
      fetchRoutines();
    }
  };

  const handleRegenerateAI = async () => {
    Alert.alert(
      "🤖 AI Routine Regeneration",
      "I'll analyze your latest skin scan and create a personalized routine just for you. This replaces your current steps.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          onPress: async () => {
            try {
              setRegenerating(true);
              await apiFetch("/api/routines/regenerate", { method: "POST" });
              await fetchRoutines();
              Alert.alert("✨ Done!", "Your routine has been personalized based on your latest skin scan results.");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to regenerate routine.");
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleAddStep = async () => {
    if (!activeRoutine || !newProduct.trim()) {
      Alert.alert("Required", "Please enter a product name.");
      return;
    }
    try {
      setAddingStep(true);
      const updated = await apiFetch(`/api/routines/${activeRoutine.id}/steps`, {
        method: "PUT",
        body: JSON.stringify({
          product: newProduct.trim(),
          brand: newBrand.trim(),
          description: newDesc.trim(),
          icon: "flask-outline",
          color: timeOfDay === "Morning" ? "#00D4FF" : "#7B61FF",
        }),
      });
      const updatedJson = updated;
      const updatedRoutine = {
        ...activeRoutine,
        steps: updatedJson.steps,
      };
      if (timeOfDay === "Morning") setMorningRoutine(updatedRoutine);
      else setNightRoutine(updatedRoutine);
      setShowAddModal(false);
      setNewProduct("");
      setNewBrand("");
      setNewDesc("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add step.");
    } finally {
      setAddingStep(false);
    }
  };

  const handleDeleteStep = (stepId: string, stepName: string) => {
    if (!activeRoutine) return;
    Alert.alert(
      "Remove Step",
      `Remove "${stepName}" from your routine?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = await apiFetch(`/api/routines/${activeRoutine.id}/steps/${stepId}`, {
                method: "DELETE",
              });
              const updatedRoutine = { ...activeRoutine, steps: updated.steps };
              if (timeOfDay === "Morning") setMorningRoutine(updatedRoutine);
              else setNightRoutine(updatedRoutine);
              setLongPressedStep(null);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete step.");
            }
          },
        },
      ]
    );
  };

  const maxBar = analytics ? Math.max(...analytics.days.map(d => d.completionPct), 1) : 100;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Routine</Text>
          <TouchableOpacity onPress={fetchRoutines} style={styles.backBtn}>
            <Ionicons name="refresh" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#00D4FF" />
            <Text style={[styles.loaderText, { color: colors.mutedForeground }]}>Loading your routines...</Text>
          </View>
        ) : (
          <>
            {/* Streak + AI Card */}
            <GlassCard style={styles.heroCard} padding={18} glow>
              <View style={styles.streakRow}>
                <View style={styles.streakLeft}>
                  <View style={styles.flameCircle}>
                    <Ionicons name="flame" size={28} color="#FF6A00" />
                  </View>
                  <View>
                    <Text style={[styles.streakTitle, { color: colors.foreground }]}>
                      {streak.currentStreak > 0 ? `${streak.currentStreak}-Day Streak! 🔥` : "Start your streak!"}
                    </Text>
                    <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
                      Best: {streak.longestStreak} days
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleRegenerateAI}
                  style={styles.aiBtnWrap}
                  disabled={regenerating}
                >
                  <LinearGradient
                    colors={["#9D4EDD", "#7B61FF"]}
                    style={styles.aiBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {regenerating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={14} color="white" />
                        <Text style={styles.aiBtnText}>AI Rebuild</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* 7-day analytics mini bar chart */}
              {analytics && (
                <View style={styles.chartWrap}>
                  <View style={styles.chartBars}>
                    {analytics.days.map((day) => (
                      <View key={day.date} style={styles.barCol}>
                        <Text style={[styles.barPct, { color: day.completionPct > 0 ? (timeOfDay === "Morning" ? "#00D4FF" : "#7B61FF") : "transparent" }]}>
                          {day.completionPct > 0 ? `${day.completionPct}%` : ""}
                        </Text>
                        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${(day.completionPct / maxBar) * 100}%` as any,
                                backgroundColor: day.completionPct >= 100
                                  ? "#00D4FF"
                                  : day.completionPct > 50
                                  ? "#7B61FF"
                                  : day.completionPct > 0
                                  ? "#9D4EDD"
                                  : "transparent",
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.barDay, { color: colors.mutedForeground }]}>{day.day}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>
                    7-day avg completion: <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold" }}>{analytics.avgCompletion}%</Text>
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Morning / Night Toggle */}
            <View style={styles.toggleRow}>
              {(["Morning", "Night"] as TimeOfDay[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => setTimeOfDay(t)} activeOpacity={0.85} style={{ flex: 1 }}>
                  {timeOfDay === t ? (
                    <LinearGradient
                      colors={t === "Morning" ? ["#00D4FF", "#00A8CC"] : ["#7B61FF", "#A58BFF"]}
                      style={styles.toggleBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name={t === "Morning" ? "sunny" : "moon"} size={16} color="black" />
                      <Text style={[styles.toggleText, { color: "black" }]}>{t} Routine</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.toggleBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                      <Ionicons name={t === "Morning" ? "sunny-outline" : "moon-outline"} size={16} color={colors.mutedForeground} />
                      <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>{t} Routine</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Progress bar */}
            <GlassCard style={styles.progressCard} padding={14}>
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                  {completedSteps.length}/{steps.length} completed
                </Text>
                <Text style={[styles.progressPct, { color: timeOfDay === "Morning" ? "#00D4FF" : "#7B61FF" }]}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%` as any,
                      backgroundColor: progress >= 100 ? "#22c55e" : timeOfDay === "Morning" ? "#00D4FF" : "#7B61FF",
                    },
                  ]}
                />
              </View>
              {progress >= 100 && (
                <Text style={styles.completedBadge}>✨ Routine Complete! Amazing job!</Text>
              )}
              {activeRoutine?.isAIGenerated && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={11} color="#9D4EDD" />
                  <Text style={styles.aiBadgeText}>AI-personalized routine</Text>
                </View>
              )}
            </GlassCard>

            {/* Steps List */}
            {steps.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="journal-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No steps yet. Add one below!</Text>
              </View>
            ) : (
              steps.map((step, i) => {
                const stepId = step._id || step.id || String(i);
                const isDone = completedSteps.includes(stepId);
                const isLongPressed = longPressedStep === stepId;

                return (
                  <TouchableOpacity
                    key={stepId}
                    onPress={() => {
                      if (isLongPressed) { setLongPressedStep(null); return; }
                      toggleStep(stepId);
                    }}
                    onLongPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setLongPressedStep(isLongPressed ? null : stepId);
                    }}
                    activeOpacity={0.8}
                  >
                    <GlassCard
                      style={[
                        styles.stepCard,
                        isDone && { borderColor: "#22c55e40", borderWidth: 1.5 },
                        isLongPressed && { borderColor: "#FF3B5C40", borderWidth: 1.5 },
                      ]}
                      padding={14}
                    >
                      <View style={styles.stepRow}>
                        <View style={[styles.stepNum, { backgroundColor: isDone ? "#22c55e" : colors.border }]}>
                          {isDone ? (
                            <Ionicons name="checkmark" size={14} color="white" />
                          ) : (
                            <Text style={[styles.stepNumText, { color: colors.mutedForeground }]}>{step.order}</Text>
                          )}
                        </View>
                        <View style={[styles.stepIcon, { backgroundColor: `${step.color}20` }]}>
                          <Ionicons name={step.icon as any} size={20} color={step.color} />
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={[styles.stepProduct, { color: isDone ? colors.mutedForeground : colors.foreground, textDecorationLine: isDone ? "line-through" : "none" }]}>
                            {step.product}
                          </Text>
                          {step.brand ? <Text style={[styles.stepBrand, { color: colors.primary }]}>{step.brand}</Text> : null}
                          {step.description ? <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.description}</Text> : null}
                        </View>
                        {isLongPressed ? (
                          <TouchableOpacity onPress={() => handleDeleteStep(stepId, step.product)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={18} color="#FF3B5C" />
                          </TouchableOpacity>
                        ) : (
                          <Ionicons
                            name={isDone ? "checkmark-circle" : "ellipse-outline"}
                            size={22}
                            color={isDone ? "#22c55e" : colors.border}
                          />
                        )}
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Daily Tip */}
            <GlassCard style={styles.tipCard} padding={16}>
              <Text style={[styles.tipTitle, { color: colors.foreground }]}>Daily Skincare Tip {dailyTip.icon}</Text>
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{dailyTip.tip}</Text>
            </GlassCard>
          </>
        )}
      </ScrollView>

      {/* FAB — Add Step */}
      {!loading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={timeOfDay === "Morning" ? ["#00D4FF", "#00A8CC"] : ["#7B61FF", "#A58BFF"]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="black" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.celebration,
            {
              opacity: celebrationAnim,
              transform: [{ scale: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            },
          ]}
        >
          <LinearGradient colors={["#9D4EDD88", "#00D4FF88"]} style={styles.celebrationGrad}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationText}>Routine Complete!</Text>
            <Text style={styles.celebrationSub}>Your skin will thank you ✨</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Add Step Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Custom Step</Text>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Product Name *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Vitamin C Serum"
              placeholderTextColor={colors.mutedForeground}
              value={newProduct}
              onChangeText={setNewProduct}
            />
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Brand</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. The Ordinary"
              placeholderTextColor={colors.mutedForeground}
              value={newBrand}
              onChangeText={setNewBrand}
            />
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>How to use</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border, height: 60 }]}
              placeholder="Brief application tip..."
              placeholderTextColor={colors.mutedForeground}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddStep} disabled={addingStep} style={{ flex: 1 }}>
                <LinearGradient
                  colors={timeOfDay === "Morning" ? ["#00D4FF", "#00A8CC"] : ["#7B61FF", "#A58BFF"]}
                  style={styles.modalSave}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {addingStep ? <ActivityIndicator size="small" color="black" /> : <Text style={styles.modalSaveText}>Add Step</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_700Bold" },

  loaderWrap: { padding: 60, alignItems: "center", gap: 12 },
  loaderText: { fontFamily: "Poppins_500Medium", fontSize: 14 },

  // Hero card
  heroCard: { marginHorizontal: 20, marginBottom: 16 },
  streakRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  flameCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(255, 106, 0, 0.12)",
    borderWidth: 1, borderColor: "rgba(255, 106, 0, 0.3)",
    alignItems: "center", justifyContent: "center",
  },
  streakTitle: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  streakSub: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 },
  aiBtnWrap: { borderRadius: 20, overflow: "hidden" },
  aiBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    minWidth: 100, justifyContent: "center",
  },
  aiBtnText: { color: "white", fontFamily: "Poppins_700Bold", fontSize: 12 },

  // Chart
  chartWrap: { marginTop: 4 },
  chartBars: { flexDirection: "row", gap: 6, alignItems: "flex-end", height: 70, marginBottom: 6 },
  barCol: { flex: 1, alignItems: "center", gap: 3, height: "100%" },
  barPct: { fontSize: 8, fontFamily: "Poppins_700Bold" },
  barTrack: { flex: 1, width: "100%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4, minHeight: 3 },
  barDay: { fontSize: 9, fontFamily: "Poppins_500Medium" },
  avgLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 4 },

  // Toggle
  toggleRow: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 16 },
  toggleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 44, borderRadius: 22,
  },
  toggleText: { fontSize: 13, fontFamily: "Poppins_700Bold" },

  // Progress
  progressCard: { marginHorizontal: 20, marginBottom: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  progressPct: { fontSize: 13, fontFamily: "Poppins_700Bold" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  completedBadge: {
    color: "#22c55e",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  aiBadgeText: { color: "#9D4EDD", fontFamily: "Poppins_500Medium", fontSize: 11 },

  // Steps
  stepCard: { marginHorizontal: 20, marginBottom: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stepNumText: { fontSize: 11, fontFamily: "Poppins_700Bold" },
  stepIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepContent: { flex: 1, gap: 1 },
  stepProduct: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  stepBrand: { fontSize: 11, fontFamily: "Poppins_500Medium" },
  stepDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255, 59, 92, 0.1)",
    alignItems: "center", justifyContent: "center",
  },

  // Tip
  tipCard: { marginHorizontal: 20, marginTop: 4 },
  tipTitle: { fontFamily: "Poppins_700Bold", fontSize: 13, marginBottom: 6 },
  tipText: { fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },

  // Empty
  emptyWrap: { padding: 40, alignItems: "center", gap: 10 },
  emptyText: { fontFamily: "Poppins_500Medium", fontSize: 13, textAlign: "center" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 24,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },

  // Celebration
  celebration: {
    position: "absolute",
    top: "35%",
    left: "10%",
    right: "10%",
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 999,
    shadowColor: "#9D4EDD",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  celebrationGrad: {
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  celebrationEmoji: { fontSize: 48 },
  celebrationText: { color: "white", fontSize: 22, fontFamily: "Poppins_700Bold" },
  celebrationSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Poppins_400Regular" },

  // Modal
  modalBg: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 12,
  },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 4 },
  modalLabel: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  modalInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: "Poppins_400Regular",
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1, height: 46, borderRadius: 23, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  modalSave: {
    height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  modalSaveText: { color: "black", fontFamily: "Poppins_700Bold", fontSize: 14 },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient as SvgLG, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

type MoodLevel = 1 | 2 | 3 | 4 | 5;
type SkinRating = 1 | 2 | 3 | 4 | 5;

interface DiaryEntry {
  id: string;
  date: string;
  mood: MoodLevel;
  skinRating: SkinRating;
  sleep: number;
  water: number;
  stress: number;
  diet: number;
  notes: string;
}

const MOOD_CONFIG: Record<MoodLevel, { label: string; color: string; icon: string }> = {
  1: { label: "Poor",    color: "#FF3B5C", icon: "remove-circle-outline" },
  2: { label: "Low",     color: "#FF7B50", icon: "sad-outline" },
  3: { label: "Okay",    color: "#FFB800", icon: "remove-outline" },
  4: { label: "Good",    color: "#00D4FF", icon: "happy-outline" },
  5: { label: "Optimal", color: "#00E87A", icon: "star-outline" },
};

const SKIN_CONFIG: Record<SkinRating, { label: string; color: string }> = {
  1: { label: "Flare-up",  color: "#FF3B5C" },
  2: { label: "Rough",     color: "#FF7B50" },
  3: { label: "Average",   color: "#FFB800" },
  4: { label: "Clear",     color: "#00D4FF" },
  5: { label: "Glowing",   color: "#00E87A" },
};

function StepSelector({
  value,
  max,
  onChange,
  colors: c,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  colors: any;
}) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange(i)}
          style={[
            styles.stepBtn,
            {
              backgroundColor: i <= value ? c.primary : c.muted,
              borderColor: i <= value ? c.primary : c.border,
            },
          ]}
          activeOpacity={0.8}
        />
      ))}
    </View>
  );
}

function FactorRow({
  icon,
  label,
  value,
  max,
  unit,
  onChange,
  color,
  colors: c,
}: {
  icon: any;
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
  color: string;
  colors: any;
}) {
  return (
    <View style={styles.factorRow}>
      <View style={[styles.factorIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.factorContent}>
        <View style={styles.factorLabelRow}>
          <Text style={[styles.factorLabel, { color: c.foreground }]}>{label}</Text>
          <Text style={[styles.factorValue, { color: color }]}>
            {value}{unit}
          </Text>
        </View>
        <View style={styles.factorBarRow}>
          {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(i)}
              style={[
                styles.factorBarSegment,
                {
                  backgroundColor: i <= value ? color : c.muted,
                  opacity: i <= value ? 1 : 0.4,
                },
              ]}
              activeOpacity={0.8}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const DUMMY_HISTORY: DiaryEntry[] = [
  { id: "d1", date: "May 17", mood: 4, skinRating: 4, sleep: 7, water: 6, stress: 2, diet: 4, notes: "Skin felt smooth after sheet mask." },
  { id: "d2", date: "May 16", mood: 3, skinRating: 3, sleep: 6, water: 4, stress: 4, diet: 3, notes: "A bit stressed, noticed some redness." },
  { id: "d3", date: "May 15", mood: 5, skinRating: 5, sleep: 8, water: 8, stress: 1, diet: 5, notes: "Best skin day this week! Glowing." },
  { id: "d4", date: "May 14", mood: 2, skinRating: 2, sleep: 5, water: 3, stress: 5, diet: 2, notes: "Breakout on chin — deadline stress." },
];

function HistoryCard({ entry }: { entry: DiaryEntry }) {
  const colors = useColors();
  const mood = MOOD_CONFIG[entry.mood];
  const skin = SKIN_CONFIG[entry.skinRating];

  return (
    <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.historyCardTop}>
        <Text style={[styles.historyDate, { color: colors.foreground }]}>{entry.date}</Text>
        <View style={[styles.moodChip, { backgroundColor: `${mood.color}15`, borderColor: `${mood.color}30` }]}>
          <Ionicons name={mood.icon as any} size={12} color={mood.color} />
          <Text style={[styles.moodChipText, { color: mood.color }]}>{mood.label}</Text>
        </View>
        <View style={[styles.skinChip, { backgroundColor: `${skin.color}15`, borderColor: `${skin.color}30` }]}>
          <Text style={[styles.skinChipText, { color: skin.color }]}>{skin.label}</Text>
        </View>
      </View>
      <View style={styles.historyMiniRow}>
        {[
          { icon: "moon-outline" as const, val: `${entry.sleep}h`, color: "#7B61FF" },
          { icon: "water-outline" as const, val: `${entry.water}gl`, color: "#00D4FF" },
          { icon: "pulse-outline" as const, val: `${entry.stress}/5`, color: "#FF3B5C" },
          { icon: "nutrition-outline" as const, val: `${entry.diet}/5`, color: "#00E87A" },
        ].map((m) => (
          <View key={m.icon} style={styles.historyMiniItem}>
            <Ionicons name={m.icon} size={12} color={m.color} />
            <Text style={[styles.historyMiniVal, { color: colors.mutedForeground }]}>{m.val}</Text>
          </View>
        ))}
      </View>
      {entry.notes ? (
        <Text style={[styles.historyNotes, { color: colors.mutedForeground }]} numberOfLines={1}>
          {entry.notes}
        </Text>
      ) : null}
    </View>
  );
}

export default function SkinDiaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [mood, setMood] = useState<MoodLevel>(3);
  const [skinRating, setSkinRating] = useState<SkinRating>(3);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(6);
  const [stress, setStress] = useState(2);
  const [diet, setDiet] = useState(3);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<DiaryEntry[]>(DUMMY_HISTORY);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 24;

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const moodCfg = MOOD_CONFIG[mood];
  const skinCfg = SKIN_CONFIG[skinRating];

  const handleSave = () => {
    const entry: DiaryEntry = {
      id: `entry_${Date.now()}`,
      date: "Today",
      mood,
      skinRating,
      sleep,
      water,
      stress,
      diet,
      notes,
    };
    setHistory([entry, ...history]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const streakDays = 7;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Skin Diary</Text>
          <Text style={[styles.headerDate, { color: colors.mutedForeground }]}>{today}</Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: "rgba(255,184,0,0.12)", borderColor: "rgba(255,184,0,0.25)" }]}>
          <Ionicons name="flame-outline" size={14} color="#FFB800" />
          <Text style={[styles.streakText, { color: "#FFB800" }]}>{streakDays}d streak</Text>
        </View>
      </View>

      {/* Today's card */}
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <LinearGradient
          colors={["#0A1525", "#0C1830"]}
          style={styles.todayCard}
        >
          <View style={styles.todayCardBorder}>
            {/* Mood selector */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="happy-outline" size={15} color={colors.mutedForeground} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How are you feeling?</Text>
                <View style={[styles.moodLabel, { backgroundColor: `${moodCfg.color}15`, borderColor: `${moodCfg.color}30` }]}>
                  <Text style={[styles.moodLabelText, { color: moodCfg.color }]}>{moodCfg.label}</Text>
                </View>
              </View>
              <View style={styles.moodRow}>
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
                  const cfg = MOOD_CONFIG[level];
                  const active = mood === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setMood(level)}
                      style={[
                        styles.moodBtn,
                        { borderColor: active ? cfg.color : colors.border, backgroundColor: active ? `${cfg.color}18` : colors.muted },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={cfg.icon as any} size={22} color={active ? cfg.color : colors.mutedForeground} />
                      <Text style={[styles.moodBtnLabel, { color: active ? cfg.color : colors.mutedForeground }]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Skin rating */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="scan-outline" size={15} color={colors.mutedForeground} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skin condition today</Text>
                <View style={[styles.skinLabel, { backgroundColor: `${skinCfg.color}15`, borderColor: `${skinCfg.color}30` }]}>
                  <Text style={[styles.skinLabelText, { color: skinCfg.color }]}>{skinCfg.label}</Text>
                </View>
              </View>
              <View style={styles.moodRow}>
                {([1, 2, 3, 4, 5] as SkinRating[]).map((level) => {
                  const cfg = SKIN_CONFIG[level];
                  const active = skinRating === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setSkinRating(level)}
                      style={[
                        styles.skinRatingBtn,
                        {
                          borderColor: active ? cfg.color : colors.border,
                          backgroundColor: active ? `${cfg.color}18` : colors.muted,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.skinRatingNum, { color: active ? cfg.color : colors.mutedForeground }]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Environmental factors */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Factors</Text>
              <View style={styles.factorsGrid}>
                <FactorRow icon="moon-outline" label="Sleep" value={sleep} max={10} unit="h" onChange={setSleep} color="#7B61FF" colors={colors} />
                <FactorRow icon="water-outline" label="Water" value={water} max={10} unit=" glasses" onChange={setWater} color="#00D4FF" colors={colors} />
                <FactorRow icon="pulse-outline" label="Stress" value={stress} max={5} unit="/5" onChange={setStress} color="#FF3B5C" colors={colors} />
                <FactorRow icon="nutrition-outline" label="Diet quality" value={diet} max={5} unit="/5" onChange={setDiet} color="#00E87A" colors={colors} />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Notes */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="create-outline" size={15} color={colors.mutedForeground} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
              </View>
              <TextInput
                style={[styles.notesInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                placeholder="New product, reaction, observation..."
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveBtnWrap}>
              <LinearGradient
                colors={saved ? ["#00E87A", "#00B85C"] : ["#00D4FF", "#00A8CC"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                <Ionicons name={saved ? "checkmark" : "save-outline"} size={18} color="#000" />
                <Text style={styles.saveBtnText}>{saved ? "Entry Saved!" : "Save Today's Log"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Past entries */}
      <View style={styles.historyHeader}>
        <Text style={[styles.historyTitle, { color: colors.foreground }]}>Recent Entries</Text>
        <View style={[styles.historyCount, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.historyCountText, { color: colors.primary }]}>{history.length}</Text>
        </View>
      </View>

      <View style={styles.historyList}>
        {history.map((entry, i) => (
          <Animated.View key={entry.id} entering={FadeInDown.delay(i * 60).springify()}>
            <HistoryCard entry={entry} />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, letterSpacing: 0.3 },
  headerDate: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 1 },
  streakBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  streakText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  todayCard: {
    marginHorizontal: 16, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(0,212,255,0.18)",
    marginBottom: 24, overflow: "hidden",
  },
  todayCardBorder: { padding: 18, gap: 0 },
  section: { paddingVertical: 14, gap: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, flex: 1 },
  moodLabel: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  moodLabelText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  skinLabel: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  skinLabelText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, alignItems: "center", gap: 4,
  },
  moodBtnLabel: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  skinRatingBtn: {
    flex: 1, height: 44, borderRadius: 12,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  skinRatingNum: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  divider: { height: 1, opacity: 0.6 },
  factorsGrid: { gap: 14 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  factorIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  factorContent: { flex: 1, gap: 7 },
  factorLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  factorLabel: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  factorValue: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  factorBarRow: { flexDirection: "row", gap: 4 },
  factorBarSegment: { flex: 1, height: 5, borderRadius: 3 },
  stepRow: { flexDirection: "row", gap: 8 },
  stepBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5 },
  notesInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontFamily: "Poppins_400Regular", fontSize: 13,
    minHeight: 80, textAlignVertical: "top",
  },
  saveBtnWrap: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15,
  },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#000" },
  historyHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, marginBottom: 12,
  },
  historyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
  historyCount: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  historyCountText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  historyList: { paddingHorizontal: 16, gap: 10 },
  historyCard: {
    borderRadius: 14, padding: 14, gap: 8, borderWidth: 1,
  },
  historyCardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyDate: { fontFamily: "Poppins_700Bold", fontSize: 14, flex: 1 },
  moodChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
  },
  moodChipText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  skinChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
  },
  skinChipText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  historyMiniRow: { flexDirection: "row", gap: 14 },
  historyMiniItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyMiniVal: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  historyNotes: { fontFamily: "Poppins_400Regular", fontSize: 12, fontStyle: "italic" },
});

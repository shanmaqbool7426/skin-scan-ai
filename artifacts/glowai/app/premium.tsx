import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "scan-outline" as const, text: "Unlimited Skin Scans" },
  { icon: "analytics-outline" as const, text: "Deep AI Skin Analysis" },
  { icon: "calendar-outline" as const, text: "Personalized Routine" },
  { icon: "bag-outline" as const, text: "Product Recommendations" },
  { icon: "bar-chart-outline" as const, text: "Progress Tracking" },
  { icon: "medical-outline" as const, text: "Priority AI Doctor Access" },
  { icon: "barcode-outline" as const, text: "Ingredient Checker" },
  { icon: "ban-outline" as const, text: "Ad-free Experience" },
];

type Plan = "monthly" | "annual";

export default function PremiumScreen() {
  const { user, updateUser } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [plan, setPlan] = useState<Plan>("annual");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setTimeout(async () => {
      await updateUser({ isPremium: true });
      setLoading(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }, 1500);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#0A0A12" }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bgGlow}>
        <Svg width={400} height={400}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={200} cy={200} r={200} fill="url(#glow)" />
        </Svg>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroArea}>
        <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.crownCircle}>
          <Ionicons name="crown-outline" size={32} color="#000" />
        </LinearGradient>
        <Text style={styles.heroTitle}>GlowAI Premium</Text>
        <Text style={styles.heroSub}>Unlock your best skin</Text>
      </View>

      <View style={styles.featuresGrid}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <View style={styles.featureCheck}>
              <Ionicons name="checkmark" size={12} color="#00D4FF" />
            </View>
            <Ionicons name={f.icon} size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plansRow}>
        {([
          { key: "monthly" as Plan, label: "Monthly", price: "$4.99", period: "/month", save: null },
          { key: "annual" as Plan, label: "Annual", price: "$29.99", period: "/year", save: "Save 50%" },
        ]).map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPlan(p.key)}
            activeOpacity={0.85}
            style={[
              styles.planCard,
              plan === p.key && styles.planCardActive,
            ]}
          >
            {p.save && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{p.save}</Text>
              </View>
            )}
            <Text style={[styles.planLabel, plan === p.key && { color: "#00D4FF" }]}>{p.label}</Text>
            <Text style={[styles.planPrice, plan === p.key && { color: "#E2EEFF" }]}>{p.price}</Text>
            <Text style={[styles.planPeriod, plan === p.key && { color: "#00D4FF" }]}>{p.period}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleSubscribe}
        activeOpacity={0.85}
        disabled={loading || user.isPremium}
        style={styles.ctaWrap}
      >
        <LinearGradient
          colors={["#00D4FF", "#00A8CC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ctaBtn, (loading || user.isPremium) && { opacity: 0.7 }]}
        >
          <Text style={styles.ctaBtnText}>
            {user.isPremium ? "Already Premium" : loading ? "Processing..." : "Continue"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.cancelText}>Cancel anytime • No hidden fees</Text>

      <View style={styles.termsRow}>
        {["Terms of Service", "Privacy Policy", "Restore"].map((t, i) => (
          <TouchableOpacity key={i}>
            <Text style={styles.termsText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: { position: "absolute", top: -50, left: -50, opacity: 0.8 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroArea: { alignItems: "center", marginBottom: 32, paddingHorizontal: 20 },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "white",
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  featuresGrid: {
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 10,
  },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EEE9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.85)" },
  plansRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  planCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
    overflow: "visible",
  },
  planCardActive: {
    backgroundColor: "white",
    borderColor: "#7B61FF",
    borderWidth: 2,
  },
  saveBadge: {
    position: "absolute",
    top: -12,
    backgroundColor: "#7B61FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveBadgeText: { fontSize: 10, fontFamily: "Poppins_700Bold", color: "white" },
  planLabel: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  planPrice: { fontSize: 22, fontFamily: "Poppins_700Bold", color: "white", marginBottom: 2 },
  planPeriod: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.5)" },
  ctaWrap: { marginHorizontal: 20, marginBottom: 14 },
  ctaBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaBtnText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "white" },
  cancelText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 20,
  },
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  termsText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.3)",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanOverlay } from "@/components/ScanOverlay";
import { useApp, type ScanResult } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

function generateScanResult(): ScanResult {
  const score = Math.floor(Math.random() * 20) + 70;
  return {
    id: `scan_${Date.now()}`,
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    glowScore: score,
    issues: [
      { type: "Acne", severity: "Mild", count: Math.floor(Math.random() * 5) + 1, color: "#FF6B6B" },
      { type: "Dark Spots", severity: "Moderate", count: Math.floor(Math.random() * 6) + 2, color: "#F59E0B" },
      { type: "Pores", severity: "High", count: Math.floor(Math.random() * 10) + 5, color: "#6B6B6B" },
      { type: "Redness", severity: "Mild", count: Math.floor(Math.random() * 3) + 1, color: "#EF4444" },
      { type: "Dryness", severity: "Mild", count: Math.floor(Math.random() * 2) + 1, color: "#3B82F6" },
    ],
    skinType: "Combination",
    hydration: Math.floor(Math.random() * 20) + 70,
    clarity: Math.floor(Math.random() * 20) + 65,
    smoothness: Math.floor(Math.random() * 20) + 72,
    glow: score,
  };
}

export default function ScanScreen() {
  const { addScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState(false);
  const [stage, setStage] = useState<"idle" | "scanning" | "done">("idle");
  const cameraRef = useRef<CameraView>(null);
  const pulseOpacity = useSharedValue(1);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleScan = async () => {
    if (stage !== "idle") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);
    setStage("scanning");
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
      6
    );
    setTimeout(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanning(false);
      setStage("done");
      const result = generateScanResult();
      addScanResult(result);
      setTimeout(() => {
        router.replace("/scan-results");
      }, 600);
    }, 3200);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const topPadding = topPad + 8;

  if (Platform.OS !== "web" && permission && !permission.granted) {
    return (
      <View style={[styles.permContainer, { paddingTop: topPadding }]}>
        <Ionicons name="camera-outline" size={64} color="#7B61FF" />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>We need camera access to analyze your skin</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.permBtnInner}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTextBtn}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS !== "web" ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          flash={flash ? "on" : "off"}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webCameraFallback]}>
          <Ionicons name="person-outline" size={120} color="rgba(255,255,255,0.3)" />
          <Text style={styles.webFallbackText}>Camera preview (web only)</Text>
        </View>
      )}

      <ScanOverlay width={width} height={height} scanning={scanning} />

      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Animated.View style={[pulseStyle]}>
          <Text style={styles.topLabel}>
            {stage === "idle"
              ? "Position your face in the frame"
              : stage === "scanning"
                ? "Analyzing your skin..."
                : "Scan Complete!"}
          </Text>
        </Animated.View>
        <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
          <Ionicons name={flash ? "flash" : "flash-off"} size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomArea, { paddingBottom: bottomPad + 24 }]}>
        {stage === "idle" && (
          <Text style={styles.hint}>
            Make sure your face is{"\n"}clear and well-lit
          </Text>
        )}
        {stage === "scanning" && (
          <Text style={styles.hint}>Hold still while we analyze{"\n"}your skin condition</Text>
        )}

        <TouchableOpacity
          onPress={handleScan}
          disabled={stage !== "idle"}
          activeOpacity={0.85}
          style={styles.scanBtnWrap}
        >
          <LinearGradient
            colors={stage === "done" ? ["#22C55E", "#16A34A"] : ["#7B61FF", "#A58BFF"]}
            style={[styles.scanBtn, stage === "scanning" && { opacity: 0.7 }]}
          >
            <Ionicons
              name={stage === "done" ? "checkmark" : "scan-outline"}
              size={32}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webCameraFallback: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  webFallbackText: { color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 12, fontFamily: "Poppins_400Regular" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  topLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  scanBtnWrap: {
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  scanBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  permContainer: {
    flex: 1,
    backgroundColor: "#F8F8FC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  permTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: "#111", textAlign: "center" },
  permSub: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#6B6B6B", textAlign: "center" },
  permBtn: { width: "100%", borderRadius: 28, overflow: "hidden", marginTop: 8 },
  permBtnInner: { height: 52, alignItems: "center", justifyContent: "center", borderRadius: 28 },
  permBtnText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "white" },
  backTextBtn: { marginTop: 4 },
  backText: { fontSize: 14, fontFamily: "Poppins_500Medium", color: "#6B6B6B" },
});

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient as SvgLG,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type ScanResult } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");
const OVAL_W = width * 0.56;
const OVAL_H = OVAL_W * 1.32;
const OVAL_X = (width - OVAL_W) / 2;
const OVAL_Y = height * 0.18;

type Stage = "idle" | "detecting" | "scanning" | "analyzing" | "complete";

const STAGES: { key: Stage; label: string; sub: string; pct: number }[] = [
  { key: "idle",      label: "READY",            sub: "Position face in frame",          pct: 0 },
  { key: "detecting", label: "DETECTING",         sub: "Face structure mapping...",       pct: 18 },
  { key: "scanning",  label: "SURFACE SCAN",      sub: "Epidermal layer analysis...",     pct: 45 },
  { key: "analyzing", label: "DEEP ANALYSIS",     sub: "Neural pattern recognition...",   pct: 78 },
  { key: "complete",  label: "COMPLETE",          sub: "Report ready",                    pct: 100 },
];

function randomVal(min: number, max: number) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function generateScanResult(): ScanResult {
  const score = Math.floor(Math.random() * 20) + 72;
  return {
    id: `scan_${Date.now()}`,
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    glowScore: score,
    issues: [
      { type: "Acne", severity: "Mild", count: Math.floor(Math.random() * 5) + 1, color: "#FF3B5C" },
      { type: "Dark Spots", severity: "Moderate", count: Math.floor(Math.random() * 6) + 2, color: "#FFB800" },
      { type: "Pores", severity: "High", count: Math.floor(Math.random() * 10) + 5, color: "#5A7A9F" },
      { type: "Redness", severity: "Mild", count: Math.floor(Math.random() * 3) + 1, color: "#FF3B5C" },
    ],
    skinType: "Combination",
    hydration: Math.floor(Math.random() * 20) + 70,
    clarity: Math.floor(Math.random() * 20) + 65,
    smoothness: Math.floor(Math.random() * 20) + 72,
    glow: score,
  };
}

function DataPanel({
  side,
  scanning,
}: {
  side: "left" | "right";
  scanning: boolean;
}) {
  const [vals, setVals] = useState({ a: "—", b: "—", c: "—" });
  useEffect(() => {
    if (!scanning) { setVals({ a: "—", b: "—", c: "—" }); return; }
    const iv = setInterval(() => {
      setVals({
        a: randomVal(60, 98) + "%",
        b: randomVal(0.1, 0.9),
        c: randomVal(40, 99) + "%",
      });
    }, 280);
    return () => clearInterval(iv);
  }, [scanning]);

  const labels =
    side === "left"
      ? [["HYD", vals.a], ["CLAR", vals.b], ["TONE", vals.c]]
      : [["SEBM", vals.a], ["ELST", vals.b], ["COLL", vals.c]];

  return (
    <View style={[styles.dataPanel, side === "left" ? styles.dataPanelLeft : styles.dataPanelRight]}>
      {labels.map(([k, v]) => (
        <View key={k} style={styles.dataRow}>
          <Text style={styles.dataKey}>{k}</Text>
          <Text style={[styles.dataVal, { color: scanning ? "#00D4FF" : "#3A506B" }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ScanScreen() {
  const { addScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>("idle");
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const sweepY = useSharedValue(-OVAL_H / 2);
  const ring1Rot = useSharedValue(0);
  const ring2Rot = useSharedValue(0);
  const ovalPulse = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const btnScale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);

  const stageData = STAGES.find((s) => s.key === stage)!;

  useEffect(() => {
    ring1Rot.value = withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1);
    ring2Rot.value = withRepeat(withTiming(-360, { duration: 11000, easing: Easing.linear }), -1);
    dotOpacity.value = withRepeat(withSequence(withTiming(0.2, { duration: 600 }), withTiming(1, { duration: 600 })), -1);
  }, []);

  useEffect(() => {
    progressWidth.value = withTiming(stageData.pct, { duration: 500 });
    if (stage === "scanning" || stage === "analyzing") {
      sweepY.value = withRepeat(
        withTiming(OVAL_H, { duration: stage === "scanning" ? 1200 : 800, easing: Easing.inOut(Easing.sin) }),
        -1, true
      );
      ovalPulse.value = withRepeat(
        withSequence(withTiming(1.03, { duration: 600 }), withTiming(0.97, { duration: 600 })),
        -1, true
      );
    } else {
      cancelAnimation(sweepY);
      sweepY.value = withTiming(-OVAL_H / 2, { duration: 300 });
      ovalPulse.value = withTiming(1, { duration: 300 });
    }
  }, [stage]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweepY.value }],
  }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring1Rot.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring2Rot.value}deg` }] }));
  const ovalStyle = useAnimatedStyle(() => ({ transform: [{ scale: ovalPulse.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` as any }));

  const handleScan = async () => {
    if (stage !== "idle") return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(withTiming(0.88, { duration: 80 }), withTiming(1, { duration: 80 }));

    const steps: Stage[] = ["detecting", "scanning", "analyzing", "complete"];
    const delays = [0, 800, 1900, 3100];
    steps.forEach((s, i) => setTimeout(() => setStage(s), delays[i]));

    setTimeout(async () => {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = generateScanResult();
      addScanResult(result);
      setTimeout(() => router.replace("/scan-results"), 700);
    }, 3200);
  };

  const topPad = (Platform.OS === "web" ? 67 : insets.top) + 8;

  if (Platform.OS !== "web" && permission && !permission.granted) {
    return (
      <View style={styles.permRoot}>
        <View style={styles.permInner}>
          <View style={styles.permIcon}>
            <Ionicons name="camera-outline" size={36} color="#00D4FF" />
          </View>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>Needed for AI skin analysis and face scanning</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
            <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.permBtnInner}>
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backTextBtn}>
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Camera / web fallback */}
      {Platform.OS !== "web" ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" flash={flash ? "on" : "off"} />
      ) : (
        <LinearGradient colors={["#06090F", "#0A1525", "#06090F"]} style={StyleSheet.absoluteFill} />
      )}

      {/* Dark vignette */}
      <LinearGradient
        colors={["rgba(6,9,15,0.9)", "rgba(6,9,15,0.3)", "rgba(6,9,15,0.3)", "rgba(6,9,15,0.92)"]}
        locations={[0, 0.2, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle grid */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        {Array.from({ length: 12 }).map((_, i) => {
          const x = (i / 12) * width;
          const y = (i / 12) * height;
          return (
            <React.Fragment key={i}>
              <Line x1={x} y1={0} x2={x} y2={height} stroke="rgba(0,212,255,0.04)" strokeWidth={1} />
              <Line x1={0} y1={y} x2={width} y2={y} stroke="rgba(0,212,255,0.04)" strokeWidth={1} />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Animated.View style={[styles.statusDot, { backgroundColor: stage === "idle" ? "#3A506B" : "#00D4FF" }, useAnimatedStyle(() => ({
            opacity: stage !== "idle" && stage !== "complete" ? dotOpacity.value : 1,
          }))]}>
          </Animated.View>
          <Text style={styles.topLabel}>AI DERMA SCAN</Text>
        </View>
        <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
          <Ionicons name={flash ? "flash" : "flash-off"} size={20} color={flash ? "#00D4FF" : "rgba(255,255,255,0.5)"} />
        </TouchableOpacity>
      </View>

      {/* Stage indicator strip */}
      <View style={styles.stageBand}>
        <View style={styles.stageLabelRow}>
          <Text style={[styles.stageKey, { color: stage === "idle" ? "#3A506B" : "#00D4FF" }]}>
            {stageData.label}
          </Text>
          <Text style={styles.stageSub}>{stageData.sub}</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
          <View style={[styles.progressDot, { left: `${stageData.pct}%` as any }]} />
        </View>
      </View>

      {/* Rotating outer rings */}
      <Animated.View style={[styles.ringsWrap, ring1Style]}>
        <Svg width={OVAL_W + 80} height={OVAL_H + 80}>
          <Defs>
            <SvgLG id="rg1" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#00D4FF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </SvgLG>
          </Defs>
          <Ellipse
            cx={(OVAL_W + 80) / 2} cy={(OVAL_H + 80) / 2}
            rx={(OVAL_W + 60) / 2} ry={(OVAL_H + 60) / 2}
            fill="none" stroke="url(#rg1)" strokeWidth={1.5} strokeDasharray="18 10"
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.ringsWrap, ring2Style]}>
        <Svg width={OVAL_W + 40} height={OVAL_H + 40}>
          <Ellipse
            cx={(OVAL_W + 40) / 2} cy={(OVAL_H + 40) / 2}
            rx={(OVAL_W + 20) / 2} ry={(OVAL_H + 20) / 2}
            fill="none" stroke="rgba(123,97,255,0.35)" strokeWidth={1} strokeDasharray="8 14"
          />
        </Svg>
      </Animated.View>

      {/* Face oval + sweep */}
      <Animated.View style={[styles.ovalClip, ovalStyle]}>
        <Svg width={OVAL_W} height={OVAL_H}>
          <Defs>
            <SvgLG id="ovalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00D4FF" stopOpacity={stage !== "idle" ? "0.9" : "0.4"} />
              <Stop offset="100%" stopColor="#00FFA3" stopOpacity={stage !== "idle" ? "0.7" : "0.2"} />
            </SvgLG>
          </Defs>
          <Ellipse
            cx={OVAL_W / 2} cy={OVAL_H / 2}
            rx={OVAL_W / 2 - 1} ry={OVAL_H / 2 - 1}
            fill="rgba(0,212,255,0.04)"
            stroke="url(#ovalBorder)"
            strokeWidth={2}
            strokeDasharray={stage === "scanning" ? "6 4" : undefined}
          />
          {/* Corner brackets */}
          {[
            [6, 6], [OVAL_W - 6, 6], [6, OVAL_H - 6], [OVAL_W - 6, OVAL_H - 6],
          ].map(([cx, cy], i) => (
            <React.Fragment key={i}>
              <Rect
                x={cx - (i % 2 === 0 ? 0 : -14)} y={cy - 1.5}
                width={14} height={3}
                fill="#00D4FF" rx={1}
                transform={i % 2 === 1 ? `translate(-14,0)` : undefined}
              />
              <Rect
                x={cx - 1.5} y={cy - (i < 2 ? 0 : -14)}
                width={3} height={14}
                fill="#00D4FF" rx={1}
                transform={i >= 2 ? `translate(0,-14)` : undefined}
              />
            </React.Fragment>
          ))}
        </Svg>

        {/* Sweep line */}
        {(stage === "scanning" || stage === "analyzing") && (
          <Animated.View style={[styles.sweepLine, sweepStyle]}>
            <LinearGradient
              colors={
                stage === "analyzing"
                  ? ["transparent", "rgba(123,97,255,0.0)", "rgba(123,97,255,0.9)", "rgba(123,97,255,0.0)", "transparent"]
                  : ["transparent", "rgba(0,212,255,0.0)", "rgba(0,212,255,0.95)", "rgba(0,212,255,0.0)", "transparent"]
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.sweepLineInner}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Side data panels */}
      <DataPanel side="left" scanning={stage === "scanning" || stage === "analyzing"} />
      <DataPanel side="right" scanning={stage === "scanning" || stage === "analyzing"} />

      {/* Bottom area */}
      <View style={[styles.bottomArea, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 28 }]}>
        {/* Data chip row */}
        <View style={styles.chipRow}>
          {[
            ["MELANIN", stage !== "idle" ? randomVal(0.15, 0.45) : "—"],
            ["PORE", stage !== "idle" ? randomVal(0.1, 0.3) + "mm" : "—"],
            ["UV DMG", stage !== "idle" ? randomVal(5, 40) + "%" : "—"],
          ].map(([label, val]) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipLabel}>{label}</Text>
              <Text style={[styles.chipVal, { color: stage !== "idle" ? "#00D4FF" : "#3A506B" }]}>{val}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.hintText}>
          {stage === "idle" ? "Centre your face — ensure even lighting" :
           stage === "detecting" ? "Face detected — hold position..." :
           stage === "scanning" ? "Mapping epidermal layer..." :
           stage === "analyzing" ? "Neural analysis in progress..." :
           "Analysis complete"}
        </Text>

        <Animated.View style={btnStyle}>
          <TouchableOpacity
            onPress={handleScan}
            disabled={stage !== "idle"}
            activeOpacity={0.8}
            style={styles.scanBtnWrap}
          >
            {stage === "complete" ? (
              <LinearGradient colors={["#00E87A", "#00B85C"]} style={styles.scanBtn}>
                <Ionicons name="checkmark" size={30} color="#000" />
              </LinearGradient>
            ) : stage === "idle" ? (
              <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.scanBtn}>
                <Ionicons name="scan-outline" size={28} color="#000" />
              </LinearGradient>
            ) : (
              <View style={[styles.scanBtn, styles.scanBtnActive]}>
                <Ionicons name="scan-outline" size={28} color="#00D4FF" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.scanBtnLabel}>
          {stage === "idle" ? "TAP TO SCAN" : stage === "complete" ? "DONE" : "SCANNING..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  permRoot: { flex: 1, backgroundColor: "#06090F", alignItems: "center", justifyContent: "center" },
  permInner: { alignItems: "center", paddingHorizontal: 36, gap: 14 },
  permIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  permTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#E2EEFF", textAlign: "center" },
  permSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#5A7A9F", textAlign: "center" },
  permBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 8 },
  permBtnInner: { height: 52, alignItems: "center", justifyContent: "center" },
  permBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#000" },
  backTextBtn: { paddingVertical: 8 },
  backText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#5A7A9F" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 10, zIndex: 20,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  topCenter: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.2)",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  topLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 12,
    color: "#E2EEFF", letterSpacing: 1.5,
  },
  stageBand: {
    position: "absolute", top: height * 0.13, left: 16, right: 16, zIndex: 10,
  },
  stageLabelRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6,
  },
  stageKey: {
    fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 2,
  },
  stageSub: {
    fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 2, backgroundColor: "rgba(0,212,255,0.12)",
    borderRadius: 1, overflow: "visible",
  },
  progressFill: {
    height: 2, backgroundColor: "#00D4FF", borderRadius: 1,
  },
  progressDot: {
    position: "absolute", top: -3,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#00D4FF",
    marginLeft: -4,
  },
  ringsWrap: {
    position: "absolute",
    left: OVAL_X - 40,
    top: OVAL_Y - 40,
  },
  ovalClip: {
    position: "absolute",
    left: OVAL_X,
    top: OVAL_Y,
    width: OVAL_W,
    height: OVAL_H,
    overflow: "hidden",
  },
  sweepLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    top: 0,
  },
  sweepLineInner: { flex: 1, height: 3 },
  dataPanel: {
    position: "absolute", top: OVAL_Y + 40,
    backgroundColor: "rgba(6,9,15,0.75)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.15)",
    borderRadius: 10, padding: 10, gap: 7,
  },
  dataPanelLeft: { left: 10 },
  dataPanelRight: { right: 10 },
  dataRow: { gap: 2 },
  dataKey: {
    fontFamily: "Poppins_700Bold", fontSize: 9, color: "#3A506B",
    letterSpacing: 1.5,
  },
  dataVal: {
    fontFamily: "Poppins_600SemiBold", fontSize: 13,
    letterSpacing: 0.5,
  },
  bottomArea: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    alignItems: "center", gap: 12,
  },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    backgroundColor: "rgba(6,9,15,0.8)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.15)",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    alignItems: "center",
  },
  chipLabel: {
    fontFamily: "Poppins_700Bold", fontSize: 8,
    color: "#3A506B", letterSpacing: 1.5,
  },
  chipVal: {
    fontFamily: "Poppins_600SemiBold", fontSize: 12,
    letterSpacing: 0.5, marginTop: 1,
  },
  hintText: {
    fontFamily: "Poppins_400Regular", fontSize: 12,
    color: "rgba(255,255,255,0.4)", textAlign: "center",
    letterSpacing: 0.3,
  },
  scanBtnWrap: {
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  scanBtn: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: "center", justifyContent: "center",
  },
  scanBtnActive: {
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 2, borderColor: "rgba(0,212,255,0.4)",
  },
  scanBtnLabel: {
    fontFamily: "Poppins_700Bold", fontSize: 10,
    color: "rgba(0,212,255,0.6)", letterSpacing: 2.5,
  },
});

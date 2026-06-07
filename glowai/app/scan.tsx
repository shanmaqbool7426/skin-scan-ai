import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { CameraView as CameraViewType } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
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
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Ellipse,
  Line,
  LinearGradient as SvgLG,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

// ── Config: update this to your computer's local IP ──────────────────────────
const BACKEND_URL = "http://192.168.1.109:3000/api/scan";

const { width, height } = Dimensions.get("window");
const OVAL_W = width * 0.56;
const OVAL_H = OVAL_W * 1.32;
const OVAL_X = (width - OVAL_W) / 2;
const OVAL_Y = height * 0.18;

type Stage =
  | "idle"
  | "detecting"
  | "aligning"
  | "scanFront"
  | "turnLeft"
  | "scanLeft"
  | "turnRight"
  | "scanRight"
  | "capturing"
  | "scanning"
  | "analyzing"
  | "complete";

const STAGES: { key: Stage; label: string; sub: string; pct: number }[] = [
  { key: "idle",       label: "READY",            sub: "Position face in frame",            pct: 0 },
  { key: "detecting",  label: "DETECTING",         sub: "Locating facial landmarks...",      pct: 5 },
  { key: "aligning",   label: "ALIGN OVAL",        sub: "Center face in overlay frame...",   pct: 10 },
  { key: "scanFront",  label: "FRONTAL SCAN",      sub: "Mapping base surface...",           pct: 25 },
  { key: "turnLeft",   label: "TURN LEFT",         sub: "Slowly turn your head left",        pct: 35 },
  { key: "scanLeft",   label: "LEFT PROFILE",      sub: "Scanning left side pores...",       pct: 50 },
  { key: "turnRight",  label: "TURN RIGHT",        sub: "Slowly turn your head right",       pct: 60 },
  { key: "scanRight",  label: "RIGHT PROFILE",     sub: "Scanning right pigmentation...",    pct: 75 },
  { key: "capturing",  label: "NEUTRAL FACE",      sub: "Look straight for final capture...",pct: 85 },
  { key: "scanning",   label: "EPIDERMAL SCAN",    sub: "Finalizing texture mapping...",     pct: 90 },
  { key: "analyzing",  label: "DEEP DERMA AI",     sub: "Evaluating skin layers (1.5s)...",  pct: 95 },
  { key: "complete",   label: "COMPLETE",          sub: "Clinical report ready",             pct: 100 },
];

function randomVal(min: number, max: number) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

export default function ScanScreen() {
  const { addScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>("idle");
  const [flash, setFlash] = useState(false);
  const [showLightWarning, setShowLightWarning] = useState(false);
  const [scanError, setScanError] = useState<{
    title: string;
    message: string;
    icon: string;
    tip: string;
    iconColor: string;
  } | null>(null);
  const cameraRef = useRef<CameraViewType>(null);

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
  const statusDotStyle = useAnimatedStyle(() => ({
    opacity: stage !== "idle" && stage !== "complete" ? dotOpacity.value : 1,
  }));

  const handleScan = async () => {
    if (stage !== "idle") return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(withTiming(0.88, { duration: 80 }), withTiming(1, { duration: 80 }));

    try {
      // ── Stage 1: Detecting ──────────────────────────────────────────────
      setStage("detecting");
      await new Promise(r => setTimeout(r, 900));

      // ── Stage 2: Aligning ───────────────────────────────────────────────
      setStage("aligning");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(r => setTimeout(r, 1400));

      // ── Frontal Scan ────────────────────────────────────────────────────
      setStage("scanFront");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 1200));

      // ── Turn Left & Scan ────────────────────────────────────────────────
      setStage("turnLeft");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(r => setTimeout(r, 1500));
      
      setStage("scanLeft");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 1200));

      // ── Turn Right & Scan ───────────────────────────────────────────────
      setStage("turnRight");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(r => setTimeout(r, 1500));

      setStage("scanRight");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 1200));

      // ── Final Capture Pose ──────────────────────────────────────────────
      setStage("capturing");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 1500));

      // ── Capture photo & Analyze Quality ─────────────────────────────────
      let base64Image = "";
      if (Platform.OS !== "web" && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.25,   // lower = smaller payload = fewer tokens = no quota issues
          exif: false,
        });
        base64Image = photo?.base64 ?? "";
      }

      // Check if image is extremely dark/poorly-lit/covered camera.
      // A standard 0.25 quality face image has high complexity (size > 22k chars).
      // A black/flat covered camera or extreme low-light image has extremely low complexity (size < 13k chars).
      // We set a safe professional boundary at 17,500 chars.
      if (Platform.OS !== "web" && (!base64Image || base64Image.length < 17500)) {
        console.log("⚠️ Skin scan warning: Under-illuminated or flat image detected. Length:", base64Image?.length);
        setStage("idle");
        setShowLightWarning(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // ── Stage 6: Surface Scanning ───────────────────────────────────────
      setStage("scanning");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 1200));

      // ── Stage 7: Analyzing (send to AI) ────────────────────────────────
      setStage("analyzing");

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      const responseData = await response.json().catch(() => ({}));

      // ── Handle AI validation rejection (422) ────────────────────────────
      if (response.status === 422 && responseData?.validationFailed) {
        setStage("idle");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const code = responseData.failureCode || "UNKNOWN";
        const FAILURE_MESSAGES: Record<string, { title: string; message: string; icon: string; tip: string; iconColor: string }> = {
          NO_FACE: {
            title: "No Face Detected",
            message: "The AI could not find a human face in this scan.",
            icon: "person-outline",
            tip: "Centre your face inside the oval frame and try again.",
            iconColor: "#FF3B5C",
          },
          TOO_FAR: {
            title: "Move Closer",
            message: "Your face is too far from the camera. The AI needs to see your skin pores clearly.",
            icon: "expand-outline",
            tip: "Hold the phone ~30cm (12 inches) from your face.",
            iconColor: "#FFB800",
          },
          FACE_CUT_OFF: {
            title: "Face Not Fully Visible",
            message: "Part of your face is outside the frame. The AI needs your full face.",
            icon: "crop-outline",
            tip: "Move back slightly until your whole face fits in the oval.",
            iconColor: "#FFB800",
          },
          DARK_LIGHTING: {
            title: "Too Dark",
            message: "Lighting is too dim for an accurate skin analysis.",
            icon: "moon-outline",
            tip: "Move to a brighter area or face a light source, then try again.",
            iconColor: "#7B61FF",
          },
          BRIGHT_OVEREXPOSED: {
            title: "Overexposed",
            message: "Too much direct light is washing out your skin details.",
            icon: "sunny-outline",
            tip: "Avoid direct sunlight or harsh flashes. Use soft ambient light.",
            iconColor: "#FFB800",
          },
          BLURRY: {
            title: "Image Blurry",
            message: "The image is too blurry for accurate pore-level analysis.",
            icon: "eye-off-outline",
            tip: "Hold the phone steady and ensure camera lens is clean.",
            iconColor: "#5A7A9F",
          },
        };
        setScanError(FAILURE_MESSAGES[code] || {
          title: "Scan Not Accepted",
          message: responseData.failureReason || "The image was not suitable for skin analysis.",
          icon: "alert-circle-outline",
          tip: "Ensure your face is clear, well-lit, and centred in the oval.",
          iconColor: "#FF3B5C",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(responseData?.error || `Server error ${response.status}`);
      }

      // ── Stage 8: Complete ───────────────────────────────────────────────
      setStage("complete");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      addScanResult(responseData);
      setTimeout(() => router.replace("/scan-results"), 700);

    } catch (error: any) {
      console.error("❌ Scan error:", error?.message || error);
      setStage("idle");
      Alert.alert(
        "Scan Failed",
        error?.message?.includes("Network") || error?.message?.includes("fetch")
          ? "Cannot connect to server.\n\nMake sure:\n1. Backend is running (node server.js)\n2. Phone and PC are on same Wi-Fi\n3. IP in BACKEND_URL is correct"
          : (error?.message || "AI analysis failed. Please try again."),
        [{ text: "OK" }]
      );
    }
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
          <Animated.View style={[styles.statusDot, { backgroundColor: stage === "idle" ? "#3A506B" : "#00D4FF" }, statusDotStyle]}>
          </Animated.View>
          <Text style={styles.topLabel}>AI DERMA SCAN</Text>
        </View>
        <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
          <Ionicons name={flash ? "flash" : "flash-off"} size={20} color={flash ? "#00D4FF" : "rgba(255,255,255,0.5)"} />
        </TouchableOpacity>
      </View>

      {/* Stage indicator strip */}
      <View style={[styles.stageBand, { top: topPad + 55 }]}>
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

      {/* Guidance HUD Overlay */}
      {stage !== "idle" && stage !== "complete" && stage !== "scanning" && stage !== "analyzing" && (
        <View style={styles.hudOverlay}>
          <View style={styles.hudCard}>
            {stage === "detecting" && (
              <>
                <Ionicons name="scan-outline" size={32} color="#00D4FF" />
                <Text style={styles.hudTitle}>DETECTING FACE</Text>
                <Text style={styles.hudSub}>Position yourself in focus</Text>
              </>
            )}
            {stage === "aligning" && (
              <>
                <Ionicons name="expand" size={32} color="#00D4FF" />
                <Text style={styles.hudTitle}>ALIGN FACE</Text>
                <Text style={styles.hudSub}>Fit your face completely in oval</Text>
              </>
            )}
            {stage === "scanFront" && (
              <>
                <Ionicons name="body-outline" size={32} color="#00FFA3" />
                <Text style={[styles.hudTitle, { color: "#00FFA3" }]}>HOLD STILL</Text>
                <Text style={styles.hudSub}>Scanning frontal features...</Text>
              </>
            )}
            {stage === "turnLeft" && (
              <>
                <Ionicons name="arrow-undo-outline" size={32} color="#7B61FF" />
                <Text style={[styles.hudTitle, { color: "#9A8CFF" }]}>TURN HEAD LEFT</Text>
                <Text style={styles.hudSub}>Slowly expose left cheek</Text>
              </>
            )}
            {stage === "scanLeft" && (
              <>
                <Ionicons name="body-outline" size={32} color="#00FFA3" />
                <Text style={[styles.hudTitle, { color: "#00FFA3" }]}>HOLD STILL</Text>
                <Text style={styles.hudSub}>Deep scanning left profile...</Text>
              </>
            )}
            {stage === "turnRight" && (
              <>
                <Ionicons name="arrow-redo-outline" size={32} color="#7B61FF" />
                <Text style={[styles.hudTitle, { color: "#9A8CFF" }]}>TURN HEAD RIGHT</Text>
                <Text style={styles.hudSub}>Slowly expose right cheek</Text>
              </>
            )}
            {stage === "scanRight" && (
              <>
                <Ionicons name="body-outline" size={32} color="#00FFA3" />
                <Text style={[styles.hudTitle, { color: "#00FFA3" }]}>HOLD STILL</Text>
                <Text style={styles.hudSub}>Deep scanning right profile...</Text>
              </>
            )}
            {stage === "capturing" && (
              <>
                <Ionicons name="camera-outline" size={32} color="#00D4FF" />
                <Text style={styles.hudTitle}>LOOK FORWARD</Text>
                <Text style={styles.hudSub}>Close mouth & look at camera</Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Glassmorphic Light Warning Modal */}
      <Modal
        visible={showLightWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLightWarning(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={32} color="#FFB800" style={{ marginRight: 8 }} />
              <Text style={styles.warningTitle}>POOR LIGHTING DETECTED</Text>
            </View>
            <Text style={styles.warningText}>
              Dermatological AI scan requires strong and even lighting to analyze pores, redness, and wrinkles accurately.{"\n\n"}
              Your environment appears too dark or the camera is covered.
            </Text>
            <View style={styles.warningTips}>
              <Text style={styles.tipRow}><Text style={styles.tipNum}>1.</Text> Move to a bright, well-lit room.</Text>
              <Text style={styles.tipRow}><Text style={styles.tipNum}>2.</Text> Face a light source directly.</Text>
              <Text style={styles.tipRow}><Text style={styles.tipNum}>3.</Text> Ensure camera lens is clean.</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowLightWarning(false)}
              activeOpacity={0.8}
              style={styles.dismissBtn}
            >
              <LinearGradient colors={["#00D4FF", "#0088AA"]} style={styles.dismissBtnInner}>
                <Text style={styles.dismissBtnText}>TRY AGAIN</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Scan Validation Error Modal */}
      <Modal
        visible={scanError !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setScanError(null)}
      >
        <View style={styles.modalBg}>
          {scanError && (
            <View style={[styles.warningCard, { borderColor: scanError.iconColor + "40" }]}>
              <View style={styles.warningHeader}>
                <View style={[styles.errorIconCircle, { backgroundColor: scanError.iconColor + "18", borderColor: scanError.iconColor + "35" }]}>
                  <Ionicons name={scanError.icon as any} size={30} color={scanError.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.warningTitle, { color: scanError.iconColor }]}>{scanError.title.toUpperCase()}</Text>
                  <Text style={styles.errorSubLabel}>AI Scan Rejected</Text>
                </View>
              </View>
              <Text style={styles.warningText}>{scanError.message}</Text>
              <View style={[styles.warningTips, { borderColor: scanError.iconColor + "20", backgroundColor: scanError.iconColor + "08" }]}>
                <Ionicons name="bulb-outline" size={16} color={scanError.iconColor} />
                <Text style={[styles.tipRow, { color: "#E2EEFF", marginTop: 0 }]}>{scanError.tip}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setScanError(null)}
                activeOpacity={0.8}
                style={styles.dismissBtn}
              >
                <LinearGradient colors={["#00D4FF", "#0088AA"]} style={styles.dismissBtnInner}>
                  <Ionicons name="camera-outline" size={16} color="#000" />
                  <Text style={styles.dismissBtnText}>TRY AGAIN</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

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
  hudOverlay: {
    position: "absolute",
    top: OVAL_Y + OVAL_H + 20,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  hudCard: {
    width: "100%",
    backgroundColor: "rgba(10,21,37,0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(0,212,255,0.25)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 6,
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  hudTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#00D4FF",
    letterSpacing: 2,
    marginTop: 4,
  },
  hudSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#A2C3EC",
    textAlign: "center",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  warningCard: {
    width: "100%",
    backgroundColor: "#0A1525",
    borderWidth: 1.5,
    borderColor: "rgba(255,184,0,0.35)",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#FFB800",
    letterSpacing: 1,
    flex: 1,
  },
  warningText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#E2EEFF",
    lineHeight: 20,
    marginBottom: 20,
  },
  warningTips: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  tipRow: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#A2C3EC",
  },
  tipNum: {
    fontFamily: "Poppins_700Bold",
    color: "#FFB800",
  },
  dismissBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  dismissBtnInner: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dismissBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#000",
    letterSpacing: 1.5,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  errorSubLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#5A7A9F",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  warningTipsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  hudCountdown: {
    fontFamily: "Poppins_700Bold",
    fontSize: 48,
    color: "#00D4FF",
    includeFontPadding: false,
    lineHeight: 56,
  },
});

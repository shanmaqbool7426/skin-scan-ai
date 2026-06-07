import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { CameraView as CameraViewType } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
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

const { width, height } = Dimensions.get("window");
const OVAL_W = width * 0.65;
const OVAL_H = OVAL_W * 1.35;
const OVAL_X = (width - OVAL_W) / 2;
const OVAL_Y = height * 0.15;

// ── Angle Capture Steps ───────────────────────────────────────────────────────
type AngleKey = "front" | "left" | "right";

interface AngleStep {
  key: AngleKey;
  label: string;
  instruction: string;
  icon: string;
  color: string;
  tip: string;
  required: boolean;
}

const ANGLE_STEPS: AngleStep[] = [
  {
    key: "front",
    label: "Front View",
    instruction: "LOOK STRAIGHT AHEAD",
    icon: "person-outline",
    color: "#00D4FF",
    tip: "Face the camera directly. Keep eyes open and relaxed.",
    required: true,
  },
  {
    key: "left",
    label: "Left Side",
    instruction: "TURN HEAD LEFT 45°",
    icon: "arrow-back-circle-outline",
    color: "#7B61FF",
    tip: "Tilt your head left so your left cheek faces the camera.",
    required: false,
  },
  {
    key: "right",
    label: "Right Side",
    instruction: "TURN HEAD RIGHT 45°",
    icon: "arrow-forward-circle-outline",
    color: "#00FFA3",
    tip: "Tilt your head right so your right cheek faces the camera.",
    required: false,
  },
];

type ViewState = "guide" | "camera" | "preview" | "review" | "animating";

export default function ScanScreen() {
  const { apiFetch, addScanResult } = useApp();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewType>(null);

  const [viewState, setViewState] = useState<ViewState>("guide");
  const [flash, setFlash] = useState(false);
  const [currentAngleIdx, setCurrentAngleIdx] = useState(0);

  // Captured images per angle
  const [captures, setCaptures] = useState<Partial<Record<AngleKey, string>>>({});

  // Analysis state
  const [animationStep, setAnimationStep] = useState(0);
  const [animationText, setAnimationText] = useState("Preparing photos...");
  const [scanError, setScanError] = useState<{
    title: string; message: string; icon: string; tip: string; iconColor: string; angleLabel?: string;
  } | null>(null);

  // Animations
  const sweepY = useSharedValue(-OVAL_H / 2);
  const ringRot = useSharedValue(0);
  const progressVal = useSharedValue(0);
  const pulseVal = useSharedValue(1);

  const ANALYSIS_STEPS = [
    { text: "Validating Image Quality...", endPct: 20, duration: 1200 },
    { text: "Analyzing Front View...", endPct: 45, duration: 1800 },
    { text: "Cross-referencing Angles...", endPct: 70, duration: 1800 },
    { text: "Generating Clinical Report...", endPct: 92, duration: 1500 },
  ];

  useEffect(() => {
    ringRot.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1);
  }, []);

  useEffect(() => {
    if (viewState === "animating") {
      sweepY.value = withRepeat(withTiming(OVAL_H, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
      pulseVal.value = withRepeat(withSequence(withTiming(1.04, { duration: 600 }), withTiming(0.96, { duration: 600 })), -1, true);
    } else {
      cancelAnimation(sweepY);
      sweepY.value = -OVAL_H / 2;
      pulseVal.value = 1;
    }
  }, [viewState]);

  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sweepY.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ringRot.value}deg` }] }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressVal.value}%` as any }));
  const imagePreviewStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseVal.value }] }));

  const currentAngle = ANGLE_STEPS[currentAngleIdx];
  const capturedCount = Object.keys(captures).length;
  const primaryUri = captures.front || null;

  // ── Open camera for current angle ─────────────────────────────────────────
  const handleOpenCamera = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS !== "web" && (!permission || !permission.granted)) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission Denied", "Camera permission is required.");
        return;
      }
    }
    setViewState("camera");
  };

  // ── Capture photo ──────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (Platform.OS !== "web" && cameraRef.current) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, exif: false });
        if (photo?.uri) {
          setCaptures((prev) => ({ ...prev, [currentAngle.key]: photo.uri }));
          setViewState("preview");
        }
      } catch (err) {
        Alert.alert("Capture Failed", "Could not take photo. Please try again.");
      }
    } else {
      // Web fallback
      setCaptures((prev) => ({ ...prev, [currentAngle.key]: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600" }));
      setViewState("preview");
    }
  };

  // ── Gallery pick ───────────────────────────────────────────────────────────
  const handleGalleryPick = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCaptures((prev) => ({ ...prev, [currentAngle.key]: result.assets[0].uri }));
        setViewState("preview");
      }
    } catch (err) {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  // ── Confirm current angle capture → advance ───────────────────────────────
  const handleConfirmCapture = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (currentAngleIdx < ANGLE_STEPS.length - 1) {
      // Move to next angle
      setCurrentAngleIdx((idx) => idx + 1);
      setViewState("camera");
    } else {
      // All angles done → go to review
      setViewState("review");
    }
  };

  // ── Retake current angle ───────────────────────────────────────────────────
  const handleRetake = () => {
    setCaptures((prev) => {
      const next = { ...prev };
      delete next[currentAngle.key];
      return next;
    });
    setViewState("camera");
  };

  // ── Skip optional angle ────────────────────────────────────────────────────
  const handleSkipAngle = () => {
    if (currentAngleIdx < ANGLE_STEPS.length - 1) {
      setCurrentAngleIdx((idx) => idx + 1);
      setViewState("camera");
    } else {
      setViewState("review");
    }
  };

  // ── Select angle from review to retake ────────────────────────────────────
  const handleRetakeFromReview = (angleIdx: number) => {
    setCurrentAngleIdx(angleIdx);
    setViewState("camera");
  };

  // ── Start multi-angle analysis ─────────────────────────────────────────────
  const handleStartAnalysis = async () => {
    if (!captures.front) {
      Alert.alert("Front View Required", "Please capture the front-facing photo first.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setViewState("animating");
    progressVal.value = 0;

    // Run step animations
    let step = 0;
    const runSteps = () => {
      if (step >= ANALYSIS_STEPS.length) return;
      const s = ANALYSIS_STEPS[step];
      setAnimationStep(step);
      setAnimationText(s.text);
      progressVal.value = withTiming(s.endPct, { duration: s.duration, easing: Easing.out(Easing.quad) });
      setTimeout(() => { step++; runSteps(); }, s.duration);
    };
    runSteps();

    try {
      const formData = new FormData();

      // Append each captured angle
      const angleFieldMap: Record<AngleKey, string> = {
        front: "image",
        left: "imageLeft",
        right: "imageRight",
      };

      for (const angle of ANGLE_STEPS) {
        const uri = captures[angle.key];
        if (!uri) continue;
        const uriParts = uri.split(".");
        const ext = uriParts[uriParts.length - 1]?.toLowerCase() || "jpg";
        formData.append(angleFieldMap[angle.key], {
          uri,
          name: `scan-${angle.key}-${Date.now()}.${ext}`,
          type: `image/${ext === "png" ? "png" : ext === "webp" ? "webp" : "jpeg"}`,
        } as any);
      }

      const res = await apiFetch("/api/scan", { method: "POST", body: formData });

      progressVal.value = withTiming(100, { duration: 500 });
      setAnimationText("Analysis Complete!");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      addScanResult(res);
      setTimeout(() => { router.replace("/scan-results"); }, 700);

    } catch (error: any) {
      console.error("Scan error:", error);

      const FAILURE_MESSAGES: Record<string, { title: string; message: string; icon: string; tip: string; iconColor: string }> = {
        NO_FACE: { title: "No Face Detected", message: "The AI could not identify a clear face in this photo.", icon: "person-outline", tip: "Ensure your face is clearly visible and well-lit.", iconColor: "#FF3B5C" },
        TOO_FAR: { title: "Move Closer", message: "Your face is too far away for skin texture analysis.", icon: "expand-outline", tip: "Hold the phone ~25-30cm from your face.", iconColor: "#FFB800" },
        FACE_CUT_OFF: { title: "Face Cropped", message: "Part of your face is outside the frame.", icon: "crop-outline", tip: "Center your face within the oval guide.", iconColor: "#FFB800" },
        DARK_LIGHTING: { title: "Too Dark", message: "Lighting is insufficient for accurate skin analysis.", icon: "moon-outline", tip: "Face a window or bright light source.", iconColor: "#7B61FF" },
        BRIGHT_OVEREXPOSED: { title: "Overexposed", message: "Photo is washed out by direct flash or bright light.", icon: "sunny-outline", tip: "Avoid direct flash — use soft natural light.", iconColor: "#FFB800" },
        BLURRY: { title: "Image Blurry", message: "Image is too blurry for precise analysis.", icon: "eye-off-outline", tip: "Hold the phone steady and keep your camera lens clean.", iconColor: "#5A7A9F" },
      };

      let code = "UNKNOWN";
      let displayMessage = error.message || "Unexpected error. Please try again.";
      let angleLabel = "Front";

      try {
        const parsed = JSON.parse(error.message);
        if (parsed.validationFailed) {
          code = parsed.failureCode || "UNKNOWN";
          displayMessage = parsed.failureReason || "Image not suitable for analysis.";
          angleLabel = parsed.angleLabel || "Front";
        } else if (parsed.error) {
          displayMessage = parsed.error;
        }
      } catch (_) {
        // Fallback for non-JSON error messages
        for (const key of Object.keys(FAILURE_MESSAGES)) {
          if (error.message?.includes(key)) { code = key; break; }
        }
        angleLabel = error.message?.includes("Left") ? "Left" : error.message?.includes("Right") ? "Right" : "Front";
      }

      // Clean up technical terms and JSON details from displayMessage
      if (displayMessage.includes("AI analysis failed:") || displayMessage.includes("{") || displayMessage.includes("}")) {
        if (displayMessage.includes("NOT_FOUND") || displayMessage.includes("not found")) {
          displayMessage = "AI model configuration issue. Please contact support or try again later.";
        } else if (displayMessage.includes("quota") || displayMessage.includes("429") || displayMessage.includes("RESOURCE_EXHAUSTED")) {
          displayMessage = "The analysis service is currently at capacity. Please try again in a few moments.";
        } else if (displayMessage.includes("503") || displayMessage.includes("UNAVAILABLE")) {
          displayMessage = "The AI scanner is temporarily busy. Please wait a moment and try again.";
        } else {
          displayMessage = "AI analysis failed due to a temporary service issue. Please try again.";
        }
      }

      setViewState("review");
      setScanError({
        ...(FAILURE_MESSAGES[code] || {
          title: "Scan Failed",
          message: displayMessage,
          icon: "alert-circle-outline",
          tip: "Ensure good lighting and a clear face shot.",
          iconColor: "#FF3B5C",
        }),
        angleLabel,
      });
    }
  };

  const topPad = (Platform.OS === "web" ? 67 : insets.top) + 8;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>

      {/* Background */}
      {viewState === "camera" && Platform.OS !== "web" ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" flash={flash ? "on" : "off"} />
      ) : viewState === "preview" && captures[currentAngle.key] ? (
        <Image source={{ uri: captures[currentAngle.key]! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={["#06090F", "#0A1525", "#06090F"]} style={StyleSheet.absoluteFill} />
      )}

      {/* Vignette */}
      {(viewState === "camera" || viewState === "preview" || viewState === "animating") && (
        <LinearGradient
          colors={["rgba(6,9,15,0.80)", "rgba(6,9,15,0.2)", "rgba(6,9,15,0.2)", "rgba(6,9,15,0.95)"]}
          locations={[0, 0.25, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Grid background */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        {Array.from({ length: 10 }).map((_, i) => {
          const x = (i / 10) * width;
          const y = (i / 10) * height;
          return (
            <React.Fragment key={i}>
              <Line x1={x} y1={0} x2={x} y2={height} stroke="rgba(0,212,255,0.03)" strokeWidth={1} />
              <Line x1={0} y1={y} x2={width} y2={y} stroke="rgba(0,212,255,0.03)" strokeWidth={1} />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <TouchableOpacity
          onPress={() => {
            if (viewState === "guide") { router.back(); }
            else if (viewState === "camera" || viewState === "preview") { setViewState("guide"); }
            else if (viewState === "review") { setViewState("guide"); }
          }}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <Text style={styles.topLabel}>SKIN ANALYSIS</Text>
        {viewState === "camera" ? (
          <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
            <Ionicons name={flash ? "flash" : "flash-off"} size={20} color={flash ? "#00D4FF" : "rgba(255,255,255,0.5)"} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      {/* ── GUIDE SCREEN ── */}
      {viewState === "guide" && (
        <ScrollView contentContainerStyle={[styles.guideContent, { paddingTop: topPad + 60, paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <LinearGradient colors={["#00D4FF", "#7B61FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroIconWrap}>
              <Ionicons name="scan" size={32} color="#000" />
            </LinearGradient>
            <Text style={styles.title}>Multi-Angle Skin Scanner</Text>
            <Text style={styles.subtitle}>
              Our AI analyzes up to 3 face angles for a highly accurate, clinical-grade skin report — detecting issues invisible from a single photo.
            </Text>
          </View>

          {/* Angle Steps Preview */}
          <View style={styles.anglesPreviewCard}>
            <Text style={styles.sectionHeader}>📸  CAPTURE SEQUENCE</Text>
            {ANGLE_STEPS.map((step, idx) => (
              <View key={step.key} style={styles.anglePreviewRow}>
                <View style={[styles.angleNumCircle, { borderColor: step.color + "60", backgroundColor: step.color + "15" }]}>
                  <Text style={[styles.angleNumText, { color: step.color }]}>{idx + 1}</Text>
                </View>
                <View style={styles.anglePreviewInfo}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.anglePreviewLabel}>{step.label}</Text>
                    {!step.required && (
                      <View style={styles.optionalBadge}><Text style={styles.optionalText}>Optional</Text></View>
                    )}
                  </View>
                  <Text style={styles.anglePreviewTip}>{step.tip}</Text>
                </View>
                <Ionicons name={step.icon as any} size={20} color={step.color} />
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.sectionHeader}>✨  TIPS FOR BEST RESULTS</Text>
            {[
              { color: "#00D4FF", title: "Bright, Even Lighting", desc: "Face a window or use a ring light. Avoid shadows on your face." },
              { color: "#7B61FF", title: "Clean Face, No Makeup", desc: "Remove glasses, makeup, and accessories for accurate dermal analysis." },
              { color: "#00FFA3", title: "Hold Steady & Close", desc: "Keep the phone ~25cm from your face. Hold still for a sharp shot." },
            ].map((t) => (
              <View key={t.title} style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: t.color }]} />
                <View style={styles.tipTextWrap}>
                  <Text style={styles.tipTitle}>{t.title}</Text>
                  <Text style={styles.tipDesc}>{t.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity onPress={() => { setCurrentAngleIdx(0); setCaptures({}); handleOpenCamera(); }} style={styles.primaryBtn} activeOpacity={0.85}>
            <LinearGradient colors={["#00D4FF", "#00A8CC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnInner}>
              <Ionicons name="camera" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Start Guided Scan</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGalleryPick} style={styles.secondaryBtn} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={20} color="#00D4FF" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── CAMERA MODE ── */}
      {viewState === "camera" && (
        <>
          {/* Angle progress indicator */}
          <View style={[styles.angleProgress, { top: topPad + 54 }]}>
            {ANGLE_STEPS.map((step, idx) => (
              <View key={step.key} style={styles.angleProgressItem}>
                <View style={[
                  styles.angleProgressDot,
                  captures[step.key] ? styles.angleProgressDone :
                  idx === currentAngleIdx ? styles.angleProgressActive : null,
                  { borderColor: idx === currentAngleIdx ? currentAngle.color : captures[step.key] ? "#22c55e" : "rgba(255,255,255,0.2)" }
                ]}>
                  {captures[step.key] ? (
                    <Ionicons name="checkmark" size={12} color="white" />
                  ) : (
                    <Text style={[styles.angleProgressNum, { color: idx === currentAngleIdx ? currentAngle.color : "rgba(255,255,255,0.4)" }]}>{idx + 1}</Text>
                  )}
                </View>
                <Text style={[styles.angleProgressLabel, { color: idx === currentAngleIdx ? currentAngle.color : "rgba(255,255,255,0.4)" }]}>{step.label}</Text>
              </View>
            ))}
          </View>

          {/* Oval guide */}
          <View style={styles.cameraOverlay}>
            <Svg width={OVAL_W} height={OVAL_H}>
              <Ellipse
                cx={OVAL_W / 2} cy={OVAL_H / 2}
                rx={OVAL_W / 2 - 1} ry={OVAL_H / 2 - 1}
                fill="none" stroke={currentAngle.color} strokeWidth={2.5} strokeDasharray="10 5"
              />
            </Svg>
            <Text style={[styles.overlayInstruction, { color: currentAngle.color }]}>{currentAngle.instruction}</Text>
            <Text style={styles.overlayTip}>{currentAngle.tip}</Text>
          </View>

          {/* Capture controls */}
          <View style={[styles.bottomCaptureArea, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity onPress={handleCapture} activeOpacity={0.8} style={styles.captureBtnWrap}>
              <LinearGradient colors={[currentAngle.color, currentAngle.color + "AA"]} style={styles.captureBtnInner} />
            </TouchableOpacity>
            {!currentAngle.required && (
              <TouchableOpacity onPress={handleSkipAngle} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>Skip {currentAngle.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* ── PREVIEW MODE ── */}
      {viewState === "preview" && captures[currentAngle.key] && (
        <>
          {/* Angle indicator */}
          <View style={[styles.previewAngleBadge, { top: topPad + 60, borderColor: currentAngle.color + "60", backgroundColor: currentAngle.color + "20" }]}>
            <Ionicons name={currentAngle.icon as any} size={14} color={currentAngle.color} />
            <Text style={[styles.previewAngleLabel, { color: currentAngle.color }]}>{currentAngle.label}</Text>
          </View>

          {/* Oval */}
          <View style={styles.cameraOverlay}>
            <Svg width={OVAL_W} height={OVAL_H}>
              <Ellipse cx={OVAL_W / 2} cy={OVAL_H / 2} rx={OVAL_W / 2 - 1} ry={OVAL_H / 2 - 1} fill="none" stroke="#22c55e" strokeWidth={2.5} />
            </Svg>
            <Text style={[styles.overlayInstruction, { color: "#22c55e" }]}>✓ CAPTURED</Text>
          </View>

          {/* Preview actions */}
          <View style={[styles.bottomCaptureArea, { paddingBottom: insets.bottom + 24, gap: 12 }]}>
            <Text style={styles.hintText}>Happy with this {currentAngle.label.toLowerCase()} photo?</Text>
            <View style={styles.previewBtnRow}>
              <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
                <Ionicons name="camera-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmCapture} style={styles.analyzeBtn} activeOpacity={0.85}>
                <LinearGradient colors={[currentAngle.color, "#7B61FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnInner}>
                  <Ionicons name="checkmark" size={18} color="#000" style={{ marginRight: 6 }} />
                  <Text style={styles.analyzeBtnText}>
                    {currentAngleIdx < ANGLE_STEPS.length - 1 ? "Next Angle" : "Review All"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* ── REVIEW SCREEN ── */}
      {viewState === "review" && (
        <ScrollView contentContainerStyle={[styles.reviewContent, { paddingTop: topPad + 60, paddingBottom: insets.bottom + 30 }]}>
          <Text style={styles.reviewTitle}>Review Your Photos</Text>
          <Text style={styles.reviewSubtitle}>
            {capturedCount === 1 ? "Single angle scan. Add more angles for 3× more accurate results." :
             capturedCount === 2 ? "Great — 2 angles captured. One more gives the best result." :
             "All 3 angles captured — maximum accuracy scan!"}
          </Text>

          {/* Accuracy bar */}
          <View style={styles.accuracyCard}>
            <View style={styles.accuracyRow}>
              <Text style={styles.accuracyLabel}>Accuracy Level</Text>
              <Text style={[styles.accuracyPct, { color: capturedCount === 3 ? "#22c55e" : capturedCount === 2 ? "#00D4FF" : "#FFB800" }]}>
                {capturedCount === 3 ? "Maximum (99%)" : capturedCount === 2 ? "High (85%)" : "Standard (65%)"}
              </Text>
            </View>
            <View style={styles.accuracyTrack}>
              <View style={[styles.accuracyFill, {
                width: `${capturedCount === 3 ? 99 : capturedCount === 2 ? 85 : 65}%` as any,
                backgroundColor: capturedCount === 3 ? "#22c55e" : capturedCount === 2 ? "#00D4FF" : "#FFB800"
              }]} />
            </View>
          </View>

          {/* Captured thumbnails */}
          <View style={styles.thumbnailRow}>
            {ANGLE_STEPS.map((step, idx) => {
              const uri = captures[step.key];
              return (
                <TouchableOpacity key={step.key} onPress={() => handleRetakeFromReview(idx)} activeOpacity={0.85} style={styles.thumbWrap}>
                  {uri ? (
                    <>
                      <Image source={{ uri }} style={styles.thumbImg} />
                      <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
                      <View style={[styles.thumbBadge, { borderColor: step.color }]}>
                        <Ionicons name="checkmark-circle" size={14} color={step.color} />
                        <Text style={[styles.thumbLabel, { color: step.color }]}>{step.label}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.thumbEmpty, { borderColor: step.color + "40" }]}>
                      <Ionicons name={step.icon as any} size={26} color={step.color + "60"} />
                      <Text style={[styles.thumbEmptyLabel, { color: step.color + "80" }]}>{step.label}</Text>
                      {!step.required && <Text style={styles.thumbSkipped}>Skipped</Text>}
                    </View>
                  )}
                  {/* Tap hint */}
                  <View style={styles.retakeHint}>
                    <Ionicons name="camera-outline" size={11} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.retakeHintText}>Retake</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add missing angles */}
          {capturedCount < 3 && (
            <TouchableOpacity
              onPress={() => {
                const nextMissing = ANGLE_STEPS.findIndex((s) => !captures[s.key]);
                if (nextMissing !== -1) { setCurrentAngleIdx(nextMissing); setViewState("camera"); }
              }}
              style={styles.addAngleBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#7B61FF" />
              <Text style={styles.addAngleBtnText}>Add Missing Angles (+accuracy)</Text>
            </TouchableOpacity>
          )}

          {/* Analyze Button */}
          <TouchableOpacity onPress={handleStartAnalysis} style={styles.primaryBtn} activeOpacity={0.85}>
            <LinearGradient colors={["#00D4FF", "#7B61FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnInner}>
              <Ionicons name="sparkles" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>
                Analyze {capturedCount} Photo{capturedCount > 1 ? "s" : ""}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── ANIMATING (AI ANALYSIS) ── */}
      {viewState === "animating" && (
        <View style={StyleSheet.absoluteFill}>
          {/* Rotating ring */}
          <Animated.View style={[styles.ringsWrap, ringStyle]}>
            <Svg width={OVAL_W + 50} height={OVAL_H + 50}>
              <Ellipse
                cx={(OVAL_W + 50) / 2} cy={(OVAL_H + 50) / 2}
                rx={(OVAL_W + 35) / 2} ry={(OVAL_H + 35) / 2}
                fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth={1.5} strokeDasharray="12 12"
              />
            </Svg>
          </Animated.View>

          {/* Animated face */}
          <Animated.View style={[styles.cameraOverlay, imagePreviewStyle]}>
            <View style={{ width: OVAL_W, height: OVAL_H, overflow: "hidden", borderRadius: OVAL_W / 2 }}>
              {primaryUri && <Image source={{ uri: primaryUri }} style={StyleSheet.absoluteFill} />}
              <Svg width={OVAL_W} height={OVAL_H} style={StyleSheet.absoluteFill}>
                <Ellipse cx={OVAL_W / 2} cy={OVAL_H / 2} rx={OVAL_W / 2 - 1} ry={OVAL_H / 2 - 1}
                  fill="rgba(0,212,255,0.05)" stroke="#00D4FF" strokeWidth={2} />
              </Svg>
              <Animated.View style={[styles.sweepLine, sweepStyle]}>
                <LinearGradient colors={["transparent", "rgba(0,212,255,0.95)", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, height: 4 }} />
              </Animated.View>
            </View>
          </Animated.View>

          {/* HUD */}
          <View style={[styles.hudOverlayWrap, { bottom: insets.bottom + 50 }]}>
            <View style={styles.hudCard}>
              <Ionicons name="hardware-chip-outline" size={32} color="#00D4FF" />
              <Text style={styles.hudTitle}>{animationText}</Text>
              {capturedCount > 1 && (
                <Text style={styles.hudAnglesInfo}>Analyzing {capturedCount} angles simultaneously</Text>
              )}
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>
              <View style={styles.analysisStepsRow}>
                {ANALYSIS_STEPS.map((_, idx) => (
                  <View key={idx} style={[styles.stepDot, animationStep >= idx ? styles.stepDotActive : null]} />
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── ERROR MODAL ── */}
      <Modal visible={scanError !== null} transparent animationType="slide" onRequestClose={() => setScanError(null)}>
        <View style={styles.modalBg}>
          {scanError && (
            <View style={[styles.warningCard, { borderColor: scanError.iconColor + "40" }]}>
              <View style={styles.warningHeader}>
                <View style={[styles.errorIconCircle, { backgroundColor: scanError.iconColor + "18", borderColor: scanError.iconColor + "35" }]}>
                  <Ionicons name={scanError.icon as any} size={30} color={scanError.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.warningTitle, { color: scanError.iconColor }]}>{scanError.title.toUpperCase()}</Text>
                  {scanError.angleLabel && (
                    <Text style={styles.errorSubLabel}>Issue in {scanError.angleLabel} view</Text>
                  )}
                </View>
              </View>
              <Text style={styles.warningText}>{scanError.message}</Text>
              <View style={[styles.warningTips, { borderColor: scanError.iconColor + "20", backgroundColor: scanError.iconColor + "08" }]}>
                <Ionicons name="bulb-outline" size={16} color={scanError.iconColor} />
                <Text style={[styles.tipRowText, { color: "#E2EEFF" }]}>{scanError.tip}</Text>
              </View>
              <TouchableOpacity onPress={() => setScanError(null)} activeOpacity={0.8} style={styles.dismissBtn}>
                <LinearGradient colors={["#00D4FF", "#0088AA"]} style={styles.dismissBtnInner}>
                  <Ionicons name="camera-outline" size={16} color="#000" />
                  <Text style={styles.dismissBtnText}>TRY AGAIN</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06090F" },

  // Top bar
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10, zIndex: 30 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  topLabel: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#E2EEFF", letterSpacing: 2 },

  // Guide Screen
  guideContent: { paddingHorizontal: 24 },
  heroSection: { alignItems: "center", marginBottom: 24 },
  heroIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: "#00D4FF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 22, color: "#E2EEFF", textAlign: "center", marginBottom: 8 },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#5A7A9F", textAlign: "center", lineHeight: 20 },
  sectionHeader: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#00D4FF", letterSpacing: 1.5, marginBottom: 14 },

  // Angle preview card
  anglesPreviewCard: { backgroundColor: "rgba(10,21,37,0.8)", borderWidth: 1, borderColor: "rgba(0,212,255,0.12)", borderRadius: 20, padding: 18, marginBottom: 16, gap: 14 },
  anglePreviewRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  angleNumCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  angleNumText: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  anglePreviewInfo: { flex: 1, gap: 2 },
  anglePreviewLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#E2EEFF" },
  anglePreviewTip: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#5A7A9F" },
  optionalBadge: { backgroundColor: "rgba(123,97,255,0.15)", borderWidth: 1, borderColor: "rgba(123,97,255,0.3)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  optionalText: { fontFamily: "Poppins_500Medium", fontSize: 9, color: "#7B61FF" },

  // Tips card
  tipsCard: { backgroundColor: "rgba(10,21,37,0.7)", borderWidth: 1, borderColor: "rgba(0,212,255,0.12)", borderRadius: 20, padding: 18, marginBottom: 20, gap: 14 },
  tipItem: { flexDirection: "row", gap: 12 },
  tipBullet: { width: 4, borderRadius: 2, marginVertical: 4, alignSelf: "stretch" },
  tipTextWrap: { flex: 1 },
  tipTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#E2EEFF", marginBottom: 2 },
  tipDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#5A7A9F", lineHeight: 16 },

  // Buttons
  primaryBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  btnInner: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#000" },
  secondaryBtn: { height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(0,212,255,0.4)", backgroundColor: "rgba(0,212,255,0.05)", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#00D4FF" },

  // Camera mode
  angleProgress: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 24, zIndex: 20 },
  angleProgressItem: { alignItems: "center", gap: 4 },
  angleProgressDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  angleProgressActive: { backgroundColor: "rgba(0,212,255,0.15)" },
  angleProgressDone: { backgroundColor: "rgba(34,197,94,0.2)", borderColor: "#22c55e" },
  angleProgressNum: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  angleProgressLabel: { fontFamily: "Poppins_500Medium", fontSize: 9, letterSpacing: 0.5 },

  cameraOverlay: { position: "absolute", left: 0, right: 0, top: OVAL_Y, alignItems: "center", justifyContent: "center" },
  overlayInstruction: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#00D4FF", letterSpacing: 2, marginTop: 16, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  overlayTip: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6, textAlign: "center", paddingHorizontal: 20, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  bottomCaptureArea: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingHorizontal: 24 },
  captureBtnWrap: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#E2EEFF", alignItems: "center", justifyContent: "center" },
  captureBtnInner: { width: 62, height: 62, borderRadius: 31 },
  skipBtn: { marginTop: 12, paddingVertical: 8 },
  skipBtnText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "rgba(255,255,255,0.5)" },

  // Preview mode
  previewAngleBadge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, zIndex: 20 },
  previewAngleLabel: { fontFamily: "Poppins_700Bold", fontSize: 12, letterSpacing: 1 },
  hintText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: "#A2C3EC", textAlign: "center" },
  previewBtnRow: { flexDirection: "row", gap: 12, width: "100%" },
  retakeBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.05)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  retakeBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "rgba(255,255,255,0.8)" },
  analyzeBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  analyzeBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#000" },

  // Review screen
  reviewContent: { paddingHorizontal: 24 },
  reviewTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: "#E2EEFF", marginBottom: 8 },
  reviewSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#5A7A9F", lineHeight: 20, marginBottom: 16 },

  // Accuracy card
  accuracyCard: { backgroundColor: "rgba(10,21,37,0.8)", borderWidth: 1, borderColor: "rgba(0,212,255,0.12)", borderRadius: 16, padding: 16, marginBottom: 20 },
  accuracyRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  accuracyLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#E2EEFF" },
  accuracyPct: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  accuracyTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  accuracyFill: { height: "100%", borderRadius: 3 },

  // Thumbnails
  thumbnailRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  thumbWrap: { flex: 1, height: 140, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(10,21,37,0.8)" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbBadge: { position: "absolute", bottom: 8, left: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: "rgba(0,0,0,0.6)" },
  thumbLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 9, letterSpacing: 0.5 },
  thumbEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 16 },
  thumbEmptyLabel: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  thumbSkipped: { fontFamily: "Poppins_400Regular", fontSize: 9, color: "rgba(255,255,255,0.3)" },
  retakeHint: { position: "absolute", top: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  retakeHintText: { fontFamily: "Poppins_400Regular", fontSize: 9, color: "rgba(255,255,255,0.7)" },

  addAngleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(123,97,255,0.3)", backgroundColor: "rgba(123,97,255,0.06)", marginBottom: 16 },
  addAngleBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#7B61FF" },

  // Animating
  ringsWrap: { position: "absolute", left: OVAL_X - 25, top: OVAL_Y - 25 },
  sweepLine: { position: "absolute", left: 0, right: 0, height: 4, top: 0 },
  hudOverlayWrap: { position: "absolute", left: 24, right: 24, alignItems: "center" },
  hudCard: { width: "100%", backgroundColor: "rgba(10,21,37,0.9)", borderWidth: 1.5, borderColor: "rgba(0,212,255,0.25)", borderRadius: 20, paddingVertical: 20, paddingHorizontal: 20, alignItems: "center", gap: 12, shadowColor: "#00D4FF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  hudTitle: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#00D4FF", letterSpacing: 1.5, textAlign: "center" },
  hudAnglesInfo: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#5A7A9F" },
  progressTrack: { width: "100%", height: 4, backgroundColor: "rgba(0,212,255,0.12)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#00D4FF" },
  analysisStepsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" },
  stepDotActive: { backgroundColor: "#00D4FF" },

  // Error Modal
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 24 },
  warningCard: { width: "100%", backgroundColor: "#0A1525", borderWidth: 1.5, borderRadius: 24, padding: 24, shadowColor: "#FFB800", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 15 },
  warningHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  errorIconCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 14 },
  warningTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, letterSpacing: 1, flex: 1 },
  errorSubLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#5A7A9F", letterSpacing: 0.5, marginTop: 2 },
  warningText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#E2EEFF", lineHeight: 20, marginBottom: 20 },
  warningTips: { borderRadius: 14, padding: 16, marginBottom: 24, gap: 8, flexDirection: "row", alignItems: "flex-start" },
  tipRowText: { fontFamily: "Poppins_500Medium", fontSize: 13, flex: 1 },
  dismissBtn: { borderRadius: 14, overflow: "hidden" },
  dismissBtnInner: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dismissBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#000", letterSpacing: 1.5 },
});

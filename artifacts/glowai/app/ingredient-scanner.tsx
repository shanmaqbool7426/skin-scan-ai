import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Defs, LinearGradient as SvgLG, Stop } from "react-native-svg";

import { analyzeIngredients, type IngredientAnalysisResponse } from "@/services/ingredientApi";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const FRAME_W = width * 0.88;
const FRAME_H = FRAME_W * 0.72;
const CORNER = 20;
const STROKE = 3;

const SCAN_STEPS = [
  { icon: "eye-outline", label: "Reading label..." },
  { icon: "flask-outline", label: "Identifying ingredients..." },
  { icon: "shield-checkmark-outline", label: "Analyzing safety..." },
  { icon: "document-text-outline", label: "Building your report..." },
];

export default function IngredientScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  const scanLineY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const btnScale = useSharedValue(1);
  const frameOpacity = useSharedValue(1);

  React.useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(FRAME_H - 4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  async function handleCapture() {
    if (scanning) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    btnScale.value = withSequence(withTiming(0.88, { duration: 90 }), withTiming(1, { duration: 90 }));
    setScanning(true);
    setStepIndex(0);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, 800);

    try {
      let base64Image = "";

      if (Platform.OS !== "web" && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
        base64Image = photo?.base64 ?? "";
      }

      const result: IngredientAnalysisResponse = await analyzeIngredients(base64Image);

      clearInterval(stepTimer);
      setScanning(false);

      router.push({
        pathname: "/ingredient-results",
        params: { data: JSON.stringify(result) },
      });
    } catch (err) {
      clearInterval(stepTimer);
      setScanning(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Could not analyze ingredients. Please try again.");
    }
  }

  if (!permission) return <View style={[styles.root, { backgroundColor: "#000" }]} />;

  if (!permission.granted) {
    return (
      <LinearGradient colors={["#0D0D14", "#1A1226"]} style={styles.root}>
        <View style={styles.permissionBox}>
          <View style={styles.permIcon}>
            <Ionicons name="flask-outline" size={36} color="#7B61FF" />
          </View>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permSub}>
            Point your camera at a product's ingredient list to instantly analyze what's safe for your skin.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.permBack}>
            <Text style={[styles.permBackText, { color: "rgba(255,255,255,0.5)" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.root}>
      {/* Camera */}
      {Platform.OS !== "web" ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <LinearGradient
          colors={["#0D0D1A", "#111122", "#0D0D1A"]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Dark vignette overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "transparent", "transparent", "rgba(0,0,0,0.82)"]}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Ionicons name="flask-outline" size={16} color="#A58BFF" />
          <Text style={styles.topTitle}>Ingredient Scanner</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Guide text */}
      {!scanning && (
        <View style={styles.guideTextRow}>
          <View style={styles.guidePill}>
            <Text style={styles.guideText}>Point at an ingredient list on a product</Text>
          </View>
        </View>
      )}

      {/* Scan frame */}
      <Animated.View style={[styles.frameWrap, pulseStyle]}>
        <ScanFrame />
        {/* Animated scan line */}
        {!scanning && (
          <Animated.View style={[styles.scanLine, scanLineStyle]} />
        )}
        {/* Scanning overlay */}
        {scanning && (
          <View style={styles.scanningOverlay}>
            <View style={styles.scanningInner}>
              <ActivityIndicator color="#7B61FF" size="large" />
              <Text style={styles.scanningStep}>{SCAN_STEPS[stepIndex].label}</Text>
              <View style={styles.stepDots}>
                {SCAN_STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i <= stepIndex ? "#7B61FF" : "rgba(255,255,255,0.2)" },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Corner labels */}
      {!scanning && (
        <View style={styles.cornerLabels}>
          {["Ingredients list", "Back of bottle / box"].map((t, i) => (
            <View key={i} style={styles.cornerLabelRow}>
              <View style={styles.cornerDot} />
              <Text style={styles.cornerLabelText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom area */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        {!scanning ? (
          <>
            <Text style={styles.bottomHint}>Hold steady — good lighting helps accuracy</Text>

            <Animated.View style={btnStyle}>
              <TouchableOpacity
                onPress={handleCapture}
                activeOpacity={0.85}
                style={styles.captureOuter}
              >
                <LinearGradient
                  colors={["#9B7DFF", "#7B61FF", "#6040E8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.captureInner}
                >
                  <Ionicons name="flask" size={28} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={handleCapture}
              style={styles.demoBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="sparkles-outline" size={14} color="#A58BFF" />
              <Text style={styles.demoBtnText}>Try with demo product</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.scanningStatus}>
            <Text style={styles.scanningStatusTitle}>Analyzing ingredients</Text>
            <Text style={styles.scanningStatusSub}>This usually takes a few seconds</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ScanFrame() {
  return (
    <Svg width={FRAME_W} height={FRAME_H} style={{ position: "absolute", top: 0, left: 0 }}>
      <Defs>
        <SvgLG id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A58BFF" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#7B61FF" stopOpacity="0.9" />
        </SvgLG>
      </Defs>
      {/* Top-left corner */}
      <Rect x={0} y={0} width={CORNER} height={STROKE} fill="url(#frameGrad)" rx={1} />
      <Rect x={0} y={0} width={STROKE} height={CORNER} fill="url(#frameGrad)" rx={1} />
      {/* Top-right corner */}
      <Rect x={FRAME_W - CORNER} y={0} width={CORNER} height={STROKE} fill="url(#frameGrad)" rx={1} />
      <Rect x={FRAME_W - STROKE} y={0} width={STROKE} height={CORNER} fill="url(#frameGrad)" rx={1} />
      {/* Bottom-left corner */}
      <Rect x={0} y={FRAME_H - STROKE} width={CORNER} height={STROKE} fill="url(#frameGrad)" rx={1} />
      <Rect x={0} y={FRAME_H - CORNER} width={STROKE} height={CORNER} fill="url(#frameGrad)" rx={1} />
      {/* Bottom-right corner */}
      <Rect x={FRAME_W - CORNER} y={FRAME_H - STROKE} width={CORNER} height={STROKE} fill="url(#frameGrad)" rx={1} />
      <Rect x={FRAME_W - STROKE} y={FRAME_H - CORNER} width={STROKE} height={CORNER} fill="url(#frameGrad)" rx={1} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(123,97,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(123,97,255,0.3)",
  },
  permTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  permSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permBtn: {
    width: "100%",
    backgroundColor: "#7B61FF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  permBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  permBack: { paddingVertical: 8 },
  permBackText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  topTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  guideTextRow: {
    position: "absolute",
    top: height * 0.17,
    alignItems: "center",
    zIndex: 5,
  },
  guidePill: {
    backgroundColor: "rgba(123,97,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(123,97,255,0.4)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  guideText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
  },
  frameWrap: {
    width: FRAME_W,
    height: FRAME_H,
    marginTop: -FRAME_H * 0.12,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(123,97,255,0.7)",
    shadowColor: "#7B61FF",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 4,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,8,20,0.75)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  scanningInner: {
    alignItems: "center",
    gap: 12,
  },
  scanningStep: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
  },
  stepDots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cornerLabels: {
    position: "absolute",
    bottom: height * 0.31,
    left: width * 0.06,
    gap: 6,
  },
  cornerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cornerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A58BFF",
  },
  cornerLabelText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 14,
  },
  bottomHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
  },
  demoBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#A58BFF",
  },
  scanningStatus: {
    alignItems: "center",
    gap: 4,
    paddingBottom: 16,
  },
  scanningStatusTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  scanningStatusSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
});

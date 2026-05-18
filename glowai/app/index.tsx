import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Image, Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
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
  RadialGradient,
  Stop,
} from "react-native-svg";

import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const faceFront = require("../assets/images/face_front.png");
const faceSide = require("../assets/images/face_side.png");

export default function SplashScreen() {
  const { hasOnboarded, isLoggedIn } = useApp();

  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(18);
  const contentOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const facesOpacity = useSharedValue(0);
  const ring1Rot = useSharedValue(0);
  const ring2Rot = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // All visible immediately, bar animates
    facesOpacity.value = 1;
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
    contentOpacity.value = withTiming(1, { duration: 500 });
    barWidth.value = withTiming(100, { duration: 2600, easing: Easing.out(Easing.cubic) });
    ring1Rot.value = withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1);
    ring2Rot.value = withRepeat(withTiming(-360, { duration: 10000, easing: Easing.linear }), -1);
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1, true
    );

    const t = setTimeout(() => {
      if (!hasOnboarded) router.replace("/onboarding");
      else if (!isLoggedIn) router.replace("/auth");
      else router.replace("/(tabs)");
    }, 3100);
    return () => clearTimeout(t);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` as any }));
  const facesStyle = useAnimatedStyle(() => ({ opacity: facesOpacity.value }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring1Rot.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring2Rot.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  // Face layout dimensions
  const faceAreaH = height * 0.64;
  const sideFaceW = width * 0.56;
  const frontFaceW = width * 0.56;
  const frontFaceH = frontFaceW * 1.1;

  return (
    <View style={styles.root}>

      {/* ── Subtle background gradient ── */}
      <LinearGradient
        colors={["#06090F", "#0A1428", "#06090F"]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Face images section ── */}
      <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, height: faceAreaH }, facesStyle]}>

        {/* Warm glow behind side face — creates contrast */}
        <Svg style={{ position: "absolute", left: -20, top: 0 }} width={sideFaceW + 40} height={faceAreaH} pointerEvents="none">
          <Defs>
            <RadialGradient id="glowSide" cx="50%" cy="38%" rx="55%" ry="52%">
              <Stop offset="0%" stopColor="#C8937A" stopOpacity="0.38" />
              <Stop offset="45%" stopColor="#7B4F3A" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#06090F" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={(sideFaceW + 40) / 2} cy={faceAreaH * 0.35} rx={(sideFaceW + 40) * 0.55} ry={faceAreaH * 0.45} fill="url(#glowSide)" />
        </Svg>

        {/* Cyan glow behind front face — creates contrast */}
        <Svg style={{ position: "absolute", right: -20, top: 0 }} width={frontFaceW + 40} height={faceAreaH} pointerEvents="none">
          <Defs>
            <RadialGradient id="glowFront" cx="50%" cy="35%" rx="50%" ry="48%">
              <Stop offset="0%" stopColor="#D4A57C" stopOpacity="0.20" />
              <Stop offset="40%" stopColor="#0F4060" stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#06090F" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={(frontFaceW + 40) / 2} cy={faceAreaH * 0.32} rx={(frontFaceW + 40) * 0.52} ry={faceAreaH * 0.42} fill="url(#glowFront)" />
        </Svg>

        {/* ── Side profile face (left) ── */}
        <View style={{ position: "absolute", left: 0, top: 0, width: sideFaceW, height: faceAreaH }}>
          <Image
            source={faceSide}
            style={[
              { width: sideFaceW, height: faceAreaH * 0.95, marginTop: faceAreaH * 0.02 },
              Platform.OS === "web" ? ({ mixBlendMode: "screen" } as any) : {},
            ]}
            resizeMode="contain"
          />
          {/* Scan line decorations */}
          <Svg style={StyleSheet.absoluteFill} width={sideFaceW} height={faceAreaH} pointerEvents="none">
            <Circle cx={sideFaceW * 0.42} cy={faceAreaH * 0.28} r={4} fill="#00D4FF" opacity={0.9} />
            <Circle cx={sideFaceW * 0.55} cy={faceAreaH * 0.40} r={3} fill="#00FFA3" opacity={0.8} />
            <Circle cx={sideFaceW * 0.30} cy={faceAreaH * 0.45} r={2.5} fill="#7B61FF" opacity={0.8} />
            <Circle cx={sideFaceW * 0.60} cy={faceAreaH * 0.25} r={2} fill="#00D4FF" opacity={0.7} />
            <Circle cx={sideFaceW * 0.38} cy={faceAreaH * 0.55} r={2} fill="#00FFA3" opacity={0.6} />
          </Svg>
        </View>

        {/* ── Front face (right) with scan rings ── */}
        <View style={{ position: "absolute", right: 0, top: faceAreaH * 0.01, width: frontFaceW, height: frontFaceH, alignItems: "center", justifyContent: "flex-start" }}>

          {/* Outer rotating scan ring */}
          <Animated.View style={[{ position: "absolute", top: -8, left: -8, right: -8, bottom: -8 }, ring1Style]}>
            <Svg width={frontFaceW + 16} height={frontFaceH + 16}>
              <Defs>
                <RadialGradient id="nr" cx="50%" cy="0%" r="80%">
                  <Stop offset="0%" stopColor="#00D4FF" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Ellipse
                cx={(frontFaceW + 16) / 2} cy={(frontFaceH + 16) / 2}
                rx={(frontFaceW + 4) / 2} ry={(frontFaceH + 4) / 2}
                fill="none" stroke="#00D4FF" strokeWidth={1.2}
                strokeDasharray="12 8" strokeOpacity={0.6}
              />
            </Svg>
          </Animated.View>

          {/* Inner pulsing ring */}
          <Animated.View style={[{ position: "absolute", top: 6, left: 6, right: 6, bottom: 6 }, pulseStyle]}>
            <Svg width={frontFaceW - 12} height={frontFaceH - 12}>
              <Ellipse
                cx={(frontFaceW - 12) / 2} cy={(frontFaceH - 12) / 2}
                rx={(frontFaceW - 20) / 2} ry={(frontFaceH - 20) / 2}
                fill="none" stroke="rgba(123,97,255,0.4)" strokeWidth={1}
                strokeDasharray="6 10"
              />
            </Svg>
          </Animated.View>

          {/* Front face image */}
          <Image
            source={faceFront}
            style={[
              { width: frontFaceW, height: frontFaceH },
              Platform.OS === "web" ? ({ mixBlendMode: "screen" } as any) : {},
            ]}
            resizeMode="contain"
          />

          {/* Corner brackets on front face */}
          {[
            { top: 2, left: 2 },
            { top: 2, right: 2 },
            { bottom: 2, left: 2 },
            { bottom: 2, right: 2 },
          ].map((pos, i) => {
            const isRight = "right" in pos;
            const isBottom = "bottom" in pos;
            return (
              <View key={i} style={[styles.bracket, pos as any]}>
                <Svg width={18} height={18}>
                  <Line x1={isRight ? 17 : 1} y1={isBottom ? 17 : 1} x2={isRight ? 17 : 1} y2={isBottom ? 8 : 10} stroke="#00D4FF" strokeWidth={2} strokeLinecap="round" />
                  <Line x1={isRight ? 7 : 1} y1={isBottom ? 17 : 1} x2={isRight ? 17 : 10} y2={isBottom ? 17 : 1} stroke="#00D4FF" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            );
          })}

          {/* Scan dots on front face */}
          <Svg style={StyleSheet.absoluteFill} width={frontFaceW} height={frontFaceH} pointerEvents="none">
            <Circle cx={frontFaceW * 0.42} cy={frontFaceH * 0.28} r={4} fill="#00D4FF" opacity={0.9} />
            <Circle cx={frontFaceW * 0.58} cy={frontFaceH * 0.30} r={3} fill="#00FFA3" opacity={0.8} />
            <Circle cx={frontFaceW * 0.50} cy={frontFaceH * 0.42} r={2.5} fill="#00D4FF" opacity={0.7} />
            <Circle cx={frontFaceW * 0.36} cy={frontFaceH * 0.38} r={2} fill="#7B61FF" opacity={0.8} />
            <Circle cx={frontFaceW * 0.64} cy={frontFaceH * 0.45} r={2} fill="#00D4FF" opacity={0.6} />
          </Svg>
        </View>

        {/* Subtle grid overlay over whole face area */}
        <Svg style={StyleSheet.absoluteFill} width={width} height={faceAreaH} pointerEvents="none">
          {Array.from({ length: 8 }).map((_, i) => {
            const x = (i / 8) * width;
            const y = (i / 8) * faceAreaH;
            return (
              <React.Fragment key={i}>
                <Line x1={x} y1={0} x2={x} y2={faceAreaH} stroke="rgba(0,212,255,0.04)" strokeWidth={1} />
                <Line x1={0} y1={y} x2={width} y2={y} stroke="rgba(0,212,255,0.04)" strokeWidth={1} />
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Gradient fade to dark at the bottom */}
        <LinearGradient
          colors={["transparent", "rgba(6,9,15,0.55)", "#06090F"]}
          locations={[0.45, 0.75, 1]}
          style={[StyleSheet.absoluteFill, { top: faceAreaH * 0.5 }]}
        />
        {/* Side fade gradients so faces bleed into the background naturally */}
        <LinearGradient colors={["#06090F", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 0.08, y: 0.5 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["transparent", "#06090F"]} start={{ x: 0.92, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        {/* Center separator shadow between the two faces */}
        <LinearGradient
          colors={["transparent", "rgba(6,9,15,0.28)", "transparent"]}
          start={{ x: 0.42, y: 0.5 }} end={{ x: 0.58, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── AI status chip ── */}
      <Animated.View style={[styles.statusChip, contentStyle]}>
        <Animated.View style={[styles.statusDot, pulseStyle]} />
        <Text style={styles.statusText}>AI SKIN ANALYSIS READY</Text>
      </Animated.View>

      {/* ── Brand area ── */}
      <View style={[styles.brandArea, { top: faceAreaH * 0.82 }]}>

        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Text style={styles.appName}>
            GLOW<Text style={styles.appNameAccent}>AI</Text>
          </Text>
          <Text style={styles.tagline}>AI SKIN DIAGNOSTICS  ·  NEURAL v2.0</Text>
        </Animated.View>

        <Animated.View style={[styles.progressWrap, contentStyle]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>
          <Text style={styles.progressLabel}>INITIALIZING NEURAL MODELS...</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#06090F",
    overflow: "hidden",
  },
  statusChip: {
    position: "absolute",
    top: Platform.OS === "web" ? 68 : 52,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,10,20,0.8)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00D4FF",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#00D4FF",
    letterSpacing: 1.5,
  },
  brandArea: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 36,
  },
  logoWrap: {
    alignItems: "center",
    gap: 6,
  },
  appName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 46,
    color: "#E2EEFF",
    letterSpacing: 7,
  },
  appNameAccent: {
    color: "#00D4FF",
  },
  tagline: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "rgba(0,212,255,0.6)",
    letterSpacing: 2.5,
  },
  progressWrap: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(0,212,255,0.12)",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#00D4FF",
    borderRadius: 1,
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  progressLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(0,212,255,0.38)",
    letterSpacing: 2,
  },
  bracket: {
    position: "absolute",
    width: 18,
    height: 18,
  },
});

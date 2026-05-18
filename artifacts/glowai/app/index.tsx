import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
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
  LinearGradient as SvgLinearGradient,
  Line,
  RadialGradient,
  Stop,
} from "react-native-svg";

import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");
const NUM_GRID = 10;

export default function SplashScreen() {
  const { hasOnboarded, isLoggedIn } = useApp();

  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(20);
  const tagOpacity = useSharedValue(0);
  const ring1Rotation = useSharedValue(0);
  const ring2Rotation = useSharedValue(0);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withTiming(1, { duration: 800 });
    glowScale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 1600 }), withTiming(0.9, { duration: 1600 })),
      -1, true
    );
    logoOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
    logoY.value = withDelay(400, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
    tagOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    ring1Rotation.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1);
    ring2Rotation.value = withRepeat(withTiming(-360, { duration: 9000, easing: Easing.linear }), -1);
    barWidth.value = withDelay(600, withTiming(100, { duration: 1800, easing: Easing.out(Easing.cubic) }));

    const t = setTimeout(() => {
      if (!hasOnboarded) router.replace("/onboarding");
      else if (!isLoggedIn) router.replace("/auth");
      else router.replace("/(tabs)");
    }, 2800);
    return () => clearTimeout(t);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring1Rotation.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring2Rotation.value}deg` }],
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` as any }));

  return (
    <View style={styles.container}>
      {/* Grid lines */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        {Array.from({ length: NUM_GRID }).map((_, i) => {
          const x = (i / NUM_GRID) * width;
          const y = (i / NUM_GRID) * height;
          return (
            <React.Fragment key={i}>
              <Line x1={x} y1={0} x2={x} y2={height} stroke="rgba(0,212,255,0.04)" strokeWidth={1} />
              <Line x1={0} y1={y} x2={width} y2={y} stroke="rgba(0,212,255,0.04)" strokeWidth={1} />
            </React.Fragment>
          );
        })}
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={height / 2} r={240} fill="url(#glow)" />
      </Svg>

      {/* Ambient glow orb */}
      <Animated.View style={[styles.glowOrb, glowStyle]}>
        <LinearGradient
          colors={["rgba(0,212,255,0.12)", "transparent"]}
          style={styles.glowOrbInner}
        />
      </Animated.View>

      {/* Rotating rings */}
      <Animated.View style={[styles.ringWrap, ring1Style]}>
        <Svg width={260} height={260}>
          <Defs>
            <SvgLinearGradient id="r1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={130} cy={130} r={120} fill="none" stroke="url(#r1)" strokeWidth={1.5} strokeDasharray="12 8" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.ringWrap, ring2Style]}>
        <Svg width={200} height={200}>
          <Circle cx={100} cy={100} r={90} fill="none" stroke="rgba(123,97,255,0.4)" strokeWidth={1} strokeDasharray="6 12" />
        </Svg>
      </Animated.View>

      {/* Logo + title */}
      <Animated.View style={[styles.logoArea, logoStyle]}>
        <View style={styles.logoMark}>
          <Svg width={52} height={52} viewBox="0 0 52 52">
            <Defs>
              <SvgLinearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00D4FF" />
                <Stop offset="100%" stopColor="#00FFA3" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={26} cy={26} r={26} fill="rgba(0,212,255,0.1)" />
            <Circle cx={26} cy={26} r={16} fill="none" stroke="url(#lg)" strokeWidth={2} />
            <Circle cx={26} cy={20} r={5} fill="url(#lg)" />
            <Circle cx={20} cy={30} r={3} fill="rgba(0,212,255,0.7)" />
            <Circle cx={32} cy={30} r={3} fill="rgba(0,255,163,0.7)" />
          </Svg>
        </View>
        <Text style={styles.appName}>GLOW<Text style={styles.appNameAccent}>AI</Text></Text>
      </Animated.View>

      <Animated.View style={[styles.tagWrap, tagStyle]}>
        <Text style={styles.tagline}>AI SKIN DIAGNOSTICS  v2.0</Text>
        <View style={styles.dividerLine}>
          <View style={styles.dividerDot} />
          <View style={styles.dividerTrack}>
            <Animated.View style={[styles.dividerFill, barStyle]} />
          </View>
          <View style={styles.dividerDot} />
        </View>
        <Text style={styles.statusText}>INITIALIZING NEURAL MODELS...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06090F",
    alignItems: "center",
    justifyContent: "center",
  },
  glowOrb: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  glowOrbInner: {
    flex: 1,
    borderRadius: 180,
  },
  ringWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  logoArea: {
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,212,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 34,
    color: "#E2EEFF",
    letterSpacing: 4,
  },
  appNameAccent: {
    color: "#00D4FF",
  },
  tagWrap: {
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  tagline: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(0,212,255,0.7)",
    letterSpacing: 3,
  },
  dividerLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 180,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00D4FF",
  },
  dividerTrack: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,212,255,0.2)",
    overflow: "hidden",
  },
  dividerFill: {
    height: "100%",
    backgroundColor: "#00D4FF",
  },
  statusText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(0,212,255,0.45)",
    letterSpacing: 2,
  },
});

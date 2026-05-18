import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Stop } from "react-native-svg";

import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

export default function SplashScreenPage() {
  const { hasOnboarded, isLoggedIn } = useApp();

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(300, withTiming(1, { duration: 700 }));
    glowOpacity.value = withDelay(400, withTiming(0.6, { duration: 800 }));
    glowScale.value = withDelay(400, withTiming(1, { duration: 800 }));
    tagOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));

    const timer = setTimeout(() => {
      if (!hasOnboarded) {
        router.replace("/onboarding");
      } else if (!isLoggedIn) {
        router.replace("/auth");
      } else {
        router.replace("/(tabs)");
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [hasOnboarded, isLoggedIn]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <LinearGradient
      colors={["#F8F8FC", "#EEE9FF", "#F8F8FC"]}
      style={styles.container}
    >
      <Animated.View style={[styles.glowBg, glowStyle]}>
        <Svg width={300} height={300}>
          <Defs>
            <RadialGradient id="rg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#7B61FF" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={150} fill="url(#rg)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.logoArea, logoStyle]}>
        <View style={styles.logoCircle}>
          <Svg width={56} height={56} viewBox="0 0 56 56">
            <Defs>
              <SvgLinearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#7B61FF" />
                <Stop offset="100%" stopColor="#A58BFF" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={28} cy={28} r={28} fill="url(#lg)" />
            <Circle cx={28} cy={28} r={18} fill="none" stroke="white" strokeWidth={2} />
            <Circle cx={28} cy={22} r={5} fill="white" />
            <Circle cx={22} cy={32} r={3} fill="rgba(255,255,255,0.6)" />
            <Circle cx={34} cy={32} r={3} fill="rgba(255,255,255,0.6)" />
          </Svg>
        </View>
        <Text style={styles.title}>GlowAI</Text>
        <Animated.View style={tagStyle}>
          <Text style={styles.tagline}>AI Skin Partner</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.bottomTag, tagStyle]}>
        <Text style={styles.bottomText}>Powered by AI Dermatology</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8FC",
  },
  glowBg: {
    position: "absolute",
    alignSelf: "center",
  },
  logoArea: {
    alignItems: "center",
  },
  logoCircle: {
    marginBottom: 16,
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    color: "#111111",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#7B61FF",
    marginTop: 4,
  },
  bottomTag: {
    position: "absolute",
    bottom: 60,
  },
  bottomText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#6B6B6B",
  },
});

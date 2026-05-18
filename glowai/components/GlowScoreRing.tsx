import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GlowScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function GlowScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
}: GlowScoreRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1400 });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const label = score >= 80 ? "Optimal" : score >= 60 ? "Fair" : "Critical";
  const labelColor =
    score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.destructive;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00D4FF" />
            <Stop offset="100%" stopColor="#00FFA3" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,212,255,0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#glowGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.score, { color: "#00D4FF" }]}>{score}</Text>
          <Text style={[styles.outOf, { color: colors.mutedForeground }]}>/100</Text>
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  labelContainer: { alignItems: "center", position: "absolute" },
  score: { fontSize: 26, fontFamily: "Poppins_700Bold", lineHeight: 30 },
  outOf: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: -2 },
  label: { fontSize: 11, fontFamily: "Poppins_600SemiBold", marginTop: 2, letterSpacing: 0.5 },
});

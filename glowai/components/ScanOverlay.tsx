import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Ellipse,
  Line,
} from "react-native-svg";

interface ScanOverlayProps {
  width: number;
  height: number;
  scanning?: boolean;
}

export function ScanOverlay({ width, height, scanning = false }: ScanOverlayProps) {
  const scanLineY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (scanning) {
      scanLineY.value = withRepeat(
        withTiming(height * 0.6, { duration: 2000 }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.4, { duration: 800 })
        ),
        -1
      );
    } else {
      scanLineY.value = withTiming(0, { duration: 300 });
      glowOpacity.value = withTiming(0.5, { duration: 300 });
    }
  }, [scanning]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: scanning ? 1 : 0,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ovalCX = width / 2;
  const ovalCY = height * 0.42;
  const ovalRX = width * 0.32;
  const ovalRY = height * 0.38;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Ellipse
          cx={ovalCX}
          cy={ovalCY}
          rx={ovalRX}
          ry={ovalRY}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={2}
          fill="none"
          strokeDasharray="8 4"
        />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = ovalCX + ovalRX * 0.85 * Math.cos(rad);
          const y1 = ovalCY + ovalRY * 0.85 * Math.sin(rad);
          const x2 = ovalCX + ovalRX * Math.cos(rad);
          const y2 = ovalCY + ovalRY * Math.sin(rad);
          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(123,97,255,0.8)"
              strokeWidth={1.5}
            />
          );
        })}
      </Svg>
      {scanning && (
        <Animated.View style={[styles.scanLine, { width: ovalRX * 2 - 20, left: ovalCX - ovalRX + 10 }, scanLineStyle]}>
          <View style={styles.scanLineInner} />
        </Animated.View>
      )}
      <Animated.View style={[styles.cornerTL, glowStyle]} />
      <Animated.View style={[styles.cornerTR, glowStyle]} />
      <Animated.View style={[styles.cornerBL, glowStyle]} />
      <Animated.View style={[styles.cornerBR, glowStyle]} />
    </View>
  );
}

const cornerSize = 20;
const cornerThickness = 3;
const PURPLE = "#7B61FF";

const styles = StyleSheet.create({
  scanLine: {
    position: "absolute",
    top: 0,
    height: 2,
    overflow: "hidden",
  },
  scanLineInner: {
    height: 2,
    backgroundColor: "#7B61FF",
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  cornerTL: {
    position: "absolute",
    top: 24,
    left: 24,
    width: cornerSize,
    height: cornerSize,
    borderTopWidth: cornerThickness,
    borderLeftWidth: cornerThickness,
    borderColor: PURPLE,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: "absolute",
    top: 24,
    right: 24,
    width: cornerSize,
    height: cornerSize,
    borderTopWidth: cornerThickness,
    borderRightWidth: cornerThickness,
    borderColor: PURPLE,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: "absolute",
    bottom: 24,
    left: 24,
    width: cornerSize,
    height: cornerSize,
    borderBottomWidth: cornerThickness,
    borderLeftWidth: cornerThickness,
    borderColor: PURPLE,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: cornerSize,
    height: cornerSize,
    borderBottomWidth: cornerThickness,
    borderRightWidth: cornerThickness,
    borderColor: PURPLE,
    borderBottomRightRadius: 4,
  },
});

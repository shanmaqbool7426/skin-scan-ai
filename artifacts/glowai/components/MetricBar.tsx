import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

interface MetricBarProps {
  label: string;
  value: number;
  color?: string;
}

export function MetricBar({ label, value, color }: MetricBarProps) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(value, { duration: 1000 });
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as unknown as number,
  }));

  const barColor = color ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {value}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.fill, animStyle, { backgroundColor: barColor }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  value: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});

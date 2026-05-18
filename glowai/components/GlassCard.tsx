import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  glow?: boolean;
}

export function GlassCard({ children, style, padding = 16, glow = false }: GlassCardProps) {
  return (
    <View style={[styles.card, glow && styles.cardGlow, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0C1525",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.18)",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardGlow: {
    shadowOpacity: 0.22,
    shadowRadius: 24,
    borderColor: "rgba(0, 212, 255, 0.35)",
  },
});

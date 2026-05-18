import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    icon: "scan-outline" as const,
    title: "AI Skin Scanner",
    subtitle:
      "Advanced AI analyzes your skin in seconds — detecting acne, dark spots, pores, and more.",
    color: "#7B61FF",
    bg: "#EEE9FF",
  },
  {
    id: "2",
    icon: "analytics-outline" as const,
    title: "Face Heatmap",
    subtitle:
      "See exactly where skin concerns are mapped on your face with detailed heat analysis.",
    color: "#A58BFF",
    bg: "#F0EBFF",
  },
  {
    id: "3",
    icon: "sparkles-outline" as const,
    title: "Personalized Routine",
    subtitle:
      "Get a custom skincare routine and AI-recommended products tailored to your skin type.",
    color: "#7B61FF",
    bg: "#EEE9FF",
  },
];

function SlideItem({ item }: { item: (typeof slides)[0] }) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <SvgLinearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#7B61FF" />
              <Stop offset="100%" stopColor="#A58BFF" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={60} cy={60} r={60} fill={item.bg} />
          <Circle cx={60} cy={60} r={40} fill="none" stroke={item.color} strokeWidth={1} strokeDasharray="4 4" />
          <Circle cx={60} cy={60} r={25} fill="none" stroke={item.color} strokeWidth={2} opacity={0.4} />
        </Svg>
        <View style={[styles.iconCenter, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={36} color="white" />
        </View>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const { setHasOnboarded } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : 0;

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      await setHasOnboarded(true);
      router.replace("/auth");
    }
  };

  const handleSkip = async () => {
    await setHasOnboarded(true);
    router.replace("/auth");
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <SlideItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.list}
      />

      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentIndex === i && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.btnArea}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={["#7B61FF", "#A58BFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>
              {isLast ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name={isLast ? "arrow-forward" : "arrow-forward"}
              size={18}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FC" },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#6B6B6B",
  },
  list: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  iconWrap: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
  },
  iconCenter: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#111111",
    textAlign: "center",
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#6B6B6B",
    textAlign: "center",
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E9E9EF",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#7B61FF",
  },
  btnArea: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === "web" ? 50 : 40,
  },
  btn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
});

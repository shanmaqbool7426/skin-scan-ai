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
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient as SvgLG, Path, Rect, Stop } from "react-native-svg";

import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    icon: "scan-outline" as const,
    tag: "SCAN ENGINE v2.0",
    title: "AI Skin Scanner",
    subtitle: "Advanced neural imaging analyzes your skin in seconds — detecting acne, pores, pigmentation, and UV damage with 98.4% accuracy.",
    primary: "#00D4FF",
    secondary: "#00FFA3",
  },
  {
    id: "2",
    icon: "analytics-outline" as const,
    tag: "HEATMAP ANALYSIS",
    title: "Face Diagnostics",
    subtitle: "Visualize exactly where issues are distributed across your face with a real-time thermal heatmap and tissue-layer breakdown.",
    primary: "#7B61FF",
    secondary: "#00D4FF",
  },
  {
    id: "3",
    icon: "flask-outline" as const,
    tag: "INGREDIENT AI",
    title: "Ingredient Scanner",
    subtitle: "Point your camera at any product label. AI identifies every ingredient, flags harmful compounds, and scores formula safety in seconds.",
    primary: "#00FFA3",
    secondary: "#7B61FF",
  },
];

function SlideIllustration({ slide }: { slide: (typeof slides)[0] }) {
  const sz = width * 0.58;
  return (
    <View style={[styles.illustrationWrap, { width: sz, height: sz }]}>
      <Svg width={sz} height={sz} viewBox="0 0 200 200">
        <Defs>
          <SvgLG id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={slide.primary} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={slide.secondary} stopOpacity="0.7" />
          </SvgLG>
          <SvgLG id="inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={slide.primary} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={slide.secondary} stopOpacity="0.05" />
          </SvgLG>
        </Defs>
        {/* Grid */}
        {[40, 80, 120, 160].map((v, i) => (
          <React.Fragment key={i}>
            <Line x1={v} y1={20} x2={v} y2={180} stroke="rgba(0,212,255,0.06)" strokeWidth={1} />
            <Line x1={20} y1={v} x2={180} y2={v} stroke="rgba(0,212,255,0.06)" strokeWidth={1} />
          </React.Fragment>
        ))}
        {/* Outer ring */}
        <Circle cx={100} cy={100} r={88} fill="url(#inner)" stroke="url(#ring)" strokeWidth={1.5} strokeDasharray="10 6" />
        {/* Middle ring */}
        <Circle cx={100} cy={100} r={62} fill="none" stroke={slide.primary} strokeWidth={0.8} strokeOpacity={0.3} />
        {/* Inner hex-like pattern */}
        <Circle cx={100} cy={100} r={38} fill={`${slide.primary}18`} />
        {/* Center icon bg */}
        <Circle cx={100} cy={100} r={26} fill={`${slide.primary}22`} stroke={slide.primary} strokeWidth={1.5} />
        {/* Measurement lines */}
        <Line x1={12} y1={100} x2={38} y2={100} stroke={slide.primary} strokeWidth={1} strokeOpacity={0.5} />
        <Line x1={162} y1={100} x2={188} y2={100} stroke={slide.primary} strokeWidth={1} strokeOpacity={0.5} />
        <Line x1={100} y1={12} x2={100} y2={38} stroke={slide.primary} strokeWidth={1} strokeOpacity={0.5} />
        <Line x1={100} y1={162} x2={100} y2={188} stroke={slide.primary} strokeWidth={1} strokeOpacity={0.5} />
        {/* Corner markers */}
        {[[22,22],[178,22],[22,178],[178,178]].map(([cx,cy],i)=>(
          <React.Fragment key={i}>
            <Rect x={cx - (i%2===0?0:6)} y={cy - 1} width={8} height={2} fill={slide.primary} opacity={0.7} rx={1} />
            <Rect x={cx - 1} y={cy - (i<2?0:6)} width={2} height={8} fill={slide.primary} opacity={0.7} rx={1} />
          </React.Fragment>
        ))}
      </Svg>
      <View style={[styles.illustrationIcon, { backgroundColor: `${slide.primary}18`, borderColor: `${slide.primary}40` }]}>
        <Ionicons name={slide.icon} size={34} color={slide.primary} />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { setHasOnboarded } = useApp();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const barWidth = useSharedValue(1 / slides.length);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
  }));

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      barWidth.value = withTiming((next + 1) / slides.length, { duration: 350 });
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    await setHasOnboarded(true);
    router.replace("/auth");
  };

  const topPad = Platform.OS === "web" ? 67 : 56;
  const slide = slides[currentIndex];

  return (
    <View style={styles.root}>
      {/* Skip */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <View style={styles.topTag}>
          <Text style={styles.topTagText}>GLOWAI</Text>
        </View>
        <TouchableOpacity onPress={handleDone} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressOuter}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { backgroundColor: slide.primary }, barStyle]} />
        </View>
        <Text style={styles.progressCount}>{currentIndex + 1} / {slides.length}</Text>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(i) => i.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <SlideIllustration slide={item} />
            <View style={styles.textArea}>
              <View style={[styles.tagChip, { backgroundColor: `${item.primary}15`, borderColor: `${item.primary}35` }]}>
                <Text style={[styles.tagChipText, { color: item.primary }]}>{item.tag}</Text>
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: (Platform.OS === "web" ? 40 : 48) }]}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex
                  ? [styles.dotActive, { backgroundColor: slide.primary }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.nextBtnWrap}>
          <LinearGradient
            colors={[slide.primary, slide.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex < slides.length - 1 ? "Next" : "Get Started"}
            </Text>
            <Ionicons name={currentIndex < slides.length - 1 ? "arrow-forward" : "checkmark"} size={18} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06090F" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 8,
  },
  topTag: {
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.25)",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  topTagText: {
    fontFamily: "Poppins_700Bold", fontSize: 11, color: "#00D4FF", letterSpacing: 3,
  },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  skipText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#5A7A9F" },
  progressOuter: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, marginBottom: 8,
  },
  progressTrack: {
    flex: 1, height: 2, backgroundColor: "rgba(0,212,255,0.12)", borderRadius: 1, overflow: "hidden",
  },
  progressFill: { height: 2, borderRadius: 1 },
  progressCount: {
    fontFamily: "Poppins_700Bold", fontSize: 11, color: "#3A506B", letterSpacing: 1,
  },
  slide: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  illustrationWrap: { alignItems: "center", justifyContent: "center", marginBottom: 32 },
  illustrationIcon: {
    position: "absolute",
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  textArea: { alignItems: "center", gap: 12, paddingHorizontal: 8 },
  tagChip: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  tagChipText: { fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 2 },
  slideTitle: {
    fontFamily: "Poppins_700Bold", fontSize: 26, color: "#E2EEFF",
    textAlign: "center", lineHeight: 32,
  },
  slideSubtitle: {
    fontFamily: "Poppins_400Regular", fontSize: 14, color: "#5A7A9F",
    textAlign: "center", lineHeight: 22,
  },
  bottom: {
    paddingHorizontal: 24, gap: 20, alignItems: "center",
  },
  dotsRow: { flexDirection: "row", gap: 7 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 24 },
  dotInactive: { width: 8, backgroundColor: "#1E2D47" },
  nextBtnWrap: { width: "100%", borderRadius: 14, overflow: "hidden" },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  nextBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#000" },
});

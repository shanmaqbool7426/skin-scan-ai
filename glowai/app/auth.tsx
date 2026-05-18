import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from "react-native-svg";

import { useApp } from "@/context/AppContext";

export default function AuthScreen() {
  const { setIsLoggedIn } = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleAuth = async () => {
    await setIsLoggedIn(true);
    router.replace("/(tabs)");
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: 48 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Background grid + glow */}
      <View style={styles.bgDecor}>
        <Svg width={300} height={300}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={150} fill="url(#glow)" />
          {Array.from({ length: 8 }).map((_, i) => {
            const x = (i / 8) * 300;
            return (
              <React.Fragment key={i}>
                <Line x1={x} y1={0} x2={x} y2={300} stroke="rgba(0,212,255,0.05)" strokeWidth={1} />
                <Line x1={0} y1={x} x2={300} y2={x} stroke="rgba(0,212,255,0.05)" strokeWidth={1} />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Logo mark */}
      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Ionicons name="scan-outline" size={22} color="#00D4FF" />
        </View>
        <Text style={styles.appName}>GLOW<Text style={styles.appNameAccent}>AI</Text></Text>
      </View>

      <Text style={styles.headline}>
        {tab === "login" ? "Welcome Back" : "Create Account"}
      </Text>
      <Text style={styles.subhead}>
        {tab === "login" ? "Sign in to your AI skin profile" : "Start your AI skin journey"}
      </Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["login", "register"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "login" ? "Sign In" : "Register"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Social buttons */}
      <TouchableOpacity style={styles.socialBtn} onPress={handleAuth} activeOpacity={0.85}>
        <Ionicons name="logo-google" size={18} color="#E2EEFF" />
        <Text style={styles.socialBtnText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.socialBtn, styles.socialBtnApple]} onPress={handleAuth} activeOpacity={0.85}>
        <Ionicons name="logo-apple" size={18} color="#000" />
        <Text style={[styles.socialBtnText, { color: "#000" }]}>Continue with Apple</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      {/* Fields */}
      {tab === "register" && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color="#5A7A9F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#3A506B"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={16} color="#5A7A9F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#3A506B"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>PASSWORD</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={16} color="#5A7A9F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#3A506B"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? "eye" : "eye-off"} size={16} color="#5A7A9F" />
          </TouchableOpacity>
        </View>
      </View>

      {tab === "login" && (
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleAuth} activeOpacity={0.88} style={styles.mainBtnWrap}>
        <LinearGradient
          colors={["#00D4FF", "#00A8CC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mainBtn}
        >
          <Text style={styles.mainBtnText}>
            {tab === "login" ? "Sign In" : "Create Account"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
        </Text>
        <TouchableOpacity onPress={() => setTab(tab === "login" ? "register" : "login")}>
          <Text style={styles.switchLink}>{tab === "login" ? "Register" : "Sign In"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.termsRow}>
        <Text style={styles.termsText}>By continuing, you agree to our </Text>
        <Text style={styles.termsLink}>Terms</Text>
        <Text style={styles.termsText}> and </Text>
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06090F" },
  content: { paddingHorizontal: 24 },
  bgDecor: { position: "absolute", right: -50, top: 80, opacity: 0.6 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 },
  logoMark: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  appName: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#E2EEFF", letterSpacing: 3 },
  appNameAccent: { color: "#00D4FF" },
  headline: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#E2EEFF", marginBottom: 6 },
  subhead: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#5A7A9F", marginBottom: 28 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#0F1D35",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: "rgba(0,212,255,0.15)", borderWidth: 1, borderColor: "rgba(0,212,255,0.3)" },
  tabBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#3A506B" },
  tabBtnTextActive: { color: "#00D4FF" },
  socialBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1, borderColor: "rgba(0,212,255,0.2)",
    backgroundColor: "#0C1525", borderRadius: 13,
    paddingVertical: 14, marginBottom: 10,
  },
  socialBtnApple: { backgroundColor: "#E2EEFF", borderColor: "transparent" },
  socialBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#E2EEFF" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: "rgba(0,212,255,0.12)" },
  orText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: "#3A506B", letterSpacing: 1 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: "Poppins_700Bold", fontSize: 10, color: "#5A7A9F",
    letterSpacing: 2, marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0C1525",
    borderWidth: 1, borderColor: "rgba(0,212,255,0.15)",
    borderRadius: 12, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14,
    fontFamily: "Poppins_400Regular", fontSize: 14,
    color: "#E2EEFF",
  },
  eyeBtn: { padding: 4 },
  forgotRow: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#00D4FF" },
  mainBtnWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 20, marginTop: 4 },
  mainBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  mainBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#000" },
  switchRow: { flexDirection: "row", justifyContent: "center", marginBottom: 16 },
  switchText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#5A7A9F" },
  switchLink: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#00D4FF" },
  termsRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  termsText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#3A506B" },
  termsLink: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#5A7A9F" },
});

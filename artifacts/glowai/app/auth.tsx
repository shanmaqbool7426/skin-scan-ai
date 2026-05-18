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
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { useApp } from "@/context/AppContext";

export default function AuthScreen() {
  const { setIsLoggedIn } = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bgDecor}>
        <Svg width={280} height={280}>
          <Defs>
            <RadialGradient id="rg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#7B61FF" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={140} cy={140} r={140} fill="url(#rg)" />
        </Svg>
      </View>

      <View style={styles.headerArea}>
        <Text style={styles.welcome}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          {tab === "login"
            ? "Let's Glow Together ✦"
            : "Start your glow journey"}
        </Text>
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialBtn} onPress={handleAuth}>
          <Ionicons name="logo-google" size={20} color="#111" />
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#111" }]} onPress={handleAuth}>
          <Ionicons name="logo-apple" size={20} color="white" />
          <Text style={[styles.socialText, { color: "white" }]}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      {tab === "register" && (
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color="#6B6B6B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#B0B0B0"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>
      )}

      <View style={styles.inputWrap}>
        <Ionicons name="mail-outline" size={18} color="#6B6B6B" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email or Phone"
          placeholderTextColor="#B0B0B0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputWrap}>
        <Ionicons name="lock-closed-outline" size={18} color="#6B6B6B" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          placeholderTextColor="#B0B0B0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
        />
        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
          <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={18} color="#6B6B6B" />
        </TouchableOpacity>
      </View>

      {tab === "login" && (
        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleAuth} activeOpacity={0.85} style={styles.btnWrap}>
        <LinearGradient
          colors={["#7B61FF", "#A58BFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>
            {tab === "login" ? "Login" : "Create Account"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
        </Text>
        <TouchableOpacity onPress={() => setTab(tab === "login" ? "register" : "login")}>
          <Text style={styles.switchLink}>
            {tab === "login" ? "Sign Up" : "Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FC" },
  content: { paddingHorizontal: 28 },
  bgDecor: {
    position: "absolute",
    top: -40,
    right: -60,
    opacity: 0.7,
  },
  headerArea: { marginBottom: 32 },
  welcome: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#111111",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#7B61FF",
  },
  socialRow: { gap: 12, marginBottom: 24 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E9EF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  socialText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#111111",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#E9E9EF" },
  orText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#6B6B6B" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E9EF",
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#111111",
  },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24, marginTop: -4 },
  forgotText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "#7B61FF",
  },
  btnWrap: { marginBottom: 20 },
  btn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B6B6B",
  },
  switchLink: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#7B61FF",
  },
});

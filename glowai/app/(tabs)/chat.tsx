import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type ChatMessage } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const BOT_REPLIES: Record<string, string> = {
  default: "Based on your skin profile, I recommend staying consistent with your routine. Hyaluronic acid layered under a ceramide moisturizer will significantly improve barrier function and hydration scores.",
  acne: "For acne-prone skin: salicylic acid cleanser twice daily, niacinamide 10% for inflammation, and benzoyl peroxide spot treatment. Avoid touching your face — it transfers bacteria and oils.",
  "dark spots": "Dark spots respond well to a Vitamin C serum (L-ascorbic acid 15–20%) in the morning. Pair with SPF 50+ and niacinamide at night. Results typically visible in 6–8 weeks.",
  hydration: "Layer hydration: apply a hyaluronic acid serum on damp skin, then seal with a ceramide moisturizer. Humectants like glycerin and sodium PCA also significantly boost water retention.",
  sunscreen: "SPF is the single most important anti-aging step. Use broad-spectrum SPF 50+ daily — even indoors (UVA penetrates glass). Reapply every 2 hours when outdoors.",
  routine: "Optimal routine: AM — gentle cleanser, Vitamin C, moisturizer, SPF 50+. PM — oil cleanser, treatment (retinol or AHA), barrier cream. Consistency over 8 weeks shows measurable improvement.",
  ingredients: "Open the Ingredient Scanner to analyze any product. I can also explain specific ingredients — just ask about any compound like 'retinol', 'niacinamide', or 'hyaluronic acid'.",
};

const QUICK_PROMPTS = [
  "Help with acne",
  "Dark spots treatment",
  "Hydration protocol",
  "Best sunscreen",
  "Morning routine",
  "Scan ingredients",
];

function getReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("acne") || lower.includes("breakout") || lower.includes("pimple")) return BOT_REPLIES.acne;
  if (lower.includes("dark spot") || lower.includes("pigment") || lower.includes("hyperpig")) return BOT_REPLIES["dark spots"];
  if (lower.includes("hydrat") || lower.includes("dry") || lower.includes("moisture")) return BOT_REPLIES.hydration;
  if (lower.includes("sunscreen") || lower.includes("spf") || lower.includes("sun")) return BOT_REPLIES.sunscreen;
  if (lower.includes("routine") || lower.includes("regimen") || lower.includes("schedule")) return BOT_REPLIES.routine;
  if (lower.includes("ingredient") || lower.includes("product") || lower.includes("formula")) return BOT_REPLIES.ingredients;
  return BOT_REPLIES.default;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const isUser = msg.isUser;

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.botAvatar}>
          <Ionicons name="medical-outline" size={14} color="#000" />
        </LinearGradient>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: "#00D4FF" }]
            : [styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? "#000" : colors.foreground }]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: isUser ? "rgba(0,0,0,0.5)" : colors.mutedForeground }]}>
          {msg.time}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { chatMessages, addChatMessage } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60 + 8;

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      text: text.trim(),
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    addChatMessage(userMsg);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        text: getReply(text),
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      addChatMessage(botMsg);
      setTyping(false);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior="padding">
      {/* Header */}
      <LinearGradient
        colors={["#0A1525", "#06090F"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.botInfo}>
          <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.headerAvatar}>
            <Ionicons name="medical-outline" size={20} color="#000" />
          </LinearGradient>
          <View>
            <Text style={[styles.botName, { color: colors.foreground }]}>AI Dermatologist</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.success }]}>Online · Instant responses</Text>
            </View>
          </View>
        </View>
        <View style={[styles.modelBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.modelText, { color: colors.mutedForeground }]}>GPT-4o</Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={chatMessages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 16 }}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={() => (
          <View style={styles.emptyChat}>
            <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.emptyChatIcon}>
              <Ionicons name="medical-outline" size={32} color="#000" />
            </LinearGradient>
            <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>AI Dermatologist</Text>
            <Text style={[styles.emptyChatSub, { color: colors.mutedForeground }]}>
              Ask me about your skin concerns, ingredients, or routine. I analyze your scan data for personalized advice.
            </Text>
          </View>
        )}
        ListFooterComponent={
          typing ? (
            <View style={styles.typingRow}>
              <LinearGradient colors={["#00D4FF", "#00A8CC"]} style={styles.botAvatar}>
                <Ionicons name="medical-outline" size={14} color="#000" />
              </LinearGradient>
              <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                ))}
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick prompts */}
      <FlatList
        data={QUICK_PROMPTS}
        horizontal
        keyExtractor={(p) => p}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.promptsRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => sendMessage(item)}
            style={[styles.promptChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.promptText, { color: colors.primary }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Input */}
      <View style={[styles.inputArea, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 8, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Ask your AI dermatologist..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            style={[styles.sendBtn, { backgroundColor: input.trim() ? "#00D4FF" : colors.muted }]}
          >
            <Ionicons name="arrow-up" size={18} color={input.trim() ? "#000" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  botInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  botName: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  modelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  modelText: { fontFamily: "Poppins_700Bold", fontSize: 11, letterSpacing: 0.5 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 14 },
  msgRowUser: { flexDirection: "row-reverse" },
  botAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12, gap: 4, borderWidth: 1 },
  bubbleUser: { borderRadius: 16, borderTopRightRadius: 4, borderWidth: 0 },
  bubbleBot: { borderTopLeftRadius: 4 },
  bubbleText: { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontFamily: "Poppins_400Regular", fontSize: 10, alignSelf: "flex-end" },
  typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 14 },
  typingBubble: { flexDirection: "row", gap: 5, padding: 12, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, opacity: 0.7 },
  emptyChat: { alignItems: "center", paddingVertical: 40, gap: 14, paddingHorizontal: 24 },
  emptyChatIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyChatTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  emptyChatSub: { fontFamily: "Poppins_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  promptsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  promptChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  promptText: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  inputArea: { paddingHorizontal: 14, paddingTop: 8, borderTopWidth: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1,
  },
  input: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, maxHeight: 100, paddingTop: 4 },
  sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});

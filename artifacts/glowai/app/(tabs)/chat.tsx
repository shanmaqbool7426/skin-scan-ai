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
  default: "That's a great question! Based on your skin profile, I recommend staying consistent with your routine and using products with hyaluronic acid for better hydration.",
  acne: "For acne-prone skin, I recommend using a salicylic acid cleanser twice daily and avoiding heavy creams. Also, try not to touch your face throughout the day.",
  "dark spots": "Dark spots can be treated with Vitamin C serums in the morning and niacinamide at night. Always use SPF 50+ to prevent them from getting darker.",
  hydration: "For better hydration, layer a hydrating serum before your moisturizer. Look for ingredients like hyaluronic acid, ceramides, and glycerin.",
  sunscreen: "SPF is the most important step in skincare! Use at least SPF 30 daily, even indoors. Reapply every 2 hours when outside.",
  routine: "A simple routine: morning — cleanser, vitamin C, moisturizer, SPF. Evening — cleanser, treatment (retinol or acid), moisturizer. Keep it consistent!",
};

const QUICK_PROMPTS = [
  "Help with acne",
  "Dark spots treatment",
  "Hydration tips",
  "Best sunscreen",
  "My routine",
];

function getReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("acne")) return BOT_REPLIES.acne;
  if (lower.includes("dark spot") || lower.includes("pigment")) return BOT_REPLIES["dark spots"];
  if (lower.includes("hydrat") || lower.includes("dry")) return BOT_REPLIES.hydration;
  if (lower.includes("sunscreen") || lower.includes("spf")) return BOT_REPLIES.sunscreen;
  if (lower.includes("routine")) return BOT_REPLIES.routine;
  return BOT_REPLIES.default;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const isUser = msg.isUser;

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.botAvatar}>
          <Ionicons name="medical-outline" size={16} color="white" />
        </LinearGradient>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? "white" : colors.foreground }]}>
          {msg.text}
        </Text>
        <Text style={[styles.timestamp, { color: isUser ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
          {msg.timestamp}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { chatMessages, addChatMessage } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const sendMessage = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    addChatMessage({
      id: `${Date.now()}u`,
      text: msg,
      isUser: true,
      timestamp: timeStr,
    });
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      addChatMessage({
        id: `${Date.now()}b`,
        text: getReply(msg),
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      flatRef.current?.scrollToEnd({ animated: true });
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.doctorAvatar}>
            <Ionicons name="medical-outline" size={22} color="white" />
          </LinearGradient>
          <View>
            <Text style={[styles.doctorName, { color: colors.foreground }]}>AI Skin Doctor</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.success }]}>Always here to help</Text>
            </View>
          </View>
        </View>
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.mutedForeground} />
      </View>

      <FlatList
        ref={flatRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.msgRow]}>
              <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.botAvatar}>
                <Ionicons name="medical-outline" size={16} color="white" />
              </LinearGradient>
              <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.bubbleText, { color: colors.mutedForeground }]}>Analyzing...</Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.quickRow}>
        <FlatList
          horizontal
          data={QUICK_PROMPTS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => sendMessage(item)}
              style={[styles.quickChip, { backgroundColor: colors.lavender }]}
            >
              <Text style={[styles.quickChipText, { color: colors.primary }]}>{item}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        />
      </View>

      <View style={[styles.inputRow, { paddingBottom: bottomPad + 8, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Ask anything..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity onPress={() => sendMessage(input)} activeOpacity={0.8}>
          <LinearGradient colors={["#7B61FF", "#A58BFF"]} style={styles.sendBtn}>
            <Ionicons name="send" size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9EF",
    backgroundColor: "white",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  doctorAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  doctorName: { fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  msgRowUser: { flexDirection: "row-reverse" },
  botAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 12 },
  bubbleText: { fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 },
  timestamp: { fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 4, textAlign: "right" },
  quickRow: { paddingVertical: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  quickChipText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    backgroundColor: "white",
  },
  inputField: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    maxHeight: 100,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});

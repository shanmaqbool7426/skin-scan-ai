import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SkinIssue {
  type: string;
  severity: "Low" | "Mild" | "Moderate" | "High" | "Severe";
  count: number;
  color: string;
}

export interface ScanResult {
  id: string;
  date: string;
  glowScore: number;
  issues: SkinIssue[];
  skinType: string;
  hydration: number;
  clarity: number;
  smoothness: number;
  glow: number;
  clinicalSummary?: string;
  recommendations?: string[];
}

export interface UserProfile {
  name: string;
  skinType: string;
  age: number;
  isPremium: boolean;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export interface WeeklyScore {
  week: string;
  score: number;
}

export const BASE_URL = "http://192.168.1.109:3000";

interface AppContextType {
  user: UserProfile;
  scanHistory: ScanResult[];
  latestScan: ScanResult | null;
  chatMessages: ChatMessage[];
  weeklyScores: WeeklyScore[];
  hasOnboarded: boolean;
  isLoggedIn: boolean;
  token: string | null;
  setHasOnboarded: (v: boolean) => void;
  setIsLoggedIn: (v: boolean) => void;
  setToken: (v: string | null) => void;
  addScanResult: (result: ScanResult) => void;
  addChatMessage: (msg: ChatMessage) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const defaultUser: UserProfile = {
  name: "Ayesha Khan",
  skinType: "Combination",
  age: 26,
  isPremium: false,
};

const defaultScan: ScanResult = {
  id: "scan_default",
  date: "May 15, 2026",
  glowScore: 82,
  issues: [
    { type: "Acne", severity: "Mild", count: 3, color: "#FF6B6B" },
    { type: "Dark Spots", severity: "Moderate", count: 5, color: "#F59E0B" },
    { type: "Pores", severity: "High", count: 12, color: "#6B6B6B" },
    { type: "Redness", severity: "Mild", count: 2, color: "#EF4444" },
    { type: "Dryness", severity: "Mild", count: 1, color: "#3B82F6" },
  ],
  skinType: "Combination",
  hydration: 85,
  clarity: 75,
  smoothness: 88,
  glow: 82,
};

const defaultScores: WeeklyScore[] = [
  { week: "W1", score: 70 },
  { week: "W2", score: 74 },
  { week: "W3", score: 78 },
  { week: "W4", score: 82 },
];

const defaultMessages: ChatMessage[] = [
  {
    id: "bot_intro",
    text: "Hi Ayesha! I'm your AI skin doctor. How can I help you today?",
    isUser: false,
    timestamp: "10:00 AM",
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([defaultScan]);
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(defaultMessages);
  const [weeklyScores] = useState<WeeklyScore[]>(defaultScores);
  const [hasOnboarded, setHasOnboardedState] = useState(false);
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const [onboarded, loggedIn, userData, savedToken] = await Promise.all([
          AsyncStorage.getItem("hasOnboarded"),
          AsyncStorage.getItem("isLoggedIn"),
          AsyncStorage.getItem("userData"),
          AsyncStorage.getItem("jwtToken"),
        ]);
        if (onboarded === "true") setHasOnboardedState(true);
        if (loggedIn === "true") setIsLoggedInState(true);
        if (userData) setUser(JSON.parse(userData));
        if (savedToken) setTokenState(savedToken);
      } catch (_) {}
    };
    loadStorage();
  }, []);

  const setHasOnboarded = useCallback(async (v: boolean) => {
    setHasOnboardedState(v);
    await AsyncStorage.setItem("hasOnboarded", v ? "true" : "false");
  }, []);

  const setIsLoggedIn = useCallback(async (v: boolean) => {
    setIsLoggedInState(v);
    await AsyncStorage.setItem("isLoggedIn", v ? "true" : "false");
  }, []);

  const setToken = useCallback(async (v: string | null) => {
    setTokenState(v);
    if (v) await AsyncStorage.setItem("jwtToken", v);
    else await AsyncStorage.removeItem("jwtToken");
  }, []);

  const addScanResult = useCallback((result: ScanResult) => {
    setScanHistory((prev) => [result, ...prev]);
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("userData", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const latestScan = scanHistory[0] ?? null;

  return (
    <AppContext.Provider
      value={{
        user,
        scanHistory,
        latestScan,
        chatMessages,
        weeklyScores,
        hasOnboarded,
        isLoggedIn,
        token,
        setHasOnboarded,
        setIsLoggedIn,
        setToken,
        addScanResult,
        addChatMessage,
        updateUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

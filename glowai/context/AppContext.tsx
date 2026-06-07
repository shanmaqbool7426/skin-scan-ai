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
  imagePath?: string;
}

export interface UserProfile {
  name: string;
  skinType: string;
  age: number;
  isPremium: boolean;
  avatar?: string;
  email?: string;
}

import { Platform } from "react-native";
import Constants from "expo-constants";

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

// Dynamically determine the backend URL based on platform and environment
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }
  
  // For mobile app, use the Metro bundler host IP to find local backend
  const debuggerHost = Constants.expoConfig?.hostUri || '';
  const ip = debuggerHost.split(':')[0];
  if (ip) {
    return `http://${ip}:3000`;
  }
  
  return 'http://localhost:3000'; // Fallback
};

export const BASE_URL = getBackendUrl();

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
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  fetchUserProfile: () => Promise<void>;
  fetchScanHistory: () => Promise<void>;
  logout: () => Promise<void>;
}

const defaultUser: UserProfile = {
  name: "Guest",
  skinType: "Combination",
  age: 25,
  isPremium: false,
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
    text: "Hi! I'm your AI skin doctor. How can I help you today?",
    isUser: false,
    timestamp: "10:00 AM",
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultMessages);
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>(defaultScores);
  const [hasOnboarded, setHasOnboardedState] = useState(false);
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);

  // Core API fetch helper
  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    // Read token state dynamically, fallback to storage if not loaded in state yet
    const activeToken = token || (await AsyncStorage.getItem("jwtToken"));
    
    const headers = {
      "Content-Type": "application/json",
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...(options.headers || {}),
    } as any;

    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.validationFailed || errorData.failureCode) {
          throw new Error(JSON.stringify(errorData));
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API Fetch Error [${endpoint}]:`, err.message || err);
      throw err;
    }
  }, [token]);

  // Fetch current user details from API
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await apiFetch("/api/user/me");
      if (res.user) {
        const profile: UserProfile = {
          name: res.user.name,
          skinType: res.user.skinType,
          age: res.user.age,
          isPremium: res.user.isPremium,
          avatar: res.user.avatar,
          email: res.user.email,
        };
        setUser(profile);
        await AsyncStorage.setItem("userData", JSON.stringify(profile));
      }
    } catch (err) {
      console.error("fetchUserProfile failed:", err);
      // If unauthorized, logout
      if (err instanceof Error && err.message.includes("401")) {
        logout();
      }
    }
  }, [apiFetch]);

  // Fetch scan history from API
  const fetchScanHistory = useCallback(async () => {
    try {
      const res = await apiFetch("/api/scans");
      if (res.scans && Array.isArray(res.scans)) {
        setScanHistory(res.scans);
      }
    } catch (err) {
      console.error("fetchScanHistory failed:", err);
    }
  }, [apiFetch]);

  // Load storage on startup
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
        if (savedToken) {
          setTokenState(savedToken);
          // Sync database data on start if token exists
          setTimeout(() => {
            fetchUserProfile().catch(() => {});
            fetchScanHistory().catch(() => {});
          }, 100);
        }
      } catch (_) {}
    };
    loadStorage();
  }, [fetchUserProfile, fetchScanHistory]);

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
    if (v) {
      await AsyncStorage.setItem("jwtToken", v);
      await AsyncStorage.setItem("isLoggedIn", "true");
      setIsLoggedInState(true);
      // Fetch user profile and history right after log in
      setTimeout(() => {
        fetchUserProfile().catch(() => {});
        fetchScanHistory().catch(() => {});
      }, 50);
    } else {
      await logout();
    }
  }, [fetchUserProfile, fetchScanHistory]);

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

    if (token) {
      try {
        await apiFetch("/api/user/me", {
          method: "PUT",
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error("Failed to sync profile update to server:", err);
      }
    }
  }, [token, apiFetch]);

  const logout = useCallback(async () => {
    setTokenState(null);
    setIsLoggedInState(false);
    setUser(defaultUser);
    setScanHistory([]);
    await Promise.all([
      AsyncStorage.removeItem("jwtToken"),
      AsyncStorage.setItem("isLoggedIn", "false"),
      AsyncStorage.removeItem("userData"),
    ]);
  }, []);

  const latestScan = scanHistory[0] ?? null;

  // Dynamically update weekly scores based on the actual user scan scores if available
  useEffect(() => {
    if (scanHistory.length > 0) {
      // Map last 4 scans or less to W1-W4
      const recentScans = [...scanHistory].slice(0, 4).reverse();
      const scores = recentScans.map((scan, idx) => ({
        week: `Scan ${recentScans.length - idx}`,
        score: scan.glowScore,
      }));
      if (scores.length > 0) {
        setWeeklyScores(scores);
      }
    } else {
      setWeeklyScores(defaultScores);
    }
  }, [scanHistory]);

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
        apiFetch,
        fetchUserProfile,
        fetchScanHistory,
        logout,
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

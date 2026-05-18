# GlowAI

AI-powered skincare mobile app that analyzes skin with camera, provides personalized routines, tracks progress, and connects users with an AI dermatologist chatbot.

## Run & Operate

- `pnpm --filter @workspace/glowai run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native, Expo Router (file-based routing)
- Font: Poppins (via @expo-google-fonts/poppins)
- State: React Context + AsyncStorage (no backend for first build)
- Charts: react-native-svg
- Icons: @expo/vector-icons (Ionicons)
- Camera: expo-camera

## Where things live

- `artifacts/glowai/` — Expo mobile app
- `artifacts/glowai/app/` — All screens (Expo Router)
- `artifacts/glowai/app/(tabs)/` — Tab screens (Home, Progress, Chat, Profile)
- `artifacts/glowai/context/AppContext.tsx` — Global app state
- `artifacts/glowai/constants/colors.ts` — GlowAI design tokens
- `artifacts/glowai/components/` — Reusable UI components
- `artifacts/api-server/` — Express API server

## Architecture decisions

- Frontend-only for first build; all data stored in AsyncStorage via AppContext
- Poppins font for premium luxury feel matching design spec
- GlowAI color palette: Primary #7B61FF, Background #F8F8FC, Card white
- 5-tab navigation: Home, Progress, [Scan FAB], AI Doctor, Profile
- Camera scan simulates AI analysis with randomized realistic results
- Dark premium theme for Premium subscription screen

## Product

- AI skin scanning with camera overlay and face mesh
- Glow score system (0-100) with animated ring gauge
- Face heatmap analysis with color-coded skin zone issues
- AI dermatologist chatbot with smart contextual replies
- Morning/Night routine tracker with step completion
- Product recommendations with filtering and cart
- Before/after progress tracking with SVG line charts
- Premium subscription screen with monthly/annual plans
- Hydration and sunscreen reminders
- Full onboarding flow → auth → main app

## User preferences

- Design: White + soft black, luxury skincare aesthetic, glassmorphism cards
- Color: #7B61FF primary purple, #F8F8FC background
- Font: Poppins (all weights)
- Border radius: 20px
- No emojis in UI (icons only)

## Gotchas

- Always use `restart_workflow` to restart Expo, never shell `npx expo`
- Never change bundle identifier after setup
- expo-camera requires permission request on first use
- SVG animations use react-native-reanimated (not CSS)

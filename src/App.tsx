import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import TitleBar from "./components/TitleBar";

// Eagerly load Landing for instant first paint
import Landing from "./pages/Landing";
const Chat = lazy(() => import("./pages/Chat"));
const FaceAuthGate = lazy(() => import("./components/FaceAuthGate"));

const Settings = lazy(() => import("./pages/Settings"));
const History = lazy(() => import("./pages/History"));
const Ratings = lazy(() => import("./pages/Ratings"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BridgeSetup = lazy(() => import("./pages/BridgeSetup"));
const BridgeFeatures = lazy(() => import("./pages/BridgeFeatures"));
const SharedConversation = lazy(() => import("./pages/SharedConversation"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));

const Vibecoding = lazy(() => import("./pages/Vibecoding"));
const AvatarChat = lazy(() => import("./pages/AvatarChat"));
const UpdateHistory = lazy(() => import("./pages/UpdateHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ApiKeyOnboarding = lazy(() => import("./components/ApiKeyOnboarding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse">Loading ALSA AI...</p>
    </div>
  </div>
);

// Check if running inside Electron environment or loaded via file system
const isElectron = typeof window !== "undefined" &&
  (window.location.protocol === "file:" || !!(window as any).electron || navigator.userAgent.toLowerCase().includes("electron"));

// Automatically select HashRouter for Electron Desktop and BrowserRouter for Web
const Router = isElectron ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <TitleBar />
        <Suspense fallback={<PageLoader />}>
          <ApiKeyOnboarding />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/Chat" element={<FaceAuthGate><Chat /></FaceAuthGate>} />
            <Route path="/Chats" element={<Navigate to="/Chat" replace />} />

            <Route path="/pricing" element={<Pricing />} />
            <Route path="/ratings" element={<Ratings />} />
            <Route path="/bridge-setup" element={<BridgeSetup />} />
            <Route path="/bridge-features" element={<BridgeFeatures />} />
            <Route path="/c/:conversationId" element={<FaceAuthGate><Chat /></FaceAuthGate>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/vibecoding" element={<Vibecoding />} />
            <Route path="/avatar-chat" element={<AvatarChat />} />
            <Route path="/update-history" element={<UpdateHistory />} />

            <Route path="/share/:shareToken" element={<SharedConversation />} />
            <Route path="/zx-control-9k2" element={<ProtectedRoute redirectTo="/auth"><Admin /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/404" replace />} />
            <Route path="/admin/*" element={<Navigate to="/404" replace />} />
            <Route path="/dashboard" element={<Navigate to="/404" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/404" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
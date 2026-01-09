import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import FrontDeskPage from "./pages/front-desk";
import StaffsPage from "./pages/staffs";
import StudentsPage from "./pages/students";
import ClassesPage from "./pages/classes";
import CalendarPage from "./pages/calendar";
import MessagingPage from "./pages/messaging";
import FeesPage from "./pages/fees";
import SettingsPage from "./pages/settings";
import FormAssignments from "./pages/intake-forms/FormAssignments";
import FormSubmissions from "./pages/intake-forms/FormSubmissions";
import AiAssistantPage from "./pages/AiAssistantPage";
import StyleGuide from "./pages/StyleGuide";
import Login from "./pages/Login";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatNotificationProvider } from "./context/ChatNotificationContext";
import { PermissionProvider } from "./context/PermissionContext";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import { AiAssistantProvider, AiAssistantLayout, AiAssistantPanel } from "./components/AiAssistant/AiAssistantPanel";
import { AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

function BeforeSchoolAlert() {
  const { isBeforeSchoolHours, schoolSettings } = useApp();
  const [dismissed, setDismissed] = useState(false);

  if (!isBeforeSchoolHours || dismissed) return null;

  return (
    <div className="bg-warning-50 border-b border-warning-200 px-4 py-2 flex items-center justify-between sticky top-12 z-20">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-warning-600" />
        <span className="text-sm text-warning-700">
          You're accessing the system before school hours. School starts at {schoolSettings.schoolStartTime}.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-warning-100 rounded-full transition-colors"
        aria-label="Dismiss alert"
      >
        <X size={14} className="text-warning-600" />
      </button>
    </div>
  );
}

function AuthenticatedApp() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { showOnboarding, setShowOnboarding } = useApp();

  useEffect(() => {
    // Check if onboarding is completed
    const hasCompleted = localStorage.getItem("hasCompletedOnboarding");
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, [setShowOnboarding]);

  const isSettingsPage = location.pathname.startsWith("/settings");
  // Force collapsed state on settings page, otherwise use user preference
  const effectiveSidebarOpen = isSettingsPage ? false : isSidebarOpen;

  return (
    <>
      <div className="flex min-h-screen bg-background font-sans text-foreground relative overflow-x-hidden">
        {/* Global Ambient Background */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-blob-bounce mix-blend-multiply dark:mix-blend-normal dark:bg-primary/10"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] animate-blob-bounce animation-delay-2000 mix-blend-multiply dark:mix-blend-normal dark:bg-secondary/10"></div>
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] animate-float mix-blend-multiply dark:mix-blend-normal dark:bg-purple-500/10"></div>
        </div>

        {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

        <Sidebar isSidebarOpen={effectiveSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <AiAssistantLayout>
          <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${effectiveSidebarOpen ? 'ml-[260px]' : 'ml-[68px]'} relative z-10 bg-default-100/80 dark:bg-default-100/20`}>
            <Topbar isSidebarOpen={effectiveSidebarOpen} />
            <div className="mt-14">
              <BeforeSchoolAlert />
              <main className={`flex-1 ${isSettingsPage ? 'p-0' : 'p-2 md:p-3'}`}>
                <div className={`${isSettingsPage ? 'w-full' : 'max-w-[1600px] mx-auto space-y-6'}`}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/front-desk/*" element={<FrontDeskPage />} />
                    <Route path="/staffs/*" element={<StaffsPage />} />
                    <Route path="/students/*" element={<StudentsPage />} />
                    <Route path="/classes/*" element={<ClassesPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/messaging/*" element={<MessagingPage />} />
                    <Route path="/fees/*" element={<FeesPage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                    <Route path="/intake-forms/assignments" element={<FormAssignments />} />
                    <Route path="/intake-forms/submissions" element={<FormSubmissions />} />
                    <Route path="/ai-assistant" element={<AiAssistantPage />} />
                    <Route path="/style-guide" element={<StyleGuide />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </AiAssistantLayout>
      </div>

      {/* AI Assistant Panel rendered outside main layout */}
      <AiAssistantPanel>
        <AiAssistantPage />
      </AiAssistantPanel>
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <PermissionProvider>
          <ChatNotificationProvider>
            <AiAssistantProvider>
              <AppRoutes />
            </AiAssistantProvider>
          </ChatNotificationProvider>
        </PermissionProvider>
      </AppProvider>
    </AuthProvider>
  );
}

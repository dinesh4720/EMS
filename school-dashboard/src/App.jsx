import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import PublicFormSubmission from "./pages/PublicFormSubmission";
import { useOwlinTracking } from "./hooks/useOwlinTracking";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const FrontDeskPage = lazy(() => import("./pages/front-desk"));
const StaffsPage = lazy(() => import("./pages/staffs"));
const StudentsPage = lazy(() => import("./pages/students"));
const ClassesPage = lazy(() => import("./pages/classes"));
const CalendarPage = lazy(() => import("./pages/calendar"));
const MessagingPage = lazy(() => import("./pages/messaging"));
const FeesPage = lazy(() => import("./pages/fees"));
const AccountsPage = lazy(() => import("./pages/accounts"));
const SettingsPage = lazy(() => import("./pages/settings"));
const AcademicLayout = lazy(() => import("./pages/academics"));
const FormAssignments = lazy(() => import("./pages/intake-forms/FormAssignments"));
const FormSubmissions = lazy(() => import("./pages/intake-forms/FormSubmissions"));
const AiAssistantPage = lazy(() => import("./pages/AiAssistantPage"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));
const TimetableWizardPage = lazy(() => import("./components/TimetableWizardPage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  );
}
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatNotificationProvider } from "./context/ChatNotificationContext";
import { PermissionProvider } from "./context/PermissionContext";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import { AiAssistantProvider, AiAssistantLayout, AiAssistantPanel } from "./components/AiAssistant/AiAssistantPanel";
import PermissionGuard from "./components/PermissionGuard";
import PayrollReminder from "./components/PayrollReminder";
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

  // Initialize Owlin tracking
  useOwlinTracking();

  useEffect(() => {
    // Check if onboarding is completed
    const hasCompleted = localStorage.getItem("hasCompletedOnboarding");
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, [setShowOnboarding]);

  const isSettingsPage = location.pathname.startsWith("/settings");
  // Use user preference for sidebar state
  const effectiveSidebarOpen = isSidebarOpen;

  return (
    <>
      <div className="flex min-h-screen bg-background font-sans text-foreground">
        {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

        <Sidebar isSidebarOpen={effectiveSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <AiAssistantLayout>
          <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${effectiveSidebarOpen ? 'ml-[240px]' : 'ml-[64px]'} relative z-10 bg-gray-50 dark:bg-zinc-950`}>
            <Topbar isSidebarOpen={effectiveSidebarOpen} />
            <div className="mt-14 flex-1 flex flex-col min-h-0">
              <BeforeSchoolAlert />
              <main className={`flex-1 flex flex-col min-h-0 ${isSettingsPage ? 'p-0' : 'p-2 md:p-3'}`}>
                <div className={`flex-1 flex flex-col min-h-0 ${isSettingsPage ? 'w-full' : 'max-w-[1600px] mx-auto w-full'}`}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={
                      <PermissionGuard module="analytics">
                        <Analytics />
                      </PermissionGuard>
                    } />
                    <Route path="/front-desk/*" element={
                      <PermissionGuard module="front-desk">
                        <FrontDeskPage />
                      </PermissionGuard>
                    } />
                    <Route path="/staffs/*" element={
                      <PermissionGuard module="staff">
                        <StaffsPage />
                      </PermissionGuard>
                    } />
                    <Route path="/students/*" element={
                      <PermissionGuard module="students">
                        <StudentsPage />
                      </PermissionGuard>
                    } />
                    <Route path="/classes/*" element={
                      <PermissionGuard module="classes">
                        <ClassesPage />
                      </PermissionGuard>
                    } />
                    <Route path="/calendar" element={
                      <PermissionGuard module="timetable">
                        <CalendarPage />
                      </PermissionGuard>
                    } />
                    <Route path="/messaging/*" element={
                      <PermissionGuard module="messaging">
                        <MessagingPage />
                      </PermissionGuard>
                    } />
                    <Route path="/fees/*" element={
                      <PermissionGuard module="fees">
                        <FeesPage />
                      </PermissionGuard>
                    } />
                    <Route path="/accounts/*" element={
                      <PermissionGuard module="accounts">
                        <AccountsPage />
                      </PermissionGuard>
                    } />
                    <Route path="/academics/*" element={
                      <PermissionGuard module="academics">
                        <AcademicLayout />
                      </PermissionGuard>
                    } />
                    <Route path="/settings/*" element={
                      <PermissionGuard module="settings">
                        <SettingsPage />
                      </PermissionGuard>
                    } />
                    <Route path="/intake-forms/assignments" element={<FormAssignments />} />
                    <Route path="/intake-forms/submissions" element={<FormSubmissions />} />
                    <Route path="/ai-assistant" element={<AiAssistantPage />} />
                    <Route path="/style-guide" element={<StyleGuide />} />
                    <Route path="/timetable-wizard" element={
                      <PermissionGuard module="timetable">
                        <TimetableWizardPage />
                      </PermissionGuard>
                    } />
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

      {/* Payroll Reminder */}
      <PayrollReminder />
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

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public route - accessible without authentication */}
        <Route path="/form/:token" element={<PublicFormSubmission />} />

        {/* Authenticated routes */}
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </>
        )}
      </Routes>
    </Suspense>
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

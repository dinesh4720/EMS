import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { useOwlinTracking } from "./hooks/useOwlinTracking";
import lazyWithRetry from "./utils/lazyWithRetry";

const isDev = import.meta.env.DEV;

// Lazy load pages for code splitting (with retry on chunk failure)
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const FrontDeskPage = lazyWithRetry(() => import("./pages/front-desk"));
const StaffsPage = lazyWithRetry(() => import("./pages/staffs"));
const StudentsPage = lazyWithRetry(() => import("./pages/students"));
const ClassesPage = lazyWithRetry(() => import("./pages/classes"));
const CalendarPage = lazyWithRetry(() => import("./pages/calendar"));
const MessagingPage = lazyWithRetry(() => import("./pages/messaging"));
const FeesPage = lazyWithRetry(() => import("./pages/fees"));
const SettingsPage = lazyWithRetry(() => import("./pages/settings"));
const AcademicLayout = lazyWithRetry(() => import("./pages/academics"));
const FormAssignments = lazyWithRetry(() => import("./pages/intake-forms/FormAssignments"));
const FormSubmissions = lazyWithRetry(() => import("./pages/intake-forms/FormSubmissions"));
const EnrollmentFunnel = lazyWithRetry(() => import("./pages/intake-forms/EnrollmentFunnel"));
const HomeworkPage = lazyWithRetry(() => import("./pages/homework"));
const InventoryPage = lazyWithRetry(() => import("./pages/inventory"));
const HostelPage = lazyWithRetry(() => import("./pages/hostel"));
const TransportPage = lazyWithRetry(() => import("./pages/transport"));
const LibraryPage = lazyWithRetry(() => import("./pages/library"));
const AiAssistantPage = lazyWithRetry(() => import("./pages/AiAssistantPage"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const StyleGuide = isDev ? lazyWithRetry(() => import("./pages/StyleGuide")) : null;
const TimetableWizardPage = lazyWithRetry(() => import("./components/TimetableWizardPage"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const SuperAdminDashboard = lazyWithRetry(() => import("./pages/super-admin"));

// Lazy load components that aren't needed on initial render
const PublicFormSubmission = lazyWithRetry(() => import("./pages/PublicFormSubmission"));
const OnboardingFlow = lazyWithRetry(() => import("./components/onboarding/OnboardingFlow"));
const PayrollReminder = lazyWithRetry(() => import("./components/PayrollReminder"));

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
import { AiAssistantProvider, AiAssistantLayout, AiAssistantPanel } from "./components/AiAssistant/AiAssistantPanel";
import PermissionGuard from "./components/PermissionGuard";
import StructuredData from "./components/StructuredData";
import { AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { isSuperAdminRole } from "./utils/roleUtils";

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

  // Add window scroll detection for scrollbar visibility
  useEffect(() => {
    let scrollTimeout;
    
    // Create style element for dynamic scrollbar styles
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-scrollbar-styles';
    document.head.appendChild(styleEl);
    
    const showScrollbar = () => {
      styleEl.textContent = `
        *::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.4) !important;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.6) !important;
        }
        * {
          scrollbar-color: rgba(0, 0, 0, 0.4) transparent !important;
        }
        html.dark *::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.4) !important;
        }
        html.dark *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.6) !important;
        }
        html.dark * {
          scrollbar-color: rgba(255, 255, 255, 0.4) transparent !important;
        }
      `;
    };
    
    const hideScrollbar = () => {
      styleEl.textContent = '';
    };
    
    const handleScroll = () => {
      showScrollbar();

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        hideScrollbar();
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
      clearTimeout(scrollTimeout);
      styleEl.remove();
    };
  }, []);

  useEffect(() => {
    // Check if onboarding is completed
    const hasCompleted = localStorage.getItem("hasCompletedOnboarding");
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, [setShowOnboarding]);

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isSettingsPage = location.pathname.startsWith("/settings");
  // Use user preference for sidebar state
  const effectiveSidebarOpen = isSidebarOpen;

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen bg-background font-sans text-foreground">
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
          </Suspense>
        )}

        <ErrorBoundary message="The sidebar encountered an error.">
          <Sidebar isSidebarOpen={effectiveSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        </ErrorBoundary>
        <AiAssistantLayout>
          <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${effectiveSidebarOpen ? 'ml-[240px]' : 'ml-[64px]'} relative z-10 bg-gray-50 dark:bg-zinc-950`}>
            <Topbar isSidebarOpen={effectiveSidebarOpen} />
            <div className="mt-14 flex-1 flex flex-col min-h-0">
              <BeforeSchoolAlert />
              <main className={`flex-1 flex flex-col min-h-0 ${isSettingsPage ? 'p-0' : 'p-2 md:p-3'}`}>
                <div className={`flex-1 flex flex-col min-h-0 ${isSettingsPage ? 'w-full' : 'max-w-[1600px] mx-auto w-full'}`}>
                  <ErrorBoundary message="This page encountered an error. Try navigating to a different section.">
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
                    <Route path="/inventory/*" element={
                      <PermissionGuard module="inventory">
                        <InventoryPage />
                      </PermissionGuard>
                    } />
                    <Route path="/hostel/*" element={
                      <PermissionGuard module="hostel">
                        <HostelPage />
                      </PermissionGuard>
                    } />
                    <Route path="/transport/*" element={
                      <PermissionGuard module="transport">
                        <TransportPage />
                      </PermissionGuard>
                    } />
                    <Route path="/library/*" element={
                      <PermissionGuard module="library">
                        <LibraryPage />
                      </PermissionGuard>
                    } />
                    <Route path="/accounts/*" element={<Navigate to="/fees" replace />} />
                    <Route path="/academics/*" element={
                      <PermissionGuard module="academics">
                        <AcademicLayout />
                      </PermissionGuard>
                    } />
                    <Route path="/homework" element={
                      <PermissionGuard module="academics">
                        <HomeworkPage />
                      </PermissionGuard>
                    } />
                    <Route path="/settings/*" element={
                      <PermissionGuard module="settings">
                        <SettingsPage />
                      </PermissionGuard>
                    } />
                    <Route path="/intake-forms/assignments" element={<FormAssignments />} />
                    <Route path="/intake-forms/submissions" element={<FormSubmissions />} />
                    <Route path="/intake-forms/funnel" element={<EnrollmentFunnel />} />
                    <Route path="/ai-assistant" element={<AiAssistantPage />} />
                    {isDev && StyleGuide ? (
                      <Route path="/style-guide" element={<StyleGuide />} />
                    ) : null}
                    <Route path="/timetable-wizard" element={
                      <PermissionGuard module="timetable">
                        <TimetableWizardPage />
                      </PermissionGuard>
                    } />
                  </Routes>
                  </ErrorBoundary>
                </div>
              </main>
            </div>
          </div>
        </AiAssistantLayout>
      </div>

      {/* Payroll Reminder */}
      <Suspense fallback={null}>
        <PayrollReminder />
      </Suspense>
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const isSuperAdmin = isSuperAdminRole(user?.role);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public route - accessible without authentication */}
          <Route path="/form/:token" element={<PublicFormSubmission />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Authenticated routes */}
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Navigate to={isSuperAdmin ? "/super-admin" : "/"} replace />} />
              <Route path="/signup" element={<Navigate to={isSuperAdmin ? "/super-admin" : "/"} replace />} />
              {isSuperAdmin ? (
                <>
                  <Route path="/super-admin" element={<SuperAdminDashboard />} />
                  <Route path="*" element={<Navigate to="/super-admin" replace />} />
                </>
              ) : (
                <>
                  <Route path="/super-admin" element={<Navigate to="/" replace />} />
                  <Route path="/*" element={<AuthenticatedApp />} />
                </>
              )}
            </>
          )}
        </Routes>
      </Suspense>
    </ErrorBoundary>
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

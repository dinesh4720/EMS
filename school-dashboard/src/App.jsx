import { safeGetItem } from './utils/safeStorage';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
const TrialBanner = lazy(() => import('./components/billing/TrialBanner'));
const SessionTimeoutWarning = lazy(() => import('./components/common/SessionTimeoutWarning'));
const OfflineBanner = lazy(() => import('./components/common/OfflineBanner'));
const StaleDataBanner = lazy(() => import('./components/common/StaleDataBanner'));
const FeatureGate = lazy(() => import('./components/billing/FeatureGate'));
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

// New module pages
const PTMPage = lazyWithRetry(() => import("./pages/ptm"));
// CBSEReportCardPage and CCEGradingPage are rendered as tabs within
// AcademicLayout — no standalone routes needed, so no lazy imports here.
const ExamDetail = lazyWithRetry(() => import("./pages/academics/ExamDetail"));
const ClassPerformance = lazyWithRetry(() => import("./pages/academics/ClassPerformance"));
const ResultsEntry = lazyWithRetry(() => import("./pages/academics/ResultsEntry"));
// const EmailCampaignsPage = lazyWithRetry(() => import("./pages/messaging/EmailCampaignsPage")); // Commented out — using announcements instead
const StudentPromotionPage = lazyWithRetry(() => import("./pages/students/StudentPromotionPage"));
const TransferCertificatePage = lazyWithRetry(() => import("./pages/students/TransferCertificatePage"));
const ReportsPage = lazyWithRetry(() => import("./pages/reports"));
const DataToolsPage = lazyWithRetry(() => import("./pages/data-tools"));

// Lazy load components that aren't needed on initial render
const PublicFormSubmission = lazyWithRetry(() => import("./pages/PublicFormSubmission"));
const OnboardingFlow = lazyWithRetry(() => import("./components/onboarding/OnboardingFlow"));
const PayrollReminder = lazyWithRetry(() => import("./components/PayrollReminder"));

// Loading fallback component
function PageLoader() {
  const { t } = useTranslation();
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
import { useTranslation } from 'react-i18next';

function RouteEB({ children }) {
  return (
    <ErrorBoundary message="This page encountered an error. Try navigating to a different section.">
      {children}
    </ErrorBoundary>
  );
}

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
    const hasCompleted = safeGetItem("hasCompletedOnboarding");
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, [setShowOnboarding]);

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isSettingsPage = location.pathname.startsWith("/settings");
  const isFullWidthPage = isSettingsPage || location.pathname === "/timetable-wizard";
  // Use user preference for sidebar state
  const effectiveSidebarOpen = isSidebarOpen;

  return (
    <>
      {/* Skip-to-content link for keyboard / screen-reader users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
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
          <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${effectiveSidebarOpen ? 'ml-[var(--sidebar-width)]' : 'ml-[var(--sidebar-width-collapsed)]'} relative z-10 bg-gray-50 dark:bg-zinc-950`}>
            <Topbar isSidebarOpen={effectiveSidebarOpen} />
            <div className="mt-14 flex-1 flex flex-col min-h-0">
              <Suspense fallback={null}>
                <TrialBanner />
              </Suspense>
              <Suspense fallback={null}>
                <StaleDataBanner />
              </Suspense>
              <BeforeSchoolAlert />
              <main id="main-content" tabIndex={-1} className={`flex-1 flex flex-col min-h-0 ${isFullWidthPage ? 'p-0' : 'p-2 md:p-3'}`}>
                <div className={`flex-1 flex flex-col min-h-0 ${isFullWidthPage ? 'w-full' : 'max-w-[1600px] mx-auto w-full'}`}>
                  <Routes>
                    <Route path="/" element={<RouteEB><Dashboard /></RouteEB>} />
                    <Route path="/analytics" element={
                      <RouteEB>
                        <PermissionGuard module="analytics">
                          <Analytics />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/front-desk/*" element={
                      <RouteEB>
                        <PermissionGuard module="front-desk">
                          <FrontDeskPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/staffs/*" element={
                      <RouteEB>
                        <PermissionGuard module="staff">
                          <StaffsPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    {/* [AUDIT-571] Specific /students/ routes BEFORE wildcard to avoid shadowing */}
                    <Route path="/students/promotion" element={
                      <RouteEB>
                        <PermissionGuard module="students">
                          <StudentPromotionPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/students/transfer-certificate" element={
                      <RouteEB>
                        <PermissionGuard module="students">
                          <TransferCertificatePage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/students/*" element={
                      <RouteEB>
                        <PermissionGuard module="students">
                          <StudentsPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/classes/*" element={
                      <RouteEB>
                        <PermissionGuard module="classes">
                          <ClassesPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/calendar" element={
                      <RouteEB>
                        <PermissionGuard module="timetable">
                          <CalendarPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/messaging/*" element={
                      <RouteEB>
                        <PermissionGuard module="messaging">
                          <MessagingPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/fees/*" element={
                      <RouteEB>
                        <PermissionGuard module="fees">
                          <FeesPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/inventory/*" element={
                      <RouteEB>
                        <PermissionGuard module="inventory">
                          <InventoryPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/hostel/*" element={
                      <RouteEB>
                        <PermissionGuard module="hostel">
                          <HostelPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/transport/*" element={
                      <RouteEB>
                        <PermissionGuard module="transport">
                          <TransportPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/library/*" element={
                      <RouteEB>
                        <PermissionGuard module="library">
                          <LibraryPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/reports/*" element={
                      <RouteEB>
                        <ReportsPage />
                      </RouteEB>
                    } />
                    <Route path="/accounts/*" element={<Navigate to="/fees" replace />} />
                    <Route path="/academics/class-performance/:classId" element={
                      <RouteEB>
                        <PermissionGuard module="academics">
                          <ClassPerformance />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/academics/exams/:examId/results" element={
                      <RouteEB>
                        <PermissionGuard module="academics">
                          <ResultsEntry />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/academics/exams/:examId" element={
                      <RouteEB>
                        <PermissionGuard module="academics">
                          <ExamDetail />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/academics/*" element={
                      <RouteEB>
                        <PermissionGuard module="academics">
                          <AcademicLayout />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/homework" element={
                      <RouteEB>
                        <PermissionGuard module="academics">
                          <HomeworkPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/ptm" element={
                      <RouteEB>
                        <PermissionGuard module="academics">
                          <PTMPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    {/* CBSE/CCE routes removed — these pages are rendered as tabs
                        within AcademicLayout (/academics/cbse-report-card, /academics/cce-grading)
                        so standalone routes are unnecessary duplicates. */}
                    {/* Email Campaigns route commented out — using announcements instead
                    <Route path="/messaging/email-campaigns" element={
                      <RouteEB>
                        <PermissionGuard module="messaging">
                          <EmailCampaignsPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    */}
                    <Route path="/settings/*" element={
                      <RouteEB>
                        <PermissionGuard module="settings">
                          <SettingsPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/intake-forms/assignments" element={
                      <RouteEB>
                        <PermissionGuard module="intake-forms">
                          <FormAssignments />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/intake-forms/submissions" element={
                      <RouteEB>
                        <PermissionGuard module="intake-forms">
                          <FormSubmissions />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/intake-forms/funnel" element={
                      <RouteEB>
                        <PermissionGuard module="intake-forms">
                          <EnrollmentFunnel />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/ai-assistant" element={
                      <RouteEB>
                        <Suspense fallback={null}>
                          <FeatureGate capability="aiAssistant">
                            <AiAssistantPage />
                          </FeatureGate>
                        </Suspense>
                      </RouteEB>
                    } />
                    {isDev && StyleGuide ? (
                      <Route path="/style-guide" element={<RouteEB><StyleGuide /></RouteEB>} />
                    ) : null}
                    <Route path="/timetable-wizard" element={
                      <RouteEB>
                        <PermissionGuard module="timetable">
                          <TimetableWizardPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/data-tools/*" element={
                      <RouteEB>
                        <PermissionGuard module="dataTools">
                          <DataToolsPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    {/* 404 catch-all for authenticated users */}
                    <Route path="*" element={
                      <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="text-6xl font-bold text-gray-200 dark:text-zinc-700">404</div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Page Not Found</h2>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md text-center">
                          The page you are looking for does not exist or has been moved.
                        </p>
                        <a
                          href="/"
                          className="mt-2 px-4 py-2 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Back to Dashboard
                        </a>
                      </div>
                    } />
                  </Routes>
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

      {/* Session Timeout Warning */}
      <Suspense fallback={null}>
        <SessionTimeoutWarning />
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

const CookieConsentBanner = lazyWithRetry(() => import('./components/CookieConsentBanner'));

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <PermissionProvider>
          <ChatNotificationProvider>
            <AiAssistantProvider>
              <Suspense fallback={null}>
                <OfflineBanner />
              </Suspense>
              <AppRoutes />
              <Suspense fallback={null}>
                <CookieConsentBanner />
              </Suspense>
            </AiAssistantProvider>
          </ChatNotificationProvider>
        </PermissionProvider>
      </AppProvider>
    </AuthProvider>
  );
}

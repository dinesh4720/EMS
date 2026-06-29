import { safeGetItem } from './utils/safeStorage';
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
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
const ExpensesPage = lazyWithRetry(() => import("./pages/expenses"));
const SettingsPage = lazyWithRetry(() => import("./pages/settings"));
const AcademicLayout = lazyWithRetry(() => import("./pages/academics"));
const FormAssignments = lazyWithRetry(() => import("./pages/intake-forms/FormAssignments"));
const FormSubmissions = lazyWithRetry(() => import("./pages/intake-forms/FormSubmissions"));
const EnrollmentFunnel = lazyWithRetry(() => import("./pages/intake-forms/EnrollmentFunnel"));
const InventoryPage = lazyWithRetry(() => import("./pages/inventory"));
const HostelPage = lazyWithRetry(() => import("./pages/hostel"));
const TransportPage = lazyWithRetry(() => import("./pages/transport"));
const LibraryPage = lazyWithRetry(() => import("./pages/library"));
const AiAssistantPage = lazyWithRetry(() => import("./pages/AiAssistantPage"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TimetableWizardPage = lazyWithRetry(() => import("./components/TimetableWizardPage"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const SuperAdminDashboard = lazyWithRetry(() => import("./pages/super-admin"));

// New module pages
const HomeworkPage = lazyWithRetry(() => import("./pages/homework"));
const PTMPage = lazyWithRetry(() => import("./pages/ptm"));
// CBSEReportCardPage and CCEGradingPage are rendered as tabs within
// AcademicLayout — no standalone routes needed, so no lazy imports here.
const ExamDetail = lazyWithRetry(() => import("./pages/academics/ExamDetail"));
const ClassPerformance = lazyWithRetry(() => import("./pages/academics/ClassPerformance"));
const ResultsEntry = lazyWithRetry(() => import("./pages/academics/ResultsEntry"));
const EmailCampaignsPage = lazyWithRetry(() => import("./pages/messaging/EmailCampaignsPage"));
const StudentPromotionPage = lazyWithRetry(() => import("./pages/students/StudentPromotionPage"));
const TransferCertificatePage = lazyWithRetry(() => import("./pages/students/TransferCertificatePage"));
const ReportsPage = lazyWithRetry(() => import("./pages/reports"));
const DataToolsPage = lazyWithRetry(() => import("./pages/data-tools"));
// Internal dev-only pages. Guarding the dynamic import on the statically-known
// `isDev` flag lets the bundler drop these chunks entirely from production builds.
const StyleGuidePage = isDev ? lazyWithRetry(() => import("./pages/StyleGuide")) : null;
const IAPage = isDev ? lazyWithRetry(() => import("./pages/IA")) : null;
const AuditLogsPage = lazyWithRetry(() => import("./pages/audit-logs"));

// Lazy load components that aren't needed on initial render
const PublicFormSubmission = lazyWithRetry(() => import("./pages/PublicFormSubmission"));
const OnboardingFlow = lazyWithRetry(() => import("./components/onboarding/OnboardingFlow"));
const PayrollReminder = lazyWithRetry(() => import("./components/PayrollReminder"));
const CoachMarks = lazy(() => import("./components/ui/CoachMark"));

// REVAMP-107: First-run coach marks for the app shell. Keeps to the 3-mark
// max per surface; bulk action coach mark lives inside BulkActionBar.
const SHELL_COACH_MARKS = [
  {
    target: '[data-coach="topbar-search"]',
    title: 'Find anything fast',
    body: 'Press / or ⌘K to open the command palette and jump to any student, page, or action.',
    placement: 'bottom',
  },
  {
    target: '[data-coach="sidebar-pin"]',
    title: 'Pin what you use most',
    body: 'Pin a class, report, or filter here for one-click access from the sidebar.',
    placement: 'right',
  },
  {
    target: '[data-coach="topbar-pin"]',
    title: 'Save the current view',
    body: 'Use Pin on any page to add it to your sidebar shortcuts.',
    placement: 'bottom',
  },
];

// Loading fallback component
function PageLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" role="status" aria-label="Loading"></div>
    </div>
  );
}
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatNotificationProvider } from "./context/ChatNotificationContext";
import { PermissionProvider } from "./context/PermissionContext";
import { AiAssistantProvider, AiAssistantLayout } from "./components/AiAssistant/AiAssistantPanel";
import PermissionGuard from "./components/PermissionGuard";
import StructuredData from "./components/StructuredData";
import { AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { isSuperAdminRole } from "./utils/roleUtils";

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
    <div className="bg-warn-bg border-b border-warn/20 px-4 py-2 flex items-center justify-between sticky top-11 z-20">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-warn" />
        <span className="text-sm text-warn">
          You're accessing the system before school hours. School starts at {schoolSettings.schoolStartTime}.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-warn-bg rounded-full transition-colors"
        aria-label="Dismiss alert"
      >
        <X size={14} className="text-warn" />
      </button>
    </div>
  );
}

function AuthenticatedApp() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { showOnboarding, setShowOnboarding } = useApp();

  // Auto-collapse sidebar when viewport is too narrow (resize or zoom)
  useEffect(() => {
    const COLLAPSE_WIDTH = 1024;
    const check = () => {
      const width = document.documentElement.clientWidth;
      setIsSidebarOpen(width >= COLLAPSE_WIDTH);
    };
    let resizeTimeout;
    const debouncedCheck = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(check, 150);
    };
    window.addEventListener('resize', debouncedCheck);
    // Also handle visual viewport changes (pinch zoom on some devices)
    window.visualViewport?.addEventListener('resize', debouncedCheck);
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      window.visualViewport?.removeEventListener('resize', debouncedCheck);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Initialize Owlin tracking
  useOwlinTracking();

  // Add window scroll detection for scrollbar visibility
  useEffect(() => {
    let scrollTimeout;
    const root = document.documentElement;

    const handleScroll = () => {
      if (!root.classList.contains('scrollbar-visible')) {
        root.classList.add('scrollbar-visible');
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        root.classList.remove('scrollbar-visible');
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      clearTimeout(scrollTimeout);
      root.classList.remove('scrollbar-visible');
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
  // Staff list (the design's two-pane B variant) goes full-bleed too —
  // there's no max-width gutter when the right detail pane is meant to
  // sit flush against the viewport edge.
  const isStaffListPage =
    location.pathname === "/staffs" || location.pathname === "/staffs/" || location.pathname === "/staffs/list";
  const isStudentListPage =
    location.pathname === "/students" || location.pathname === "/students/";
  const isFullWidthPage =
    isSettingsPage || location.pathname === "/timetable-wizard" || isStaffListPage || isStudentListPage;

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
      <div className="flex min-h-screen bg-bg font-sans text-fg">
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
          </Suspense>
        )}

        <ErrorBoundary message="The sidebar encountered an error.">
          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        </ErrorBoundary>
        {!showOnboarding && (
          <Suspense fallback={null}>
            <CoachMarks surface="shell" autoStart marks={SHELL_COACH_MARKS} />
          </Suspense>
        )}
        <AiAssistantLayout>
          <div className={`flex-1 flex flex-col ${(isStaffListPage || isStudentListPage) ? 'h-screen overflow-hidden' : 'min-h-screen'} transition-all duration-300 ${isSidebarOpen ? 'ml-[var(--sidebar-width)]' : 'ml-0 lg:ml-[var(--sidebar-width-collapsed)]'} relative z-10 bg-bg max-md:pb-[var(--bottom-bar-h)]`}>
            <ErrorBoundary message="The top bar encountered an error.">
              <Topbar isSidebarOpen={isSidebarOpen} />
            </ErrorBoundary>
            <div className="mt-11 flex-1 flex flex-col min-h-0">
              <Suspense fallback={null}>
                <TrialBanner />
              </Suspense>
              <Suspense fallback={null}>
                <StaleDataBanner />
              </Suspense>
              <Suspense fallback={null}>
                <OfflineBanner />
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
                    {/* Specific /messaging/ routes BEFORE wildcard to avoid shadowing */}
                    <Route path="/messaging/email-campaigns" element={
                      <RouteEB>
                        <PermissionGuard module="messaging">
                          <EmailCampaignsPage />
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
                    <Route path="/expenses/*" element={
                      <RouteEB>
                        <PermissionGuard module="expenses">
                          <ExpensesPage />
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
                        <PermissionGuard module="reports">
                          <ReportsPage />
                        </PermissionGuard>
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
                    <Route path="/settings/*" element={
                      <RouteEB>
                        <PermissionGuard module="settings">
                          <SettingsPage />
                        </PermissionGuard>
                      </RouteEB>
                    } />
                    <Route path="/audit-logs" element={
                      <RouteEB>
                        <PermissionGuard module="audit_logs">
                          <AuditLogsPage />
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
                    {/* Internal dev-only routes — not registered in production builds */}
                    {isDev && (
                      <>
                        <Route path="/style-guide" element={
                          <RouteEB>
                            <StyleGuidePage />
                          </RouteEB>
                        } />
                        <Route path="/ia" element={
                          <RouteEB>
                            <IAPage />
                          </RouteEB>
                        } />
                      </>
                    )}
                    {/* 404 catch-all for authenticated users */}
                    <Route path="*" element={
                      <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="text-6xl font-bold text-fg-faint">404</div>
                        <h2 className="text-xl font-semibold text-fg">Page Not Found</h2>
                        <p className="text-sm text-fg-muted max-w-md text-center">
                          The page you are looking for does not exist or has been moved.
                        </p>
                        <Link
                          to="/"
                          className="mt-2 px-4 py-2 bg-fg text-bg rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Back to Dashboard
                        </Link>
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
          {/* Public routes - accessible without authentication */}
          <Route path="/form/:token" element={<PublicFormSubmission />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Auth routes - stable tree, conditional logic in element prop */}
          <Route path="/login" element={
            !isAuthenticated ? <Login /> : <Navigate to={isSuperAdmin ? "/super-admin" : "/"} replace />
          } />
          <Route path="/signup" element={
            !isAuthenticated ? <Signup /> : <Navigate to={isSuperAdmin ? "/super-admin" : "/"} replace />
          } />
          <Route path="/super-admin" element={
            !isAuthenticated ? <Navigate to="/login" replace /> :
            isSuperAdmin ? <SuperAdminDashboard /> : <Navigate to="/" replace />
          } />
          <Route path="/*" element={
            !isAuthenticated ? <Navigate to="/login" replace /> :
            isSuperAdmin ? <Navigate to="/super-admin" replace /> : <AuthenticatedApp />
          } />
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

import { useState, useMemo, useCallback, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";

import { isOwlinEnabled, setOwlinEnabled } from "../../hooks/useOwlinTracking";
import {
  Building,
  Calendar,
  IndianRupee,
  MessageSquare,
  User,
  Palmtree,
  UserCheck,
  GraduationCap,
  FileText,
  CreditCard,
  Search,
  Shield,
  Puzzle,
  Zap,
  Trash2,
  Clock,
  Users,
  Activity,
  Webhook,
  Network,
  Percent,
  Database,
  SlidersHorizontal,
} from "lucide-react";

import lazyWithRetry from "../../utils/lazyWithRetry";
import SettingsErrorBoundary from "../../components/SettingsErrorBoundary";
import TimetableCleanup from "../../components/TimetableCleanup";
import RequirePermission from "../../components/RequirePermission";
import { useTranslation } from 'react-i18next';

const InstitutionSettings = lazyWithRetry(() => import("./InstitutionSettings"));
const AcademicSettings = lazyWithRetry(() => import("./AcademicSettings"));
const AttendanceRules = lazyWithRetry(() => import("./AttendanceRules"));
const FeeManagementSettings = lazyWithRetry(() => import("./FeeManagementSettings"));
const CommunicationSettings = lazyWithRetry(() => import("./CommunicationSettings"));
const PayrollSettings = lazyWithRetry(() => import("./PayrollSettings"));
const UserManagement = lazyWithRetry(() => import("./UserManagement"));
const HolidaySettings = lazyWithRetry(() => import("./HolidaySettings"));
const LeaveSettings = lazyWithRetry(() => import("./LeaveSettings"));
const FeeHeadsUnified = lazyWithRetry(() => import("./FeeHeadsUnified"));
const IntakeFormsSettings = lazyWithRetry(() => import("./IntakeFormsSettings"));
const SubscriptionSettings = lazyWithRetry(() => import("./SubscriptionSettings"));
const RolesAccess = lazyWithRetry(() => import("./RolesAccess"));
const AdmissionFormSettings = lazyWithRetry(() => import("./AdmissionFormSettings"));
const StaffIdSettings = lazyWithRetry(() => import("./StaffIdSettings"));
const PermissionRequests = lazyWithRetry(() => import("./PermissionRequests"));
const TrashSettings = lazyWithRetry(() => import("./TrashSettings"));
const FeeTemplatesPage = lazyWithRetry(() => import("./FeeTemplatesPage"));
const FeeRulesSettings = lazyWithRetry(() => import("./FeeRulesSettings"));
const SSOSettings = lazyWithRetry(() => import("./SSOSettings"));
const WorkspaceSettings = lazyWithRetry(() => import("./WorkspaceSettings"));
const NPSAnalyticsPage = lazyWithRetry(() => import("./NPSAnalyticsPage"));
const SCIMSettings = lazyWithRetry(() => import("./SCIMSettings"));
const WebhooksPage = lazyWithRetry(() => import("./WebhooksPage"));
const ParentManagement = lazyWithRetry(() => import("./ParentManagement"));
const DataCleanupSettings = lazyWithRetry(() => import("./DataCleanupSettings"));
const SeedDataSettings = lazyWithRetry(() => import("./SeedDataSettings"));
const ActiveSessions = lazyWithRetry(() => import("./ActiveSessions"));
const PromotionRulesSettings = lazyWithRetry(() => import("./PromotionRulesSettings"));
const PeriodSettings = lazyWithRetry(() => import("./PeriodSettings"));
const SalaryTemplates = lazyWithRetry(() => import("./SalaryTemplates"));
const HierarchySettings = lazyWithRetry(() => import("./HierarchySettings"));
const DataToolsSettings = lazyWithRetry(() => import("./DataToolsSettings"));
const ModulesSettings = lazyWithRetry(() => import("./ModulesSettings"));

function SettingsPageSkeleton() {
  return (
    <div className="animate-shimmer rounded-lg border border-border-token">
      {/* Header skeleton */}
      <div className="px-6 py-5 border-b border-divider">
        <div className="h-6 bg-surface-2 rounded w-1/3 mb-2" />
        <div className="h-4 bg-surface-2 rounded w-1/2" />
      </div>
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-4 bg-surface-2 rounded w-full" />
        <div className="h-4 bg-surface-2 rounded w-5/6" />
        <div className="h-4 bg-surface-2 rounded w-4/6" />
        <div className="h-32 bg-surface-2 rounded w-full mt-4" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowOnboarding } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [owlinEnabled, setOwlinState] = useState(() => isOwlinEnabled());

  const handleOwlinToggle = useCallback(() => {
    const next = !owlinEnabled;
    setOwlinState(next);
    setOwlinEnabled(next);
    if (next) {
      // Soft reload to re-initialize the tracker
      navigate(0);
    }
  }, [owlinEnabled, navigate]);

  const menuCategories = useMemo(() => [
    {
      title: "General",
      items: [
        { key: "institution", label: "General settings", icon: Building, path: "/settings" },
        { key: "modules", label: "Modules", icon: SlidersHorizontal, path: "/settings/modules", isNew: true },
        { key: "workspace", label: "Workspace", icon: Building, path: "/settings/workspace" },
        { key: "academics", label: "Academics", icon: GraduationCap, path: "/settings/academics", isNew: true },
        { key: "admission-form", label: "Admission Form", icon: FileText, path: "/settings/admission-form", isNew: true },
        { key: "intakeforms", label: "Intake Forms", icon: FileText, path: "/settings/intake-forms" },
      ]
    },
    {
      title: "User Data",
      items: [
        { key: "users", label: "User Management", icon: User, path: "/settings/users" },
        { key: "staff-id", label: "Staff ID Configuration", icon: User, path: "/settings/staff-id", isNew: true },
        { key: "roles", label: "Roles & Permissions", icon: Shield, path: "/settings/roles" },
        { key: "permission-requests", label: "Permission Requests", icon: Shield, path: "/settings/permission-requests", isNew: true },
        { key: "parents", label: "Parent Accounts", icon: Users, path: "/settings/parents", isNew: true },
        { key: "hierarchy", label: "Hierarchy", icon: Network, path: "/settings/hierarchy", isNew: true },
      ]
    },
    {
      title: "Academic",
      items: [
        { key: "attendance", label: "Attendance Rules", icon: Calendar, path: "/settings/attendance-rules" },
        { key: "holidays", label: "Holiday Calendar", icon: Palmtree, path: "/settings/holidays" },
        { key: "leaves", label: "Leave Types", icon: UserCheck, path: "/settings/leaves" },
        { key: "periods", label: "Period Timings", icon: Clock, path: "/settings/periods", isNew: true },
        { key: "timetable-cleanup", label: "Timetable Cleanup", icon: Trash2, path: "/settings/timetable-cleanup", isNew: true },
        { key: "promotion-rules", label: "Promotion Rules", icon: GraduationCap, path: "/settings/promotion-rules", isNew: true },
      ]
    },
    {
      title: "Financial",
      items: [
        { key: "fees", label: "Fee Management", icon: IndianRupee, path: "/settings/fees" },
        { key: "fee-rules", label: "Fee Rules", icon: Percent, path: "/settings/fee-rules" },
        { key: "payroll", label: "Payroll Settings", icon: IndianRupee, path: "/settings/payroll" },
        { key: "salary-templates", label: "Salary Templates", icon: IndianRupee, path: "/settings/salary-templates", isNew: true },
      ]
    },
    {
      title: "Communication",
      items: [
        { key: "communication", label: "Communication Settings", icon: MessageSquare, path: "/settings/communication" },
      ]
    },
    {
      title: "Integrations",
      items: [
        { key: "webhooks", label: "Webhooks", icon: Webhook, path: "/settings/webhooks", isNew: true },
        { key: "scim", label: "SCIM Provisioning", icon: Shield, path: "/settings/scim", isNew: true },
        { key: "nps", label: "NPS Analytics", icon: Activity, path: "/settings/nps", isNew: true },
      ]
    },
    {
      title: "System",
      items: [
        { key: "subscription", label: "Subscription", icon: CreditCard, path: "/settings/subscription" },
        { key: "trash", label: "Trash", icon: Trash2, path: "/settings/trash", isNew: true },
        { key: "seed-data", label: "Seed Data", icon: Zap, path: "/settings/seed-data", isNew: true },
        { key: "data-tools", label: "Data Tools", icon: Database, path: "/settings/data-tools", isNew: true },
        { key: "data-cleanup", label: "Data Cleanup", icon: Trash2, path: "/settings/data-cleanup", isNew: true },
        { key: "sessions", label: "Active Sessions", icon: Activity, path: "/settings/sessions", isNew: true },
        { key: "onboarding", label: "Setup Wizard", icon: Zap, isAction: true, onClick: () => setShowOnboarding(true) },
      ]
    }
  ], [t, setShowOnboarding]);

  const isActive = (path) => {
    if (path === "/settings") return location.pathname === "/settings";
    return location.pathname.startsWith(path) && path !== "/settings";
  };

  // Filter menu items based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return menuCategories;

    const query = searchQuery.toLowerCase();
    return menuCategories
      .map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.label.toLowerCase().includes(query) ||
          category.title.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.items.length > 0);
  }, [searchQuery, menuCategories]);

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-bg">
      {/* Settings Sidebar */}
      <div className="w-[260px] flex-shrink-0 border-r border-divider bg-surface flex flex-col">
        {/* Header & Search */}
        <div className="p-4 space-y-3 sticky top-0 bg-surface z-10">
          <h1 className="text-lg font-medium text-fg">{t('pages.settings2')}</h1>

          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-token rounded-lg focus-within:border-border-strong focus-within:ring-1 focus-within:ring-border-strong transition-colors">
            <Search size={16} className="text-fg-subtle" />
            <input
              type="search"
              placeholder={t('pages.searchSettings')}
              aria-label={t('pages.searchSettings')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-fg placeholder:text-fg-muted text-sm focus-visible:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="text-fg-subtle hover:text-fg text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] rounded px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          <div className="space-y-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 px-3">
                <p className="text-sm text-fg-muted">{t('pages.noSettingsFound')}</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-[11px] font-medium text-fg-muted uppercase tracking-wider px-3 mb-1.5">
                    {category.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {category.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <li key={item.key}>
                          <button
                            type="button"
                            onClick={() => item.isAction ? item.onClick() : navigate(item.path)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))] focus-visible:ring-inset
                              ${!item.isAction && active
                                ? "bg-fg font-medium text-bg"
                                : "text-fg-muted hover:text-fg hover:bg-surface-hover"}
                            `}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isNew && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-surface-2 text-fg-muted rounded font-medium">{t('pages.new')}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Owlin Tracker Toggle */}
        <div className="border-t border-divider px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-fg-subtle" />
              <span className="text-xs text-fg-muted">{t('pages.owlinTracker')}</span>
            </div>
            <button
              onClick={handleOwlinToggle}
              role="switch"
              aria-checked={owlinEnabled}
              aria-label="Toggle Owlin tracker"
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] ${
                owlinEnabled ? "bg-[var(--ok)]" : "bg-fg-faint"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-bg transition-transform ${
                  owlinEnabled ? "translate-x-[18px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-fg-subtle mt-1">
            {owlinEnabled ? "Tracking active — console logs enabled" : "Tracking disabled — console clean"}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[800px] mx-auto">
          <Suspense fallback={<SettingsPageSkeleton />}>
            <Routes>
              <Route index element={
                <SettingsErrorBoundary><InstitutionSettings /></SettingsErrorBoundary>
              } />
              <Route path="modules" element={
                <SettingsErrorBoundary><ModulesSettings /></SettingsErrorBoundary>
              } />
              <Route path="workspace" element={
                <SettingsErrorBoundary><WorkspaceSettings /></SettingsErrorBoundary>
              } />
              <Route path="academics" element={
                <SettingsErrorBoundary><AcademicSettings /></SettingsErrorBoundary>
              } />
              <Route path="admission-form" element={
                <SettingsErrorBoundary><AdmissionFormSettings /></SettingsErrorBoundary>
              } />
              <Route path="users" element={
                <SettingsErrorBoundary><RequirePermission module="settings" action="edit"><UserManagement /></RequirePermission></SettingsErrorBoundary>
              } />
              <Route path="staff-id" element={
                <SettingsErrorBoundary><StaffIdSettings /></SettingsErrorBoundary>
              } />
              <Route path="roles" element={
                <SettingsErrorBoundary><RequirePermission module="settings" action="edit"><RolesAccess /></RequirePermission></SettingsErrorBoundary>
              } />
              <Route path="permission-requests" element={
                <SettingsErrorBoundary><PermissionRequests /></SettingsErrorBoundary>
              } />
              <Route path="hierarchy" element={
                <SettingsErrorBoundary><HierarchySettings /></SettingsErrorBoundary>
              } />
              <Route path="parents" element={
                <SettingsErrorBoundary><ParentManagement /></SettingsErrorBoundary>
              } />
              <Route path="intake-forms" element={
                <SettingsErrorBoundary><IntakeFormsSettings /></SettingsErrorBoundary>
              } />
              <Route path="attendance-rules" element={
                <SettingsErrorBoundary><AttendanceRules /></SettingsErrorBoundary>
              } />
              <Route path="fees" element={
                <SettingsErrorBoundary><FeeManagementSettings /></SettingsErrorBoundary>
              } />
              <Route path="fee-templates" element={
                <SettingsErrorBoundary><FeeTemplatesPage /></SettingsErrorBoundary>
              } />
              <Route path="fee-rules" element={
                <SettingsErrorBoundary><FeeRulesSettings /></SettingsErrorBoundary>
              } />
              <Route path="holidays" element={
                <SettingsErrorBoundary><HolidaySettings /></SettingsErrorBoundary>
              } />
              <Route path="leaves" element={
                <SettingsErrorBoundary><LeaveSettings /></SettingsErrorBoundary>
              } />
              <Route path="communication" element={
                <SettingsErrorBoundary><CommunicationSettings /></SettingsErrorBoundary>
              } />
              <Route path="payroll" element={
                <SettingsErrorBoundary><PayrollSettings /></SettingsErrorBoundary>
              } />
              <Route path="salary-templates" element={
                <SettingsErrorBoundary><SalaryTemplates /></SettingsErrorBoundary>
              } />
              <Route path="subscription" element={
                <SettingsErrorBoundary><SubscriptionSettings /></SettingsErrorBoundary>
              } />
              <Route path="trash" element={
                <SettingsErrorBoundary><TrashSettings /></SettingsErrorBoundary>
              } />
              <Route path="webhooks" element={
                <SettingsErrorBoundary><WebhooksPage /></SettingsErrorBoundary>
              } />
              <Route path="scim" element={
                <SettingsErrorBoundary><RequirePermission adminOnly><SCIMSettings /></RequirePermission></SettingsErrorBoundary>
              } />
              <Route path="sso" element={
                <SettingsErrorBoundary><SSOSettings /></SettingsErrorBoundary>
              } />
              <Route path="periods" element={
                <SettingsErrorBoundary><PeriodSettings /></SettingsErrorBoundary>
              } />
              <Route path="promotion-rules" element={
                <SettingsErrorBoundary><PromotionRulesSettings /></SettingsErrorBoundary>
              } />
              <Route path="nps" element={
                <SettingsErrorBoundary><NPSAnalyticsPage /></SettingsErrorBoundary>
              } />
              <Route path="seed-data" element={
                <SettingsErrorBoundary><RequirePermission adminOnly><SeedDataSettings /></RequirePermission></SettingsErrorBoundary>
              } />
              <Route path="data-cleanup" element={
                <SettingsErrorBoundary><RequirePermission adminOnly><DataCleanupSettings /></RequirePermission></SettingsErrorBoundary>
              } />
              <Route path="sessions" element={
                <SettingsErrorBoundary><ActiveSessions /></SettingsErrorBoundary>
              } />
              <Route path="timetable-cleanup" element={
                <SettingsErrorBoundary>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-fg">{t('pages.timetableDataCleanup1')}</h2>
                      <p className="text-sm text-fg-muted mt-1">
                        Clear all timetable-related data to start fresh
                      </p>
                    </div>
                    <TimetableCleanup />
                  </div>
                </SettingsErrorBoundary>
              } />
              <Route path="data-tools" element={
                <SettingsErrorBoundary><DataToolsSettings /></SettingsErrorBoundary>
              } />
              <Route path="*" element={
                <SettingsErrorBoundary>
                  <div className="flex flex-col items-center justify-center h-[50vh] text-fg-subtle">
                    <Puzzle size={48} className="mb-4 opacity-50" />
                    <h3 className="text-base font-medium text-fg">{t('pages.settingModuleUnderDevelopment')}</h3>
                    <p className="text-sm text-fg-muted">{t('pages.thisSectionWillBeAvailableInTheNextUpdate')}</p>
                  </div>
                </SettingsErrorBoundary>
              } />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

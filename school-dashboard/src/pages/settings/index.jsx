import { useState, useMemo, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { PageLayout, MinimalButton } from "../../components/ui";
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
} from "lucide-react";

import InstitutionSettings from "./InstitutionSettings";
import AcademicSettings from "./AcademicSettings";
import AttendanceRules from "./AttendanceRules";
import FeeManagementSettings from "./FeeManagementSettings";
import CommunicationSettings from "./CommunicationSettings";
import PayrollSettings from "./PayrollSettings";
import UserManagement from "./UserManagement";
import HolidaySettings from "./HolidaySettings";
import LeaveSettings from "./LeaveSettings";
import FeeHeadsUnified from "./FeeHeadsUnified";
import IntakeFormsSettings from "./IntakeFormsSettings";
import SubscriptionSettings from "./SubscriptionSettings";
import RolesAccess from "./RolesAccess";
import AdmissionFormSettings from "./AdmissionFormSettings";
import StaffIdSettings from "./StaffIdSettings";
import PermissionRequests from "./PermissionRequests";
import TrashSettings from "./TrashSettings";
import TimetableCleanup from "../../components/TimetableCleanup";
import ParentManagement from "./ParentManagement";
import WebhooksPage from "./WebhooksPage";
import NPSAnalyticsPage from "./NPSAnalyticsPage";
import SCIMSettings from "./SCIMSettings";
import PromotionRulesSettings from "./PromotionRulesSettings";
import PeriodSettings from "./PeriodSettings";
import SeedDataSettings from "./SeedDataSettings";
import DataCleanupSettings from "./DataCleanupSettings";
import ActiveSessions from "./ActiveSessions";
import RequirePermission from "../../components/RequirePermission";
import { useTranslation } from 'react-i18next';

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
        { key: "payroll", label: "Payroll Settings", icon: IndianRupee, path: "/settings/payroll" },
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
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-gray-50 dark:bg-zinc-950">
      {/* Settings Sidebar */}
      <div className="w-[260px] flex-shrink-0 border-r border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
        {/* Header & Search */}
        <div className="p-4 space-y-3 sticky top-0 bg-white dark:bg-zinc-950 z-10">
          <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{t('pages.settings2')}</h1>

          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg focus-within:border-gray-300 dark:focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-zinc-600 transition-colors">
            <Search size={16} className="text-gray-400 dark:text-zinc-500" />
            <input
              type="search"
              placeholder={t('pages.searchSettings')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 text-xs"
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
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noSettingsFound')}</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-[11px] font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider px-3 mb-1.5">
                    {category.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {category.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <li key={item.key}>
                          <button
                            onClick={() => item.isAction ? item.onClick() : navigate(item.path)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                              ${!item.isAction && active
                                ? "bg-gray-900 dark:bg-zinc-100 font-medium text-white dark:text-zinc-900"
                                : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800"}
                            `}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isNew && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded font-medium">{t('pages.new')}</span>
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
        <div className="border-t border-gray-100 dark:border-zinc-800 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-gray-400 dark:text-zinc-500" />
              <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.owlinTracker')}</span>
            </div>
            <button
              onClick={handleOwlinToggle}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                owlinEnabled ? "bg-green-500" : "bg-gray-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  owlinEnabled ? "translate-x-[18px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
            {owlinEnabled ? "Tracking active — console logs enabled" : "Tracking disabled — console clean"}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[800px] mx-auto">
          <Routes>
            <Route index element={<InstitutionSettings />} />
            <Route path="academics" element={<AcademicSettings />} />
            <Route path="admission-form" element={<AdmissionFormSettings />} />
            <Route path="users" element={<RequirePermission module="settings" action="edit"><UserManagement /></RequirePermission>} />
            <Route path="staff-id" element={<StaffIdSettings />} />
            <Route path="roles" element={<RequirePermission module="settings" action="edit"><RolesAccess /></RequirePermission>} />
            <Route path="permission-requests" element={<PermissionRequests />} />
            <Route path="parents" element={<ParentManagement />} />
            <Route path="intake-forms" element={<IntakeFormsSettings />} />
            <Route path="attendance-rules" element={<AttendanceRules />} />
            <Route path="fees" element={<FeeManagementSettings />} />
            <Route path="holidays" element={<HolidaySettings />} />
            <Route path="leaves" element={<LeaveSettings />} />
            <Route path="communication" element={<CommunicationSettings />} />
            <Route path="payroll" element={<PayrollSettings />} />
            <Route path="subscription" element={<SubscriptionSettings />} />
            <Route path="trash" element={<TrashSettings />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="scim" element={<RequirePermission adminOnly><SCIMSettings /></RequirePermission>} />
            <Route path="periods" element={<PeriodSettings />} />
            <Route path="promotion-rules" element={<PromotionRulesSettings />} />
            <Route path="nps" element={<NPSAnalyticsPage />} />
            <Route path="seed-data" element={<RequirePermission adminOnly><SeedDataSettings /></RequirePermission>} />
            <Route path="data-cleanup" element={<RequirePermission adminOnly><DataCleanupSettings /></RequirePermission>} />
            <Route path="sessions" element={<ActiveSessions />} />
            <Route path="timetable-cleanup" element={
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{t('pages.timetableDataCleanup1')}</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    Clear all timetable-related data to start fresh
                  </p>
                </div>
                <TimetableCleanup />
              </div>
            } />
            <Route path="*" element={<div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 dark:text-zinc-500">
              <Puzzle size={48} className="mb-4 opacity-50" />
              <h3 className="text-base font-medium text-gray-900 dark:text-zinc-100">{t('pages.settingModuleUnderDevelopment')}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.thisSectionWillBeAvailableInTheNextUpdate')}</p>
            </div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  Building,
  Calendar,
  IndianRupee,
  MessageSquare,
  User,
  Palmtree,
  UserCheck,
  BookOpen,
  GraduationCap,
  FileText,
  CreditCard,
  Search,
  Shield,
  Puzzle,
  Smartphone,
  Mail,
  Zap
} from "lucide-react";
import { Input, Kbd, Chip } from "@heroui/react";

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

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowOnboarding } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const menuCategories = [
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
      ]
    },
    {
      title: "Academic",
      items: [
        { key: "attendance", label: "Attendance Rules", icon: Calendar, path: "/settings/attendance-rules" },
        { key: "holidays", label: "Holiday Calendar", icon: Palmtree, path: "/settings/holidays" },
        { key: "leaves", label: "Leave Types", icon: UserCheck, path: "/settings/leaves" },
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
        { key: "email", label: "Email Integration", icon: Mail, path: "/settings/email", isNew: true },
      ]
    },
    {
      title: "Installation",
      items: [
        { key: "mobile", label: "Mobile App", icon: Smartphone, path: "/settings/mobile" },
      ]
    },
    {
      title: "System",
      items: [
        { key: "subscription", label: "Subscription", icon: CreditCard, path: "/settings/subscription" },
        { key: "integrations", label: "Apps & Integrations", icon: Puzzle, path: "/settings/integrations" },
        { key: "onboarding", label: "Setup Wizard", icon: Zap, isAction: true, onClick: () => setShowOnboarding(true) },
      ]
    }
  ];

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
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-background">
      {/* Settings Sidebar */}
      <div className="w-[280px] flex-shrink-0 border-r border-default-200 bg-default-50/50 flex flex-col">
        {/* Header & Search */}
        <div className="p-5 space-y-4 sticky top-0 bg-default-50/50 z-10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-default-900">Settings</h1>
          </div>

          <Input
            classNames={{
              base: "h-9",
              mainWrapper: "h-9",
              input: "text-small",
              inputWrapper: "h-9 bg-default-100 hover:bg-default-200/70 dark:bg-default-200/50 shadow-none",
            }}
            placeholder="Search settings..."
            size="sm"
            startContent={<Search size={14} className="text-default-500" />}
            endContent={<Kbd keys={["command"]} className="hidden lg:inline-block shadow-none border-none bg-transparent font-sans text-tiny opacity-50">K</Kbd>}
            type="search"
            value={searchQuery}
            onValueChange={setSearchQuery}
            isClearable
            onClear={() => setSearchQuery("")}
          />
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto px-3 pb-8 scrollbar-hide">
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 px-3">
                <p className="text-sm text-default-400">No settings found for "{searchQuery}"</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.title} className="space-y-1">
                  <h3 className="text-[11px] font-bold text-default-400 uppercase tracking-wider px-3 mb-2">
                    {category.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {category.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <li key={item.key}>
                          <button
                            onClick={() => item.isAction ? item.onClick() : navigate(item.path)}
                            className={`
                            w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors duration-200
                            ${!item.isAction && active
                                ? "bg-default-200/60 font-medium text-default-900"
                                : "text-default-600 hover:bg-default-100 placeholder-opacity-0 hover:text-default-900"}
                          `}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isNew && (
                              <Chip size="sm" color="primary" variant="solid" className="h-5 text-[10px] px-1 min-w-10">New</Chip>
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12">
        <div className="max-w-[1000px] mx-auto animate-fade-in">
          <Routes>
            <Route index element={<InstitutionSettings />} />
            <Route path="academics" element={<AcademicSettings />} />
            <Route path="admission-form" element={<AdmissionFormSettings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="staff-id" element={<StaffIdSettings />} />
            <Route path="roles" element={<RolesAccess />} />
            <Route path="permission-requests" element={<PermissionRequests />} />
            <Route path="intake-forms" element={<IntakeFormsSettings />} />
            <Route path="attendance-rules" element={<AttendanceRules />} />
            <Route path="fees" element={<FeeManagementSettings />} />
            <Route path="holidays" element={<HolidaySettings />} />
            <Route path="leaves" element={<LeaveSettings />} />
            <Route path="communication" element={<CommunicationSettings />} />
            <Route path="payroll" element={<PayrollSettings />} />
            <Route path="subscription" element={<SubscriptionSettings />} />
            <Route path="*" element={<div className="flex flex-col items-center justify-center h-[50vh] text-default-400">
              <Puzzle size={48} className="mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">Setting module under development</h3>
              <p className="text-sm">This section will be available in the next update.</p>
            </div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

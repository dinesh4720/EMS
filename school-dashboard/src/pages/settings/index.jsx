import { Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Building, Calendar, IndianRupee, MessageSquare, User, Palmtree, UserCheck, BookOpen, GraduationCap, FileText, CreditCard, ChevronRight } from "lucide-react";

import InstitutionSettings from "./InstitutionSettings";
import AttendanceRules from "./AttendanceRules";
import FeeRules from "./FeeRules";
import CommunicationSettings from "./CommunicationSettings";
import PayrollSettings from "./PayrollSettings";
import UserManagement from "./UserManagement";
import HolidaySettings from "./HolidaySettings";
import LeaveSettings from "./LeaveSettings";
import FeeHeadsSettings from "./FeeHeadsSettings";
import ClassSectionsSettings from "./ClassSectionsSettings";
import IntakeFormsSettings from "./IntakeFormsSettings";
import SubscriptionSettings from "./SubscriptionSettings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuCategories = [
    {
      title: "General",
      items: [
        { key: "institution", label: "Institution Profile", icon: Building, path: "/settings" },
        { key: "sections", label: "Class Sections", icon: GraduationCap, path: "/settings/sections" },
        { key: "intakeforms", label: "Intake Forms", icon: FileText, path: "/settings/intake-forms" },
      ]
    },
    {
      title: "User Management",
      items: [
        { key: "users", label: "User Management", icon: User, path: "/settings/users" },
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
        { key: "feeheads", label: "Fee Heads", icon: BookOpen, path: "/settings/fee-heads" },
        { key: "fees", label: "Fee Rules", icon: IndianRupee, path: "/settings/fee-rules" },
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
      title: "System",
      items: [
        { key: "subscription", label: "Subscription & Billing", icon: CreditCard, path: "/settings/subscription" },
      ]
    }
  ];

  const isActive = (path) => {
    if (path === "/settings") {
      return location.pathname === "/settings";
    }
    return location.pathname.includes(path);
  };

  return (
    <div className="flex gap-4">
      {/* Left Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-4 p-3">
          <div className="space-y-4">
            {menuCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          active
                            ? "bg-primary text-white font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className={active ? "text-white" : "text-gray-500 dark:text-gray-400"} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {active && <ChevronRight size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <Routes>
          <Route index element={<InstitutionSettings />} />
          <Route path="sections" element={<ClassSectionsSettings />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="intake-forms" element={<IntakeFormsSettings />} />
          <Route path="attendance-rules" element={<AttendanceRules />} />
          <Route path="fee-heads" element={<FeeHeadsSettings />} />
          <Route path="fee-rules" element={<FeeRules />} />
          <Route path="holidays" element={<HolidaySettings />} />
          <Route path="leaves" element={<LeaveSettings />} />
          <Route path="communication" element={<CommunicationSettings />} />
          <Route path="payroll" element={<PayrollSettings />} />
          <Route path="subscription" element={<SubscriptionSettings />} />
        </Routes>
      </div>
    </div>
  );
}

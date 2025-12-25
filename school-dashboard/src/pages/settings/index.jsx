import { Routes, Route } from "react-router-dom";
import { Tabs, Tab } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building, Shield, Calendar, IndianRupee, MessageSquare, User } from "lucide-react";
import InstitutionSettings from "./InstitutionSettings";
import RolesAccess from "./RolesAccess";
import AttendanceRules from "./AttendanceRules";
import FeeRules from "./FeeRules";
import CommunicationSettings from "./CommunicationSettings";
import PayrollSettings from "./PayrollSettings";
import UserManagement from "./UserManagement";
import PageHeader from "../../components/PageHeader";

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/roles")) return "roles";
    if (location.pathname.includes("/users")) return "users";
    if (location.pathname.includes("/attendance-rules")) return "attendance";
    if (location.pathname.includes("/fee-rules")) return "fees";
    if (location.pathname.includes("/communication")) return "communication";
    if (location.pathname.includes("/payroll")) return "payroll";
    return "institution";
  };

  return (
    <div className="space-y-3">
      <PageHeader title="System Configuration" />

      <Tabs
        selectedKey={getActiveTab()}
        onSelectionChange={(key) => {
          if (key === "institution") navigate("/settings");
          else if (key === "roles") navigate("/settings/roles");
          else if (key === "users") navigate("/settings/users");
          else if (key === "attendance") navigate("/settings/attendance-rules");
          else if (key === "fees") navigate("/settings/fee-rules");
          else if (key === "communication") navigate("/settings/communication");
          else if (key === "payroll") navigate("/settings/payroll");
        }}
        size="sm"
        variant="solid"
        radius="sm"
        classNames={{ tabList: "bg-default-100/50" }}
      >
        <Tab key="institution" title={<div className="flex items-center gap-1"><Building size={14} /><span>Institution</span></div>} />
        <Tab key="roles" title={<div className="flex items-center gap-1"><Shield size={14} /><span>Roles & Access</span></div>} />
        <Tab key="users" title={<div className="flex items-center gap-1"><User size={14} /><span>Staff Logins</span></div>} />
        <Tab key="attendance" title={<div className="flex items-center gap-1"><Calendar size={14} /><span>Attendance Rules</span></div>} />
        <Tab key="fees" title={<div className="flex items-center gap-1"><IndianRupee size={14} /><span>Fee Rules</span></div>} />
        <Tab key="communication" title={<div className="flex items-center gap-1"><MessageSquare size={14} /><span>Communication</span></div>} />
        <Tab key="payroll" title={<div className="flex items-center gap-1"><IndianRupee size={14} /><span>Payroll</span></div>} />
      </Tabs>

      <Routes>
        <Route index element={<InstitutionSettings />} />
        <Route path="roles" element={<RolesAccess />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="attendance-rules" element={<AttendanceRules />} />
        <Route path="fee-rules" element={<FeeRules />} />
        <Route path="communication" element={<CommunicationSettings />} />
        <Route path="payroll" element={<PayrollSettings />} />
      </Routes>
    </div>
  );
}

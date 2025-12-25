import { Routes, Route } from "react-router-dom";
import { Tabs, Tab } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, IndianRupee, AlertTriangle, FileText } from "lucide-react";
import FeeSetup from "./FeeSetup";
import CollectFees from "./CollectFees";
import FeeDefaulters from "./FeeDefaulters";
import FeeReports from "./FeeReports";
import PageHeader from "../../components/PageHeader";

export default function FeesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/collect")) return "collect";
    if (location.pathname.includes("/defaulters")) return "defaulters";
    if (location.pathname.includes("/reports")) return "reports";
    return "setup";
  };

  return (
    <div className="space-y-3">
      <PageHeader title="Financial Overview" />

      <Tabs
        selectedKey={getActiveTab()}
        onSelectionChange={(key) => {
          if (key === "setup") navigate("/fees");
          else if (key === "collect") navigate("/fees/collect");
          else if (key === "defaulters") navigate("/fees/defaulters");
          else if (key === "reports") navigate("/fees/reports");
        }}
        size="sm"
        variant="solid"
        radius="sm"
        classNames={{ tabList: "bg-default-100/50" }}
      >
        <Tab key="setup" title={<div className="flex items-center gap-1"><Settings size={14} /><span>Fee Setup</span></div>} />
        <Tab key="collect" title={<div className="flex items-center gap-1"><IndianRupee size={14} /><span>Collect Fees</span></div>} />
        <Tab key="defaulters" title={<div className="flex items-center gap-1"><AlertTriangle size={14} /><span>Defaulters</span></div>} />
        <Tab key="reports" title={<div className="flex items-center gap-1"><FileText size={14} /><span>Reports</span></div>} />
      </Tabs>

      <Routes>
        <Route index element={<FeeSetup />} />
        <Route path="collect" element={<CollectFees />} />
        <Route path="defaulters" element={<FeeDefaulters />} />
        <Route path="reports" element={<FeeReports />} />
      </Routes>
    </div>
  );
}

import { Routes, Route } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { IndianRupee, RotateCcw, Home, Download, AlertTriangle, Settings, Layers } from "lucide-react";
import { PageLayout, MinimalButton } from "../../components/ui";
import Payments from "./Payments";
import Refunds from "./Refunds";
import FeeTemplatesManagement from "./FeeTemplatesManagement";

export default function FeesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/refunds")) return "refunds";
    if (location.pathname.includes("/templates")) return "templates";
    return "payments";
  };

  const activeTab = getActiveTab();

  const handleDownloadReport = () => {
    // TODO: Implement comprehensive fee report generation
    alert('Generating fee report... This will include payments, defaulters, and refunds.');
  };

  const tabs = [
    {
      key: "payments",
      title: (
        <div className="flex items-center gap-2">
          <IndianRupee size={16} />
          <span>Payments</span>
        </div>
      ),
    },
    {
      key: "refunds",
      title: (
        <div className="flex items-center gap-2">
          <RotateCcw size={16} />
          <span>Refunds</span>
        </div>
      ),
    },
    {
      key: "templates",
      title: (
        <div className="flex items-center gap-2">
          <Layers size={16} />
          <span>Templates</span>
        </div>
      ),
    },
  ];

  const handleTabChange = (key) => {
    if (key === "payments") navigate("/fees");
    else if (key === "refunds") navigate("/fees/refunds");
    else if (key === "templates") navigate("/fees/templates");
  };

  const getHeader = () => {
    if (activeTab === "payments") {
      return {
        title: "Fee Payments",
        description: "Collect fees, track payments, and manage defaulters",
      };
    }
    if (activeTab === "templates") {
      return {
        title: "Fee Templates",
        description: "Create and manage fee templates for different sections",
      };
    }
    return {
      title: "Fee Refunds",
      description: "Process refunds and track refund history",
    };
  };

  const actions = (
    <>
      <MinimalButton
        variant="ghost"
        size="sm"
        icon={<AlertTriangle size={16} />}
        onClick={() => navigate("/fees/defaulters")}
      >
        Defaulters
      </MinimalButton>
      <MinimalButton
        variant="ghost"
        size="sm"
        icon={<Download size={16} />}
        onClick={handleDownloadReport}
      >
        Reports
      </MinimalButton>
      <MinimalButton
        variant="ghost"
        size="sm"
        icon={<Settings size={16} />}
        onClick={() => navigate("/settings/fee-heads")}
      >
        Fee Setup
      </MinimalButton>
    </>
  );

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs Section */}
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>
            Home
          </BreadcrumbItem>
          <BreadcrumbItem>Fees</BreadcrumbItem>
          {activeTab === "refunds" && <BreadcrumbItem>Refunds</BreadcrumbItem>}
          {activeTab === "templates" && <BreadcrumbItem>Templates</BreadcrumbItem>}
        </Breadcrumbs>
      </div>

      {/* Page Layout with Tabs */}
      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={getHeader()}
        actions={actions}
        noPadding
      >
        <div className="min-h-[500px] p-6">
          <Routes>
            <Route index element={<Payments />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="templates" element={<FeeTemplatesManagement />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}

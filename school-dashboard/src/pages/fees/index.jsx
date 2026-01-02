import { Routes, Route } from "react-router-dom";
import { Card, Breadcrumbs, BreadcrumbItem, Tabs, Tab } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { IndianRupee, RotateCcw, Home, Download, AlertTriangle, Settings, Layers } from "lucide-react";
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

  return (
    <div className="animate-fade-in">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        {/* Breadcrumbs Section */}
        <div className="px-6 py-3 border-b border-default-200 flex items-center justify-between">
          <Breadcrumbs size="sm">
            <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>
              Home
            </BreadcrumbItem>
            <BreadcrumbItem>Fees</BreadcrumbItem>
            {activeTab === "refunds" && <BreadcrumbItem>Refunds</BreadcrumbItem>}
          </Breadcrumbs>
        </div>

        {/* Tabs Section */}
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "payments") navigate("/fees");
              else if (key === "refunds") navigate("/fees/refunds");
              else if (key === "templates") navigate("/fees/templates");
            }}
            size="md"
            color="default"
            variant="light"
            classNames={{
              tabList: "gap-0 p-1.5 bg-gradient-to-r from-default-100 via-default-200/50 to-default-100 rounded-xl",
              cursor: "bg-white dark:bg-default-50 rounded-lg shadow-lg ring-1 ring-black/5",
              tab: "px-6 h-10 cursor-pointer",
              tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
            }}
          >
            <Tab
              key="payments"
              title={
                <div className="flex items-center gap-2">
                  <IndianRupee size={16} />
                  <span>Payments</span>
                </div>
              }
            />
            <Tab
              key="refunds"
              title={
                <div className="flex items-center gap-2">
                  <RotateCcw size={16} />
                  <span>Refunds</span>
                </div>
              }
            />
            <Tab
              key="templates"
              title={
                <div className="flex items-center gap-2">
                  <Layers size={16} />
                  <span>Templates</span>
                </div>
              }
            />
          </Tabs>
        </div>

        {/* Header Section with Gradient and Actions */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-purple-200/80 to-transparent blur-3xl pointer-events-none" />
          <div className="pl-2 relative z-10">
            <h1 className="text-2xl font-medium text-default-900">
              {activeTab === "payments" ? "Fee Payments" : activeTab === "templates" ? "Fee Templates" : "Fee Refunds"}
            </h1>
            <p className="text-sm text-default-500 mt-1">
              {activeTab === "payments"
                ? "Collect fees, track payments, and manage defaulters"
                : activeTab === "templates"
                ? "Create and manage fee templates for different sections"
                : "Process refunds and track refund history"}
            </p>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-2 relative z-10 flex-wrap">
            <button
              onClick={() => navigate("/fees/defaulters")}
              className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:border-danger hover:bg-danger-50 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
            >
              <AlertTriangle size={16} />
              <span>Defaulters</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:border-primary hover:bg-primary-50 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
            >
              <Download size={16} />
              <span>Reports</span>
            </button>
            <button
              onClick={() => navigate("/settings/fee-heads")}
              className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:border-primary hover:bg-primary-50 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
            >
              <Settings size={16} />
              <span>Fee Setup</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px] px-6 py-6">
          <Routes>
            <Route index element={<Payments />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="templates" element={<FeeTemplatesManagement />} />
          </Routes>
        </div>
      </Card>
    </div>
  );
}

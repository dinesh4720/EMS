import { Routes, Route } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Package, Truck, Wrench, ShoppingCart, ClipboardCheck, FileBarChart, Home,
} from "lucide-react";
import { PageLayout } from "../../components/ui";
import InventoryDashboard from "./InventoryDashboard";
import Assets from "./Assets";
import Vendors from "./Vendors";
import Maintenance from "./Maintenance";
import Procurement from "./Procurement";
import Audits from "./Audits";
import Reports from "./Reports";
import { useTranslation } from 'react-i18next';

export default function InventoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/assets")) return "assets";
    if (location.pathname.includes("/vendors")) return "vendors";
    if (location.pathname.includes("/maintenance")) return "maintenance";
    if (location.pathname.includes("/procurement")) return "procurement";
    if (location.pathname.includes("/audits")) return "audits";
    if (location.pathname.includes("/reports")) return "reports";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  const tabs = [
    { key: "dashboard", title: <div className="flex items-center gap-2"><BarChart3 size={16} /><span>{t('pages.dashboard1')}</span></div> },
    { key: "assets", title: <div className="flex items-center gap-2"><Package size={16} /><span>{t('pages.assets')}</span></div> },
    { key: "vendors", title: <div className="flex items-center gap-2"><Truck size={16} /><span>{t('pages.vendors')}</span></div> },
    { key: "maintenance", title: <div className="flex items-center gap-2"><Wrench size={16} /><span>{t('pages.maintenance')}</span></div> },
    { key: "procurement", title: <div className="flex items-center gap-2"><ShoppingCart size={16} /><span>{t('pages.procurement')}</span></div> },
    { key: "audits", title: <div className="flex items-center gap-2"><ClipboardCheck size={16} /><span>{t('pages.audits')}</span></div> },
    { key: "reports", title: <div className="flex items-center gap-2"><FileBarChart size={16} /><span>{t('pages.reports1')}</span></div> },
  ];

  const handleTabChange = (key) => {
    if (key === "dashboard") navigate("/inventory");
    else navigate(`/inventory/${key}`);
  };

  const headers = {
    dashboard: { title: "Inventory Dashboard", description: "Overview of assets, stock levels, and maintenance" },
    assets: { title: "Asset Management", description: "Track and manage all school assets" },
    vendors: { title: "Vendor Management", description: "Manage suppliers and vendor contacts" },
    maintenance: { title: "Maintenance Logs", description: "Schedule and track asset maintenance" },
    procurement: { title: "Procurement Requests", description: "Create and manage purchase requests" },
    audits: { title: "Asset Audits", description: "Conduct and review asset audits" },
    reports: { title: "Inventory Reports", description: "Analytics and reports on inventory data" },
  };

  const tabLabel = {
    dashboard: null, assets: "Assets", vendors: "Vendors", maintenance: "Maintenance",
    procurement: "Procurement", audits: "Audits", reports: "Reports",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>{t('pages.home')}</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate("/inventory")}>{t('pages.inventory1')}</BreadcrumbItem>
          {tabLabel[activeTab] && <BreadcrumbItem>{tabLabel[activeTab]}</BreadcrumbItem>}
        </Breadcrumbs>
      </div>

      <PageLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={headers[activeTab]}
        noPadding
      >
        <div className="min-h-[500px] p-6">
          <Routes>
            <Route index element={<InventoryDashboard />} />
            <Route path="assets" element={<Assets />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="procurement" element={<Procurement />} />
            <Route path="audits" element={<Audits />} />
            <Route path="reports" element={<Reports />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}

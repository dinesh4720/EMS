import { Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Route as RouteIcon, Truck, Home } from "lucide-react";
import { PageLayout, Breadcrumbs } from "../../components/ui";
import RoutesTab from "./RoutesTab";
import VehiclesTab from "./VehiclesTab";
import { useTranslation } from 'react-i18next';

export default function TransportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/vehicles")) return "vehicles";
    return "routes";
  };

  const activeTab = getActiveTab();

  const tabs = [
    { key: "routes", title: <div className="flex items-center gap-2"><RouteIcon size={16} /><span>{t('pages.routes')}</span></div> },
    { key: "vehicles", title: <div className="flex items-center gap-2"><Truck size={16} /><span>{t('pages.vehicles')}</span></div> },
  ];

  const handleTabChange = (key) => {
    if (key === "routes") navigate("/transport");
    else navigate(`/transport/${key}`);
  };

  const headers = {
    routes: { title: "Transport Routes", description: "Manage bus routes, stops, and student assignments" },
    vehicles: { title: "Vehicle Fleet", description: "Manage school vehicles, drivers, and conductors" },
  };

  const tabLabel = { routes: null, vehicles: "Vehicles" };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: t('pages.home'), href: "/", icon: <Home size={14} /> },
            { label: t('pages.transport1'), href: "/transport" },
            ...(tabLabel[activeTab] ? [{ label: tabLabel[activeTab] }] : []),
          ]}
          size="sm"
        />
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
            <Route index element={<RoutesTab />} />
            <Route path="vehicles" element={<VehiclesTab />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}

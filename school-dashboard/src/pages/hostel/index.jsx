import { Routes, Route } from "react-router-dom";
import { Breadcrumbs } from "../../components/ui";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Building2, DoorOpen, Users, Home } from "lucide-react";
import { PageLayout } from "../../components/ui";
import HostelDashboard from "./HostelDashboard";
import HostelList from "./HostelList";
import RoomsList from "./RoomsList";
import AllocationsList from "./AllocationsList";
import { useTranslation } from 'react-i18next';

export default function HostelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes("/hostels")) return "hostels";
    if (location.pathname.includes("/rooms")) return "rooms";
    if (location.pathname.includes("/allocations")) return "allocations";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  const tabs = [
    { key: "dashboard", title: <div className="flex items-center gap-2"><BarChart3 size={16} /><span>{t('pages.dashboard1')}</span></div> },
    { key: "hostels", title: <div className="flex items-center gap-2"><Building2 size={16} /><span>{t('pages.hostels')}</span></div> },
    { key: "rooms", title: <div className="flex items-center gap-2"><DoorOpen size={16} /><span>{t('pages.rooms')}</span></div> },
    { key: "allocations", title: <div className="flex items-center gap-2"><Users size={16} /><span>{t('pages.allocations')}</span></div> },
  ];

  const handleTabChange = (key) => {
    if (key === "dashboard") navigate("/hostel");
    else navigate(`/hostel/${key}`);
  };

  const headers = {
    dashboard: { title: "Hostel Dashboard", description: "Overview of hostel occupancy and statistics" },
    hostels: { title: "Hostel Management", description: "Manage hostels, wardens, and capacity" },
    rooms: { title: "Room Management", description: "Manage rooms, beds, and amenities" },
    allocations: { title: "Student Allocations", description: "Allocate students to hostel rooms" },
  };

  const tabLabel = {
    dashboard: null, hostels: "Hostels", rooms: "Rooms", allocations: "Allocations",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs
          size="sm"
          items={[
            { label: <span className="flex items-center gap-1"><Home size={14} aria-hidden="true" />{t('pages.home')}</span>, href: "/" },
            { label: t('pages.hostel1'), href: "/hostel" },
            ...(tabLabel[activeTab] ? [{ label: tabLabel[activeTab] }] : []),
          ]}
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
            <Route index element={<HostelDashboard />} />
            <Route path="hostels" element={<HostelList />} />
            <Route path="rooms" element={<RoomsList />} />
            <Route path="allocations" element={<AllocationsList />} />
          </Routes>
        </div>
      </PageLayout>
    </div>
  );
}

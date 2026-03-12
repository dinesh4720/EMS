import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageLayout, MinimalButton } from "../../components/ui";
import Announcements from "./Announcements";
import Reminders from "./Reminders";
import CommunicationLogs from "./CommunicationLogs";
import ChatFull from "./ChatFull";

const tabs = [
  { key: "chat", title: "Chat" },
  { key: "announcements", title: "Announcements" },
  { key: "reminders", title: "Reminders" },
];

export default function MessagingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDrawer, setOpenDrawer] = useState(false);

  const getActiveTab = () => {
    if (location.pathname.includes("/announcements")) return "announcements";
    if (location.pathname.includes("/reminders")) return "reminders";
    return "chat";
  };

  const activeTab = getActiveTab();
  const isChat = activeTab === "chat";

  const handleTabChange = (tabId) => {
    if (tabId === "chat") navigate("/messaging");
    else if (tabId === "announcements") navigate("/messaging/announcements");
    else if (tabId === "reminders") navigate("/messaging/reminders");
  };

  const headerActions = activeTab === "announcements" && (
    <MinimalButton
      onClick={() => setOpenDrawer(true)}
      icon={<Plus size={16} />}
      size="sm"
    >
      New Announcement
    </MinimalButton>
  );

  return (
    <PageLayout
      className="flex flex-col h-full"
      header={{
        title: "Messages",
      }}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      actions={headerActions}
      noPadding={isChat}
    >
      <div className={`flex-1 min-h-0 ${isChat ? "flex flex-col" : "overflow-auto"}`}>
        <Routes>
          <Route index element={<ChatFull />} />
          <Route
            path="announcements"
            element={<Announcements isDrawerOpen={openDrawer} setIsDrawerOpen={setOpenDrawer} />}
          />
          <Route path="reminders" element={<Reminders />} />
          <Route path="logs" element={<CommunicationLogs />} />
        </Routes>
      </div>
    </PageLayout>
  );
}

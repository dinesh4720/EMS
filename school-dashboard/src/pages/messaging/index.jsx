import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Tabs, Tab, Button } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { Megaphone, Bell, FileText, Plus, MessageCircle } from "lucide-react";
import Announcements from "./Announcements";
import Reminders from "./Reminders";
import CommunicationLogs from "./CommunicationLogs";
import Chat from "./Chat";


export default function MessagingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDrawer, setOpenDrawer] = useState(false);

  const getActiveTab = () => {
    if (location.pathname.includes("/announcements")) return "announcements";
    if (location.pathname.includes("/reminders")) return "reminders";
    if (location.pathname.includes("/logs")) return "logs";
    return "chat";
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            if (key === "chat") navigate("/messaging");
            else if (key === "announcements") navigate("/messaging/announcements");
            else if (key === "reminders") navigate("/messaging/reminders");
            else if (key === "logs") navigate("/messaging/logs");
          }}
          size="sm"
          variant="solid"
          radius="md"
          classNames={{ tabList: "bg-default-100/50" }}
        >
          <Tab key="chat" title={<div className="flex items-center gap-1"><MessageCircle size={14} /><span>Chat</span></div>} />
          <Tab key="announcements" title={<div className="flex items-center gap-1"><Megaphone size={14} /><span>Announcements</span></div>} />
          <Tab key="reminders" title={<div className="flex items-center gap-1"><Bell size={14} /><span>Reminders</span></div>} />
          <Tab key="logs" title={<div className="flex items-center gap-1"><FileText size={14} /><span>Logs</span></div>} />
        </Tabs>

        {activeTab === "announcements" && (
          <Button color="primary" size="sm" startContent={<Plus size={16} />} onPress={() => setOpenDrawer(true)}>
            New Announcement
          </Button>
        )}
      </div>

      <Routes>
        <Route index element={<Chat />} />
        <Route path="announcements" element={<Announcements isDrawerOpen={openDrawer} setIsDrawerOpen={setOpenDrawer} />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="logs" element={<CommunicationLogs />} />
      </Routes>
    </div>
  );
}

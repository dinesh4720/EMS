import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Card, Breadcrumbs, BreadcrumbItem, Tabs, Tab } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { Megaphone, Bell, FileText, Plus, MessageCircle, Home } from "lucide-react";
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
  const isChat = activeTab === "chat";

  return (
    <div className="animate-fade-in">
      <Card className="shadow-sm border border-default-200 bg-background rounded-md">
        {/* Breadcrumbs Section */}
        <div className="px-6 py-3 border-b border-default-200 flex items-center justify-between">
          <Breadcrumbs size="sm">
            <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>
              Home
            </BreadcrumbItem>
            <BreadcrumbItem>Messaging</BreadcrumbItem>
            {activeTab !== "chat" && (
              <BreadcrumbItem>
                {activeTab === "announcements" && "Announcements"}
                {activeTab === "reminders" && "Reminders"}
                {activeTab === "logs" && "Communication Logs"}
              </BreadcrumbItem>
            )}
          </Breadcrumbs>
        </div>

        {/* Tabs Section */}
        <div className="px-6 py-3 border-b border-default-200">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              if (key === "chat") navigate("/messaging");
              else if (key === "announcements") navigate("/messaging/announcements");
              else if (key === "reminders") navigate("/messaging/reminders");
              else if (key === "logs") navigate("/messaging/logs");
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
              key="chat"
              title={
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} />
                  <span>Chat</span>
                </div>
              }
            />
            <Tab
              key="announcements"
              title={
                <div className="flex items-center gap-2">
                  <Megaphone size={16} />
                  <span>Announcements</span>
                </div>
              }
            />
            <Tab
              key="reminders"
              title={
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <span>Reminders</span>
                </div>
              }
            />
            <Tab
              key="logs"
              title={
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>Logs</span>
                </div>
              }
            />
          </Tabs>
        </div>

        {/* Header Section with Gradient - Hidden for Chat */}
        {!isChat && (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-purple-200/80 to-transparent blur-3xl pointer-events-none" />

            <div className="pl-2 relative z-10">
              <h1 className="text-2xl font-medium text-default-900">
                {activeTab === "announcements" && "Announcements"}
                {activeTab === "reminders" && "Reminders"}
                {activeTab === "logs" && "Communication Logs"}
              </h1>
              <p className="text-sm text-default-500 mt-1">
                {activeTab === "announcements" && "Broadcast important messages to your community"}
                {activeTab === "reminders" && "Send automated reminders to parents"}
                {activeTab === "logs" && "View all communication history"}
              </p>
            </div>

            {/* Primary action button */}
            {activeTab === "announcements" && (
              <button
                onClick={() => setOpenDrawer(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10"
              >
                <Plus size={16} />
                <span>New Announcement</span>
              </button>
            )}
          </div>
        )}

        {/* Content Area - Full screen for Chat */}
        <div className={isChat ? "h-[calc(100vh-16rem)]" : "min-h-[500px] px-6 py-6"}>
          <Routes>
            <Route index element={<Chat />} />
            <Route
              path="announcements"
              element={<Announcements isDrawerOpen={openDrawer} setIsDrawerOpen={setOpenDrawer} />}
            />
            <Route path="reminders" element={<Reminders />} />
            <Route path="logs" element={<CommunicationLogs />} />
          </Routes>
        </div>
      </Card>
    </div>
  );
}

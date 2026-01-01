import { Avatar, Button, ScrollShadow, Chip, Tooltip } from "@heroui/react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, IndianRupee, Settings,
  ChevronsLeft, GraduationCap, Calendar, BarChart3, FileText, Send, CheckSquare, DoorOpen, Sparkles
} from "lucide-react";
import AiAssistant from "./AiAssistant";
import MetallicLogo from "./MetallicLogo";

// Main Menu - Core Operations
const mainMenuItems = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/" },
  { icon: <GraduationCap size={18} />, label: "Students", href: "/students" },
  { icon: <Users size={18} />, label: "Staffs", href: "/staffs" },
  { icon: <BookOpen size={18} />, label: "Classes", href: "/classes" },
  { icon: <DoorOpen size={18} />, label: "Front Desk", href: "/front-desk" },
  { icon: <IndianRupee size={18} />, label: "Fees", href: "/fees" },
  { icon: <MessageSquare size={18} />, label: "Communication", href: "/messaging" },
  { icon: <Calendar size={18} />, label: "Schedule", href: "/calendar" },
];

// Analytics & Documents
const analyticsItems = [
  { icon: <BarChart3 size={18} />, label: "Analytics", href: "/analytics" },
  { icon: <FileText size={18} />, label: "Documents", href: "/settings/intake-forms" },
];

// Settings
const settingsItem = { icon: <Settings size={18} />, label: "Settings", href: "/settings" };

// Reusable NavSection Component
function NavSection({ title, items, isSidebarOpen, location, badgeColor = "danger" }) {
  return (
    <div>
      {isSidebarOpen && (
        <p className="px-2 text-[10px] font-medium text-default-400 uppercase tracking-widest mb-2">
          {title}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item, index) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <li key={index} className="overflow-visible">
              <NavLink to={item.href}>
                {({ isActive }) => (
                  <Tooltip
                    content={
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <Chip size="sm" variant="shadow" color={badgeColor} className="h-4 min-w-4 px-1 text-[9px]">
                            {item.badge}
                          </Chip>
                        )}
                      </div>
                    }
                    placement="right"
                    isDisabled={isSidebarOpen}
                    closeDelay={0}
                    classNames={{
                      content: "bg-black text-white rounded-lg",
                    }}
                  >
                    <div className={`
                      flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-2'} py-2 rounded transition-all duration-200 group relative overflow-visible
                      ${isActive
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-default-500 hover:bg-default-100/50 hover:text-default-900"}
                    `}>
                      <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center w-full'}`}>
                        <span className={`${isActive ? "text-primary" : "text-default-400 group-hover:text-default-600"} transition-all group-hover:scale-110`}>
                          {item.icon}
                        </span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                      </div>
                      {item.badge && isSidebarOpen && (
                        <Chip size="sm" variant="shadow" color={badgeColor} className="h-5 min-w-5 px-0 flex items-center justify-center text-[10px] font-medium">
                          {item.badge}
                        </Chip>
                      )}
                    </div>
                  </Tooltip>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background/60 backdrop-blur-xl border-r border-default-300 dark:border-default-200 flex flex-col z-50 transition-all duration-300 ${isSidebarOpen ? 'w-56' : 'w-16'} overflow-visible`}>
      {/* Header */}
      <div className={`h-12 flex items-center border-b border-default-300 transition-all duration-300 ${isSidebarOpen ? 'justify-between px-5' : 'justify-center px-2'}`}>
        <div className="flex items-center gap-2">
          <MetallicLogo />
          {isSidebarOpen && (
            <span className="font-medium text-lg tracking-tight text-foreground/90 transition-all duration-200 overflow-hidden whitespace-nowrap">
              EduMaster
            </span>
          )}
        </div>

        {/* Collapse Toggle Button - Inline when expanded */}
        {isSidebarOpen && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-default-500 hover:bg-default-100/50 hover:text-foreground min-w-8 w-8 h-8"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <ChevronsLeft size={16} />
          </Button>
        )}
      </div>

      {/* Collapse Toggle Button - Floating when collapsed */}
      {!isSidebarOpen && (
        <div
          className="absolute -right-3 top-12 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm border border-default-200/50 dark:border-default-100/20 shadow-sm z-[60] flex items-center justify-center cursor-pointer hover:bg-default-100/50 transition-all duration-300"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <ChevronsLeft size={14} className="rotate-180 text-default-500" />
        </div>
      )}
      {/* Main Navigation */}
      <ScrollShadow className="flex-1 px-4 space-y-6 scrollbar-hide py-4">
        {/* Main Menu */}
        <NavSection
          title="Main Menu"
          items={mainMenuItems}
          isSidebarOpen={isSidebarOpen}
          location={location}
        />

        {/* Analytics & Documents */}
        <NavSection
          title="Analytics & Documents"
          items={analyticsItems}
          isSidebarOpen={isSidebarOpen}
          location={location}
        />

        {/* Settings & AI */}
        <div>
          <ul className="space-y-1">


            <li className="overflow-visible">
              <NavLink to={settingsItem.href}>
                {({ isActive }) => (
                  <Tooltip
                    content={settingsItem.label}
                    placement="right"
                    isDisabled={isSidebarOpen}
                    closeDelay={0}
                    classNames={{
                      content: "bg-black text-white rounded-lg",
                    }}
                  >
                    <div className={`
                      flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-2'} py-2 rounded transition-all duration-200 group relative overflow-visible
                      ${isActive
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-default-500 hover:bg-default-100/50 hover:text-default-900"}
                    `}>
                      <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center w-full'}`}>
                        <span className={`${isActive ? "text-primary" : "text-default-400 group-hover:text-default-600"} transition-all group-hover:scale-110`}>
                          {settingsItem.icon}
                        </span>
                        {isSidebarOpen && <span className="text-sm whitespace-nowrap">{settingsItem.label}</span>}
                      </div>
                    </div>
                  </Tooltip>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </ScrollShadow>

      {/* Pinned AI Assistant Footer */}
      <div className="p-2 border-t border-default-200/50 mt-auto">
        <ul className="space-y-1">
          <li className="overflow-visible">
            <NavLink to="/ai-assistant">
              {({ isActive }) => (
                <Tooltip
                  content="AI Assistant"
                  placement="right"
                  isDisabled={isSidebarOpen}
                  closeDelay={0}
                  classNames={{
                    content: "bg-black text-white rounded-lg",
                  }}
                >
                  <div className={`
                      flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-2'} py-2 rounded transition-all duration-200 group relative overflow-visible
                      ${isActive
                      ? "bg-primary/10 text-primary font-medium shadow-sm"
                      : "text-default-500 hover:bg-default-100/50 hover:text-default-900"}
                    `}>
                    <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center w-full'}`}>
                      <span className={`${isActive ? "text-primary" : "text-default-400 group-hover:text-default-600"} transition-all group-hover:scale-110`}>
                        <Sparkles size={18} />
                      </span>
                      {isSidebarOpen && <span className="text-sm whitespace-nowrap">AI Assistant</span>}
                    </div>
                  </div>
                </Tooltip>
              )}
            </NavLink>
          </li>
        </ul>
      </div>
    </aside >
  );
}

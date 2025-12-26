import { Avatar, Button, ScrollShadow, Chip } from "@heroui/react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, IndianRupee, Settings,
  ChevronsLeft, GraduationCap, Calendar, BarChart3, FileText, Send, CheckSquare
} from "lucide-react";
import AiAssistant from "./AiAssistant";

const mainNavItems = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/" },
  { icon: <BarChart3 size={18} />, label: "Analytics", href: "/analytics" },
  { icon: <Users size={18} />, label: "Staffs", href: "/staffs" },
  { icon: <GraduationCap size={18} />, label: "Students", href: "/students" },
  { icon: <BookOpen size={18} />, label: "Classes", href: "/classes" },
  { icon: <Calendar size={18} />, label: "Calendar", href: "/calendar" },
  { icon: <MessageSquare size={18} />, label: "Messaging", href: "/messaging", badge: "4" },
  { icon: <IndianRupee size={18} />, label: "Fees", href: "/fees" },
];

const intakeFormsItems = [
  { icon: <FileText size={18} />, label: "Forms", href: "/settings/intake-forms" },
  { icon: <CheckSquare size={18} />, label: "Submissions", href: "/intake-forms/submissions", badge: "3" },
];

const settingsItem = { icon: <Settings size={18} />, label: "Settings", href: "/settings" };

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background/60 backdrop-blur-xl border-r border-default-300 dark:border-default-200 flex flex-col z-50 transition-all duration-300 ${isSidebarOpen ? 'w-60' : 'w-16'} overflow-visible`}>
      {/* Header */}
      <div className={`h-14 flex items-center border-b border-default-300 transition-all duration-300 ${isSidebarOpen ? 'justify-start px-5 gap-2' : 'justify-center px-2'}`}>
        <div className="p-1 bg-gradient-to-br from-primary to-secondary rounded text-white shadow-lg flex-shrink-0">
          <GraduationCap size={18} />
        </div>
        {isSidebarOpen && (
          <span className="font-medium text-lg tracking-tight text-foreground/90 transition-all duration-200 overflow-hidden whitespace-nowrap">
            EduMaster
          </span>
        )}
      </div>
      {/* Main Navigation */}
      <ScrollShadow className="flex-1 px-4 space-y-8 scrollbar-hide py-4">
        <div>
          {isSidebarOpen && <p className="px-2 text-[10px] font-medium text-default-400 uppercase tracking-widest mb-2">Main Menu</p>}
          <ul className="space-y-1">
            {mainNavItems.map((item, index) => {
              const isActive = location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));

              return (
                <li key={index} className="overflow-visible">
                  <NavLink to={item.href}>
                    {({ isActive }) => (
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
                          <Chip size="sm" variant="shadow" color="danger" className="h-5 min-w-5 px-0 flex items-center justify-center text-[10px] font-medium">
                            {item.badge}
                          </Chip>
                        )}
                        {/* Tooltip for collapsed state */}
                        {!isSidebarOpen && (
                          <div className="absolute left-full ml-3 px-3 py-1.5 bg-default-900 dark:bg-default-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200" style={{ zIndex: 9999 }}>
                            {item.label}
                            {/* Arrow */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-default-900 dark:border-r-default-800"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Intake Forms Section */}
        <div>
          {isSidebarOpen && <p className="px-2 text-[10px] font-medium text-default-400 uppercase tracking-widest mb-2">Intake Forms</p>}
          <ul className="space-y-1">
            {intakeFormsItems.map((item, index) => {
              const isActive = location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));

              return (
                <li key={index} className="overflow-visible">
                  <NavLink to={item.href}>
                    {({ isActive }) => (
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
                          <Chip size="sm" variant="shadow" color="warning" className="h-5 min-w-5 px-0 flex items-center justify-center text-[10px] font-medium">
                            {item.badge}
                          </Chip>
                        )}
                        {/* Tooltip for collapsed state */}
                        {!isSidebarOpen && (
                          <div className="absolute left-full ml-3 px-3 py-1.5 bg-default-900 dark:bg-default-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200" style={{ zIndex: 9999 }}>
                            {item.label}
                            {item.badge && (
                              <Chip size="sm" variant="shadow" color="warning" className="ml-2 h-4 min-w-4 px-1 text-[9px]">
                                {item.badge}
                              </Chip>
                            )}
                            {/* Arrow */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-default-900 dark:border-r-default-800"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Settings */}
        <div>
          <ul className="space-y-1">
            <li className="overflow-visible">
              <NavLink to={settingsItem.href}>
                {({ isActive }) => (
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
                    {/* Tooltip for collapsed state */}
                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-default-900 dark:bg-default-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200" style={{ zIndex: 9999 }}>
                        {settingsItem.label}
                        {/* Arrow */}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-default-900 dark:border-r-default-800"></div>
                      </div>
                    )}
                  </div>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </ScrollShadow>

      {/* AI Assistant */}
      <AiAssistant isCollapsed={!isSidebarOpen} />

      {/* Collapse Toggle */}
      <div className={`p-4 border-t border-default-100/50 flex ${isSidebarOpen ? 'justify-end' : 'justify-center'}`}>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-default-400 min-w-8 w-8 h-8 hover:text-foreground"
          onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronsLeft size={18} /> : <ChevronsLeft size={18} className="rotate-180" />}
        </Button>
      </div>
    </aside >
  );
}

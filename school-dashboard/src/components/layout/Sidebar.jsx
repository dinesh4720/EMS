import React, { useState } from "react";
import {
  Avatar,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, IndianRupee, Settings,
  ChevronsLeft, GraduationCap, Calendar, BarChart3, DoorOpen,
  Sun, Moon, LogOut, ChevronRight,
  Layers, Award, ClipboardList, Package, Building2, Bus, Library,
  UserCheck, Mail, FileText, Webhook,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../../context/AuthContext";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';

// Module Definitions
const globalItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Schedule", href: "/calendar" },
];

const modules = {
  EMS: [
    {
      title: "Management",
      items: [
        { icon: GraduationCap, label: "Students", href: "/students" },
        { icon: Users, label: "Staffs", href: "/staffs" },
        { icon: BookOpen, label: "Classes", href: "/classes" },
      ]
    },
    {
      title: "Academics",
      items: [
        { icon: Award, label: "Academics", href: "/academics" },
        { icon: ClipboardList, label: "Homework", href: "/homework" },
        { icon: Users, label: "PTM", href: "/ptm" },
      ]
    },
    {
      title: "Communication",
      items: [
        { icon: MessageSquare, label: "Messages", href: "/messaging" },
        // { icon: Mail, label: "Email Campaigns", href: "/messaging/email-campaigns" }, // Commented out — using announcements instead
      ]
    },
    {
      title: "Finance",
      items: [
        { icon: IndianRupee, label: "Fee Collection", href: "/fees" },
      ]
    },
    {
      title: "Operations",
      items: [
        // { icon: Package, label: "Inventory", href: "/inventory" }, // Commented out — not needed for launch
        // Hostel, Transport, Library modules are disabled for now
        // Uncomment to re-enable:
        // { icon: Building2, label: "Hostel", href: "/hostel" },
        // { icon: Bus, label: "Transport", href: "/transport" },
        // { icon: Library, label: "Library", href: "/library" },
      ]
    }
  ],
  FrontDesk: [],
  Analytics: []
};

const moduleInfo = {
  EMS: {
    label: "School EMS",
    icon: Layers,
  },
  FrontDesk: {
    label: "Front Desk",
    icon: DoorOpen,
  },
  Analytics: {
    label: "Analytics",
    icon: BarChart3,
  },
};

function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const chatNotifications = useChatNotifications();
  const unreadCount = chatNotifications?.unreadCount || 0;
  const [expandedModules, setExpandedModules] = useState(["EMS"]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <aside
      aria-label="Main navigation"
      className={`
        fixed left-0 top-0 h-screen
        bg-white dark:bg-zinc-950
        border-r border-gray-200 dark:border-zinc-800
        flex flex-col z-50
        transition-all duration-300
        ${isSidebarOpen ? 'w-[240px]' : 'w-[64px]'}
      `}
    >
      {/* Brand */}
      <div className={`flex items-center h-14 border-b border-gray-100 dark:border-zinc-800 ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-zinc-100 flex items-center justify-center">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">S</span>
          </div>
          {isSidebarOpen && (
            <span className="font-semibold text-sm text-gray-900 dark:text-zinc-100">
              SchoolSync
            </span>
          )}
        </div>

        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {/* Global Items */}
        <div className={`space-y-0.5 ${isSidebarOpen ? "px-3" : "px-2"}`}>
          {globalItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Tooltip
                key={item.href}
                content={item.label}
                placement="right"
                isDisabled={isSidebarOpen}
                classNames={{ content: "bg-gray-800 text-white text-xs font-medium px-2 py-1" }}
              >
                <NavLink to={item.href} aria-current={isActive ? "page" : undefined}>
                  <div className={`
                    flex items-center cursor-pointer
                    ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
                    rounded-lg transition-colors
                    ${isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}
                  `}>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    {isSidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </div>
                </NavLink>
              </Tooltip>
            )
          })}
        </div>

        {/* Divider */}
        <div className={`border-t border-gray-200 dark:border-zinc-800 mx-3 my-2`} />

        {/* Modules */}
        <div className={`space-y-0.5 ${isSidebarOpen ? "px-3" : "px-2"}`}>
          {Object.entries(modules).map(([key, groups]) => {
            const info = moduleInfo[key];
            const isActive = key === 'FrontDesk' || key === 'Analytics'
              ? (key === 'FrontDesk' ? location.pathname.startsWith('/front-desk') : location.pathname.startsWith('/analytics'))
              : expandedModules.includes(key);

            const handleModuleClick = () => {
              if (key === 'FrontDesk') {
                navigate('/front-desk');
                return;
              }
              if (key === 'Analytics') {
                navigate('/analytics');
                return;
              }

              if (!isSidebarOpen) {
                setIsSidebarOpen(true);
                if (!expandedModules.includes(key)) {
                  setExpandedModules([...expandedModules, key]);
                }
              } else {
                if (isActive) {
                  setExpandedModules(expandedModules.filter(m => m !== key));
                } else {
                  setExpandedModules([...expandedModules, key]);
                }
              }
            };

            return (
              <div key={key}>
                {/* Module Header */}
                <Tooltip
                  content={info.label}
                  placement="right"
                  isDisabled={isSidebarOpen}
                  classNames={{ content: "bg-gray-800 text-white text-xs font-medium px-2 py-1" }}
                >
                  <button
                    onClick={handleModuleClick}
                    className={`
                      w-full flex items-center cursor-pointer transition-colors
                      ${isSidebarOpen ? 'py-2 px-3 gap-3 justify-between' : 'h-10 justify-center w-10 mx-auto py-0'}
                      rounded-lg
                      ${isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <info.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{info.label}</span>
                      )}
                    </div>
                    {isSidebarOpen && key !== 'FrontDesk' && key !== 'Analytics' && (
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 dark:text-zinc-500 transition-transform ${isActive ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>
                </Tooltip>

                {/* Module Content */}
                <AnimatePresence>
                  {isSidebarOpen && isActive && groups.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pb-1">
                        <div className="border-l border-gray-200 dark:border-zinc-800 ml-4 pl-3 space-y-0.5">
                          {groups.map((group) =>
                            group.items.map((item) => {
                              const isItemActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
                              const isMessaging = item.href === '/messaging';
                              const showBadge = isMessaging && unreadCount > 0;

                              return (
                                <NavLink key={item.href} to={item.href} aria-current={isItemActive ? "page" : undefined}>
                                  <div className={`
                                    flex items-center py-2 px-2 gap-2 rounded-md transition-colors relative
                                    ${isItemActive
                                      ? "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100"
                                      : "text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}
                                  `}>
                                    <item.icon size={15} strokeWidth={isItemActive ? 2.5 : 1.5} />
                                    <span className="text-sm flex-1">{item.label}</span>
                                    {showBadge && (
                                      <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </NavLink>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className={`border-t border-gray-200 dark:border-zinc-800 py-3 space-y-0.5 ${isSidebarOpen ? 'px-3' : 'px-2 flex flex-col items-center'}`}>
        {/* Settings */}
        <NavLink to="/settings" aria-current={location.pathname.startsWith('/settings') ? "page" : undefined}>
          <div className={`
            flex items-center cursor-pointer
            ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
            rounded-lg transition-colors text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800
          `}>
            <Settings size={18} strokeWidth={1.5} />
            {isSidebarOpen && <span className="text-sm font-medium">{t('components.settings1')}</span>}
          </div>
        </NavLink>

        {/* Theme Toggle */}
        <div
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`
            flex items-center cursor-pointer
            ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
            rounded-lg transition-colors text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800
          `}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          {isSidebarOpen && <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </div>

        {/* User Profile */}
        <Popover
          placement={isSidebarOpen ? "top-start" : "right"}
          isOpen={isUserMenuOpen}
          onOpenChange={setIsUserMenuOpen}
          offset={8}
          showArrow
        >
          <PopoverTrigger>
            <button
              type="button"
              className={`
                flex items-center w-full
                ${isSidebarOpen ? 'py-2 px-2 gap-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg mt-1' : 'h-10 justify-center w-10 mx-auto rounded-lg hover:bg-gray-100'}
                transition-all focus:outline-none
              `}
            >
              <Avatar
                name={user?.name || "Admin"}
                size="sm"
                className="w-7 h-7 text-[10px]"
              />
              {isSidebarOpen && (
                <div className="flex-1 flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                    {user?.name || "Julia"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                    Admin
                  </span>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <div className="min-w-[200px] rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('components.signedInAs')}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  My Settings
                </button>
                <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Expand Button (when collapsed) */}
      {!isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(true)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-50 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
        >
          <ChevronsLeft size={12} className="rotate-180" />
        </div>
      )}
    </aside>
  );
}

export default React.memo(Sidebar);

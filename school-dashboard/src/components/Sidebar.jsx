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
  Layers, Award
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";
import { useChatNotifications } from "../context/ChatNotificationContext";
import { motion, AnimatePresence } from "framer-motion";

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
      ]
    },
    {
      title: "Communication",
      items: [
        { icon: MessageSquare, label: "Messages", href: "/messaging" },
      ]
    },
    {
      title: "Finance",
      items: [
        { icon: IndianRupee, label: "Fee Collection", href: "/fees" },
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
  const chatNotifications = useChatNotifications();
  const unreadCount = chatNotifications?.unreadCount || 0;
  const [expandedModules, setExpandedModules] = useState(["EMS"]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen
        bg-white
        border-r border-gray-200
        flex flex-col z-50
        transition-all duration-300
        ${isSidebarOpen ? 'w-[240px]' : 'w-[64px]'}
      `}
    >
      {/* Brand */}
      <div className={`flex items-center h-14 border-b border-gray-100 ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {isSidebarOpen && (
            <span className="font-semibold text-sm text-gray-900">
              SchoolSync
            </span>
          )}
        </div>

        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                <NavLink to={item.href}>
                  <div className={`
                    flex items-center cursor-pointer
                    ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
                    rounded-lg transition-colors
                    ${isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"}
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
        <div className={`border-t border-gray-200 mx-3 my-2`} />

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
                        className={`text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`}
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
                        <div className="border-l border-gray-200 ml-4 pl-3 space-y-0.5">
                          {groups.map((group) =>
                            group.items.map((item) => {
                              const isItemActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
                              const isMessaging = item.href === '/messaging';
                              const showBadge = isMessaging && unreadCount > 0;

                              return (
                                <NavLink key={item.href} to={item.href}>
                                  <div className={`
                                    flex items-center py-2 px-2 gap-2 rounded-md transition-colors relative
                                    ${isItemActive
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-600 hover:bg-gray-50"}
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
      <div className={`border-t border-gray-200 py-3 space-y-0.5 ${isSidebarOpen ? 'px-3' : 'px-2 flex flex-col items-center'}`}>
        {/* Settings */}
        <NavLink to="/settings">
          <div className={`
            flex items-center cursor-pointer
            ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
            rounded-lg transition-colors text-gray-600 hover:bg-gray-100
          `}>
            <Settings size={18} strokeWidth={1.5} />
            {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </div>
        </NavLink>

        {/* Theme Toggle */}
        <div
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`
            flex items-center cursor-pointer
            ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
            rounded-lg transition-colors text-gray-600 hover:bg-gray-100
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
                ${isSidebarOpen ? 'py-2 px-2 gap-3 hover:bg-gray-100 rounded-lg mt-1' : 'h-10 justify-center w-10 mx-auto rounded-lg hover:bg-gray-100'}
                transition-all focus:outline-none
              `}
            >
              <Avatar
                src={`https://i.pravatar.cc/150?u=${user?.id || 'admin'}`}
                name={user?.name?.[0] || "A"}
                size="sm"
                className="w-7 h-7 text-[10px]"
              />
              {isSidebarOpen && (
                <div className="flex-1 flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {user?.name || "Julia"}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    Admin
                  </span>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <div className="min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  My Settings
                </button>
                <div className="h-px bg-gray-200 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
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
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-50 text-gray-400 hover:text-gray-600"
        >
          <ChevronsLeft size={12} className="rotate-180" />
        </div>
      )}
    </aside>
  );
}

export default React.memo(Sidebar);

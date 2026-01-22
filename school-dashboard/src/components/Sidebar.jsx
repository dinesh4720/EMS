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
  ChevronsLeft, GraduationCap, Calendar, BarChart3, FileText, DoorOpen,
  Bell, Sun, Moon, LogOut, ChevronDown, ChevronRight,
  Briefcase, FileSpreadsheet,
  PieChart, TrendingUp, Activity, Layers
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";
import { useChatNotifications } from "../context/ChatNotificationContext";
import MetallicLogo from "./MetallicLogo";
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
      title: "Communication",
      items: [
        { icon: MessageSquare, label: "Messages", href: "/messaging" },
      ]
    }
  ],
  FrontDesk: [],
  Accounts: [
    {
      title: "Finance",
      items: [
        { icon: IndianRupee, label: "Fee Collection", href: "/fees" },
        { icon: FileSpreadsheet, label: "Invoices", href: "/accounts/invoices" },
        { icon: Briefcase, label: "Expenses", href: "/accounts/expenses" },
      ]
    },
    {
      title: "Reports",
      items: [
        { icon: PieChart, label: "Financial Reports", href: "/accounts/reports" },
        { icon: FileText, label: "Payroll", href: "/accounts/payroll" },
      ]
    }
  ],
  Analytics: []
};



const moduleInfo = {
  EMS: {
    label: "School EMS",
    color: "text-blue-500 fill-current",
    icon: Layers,
    activeContainer: "bg-blue-50/50 dark:bg-blue-900/10",
    headerActiveText: "text-blue-600 dark:text-blue-400",
    subItemActive: "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-foreground"
  },
  FrontDesk: {
    label: "Front Desk",
    color: "text-emerald-500 fill-current",
    icon: DoorOpen,
    activeContainer: "bg-emerald-50/50 dark:bg-emerald-900/10",
    headerActiveText: "text-emerald-600 dark:text-emerald-400",
    subItemActive: "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-foreground"
  },
  Accounts: {
    label: "Accounts",
    color: "text-purple-500 fill-current",
    icon: IndianRupee,
    activeContainer: "bg-purple-50/50 dark:bg-purple-900/10",
    headerActiveText: "text-purple-600 dark:text-purple-400",
    subItemActive: "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-foreground"
  },
  Analytics: {
    label: "Analytics",
    color: "text-orange-500 fill-current",
    icon: PieChart,
    activeContainer: "bg-orange-50/50 dark:bg-orange-900/10",
    headerActiveText: "text-orange-600 dark:text-orange-400",
    subItemActive: "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-foreground"
  },
};

// Animation Variants
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 }
  }
};

const itemVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { x: -10, opacity: 0 }
};

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
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
        bg-white dark:bg-[#09090b] 
        border-r border-default-200 dark:border-default-100/50 
        flex flex-col z-50 
        transition-all duration-300 ease-spring-s
        ${isSidebarOpen ? 'w-[260px]' : 'w-[68px]'}
      `}
    >
      {/* Brand */}
      <div className={`flex flex-col gap-4 pt-5 pb-2 ${isSidebarOpen ? 'px-4' : 'px-3 items-center'}`}>
        {/* Logo Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="shrink-0 scale-90 origin-left">
              <MetallicLogo />
            </div>
            {isSidebarOpen && (
              <span className="font-semibold text-base tracking-tight text-foreground whitespace-nowrap">
                EduMaster
              </span>
            )}
          </div>

          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-default-400 hover:text-foreground transition-colors p-1"
            >
              <ChevronsLeft size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Groups - Animated */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2 space-y-4 overflow-x-hidden">

        {/* GLOBAL ITEMS (Dashboard / Schedule) */}
        <div className={`space-y-0.5 ${isSidebarOpen ? "px-3" : "px-3"}`}>
          {globalItems.map((item, itemIndex) => {
            const isActive = location.pathname === item.href;
            return (
              <Tooltip
                key={item.href}
                content={item.label}
                placement="right"
                isDisabled={isSidebarOpen}
                classNames={{ content: "bg-foreground text-background text-xs font-medium px-2 py-1" }}
              >
                <NavLink to={item.href}>
                  <div className={`
                                flex items-center cursor-pointer
                                ${isSidebarOpen ? 'h-9 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto'}
                                rounded-lg transition-all duration-200 group
                                ${isActive
                      ? "bg-default-100 dark:bg-default-50/10 text-foreground font-medium"
                      : "text-default-500 hover:text-foreground hover:bg-default-50 dark:hover:bg-default-50/5"}
                            `}>
                    <span className={`transition-colors ${isActive ? "text-foreground" : "text-default-500 group-hover:text-foreground"}`}>
                      <item.icon size={18} />
                    </span>
                    {isSidebarOpen && (
                      <span className="text-[13.5px] whitespace-nowrap truncate">{item.label}</span>
                    )}
                  </div>
                </NavLink>
              </Tooltip>
            )
          })}
        </div>

        {/* DIVIDER */}
        <div className={`border-t border-default-200 dark:border-default-800 mx-5 my-2 ${!isSidebarOpen && 'mx-4'}`} />

        {/* MODULES ACCORDION */}
        <div className={`space-y-1 ${isSidebarOpen ? "px-3" : "px-3"}`}>
          {Object.entries(modules).map(([key, groups]) => {
            const info = moduleInfo[key];
            const isActive = key === 'FrontDesk' || key === 'Analytics'
              ? (key === 'FrontDesk' ? location.pathname.startsWith('/front-desk') : location.pathname.startsWith('/analytics'))
              : expandedModules.includes(key);

            const handleModuleClick = () => {
              // FrontDesk and Analytics are now direct links, not expandable
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
              <div
                key={key}
                className={`
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${isActive
                    ? `${info.activeContainer} rounded-xl mb-2`
                    : 'mb-1'}
                `}
              >
                {/* Module Header */}
                <Tooltip
                  content={info.label}
                  placement="right"
                  isDisabled={isSidebarOpen}
                  classNames={{ content: "bg-foreground text-background text-xs font-medium px-2 py-1" }}
                >
                  <button
                    onClick={handleModuleClick}
                    className={`
                              w-full flex items-center cursor-pointer transition-all duration-200 group
                              ${isSidebarOpen ? 'h-9 px-3 gap-3 justify-between' : 'h-10 justify-center w-10 mx-auto'}
                              ${!isActive && "rounded-lg"} 
                              ${isActive
                        ? info.headerActiveText
                        : "text-default-500 hover:text-foreground hover:bg-default-50 dark:hover:bg-default-50/5"}
                           `}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`transition-colors ${info.color}`}
                      >
                        <info.icon size={18} />
                      </motion.div>
                      {isSidebarOpen && (
                        <span className={`text-[13.5px] font-medium ${isActive ? 'font-semibold' : ''}`}>{info.label}</span>
                      )}
                    </div>
                    {isSidebarOpen && key !== 'FrontDesk' && key !== 'Analytics' && (
                      <ChevronRight size={14} className={`text-default-400 transition-transform duration-300 ${isActive ? 'rotate-90' : ''}`} />
                    )}
                  </button>
                </Tooltip>

                {/* Module Content (Expanded) */}
                <AnimatePresence>
                  {isSidebarOpen && isActive && groups.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-3 pl-3">
                        <div className="relative pl-3 border-l border-default-200 dark:border-default-800/50 ml-2.5">
                          <ul className="space-y-1">
                            {groups.map((group) =>
                              group.items.map((item, itemIndex) => {
                                const isItemActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
                                const isMessaging = item.href === '/messaging';
                                const showBadge = isMessaging && unreadCount > 0;
                                
                                return (
                                  <li key={`${group.title}-${itemIndex}`}>
                                    <NavLink to={item.href}>
                                      <div className={`
                                                                flex items-center h-8 px-2 gap-2.5 rounded-md transition-colors mx-2 relative
                                                                ${isItemActive
                                          ? `${info.subItemActive} font-medium`
                                          : "text-default-500 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"}
                                                            `}>
                                        <span className={isItemActive ? info.color : "opacity-70"}><item.icon size={15} /></span>
                                        <span className="text-[13px] truncate flex-1">{item.label}</span>
                                        {showBadge && (
                                          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </NavLink>
                                  </li>
                                )
                              })
                            )}
                          </ul>
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

      {/* Bottom Actions Area */}
      <div className={`
        mt-auto pt-2 pb-4 space-y-1 
        ${isSidebarOpen ? 'px-3' : 'px-3 items-center flex flex-col'}
      `}>
        {/* Developers / Settings Link */}
        <NavLink to="/settings">
          <div className={`
              flex items-center cursor-pointer
              ${isSidebarOpen ? 'h-9 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto'}
              rounded-lg transition-all duration-200 text-default-500 hover:text-foreground hover:bg-default-50 dark:hover:bg-default-50/5
            `}>
            <Settings size={18} />
            {isSidebarOpen && <span className="text-[13.5px] font-medium">Settings</span>}
          </div>
        </NavLink>

        {/* Theme Toggle */}
        <div
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`
            flex items-center cursor-pointer
            ${isSidebarOpen ? 'h-9 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto'}
            rounded-lg transition-all duration-200 text-default-500 hover:text-foreground hover:bg-default-50 dark:hover:bg-default-50/5
          `}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {isSidebarOpen && <span className="text-[13.5px] font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </div>

        {/* Divider */}
        {isSidebarOpen && <div className="h-px w-full bg-default-200 dark:bg-default-800 my-2" />}


        {/* User Profile */}
        <Popover
          placement={isSidebarOpen ? "top-start" : "right"}
          isOpen={isUserMenuOpen}
          onOpenChange={(open) => {
            console.log('🟢 Popover onOpenChange called with:', open);
            setIsUserMenuOpen(open);
          }}
          offset={12}
          shouldBlockScroll={false}
          showArrow
          portalContainer={document.body}
        >
          <PopoverTrigger>
            <button
              type="button"
              onClick={() => {
                console.log('🔵 Profile clicked, toggling menu. Current state:', isUserMenuOpen);
                setIsUserMenuOpen((v) => {
                  console.log('🔵 New menu state will be:', !v);
                  return !v;
                });
              }}
              className={`
                flex items-center group
                ${isSidebarOpen ? 'w-full px-2 py-2 gap-3 hover:bg-default-100 rounded-xl' : 'justify-center w-10 h-10 rounded-full hover:ring-2 ring-default-200'}
                transition-all
                focus:outline-none
              `}
            >
              <Avatar
                src={`https://i.pravatar.cc/150?u=${user?.id || 'admin'}`}
                name={user?.name?.[0] || "A"}
                size="sm"
                className="w-8 h-8 text-[10px]"
                isBordered
              />
              {isSidebarOpen && (
                <div className="flex-1 flex flex-col items-start overflow-hidden">
                  <span className="text-[13px] font-semibold text-foreground truncate w-full leading-tight">
                    {user?.name || "Julia"}
                  </span>
                  <span className="text-[11px] text-default-400 truncate w-full leading-tight">
                    My Workspace
                  </span>
                </div>
              )}
              {isSidebarOpen && (
                <ChevronRight
                  size={14}
                  className="text-default-400 group-hover:translate-x-0.5 transition-transform"
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0"
            style={{ zIndex: 99999 }}
          >
            <div className="min-w-[220px] rounded-xl border border-default-200 bg-background shadow-xl">
              <div className="px-3 py-2 border-b border-default-200">
                <p className="text-xs text-default-500">Signed in as</p>
                <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-default-100 transition-colors"
                >
                  My Settings
                </button>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-default-100 transition-colors"
                >
                  Help & Feedback
                </button>
                <div className="h-px bg-default-200 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(true)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-zinc-800 border border-default-200 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition-transform z-50 text-default-500"
        >
          <ChevronsLeft size={12} className="rotate-180" />
        </div>
      )}
    </aside>
  );
}

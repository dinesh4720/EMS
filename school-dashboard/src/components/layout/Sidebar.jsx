import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, IndianRupee, Settings,
  ChevronsLeft, GraduationCap, Calendar, BarChart3, DoorOpen,
  Sun, Moon, ChevronRight,
  Layers, Award, Package, Building2, Bus, Library,
  ClipboardList, Wand2, FileBarChart, Database,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Tooltip from "../ui/Tooltip";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import UserMenu from "./UserMenu";
import SchoolSwitcher from "./SchoolSwitcher";

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
        { icon: ClipboardList, label: "Intake Forms", href: "/intake-forms/assignments" },
      ]
    },
    {
      title: "Academics",
      items: [
        { icon: Award, label: "Academics", href: "/academics" },
        { icon: ClipboardList, label: "Homework", href: "/homework" },
        { icon: Users, label: "PTM", href: "/ptm" },
        { icon: Wand2, label: "Timetable Wizard", href: "/timetable-wizard" },
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
    },
    {
      title: "Operations",
      items: [
        { icon: Package, label: "Inventory", href: "/inventory" },
        { icon: Library, label: "Library", href: "/library" },
        { icon: Building2, label: "Hostel", href: "/hostel" },
        { icon: Bus, label: "Transport", href: "/transport" },
        { icon: Database, label: "Data Tools", href: "/data-tools" },
      ]
    },
    {
      title: "Reports",
      items: [
        { icon: FileBarChart, label: "Reports", href: "/reports" },
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
  const { t } = useTranslation();
  const chatNotifications = useChatNotifications();
  const unreadCount = chatNotifications?.unreadCount || 0;
  const [expandedModules, setExpandedModules] = useState(["EMS"]);

  // Auto-expand the module containing the current route (handles browser back/forward navigation)
  useEffect(() => {
    Object.entries(modules).forEach(([key, groups]) => {
      if (key === 'FrontDesk' || key === 'Analytics') return;
      const containsCurrentRoute = groups.some(group =>
        group.items.some(item =>
          location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href + '/'))
        )
      );
      if (containsCurrentRoute) {
        setExpandedModules(prev => prev.includes(key) ? prev : [...prev, key]);
      }
    });
  }, [location.pathname]);

  // Mobile drawer: close sidebar on route change (< lg breakpoint)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // Intentionally only run on pathname change, not on isSidebarOpen change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape when mobile drawer is open
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      if (typeof window === 'undefined') return;
      if (window.matchMedia('(max-width: 1023px)').matches) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSidebarOpen, setIsSidebarOpen]);

  const closeOnMobileNav = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setIsSidebarOpen(false);
    }
  }, [setIsSidebarOpen]);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close navigation"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden cursor-default"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        data-tour="sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={`
          fixed left-0 top-0 h-screen
          bg-white dark:bg-zinc-950
          border-r border-gray-200 dark:border-zinc-800
          flex flex-col z-50
          transition-all duration-300
          ${isSidebarOpen ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-width-collapsed)] max-lg:-translate-x-full'}
        `}
      >
      {/* Brand + SchoolSwitcher */}
      <SchoolSwitcher
        collapsed={!isSidebarOpen}
        onToggleCollapsed={() => setIsSidebarOpen(false)}
      />

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
              >
                <NavLink
                  to={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeOnMobileNav}
                >
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
                closeOnMobileNav();
                return;
              }
              if (key === 'Analytics') {
                navigate('/analytics');
                closeOnMobileNav();
                return;
              }

              if (!isSidebarOpen) {
                setIsSidebarOpen(true);
                if (!expandedModules.includes(key)) {
                  setExpandedModules([...expandedModules, key]);
                }
              } else {
                if (isActive) {
                  setExpandedModules(expandedModules.filter(mod => mod !== key));
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
                >
                  <button
                    onClick={handleModuleClick}
                    aria-expanded={isSidebarOpen && isActive && groups.length > 0}
                    className={`
                      w-full flex items-center cursor-pointer transition-colors
                      ${isSidebarOpen ? 'py-2 px-3 gap-3 justify-between' : 'h-10 justify-center w-10 mx-auto py-0'}
                      rounded-lg
                      ${isActive
                        ? "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"}
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
                          {groups.filter(grp => grp.items.length > 0).map((group) => (
                            <div key={group.title}>
                              {groups.filter(grp => grp.items.length > 0).length > 1 && group.title && (
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-2 pt-2 pb-1">{group.title}</p>
                              )}
                            {group.items.map((item) => {
                              const isItemActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href + '/'));
                              const isMessaging = item.href === '/messaging';
                              const showBadge = isMessaging && unreadCount > 0;

                              return (
                                <NavLink
                                  key={item.href}
                                  to={item.href}
                                  aria-current={isItemActive ? "page" : undefined}
                                  onClick={closeOnMobileNav}
                                >
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
                            })}
                            </div>
                          ))}
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
        <NavLink
          to="/settings"
          aria-current={location.pathname.startsWith('/settings') ? "page" : undefined}
          onClick={closeOnMobileNav}
        >
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
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`
            flex items-center cursor-pointer
            ${isSidebarOpen ? 'py-2 px-3 gap-3' : 'h-10 justify-center w-10 mx-auto py-0'}
            rounded-lg transition-colors text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800
          `}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          {isSidebarOpen && <span className="text-sm font-medium">{theme === 'dark' ? t('sidebar.lightMode', 'Light Mode') : t('sidebar.darkMode', 'Dark Mode')}</span>}
        </button>

        {/* User Menu */}
        <UserMenu collapsed={!isSidebarOpen} />
      </div>

      {/* Expand Button (when collapsed, desktop only) */}
      {!isSidebarOpen && (
        <button
          type="button"
          aria-label="Expand sidebar"
          onClick={() => setIsSidebarOpen(true)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-full items-center justify-center cursor-pointer hover:scale-110 transition-transform z-50 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
        >
          <ChevronsLeft size={12} className="rotate-180" />
        </button>
      )}
    </aside>
    </>
  );
}

export default React.memo(Sidebar);

import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  MessageSquare, IndianRupee, Settings, Award, ClipboardList,
  Wand2, Package, Library, Building2, Bus, FileBarChart, Database,
  DoorOpen, BarChart3, Sparkles, ChevronRight, Palette, Wallet,
  CalendarCheck, FileText, BookMarked, UserCheck, SendHorizontal,
  Search, X, MoreHorizontal,
} from "lucide-react";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { useApp } from "../../context/AppContext";
import { useSchool } from "../../context/SchoolContext";
import UserMenu from "./UserMenu";
import { getPinnedPages, subscribePinnedPages } from "../../utils/pinnedPages";

/* ============================================================
   Navigation Configuration — Hierarchical IA (DK-598)
   ============================================================ */

const PRIMARY_MODULES = [
  {
    id: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    end: true,
  },
  {
    id: "students",
    href: "/students",
    icon: GraduationCap,
    label: "Students",
    children: [
      { href: "/students/attendance", icon: CalendarCheck, label: "Attendance" },
      { href: "/students/submissions", icon: SendHorizontal, label: "Form Submissions" },
      { href: "/students/promotion", icon: Award, label: "Promotion" },
      { href: "/students/transfer-certificate", icon: FileText, label: "Transfer Certificate" },
    ],
  },
  {
    id: "staff",
    href: "/staffs",
    icon: Users,
    label: "Staff",
    children: [
      { href: "/staffs/payroll", icon: Wallet, label: "Payroll" },
      { href: "/staffs/bulk-subjects", icon: BookMarked, label: "Bulk Subjects" },
    ],
  },
  {
    id: "academics",
    href: "/academics",
    icon: Award,
    label: "Academics",
    children: [
      { href: "/academics/exams", icon: FileBarChart, label: "Exams" },
      { href: "/homework", icon: ClipboardList, label: "Homework" },
      { href: "/ptm", icon: UserCheck, label: "PTM" },
      { href: "/timetable-wizard", icon: Wand2, label: "Timetable Wizard" },
    ],
  },
  {
    id: "classes",
    href: "/classes",
    icon: BookOpen,
    label: "Classes",
  },
  {
    id: "calendar",
    href: "/calendar",
    icon: Calendar,
    label: "Calendar",
  },
  {
    id: "messaging",
    href: "/messaging",
    icon: MessageSquare,
    label: "Messaging",
    chatBadge: true,
  },
  {
    id: "fees",
    href: "/fees",
    icon: IndianRupee,
    label: "Fees",
  },
];

const OPERATIONS = [
  { id: "front-desk", href: "/front-desk", icon: DoorOpen, label: "Front Desk" },
  { id: "library", href: "/library", icon: Library, label: "Library" },
  { id: "inventory", href: "/inventory", icon: Package, label: "Inventory" },
  { id: "hostel", href: "/hostel", icon: Building2, label: "Hostel" },
  { id: "transport", href: "/transport", icon: Bus, label: "Transport" },
];

const INSIGHTS = [
  { id: "reports", href: "/reports", icon: FileBarChart, label: "Reports" },
  { id: "analytics", href: "/analytics", icon: BarChart3, label: "Analytics" },
  { id: "ai-assistant", href: "/ai-assistant", icon: Sparkles, label: "AI Assistant" },
];

const ADMINISTRATION = [
  { id: "intake-forms", href: "/intake-forms/assignments", icon: FileText, label: "Intake Forms" },
  { id: "data-tools", href: "/data-tools", icon: Database, label: "Data Tools" },
  { id: "style-guide", href: "/style-guide", icon: Palette, label: "Style Guide" },
];

const ALL_NAV_ITEMS = [
  ...PRIMARY_MODULES,
  ...PRIMARY_MODULES.flatMap((m) => m.children || []),
  ...OPERATIONS,
  ...INSIGHTS,
  ...ADMINISTRATION,
];

function resolveIconForHref(href) {
  const exact = ALL_NAV_ITEMS.find((i) => i.href === href);
  if (exact?.icon) return exact.icon;
  const partial = ALL_NAV_ITEMS.find(
    (i) => i.href !== "/" && href.startsWith(i.href + "/")
  );
  if (partial?.icon) return partial.icon;
  return null;
}

function isRouteActive(pathname, href) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

function getActiveModuleId(pathname) {
  if (pathname === "/") return "dashboard";
  if (isRouteActive(pathname, "/students")) return "students";
  if (isRouteActive(pathname, "/staffs")) return "staff";
  if (isRouteActive(pathname, "/academics") || pathname === "/homework" || pathname === "/ptm" || pathname === "/timetable-wizard") return "academics";
  if (isRouteActive(pathname, "/classes")) return "classes";
  if (isRouteActive(pathname, "/calendar")) return "calendar";
  if (isRouteActive(pathname, "/messaging")) return "messaging";
  if (isRouteActive(pathname, "/fees")) return "fees";
  if (isRouteActive(pathname, "/front-desk")) return "front-desk";
  if (isRouteActive(pathname, "/library")) return "library";
  if (isRouteActive(pathname, "/inventory")) return "inventory";
  if (isRouteActive(pathname, "/hostel")) return "hostel";
  if (isRouteActive(pathname, "/transport")) return "transport";
  if (isRouteActive(pathname, "/reports")) return "reports";
  if (isRouteActive(pathname, "/analytics")) return "analytics";
  if (pathname === "/ai-assistant") return "ai-assistant";
  if (isRouteActive(pathname, "/intake-forms")) return "intake-forms";
  if (isRouteActive(pathname, "/data-tools")) return "data-tools";
  if (pathname === "/style-guide") return "style-guide";
  return null;
}

/* ============================================================
   Sub-components
   ============================================================ */

function ChildItem({ to, icon: Icon, label, onNav, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onNav}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `sidebar__item sidebar__item--child${isActive ? " is-active" : ""}`
      }
    >
      {collapsed && Icon && <Icon size={14} strokeWidth={1.6} aria-hidden />}
      {!collapsed && <span className="sidebar__label">{label}</span>}
    </NavLink>
  );
}

function ParentModule({ module, collapsed, onNav, expanded, onToggle, unreadCount }) {
  const { icon: Icon, label, href, children, chatBadge, end } = module;
  const hasChildren = children && children.length > 0;
  const badge = chatBadge && unreadCount > 0
    ? unreadCount > 99 ? "99+" : unreadCount
    : undefined;

  if (collapsed) {
    return (
      <NavLink
        to={href}
        end={end}
        onClick={onNav}
        title={label}
        className={({ isActive }) => `sidebar__item${isActive ? " is-active" : ""}`}
      >
        <Icon size={15} strokeWidth={1.6} aria-hidden />
        {badge != null && (
          <span className="sidebar__badge sidebar__badge--corner">
            {badge}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div className={`sidebar__item sidebar__item--parent${expanded ? " is-expanded" : ""}`}>
      <NavLink
        to={href}
        end={end !== false}
        onClick={onNav}
        className={({ isActive }) => `${isActive ? "is-active" : ""}`}
      >
        <Icon size={15} strokeWidth={1.6} aria-hidden />
        <span className="sidebar__label">{label}</span>
        {badge != null && <span className="sidebar__badge">{badge}</span>}
      </NavLink>
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className="sidebar__chevron"
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          aria-expanded={expanded}
          aria-controls={`nav-children-${module.id}`}
        >
          <ChevronRight
            size={14}
            strokeWidth={1.6}
            style={{
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 150ms",
            }}
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}

function SimpleNavItem({ to, icon: Icon, label, onNav, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onNav}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `sidebar__item${isActive ? " is-active" : ""}`}
    >
      <Icon size={15} strokeWidth={1.6} aria-hidden />
      {!collapsed && <span className="sidebar__label">{label}</span>}
    </NavLink>
  );
}

function NavGroup({ heading, items, collapsed, onNav, defaultExpanded, forceExpanded, searchQuery }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const isExpanded = forceExpanded || expanded;

  if (collapsed) return null;

  const visibleItems = searchQuery
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.href.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  if (visibleItems.length === 0) return null;

  return (
    <div className="sidebar__group">
      <button
        type="button"
        className="sidebar__group-head"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls={`nav-group-${heading.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {heading}
        <ChevronRight
          size={14}
          strokeWidth={1.6}
          className={`sidebar__group-chevron${isExpanded ? " is-expanded" : ""}`}
          aria-hidden
        />
      </button>
      {isExpanded && (
        <div className="sidebar__group-body" id={`nav-group-${heading.toLowerCase().replace(/\s+/g, '-')}`}>
          {visibleItems.map((item) => (
            <SimpleNavItem
              key={item.id}
              to={item.href}
              icon={item.icon}
              label={item.label}
              onNav={onNav}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavFlyout({ rect, title, items, groups, onNav, onClose, onMouseEnter }) {
  return (
    <div
      className="nav-flyout"
      style={{ top: rect.top, left: rect.right + 4 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onClose}
    >
      {title && <div className="nav-flyout__title">{title}</div>}
      {groups ? (
        groups.map((group) => (
          <div key={group.title} className="nav-flyout__group">
            <div className="nav-flyout__group-header">{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNav}
                className={({ isActive }) => `nav-flyout__item${isActive ? " is-active" : ""}`}
              >
                {item.icon && <item.icon size={14} strokeWidth={1.6} aria-hidden />}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))
      ) : (
        items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onNav}
            className={({ isActive }) => `nav-flyout__item${isActive ? " is-active" : ""}`}
          >
            {item.icon && <item.icon size={14} strokeWidth={1.6} aria-hidden />}
            <span>{item.label}</span>
          </NavLink>
        ))
      )}
    </div>
  );
}

/* ============================================================
   Mobile Bottom Bar
   ============================================================ */

function BottomBar({ activeModuleId, unreadCount, onMoreClick }) {
  const tabs = [
    { id: "dashboard", href: "/", label: "Dash", icon: LayoutDashboard, end: true },
    { id: "students", href: "/students", label: "Students", icon: GraduationCap },
    { id: "calendar", href: "/calendar", label: "Calendar", icon: Calendar },
    { id: "messaging", href: "/messaging", label: "Msg", icon: MessageSquare },
  ];

  return (
    <nav className="bottom-bar" role="navigation" aria-label="Primary navigation">
      {tabs.map((tab) => {
        const isActive = tab.id === activeModuleId;
        const badge = tab.id === "messaging" && unreadCount > 0;
        return (
          <NavLink
            key={tab.id}
            to={tab.href}
            end={tab.end}
            className={`bottom-bar__item${isActive ? " is-active" : ""}`}
          >
            <div className="bottom-bar__icon-wrap">
              <tab.icon size={20} strokeWidth={1.8} aria-hidden />
              {badge && <span className="bottom-bar__badge" aria-label={`${unreadCount} unread messages`} />}
            </div>
            <span className="bottom-bar__label">{tab.label}</span>
          </NavLink>
        );
      })}
      <button
        type="button"
        className="bottom-bar__item"
        onClick={onMoreClick}
        aria-label="More navigation"
      >
        <MoreHorizontal size={20} strokeWidth={1.8} aria-hidden />
        <span className="bottom-bar__label">More</span>
      </button>
    </nav>
  );
}

/* ============================================================
   Mobile Bottom Sheet
   ============================================================ */

function BottomSheet({
  isOpen,
  onClose,
  visiblePrimary,
  visibleOperations,
  visibleInsights,
  visibleAdmin,
  pinnedWithIcons,
  expandedModules,
  expandedGroups: _expandedGroups,
  onToggleModule,
  onToggleGroup: _onToggleGroup,
  activeModuleId,
  isSearching,
  searchQuery,
  setSearchQuery,
  closeOnMobileNav,
  unreadCount,
  schoolName,
  currentAcademicYear,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;
    const first = sheetRef.current.querySelector("input, a, button");
    first?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="bottom-sheet__handle" aria-hidden="true" />

        {/* Brand */}
        <div className="bottom-sheet__brand">
          <div className="brand-mark" aria-hidden>
            <GraduationCap size={14} strokeWidth={2} />
          </div>
          <div className="brand-text">
            <span className="brand-name">{schoolName}</span>
            {currentAcademicYear && <span className="brand-sub">{currentAcademicYear}</span>}
          </div>
        </div>

        {/* Search */}
        <div className="bottom-sheet__search">
          <Search size={14} className="text-fg-faint flex-shrink-0" aria-hidden />
          <input
            type="text"
            placeholder="Search pages…"
            className="sidebar__search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search navigation"
          />
          {searchQuery && (
            <button
              type="button"
              className="sidebar__search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>

        {/* Nav */}
        <div className="bottom-sheet__body">
          {!isSearching && <div className="sidebar__heading">Workspace</div>}

          {visiblePrimary.map((module) => {
            const isExpanded = isSearching || expandedModules[module.id] || activeModuleId === module.id;
            return (
              <React.Fragment key={module.id}>
                <ParentModule
                  module={module}
                  collapsed={false}
                  onNav={closeOnMobileNav}
                  expanded={isExpanded}
                  onToggle={() => onToggleModule(module.id)}
                  unreadCount={unreadCount}
                />
                {isExpanded && module.children && (
                  <div className="sidebar__group-body" id={`nav-children-${module.id}`}>
                    {module.children.map((child) => (
                      <ChildItem
                        key={child.href}
                        to={child.href}
                        icon={child.icon}
                        label={child.label}
                        onNav={closeOnMobileNav}
                        collapsed={false}
                      />
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {pinnedWithIcons.length > 0 && (
            <>
              <div className="sidebar__heading sidebar__heading--spaced">Pinned</div>
              {pinnedWithIcons.map((item, i) => (
                <NavLink
                  key={`pin-${item.href}-${i}`}
                  to={item.href}
                  onClick={closeOnMobileNav}
                  className={({ isActive }) =>
                    `sidebar__item${isActive ? " is-active" : ""}`
                  }
                >
                  {item.icon ? (
                    <item.icon size={15} strokeWidth={1.6} aria-hidden />
                  ) : (
                    <span className="dot" style={{ color: "var(--info)" }} aria-hidden />
                  )}
                  <span className="sidebar__label">{item.label}</span>
                </NavLink>
              ))}
            </>
          )}

          <NavGroup
            heading="Operations"
            items={visibleOperations}
            collapsed={false}
            onNav={closeOnMobileNav}
            defaultExpanded={false}
            forceExpanded={isSearching}
            searchQuery={isSearching ? searchQuery : ""}
          />
          <NavGroup
            heading="Insights"
            items={visibleInsights}
            collapsed={false}
            onNav={closeOnMobileNav}
            defaultExpanded={false}
            forceExpanded={isSearching}
            searchQuery={isSearching ? searchQuery : ""}
          />
          <NavGroup
            heading="Administration"
            items={visibleAdmin}
            collapsed={false}
            onNav={closeOnMobileNav}
            defaultExpanded={false}
            forceExpanded={isSearching}
            searchQuery={isSearching ? searchQuery : ""}
          />

          {isSearching &&
            visiblePrimary.length === 0 &&
            visibleOperations.length === 0 &&
            visibleInsights.length === 0 &&
            visibleAdmin.length === 0 &&
            pinnedWithIcons.length === 0 && (
              <div className="sidebar__empty">No pages match &ldquo;{searchQuery}&rdquo;</div>
            )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Sidebar
   ============================================================ */

function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const { schoolSettings } = useSchool();
  const { currentAcademicYear } = useApp();
  const chatNotifications = useChatNotifications();
  const unreadCount = chatNotifications?.unreadCount || 0;

  const collapsed = !isSidebarOpen;
  const schoolName = schoolSettings?.name?.trim() || "SchoolSync";

  const [pinned, setPinned] = useState(() => getPinnedPages());
  useEffect(() => {
    return subscribePinnedPages(setPinned);
  }, []);

  const [expandedModules, setExpandedModules] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const [flyout, setFlyout] = useState(null);
  const flyoutTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Auto-expand active module & group on route change
  useEffect(() => {
    const activeId = getActiveModuleId(location.pathname);
    const parentModule = PRIMARY_MODULES.find((m) => m.id === activeId);
    if (parentModule?.children) {
      setExpandedModules((prev) => ({ ...prev, [parentModule.id]: true }));
    }
    if (OPERATIONS.some((i) => i.id === activeId)) {
      setExpandedGroups((prev) => ({ ...prev, operations: true }));
    }
    if (INSIGHTS.some((i) => i.id === activeId)) {
      setExpandedGroups((prev) => ({ ...prev, insights: true }));
    }
    if (ADMINISTRATION.some((i) => i.id === activeId)) {
      setExpandedGroups((prev) => ({ ...prev, administration: true }));
    }
  }, [location.pathname]);

  // Mobile drawer: close on route change at < md (768px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Esc closes mobile drawer
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (typeof window === "undefined") return;
      if (window.matchMedia("(max-width: 767px)").matches) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSidebarOpen, setIsSidebarOpen]);

  const closeOnMobileNav = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setIsSidebarOpen(false);
    }
  }, [setIsSidebarOpen]);

  const showFlyout = useCallback((el, items, title, groups) => {
    clearTimeout(flyoutTimeoutRef.current);
    flyoutTimeoutRef.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setFlyout({ rect, items, title, groups });
    }, 150);
  }, []);

  const hideFlyout = useCallback(() => {
    clearTimeout(flyoutTimeoutRef.current);
    flyoutTimeoutRef.current = setTimeout(() => {
      setFlyout(null);
    }, 200);
  }, []);

  const clearFlyout = useCallback(() => {
    clearTimeout(flyoutTimeoutRef.current);
    setFlyout(null);
  }, []);

  const keepFlyoutOpen = useCallback(() => {
    clearTimeout(flyoutTimeoutRef.current);
  }, []);

  const activeModuleId = getActiveModuleId(location.pathname);
  const isSearching = searchQuery.trim().length > 0;

  // Filter helpers for mobile search
  const filterModules = (mods) =>
    mods
      .map((m) => {
        const q = searchQuery.toLowerCase();
        const selfMatch =
          m.label.toLowerCase().includes(q) || m.href.toLowerCase().includes(q);
        const childMatch = m.children?.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.href.toLowerCase().includes(q)
        );
        if (selfMatch) return m;
        if (childMatch?.length) return { ...m, children: childMatch };
        return null;
      })
      .filter(Boolean);

  const filterSimple = (items) =>
    items.filter(
      (i) =>
        i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.href.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const visiblePrimary = isSearching
    ? filterModules(PRIMARY_MODULES)
    : PRIMARY_MODULES;
  const visibleOperations = isSearching ? filterSimple(OPERATIONS) : OPERATIONS;
  const visibleInsights = isSearching ? filterSimple(INSIGHTS) : INSIGHTS;
  const visibleAdmin = isSearching ? filterSimple(ADMINISTRATION) : ADMINISTRATION;

  const pinnedWithIcons = useMemo(
    () =>
      pinned.map((p) => ({
        ...p,
        icon: resolveIconForHref(p.href),
      })),
    [pinned]
  );

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <>
          {isSidebarOpen && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close navigation"
              className="sidebar__backdrop"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside
            ref={sidebarRef}
            data-tour="sidebar"
            role="navigation"
            aria-label="Main navigation"
            className={`sidebar ${collapsed ? "sidebar--rail" : ""} fixed left-0 top-0 h-screen z-50 transition-transform duration-200 ${
              isSidebarOpen
                ? "w-[var(--sidebar-w)]"
                : "w-[var(--sidebar-w-collapsed)]"
            }`}
          >
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="brand-mark" aria-hidden>
            <GraduationCap size={14} strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name" title={schoolName}>{schoolName}</span>
              {currentAcademicYear && (
                <span className="brand-sub">{currentAcademicYear}</span>
              )}
            </div>
          )}
        </div>

        {/* Mobile search */}
        {!collapsed && (
          <div className="sidebar__mobile-search">
            <Search size={14} className="text-fg-faint flex-shrink-0" aria-hidden />
            <input
              type="text"
              placeholder="Search pages…"
              className="sidebar__search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search navigation"
            />
            {searchQuery && (
              <button
                type="button"
                className="sidebar__search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar__nav">
          {!collapsed && <div className="sidebar__heading">Workspace</div>}

          {visiblePrimary.map((module) => {
            const isExpanded =
              isSearching || expandedModules[module.id] || activeModuleId === module.id;
            return (
              <React.Fragment key={module.id}>
                <div
                  onMouseEnter={(e) => {
                    if (collapsed && module.children) {
                      showFlyout(e.currentTarget, module.children, module.label);
                    }
                  }}
                  onMouseLeave={hideFlyout}
                >
                  <ParentModule
                    module={module}
                    collapsed={collapsed}
                    onNav={() => {
                      closeOnMobileNav();
                      clearFlyout();
                    }}
                    expanded={isExpanded}
                    onToggle={() =>
                      setExpandedModules((prev) => ({
                        ...prev,
                        [module.id]: !prev[module.id],
                      }))
                    }
                    unreadCount={unreadCount}
                  />
                </div>
                {!collapsed && isExpanded && module.children && (
                  <div className="sidebar__group-body" id={`nav-children-${module.id}`}>
                    {module.children.map((child) => (
                      <ChildItem
                        key={child.href}
                        to={child.href}
                        icon={child.icon}
                        label={child.label}
                        onNav={closeOnMobileNav}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Pinned */}
          {!collapsed && pinnedWithIcons.length > 0 && (
            <>
              <div
                data-coach="sidebar-pin"
                className="sidebar__heading sidebar__heading--spaced"
              >
                Pinned
              </div>
              {pinnedWithIcons.map((item, i) => (
                <NavLink
                  key={`pin-${item.href}-${i}`}
                  to={item.href}
                  onClick={closeOnMobileNav}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `sidebar__item${isActive ? " is-active" : ""}`
                  }
                >
                  {item.icon ? (
                    <item.icon size={15} strokeWidth={1.6} aria-hidden />
                  ) : (
                    <span className="dot" style={{ color: "var(--info)" }} aria-hidden />
                  )}
                  {!collapsed && (
                    <span className="sidebar__label">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </>
          )}

          {/* Collapsed rail: pinned icons */}
          {collapsed && pinnedWithIcons.length > 0 && (
            <>
              {pinnedWithIcons.map((item, i) => (
                <NavLink
                  key={`pin-${item.href}-${i}`}
                  to={item.href}
                  onClick={closeOnMobileNav}
                  title={item.label}
                  className={({ isActive }) =>
                    `sidebar__item${isActive ? " is-active" : ""}`
                  }
                >
                  {item.icon ? (
                    <item.icon size={15} strokeWidth={1.6} aria-hidden />
                  ) : (
                    <span className="dot" style={{ color: "var(--info)" }} aria-hidden />
                  )}
                </NavLink>
              ))}
            </>
          )}

          {/* Operations */}
          {!collapsed && (
            <NavGroup
              heading="Operations"
              items={visibleOperations}
              collapsed={collapsed}
              onNav={closeOnMobileNav}
              defaultExpanded={false}
              forceExpanded={isSearching}
              searchQuery={isSearching ? searchQuery : ""}
            />
          )}

          {/* Insights */}
          {!collapsed && (
            <NavGroup
              heading="Insights"
              items={visibleInsights}
              collapsed={collapsed}
              onNav={closeOnMobileNav}
              defaultExpanded={false}
              forceExpanded={isSearching}
              searchQuery={isSearching ? searchQuery : ""}
            />
          )}

          {/* Administration */}
          {!collapsed && (
            <NavGroup
              heading="Administration"
              items={visibleAdmin}
              collapsed={collapsed}
              onNav={closeOnMobileNav}
              defaultExpanded={false}
              forceExpanded={isSearching}
              searchQuery={isSearching ? searchQuery : ""}
            />
          )}

          {/* Collapsed rail: "More" trigger for tier 2-4 groups */}
          {collapsed && (
            <div
              className="sidebar__more-trigger"
              title="More"
              onMouseEnter={(e) => {
                const allTiered = [
                  { title: "Operations", items: OPERATIONS },
                  { title: "Insights", items: INSIGHTS },
                  { title: "Administration", items: ADMINISTRATION },
                ];
                showFlyout(e.currentTarget, null, null, allTiered);
              }}
              onMouseLeave={hideFlyout}
              onClick={() => setIsSidebarOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Show more navigation"
            >
              <MoreHorizontal size={18} strokeWidth={1.6} aria-hidden />
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar__foot">
          <SimpleNavItem
            to="/settings"
            icon={Settings}
            label="Settings"
            onNav={closeOnMobileNav}
            collapsed={collapsed}
          />
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>

      {/* Flyout panel (portal-like, fixed position) */}
      {flyout && (
        <NavFlyout
          rect={flyout.rect}
          title={flyout.title}
          items={flyout.items}
          groups={flyout.groups}
          onNav={() => {
            closeOnMobileNav();
            clearFlyout();
          }}
          onClose={hideFlyout}
          onMouseEnter={keepFlyoutOpen}
        />
      )}
        </>
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <BottomBar
          activeModuleId={activeModuleId}
          unreadCount={unreadCount}
          onMoreClick={() => setIsSidebarOpen((v) => !v)}
        />
      )}

      {/* Mobile bottom sheet ("More" nav) */}
      {isMobile && (
        <BottomSheet
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          visiblePrimary={visiblePrimary}
          visibleOperations={visibleOperations}
          visibleInsights={visibleInsights}
          visibleAdmin={visibleAdmin}
          pinnedWithIcons={pinnedWithIcons}
          expandedModules={expandedModules}
          expandedGroups={expandedGroups}
          onToggleModule={(id) =>
            setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }))
          }
          onToggleGroup={(key) =>
            setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
          }
          activeModuleId={activeModuleId}
          isSearching={isSearching}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          closeOnMobileNav={() => {
            setIsSidebarOpen(false);
            setSearchQuery("");
          }}
          unreadCount={unreadCount}
          schoolName={schoolName}
          currentAcademicYear={currentAcademicYear}
        />
      )}
    </>
  );
}

export default React.memo(Sidebar);

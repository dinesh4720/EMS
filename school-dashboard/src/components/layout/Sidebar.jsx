import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronRight, ChevronsLeft, ChevronsRight, GraduationCap, Search, Sun, Moon, Rocket,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { useAppMeta } from "../../context/AppContext";
import { useSchool } from "../../context/SchoolContext";
import { usePermissions } from "../../context/PermissionContext";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import { getPinnedPages, subscribePinnedPages } from "../../utils/pinnedPages";
import {
  NAV_GROUPS, SETTINGS_ITEM, getActiveSectionId, resolveIconForHref, filterNavGroups,
} from "./nav/navConfig";
import NavPanel from "./nav/NavPanel";
import { BottomBar, BottomSheet } from "./nav/MobileNav";
import { useNavHover } from "./nav/useNavHover";

/* Opens the existing ⌘K command palette (Topbar listens for this event). */
function openCommandPalette() {
  window.dispatchEvent(new CustomEvent("ems:open-command-palette"));
}

/* ============================================================
   Sidebar — Navigation Redesign (two-level overlay IA)
   Calm rail of main sections only; clicking a section with
   sub-pages opens an overlay panel beside it. Works the same
   expanded or minimized. Mobile falls back to bottom bar/sheet.
   ============================================================ */
function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const { schoolSettings } = useSchool();
  const { currentAcademicYear, setShowOnboarding } = useAppMeta();
  const chatNotifications = useChatNotifications();
  const unreadCount = chatNotifications?.unreadCount || 0;

  const { isModuleEnabled, enabledModules } = usePermissions();

  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const collapsed = !isSidebarOpen;
  const schoolName = schoolSettings?.name?.trim() || "SchoolSync";
  const activeSectionId = getActiveSectionId(location.pathname);

  // Nav with school-disabled modules removed. Recomputed when the enabled-module
  // set changes (enabledModules); isModuleEnabled is stable per that value.
  const navGroups = useMemo(
    () => filterNavGroups(NAV_GROUPS, isModuleEnabled),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabledModules]
  );

  const [pinned, setPinned] = useState(() => getPinnedPages());
  useEffect(() => subscribePinnedPages(setPinned), []);
  const pinnedWithIcons = useMemo(
    () => pinned.map((p) => ({ ...p, icon: resolveIconForHref(p.href) })),
    [pinned]
  );

  // Overlay panel — hover-driven with menu-aim (see useNavHover)
  const sidebarRef = useRef(null);
  const {
    openId: openPanelId,
    anchorRect,
    close: closePanel,
    hoverProps,
    onItemClick,
    panelProps,
  } = useNavHover();
  const openSection = openPanelId
    ? navGroups.flatMap((g) => g.items).find((s) => s.id === openPanelId)
    : null;

  // Responsive: mobile uses bottom bar/sheet instead of the rail.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Close the overlay on route change, outside click, Esc, resize, scroll.
  useEffect(() => {
    closePanel();
  }, [location.pathname, location.search, closePanel]);

  useEffect(() => {
    if (!openPanelId) return undefined;
    const onDown = (e) => {
      if (e.target.closest("#nav-panel")) return;
      if (sidebarRef.current?.contains(e.target)) return;
      closePanel();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closePanel();
    };
    const onShift = () => closePanel();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onShift);
    window.addEventListener("scroll", onShift, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onShift);
      window.removeEventListener("scroll", onShift, true);
    };
  }, [openPanelId, closePanel]);

  // Mobile drawer: close on route change below md.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ⌘\ toggles the rail (desktop affordance from the design).
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        const el = document.activeElement;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
        e.preventDefault();
        setIsSidebarOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsSidebarOpen]);

  const closeMobileDrawer = useCallback(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  // ---- Render a single rail item (works expanded + collapsed) ----
  const renderItem = useCallback(
    (section) => {
      const Icon = section.icon;
      const hasPanel = !!(section.panel && section.panel.length);
      const isActive = activeSectionId === section.id;
      const isOpen = openPanelId === section.id;
      const showUnread = section.unread && unreadCount > 0;

      const inner = (
        <>
          <Icon className="nav-item__icon" size={collapsed ? 18 : 16} strokeWidth={1.6} aria-hidden />
          {!collapsed && <span className="nav-item__label">{section.label}</span>}
          {!collapsed && showUnread && (
            <span className="nav-item__udot" aria-label={`${unreadCount} unread`} />
          )}
          {!collapsed && hasPanel && (
            <span className="nav-item__caret" aria-hidden>
              <ChevronRight size={14} strokeWidth={1.9} />
            </span>
          )}
          {collapsed && showUnread && <span className="nav-item__udot nav-item__udot--corner" aria-hidden />}
        </>
      );

      const cls = `nav-item${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`;

      if (hasPanel) {
        // Sections with a landing page (Students/Staff/Academics) NAVIGATE on
        // click to their main page; the hover overlay still opens for quick
        // jumps, and in-page tabs handle sub-navigation. Sections without an
        // href (Operations/Insights/Admin) keep the click-to-toggle overlay.
        if (section.href) {
          return (
            <NavLink
              key={section.id}
              to={section.href}
              className={cls}
              data-haspanel="true"
              title={collapsed ? section.label : undefined}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-current={isActive ? "page" : undefined}
              onClick={closePanel}
              {...hoverProps(section)}
            >
              {inner}
            </NavLink>
          );
        }
        return (
          <button
            key={section.id}
            type="button"
            className={cls}
            data-haspanel="true"
            title={collapsed ? section.label : undefined}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => onItemClick(section, e.currentTarget)}
            {...hoverProps(section)}
          >
            {inner}
          </button>
        );
      }

      return (
        <NavLink
          key={section.id}
          to={section.href}
          end={section.end}
          title={collapsed ? section.label : undefined}
          className={({ isActive: routeActive }) =>
            `nav-item${routeActive ? " is-active" : ""}`
          }
          onClick={closePanel}
          {...hoverProps(section)}
        >
          {inner}
        </NavLink>
      );
    },
    [activeSectionId, openPanelId, collapsed, unreadCount, onItemClick, hoverProps, closePanel]
  );

  // ---- Mobile: bottom bar + sheet ----
  if (isMobile) {
    return (
      <>
        <BottomBar
          activeSectionId={activeSectionId}
          unreadCount={unreadCount}
          onMoreClick={() => setIsSidebarOpen((v) => !v)}
          isSheetOpen={isSidebarOpen}
        />
        <BottomSheet
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={closeMobileDrawer}
          activeSectionId={activeSectionId}
          pinnedWithIcons={pinnedWithIcons}
          unreadCount={unreadCount}
          schoolName={schoolName}
          currentAcademicYear={currentAcademicYear}
        />
      </>
    );
  }

  // ---- Desktop: the calm two-level rail ----
  return (
    <>
      <aside
        ref={sidebarRef}
        data-tour="sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={`sidebar ${collapsed ? "sidebar--rail" : ""} fixed left-0 top-0 h-screen z-50 ${
          isSidebarOpen ? "w-[var(--sidebar-w)]" : "w-[var(--sidebar-w-collapsed)]"
        }`}
      >
        {/* Collapse handle on the divider */}
        <button
          type="button"
          className="sidebar__handle"
          title={`${collapsed ? "Expand" : "Collapse"} sidebar (⌘\\)`}
          aria-label={`${collapsed ? "Expand" : "Collapse"} sidebar`}
          onClick={() => setIsSidebarOpen((v) => !v)}
        >
          {collapsed ? <ChevronsRight size={13} aria-hidden /> : <ChevronsLeft size={13} aria-hidden />}
        </button>

        {/* Brand */}
        <div className="sidebar__brand">
          <div className="brand-mark" aria-hidden>
            <GraduationCap size={14} strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name" title={schoolName}>{schoolName}</span>
              {currentAcademicYear && <span className="brand-sub">{currentAcademicYear}</span>}
            </div>
          )}
        </div>

        {/* Search → opens the ⌘K command palette */}
        <button
          type="button"
          className={`sidebar__search${collapsed ? " sidebar__search--rail" : ""}`}
          onClick={openCommandPalette}
          title="Search (⌘K)"
          aria-label="Search"
          data-coach="sidebar-search"
        >
          <Search size={15} aria-hidden />
          {!collapsed && (
            <>
              <span className="sidebar__search-placeholder">Search…</span>
              <span className="sidebar__search-kbd kbd">⌘K</span>
            </>
          )}
        </button>

        {/* Nav */}
        <nav className="sidebar__nav">
          {navGroups.map((group, gi) => (
            <React.Fragment key={group.cat || `g-${gi}`}>
              {gi > 0 && <div className="nav-divider" aria-hidden />}
              {group.cat && !collapsed && <div className="nav-cat">{group.cat}</div>}
              {group.items.map(renderItem)}
            </React.Fragment>
          ))}

          {/* Pinned */}
          {pinnedWithIcons.length > 0 && (
            <>
              <div className="nav-divider" aria-hidden />
              {!collapsed && <div className="nav-cat" data-coach="sidebar-pin">Pinned</div>}
              {pinnedWithIcons.map((item, i) => (
                <NavLink
                  key={`pin-${item.href}-${i}`}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={closePanel}
                  className={({ isActive }) => `nav-item${isActive ? " is-active" : ""}`}
                  {...hoverProps({ id: `pin-${i}` })}
                >
                  {item.icon ? (
                    <item.icon className="nav-item__icon" size={collapsed ? 18 : 16} strokeWidth={1.6} aria-hidden />
                  ) : (
                    <span className="nav-item__icon" style={{ display: "grid", placeItems: "center" }} aria-hidden>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--info)" }} />
                    </span>
                  )}
                  {!collapsed && <span className="nav-item__label">{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar__foot">
          <NavLink
            to={SETTINGS_ITEM.href}
            title={collapsed ? SETTINGS_ITEM.label : undefined}
            onClick={closePanel}
            className={({ isActive }) => `nav-item${isActive ? " is-active" : ""}`}
            {...hoverProps({ id: "settings" })}
          >
            <SETTINGS_ITEM.icon className="nav-item__icon" size={collapsed ? 18 : 16} strokeWidth={1.6} aria-hidden />
            {!collapsed && <span className="nav-item__label">{SETTINGS_ITEM.label}</span>}
          </NavLink>
          <div className={`sidebar__utils${collapsed ? " sidebar__utils--rail" : ""}`}>
            <NotificationBell />
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
              className="iconbtn"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              aria-label="Open setup wizard"
              title="Setup wizard (onboarding)"
              className="iconbtn"
            >
              <Rocket size={15} />
            </button>
          </div>
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>

      {/* Overlay panel */}
      {openSection && anchorRect && (
        <NavPanel
          section={openSection}
          anchorRect={anchorRect}
          onNavigate={closePanel}
          {...panelProps}
        />
      )}
    </>
  );
}

export default React.memo(Sidebar);

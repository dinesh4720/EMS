import React, { useEffect, useCallback, useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  MessageSquare, IndianRupee, Settings, Award, ClipboardList,
  Wand2, Package, Library, Building2, Bus, FileBarChart, Database,
  DoorOpen, BarChart3, Sparkles, ChevronDown, Palette, Wallet,
  CalendarCheck, FileText,
} from "lucide-react";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { useApp } from "../../context/AppContext";
import { useSchool } from "../../context/SchoolContext";
import UserMenu from "./UserMenu";
import { getPinnedPages, subscribePinnedPages } from "../../utils/pinnedPages";

const WORKSPACE_NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/staffs", icon: Users, label: "Staff" },
  { href: "/students", icon: GraduationCap, label: "Students" },
  { href: "/classes", icon: BookOpen, label: "Classes" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/messaging", icon: MessageSquare, label: "Messaging", chatBadge: true },
  { href: "/fees", icon: IndianRupee, label: "Fees" },
];

// Pinned items are stored in localStorage (utils/pinnedPages); the topbar
// star button is the input. When the backend ships a workspace-pins
// endpoint, swap the store implementation — the shape ({ href, label })
// stays the same.

// Alphabetised. First MORE_VISIBLE_LIMIT entries render by default; the
// rest collapse under a "Show all" disclosure to keep the sidebar calm.
const MORE_NAV = [
  { href: "/students/attendance", icon: CalendarCheck, label: "Attendance" },
  { href: "/students/submissions", icon: FileText, label: "Form Submissions" },
  { href: "/ai-assistant", icon: Sparkles, label: "AI Assistant" },
  { href: "/academics", icon: Award, label: "Academics" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/data-tools", icon: Database, label: "Data Tools" },
  { href: "/front-desk", icon: DoorOpen, label: "Front Desk" },
  { href: "/homework", icon: ClipboardList, label: "Homework" },
  { href: "/hostel", icon: Building2, label: "Hostel" },
  { href: "/intake-forms/assignments", icon: ClipboardList, label: "Intake Forms" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/ptm", icon: Users, label: "PTM" },
  { href: "/reports", icon: FileBarChart, label: "Reports" },
  { href: "/staffs/payroll", icon: Wallet, label: "Staff Payroll" },
  { href: "/staffs/bulk-subjects", icon: BookOpen, label: "Subjects" },
  { href: "/style-guide", icon: Palette, label: "Style Guide" },
  { href: "/ia", icon: BarChart3, label: "IA & Checklist" }
  { href: "/timetable-wizard", icon: Wand2, label: "Timetable Wizard" },
  { href: "/transport", icon: Bus, label: "Transport" },
];

const MORE_VISIBLE_LIMIT = 8;

const TONE_VAR = { info: "var(--info)", warn: "var(--warn)", ok: "var(--ok)" };

function NavRow({ to, icon: Icon, label, badge, dotTone, collapsed, end, onNav }) {
  const dotColor = dotTone ? TONE_VAR[dotTone] : null;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNav}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `sidebar__item${dotTone ? " sidebar__item--pin" : ""}${
          isActive ? " is-active" : ""
        }`
      }
    >
      {dotColor != null ? (
        <span className="dot" style={{ color: dotColor }} aria-hidden />
      ) : Icon ? (
        <Icon size={15} strokeWidth={1.6} aria-hidden />
      ) : null}
      {!collapsed && <span className="sidebar__label">{label}</span>}
      {!collapsed && badge != null && (
        <span className="sidebar__badge">{badge}</span>
      )}
    </NavLink>
  );
}

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

  // "More" disclosure — auto-expanded when the current route lives in
  // the hidden tail, so users never have to hunt for the active page.
  const [moreExpanded, setMoreExpanded] = useState(false);
  const moreVisible = useMemo(
    () => MORE_NAV.slice(0, MORE_VISIBLE_LIMIT),
    []
  );
  const moreHidden = useMemo(
    () => MORE_NAV.slice(MORE_VISIBLE_LIMIT),
    []
  );
  const hiddenContainsActive = useMemo(
    () =>
      moreHidden.some(
        (item) =>
          location.pathname === item.href ||
          (item.href !== "/" && location.pathname.startsWith(item.href + "/"))
      ),
    [moreHidden, location.pathname]
  );
  useEffect(() => {
    if (hiddenContainsActive) setMoreExpanded(true);
  }, [hiddenContainsActive]);

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

  return (
    <>
      {/* Mobile backdrop overlay — only visible below md (768px) via .sidebar__backdrop */}
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
        data-tour="sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={`sidebar ${collapsed ? "sidebar--rail" : ""} fixed left-0 top-0 h-screen z-50 transition-transform duration-200 ${
          isSidebarOpen
            ? "w-[var(--sidebar-w)]"
            : "w-[var(--sidebar-w-collapsed)] max-md:-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="brand-mark" aria-hidden>
            <GraduationCap size={14} color="white" strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="col" style={{ lineHeight: 1.2, gap: 1, minWidth: 0 }}>
              <span className="brand-name" title={schoolName}>{schoolName}</span>
              {currentAcademicYear && (
                <span className="brand-sub">
                  {currentAcademicYear}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {!collapsed && <div className="sidebar__heading">Workspace</div>}
          {WORKSPACE_NAV.map((item) => (
            <NavRow
              key={item.href}
              to={item.href}
              icon={item.icon}
              label={item.label}
              badge={
                item.chatBadge && unreadCount > 0
                  ? unreadCount > 99 ? "99+" : unreadCount
                  : undefined
              }
              collapsed={collapsed}
              end={item.href === "/"}
              onNav={closeOnMobileNav}
            />
          ))}

          {!collapsed && pinned.length > 0 && (
            <>
              <div
                data-coach="sidebar-pin"
                className="sidebar__heading"
                style={{ marginTop: 16 }}
              >
                Pinned
              </div>
              {pinned.map((item, i) => (
                <NavRow
                  key={`pin-${item.href}-${i}`}
                  to={item.href}
                  dotTone="info"
                  label={item.label}
                  collapsed={collapsed}
                  onNav={closeOnMobileNav}
                />
              ))}
            </>
          )}

          {!collapsed && (
            <div className="sidebar__heading" style={{ marginTop: 16 }}>
              More
            </div>
          )}
          {(collapsed ? MORE_NAV : moreVisible).map((item) => (
            <NavRow
              key={item.href}
              to={item.href}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              onNav={closeOnMobileNav}
            />
          ))}
          {!collapsed && moreExpanded &&
            moreHidden.map((item) => (
              <NavRow
                key={item.href}
                to={item.href}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                onNav={closeOnMobileNav}
              />
            ))}
          {!collapsed && moreHidden.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreExpanded((v) => !v)}
              aria-expanded={moreExpanded}
              className="sidebar__item"
              style={{ color: "var(--fg-subtle)", width: "100%" }}
            >
              <ChevronDown
                size={15}
                strokeWidth={1.6}
                style={{
                  transform: moreExpanded ? "rotate(180deg)" : "none",
                  transition: "transform 120ms",
                }}
                aria-hidden
              />
              <span className="sidebar__label">
                {moreExpanded ? "Show less" : `Show all (${moreHidden.length} more)`}
              </span>
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar__foot">
          <NavRow
            to="/settings"
            icon={Settings}
            label="Settings"
            collapsed={collapsed}
            onNav={closeOnMobileNav}
          />
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}

export default React.memo(Sidebar);

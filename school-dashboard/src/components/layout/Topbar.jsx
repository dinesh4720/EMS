import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, ChevronRight, Sun, Moon, Menu, Home, Star, Share2 } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import CommandPalette from "./CommandPalette";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { isSuperAdminRole } from "../../utils/roleUtils";
import { isObjectId } from "../../utils/objectIdHelper";
import { studentsApi } from "../../services/api";
import { isPagePinned, togglePinnedPage, subscribePinnedPages } from "../../utils/pinnedPages";

const PATH_LABELS = {
  staffs: "Staff",
  students: "Students",
  classes: "Classes",
  calendar: "Schedule",
  messaging: "Messages",
  fees: "Fees",
  settings: "Settings",
  "front-desk": "Front Desk",
  analytics: "Analytics",
  accounts: "Accounts",
  hostel: "Hostel",
  transport: "Transport",
  library: "Library",
  academics: "Academics",
  reports: "Reports",
  "data-tools": "Data Tools",
  inventory: "Inventory",
  ptm: "PTM",
  "intake-forms": "Intake Forms",
  "ai-assistant": "AI Assistant",
  "timetable-wizard": "Timetable Wizard",
  "super-admin": "Super Admin",
  homework: "Homework",
};

function Topbar({ isSidebarOpen, onOpenMobileNav }) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { staff } = useApp();
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminRole(user?.role);
  const [resolvedStudentLabel, setResolvedStudentLabel] = useState(null);
  const searchBtnRef = useRef(null);

  // Keyboard shortcuts:
  //   ⌘K / Ctrl+K → open command palette
  //   /          → focus the search trigger (mirrors Linear/GitHub)
  //   Esc        → blur the search trigger when it is focused
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        const tag = t?.tagName;
        const isEditable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          t?.isContentEditable;
        if (isEditable) return;
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "Escape" && document.activeElement === searchBtnRef.current) {
        searchBtnRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // External openers (e.g. Dashboard hero cmd-bar) dispatch this event
  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener("ems:open-command-palette", open);
    return () => window.removeEventListener("ems:open-command-palette", open);
  }, []);

  const studentIdFromPath = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const studentIndex = parts.indexOf("students");
    const id = studentIndex >= 0 ? parts[studentIndex + 1] : null;
    if (
      !id ||
      id === "attendance" ||
      id === "submissions" ||
      (!isObjectId(id) && !/^[a-f\d]{20,}$/i.test(id))
    ) {
      return null;
    }
    return id;
  }, [location.pathname]);

  useEffect(() => {
    if (!studentIdFromPath) {
      setResolvedStudentLabel(null);
      return;
    }
    let isActive = true;
    studentsApi
      .getById(studentIdFromPath)
      .then((student) => {
        if (!isActive) return;
        const label =
          student?.name && !isObjectId(student.name)
            ? student.name
            : student?.admissionId
            ? `Student ${student.admissionId}`
            : `...${studentIdFromPath.slice(-8)}`;
        setResolvedStudentLabel({ id: studentIdFromPath, label });
      })
      .catch(() => {
        if (isActive) {
          setResolvedStudentLabel({
            id: studentIdFromPath,
            label: `...${studentIdFromPath.slice(-8)}`,
          });
        }
      });
    return () => {
      isActive = false;
    };
  }, [studentIdFromPath]);

  const currentLabel = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    const first = parts[0];
    return PATH_LABELS[first] || first.charAt(0).toUpperCase() + first.slice(1);
  }, [location.pathname]);

  const [pinned, setPinned] = useState(() => isPagePinned(location.pathname));
  useEffect(() => {
    setPinned(isPagePinned(location.pathname));
    return subscribePinnedPages(() => setPinned(isPagePinned(location.pathname)));
  }, [location.pathname]);

  const handlePin = useCallback(() => {
    const nowPinned = togglePinnedPage({ href: location.pathname, label: currentLabel });
    setPinned(nowPinned);
    toast.success(nowPinned ? `Pinned "${currentLabel}"` : `Unpinned "${currentLabel}"`);
  }, [location.pathname, currentLabel]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: currentLabel, url });
        return;
      } catch {
        // user cancelled or share unavailable — fall through to clipboard
      }
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else {
        toast.error("Sharing is not supported in this browser");
      }
    } catch {
      toast.error("Could not copy link");
    }
  }, [currentLabel]);

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return [{ label: "Dashboard", path: "/" }];

    return parts.map((part, index) => {
      const currentPath = `/${parts.slice(0, index + 1).join("/")}`;
      let label =
        PATH_LABELS[part] || part.charAt(0).toUpperCase() + part.slice(1);

      if (isObjectId(part) || /^[a-f\d]{20,}$/i.test(part)) {
        const prevPart = parts[index - 1];
        if (prevPart === "staffs" && staff) {
          const member = staff.find(
            (m) => m.id === part || m._id === part
          );
          if (member?.name && !isObjectId(member.name)) label = member.name;
          else if (member?.code) label = `Staff ${member.code}`;
          else label = `...${part.slice(-8)}`;
        } else if (prevPart === "students" && resolvedStudentLabel?.id === part) {
          label = resolvedStudentLabel.label;
        } else {
          label = `...${part.slice(-8)}`;
        }
      }
      return { label, path: currentPath };
    });
  }, [location.pathname, staff, resolvedStudentLabel]);

  const stackClass = `topbar-stack fixed top-0 right-0 z-40 left-0 ${
    isSidebarOpen
      ? "lg:!left-[var(--sidebar-width)]"
      : "lg:!left-[var(--sidebar-width-collapsed)]"
  }`;

  return (
    <div className={stackClass} style={{ position: "fixed" }}>
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Single primary bar — breadcrumbs live inline now (no secondary bar). */}
      <header aria-label="Application header" className="topbar">
        {/* Left: mobile menu + breadcrumbs */}
        <div className="row gap-3" style={{ minWidth: 0 }}>
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              aria-label="Open navigation menu"
              className="iconbtn md:hidden"
            >
              <Menu size={15} />
            </button>
          )}
          <nav
            aria-label="Breadcrumb"
            className="topbar__crumbs"
            style={{ minWidth: 0 }}
          >
            <Link to="/" className="topbar__crumbs-home" aria-label="Home">
              <Home size={12} aria-hidden />
            </Link>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.path}>
                  <ChevronRight
                    size={12}
                    className="topbar__crumbs-sep"
                    aria-hidden
                  />
                  {isLast ? (
                    <span className="topbar__crumbs-cur" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link to={crumb.path}>{crumb.label}</Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Center: ⌘K search button (NOT an input — opens command palette).
            On desktop renders the full pill; on mobile collapses to an icon. */}
        <button
          ref={searchBtnRef}
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open global search"
          aria-keyshortcuts="/ Control+K"
          className="topbar__search"
          data-coach="topbar-search"
        >
          <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
          <span
            className="subtle"
            style={{ flex: 1, textAlign: "left", fontSize: 13 }}
          >
            Search students, staff, fees…
          </span>
          <span className="row gap-1" aria-hidden>
            <span className="kbd">/</span>
            <span className="kbd">{isMac ? "⌘" : "Ctrl"}</span>
            <span className="kbd">K</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open global search"
          className="topbar__search topbar__search-icon-only"
        >
          <Search size={14} aria-hidden />
        </button>

        {/* Right: page actions + theme + notifications + user menu */}
        <div className="row gap-1">
          <button
            type="button"
            onClick={handlePin}
            aria-pressed={pinned}
            className="btn btn--sm btn--ghost hidden md:inline-flex"
            aria-label={pinned ? "Unpin this page" : "Pin this page"}
            data-coach="topbar-pin"
          >
            <Star
              size={12}
              aria-hidden
              fill={pinned ? "currentColor" : "none"}
            />
            <span className="hidden xl:inline">{pinned ? "Pinned" : "Pin"}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn btn--sm btn--ghost hidden md:inline-flex"
            aria-label="Share this page"
          >
            <Share2 size={12} aria-hidden />
            <span className="hidden xl:inline">Share</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="iconbtn"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <NotificationBell />
          <UserMenu
            placement="bottom-end"
            showSchoolSwitcher={isSuperAdmin}
          />
        </div>
      </header>
    </div>
  );
}

export default React.memo(Topbar);

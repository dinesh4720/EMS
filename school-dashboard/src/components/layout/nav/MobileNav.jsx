import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, GraduationCap, MoreHorizontal, Search, X } from "lucide-react";
import { NAV_GROUPS, SETTINGS_ITEM, MOBILE_TABS } from "./navConfig";

/* ============================================================
   Mobile Bottom Bar — primary tabs + "More".
   ============================================================ */
export function BottomBar({ activeSectionId, unreadCount, onMoreClick, isSheetOpen }) {
  return (
    <nav className="bottom-bar" role="navigation" aria-label="Primary navigation">
      {MOBILE_TABS.map((tab) => {
        const isActive = tab.id === activeSectionId;
        const badge = tab.id === "messaging" && unreadCount > 0;
        return (
          <NavLink
            key={tab.id}
            to={tab.href}
            end={tab.end}
            className={`bottom-bar__item${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
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
        aria-expanded={isSheetOpen}
        aria-controls="bottom-sheet"
      >
        <MoreHorizontal size={20} strokeWidth={1.8} aria-hidden />
        <span className="bottom-bar__label">More</span>
      </button>
    </nav>
  );
}

/* ============================================================
   Mobile Bottom Sheet — the full grouped nav as accordions.
   Each section with sub-pages expands inline; the two-level
   overlay (desktop) collapses to an accordion here.
   ============================================================ */
export function BottomSheet({
  isOpen,
  onClose,
  onNavigate,
  activeSectionId,
  pinnedWithIcons,
  unreadCount,
  schoolName,
  currentAcademicYear,
}) {
  const sheetRef = useRef(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  const isSearching = search.trim().length > 0;
  const q = search.trim().toLowerCase();

  // Auto-expand the active section so the current page is visible.
  useEffect(() => {
    if (isOpen && activeSectionId) {
      setExpanded((p) => ({ ...p, [activeSectionId]: true }));
    }
  }, [isOpen, activeSectionId]);

  // Esc closes; focus first control; trap Tab within the sheet.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;
    sheetRef.current.querySelector("input, a, button")?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !sheetRef.current) return undefined;
    const sheet = sheetRef.current;
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        sheet.querySelectorAll('input, a[href], button, textarea, select, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && !el.hasAttribute("aria-hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    sheet.addEventListener("keydown", onKey);
    return () => sheet.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter a section + its panel against the search query.
  const matchText = (s) => s.toLowerCase().includes(q);
  const visibleGroups = NAV_GROUPS.map((group) => {
    const items = group.items
      .map((section) => {
        if (!isSearching) return section;
        const selfMatch = matchText(section.label) || (section.href && matchText(section.href));
        const childMatch = (section.panel || []).filter(
          (c) => matchText(c.label) || matchText(c.href)
        );
        if (selfMatch) return section;
        if (childMatch.length) return { ...section, panel: childMatch };
        return null;
      })
      .filter(Boolean);
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  const close = () => {
    setSearch("");
    onNavigate();
  };

  return (
    <>
      <div className="bottom-sheet__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        id="bottom-sheet"
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="bottom-sheet__handle" aria-hidden="true" />

        <div className="bottom-sheet__brand">
          <div className="brand-mark" aria-hidden>
            <GraduationCap size={14} strokeWidth={2} />
          </div>
          <div className="brand-text">
            <span className="brand-name">{schoolName}</span>
            {currentAcademicYear && <span className="brand-sub">{currentAcademicYear}</span>}
          </div>
        </div>

        <div className="bottom-sheet__search">
          <Search size={14} className="text-fg-faint flex-shrink-0" aria-hidden />
          <input
            type="text"
            placeholder="Search pages…"
            className="sidebar__search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search navigation"
          />
          {search && (
            <button
              type="button"
              className="sidebar__search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>

        <div className="bottom-sheet__body">
          {visibleGroups.map((group, gi) => (
            <React.Fragment key={group.cat || `g-${gi}`}>
              {group.cat && <div className="sidebar__heading">{group.cat}</div>}
              {group.items.map((section) => {
                const Icon = section.icon;
                const hasPanel = !!(section.panel && section.panel.length);
                const sectionOpen = isSearching || expanded[section.id] || activeSectionId === section.id;
                const badge = section.unread && unreadCount > 0;

                if (!hasPanel) {
                  return (
                    <NavLink
                      key={section.id}
                      to={section.href}
                      end={section.end}
                      onClick={close}
                      className={({ isActive }) => `sidebar__item${isActive ? " is-active" : ""}`}
                    >
                      <Icon size={15} strokeWidth={1.6} aria-hidden />
                      <span className="sidebar__label">{section.label}</span>
                      {badge && <span className="sidebar__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                    </NavLink>
                  );
                }

                return (
                  <React.Fragment key={section.id}>
                    <button
                      type="button"
                      className="sidebar__item sidebar__item--sheet-parent"
                      aria-expanded={sectionOpen}
                      onClick={() => setExpanded((p) => ({ ...p, [section.id]: !p[section.id] }))}
                    >
                      <Icon size={15} strokeWidth={1.6} aria-hidden />
                      <span className="sidebar__label">{section.label}</span>
                      <ChevronRight
                        size={14}
                        strokeWidth={1.8}
                        className={`sidebar__group-chevron${sectionOpen ? " is-expanded" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {sectionOpen && (
                      <div className="sidebar__group-body">
                        {section.panel.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <NavLink
                              key={item.id}
                              to={item.href}
                              end={item.end}
                              onClick={close}
                              className={({ isActive }) =>
                                `sidebar__item sidebar__item--child${isActive ? " is-active" : ""}`
                              }
                            >
                              {ItemIcon && <ItemIcon size={14} strokeWidth={1.6} aria-hidden />}
                              <span className="sidebar__label">{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}

          {!isSearching && pinnedWithIcons.length > 0 && (
            <>
              <div className="sidebar__heading sidebar__heading--spaced">Pinned</div>
              {pinnedWithIcons.map((item, i) => (
                <NavLink
                  key={`pin-${item.href}-${i}`}
                  to={item.href}
                  onClick={close}
                  className={({ isActive }) => `sidebar__item${isActive ? " is-active" : ""}`}
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

          <div className="sidebar__heading sidebar__heading--spaced">{SETTINGS_ITEM.label}</div>
          <NavLink
            to={SETTINGS_ITEM.href}
            onClick={close}
            className={({ isActive }) => `sidebar__item${isActive ? " is-active" : ""}`}
          >
            <SETTINGS_ITEM.icon size={15} strokeWidth={1.6} aria-hidden />
            <span className="sidebar__label">{SETTINGS_ITEM.label}</span>
          </NavLink>

          {isSearching && visibleGroups.length === 0 && (
            <div className="sidebar__empty">No pages match &ldquo;{search}&rdquo;</div>
          )}
        </div>
      </div>
    </>
  );
}

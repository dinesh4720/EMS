import React, { useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getActivePanelItemId } from "./navConfig";

/* ============================================================
   NavPanel — the "depth on demand" overlay.
   Fixed-positioned beside the clicked rail item; lists every
   sub-page of a section. Closes via outside-click / Esc / nav
   (handled by the parent Sidebar).
   ============================================================ */

const PANEL_WIDTH = 234;
const GAP = 10; // gap between rail and panel
const EDGE = 8; // viewport edge padding

function NavPanel({ section, anchorRect, onNavigate, onMouseEnter, onMouseLeave }) {
  const location = useLocation();
  const ref = useRef(null);
  const [pos, setPos] = useState(() => ({
    left: anchorRect ? anchorRect.right + GAP : 0,
    top: anchorRect ? Math.max(EDGE, anchorRect.top - 6) : EDGE,
    nub: 18,
  }));

  // Position beside the anchor once we can measure the panel height,
  // clamping to the viewport and aiming the nub at the item centre.
  useLayoutEffect(() => {
    if (!anchorRect || !ref.current) return;
    const h = ref.current.offsetHeight;
    const vh = window.innerHeight;
    let top = anchorRect.top - 6;
    top = Math.min(top, vh - h - 14);
    top = Math.max(EDGE, top);
    const nub = Math.max(12, Math.min(h - 22, anchorRect.top + anchorRect.height / 2 - top - 5));
    setPos({ left: anchorRect.right + GAP, top, nub });
  }, [anchorRect, section?.id]);

  if (!section?.panel) return null;
  const activeId = getActivePanelItemId(location, section.panel);
  const Icon = section.icon;

  return (
    <div
      ref={ref}
      id="nav-panel"
      className="nav-panel"
      role="menu"
      aria-label={section.label}
      style={{ left: pos.left, top: pos.top, width: PANEL_WIDTH }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="nav-panel__nub" style={{ top: pos.nub }} aria-hidden />
      <div className="nav-panel__head">
        <div className="nav-panel__pic" aria-hidden>
          {Icon && <Icon size={16} strokeWidth={1.8} />}
        </div>
        <div className="nav-panel__title">
          <span className="nav-panel__name">{section.label}</span>
          <span className="nav-panel__sub">{section.panel.length} pages</span>
        </div>
      </div>
      <div className="nav-panel__sep" aria-hidden />
      {section.panel.map((item) => {
        const ItemIcon = item.icon;
        const isActive = item.id === activeId;
        return (
          <NavLink
            key={item.id}
            to={item.href}
            role="menuitem"
            onClick={onNavigate}
            className={`nav-panel__item${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {ItemIcon && <ItemIcon size={16} strokeWidth={1.7} aria-hidden />}
            <span className="nav-panel__label">{item.label}</span>
            {item.badge != null && (
              <span className={`nav-panel__badge${item.badgeKind ? ` nav-panel__badge--${item.badgeKind}` : ""}`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

export default React.memo(NavPanel);

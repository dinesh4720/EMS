import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { NAV_GROUPS, getActivePanelItemId } from "./navConfig";
import { usePermissions } from "../../../context/PermissionContext";

/**
 * Horizontal tab strip for a section (Students, Staff, Academics…). Renders the
 * section's sub-pages from navConfig as tabs, hides any whose module a school has
 * switched off, highlights the active tab from the current route, and navigates
 * on click. Rendered by SectionShell above the section's routed content.
 */
export default function SectionTabs({ sectionId }) {
  const location = useLocation();
  const { isModuleEnabled } = usePermissions();

  const section = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((s) => s.id === sectionId),
    [sectionId]
  );

  const tabs = useMemo(() => {
    const panel = section?.panel || [];
    return panel.filter((item) => isModuleEnabled(item.moduleKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const activeId = useMemo(() => getActivePanelItemId(location, tabs), [location, tabs]);

  if (tabs.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-divider bg-surface">
      <nav
        className="flex items-center gap-1 px-3 md:px-4 overflow-x-auto no-scrollbar"
        aria-label={`${section?.label || ""} sections`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeId;
          return (
            <Link
              key={tab.id}
              to={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))] focus-visible:ring-inset rounded-t
                ${active
                  ? "border-fg text-fg font-medium"
                  : "border-transparent text-fg-muted hover:text-fg"}`}
            >
              {Icon && <Icon size={15} strokeWidth={1.8} aria-hidden />}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

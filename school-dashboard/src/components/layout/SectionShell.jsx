import { Outlet } from "react-router-dom";
import SectionTabs from "./nav/SectionTabs";

/**
 * Pathless layout route wrapper for a section. Renders the section's tab strip
 * above its routed content via <Outlet/>, so the tabs persist across every
 * sub-page (list, attendance, dashboard, promotion, …) without changing how any
 * child route matches. The flex column preserves the full-height layout the
 * list/two-pane pages rely on.
 */
export default function SectionShell({ sectionId }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <SectionTabs sectionId={sectionId} />
      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

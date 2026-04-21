import { memo } from "react";
import PropTypes from "prop-types";
import { ChevronsLeft } from "lucide-react";
import { useSchool } from "../../context/SchoolContext";
import { cn } from "../../utils/cn";

/**
 * SchoolSwitcher — sidebar brand block showing the current school identity.
 *
 * Today users belong to a single school, so this renders a read-only
 * identity (logo or initial + name). It's positioned as the extension point
 * for future multi-school switching (super-admin) — the wrapper is a button
 * when an `onSwitch` handler is passed.
 */
const SchoolSwitcher = memo(function SchoolSwitcher({
  collapsed = false,
  onToggleCollapsed,
  onSwitch,
}) {
  const { schoolSettings } = useSchool();
  const name = schoolSettings?.name?.trim() || "SchoolSync";
  const logo = schoolSettings?.logo || null;
  const initial = name.charAt(0).toUpperCase();

  const Brand = onSwitch ? "button" : "div";
  const brandProps = onSwitch
    ? {
        type: "button",
        onClick: onSwitch,
        "aria-label": `Switch school. Current: ${name}`,
        className:
          "flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 px-1 -mx-1",
      }
    : { className: "flex items-center gap-2" };

  return (
    <div
      className={cn(
        "flex items-center h-14 border-b border-gray-100 dark:border-zinc-800",
        collapsed ? "justify-center" : "px-4 justify-between"
      )}
    >
      <Brand {...brandProps}>
        <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white dark:text-zinc-900 font-bold text-sm">
              {initial}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate max-w-[140px]">
            {name}
          </span>
        )}
      </Brand>

      {!collapsed && onToggleCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
        >
          <ChevronsLeft size={16} />
        </button>
      )}
    </div>
  );
});

SchoolSwitcher.displayName = "SchoolSwitcher";

SchoolSwitcher.propTypes = {
  collapsed: PropTypes.bool,
  onToggleCollapsed: PropTypes.func,
  onSwitch: PropTypes.func,
};

export default SchoolSwitcher;

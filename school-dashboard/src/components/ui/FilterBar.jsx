import { forwardRef } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * FilterBar — layout primitive that composes a search input, filter controls,
 * and action buttons above a data view.
 *
 * Three slots:
 *   - `search`   — a SearchBar / SearchInput
 *   - `filters`  — one or more FacetedFilter / Combobox / MultiSelect / DateRangePicker
 *   - `actions`  — right-aligned buttons (export, create, etc.)
 *
 * When `activeFilterCount > 0` a "Reset" button appears next to the filters,
 * calling `onReset`.
 */
const FilterBar = forwardRef(function FilterBar(
  {
    search,
    filters,
    actions,
    activeFilterCount = 0,
    onReset,
    resetLabel = "Reset",
    className,
    children,
  },
  ref
) {
  const hasFilters = filters || (activeFilterCount > 0 && onReset);
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Filters"
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
        "py-3 border-b border-[var(--color-border-strong)]",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap flex-1 min-w-0">
        {search ? (
          <div className="w-full sm:w-auto sm:max-w-xs lg:min-w-[240px]">{search}</div>
        ) : null}
        {hasFilters ? (
          <div className="flex items-center gap-2 flex-wrap">
            {filters}
            {activeFilterCount > 0 && onReset ? (
              <button
                type="button"
                onClick={onReset}
                className={cn(
                  "inline-flex items-center gap-1 h-8 px-2 text-xs rounded",
                  "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                  "hover:bg-[var(--color-bg-secondary)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                )}
              >
                {resetLabel}
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">{actions}</div>
      ) : null}
    </div>
  );
});

FilterBar.propTypes = {
  search: PropTypes.node,
  filters: PropTypes.node,
  actions: PropTypes.node,
  activeFilterCount: PropTypes.number,
  onReset: PropTypes.func,
  resetLabel: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default FilterBar;

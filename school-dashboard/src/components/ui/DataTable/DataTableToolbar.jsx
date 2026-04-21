import PropTypes from "prop-types";
import { Columns3, Filter, X } from "lucide-react";
import { cn } from "../../../utils/cn";
import SearchInput from "../SearchInput";
import Button from "../Button";
import IconButton from "../IconButton";
import Checkbox from "../Checkbox";
import Popover from "../Popover";

export function DataTableToolbar({
  searchable,
  search,
  onSearchChange,
  searchPlaceholder,
  columns,
  hiddenColumns,
  onToggleColumn,
  onResetColumns,
  showColumnConfig,
  columnFilters,
  onSetFilter,
  onClearFilters,
  showFilters,
  toolbarActions,
}) {
  const filterableColumns = columns.filter((col) => col.filterable);
  const hasActiveFilters =
    Object.keys(columnFilters).length > 0 || (search && search.length > 0);
  const activeFilterCount = Object.keys(columnFilters).length;

  if (!searchable && !showColumnConfig && !showFilters && !toolbarActions) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-[var(--color-border)]">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        {searchable ? (
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder || "Search..."}
            className="w-full sm:max-w-[280px] px-3 py-2 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus-within:border-[var(--color-primary)] transition-all"
          />
        ) : null}

        {showFilters && filterableColumns.length > 0 ? (
          <Popover
            placement="bottom-start"
            trigger={
              <Button variant="outline" size="sm" icon={<Filter size={14} />}>
                Filters
                {activeFilterCount > 0 ? (
                  <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            }
          >
            <div className="w-64 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Filter columns
                </span>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {filterableColumns.map((col) => (
                <ColumnFilterControl
                  key={col.key}
                  column={col}
                  value={columnFilters[col.key]}
                  onChange={(next) => onSetFilter(col.key, next)}
                />
              ))}
            </div>
          </Popover>
        ) : null}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X size={12} /> Clear all
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {toolbarActions}
        {showColumnConfig ? (
          <Popover
            placement="bottom-end"
            trigger={
              <IconButton
                aria-label="Configure columns"
                variant="outline"
                size="md"
                icon={<Columns3 size={16} />}
              />
            }
          >
            <div className="w-56 p-2 space-y-1">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Columns
                </span>
                {onResetColumns ? (
                  <button
                    type="button"
                    onClick={onResetColumns}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              {columns
                .filter((col) => !col.alwaysVisible)
                .map((col) => (
                  <Checkbox
                    key={col.key}
                    label={col.label || col.key}
                    checked={!hiddenColumns.has(col.key)}
                    onChange={() => onToggleColumn(col.key)}
                    size="sm"
                    wrapperClassName="w-full px-1 py-1 rounded hover:bg-[var(--color-bg-tertiary)]"
                  />
                ))}
            </div>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}

function ColumnFilterControl({ column, value, onChange }) {
  const label = column.label || column.key;
  if (column.filterType === "select") {
    const options = column.filterOptions || [];
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 px-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        >
          <option value="">All</option>
          {options.map((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Filter ${label.toLowerCase()}`}
        className="h-8 px-2 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
      />
    </label>
  );
}

ColumnFilterControl.propTypes = {
  column: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};

export function BulkActionBar({ selectedCount, totalCount, bulkActions, onClear }) {
  if (!selectedCount) return null;
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-2",
        "bg-[var(--color-primary)]/5 border-b border-[var(--color-primary)]/20"
      )}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-[var(--color-text-primary)]">
          {selectedCount} selected
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          of {totalCount.toLocaleString()}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-[var(--color-primary)] hover:underline"
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {bulkActions.map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant={action.isDestructive ? "danger" : action.variant || "outline"}
            icon={action.icon}
            disabled={action.isDisabled}
            onClick={() => action.onClick?.()}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

BulkActionBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  bulkActions: PropTypes.array.isRequired,
  onClear: PropTypes.func.isRequired,
};

DataTableToolbar.propTypes = {
  searchable: PropTypes.bool,
  search: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  columns: PropTypes.array.isRequired,
  hiddenColumns: PropTypes.instanceOf(Set).isRequired,
  onToggleColumn: PropTypes.func.isRequired,
  onResetColumns: PropTypes.func,
  showColumnConfig: PropTypes.bool,
  columnFilters: PropTypes.object.isRequired,
  onSetFilter: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  showFilters: PropTypes.bool,
  toolbarActions: PropTypes.node,
};

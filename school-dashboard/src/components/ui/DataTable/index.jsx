import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Inbox, RefreshCw } from "lucide-react";
import { cn } from "../../../utils/cn";
import Checkbox from "../Checkbox";
import Button from "../Button";
import SkeletonTable from "../../skeletons/SkeletonTable";
import Pagination from "../../common/Pagination";
import useDataTable from "./useDataTable";
import { BulkActionBar, DataTableToolbar } from "./DataTableToolbar";

const ALIGN_STYLES = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const DENSITY_STYLES = {
  compact: { row: "py-2", cell: "px-3 text-xs", header: "px-3 py-2 text-[11px]" },
  normal: { row: "py-3", cell: "px-4 text-sm", header: "px-4 py-3 text-xs" },
};

export default function DataTable({
  columns,
  data,
  keyField = "id",
  loading = false,
  error = null,
  onRetry,
  emptyState,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  bulkActions,
  defaultSort,
  sortState,
  onSortChange,
  searchable = false,
  searchKeys,
  searchPlaceholder,
  columnConfig = false,
  filterable = false,
  pagination = false,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  page,
  pageSize,
  totalItems: serverTotalItems,
  onPageChange,
  onPageSizeChange,
  serverMode = false,
  toolbarActions,
  rowActions,
  onRowClick,
  ariaLabel = "Data table",
  density = "normal",
  stickyHeader = false,
  className,
}) {
  const table = useDataTable({
    data: data || [],
    columns,
    keyField,
    searchKeys:
      searchKeys ||
      columns.filter((col) => col.searchable !== false && !col.render).map((col) => col.key),
    defaultSort,
    sortState,
    onSortChange,
    defaultPageSize,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    serverMode,
    totalItems: serverTotalItems,
  });

  const selection = useSelectionModel({ selectedKeys, onSelectionChange });

  const densityStyles = DENSITY_STYLES[density];
  const visibleRowKeys = useMemo(
    () => table.rows.map((row, i) => table.getRowKey(row, i)),
    [table]
  );
  const allSelected =
    visibleRowKeys.length > 0 && visibleRowKeys.every((k) => selection.has(k));
  const someSelected =
    !allSelected && visibleRowKeys.some((k) => selection.has(k));

  const toggleAllVisible = () => {
    if (allSelected) selection.removeMany(visibleRowKeys);
    else selection.addMany(visibleRowKeys);
  };

  const renderCell = (row, col) => {
    if (typeof col.render === "function") return col.render(row);
    const value = table.getCellValue(row, col);
    if (value == null || value === "") return <span className="text-[var(--color-text-muted)]">—</span>;
    return value;
  };

  return (
    <div
      className={cn(
        "bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] overflow-hidden",
        className
      )}
    >
      <DataTableToolbar
        searchable={searchable}
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder={searchPlaceholder}
        columns={columns}
        hiddenColumns={table.hiddenColumns}
        onToggleColumn={table.toggleColumn}
        onResetColumns={table.resetColumns}
        showColumnConfig={columnConfig}
        columnFilters={table.columnFilters}
        onSetFilter={table.setFilter}
        onClearFilters={table.clearFilters}
        showFilters={filterable}
        toolbarActions={toolbarActions}
      />

      {bulkActions?.length && selection.size > 0 ? (
        <BulkActionBar
          selectedCount={selection.size}
          totalCount={table.totalItems}
          bulkActions={bulkActions.map((action) => ({
            ...action,
            onClick: () => action.onClick?.(Array.from(selection.values)),
          }))}
          onClear={() => selection.clear()}
        />
      ) : null}

      <TableBody
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyState={emptyState}
        hasActiveFilters={table.search.length > 0 || Object.keys(table.columnFilters).length > 0}
        onClearFilters={table.clearFilters}
        ariaLabel={ariaLabel}
        stickyHeader={stickyHeader}
        density={densityStyles}
        columns={table.visibleColumns}
        rows={table.rows}
        renderCell={renderCell}
        rowActions={rowActions}
        onRowClick={onRowClick}
        selectable={selectable}
        selection={selection}
        allSelected={allSelected}
        someSelected={someSelected}
        toggleAllVisible={toggleAllVisible}
        sort={table.sort}
        onSort={table.handleSort}
        getRowKey={table.getRowKey}
      />

      {pagination && !loading && !error && table.totalItems > 0 ? (
        <div className="px-4 border-t border-[var(--color-border)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <label htmlFor="dt-page-size" className="whitespace-nowrap">
                Rows per page
              </label>
              <select
                id="dt-page-size"
                value={table.pageSize}
                onChange={(e) => table.changePageSize(Number(e.target.value))}
                className="h-7 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <Pagination
              currentPage={table.page}
              totalPages={table.totalPages}
              onPageChange={table.changePage}
              totalItems={table.totalItems}
              itemLabel="rows"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TableBody({
  loading,
  error,
  onRetry,
  emptyState,
  hasActiveFilters,
  onClearFilters,
  ariaLabel,
  stickyHeader,
  density,
  columns,
  rows,
  renderCell,
  rowActions,
  onRowClick,
  selectable,
  selection,
  allSelected,
  someSelected,
  toggleAllVisible,
  sort,
  onSort,
  getRowKey,
}) {
  if (loading) {
    const skeletonCols = columns.map((col) => ({
      key: col.key,
      label: typeof col.label === "string" ? col.label : "",
      width: col.width,
    }));
    const cols = [
      ...(selectable ? [{ key: "__sel__", width: "40px" }] : []),
      ...skeletonCols,
      ...(rowActions ? [{ key: "__actions__", width: "80px" }] : []),
    ];
    return <SkeletonTable columns={cols} rows={6} />;
  }

  if (error) {
    return (
      <StateBlock
        icon={<AlertTriangle size={20} className="text-[var(--color-error)]" />}
        title="Something went wrong"
        description={typeof error === "string" ? error : error?.message || "Unable to load data."}
        action={
          onRetry ? (
            <Button size="sm" variant="outline" icon={<RefreshCw size={14} />} onClick={onRetry}>
              Retry
            </Button>
          ) : null
        }
      />
    );
  }

  if (!rows.length) {
    if (hasActiveFilters) {
      return (
        <StateBlock
          icon={<Inbox size={20} className="text-[var(--color-text-muted)]" />}
          title="No matching results"
          description="Try adjusting filters or search."
          action={
            <Button size="sm" variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }
    return (
      <StateBlock
        icon={emptyState?.icon ?? <Inbox size={20} className="text-[var(--color-text-muted)]" />}
        title={emptyState?.title ?? "No records yet"}
        description={emptyState?.description ?? "When data arrives it will appear here."}
        action={emptyState?.action}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" aria-label={ariaLabel}>
        <thead
          className={cn(
            "bg-[var(--color-bg-secondary)]",
            stickyHeader && "sticky top-0 z-10"
          )}
        >
          <tr className="border-b border-[var(--color-border)]">
            {selectable ? (
              <th scope="col" className={cn("w-10", density.header)}>
                <Checkbox
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAllVisible}
                  size="sm"
                />
              </th>
            ) : null}
            {columns.map((col) => {
              const isSorted = sort?.column === col.key;
              const align = ALIGN_STYLES[col.align] || ALIGN_STYLES.left;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
                  }
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  className={cn(
                    "font-medium uppercase tracking-wide text-[var(--color-text-muted)]",
                    density.header,
                    align
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 hover:text-[var(--color-text-primary)] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded",
                        isSorted && "text-[var(--color-text-primary)]"
                      )}
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sort.direction === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="opacity-50" />
                      )}
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              );
            })}
            {rowActions ? <th scope="col" className={cn("w-20", density.header)} aria-label="Row actions" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowKey = getRowKey(row, rowIndex);
            const isSelected = selection.has(rowKey);
            return (
              <tr
                key={rowKey}
                data-selected={isSelected || undefined}
                className={cn(
                  "border-b border-[var(--color-border)] last:border-b-0 transition-colors",
                  "hover:bg-[var(--color-bg-secondary)]",
                  isSelected && "bg-[var(--color-primary)]/5",
                  onRowClick && "cursor-pointer"
                )}
                onClick={
                  onRowClick
                    ? (e) => {
                        if (e.target.closest("button, input, a, [data-stop-row-click]")) return;
                        onRowClick(row);
                      }
                    : undefined
                }
              >
                {selectable ? (
                  <td className={cn(density.cell, density.row)}>
                    <Checkbox
                      aria-label={`Select row ${rowIndex + 1}`}
                      checked={isSelected}
                      onChange={() => selection.toggle(rowKey)}
                      size="sm"
                    />
                  </td>
                ) : null}
                {columns.map((col) => {
                  const align = ALIGN_STYLES[col.align] || ALIGN_STYLES.left;
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "text-[var(--color-text-primary)]",
                        density.cell,
                        density.row,
                        align,
                        col.className
                      )}
                    >
                      {renderCell(row, col)}
                    </td>
                  );
                })}
                {rowActions ? (
                  <td
                    className={cn(density.cell, density.row, "text-right")}
                    data-stop-row-click="true"
                  >
                    {rowActions(row)}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StateBlock({ icon, title, description, action }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <div className="h-12 w-12 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {description ? (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

function useSelectionModel({ selectedKeys, onSelectionChange }) {
  const isControlled = selectedKeys !== undefined;
  const [internal, setInternal] = useState(() => new Set());

  const current = useMemo(() => {
    if (!isControlled) return internal;
    if (selectedKeys instanceof Set) return selectedKeys;
    return new Set(selectedKeys || []);
  }, [isControlled, selectedKeys, internal]);

  const commit = useCallback(
    (next) => {
      if (!isControlled) setInternal(next);
      onSelectionChange?.(Array.from(next));
    },
    [isControlled, onSelectionChange]
  );

  return {
    has: (k) => current.has(k),
    toggle: (k) => {
      const next = new Set(current);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      commit(next);
    },
    addMany: (keys) => {
      const next = new Set(current);
      keys.forEach((k) => next.add(k));
      commit(next);
    },
    removeMany: (keys) => {
      const next = new Set(current);
      keys.forEach((k) => next.delete(k));
      commit(next);
    },
    clear: () => commit(new Set()),
    size: current.size,
    values: current,
  };
}

const ColumnShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.node,
  accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  sortable: PropTypes.bool,
  filterable: PropTypes.bool,
  filterType: PropTypes.oneOf(["text", "select"]),
  filterOptions: PropTypes.array,
  hidden: PropTypes.bool,
  alwaysVisible: PropTypes.bool,
  align: PropTypes.oneOf(["left", "center", "right"]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  render: PropTypes.func,
  className: PropTypes.string,
  searchable: PropTypes.bool,
});

DataTable.propTypes = {
  columns: PropTypes.arrayOf(ColumnShape).isRequired,
  data: PropTypes.array,
  keyField: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onRetry: PropTypes.func,
  emptyState: PropTypes.shape({
    icon: PropTypes.node,
    title: PropTypes.node,
    description: PropTypes.node,
    action: PropTypes.node,
  }),
  selectable: PropTypes.bool,
  selectedKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
  onSelectionChange: PropTypes.func,
  bulkActions: PropTypes.array,
  defaultSort: PropTypes.shape({ column: PropTypes.string, direction: PropTypes.oneOf(["asc", "desc"]) }),
  sortState: PropTypes.object,
  onSortChange: PropTypes.func,
  searchable: PropTypes.bool,
  searchKeys: PropTypes.arrayOf(PropTypes.string),
  searchPlaceholder: PropTypes.string,
  columnConfig: PropTypes.bool,
  filterable: PropTypes.bool,
  pagination: PropTypes.bool,
  defaultPageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  page: PropTypes.number,
  pageSize: PropTypes.number,
  totalItems: PropTypes.number,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  serverMode: PropTypes.bool,
  toolbarActions: PropTypes.node,
  rowActions: PropTypes.func,
  onRowClick: PropTypes.func,
  ariaLabel: PropTypes.string,
  density: PropTypes.oneOf(["compact", "normal"]),
  stickyHeader: PropTypes.bool,
  className: PropTypes.string,
};

import { useRef, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { columnShape } from "../../utils/propTypes";

const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_OVERSCAN = 10;

/**
 * VirtualizedTable — drop-in replacement for HeroUI Table when rendering 500+ rows.
 *
 * Props:
 * - data          Array of items to render
 * - columns       Array of { key, label, width?, minWidth?, className?, align?, headerContent? }
 * - renderRow     (item, index) => array of <td> elements (or a Fragment containing them)
 * - getRowKey     (item) => unique key string/number
 * - onRowClick    (item, index, event) => void  (optional, skips clicks on buttons/inputs/links)
 * - getRowClassName (item, index) => string  (optional, extra classes per row)
 * - rowHeight     estimated row height in px (default 56)
 * - overscan      rows to render outside viewport (default 10)
 * - emptyContent  ReactNode shown when data is empty
 * - containerClassName  extra classes on the scroll container
 * - headerClassName     extra classes on every <th>
 * - ariaLabel     accessibility label for the table
 */
const VirtualizedTable = forwardRef(function VirtualizedTable(
  {
    data,
    columns,
    renderRow,
    getRowKey,
    onRowClick,
    getRowClassName,
    rowHeight = DEFAULT_ROW_HEIGHT,
    overscan = DEFAULT_OVERSCAN,
    emptyContent = "No data found",
    containerClassName = "",
    headerClassName = "",
    ariaLabel = "Data table",
  },
  ref
) {
  const containerRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  // Expose virtualizer + container ref to parent if needed
  useImperativeHandle(ref, () => ({
    virtualizer: rowVirtualizer,
    scrollElement: containerRef.current,
    scrollToIndex: (index, opts) => rowVirtualizer.scrollToIndex(index, opts),
  }));

  const virtualItems = rowVirtualizer.getVirtualItems();
  const colCount = columns.length;

  const handleRowClick = onRowClick
    ? (item, index, e) => {
        // Skip clicks on interactive elements
        if (
          e.target.closest("button") ||
          e.target.closest("label") ||
          e.target.closest("input") ||
          e.target.closest("a") ||
          e.target.closest("[role='menu']")
        )
          return;
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;
        onRowClick(item, index, e);
      }
    : null;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto scrollbar-auto-hide flex-1 min-h-0 ${containerClassName}`}
    >
      <table
        className="w-full border-spacing-0 select-text border-collapse"
        aria-label={ariaLabel}
      >
        <thead className="sticky top-0 z-30" style={{ backgroundColor: 'var(--color-bg)' }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={col.sortDirection || undefined}
                className={`font-medium text-xs uppercase tracking-wider h-11 border-b px-3 select-none ${
                  col.align === "end" ? "text-right pr-6" : "text-left"
                } ${headerClassName} ${col.className || ""}`}
                style={{
                  width: col.width,
                  minWidth: col.minWidth || col.width,
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-secondary)',
                  borderBottomColor: 'var(--color-border-strong)',
                }}
                onClick={col.onSort}
              >
                {col.headerContent || col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="text-center py-8">
                {typeof emptyContent === "string" ? (
                  <p className="text-gray-400 text-sm">{emptyContent}</p>
                ) : (
                  emptyContent
                )}
              </td>
            </tr>
          ) : (
            <>
              {/* Top spacer */}
              {virtualItems.length > 0 && (
                <tr style={{ height: virtualItems[0].start }}>
                  <td colSpan={colCount} />
                </tr>
              )}

              {virtualItems.map((virtualRow) => {
                const item = data[virtualRow.index];
                if (!item) return null;
                const rowKey = getRowKey(item);
                const extraClass = getRowClassName
                  ? getRowClassName(item, virtualRow.index)
                  : "";

                return (
                  <tr
                    key={rowKey}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    tabIndex={handleRowClick ? 0 : undefined}
                    role={handleRowClick ? "button" : undefined}
                    className={`group transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                      handleRowClick ? "cursor-pointer focus-visible:bg-gray-100 dark:focus-visible:bg-zinc-800 focus-visible:outline-none" : ""
                    } ${extraClass}`}
                    onClick={
                      handleRowClick
                        ? (e) =>
                            handleRowClick(item, virtualRow.index, e)
                        : undefined
                    }
                    onKeyDown={
                      handleRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRowClick(item, virtualRow.index, e);
                            }
                          }
                        : undefined
                    }
                  >
                    {renderRow(item, virtualRow.index)}
                  </tr>
                );
              })}

              {/* Bottom spacer */}
              {virtualItems.length > 0 && (
                <tr
                  style={{
                    height:
                      rowVirtualizer.getTotalSize() -
                      (virtualItems.at(-1)?.end ?? 0),
                  }}
                >
                  <td colSpan={colCount} />
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
});

VirtualizedTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(columnShape).isRequired,
  renderRow: PropTypes.func.isRequired,
  getRowKey: PropTypes.func.isRequired,
  onRowClick: PropTypes.func,
  getRowClassName: PropTypes.func,
  rowHeight: PropTypes.number,
  overscan: PropTypes.number,
  emptyContent: PropTypes.node,
  containerClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default VirtualizedTable;

/**
 * SkeletonTable - A table skeleton loader for loading states
 *
 * columns: number OR array of { key, label, width? }
 *   - number: renders N equal-width columns
 *   - array:  renders columns with proportional widths
 */

const SkeletonTable = ({ columns = 4, rows = 5 }) => {
  const isArray = Array.isArray(columns);
  const colCount = isArray ? columns.length : columns;

  return (
    <div role="status" aria-busy="true" aria-label="Loading table" className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
        {Array.from({ length: colCount }).map((_, index) => {
          const col = isArray ? columns[index] : null;
          const style = col?.width ? { width: col.width, minWidth: col.width, flexShrink: 0 } : undefined;
          return (
            <div key={`skeleton-col-${index}`} className={col?.width ? '' : 'flex-1'} style={style}>
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ width: col?.label ? `${Math.min(col.label.length * 8, 100)}px` : undefined }} />
            </div>
          );
        })}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`skeleton-row-${rowIndex}`}
          className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
        >
          {Array.from({ length: colCount }).map((_, cellIndex) => {
            const col = isArray ? columns[cellIndex] : null;
            const style = col?.width ? { width: col.width, minWidth: col.width, flexShrink: 0 } : undefined;
            return (
              <div key={`skeleton-cell-${cellIndex}`} className={col?.width ? '' : 'flex-1'} style={style}>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;

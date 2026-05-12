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
    <div role="status" aria-busy="true" aria-label="Loading table" className="bg-surface rounded-lg border border-border-token overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-border-token bg-surface-2">
        {Array.from({ length: colCount }).map((_, index) => {
          const col = isArray ? columns[index] : null;
          const style = col?.width ? { width: col.width, minWidth: col.width, flexShrink: 0 } : undefined;
          return (
            <div key={`skeleton-col-${index}`} className={col?.width ? '' : 'flex-1'} style={style}>
              <div className="h-4 bg-surface-hover rounded animate-pulse" style={{ width: col?.label ? `${Math.min(col.label.length * 8, 100)}px` : undefined }} />
            </div>
          );
        })}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`skeleton-row-${rowIndex}`}
          className="flex gap-4 px-4 py-3 border-b border-border-token last:border-b-0"
        >
          {Array.from({ length: colCount }).map((_, cellIndex) => {
            const col = isArray ? columns[cellIndex] : null;
            const style = col?.width ? { width: col.width, minWidth: col.width, flexShrink: 0 } : undefined;
            return (
              <div key={`skeleton-cell-${cellIndex}`} className={col?.width ? '' : 'flex-1'} style={style}>
                <div className="h-4 bg-surface-hover rounded animate-pulse" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;

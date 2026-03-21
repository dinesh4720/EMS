/**
 * SkeletonTable - A table skeleton loader for loading states
 */

const SkeletonTable = ({ columns = 4, rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={`skeleton-col-${index}`} className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`skeleton-row-${rowIndex}`}
          className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, cellIndex) => (
            <div key={`skeleton-cell-${cellIndex}`} className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;

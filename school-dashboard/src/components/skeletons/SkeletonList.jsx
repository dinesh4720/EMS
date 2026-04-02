/**
 * SkeletonList - A list skeleton loader for loading states
 */

const SkeletonList = ({
  items = 5,
  avatar = true,
  title = true,
  subtitle = true,
  className = ""
}) => {
  return (
    <div role="status" aria-busy="true" aria-label="Loading list" className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={`skeleton-item-${index}`}
          className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800"
        >
          {avatar && (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 animate-pulse flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            {title && (
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            )}
            {subtitle && (
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            )}
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonList;

/**
 * SkeletonCard - A card skeleton loader for loading states
 * Bone - A reusable single skeleton pulse element
 */

export const Bone = ({ className = "", style }) => (
  <div className={`bg-gray-200 dark:bg-zinc-700 rounded animate-pulse ${className}`} style={style} />
);

const SkeletonCard = ({
  hasHeader = true,
  headerHeight = "h-6",
  bodyLines = 3,
  bodyLineHeight = "h-4",
  className = ""
}) => {
  return (
    <div role="status" aria-busy="true" aria-label="Loading card" className={`bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden ${className}`}>
      {hasHeader && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
          <Bone className={`${headerHeight} w-1/3`} />
        </div>
      )}
      <div className="p-4 space-y-3">
        {Array.from({ length: bodyLines }).map((_, index) => (
          <Bone
            key={`skeleton-line-${index}`}
            className={bodyLineHeight}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SkeletonCard;

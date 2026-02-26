/**
 * SkeletonCard - A card skeleton loader for loading states
 * Use this instead of Spinner for better UX
 */

const SkeletonCard = ({ 
  hasHeader = true, 
  headerHeight = "h-6", 
  bodyLines = 3,
  bodyLineHeight = "h-4",
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-default-50 rounded-lg border border-default-200 overflow-hidden ${className}`}>
      {/* Header skeleton */}
      {hasHeader && (
        <div className="px-4 py-3 border-b border-default-200">
          <div className={`${headerHeight} w-1/3 bg-default-200 rounded animate-pulse`} />
        </div>
      )}
      
      {/* Body skeleton */}
      <div className="p-4 space-y-3">
        {Array.from({ length: bodyLines }).map((_, index) => (
          <div 
            key={index} 
            className={`${bodyLineHeight} bg-default-200 rounded animate-pulse`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SkeletonCard;

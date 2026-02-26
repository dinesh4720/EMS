/**
 * SkeletonList - A list skeleton loader for loading states
 * Use this for list-based content loading
 */

const SkeletonList = ({ 
  items = 5,
  avatar = true,
  title = true,
  subtitle = true,
  className = ""
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div 
          key={index} 
          className="flex items-center gap-3 p-3 bg-white dark:bg-default-50 rounded-lg border border-default-200"
        >
          {/* Avatar skeleton */}
          {avatar && (
            <div className="w-10 h-10 rounded-full bg-default-200 animate-pulse flex-shrink-0" />
          )}
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            {title && (
              <div className="h-4 w-1/3 bg-default-200 rounded animate-pulse" />
            )}
            {subtitle && (
              <div className="h-3 w-1/2 bg-default-200 rounded animate-pulse" />
            )}
          </div>
          
          {/* Action skeleton */}
          <div className="w-8 h-8 bg-default-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonList;

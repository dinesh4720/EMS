/**
 * SkeletonForm - A form skeleton loader for loading states
 */

const SkeletonForm = ({
  fields = 4,
  showSubmit = true,
  className = ""
}) => {
  return (
    <div role="status" aria-busy="true" aria-label="Loading form" className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`skeleton-field-${index}`} className="space-y-2">
          <div className="h-4 w-1/4 bg-surface-hover rounded animate-pulse" />
          <div className="h-10 bg-surface-hover rounded animate-pulse" />
        </div>
      ))}
      {showSubmit && (
        <div className="pt-4">
          <div className="h-10 w-32 bg-surface-hover rounded animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SkeletonForm;

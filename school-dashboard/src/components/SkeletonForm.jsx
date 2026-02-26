/**
 * SkeletonForm - A form skeleton loader for loading states
 * Use this for form loading states
 */

const SkeletonForm = ({ 
  fields = 4,
  showSubmit = true,
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Form fields skeleton */}
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-1/4 bg-default-200 rounded animate-pulse" />
          <div className="h-10 bg-default-200 rounded animate-pulse" />
        </div>
      ))}
      
      {/* Submit button skeleton */}
      {showSubmit && (
        <div className="pt-4">
          <div className="h-10 w-32 bg-default-200 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SkeletonForm;

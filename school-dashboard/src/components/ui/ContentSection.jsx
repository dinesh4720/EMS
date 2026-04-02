/**
 * ContentSection - Content wrapper with consistent spacing
 */
import { cn } from "../../utils/cn";

export default function ContentSection({
  children,
  className,
  minHeight,
  padding = "md",
}) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        paddingStyles[padding],
        className
      )}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
    >
      {children}
    </div>
  );
}

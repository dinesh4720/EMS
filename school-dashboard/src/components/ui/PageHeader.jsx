/**
 * PageHeader - Clean page header component
 */
import { memo } from "react";
import { cn } from "../../utils/cn";

const PageHeader = memo(function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
  size = "md",
  bordered = true,
}) {
  const sizeStyles = {
    sm: {
      title: "text-lg",
      description: "text-xs",
      padding: bordered ? "py-3 px-4" : "",
    },
    md: {
      title: "text-xl",
      description: "text-sm",
      padding: bordered ? "py-5 px-6" : "",
    },
    lg: {
      title: "text-2xl",
      description: "text-base",
      padding: bordered ? "py-6 px-6" : "",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        bordered && "border-b border-divider",
        styles.padding,
        className
      )}
    >
      {breadcrumb && (
        <div className="mb-2">{breadcrumb}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn("font-medium text-fg", styles.title)}>
            {title}
          </h1>
          {description && (
            <p className={cn("text-fg-muted mt-1", styles.description)}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;

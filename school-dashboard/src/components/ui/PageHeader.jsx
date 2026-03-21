/**
 * PageHeader - Clean page header component
 */
import { cn } from "../../utils/cn";

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
  size = "md",
}) {
  const sizeStyles = {
    sm: {
      title: "text-lg",
      description: "text-xs",
      padding: "py-3 px-4",
    },
    md: {
      title: "text-xl",
      description: "text-sm",
      padding: "py-5 px-6",
    },
    lg: {
      title: "text-2xl",
      description: "text-base",
      padding: "py-6 px-6",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn("border-b border-gray-100 dark:border-zinc-800", styles.padding, className)}>
      {breadcrumb && (
        <div className="mb-2">{breadcrumb}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn("font-medium text-gray-900 dark:text-zinc-100", styles.title)}>
            {title}
          </h1>
          {description && (
            <p className={cn("text-gray-500 dark:text-zinc-400 mt-1", styles.description)}>
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
}

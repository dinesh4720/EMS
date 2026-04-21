import { memo } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZE = {
  sm: {
    wrapper: "py-6 gap-2",
    icon: "h-10 w-10",
    iconInner: 18,
    title: "text-sm",
    description: "text-xs max-w-sm",
  },
  md: {
    wrapper: "py-10 gap-3",
    icon: "h-12 w-12",
    iconInner: 20,
    title: "text-sm",
    description: "text-xs max-w-md",
  },
  lg: {
    wrapper: "py-16 gap-4",
    icon: "h-14 w-14",
    iconInner: 24,
    title: "text-base",
    description: "text-sm max-w-md",
  },
};

const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  illustration,
  title = "No records yet",
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  children,
}) {
  const styles = SIZE[size] || SIZE.md;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.wrapper,
        className,
      )}
    >
      {illustration ?? (
        <div
          className={cn(
            "rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center",
            styles.icon,
          )}
          aria-hidden="true"
        >
          <Icon size={styles.iconInner} className="text-gray-400 dark:text-zinc-500" />
        </div>
      )}
      <div className="space-y-1">
        <p className={cn("font-medium text-gray-900 dark:text-zinc-100", styles.title)}>
          {title}
        </p>
        {description && (
          <p className={cn("text-gray-500 dark:text-zinc-400 mx-auto", styles.description)}>
            {description}
          </p>
        )}
      </div>
      {children}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
});

EmptyState.displayName = "EmptyState";

export default EmptyState;

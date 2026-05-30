import { memo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import MinimalButton from "./MinimalButton";
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

function extractMessage(error) {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    return error.message || error.error || null;
  }
  return null;
}

const ErrorState = memo(function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "We couldn't load this data. Try again in a moment.",
  error,
  onRetry,
  retryLabel = "Retry",
  action,
  size = "md",
  className,
  children,
}) {
  const styles = SIZE[size] || SIZE.md;
  const errorMessage = extractMessage(error);
  const resolvedDescription = errorMessage || description;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.wrapper,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full bg-[var(--danger-bg)] flex items-center justify-center",
          styles.icon,
        )}
        aria-hidden="true"
      >
        <Icon size={styles.iconInner} className="text-[var(--danger)]" />
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium text-fg", styles.title)}>
          {title}
        </p>
        {resolvedDescription && (
          <p className={cn("text-fg-muted mx-auto", styles.description)}>
            {resolvedDescription}
          </p>
        )}
      </div>
      {children}
      {(onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onRetry && (
            <MinimalButton
              size={size === "lg" ? "md" : "sm"}
              variant="secondary"
              icon={<RefreshCw size={14} />}
              onClick={onRetry}
            >
              {retryLabel}
            </MinimalButton>
          )}
          {action}
        </div>
      )}
    </div>
  );
});

ErrorState.displayName = "ErrorState";

export default ErrorState;

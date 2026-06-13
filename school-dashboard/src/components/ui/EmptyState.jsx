import { memo, useEffect } from "react";
import PropTypes from "prop-types";
import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";
import MinimalButton from "./MinimalButton";

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

// Status-tinted icon containers (matches bundle's state taxonomy: empty,
// loading, error, no-permission, first-run, all-done).
const KIND = {
  default: "bg-surface-2 text-fg-faint",
  ok: "bg-[var(--ok-bg)] text-[var(--ok)]",
  warn: "bg-[var(--warn-bg)] text-[var(--warn)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
  info: "bg-[var(--info-bg)] text-[var(--info)]",
  accent: "bg-[var(--accent-bg)] text-[var(--accent)]",
};

const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  illustration,
  title = "Nothing here yet",
  description,
  action,
  secondaryAction,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  size = "md",
  kind = "default",
  className,
  children,
}) {
  const styles = SIZE[size] || SIZE.md;
  const tone = KIND[kind] || KIND.default;

  useEffect(() => {
    if (import.meta.env?.DEV && action && !actionLabel) {
      // eslint-disable-next-line no-console
      console.warn(
        "[EmptyState] The `action` prop is provided without `actionLabel`. Prefer `actionLabel` + `onAction` for accessible action buttons."
      );
    }
  }, [action, actionLabel]);

  const renderAction = () => {
    if (actionLabel && onAction) {
      return (
        <MinimalButton variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </MinimalButton>
      );
    }
    return action;
  };

  const renderSecondaryAction = () => {
    if (secondaryActionLabel && onSecondaryAction) {
      return (
        <MinimalButton variant="ghost" size="sm" onClick={onSecondaryAction}>
          {secondaryActionLabel}
        </MinimalButton>
      );
    }
    return secondaryAction;
  };

  const hasActions =
    renderAction() || renderSecondaryAction() || action || secondaryAction;

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
            "flex items-center justify-center",
            // Status-tinted variants get a square-ish chip per the design
            // system; the default keeps the legacy round bubble for
            // backwards compatibility.
            kind === "default" ? "rounded-full" : "rounded-xl",
            styles.icon,
            tone,
          )}
          aria-hidden="true"
        >
          <Icon size={styles.iconInner} />
        </div>
      )}
      <div className="space-y-1">
        <p className={cn("font-medium text-fg", styles.title)}>
          {title}
        </p>
        {description && (
          <p className={cn("text-fg-muted mx-auto", styles.description)}>
            {description}
          </p>
        )}
      </div>
      {children}
      {hasActions && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {renderAction()}
          {renderSecondaryAction()}
        </div>
      )}
    </div>
  );
});

EmptyState.displayName = "EmptyState";

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  illustration: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  secondaryAction: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  secondaryActionLabel: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  kind: PropTypes.oneOf(["default", "ok", "warn", "danger", "info", "accent"]),
  className: PropTypes.string,
  children: PropTypes.node,
};

export default EmptyState;

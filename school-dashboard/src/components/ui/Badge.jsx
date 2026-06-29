import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

/**
 * Token-compliant badge palettes. All colours resolve through the design-token
 * system so light/dark mode and contrast fixes are managed in one place
 * (tokens.css). Solid variants use status tints; the primary variant uses the
 * accent colour to avoid hardcoded greys.
 */
const COLOR_STYLES = {
  neutral:
    "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]",
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-fg)]",
  success:
    "bg-[var(--color-ok-bg)] text-[var(--ok-hover)]",
  warning:
    "bg-[var(--color-warn-bg)] text-[var(--color-warn)]",
  danger:
    "bg-[var(--color-danger-bg)] text-[var(--danger-hover)]",
  info:
    "bg-[var(--color-info-bg)] text-[var(--info-hover)]",
};

const OUTLINE_STYLES = {
  neutral:
    "bg-transparent text-[var(--color-text-secondary)] border border-[var(--border-strong)]",
  primary:
    "bg-transparent text-[var(--color-accent)] border border-[var(--accent-border)]",
  success:
    "bg-transparent text-[var(--color-ok)] border border-[var(--ok-border)]",
  warning:
    "bg-transparent text-[var(--color-warn)] border border-[var(--warn-border)]",
  danger:
    "bg-transparent text-[var(--color-danger-token)] border border-[var(--danger-border)]",
  info:
    "bg-transparent text-[var(--color-info-token)] border border-[var(--info-border)]",
};

const DOT_STYLES = {
  neutral: "bg-[var(--color-text-muted)]",
  primary: "bg-[var(--color-accent-fg)]",
  success: "bg-[var(--color-ok)]",
  warning: "bg-[var(--color-warn)]",
  danger: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info)]",
};

const SIZE_STYLES = {
  sm: "text-2xs px-1.5 py-0.5 gap-1",
  md: "text-xs px-2 py-0.5 gap-1",
  lg: "text-sm px-2.5 py-1 gap-1.5",
};

const Badge = forwardRef(function Badge(
  {
    children,
    color = "neutral",
    variant = "solid",
    size = "md",
    dot = false,
    icon,
    className,
    ...props
  },
  ref
) {
  const palette = variant === "outline" ? OUTLINE_STYLES : COLOR_STYLES;
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        SIZE_STYLES[size],
        palette[color],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("inline-block rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", DOT_STYLES[color])}
        />
      )}
      {icon}
      {children}
    </span>
  );
});

Badge.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
  variant: PropTypes.oneOf(["solid", "outline"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  dot: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Badge;

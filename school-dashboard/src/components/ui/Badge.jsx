import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const COLOR_STYLES = {
  neutral:
    "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  primary:
    "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  success:
    "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger:
    "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info:
    "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const OUTLINE_STYLES = {
  neutral:
    "bg-transparent text-gray-700 border border-gray-200 dark:text-zinc-300 dark:border-zinc-700",
  primary:
    "bg-transparent text-gray-900 border border-gray-900 dark:text-zinc-100 dark:border-zinc-100",
  success:
    "bg-transparent text-green-700 border border-green-200 dark:text-green-400 dark:border-green-900/50",
  warning:
    "bg-transparent text-amber-700 border border-amber-200 dark:text-amber-400 dark:border-amber-900/50",
  danger:
    "bg-transparent text-red-700 border border-red-200 dark:text-red-400 dark:border-red-900/50",
  info:
    "bg-transparent text-blue-700 border border-blue-200 dark:text-blue-400 dark:border-blue-900/50",
};

const DOT_STYLES = {
  neutral: "bg-gray-500",
  primary: "bg-gray-900 dark:bg-zinc-100",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

const SIZE_STYLES = {
  sm: "text-[10px] px-1.5 py-0.5 gap-1",
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

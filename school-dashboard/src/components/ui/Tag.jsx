import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const COLOR_STYLES = {
  neutral:
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700",
  primary:
    "bg-gray-50 text-gray-900 border-gray-300 dark:bg-zinc-800/50 dark:text-zinc-100 dark:border-zinc-600",
  success:
    "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/50",
  danger:
    "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50",
  info:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/50",
};

const SIZE_STYLES = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-2.5 py-1",
};

const Tag = forwardRef(function Tag(
  {
    children,
    color = "neutral",
    size = "md",
    icon,
    className,
    ...props
  },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 font-medium border rounded-md whitespace-nowrap",
        SIZE_STYLES[size],
        COLOR_STYLES[color],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
});

Tag.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Tag;

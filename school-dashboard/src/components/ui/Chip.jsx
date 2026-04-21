import { forwardRef } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

const COLOR_STYLES = {
  neutral:
    "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200",
  primary:
    "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  success:
    "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  danger:
    "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  info:
    "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const SELECTED_STYLES = {
  neutral: "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-gray-900 dark:border-zinc-100",
  primary: "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  success: "bg-green-600 text-white",
  warning: "bg-amber-600 text-white",
  danger: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

const SIZE_STYLES = {
  sm: "h-6 px-2 text-xs gap-1",
  md: "h-7 px-3 text-xs gap-1.5",
  lg: "h-8 px-3.5 text-sm gap-1.5",
};

const Chip = forwardRef(function Chip(
  {
    children,
    color = "neutral",
    size = "md",
    selected = false,
    onRemove,
    onClick,
    disabled = false,
    startContent,
    className,
    type = "button",
    ...props
  },
  ref
) {
  const isInteractive = Boolean(onClick || onRemove);
  const palette = selected ? SELECTED_STYLES[color] : COLOR_STYLES[color];

  const content = (
    <>
      {startContent}
      <span className="truncate">{children}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className="inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 -mr-1"
          aria-label="Remove"
        >
          <X size={size === "sm" ? 12 : 14} aria-hidden="true" />
        </button>
      )}
    </>
  );

  const classes = cn(
    "inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors",
    SIZE_STYLES[size],
    palette,
    isInteractive && !disabled &&
      "cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  if (onClick) {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <span ref={ref} className={classes} {...props}>
      {content}
    </span>
  );
});

Chip.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  selected: PropTypes.bool,
  onRemove: PropTypes.func,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  startContent: PropTypes.node,
  className: PropTypes.string,
  type: PropTypes.string,
};

export default Chip;

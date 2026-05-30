import { forwardRef } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

const COLOR_STYLES = {
  neutral: "bg-[var(--surface-2)] text-[var(--fg-muted)]",
  primary: "bg-[var(--fg)] text-[var(--surface)]",
  success: "bg-[var(--ok-bg)] text-[var(--ok)]",
  warning: "bg-[var(--warn-bg)] text-[var(--warn)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
  info: "bg-[var(--info-bg)] text-[var(--info)]",
};

const SELECTED_STYLES = {
  neutral: "bg-[var(--fg)] text-[var(--surface)] border-[var(--fg)]",
  primary: "bg-[var(--fg)] text-[var(--surface)]",
  success: "bg-[var(--ok)] text-[var(--surface)]",
  warning: "bg-[var(--warn)] text-[var(--surface)]",
  danger: "bg-[var(--danger)] text-[var(--surface)]",
  info: "bg-[var(--info)] text-[var(--surface)]",
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
          className="inline-flex items-center justify-center rounded-full hover:bg-[var(--fg)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 -mr-1"
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

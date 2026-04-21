import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  sm: "h-7 w-7 rounded-md",
  md: "h-9 w-9 rounded-lg",
  lg: "h-11 w-11 rounded-lg",
};

const VARIANT_STYLES = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
  secondary:
    "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-strong)]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
  outline:
    "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-tertiary)]",
  danger:
    "bg-transparent text-[var(--color-error)] hover:bg-[var(--color-error)]/10",
};

const IconButton = forwardRef(function IconButton(
  {
    icon,
    children,
    "aria-label": ariaLabel,
    variant = "ghost",
    size = "md",
    disabled = false,
    type = "button",
    className,
    ...props
  },
  ref
) {
  const content = icon ?? children;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {content}
    </button>
  );
});

IconButton.propTypes = {
  icon: PropTypes.node,
  children: PropTypes.node,
  "aria-label": PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "outline", "danger"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string,
};

export default IconButton;

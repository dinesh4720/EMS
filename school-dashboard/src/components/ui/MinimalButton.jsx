/**
 * MinimalButton - Clean button component
 */
import { memo } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";
import { useIconButtonA11yWarning } from "../../utils/a11y";

const MinimalButton = memo(function MinimalButton({
  children,
  variant = "primary", // primary, secondary, ghost, danger
  size = "md", // sm, md, lg
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  ...props
}) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5 min-h-8",
    md: "px-4 py-2 text-sm gap-2 min-h-9",
    lg: "px-5 py-2.5 text-base gap-2 min-h-11",
  };

  /*
   * Uses CSS design tokens from @theme (index.css) instead of hardcoded
   * Tailwind gray/zinc classes. This ensures MinimalButton stays in sync
   * with the single color system and responds to dark-mode token overrides.
   *
   * Color system hierarchy (CSS-03):
   *   1. CSS custom properties (@theme / html.dark overrides) <- source of truth
   *   2. Tailwind utilities that reference those vars (text-[var(--color-*)])
   *   3. HeroUI tokens (used by HeroUI Button only -- not here)
   *
   * Do not add hardcoded hex or Tailwind gray-* classes to this component.
   *
   * TODO (AUDIT-176): MinimalButton is the only custom component using CSS
   * custom properties for colors. Other components (MinimalCard, StatCard,
   * etc.) use Tailwind utility classes directly. This inconsistency means
   * theme changes need updates in multiple places. Ideally all custom
   * components should migrate to the same approach. See theme/colors.js.
   */
  const variantStyles = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
    secondary: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-strong)]",
    ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
    danger: "bg-[var(--color-error)] text-white hover:opacity-90",
  };

  const isIconOnly = !children && Boolean(icon);

  useIconButtonA11yWarning("MinimalButton", {
    isIconOnly,
    ariaLabel,
    ariaLabelledBy,
  });

  return (
    <button
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </button>
  );
});

MinimalButton.displayName = 'MinimalButton';

MinimalButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "danger"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  "aria-label": PropTypes.string,
  "aria-labelledby": PropTypes.string,
  className: PropTypes.string,
};

export default MinimalButton;

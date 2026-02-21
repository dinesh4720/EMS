/**
 * MinimalButton - Clean button component
 */
import { cn } from "../../utils/cn";

export default function MinimalButton({
  children,
  variant = "primary", // primary, secondary, ghost, danger
  size = "md", // sm, md, lg
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };

  const variantStyles = {
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
}

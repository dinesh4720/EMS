import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const TRACK_SIZE = {
  sm: "h-4 w-7",
  md: "h-5 w-9",
  lg: "h-6 w-11",
};

const THUMB_SIZE = {
  sm: "h-3 w-3 peer-checked:translate-x-3",
  md: "h-4 w-4 peer-checked:translate-x-4",
  lg: "h-5 w-5 peer-checked:translate-x-5",
};

const Switch = forwardRef(function Switch(
  {
    label,
    description,
    error,
    size = "md",
    className,
    wrapperClassName,
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = description ? `${inputId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("inline-flex flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          props.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            role="switch"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              "inline-block rounded-full bg-[var(--color-border-strong)] transition-colors",
              "peer-checked:bg-[var(--color-primary)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)]/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg)]",
              error && "bg-[var(--color-error)]",
              TRACK_SIZE[size],
              className
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform",
              THUMB_SIZE[size]
            )}
          />
        </span>
        {(label || description) && (
          <span className="flex flex-col leading-tight">
            {label && (
              <span className="text-sm text-[var(--color-text-primary)]">
                {label}
              </span>
            )}
            {description && (
              <span id={hintId} className="text-xs text-[var(--color-text-muted)]">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
});

Switch.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Switch;

import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-12 text-base",
};

const Input = forwardRef(function Input(
  {
    label,
    description,
    error,
    hint,
    startContent,
    endContent,
    size = "md",
    required = false,
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
  const hintId = hint || description ? `${inputId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[var(--color-text-secondary)]"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[var(--color-error)]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {description && !error && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      <div
        className={cn(
          "flex items-center gap-2 w-full rounded-lg border bg-[var(--color-bg)] px-3",
          "border-[var(--color-border-strong)]",
          "transition-colors",
          "focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20",
          error &&
            "border-[var(--color-error)] focus-within:border-[var(--color-error)] focus-within:ring-[var(--color-error)]/20",
          props.disabled && "opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]",
          SIZE_STYLES[size],
          className
        )}
      >
        {startContent && (
          <span className="text-[var(--color-text-muted)] flex shrink-0 items-center">
            {startContent}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex-1 bg-transparent outline-none w-full text-[var(--color-text-primary)]",
            "placeholder:text-[var(--color-text-muted)]",
            "disabled:cursor-not-allowed"
          )}
          {...props}
        />
        {endContent && (
          <span className="text-[var(--color-text-muted)] flex shrink-0 items-center">
            {endContent}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
      {hint && !error && !description && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.node,
  hint: PropTypes.node,
  startContent: PropTypes.node,
  endContent: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  required: PropTypes.bool,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Input;

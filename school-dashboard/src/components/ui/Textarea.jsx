import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const Textarea = forwardRef(function Textarea(
  {
    label,
    description,
    error,
    hint,
    rows = 4,
    required = false,
    className,
    wrapperClassName,
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint || description ? `${textareaId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
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
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-lg border bg-[var(--color-bg)] px-3 py-2 text-sm",
          "border-[var(--color-border-strong)] text-[var(--color-text-primary)]",
          "placeholder:text-[var(--color-text-muted)]",
          "outline-none transition-colors resize-y",
          "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
          error &&
            "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]",
          className
        )}
        {...props}
      />
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

Textarea.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.node,
  hint: PropTypes.node,
  rows: PropTypes.number,
  required: PropTypes.bool,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Textarea;

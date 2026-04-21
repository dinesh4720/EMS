import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { Check, Minus } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  sm: "h-4 w-4",
  md: "h-[18px] w-[18px]",
  lg: "h-5 w-5",
};

const Checkbox = forwardRef(function Checkbox(
  {
    label,
    description,
    error,
    indeterminate = false,
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

  const setRef = (node) => {
    if (node) node.indeterminate = indeterminate;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div className={cn("inline-flex flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start gap-2 cursor-pointer select-none",
          props.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="relative inline-flex shrink-0 mt-0.5">
          <input
            ref={setRef}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex items-center justify-center rounded border bg-[var(--color-bg)]",
              "border-[var(--color-border-strong)] transition-colors",
              "peer-hover:border-[var(--color-primary)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)]/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg)]",
              "peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] peer-checked:text-white",
              "peer-indeterminate:bg-[var(--color-primary)] peer-indeterminate:border-[var(--color-primary)] peer-indeterminate:text-white",
              error && "border-[var(--color-error)]",
              SIZE_STYLES[size],
              className
            )}
          >
            {indeterminate ? (
              <Minus size={size === "sm" ? 10 : 12} strokeWidth={3} />
            ) : (
              <Check
                size={size === "sm" ? 10 : 12}
                strokeWidth={3}
                className="opacity-0 peer-checked:opacity-100"
              />
            )}
          </span>
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

Checkbox.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.node,
  indeterminate: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Checkbox;

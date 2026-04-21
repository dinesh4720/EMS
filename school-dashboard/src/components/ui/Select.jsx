import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  sm: "h-8 text-xs pl-3 pr-8",
  md: "h-10 text-sm pl-3 pr-9",
  lg: "h-12 text-base pl-4 pr-10",
};

const Select = forwardRef(function Select(
  {
    label,
    description,
    error,
    hint,
    options,
    placeholder,
    size = "md",
    required = false,
    children,
    className,
    wrapperClassName,
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint || description ? `${selectId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
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
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-lg border bg-[var(--color-bg)] appearance-none",
            "border-[var(--color-border-strong)] text-[var(--color-text-primary)]",
            "outline-none transition-colors",
            "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
            error &&
              "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]",
            SIZE_STYLES[size],
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
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

Select.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.node,
  hint: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  placeholder: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  required: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Select;

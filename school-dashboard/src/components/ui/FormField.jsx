import { cloneElement, isValidElement, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";
import FieldError from "./FieldError";

/**
 * FormField - layout wrapper that attaches a label, hint, and error message
 * to any custom input. Use this for composing non-primitive inputs
 * (date pickers, custom widgets). For plain Input/Textarea/Select use their
 * built-in label/error props.
 */
export default function FormField({
  label,
  description,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  className,
}) {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint || description ? `${fieldId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || fieldId,
        "aria-invalid": error ? "true" : children.props["aria-invalid"],
        "aria-describedby":
          [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ") ||
          undefined,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={fieldId}
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
      {control}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && !error && !description && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  required: PropTypes.bool,
  htmlFor: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

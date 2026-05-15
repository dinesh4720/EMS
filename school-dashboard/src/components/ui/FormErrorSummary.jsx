import { forwardRef } from "react";
import PropTypes from "prop-types";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * FormErrorSummary — accessible top-of-form banner that lists every field error
 * after a failed submit. Clicking an item focuses the related field via
 * `onFocusField(name)` (typically wired to `focusFirstError` / `registerField`
 * from `useFormErrors`).
 *
 * Renders nothing when there are no errors. Uses role="alert" + aria-live so
 * screen readers announce it on every submission attempt.
 */
const FormErrorSummary = forwardRef(function FormErrorSummary(
  {
    errors = {},
    title = "Please fix the following:",
    labels = {},
    onFocusField,
    id = "form-error-summary",
    className,
  },
  ref
) {
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg));
  if (entries.length === 0) return null;

  return (
    <div
      ref={ref}
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900",
        "dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          size={16}
          className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {entries.map(([name, msg]) => {
              const label = labels[name] || name;
              return (
                <li key={name}>
                  {onFocusField ? (
                    <button
                      type="button"
                      onClick={() => onFocusField(name)}
                      className="underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      <span className="font-medium">{label}:</span> {msg}
                    </button>
                  ) : (
                    <span>
                      <span className="font-medium">{label}:</span> {msg}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});

FormErrorSummary.propTypes = {
  errors: PropTypes.object,
  title: PropTypes.node,
  labels: PropTypes.object,
  onFocusField: PropTypes.func,
  id: PropTypes.string,
  className: PropTypes.string,
};

export default FormErrorSummary;

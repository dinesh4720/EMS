import PropTypes from "prop-types";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";

export default function FieldError({ id, children, showIcon = false, className }) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "flex items-start gap-1 text-xs text-[var(--color-error)]",
        className
      )}
    >
      {showIcon && (
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>{children}</span>
    </p>
  );
}

FieldError.propTypes = {
  id: PropTypes.string,
  children: PropTypes.node,
  showIcon: PropTypes.bool,
  className: PropTypes.string,
};

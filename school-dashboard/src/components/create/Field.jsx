import { cn } from "../../utils/cn";

export function Field({ label, required, hint, error, className, children }) {
  return (
    <label className={cn("field", className)}>
      {label && (
        <span className="field__label">
          {label}
          {required && <span className="req">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="field__hint" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function FieldIconWrap({ icon: Icon, suffix, className, children }) {
  return (
    <div className={cn("field__icon-wrap", className)}>
      {Icon && <Icon size={12} className="field__icon" aria-hidden />}
      {children}
      {suffix && <span className="field__suffix">{suffix}</span>}
    </div>
  );
}

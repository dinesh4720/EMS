import { cn } from "../../utils/cn";

export function Field({ label, required, hint, className, children }) {
  return (
    <div className={cn("field", className)}>
      {label && (
        <label className="field__label">
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
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

import { Children, cloneElement, isValidElement, useId } from "react";

export default function ComposerField({
  label,
  required,
  hint,
  error,
  className = "",
  name,
  registerField,
  children,
}) {
  const baseId = useId();
  const fieldId = name ? `field-${name}-${baseId}` : baseId;
  const hintId = hint || error ? `${fieldId}-hint` : undefined;

  const attachIds = (child) => {
    if (!isValidElement(child)) return child;
    const type = child.type;
    const isFormControl =
      type === "input" || type === "select" || type === "textarea";
    if (isFormControl) {
      return cloneElement(child, {
        id: fieldId,
        "aria-describedby": hintId || child.props?.["aria-describedby"],
      });
    }
    const childChildren = child.props?.children;
    if (childChildren) {
      return cloneElement(child, {
        children: Children.map(childChildren, attachIds),
      });
    }
    return child;
  };

  return (
    <div
      className={`field ${className}`}
      ref={name && registerField ? registerField(name) : undefined}
    >
      <label className="field__label" htmlFor={fieldId}>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {Children.map(children, attachIds)}
      {error ? (
        <span id={hintId} role="alert" className="field__hint field__hint--danger">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

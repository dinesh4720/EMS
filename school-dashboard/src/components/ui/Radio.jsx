import { createContext, forwardRef, useContext, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const RadioGroupContext = createContext(null);

const SIZE_STYLES = {
  sm: "h-4 w-4",
  md: "h-[18px] w-[18px]",
  lg: "h-5 w-5",
};

const DOT_SIZE = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

const Radio = forwardRef(function Radio(
  {
    label,
    description,
    value,
    size: sizeProp,
    className,
    wrapperClassName,
    id,
    checked: checkedProp,
    onChange: onChangeProp,
    name: nameProp,
    disabled: disabledProp,
    ...props
  },
  ref
) {
  const group = useContext(RadioGroupContext);
  const generatedId = useId();
  const inputId = id || generatedId;

  const name = nameProp ?? group?.name;
  const size = sizeProp ?? group?.size ?? "md";
  const disabled = disabledProp ?? group?.disabled ?? false;
  const checked =
    group != null ? group.value === value : checkedProp;
  const onChange =
    group != null
      ? () => group.onChange(value)
      : onChangeProp;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex items-start gap-2 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        wrapperClassName
      )}
    >
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input
          ref={ref}
          id={inputId}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex items-center justify-center rounded-full border bg-[var(--color-bg)]",
            "border-[var(--color-border-strong)] transition-colors",
            "peer-hover:border-[var(--color-primary)]",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)]/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg)]",
            "peer-checked:border-[var(--color-primary)]",
            SIZE_STYLES[size],
            className
          )}
        >
          <span
            className={cn(
              "rounded-full bg-[var(--color-primary)] opacity-0 peer-checked:opacity-100 transition-opacity",
              DOT_SIZE[size]
            )}
          />
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
            <span className="text-xs text-[var(--color-text-muted)]">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
});

Radio.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  name: PropTypes.string,
  disabled: PropTypes.bool,
};

export function RadioGroup({
  label,
  description,
  error,
  value,
  onChange,
  name,
  size = "md",
  disabled = false,
  orientation = "vertical",
  children,
  className,
}) {
  const generatedName = useId();
  const groupName = name || generatedName;
  const errorId = error ? `${groupName}-error` : undefined;

  return (
    <div
      role="radiogroup"
      aria-label={typeof label === "string" ? label : undefined}
      aria-describedby={errorId}
      aria-invalid={error ? "true" : undefined}
      className={cn("space-y-2", className)}
    >
      {label && (
        <div className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </div>
      )}
      {description && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      )}
      <RadioGroupContext.Provider
        value={{ name: groupName, value, onChange, size, disabled }}
      >
        <div
          className={cn(
            "flex gap-4",
            orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
          )}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}

RadioGroup.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  orientation: PropTypes.oneOf(["vertical", "horizontal"]),
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Radio;

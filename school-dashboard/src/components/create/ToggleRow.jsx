import { cn } from "../../utils/cn";

export function ToggleRow({ title, desc, checked, onChange, disabled }) {
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  return (
    <div className="toggle-row">
      <div className="toggle-row__text">
        <div className="toggle-row__title">{title}</div>
        {desc && <div className="toggle-row__desc">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        aria-label={typeof title === "string" ? title : undefined}
        disabled={disabled}
        onClick={toggle}
        className={cn("switch", checked && "is-on", disabled && "opacity-50 cursor-not-allowed")}
      />
    </div>
  );
}

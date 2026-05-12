import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

export function OptGrid({ columns, className, children, style }) {
  const gridStyle = columns
    ? { gridTemplateColumns: typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns, ...style }
    : style;
  return (
    <div className={cn("optgrid", className)} style={gridStyle}>
      {children}
    </div>
  );
}

export function Opt({ active, onClick, icon: Icon, label, sub, type = "button" }) {
  return (
    <button type={type} className={cn("opt", active && "is-active")} onClick={onClick}>
      <span className="opt__icon">{Icon && <Icon size={12} strokeWidth={2} />}</span>
      <span className="flex flex-col items-start gap-px min-w-0 leading-tight">
        <span style={{ fontWeight: 520 }}>{label}</span>
        {sub && <span className="subtle text-[11px]">{sub}</span>}
      </span>
      <span className="opt__check"><Check size={8} strokeWidth={3} /></span>
    </button>
  );
}

import { Plus } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Inline "+ Add more" reveal trigger used to expand optional sections.
 */
export function Disclosure({ icon: Icon = Plus, onClick, className, style, children }) {
  return (
    <button type="button" onClick={onClick} className={cn("disclosure", className)} style={style}>
      <Icon size={11} />
      {children}
    </button>
  );
}

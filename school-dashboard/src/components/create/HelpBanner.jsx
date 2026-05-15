import { Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";

export function HelpBanner({ icon: Icon = Sparkles, className, children }) {
  return (
    <div className={cn("help-banner", className)}>
      <Icon size={13} strokeWidth={2} />
      <span>{children}</span>
    </div>
  );
}

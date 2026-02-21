/**
 * MinimalTabs - Clean tab navigation without gradients
 */
import { cn } from "../../utils/cn";

export default function MinimalTabs({
  tabs,
  activeKey,
  onChange,
  size = "md",
  variant = "pills", // pills, underline, plain
  className,
}) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  if (variant === "underline") {
    return (
      <nav className={cn("flex border-b border-gray-100", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors",
              activeKey === tab.key
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700",
              sizeStyles[size]
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.title}
            </span>
            {activeKey === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        ))}
      </nav>
    );
  }

  // Pills variant (default)
  return (
    <nav className={cn("flex gap-1 p-1 bg-gray-50 rounded-lg", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange?.(tab.key)}
          className={cn(
            "rounded-md font-medium transition-all",
            sizeStyles[size],
            activeKey === tab.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          )}
        >
          <span className="flex items-center gap-2">
            {tab.icon}
            {tab.title}
          </span>
        </button>
      ))}
    </nav>
  );
}

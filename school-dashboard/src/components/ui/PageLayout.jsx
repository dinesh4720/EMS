/**
 * PageLayout - Minimal page layout component
 * Provides consistent structure with optional tabs and header
 */
import { cn } from "../../utils/cn";

export default function PageLayout({
  children,
  className,
  tabs,
  activeTab,
  onTabChange,
  header,
  actions,
  noPadding = false,
}) {
  const hasTabs = tabs && tabs.length > 0;

  return (
    <div
      className={cn(
        "bg-surface border border-border-token rounded-lg h-full flex flex-col min-w-0 overflow-hidden",
        className
      )}
    >
      {/* Tabs */}
      {hasTabs && (
        <div className="px-4 sm:px-6 py-3 border-b border-border-token shrink-0 overflow-x-auto scrollbar-none">
          <nav className="flex gap-1 min-w-max" role="tablist" aria-label="Module navigation">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-current={activeTab === tab.key ? "page" : undefined}
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "px-3 sm:px-5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-fg text-bg"
                    : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                )}
              >
                {tab.title}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Header */}
      {header && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border-token shrink-0">
          <div>
            <h1 className="text-xl font-medium text-fg">{header.title}</h1>
            {header.description && (
              <p className="text-sm text-fg-muted mt-1">{header.description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div className={cn("flex-1 flex flex-col min-h-0 overflow-hidden", !noPadding && "p-6")}>
        {children}
      </div>
    </div>
  );
}

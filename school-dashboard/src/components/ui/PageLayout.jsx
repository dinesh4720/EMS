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
    <div className={cn("bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg h-full flex flex-col min-w-0 overflow-hidden", className)}>
      {/* Tabs */}
      {hasTabs && (
        <div className="px-6 py-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "px-5 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-zinc-100">{header.title}</h1>
            {header.description && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{header.description}</p>
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

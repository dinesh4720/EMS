import { memo } from "react";
import PropTypes from "prop-types";
import { Settings } from "lucide-react";
import { cn } from "../../utils/cn";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

function ChartCard({
  title,
  description,
  icon,
  actions,
  legend,
  height = 280,
  footer,
  isLoading = false,
  isEmpty = false,
  error = null,
  emptyTitle = "No data yet",
  emptyDescription,
  onRetry,
  onConfigure,
  children,
  className,
  bodyClassName,
  variant = "default",
  ...props
}) {
  const isWidget = variant === "widget";

  return (
    <section
      aria-busy={isLoading ? "true" : undefined}
      className={cn(
        "bg-surface border border-divider overflow-hidden",
        isWidget ? "rounded-[var(--r-lg)]" : "rounded-xl",
        className
      )}
      {...props}
    >
      {(title || description || icon || actions || onConfigure) && (
        <header
          className={cn(
            "flex items-start justify-between gap-3",
            isWidget ? "px-4 py-3.5 border-b border-divider" : "px-5 pt-5"
          )}
        >
          <div className="min-w-0 flex-1 flex items-center gap-2.5">
            {icon ? (
              <div className="w-8 h-8 rounded-[var(--r-lg)] grid place-items-center shrink-0 bg-surface-2 text-fg-muted">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {title ? (
                <h3 className="text-sm font-semibold text-fg truncate">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="text-xs text-fg-muted mt-0.5">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {(actions || onConfigure) ? (
            <div className="shrink-0 flex items-center gap-2">
              {actions}
              {onConfigure ? (
                <button
                  type="button"
                  onClick={onConfigure}
                  className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
                  aria-label="Configure widget"
                >
                  <Settings size={14} />
                </button>
              ) : null}
            </div>
          ) : null}
        </header>
      )}

      {legend ? (
        <div className="px-5 pt-3 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
          {legend}
        </div>
      ) : null}

      <div
        className={cn(
          isWidget ? "px-4 py-3.5" : "px-5 pt-4 pb-5",
          bodyClassName
        )}
        style={typeof height === "number" ? { minHeight: height } : undefined}
      >
        {error ? (
          <div className="flex h-full items-center justify-center">
            <ErrorState
              title="Could not load chart"
              description={typeof error === "string" ? error : error?.message}
              onRetry={onRetry}
            />
          </div>
        ) : isLoading ? (
          <Skeleton
            variant="rect"
            className="w-full"
            style={{ height: typeof height === "number" ? height - 16 : height }}
          />
        ) : isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="w-full" style={{ height }}>
            {children}
          </div>
        )}
      </div>

      {footer ? (
        <footer className="border-t border-divider bg-surface-2 px-5 py-3 text-xs text-fg-muted">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

ChartCard.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  icon: PropTypes.node,
  actions: PropTypes.node,
  legend: PropTypes.node,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  footer: PropTypes.node,
  isLoading: PropTypes.bool,
  isEmpty: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  onRetry: PropTypes.func,
  onConfigure: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  variant: PropTypes.oneOf(["default", "widget"]),
};

export default memo(ChartCard);

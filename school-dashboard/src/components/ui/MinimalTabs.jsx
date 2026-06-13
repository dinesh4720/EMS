/**
 * MinimalTabs - Clean tab navigation without gradients
 *
 * Implements the WAI-ARIA Tabs pattern:
 * - Container has role="tablist" with aria-label
 * - Each tab has role="tab", aria-selected, aria-controls, and id
 * - Tabs are keyboard-navigable (Arrow Left/Right, Home, End) with roving tabindex
 * - Consumers should give their panels role="tabpanel", aria-labelledby={`tab-${key}`}, id={`tabpanel-${key}`}
 */
import { memo, useCallback, useId, useRef } from "react";
import { cn } from "../../utils/cn";

const MinimalTabs = memo(function MinimalTabs({
  tabs,
  activeKey,
  onChange,
  size = "md",
  variant = "pills", // pills, underline, plain
  className,
  ariaLabel = "Tabs",
  baseId: baseIdProp,
}) {
  const generatedId = useId();
  const baseId = baseIdProp ?? generatedId;
  const tablistRef = useRef(null);

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const underlineSizeStyles = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-5 py-3.5 text-base",
  };

  const getTabId = (key) => `${baseId}-tab-${key}`;
  const getPanelId = (key) => `${baseId}-tabpanel-${key}`;

  const focusTabAt = useCallback((index) => {
    const tablist = tablistRef.current;
    if (!tablist) return;
    const buttons = tablist.querySelectorAll('[role="tab"]:not([disabled])');
    if (buttons.length === 0) return;
    const wrapped = (index + buttons.length) % buttons.length;
    buttons[wrapped]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event, index) => {
      const total = tabs.length;
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          focusTabAt(index + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusTabAt(index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusTabAt(0);
          break;
        case "End":
          event.preventDefault();
          focusTabAt(total - 1);
          break;
        default:
          break;
      }
    },
    [focusTabAt, tabs.length]
  );

  const isUnderline = variant === "underline";

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cn(
        isUnderline
          ? "flex gap-1 border-b border-divider"
          : "inline-flex gap-1 p-1 bg-surface-2 rounded-lg",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeKey === tab.key;
        const tabClass = isUnderline
          ? cn(
              "relative font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded",
              underlineSizeStyles[size],
              isActive
                ? "text-fg"
                : "text-fg-muted hover:text-fg"
            )
          : cn(
              "rounded-md font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
              sizeStyles[size],
              isActive
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-muted hover:text-fg hover:bg-surface-hover"
            );

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={getTabId(tab.key)}
            aria-selected={isActive}
            aria-controls={getPanelId(tab.key)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange?.(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={tabClass}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.title}
            </span>
            {isUnderline && isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-fg"
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

MinimalTabs.displayName = 'MinimalTabs';

export default MinimalTabs;

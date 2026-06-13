import { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

const TRIGGER_SIZE = {
  sm: "h-8 text-xs pl-3 pr-2",
  md: "h-10 text-sm pl-3 pr-2",
  lg: "h-12 text-base pl-4 pr-3",
};

function defaultFilter(option, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    option.label.toString().toLowerCase().includes(needle) ||
    option.value.toString().toLowerCase().includes(needle) ||
    (option.description && option.description.toLowerCase().includes(needle))
  );
}

function optionId(triggerId, value) {
  return `${triggerId}-option-${value}`;
}

/**
 * Combobox — searchable single-select dropdown.
 *
 * Options are `{ value, label, description?, disabled?, icon? }`. The trigger
 * shows the current selection, pressing it opens a popover with a search input
 * and the filtered list. Keyboard navigation: ArrowUp/Down, Home, End, Enter, Escape.
 */
export default function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results",
  label,
  size = "md",
  disabled = false,
  clearable = false,
  filter = defaultFilter,
  className,
  triggerClassName,
  contentClassName,
  id,
  "aria-label": ariaLabelProp,
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(
    () => options.filter((opt) => filter(opt, query)),
    [options, query, filter]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
      return;
    }
    // Focus search when the popover opens.
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || !filtered.length) return;
    const active = document.getElementById(optionId(triggerId, filtered[highlight]?.value));
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, open, filtered, triggerId]);

  const selected = options.find((opt) => opt.value === value);

  const commit = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length) {
        setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length) {
        setHighlight((prev) => Math.max(prev - 1, 0));
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      if (filtered.length) setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (filtered.length) setHighlight(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) commit(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const activeDescendant =
    open && filtered[highlight] ? optionId(triggerId, filtered[highlight].value) : undefined;

  const triggerLabel = selected ? selected.label : placeholder;
  const ariaLabel = ariaLabelProp || (typeof label === "string" ? label : undefined);

  return (
    <div className={cn("inline-block", className)}>
      {label && (
        <label
          htmlFor={triggerId}
          className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <Popover
        isOpen={open}
        onOpenChange={(next) => !disabled && setOpen(next)}
        placement="bottom-start"
        offset={6}
      >
        <PopoverTrigger>
          <button
            type="button"
            id={triggerId}
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeDescendant}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-2 w-full rounded-lg border",
              "border-[var(--color-border-strong)] bg-[var(--color-bg)]",
              "text-[var(--color-text-primary)] transition-colors",
              "hover:border-[var(--color-primary)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring,var(--color-primary))]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]",
              TRIGGER_SIZE[size],
              triggerClassName
            )}
          >
            {selected?.icon ? (
              <span className="flex-shrink-0 text-[var(--color-text-muted)]">{selected.icon}</span>
            ) : null}
            <span
              className={cn(
                "flex-1 text-left truncate",
                !selected && "text-[var(--color-text-muted)]"
              )}
            >
              {triggerLabel}
            </span>
            {clearable && selected ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(undefined);
                }}
                className="p-0.5 rounded hover:bg-[var(--color-bg-secondary)] flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring,var(--color-primary))]"
              >
                <X size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
              </button>
            ) : null}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="text-[var(--color-text-muted)] flex-shrink-0"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 border border-[var(--color-border-strong)] bg-[var(--color-bg)] rounded-lg shadow-lg w-[min(320px,calc(100vw-2rem))]",
            contentClassName
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border-strong)]">
            <Search size={14} aria-hidden="true" className="text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              aria-label={searchPlaceholder}
              autoComplete="off"
            />
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="max-h-64 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li
                role="presentation"
                className="px-3 py-6 text-center text-xs text-[var(--color-text-muted)]"
              >
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isActive = idx === highlight;
                return (
                  <li
                    key={opt.value}
                    id={optionId(triggerId, opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(opt);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                      "text-[var(--color-text-primary)]",
                      isActive && "bg-[var(--color-bg-secondary)]",
                      opt.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {opt.icon ? (
                      <span className="flex-shrink-0 text-[var(--color-text-muted)]">
                        {opt.icon}
                      </span>
                    ) : null}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description ? (
                        <span className="block text-xs text-[var(--color-text-muted)] truncate">
                          {opt.description}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check
                        size={14}
                        className="text-[var(--color-primary)] flex-shrink-0"
                        aria-hidden="true"
                      />
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

Combobox.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      description: PropTypes.string,
      disabled: PropTypes.bool,
      icon: PropTypes.node,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  emptyMessage: PropTypes.string,
  label: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  clearable: PropTypes.bool,
  filter: PropTypes.func,
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  id: PropTypes.string,
  "aria-label": PropTypes.string,
};

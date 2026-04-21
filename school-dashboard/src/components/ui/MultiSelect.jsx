import { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

const TRIGGER_SIZE = {
  sm: "min-h-8 text-xs py-0.5 pl-2 pr-1.5",
  md: "min-h-10 text-sm py-1 pl-2 pr-2",
  lg: "min-h-12 text-base py-1.5 pl-3 pr-3",
};

function defaultFilter(option, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    option.label.toString().toLowerCase().includes(needle) ||
    option.value.toString().toLowerCase().includes(needle)
  );
}

/**
 * MultiSelect — multi-select dropdown that shows chosen values as inline chips.
 *
 * Controlled via `value` (array) and `onChange(nextArray)`. Options of the
 * shape `{ value, label, disabled? }`. Supports search, max-selections cap,
 * and clear-all. Keyboard: ArrowUp/Down, Enter, Backspace to remove last chip.
 */
export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results",
  label,
  size = "md",
  disabled = false,
  maxSelections,
  maxVisibleChips = 3,
  filter = defaultFilter,
  className,
  triggerClassName,
  contentClassName,
  id,
  "aria-label": ariaLabelProp,
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedSet.has(opt.value)),
    [options, selectedSet]
  );

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
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const toggle = (opt) => {
    if (opt.disabled) return;
    if (selectedSet.has(opt.value)) {
      onChange?.(value.filter((val) => val !== opt.value));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange?.([...value, opt.value]);
    }
  };

  const removeValue = (val) => onChange?.(value.filter((existing) => existing !== val));
  const clearAll = () => onChange?.([]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) toggle(opt);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      e.preventDefault();
      removeValue(value[value.length - 1]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const visibleChips = selectedOptions.slice(0, maxVisibleChips);
  const overflow = selectedOptions.length - visibleChips.length;
  const ariaLabel = ariaLabelProp || (typeof label === "string" ? label : undefined);

  return (
    <div className={cn("inline-block w-full", className)}>
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
            aria-haspopup="listbox"
            aria-label={ariaLabel}
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 w-full rounded-lg border",
              "border-[var(--color-border-strong)] bg-[var(--color-bg)]",
              "text-[var(--color-text-primary)] transition-colors",
              "hover:border-[var(--color-primary)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]",
              TRIGGER_SIZE[size],
              triggerClassName
            )}
          >
            <span className="flex flex-wrap gap-1 flex-1 min-w-0 items-center">
              {selectedOptions.length === 0 && (
                <span className="text-[var(--color-text-muted)] truncate">{placeholder}</span>
              )}
              {visibleChips.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-xs px-1.5 py-0.5 max-w-[160px]"
                >
                  <span className="truncate">{opt.label}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${opt.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(opt.value);
                    }}
                    className="hover:text-[var(--color-error)] cursor-pointer"
                  >
                    <X size={12} aria-hidden="true" />
                  </span>
                </span>
              ))}
              {overflow > 0 && (
                <span className="inline-flex items-center rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs px-1.5 py-0.5">
                  +{overflow}
                </span>
              )}
            </span>
            {selectedOptions.length > 0 && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear all"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="p-0.5 rounded hover:bg-[var(--color-bg-secondary)] flex-shrink-0"
              >
                <X size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
              </span>
            )}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="text-[var(--color-text-muted)] flex-shrink-0"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 border border-[var(--color-border-strong)] bg-[var(--color-bg)] rounded-lg shadow-lg w-[min(340px,calc(100vw-2rem))]",
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
            role="listbox"
            aria-multiselectable="true"
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
                const isSelected = selectedSet.has(opt.value);
                const isActive = idx === highlight;
                const capped =
                  !isSelected && maxSelections && value.length >= maxSelections;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || capped || undefined}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (capped) return;
                      toggle(opt);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                      "text-[var(--color-text-primary)]",
                      isActive && "bg-[var(--color-bg-secondary)]",
                      (opt.disabled || capped) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex items-center justify-center h-4 w-4 rounded border flex-shrink-0",
                        isSelected
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                          : "border-[var(--color-border-strong)] bg-[var(--color-bg)]"
                      )}
                    >
                      {isSelected ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                    <span className="flex-1 truncate">{opt.label}</span>
                  </li>
                );
              })
            )}
          </ul>
          {(selectedOptions.length > 0 || maxSelections) && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[var(--color-border-strong)] text-xs text-[var(--color-text-muted)]">
              <span>
                {selectedOptions.length} selected
                {maxSelections ? ` / ${maxSelections}` : ""}
              </span>
              {selectedOptions.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

MultiSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  emptyMessage: PropTypes.string,
  label: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  maxSelections: PropTypes.number,
  maxVisibleChips: PropTypes.number,
  filter: PropTypes.func,
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  id: PropTypes.string,
  "aria-label": PropTypes.string,
};

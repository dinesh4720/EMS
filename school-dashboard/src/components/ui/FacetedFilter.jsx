import { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Check, PlusCircle, Search } from "lucide-react";
import { cn } from "../../utils/cn";

const TRIGGER_SIZE = {
  sm: "h-8 text-xs px-2.5",
  md: "h-9 text-sm px-3",
  lg: "h-10 text-base px-3.5",
};

function defaultFilter(option, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return option.label.toString().toLowerCase().includes(needle);
}

/**
 * FacetedFilter — compact multi-select filter used above data tables.
 *
 * Modelled after the shadcn/radix faceted filter. The trigger looks like a
 * dashed "Add filter" button; once values are chosen it shows the title, a
 * count badge, and the first few selected chips inline. Options accept an
 * optional `count` for display next to each row.
 */
export default function FacetedFilter({
  title,
  options = [],
  value = [],
  onChange,
  searchable = true,
  searchPlaceholder,
  emptyMessage = "No results",
  size = "md",
  filter = defaultFilter,
  className,
  contentClassName,
  id,
  icon,
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  const selectedSet = useMemo(() => new Set(value), [value]);
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
    if (searchable) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, searchable]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const toggle = (opt) => {
    if (opt.disabled) return;
    if (selectedSet.has(opt.value)) {
      onChange?.(value.filter((val) => val !== opt.value));
    } else {
      onChange?.([...value, opt.value]);
    }
  };
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
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const selectedOptions = options.filter((opt) => selectedSet.has(opt.value));

  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      offset={6}
    >
      <PopoverTrigger>
        <button
          type="button"
          id={triggerId}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-dashed",
            "border-[var(--color-border-strong)] bg-[var(--color-bg)]",
            "text-[var(--color-text-primary)] transition-colors",
            "hover:border-[var(--color-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
            TRIGGER_SIZE[size],
            className
          )}
        >
          {icon || (
            <PlusCircle
              size={14}
              aria-hidden="true"
              className="text-[var(--color-text-muted)] flex-shrink-0"
            />
          )}
          <span className="font-medium">{title}</span>
          {selectedOptions.length > 0 && (
            <>
              <span
                aria-hidden="true"
                className="mx-0.5 h-4 w-px bg-[var(--color-border-strong)]"
              />
              <span
                className="inline-flex items-center justify-center rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-[11px] font-medium px-1.5 h-5"
                aria-label={`${selectedOptions.length} selected`}
              >
                {selectedOptions.length}
              </span>
              <span className="hidden md:flex items-center gap-1">
                {selectedOptions.length > 2 ? (
                  <span className="inline-flex items-center rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-[11px] px-1.5 h-5">
                    {selectedOptions.length} selected
                  </span>
                ) : (
                  selectedOptions.map((opt) => (
                    <span
                      key={opt.value}
                      className="inline-flex items-center rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-[11px] px-1.5 h-5 max-w-[120px]"
                    >
                      <span className="truncate">{opt.label}</span>
                    </span>
                  ))
                )}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 border border-[var(--color-border-strong)] bg-[var(--color-bg)] rounded-lg shadow-lg w-[min(260px,calc(100vw-2rem))]",
          contentClassName
        )}
      >
        {searchable && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border-strong)]">
            <Search size={14} aria-hidden="true" className="text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              type="search"
              placeholder={searchPlaceholder || `Search ${title?.toLowerCase() || ""}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              aria-label={searchPlaceholder || `Search ${title || ""}`}
              autoComplete="off"
            />
          </div>
        )}
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-label={title}
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
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(opt);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer",
                    "text-[var(--color-text-primary)]",
                    isActive && "bg-[var(--color-bg-secondary)]",
                    opt.disabled && "opacity-50 cursor-not-allowed"
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
                  {opt.icon ? (
                    <span className="flex-shrink-0 text-[var(--color-text-muted)]">{opt.icon}</span>
                  ) : null}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                      {opt.count}
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
        {selectedOptions.length > 0 && (
          <div className="border-t border-[var(--color-border-strong)]">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll();
              }}
              className="w-full text-center text-xs py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary)]"
            >
              Clear filters
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

FacetedFilter.propTypes = {
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      count: PropTypes.number,
      icon: PropTypes.node,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  emptyMessage: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  filter: PropTypes.func,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  id: PropTypes.string,
  icon: PropTypes.node,
};

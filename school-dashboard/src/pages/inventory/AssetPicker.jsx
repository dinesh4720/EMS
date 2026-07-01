import { useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { inventoryApi } from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";
import logger from "../../utils/logger";
import { cn } from "../../utils/cn";

// Bounded page size — we never pull the whole asset collection into the
// selector. The server search narrows results as the user types.
const PAGE_LIMIT = 20;

const TRIGGER_SIZE = {
  sm: "h-8 text-xs pl-3 pr-2",
  md: "h-10 text-sm pl-3 pr-2",
  lg: "h-12 text-base pl-4 pr-3",
};

const assetLabel = (a) => {
  if (!a) return "";
  return a.assetTag ? `${a.name} (${a.assetTag})` : a.name || "";
};

function optionId(triggerId, value) {
  return `${triggerId}-option-${value}`;
}

/**
 * AssetPicker — searchable, server-paginated single-select for inventory assets.
 *
 * A plain <Select> pre-loaded with the full asset collection does not scale
 * (thousands of assets per school) and, when capped, silently drops assets past
 * the cap so they become unselectable (SCH-207). This component instead fetches
 * a bounded page of matches from the server as the user types. When more matches
 * exist than are shown it surfaces a "showing first N of M — refine your search"
 * hint, so nothing is ever silently omitted.
 *
 * `selectedAsset` (a populated `{ _id, name, assetTag }`) lets the trigger show
 * the current selection's label without a round-trip — handy when editing an
 * existing record. When absent, the label is resolved via a single-asset fetch.
 */
export default function AssetPicker({
  value,
  onChange,
  selectedAsset,
  label,
  placeholder = "Select asset…",
  searchPlaceholder = "Search assets by name or tag…",
  isRequired = false,
  isInvalid = false,
  errorMessage,
  size = "md",
  className,
  triggerClassName,
  id,
  "aria-label": ariaLabelProp,
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // Cache of id -> display label so the trigger can render the current
  // selection even when it isn't in the latest search results.
  const [labelById, setLabelById] = useState(() =>
    selectedAsset?._id ? { [selectedAsset._id]: assetLabel(selectedAsset) } : {}
  );

  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  // Resolve the label for the current value when we don't already know it
  // (e.g. editing a record whose asset isn't in the fetched page). Prefer the
  // populated `selectedAsset`; otherwise fetch just that one asset.
  useEffect(() => {
    if (!value || labelById[value]) return;
    if (selectedAsset?._id === value) {
      setLabelById((prev) => ({ ...prev, [value]: assetLabel(selectedAsset) }));
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const asset = await inventoryApi.getAsset(value);
        if (!ignore && asset?._id) {
          setLabelById((prev) => ({ ...prev, [asset._id]: assetLabel(asset) }));
        }
      } catch (err) {
        if (!ignore) logger.error("AssetPicker: failed to resolve selected asset label", err);
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedAsset]);

  // Fetch a bounded page of matches whenever the picker is open and the query
  // settles. The prior in-flight request is aborted so a slow earlier response
  // can't overwrite results for the latest query.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const res = await inventoryApi.getAssets(
          { search: debouncedQuery, limit: PAGE_LIMIT },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const data = res?.data || (Array.isArray(res) ? res : []);
        setItems(data);
        setTotal(res?.total ?? data.length);
        setHighlight(0);
        setLabelById((prev) => {
          const next = { ...prev };
          data.forEach((a) => { next[a._id] = assetLabel(a); });
          return next;
        });
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        logger.error("AssetPicker: failed to load assets", err);
        setLoadError(true);
        setItems([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [open, debouncedQuery]);

  // Reset transient state on close; focus the search box on open.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open || !items.length) return;
    const active = document.getElementById(optionId(triggerId, items[highlight]?._id));
    active?.scrollIntoView?.({ block: "nearest" });
  }, [highlight, open, items, triggerId]);

  const commit = (asset) => {
    if (!asset) return;
    setLabelById((prev) => ({ ...prev, [asset._id]: assetLabel(asset) }));
    onChange?.(asset._id);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length) setHighlight((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length) setHighlight((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      if (items.length) setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (items.length) setHighlight(items.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const asset = items[highlight];
      if (asset) commit(asset);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const ariaLabel = ariaLabelProp || (typeof label === "string" ? label : undefined);
  const triggerLabel = value ? labelById[value] || placeholder : placeholder;
  const hasSelection = Boolean(value && labelById[value]);
  const activeDescendant = open && items[highlight] ? optionId(triggerId, items[highlight]._id) : undefined;
  const overflow = total > items.length;

  return (
    <div className={cn("inline-block w-full", className)}>
      {label && (
        <label
          htmlFor={triggerId}
          className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          {label}
          {isRequired && <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-start" offset={6}>
        <PopoverTrigger>
          <button
            type="button"
            id={triggerId}
            role="combobox"
            aria-label={ariaLabel}
            aria-required={isRequired || undefined}
            aria-invalid={isInvalid || undefined}
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeDescendant}
            className={cn(
              "inline-flex items-center gap-2 w-full rounded-lg border bg-[var(--color-bg)]",
              "text-[var(--color-text-primary)] transition-colors",
              "hover:border-[var(--color-primary)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring,var(--color-primary))]",
              isInvalid
                ? "border-[var(--color-error)]"
                : "border-[var(--color-border-strong)]",
              TRIGGER_SIZE[size],
              triggerClassName
            )}
          >
            <span
              className={cn(
                "flex-1 text-left truncate",
                !hasSelection && "text-[var(--color-text-muted)]"
              )}
            >
              {triggerLabel}
            </span>
            {hasSelection ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.("");
                }}
                className="p-0.5 rounded hover:bg-[var(--color-bg-secondary)] flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring,var(--color-primary))]"
              >
                <X size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
              </button>
            ) : null}
            <ChevronDown size={16} aria-hidden="true" className="text-[var(--color-text-muted)] flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 border border-[var(--color-border-strong)] bg-[var(--color-bg)] rounded-lg shadow-lg w-[min(360px,calc(100vw-2rem))]">
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
              aria-controls={listboxId}
              autoComplete="off"
            />
          </div>
          <ul id={listboxId} role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto py-1">
            {loading ? (
              <li role="presentation" className="px-3 py-6 text-center text-xs text-[var(--color-text-muted)]">
                Loading…
              </li>
            ) : loadError ? (
              <li role="presentation" className="px-3 py-6 text-center text-xs text-[var(--color-error)]">
                Failed to load assets. Try again.
              </li>
            ) : items.length === 0 ? (
              <li role="presentation" className="px-3 py-6 text-center text-xs text-[var(--color-text-muted)]">
                {debouncedQuery ? "No assets match your search" : "No assets found"}
              </li>
            ) : (
              items.map((asset, idx) => {
                const isSelected = asset._id === value;
                const isActive = idx === highlight;
                return (
                  <li
                    key={asset._id}
                    id={optionId(triggerId, asset._id)}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(asset);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-[var(--color-text-primary)]",
                      isActive && "bg-[var(--color-bg-secondary)]"
                    )}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{asset.name}</span>
                      {asset.assetTag ? (
                        <span className="block text-xs text-[var(--color-text-muted)] truncate">{asset.assetTag}</span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check size={14} className="text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
          {!loading && !loadError && overflow ? (
            <div className="px-3 py-2 border-t border-[var(--color-border-strong)] text-xs text-[var(--color-text-muted)]">
              Showing first {items.length} of {total} — refine your search to find more.
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      {isInvalid && errorMessage ? (
        <p className="text-xs text-[var(--color-error)] mt-1">{errorMessage}</p>
      ) : null}
    </div>
  );
}

AssetPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  selectedAsset: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    assetTag: PropTypes.string,
  }),
  label: PropTypes.node,
  placeholder: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  isRequired: PropTypes.bool,
  isInvalid: PropTypes.bool,
  errorMessage: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  id: PropTypes.string,
  "aria-label": PropTypes.string,
};

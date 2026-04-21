import { forwardRef, useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZE_STYLES = {
  sm: "h-8 text-xs px-2.5",
  md: "h-10 text-sm px-3",
  lg: "h-12 text-base px-3.5",
};

/**
 * SearchBar — design-system search input used above lists and tables.
 *
 * Controlled via `value` / `onChange`. Supports optional debouncing through
 * `onDebouncedChange`, a loading spinner, a clear button, and a `/` keyboard
 * shortcut that focuses the input.
 */
const SearchBar = forwardRef(function SearchBar(
  {
    value,
    onChange,
    onDebouncedChange,
    debounceMs = 250,
    placeholder = "Search…",
    name,
    size = "md",
    isLoading = false,
    disabled = false,
    shortcut,
    ariaLabel,
    className,
    wrapperClassName,
    id,
    onKeyDown,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const internalRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const setRef = (node) => {
    internalRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    if (!onDebouncedChange) return undefined;
    const t = setTimeout(() => onDebouncedChange(value ?? ""), debounceMs);
    return () => clearTimeout(t);
  }, [value, debounceMs, onDebouncedChange]);

  useEffect(() => {
    if (!shortcut) return undefined;
    const handler = (e) => {
      if (e.key !== shortcut) return;
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      e.preventDefault();
      internalRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcut]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && value) {
      e.preventDefault();
      onChange("");
    }
    onKeyDown?.(e);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 w-full rounded-lg border bg-[var(--color-bg)]",
        "border-[var(--color-border-strong)] transition-colors",
        focused && "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20",
        disabled && "opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]",
        SIZE_STYLES[size],
        wrapperClassName
      )}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)] animate-spin flex-shrink-0"
        />
      ) : (
        <Search
          size={size === "sm" ? 14 : 16}
          aria-hidden="true"
          className="text-[var(--color-text-muted)] flex-shrink-0"
        />
      )}
      <input
        ref={setRef}
        id={inputId}
        type="search"
        name={name}
        role="searchbox"
        aria-label={ariaLabel || placeholder}
        placeholder={placeholder}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        data-form-type="other"
        className={cn(
          "flex-1 bg-transparent outline-none w-full",
          "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
          "disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            internalRef.current?.focus();
          }}
          className="p-0.5 rounded hover:bg-[var(--color-bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] flex-shrink-0"
        >
          <X size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
        </button>
      ) : shortcut ? (
        <kbd
          aria-hidden="true"
          className="hidden sm:inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] text-[10px] font-medium text-[var(--color-text-muted)] flex-shrink-0"
        >
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
});

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onDebouncedChange: PropTypes.func,
  debounceMs: PropTypes.number,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  shortcut: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
  onKeyDown: PropTypes.func,
};

export default SearchBar;

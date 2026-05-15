import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

/**
 * InlineEdit — click-to-edit cell for tables.
 *
 * Enter / blur commits, Esc reverts, Tab moves to next cell (native).
 * Optimistic update flow: onSave may be async; on rejection the draft is
 * reverted to the last known value and the cell shows an error ring.
 */
const InlineEdit = ({
  value,
  onSave,
  type = "text",
  numeric = false,
  min,
  max,
  step,
  placeholder,
  className,
  inputClassName,
  display,
  validate,
  parse,
  format,
  ariaLabel,
  disabled = false,
  selectOnFocus = true,
  onPasteMulti,
  width,
}) => {
  const formatValue = useCallback(
    (val) => (format ? format(val) : val == null ? "" : String(val)),
    [format],
  );

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => formatValue(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const committedRef = useRef(false);

  useEffect(() => {
    if (!editing) {
      setDraft(formatValue(value));
      setError(null);
    }
  }, [value, editing, formatValue]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (selectOnFocus) {
        try {
          inputRef.current.select?.();
        } catch {
          /* ignore */
        }
      }
    }
  }, [editing, selectOnFocus]);

  const startEditing = () => {
    if (disabled) return;
    committedRef.current = false;
    setDraft(formatValue(value));
    setError(null);
    setEditing(true);
  };

  const cancel = useCallback(() => {
    committedRef.current = true;
    setDraft(formatValue(value));
    setError(null);
    setEditing(false);
  }, [value, formatValue]);

  const commit = useCallback(async () => {
    if (committedRef.current) return;
    committedRef.current = true;

    const raw = draft;
    const parsed = parse ? parse(raw) : numeric ? Number(raw) : raw;
    const validationError = validate ? validate(parsed) : null;

    if (validationError) {
      setError(validationError);
      committedRef.current = false;
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    const prevFormatted = formatValue(value);
    if (String(raw) === String(prevFormatted)) {
      setEditing(false);
      return;
    }

    if (!onSave) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(parsed);
      setError(null);
      setEditing(false);
    } catch (e) {
      setDraft(prevFormatted);
      setError(e?.message || "Save failed");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, parse, numeric, validate, value, formatValue, onSave]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData("text");
    if (!text) return;
    if (/[\t\r\n]/.test(text)) {
      e.preventDefault();
      if (onPasteMulti) {
        const rows = text
          .split(/[\r\n]+/)
          .filter((row) => row.length > 0)
          .map((row) => row.split("\t"));
        onPasteMulti(rows);
        // Drop edit mode — parent will handle propagation to neighbouring cells.
        committedRef.current = true;
        setEditing(false);
      } else {
        const cleaned = text.split(/[\t\r\n]+/)[0];
        setDraft(cleaned);
      }
    }
  };

  const numericClass = numeric ? "font-mono tabular-nums" : "";

  if (!editing) {
    const displayContent = display
      ? display(value)
      : value == null || value === ""
        ? placeholder || "—"
        : String(value);

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={startEditing}
        onFocus={(e) => {
          // Allow keyboard users to enter edit mode from a focused button.
          if (e.relatedTarget && !disabled) startEditing();
        }}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex min-h-7 items-center rounded-md border border-transparent px-2 py-1 text-left",
          "transition-colors hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-secondary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40",
          "text-[color:var(--color-text-primary)]",
          error && "border-[color:var(--color-error)]",
          disabled && "cursor-not-allowed opacity-60",
          numericClass,
          className,
        )}
        style={width ? { width } : undefined}
        title={error || undefined}
      >
        {displayContent}
      </button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border bg-[color:var(--color-bg)] px-2 py-1",
        "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/30",
        error && "border-[color:var(--color-error)] ring-[color:var(--color-error)]/30",
        className,
      )}
      style={width ? { width } : undefined}
    >
      <input
        ref={inputRef}
        type={type}
        value={draft}
        min={min}
        max={max}
        step={step}
        disabled={saving}
        aria-label={ariaLabel}
        aria-invalid={error ? "true" : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-[color:var(--color-text-primary)] outline-none",
          "placeholder:text-[color:var(--color-text-muted)]",
          numericClass,
          inputClassName,
        )}
      />
    </span>
  );
};

InlineEdit.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSave: PropTypes.func,
  type: PropTypes.string,
  numeric: PropTypes.bool,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  display: PropTypes.func,
  validate: PropTypes.func,
  parse: PropTypes.func,
  format: PropTypes.func,
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  selectOnFocus: PropTypes.bool,
  onPasteMulti: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default InlineEdit;

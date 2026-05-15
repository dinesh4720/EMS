import { useEffect, useRef, useState, forwardRef } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

/**
 * ToolbarSearch — REVAMP-100 canonical search primitive for list toolbars.
 *
 * Behaviors (matches StaffList reference pattern):
 *   - `/` focuses input globally (unless another input/textarea has focus)
 *   - 200ms debounce on `onChange` (configurable via `debounce`)
 *   - Esc clears + blurs
 *   - `.toolbar__search` markup with kbd `/` hint and X clear button
 *   - Optional `urlParam` syncs the committed value to `?<urlParam>=` (replace history)
 *   - `isLoading` swaps the icon for a spinner
 *
 * Controlled value: parent owns `value` and `onChange` (called with the
 * debounced committed value). Internal `draft` reflects the user's typing
 * instantly; once it settles, `onChange` fires and the URL is updated.
 */
const ToolbarSearch = forwardRef(function ToolbarSearch(
  {
    value = "",
    onChange,
    placeholder = "Search…",
    ariaLabel = "Search",
    debounce = 200,
    urlParam,
    isLoading = false,
    className = "",
    style,
    name,
    onEnter,
  },
  externalRef
) {
  const localRef = useRef(null);
  const inputRef = externalRef || localRef;

  // useSearchParams is always called (consistent hook order). The URL is
  // only read/written when `urlParam` is set.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValue = urlParam ? searchParams.get(urlParam) || "" : null;

  // Bootstrap from URL on first render when urlParam is set; otherwise from
  // the controlled `value`. After that, the parent's `value` is the source
  // of truth for the committed search string.
  const [draft, setDraft] = useState(() => (urlParam ? urlValue || "" : value || ""));

  // External value → draft sync (covers parent-initiated resets, e.g. route
  // change, programmatic clear). Skip when the values already match to avoid
  // clobbering in-flight typing.
  useEffect(() => {
    if (urlParam) return;
    setDraft((prev) => (prev === (value || "") ? prev : value || ""));
  }, [value, urlParam]);

  useEffect(() => {
    if (!urlParam) return;
    setDraft((prev) => (prev === (urlValue || "") ? prev : urlValue || ""));
  }, [urlValue, urlParam]);

  // Debounced commit: draft → onChange + optional URL sync.
  useEffect(() => {
    const committed = urlParam ? urlValue || "" : value || "";
    if (draft === committed) return;
    const t = setTimeout(() => {
      onChange?.(draft);
      if (urlParam) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (draft) next.set(urlParam, draft);
            else next.delete(urlParam);
            return next;
          },
          { replace: true }
        );
      }
    }, debounce);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Global "/" hotkey — focus the input when nothing else is taking input.
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "/") return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (active?.isContentEditable) return;
      // Skip if a modal/dialog is open (focus belongs there).
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputRef]);

  const clearAndBlur = () => {
    setDraft("");
    inputRef.current?.blur?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      clearAndBlur();
    } else if (e.key === "Enter") {
      onEnter?.(draft);
    }
  };

  return (
    <label
      className={`toolbar__search${className ? " " + className : ""}`}
      style={style}
    >
      {isLoading ? (
        <span
          aria-hidden
          style={{
            width: 13,
            height: 13,
            flexShrink: 0,
            border: "1.5px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 600ms linear infinite",
          }}
        />
      ) : (
        <Search
          size={13}
          style={{ color: "var(--fg-subtle)", flexShrink: 0 }}
          aria-hidden
        />
      )}
      <input
        ref={inputRef}
        type="search"
        name={name}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        autoComplete="off"
        data-form-type="other"
      />
      {draft ? (
        <button
          type="button"
          onClick={clearAndBlur}
          aria-label="Clear search"
          className="iconbtn"
          style={{ width: 18, height: 18 }}
        >
          <X size={12} aria-hidden />
        </button>
      ) : (
        <span className="kbd" aria-hidden>
          /
        </span>
      )}
    </label>
  );
});

export default ToolbarSearch;

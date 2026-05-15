import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * useBulkSelection — canonical multi-select state for any list/table.
 *
 * Acceptance contract (REVAMP-101):
 *  - selection chip appears on first selection with count (caller renders <BulkActionBar/>)
 *  - X clears selection / Esc clears selection
 *  - "Select all" selects only currently-visible rows
 *  - "Select all matching N records" mode for filtered views
 *  - shift-click range selection within the visible ordering
 *  - selection survives pagination by keying on stable ids (caller passes visibleIds
 *    for the current page; selection Set is preserved across pages)
 *
 * Usage:
 *   const sel = useBulkSelection({ visibleIds, totalMatching });
 *   <Row onClick={(e) => sel.toggle(row.id, e)} isChecked={sel.isSelected(row.id)} />
 *   <BulkActionBar selection={sel}>…actions…</BulkActionBar>
 */
export default function useBulkSelection({
  visibleIds = [],
  totalMatching,
  initialSelected,
} = {}) {
  const [selected, setSelected] = useState(
    () => new Set(initialSelected ? Array.from(initialSelected).map(String) : [])
  );
  // "select all matching" sticky mode — when true the user opted into operating
  // on every record in the current filter, not just the visible page.
  const [allMatchingMode, setAllMatchingMode] = useState(false);
  const lastClickedRef = useRef(null);

  const visibleKeys = useMemo(
    () => visibleIds.map((id) => String(id)),
    [visibleIds]
  );

  const isSelected = useCallback(
    (id) => allMatchingMode || selected.has(String(id)),
    [allMatchingMode, selected]
  );

  const clear = useCallback(() => {
    setSelected(new Set());
    setAllMatchingMode(false);
    lastClickedRef.current = null;
  }, []);

  const toggle = useCallback(
    (id, event) => {
      const key = String(id);
      // Cancel sticky "all matching" mode the moment the user diverges.
      if (allMatchingMode) setAllMatchingMode(false);

      // Shift-click range selection within the visible ordering.
      if (event?.shiftKey && lastClickedRef.current && visibleKeys.length) {
        const a = visibleKeys.indexOf(lastClickedRef.current);
        const b = visibleKeys.indexOf(key);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          const range = visibleKeys.slice(lo, hi + 1);
          setSelected((prev) => {
            const next = new Set(prev);
            // Anchor's state determines whether range turns on or off.
            const turningOn = !prev.has(lastClickedRef.current) ? false : true;
            // Convention: shift-click extends the selection (turn ON).
            // (Most enterprise UIs do this — Linear, Notion, Gmail.)
            void turningOn;
            range.forEach((k) => next.add(k));
            return next;
          });
          lastClickedRef.current = key;
          return;
        }
      }

      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      lastClickedRef.current = key;
    },
    [allMatchingMode, visibleKeys]
  );

  // "Select all" — only visible rows, per spec.
  const selectAllVisible = useCallback(() => {
    if (allMatchingMode) setAllMatchingMode(false);
    setSelected((prev) => {
      const next = new Set(prev);
      visibleKeys.forEach((k) => next.add(k));
      return next;
    });
  }, [allMatchingMode, visibleKeys]);

  const deselectAllVisible = useCallback(() => {
    if (allMatchingMode) {
      setAllMatchingMode(false);
      setSelected(new Set());
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      visibleKeys.forEach((k) => next.delete(k));
      return next;
    });
  }, [allMatchingMode, visibleKeys]);

  // Header checkbox state for the visible page.
  const allVisibleSelected =
    visibleKeys.length > 0 &&
    (allMatchingMode || visibleKeys.every((k) => selected.has(k)));
  const someVisibleSelected =
    !allVisibleSelected &&
    (allMatchingMode || visibleKeys.some((k) => selected.has(k)));

  const toggleAllVisible = useCallback(() => {
    if (allVisibleSelected) deselectAllVisible();
    else selectAllVisible();
  }, [allVisibleSelected, deselectAllVisible, selectAllVisible]);

  const selectAllMatching = useCallback(() => {
    setAllMatchingMode(true);
  }, []);

  // Effective count for the chip. In "all matching" mode we trust the caller's
  // totalMatching (which already reflects the active filter set).
  const count = allMatchingMode
    ? typeof totalMatching === "number"
      ? totalMatching
      : visibleKeys.length
    : selected.size;

  // Esc-clear: global handler so any list using this hook gets the contract.
  useEffect(() => {
    if (count === 0) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement;
      const tag = el?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        el?.isContentEditable === true;
      if (typing) return;
      clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, clear]);

  // Stable array form for consumers building API payloads. In "all matching"
  // mode this is null — caller should send a filter descriptor instead.
  const selectedIds = useMemo(
    () => (allMatchingMode ? null : Array.from(selected)),
    [allMatchingMode, selected]
  );

  return {
    // state
    count,
    selectedIds,
    allMatchingMode,
    allVisibleSelected,
    someVisibleSelected,
    // predicates
    isSelected,
    // mutators
    toggle,
    toggleAllVisible,
    selectAllVisible,
    deselectAllVisible,
    selectAllMatching,
    clear,
    // metadata
    totalMatching,
    visibleCount: visibleKeys.length,
  };
}

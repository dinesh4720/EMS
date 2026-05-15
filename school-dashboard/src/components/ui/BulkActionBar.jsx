import { X } from "lucide-react";
import CoachMarks from "./CoachMark";

const BULK_COACH_MARKS = [
  {
    target: '[data-coach="bulk-action-bar"]',
    title: 'Bulk actions',
    body: 'Use this bar to act on every selected row at once. Press Esc or × to clear the selection.',
    placement: 'top',
  },
];

/**
 * BulkActionBar — the canonical selection chip + bulk action surface.
 *
 * Pair with `useBulkSelection`. The bar renders nothing when nothing is
 * selected so it can sit unconditionally inside a toolbar.
 *
 * Layout: [count selected] [optional "Select all matching N"] [actions slot] [X]
 *
 *   <BulkActionBar selection={sel} totalMatching={visible.length}>
 *     <button className="btn btn--sm" onClick={...}>Mark present</button>
 *   </BulkActionBar>
 */
export default function BulkActionBar({
  selection,
  totalMatching,
  noun = "selected",
  children,
  className = "",
  style,
}) {
  if (!selection || selection.count === 0) return null;

  const showAllMatchingCta =
    typeof totalMatching === "number" &&
    totalMatching > selection.visibleCount &&
    !selection.allMatchingMode &&
    selection.someVisibleSelected !== true && // only when whole visible page is selected
    selection.allVisibleSelected;

  return (
    <div
      data-coach="bulk-action-bar"
      className={`chip chip--accent bulk-action-bar ${className}`.trim()}
      role="region"
      aria-label="Bulk actions"
      style={{ height: 22, paddingRight: 2, gap: 6, ...style }}
    >
      <span className="mono tnum">{selection.count}</span>
      <span>{noun}</span>

      {showAllMatchingCta && (
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          style={{ height: 18, padding: "0 6px", fontSize: 11 }}
          onClick={selection.selectAllMatching}
        >
          Select all <span className="mono tnum">{totalMatching}</span> matching
        </button>
      )}

      {selection.allMatchingMode && (
        <span className="subtle" style={{ fontSize: 11 }}>
          (all matching)
        </span>
      )}

      {children ? (
        <div className="bulk-action-bar__actions row gap-2" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {children}
        </div>
      ) : null}

      <button
        type="button"
        onClick={selection.clear}
        aria-label="Clear selection (Esc)"
        className="iconbtn"
        style={{ width: 18, height: 18, color: "var(--accent)" }}
      >
        <X size={12} aria-hidden />
      </button>
      <CoachMarks surface="bulk-actions" autoStart marks={BULK_COACH_MARKS} />
    </div>
  );
}

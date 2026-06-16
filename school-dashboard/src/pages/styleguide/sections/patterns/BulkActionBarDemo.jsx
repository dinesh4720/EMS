import { BellRing } from "lucide-react";

import BulkActionBar from "../../../../components/ui/BulkActionBar";
import useBulkSelection from "../../../../hooks/useBulkSelection";

/* ──────────────────────────────────────────────────────────────────
 * Bulk action bar — useBulkSelection + <BulkActionBar/> canonical
 * surface. Esc clears, shift-click range, "Select all matching N"
 * when filtered (REVAMP-101).
 * ────────────────────────────────────────────────────────────────── */
export default function BulkActionBarDemo() {
  const ROWS = [
    { id: "1", name: "Aarav Joshi" },
    { id: "2", name: "Riya Mehta" },
    { id: "3", name: "Karan Singh" },
    { id: "4", name: "Asha Sharma" },
    { id: "5", name: "Devansh Iyer" },
  ];
  const visibleIds = ROWS.map((r) => r.id);
  const selection = useBulkSelection({
    visibleIds,
    totalMatching: 142, // pretend the filter matches 142 records across pages
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          className="btn btn--sm"
          onClick={selection.toggleAllVisible}
        >
          {selection.allVisibleSelected ? "Deselect visible" : "Select visible"}
        </button>
        <BulkActionBar selection={selection} totalMatching={142}>
          <button type="button" className="btn btn--sm">
            <BellRing size={12} aria-hidden /> Send reminder
          </button>
          <button type="button" className="btn btn--sm">
            Mark paid
          </button>
        </BulkActionBar>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 4, margin: 0, padding: 0, listStyle: "none" }}>
        {ROWS.map((r) => (
          <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={selection.isSelected(r.id)}
              onClick={(e) => {
                e.preventDefault();
                selection.toggle(r.id, e);
              }}
              onChange={() => {}}
              aria-label={`Select ${r.name}`}
            />
            <span>{r.name}</span>
          </li>
        ))}
      </ul>
      <p className="subtle" style={{ fontSize: 11, margin: 0 }}>
        Tip: hold <kbd className="kbd">Shift</kbd> and click to extend the range.
        Press <kbd className="kbd">Esc</kbd> to clear.
      </p>
    </div>
  );
}

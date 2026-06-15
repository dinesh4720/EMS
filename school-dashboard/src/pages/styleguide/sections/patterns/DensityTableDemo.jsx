import { useState } from "react";
import { Wallet } from "lucide-react";

import { Story } from "../../shared";
import CheckboxCell from "./CheckboxCell";

/* ──────────────────────────────────────────────────────────────────
 * Density table — interactive fees-table demo. The .fees-table grid
 * pattern reused as fd-table / academics-table.
 * ────────────────────────────────────────────────────────────────── */
const DENSITY_ROWS = [
  { id: "5",  roll: 5,  name: "Aarav Joshi",  klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "ok" },
  { id: "8",  roll: 8,  name: "Riya Mehta",   klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "danger" },
  { id: "12", roll: 12, name: "Karan Singh",  klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "warn" },
  { id: "17", roll: 17, name: "Asha Sharma",  klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "ok" },
];

export default function DensityTableDemo() {
  const [selected, setSelected] = useState(new Set(["8"]));
  const allSelected = selected.size === DENSITY_ROWS.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(DENSITY_ROWS.map((r) => r.id)));

  return (
    <Story title="Fees table — interactive" sub={`${selected.size} selected`} layout="plain">
      <div className="fees-table" role="table">
        <div className="fees-table__head" role="row">
          <CheckboxCell
            label="Select all rows"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
          />
          <span>Roll</span>
          <span>Student</span>
          <span>Term</span>
          <span className="fees-table__amount">Amount</span>
          <span>Status</span>
          <span className="fees-table__action">Action</span>
        </div>
        {DENSITY_ROWS.map((row) => {
          const isSelected = selected.has(row.id);
          const STATUS_LABEL = { ok: "Paid", warn: "Pending", danger: "Overdue" }[row.status];
          return (
            <div
              key={row.id}
              role="row"
              className={`fees-table__row${isSelected ? " is-selected" : ""}`}
            >
              <CheckboxCell
                label={`Select ${row.name}`}
                checked={isSelected}
                onChange={() => toggle(row.id)}
              />
              <span className="mono tnum">{row.roll}</span>
              <span>
                <div className="fees-table__name">{row.name}</div>
                <div className="fees-table__sub">{row.klass}</div>
              </span>
              <span className="subtle">{row.term}</span>
              <span className="fees-table__amount tnum">
                ₹{row.amount.toLocaleString("en-IN")}
              </span>
              <span>
                <span className={`status status--${row.status}`}>
                  <span className="dot" aria-hidden />
                  {STATUS_LABEL}
                </span>
              </span>
              <span className="fees-table__action">
                {row.status === "ok" ? (
                  <button type="button" className="btn btn--sm">Receipt</button>
                ) : (
                  <button type="button" className="btn btn--accent btn--sm">
                    <Wallet size={13} aria-hidden /> Collect
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Story>
  );
}

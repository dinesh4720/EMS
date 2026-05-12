import { useMemo, useState } from "react";
import { Receipt, Wallet, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { derivePaymentStatus, PAYMENT_STATUS } from "../../hooks/useFeesData";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
function fmtINR(n) {
  return inrFormatter.format(Number.isFinite(n) ? n : 0);
}

function StatusPill({ status }) {
  const tone =
    status === PAYMENT_STATUS.PAID
      ? "ok"
      : status === PAYMENT_STATUS.OVERDUE
      ? "danger"
      : "warn";
  const label =
    status === PAYMENT_STATUS.PAID
      ? "Paid"
      : status === PAYMENT_STATUS.OVERDUE
      ? "Overdue"
      : "Pending";
  return (
    <span className={`status status--${tone}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

function RowAction({ status, onCollect, onReceipt, onRefund }) {
  if (status === PAYMENT_STATUS.PAID) {
    return (
      <>
        <button
          type="button"
          className="btn btn--sm"
          onClick={onReceipt}
          title="Open receipt"
        >
          <Receipt size={13} aria-hidden /> Receipt
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={onRefund}
          title="Refund this payment"
        >
          <Undo2 size={13} aria-hidden /> Refund
        </button>
      </>
    );
  }
  return (
    <button
      type="button"
      className="btn btn--accent btn--sm"
      onClick={onCollect}
      title="Collect payment"
    >
      <Wallet size={13} aria-hidden /> Collect
    </button>
  );
}

// Phase 7 — payments table.
// Receives already-filtered rows (FeesPage owns filter state).
// Owns: row selection, bulk action chip, row actions.
export default function PaymentsTable({
  rows = [],
  onCollect,
  onSendReminder,
}) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const all = new Set(rows.map((r) => r._id || r.id));
      // If everything is already selected, clear; otherwise select everything visible.
      if (prev.size === all.size && [...prev].every((id) => all.has(id))) {
        return new Set();
      }
      return all;
    });
  };

  // Drop selections that are no longer in `rows` (e.g. after filter changes).
  const liveSelectedIds = useMemo(() => {
    const ids = new Set(rows.map((r) => r._id || r.id));
    return new Set([...selectedIds].filter((id) => ids.has(id)));
  }, [rows, selectedIds]);

  if (rows.length === 0) {
    return (
      <div className="fees-table">
        <div className="fees-table__empty">No payments match this filter.</div>
      </div>
    );
  }

  const allSelected =
    rows.length > 0 && liveSelectedIds.size === rows.length;

  return (
    <div className="col gap-2">
      {liveSelectedIds.size > 0 && (
        <div className="fees-bulk" role="status">
          <span className="fees-bulk__count">{liveSelectedIds.size}</span>
          selected ·
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => onSendReminder?.([...liveSelectedIds])}
          >
            Send reminder
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      <div className="fees-table" role="table">
        <div className="fees-table__head" role="row">
          <input
            type="checkbox"
            aria-label="Select all visible rows"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span>Roll</span>
          <span>Student</span>
          <span>Term</span>
          <span className="fees-table__amount">Amount</span>
          <span>Status</span>
          <span className="fees-table__action">Action</span>
        </div>

        {rows.map((p) => {
          const id = p._id || p.id;
          const status = derivePaymentStatus(p);
          const studentName = p.student?.name || p.studentName || "—";
          const className =
            p.student?.className || p.className || p.classSection || "";
          const rollNo = p.student?.rollNo || p.rollNo || "—";
          const term = p.term || p.feeTerm || p.headName || "—";
          const studentId = p.student?._id || p.studentId || null;
          const isSelected = liveSelectedIds.has(id);

          return (
            <div
              key={id}
              role="row"
              className={`fees-table__row${isSelected ? " is-selected" : ""}`}
            >
              <input
                type="checkbox"
                aria-label={`Select ${studentName}`}
                checked={isSelected}
                onChange={() => toggleRow(id)}
              />
              <span className="mono tnum">{rollNo}</span>
              <span>
                <div className="fees-table__name">{studentName}</div>
                <div className="fees-table__sub">
                  {className && <span>{className}</span>}
                </div>
              </span>
              <span className="subtle">{term}</span>
              <span className="fees-table__amount tnum">
                {fmtINR(p.amount)}
              </span>
              <span><StatusPill status={status} /></span>
              <span className="fees-table__action row gap-1">
                <RowAction
                  status={status}
                  onCollect={() => onCollect?.(studentId, p)}
                  onReceipt={() =>
                    navigate(`/fees/receipts/${id}`)
                  }
                  onRefund={() =>
                    navigate(`/fees/refunds?payment=${id}`)
                  }
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

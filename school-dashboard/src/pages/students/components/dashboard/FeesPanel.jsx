import React from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";

import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import { formatCurrency } from "./utils";

function FeesPanel({ studentId, feeStructure, loading, error, refetch }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading fees…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!feeStructure) {
    return (
      <EmptyState
        icon={Wallet}
        title="No fee structure"
        description="Assign a fee template to this student to begin tracking dues."
      />
    );
  }
  const total = feeStructure.totalFee ?? feeStructure.totalAmount;
  const paid = feeStructure.paidAmount ?? 0;
  const balance =
    feeStructure.balanceAmount ?? (total != null ? total - paid : null);
  const status = String(feeStructure.feeStatus || feeStructure.status || "").toLowerCase();
  const tone =
    status === "paid"
      ? "ok"
      : status === "overdue" || status === "outstanding"
      ? "danger"
      : "warn";
  return (
    <div className="col gap-4">
      <div className="row gap-3" style={{ flexWrap: "wrap" }}>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Total</span>
          <span className="dp-metric__value mono tnum">{formatCurrency(total)}</span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Paid</span>
          <span className="dp-metric__value mono tnum">{formatCurrency(paid)}</span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Balance</span>
          <span className="dp-metric__value mono tnum">{formatCurrency(balance)}</span>
        </div>
      </div>
      <div className="card">
        <div className="card__head">
          <span className="card__title">Fee status</span>
          {status && (
            <span className={`status status--${tone}`}>
              <span className="dot" />
              {status}
            </span>
          )}
        </div>
        <div style={{ padding: 16 }}>
          <Link
            to={`/fees?student=${studentId}`}
            className="btn"
            style={{ textDecoration: "none" }}
          >
            Open in fees →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FeesPanel;

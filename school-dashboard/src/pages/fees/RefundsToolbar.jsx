import { Plus, CheckCircle2, Ban } from "lucide-react";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import BulkActionBar from "../../components/ui/BulkActionBar";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "processed", label: "Processed" },
  { key: "rejected", label: "Rejected" },
];

export default function RefundsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenNewRefund,
  selection,
  totalMatching,
  t,
  onBulkApprove,
  onBulkReject,
  bulkActionLoading = false,
}) {
  const bulkDisabled = bulkActionLoading || !onBulkApprove || !onBulkReject;

  return (
    <div className="toolbar" style={{ paddingTop: 0 }}>
      <ToolbarSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t("pages.searchStudent")}
        ariaLabel={t("aria.misc.searchRefunds", "Search refunds")}
        style={{ flex: 1, maxWidth: 360 }}
      />

      <div
        className="seg"
        role="tablist"
        aria-label={t("aria.misc.filterRefunds", "Filter refunds")}
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === f.key}
            className={`seg__btn${statusFilter === f.key ? " is-active" : ""}`}
            onClick={() => onStatusFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="row gap-2" style={{ marginLeft: "auto" }}>
        <button
          type="button"
          className="btn btn--accent"
          onClick={onOpenNewRefund}
        >
          <Plus size={13} aria-hidden /> {t("pages.newRefund")}
        </button>
      </div>

      <BulkActionBar selection={selection} totalMatching={totalMatching}>
        <button
          type="button"
          className="btn btn--sm"
          disabled={bulkDisabled}
          onClick={() => onBulkApprove?.(selection)}
        >
          <CheckCircle2 size={12} aria-hidden /> {t("common.approve", "Approve")}
        </button>
        <button
          type="button"
          className="btn btn--sm"
          disabled={bulkDisabled}
          onClick={() => onBulkReject?.(selection)}
        >
          <Ban size={12} aria-hidden /> {t("common.reject", "Reject")}
        </button>
      </BulkActionBar>
    </div>
  );
}

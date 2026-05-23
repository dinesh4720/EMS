import { useRef, useEffect } from "react";
import { ChevronLeft, X, Download, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import PhotoAvatar from "../../components/PhotoAvatar";
import Button from "../../components/ui/Button";

// Same status tone map as RefundListRow
const STATUS_TONE = {
  processed: "ok",
  approved: "info",
  rejected: "danger",
  pending: "warn",
};

export default function RefundDetailPane({
  refund,
  onClose,
  onApprove,
  onReject,
  onProcess,
  onDownload,
  actionLoading,
  currencyFmt,
  isMobile = false,
}) {
  const paneRef = useRef(null);

  useEffect(() => {
    if (isMobile && paneRef.current) {
      const focusable = paneRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        paneRef.current.focus();
      }
    }
  }, [isMobile, refund]);

  if (!refund) return null;

  const status = refund.status || "pending";
  const tone = STATUS_TONE[status] || "info";
  const student = refund.studentId;
  const studentName = student?.name || "Unknown";
  const classLabel = student?.classId
    ? `${student.classId.name || ""} ${student.classId.section || ""}`.trim()
    : "—";
  const amount = refund.amount || 0;

  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isProcessed = status === "processed";
  const isRejected = status === "rejected";

  return (
    <aside
      ref={paneRef}
      className="detail-pane"
      role="complementary"
      aria-label="Refund details"
    >
      {/* Head bar */}
      <div className="detail-pane__head">
        <button
          type="button"
          className="iconbtn"
          style={{ width: 24, height: 24 }}
          onClick={onClose}
          aria-label={isMobile ? "Close refund detail" : "Clear selection"}
          title={isMobile ? "Close" : "Clear selection"}
        >
          {isMobile ? <X size={13} /> : <ChevronLeft size={13} />}
        </button>
        <span className="subtle mono tnum" style={{ fontSize: 11 }}>
          {refund._id?.slice(-6)?.toUpperCase()}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="iconbtn"
          style={{ width: 24, height: 24 }}
          onClick={() => onDownload?.(refund)}
          aria-label="Download refund details"
          title="Download"
        >
          <Download size={13} />
        </button>
      </div>

      {/* Hero */}
      <div className="detail-pane__hero">
        <PhotoAvatar
          src={student?.picture || student?.photo}
          alt={studentName}
          name={studentName}
          size="lg"
          type="student"
        />
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {studentName}
          </span>
          <span className="subtle" style={{ fontSize: 13 }}>
            {classLabel}
          </span>
          <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
            <span className={`status status--${tone}`}>
              <span className="dot" />
              {status}
            </span>
            {refund.refundMode && (
              <span className="chip mono tnum">{refund.refundMode}</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="detail-pane__metrics">
        <div className="dp-metric">
          <span className="dp-metric__label">Amount</span>
          <span className="dp-metric__value mono tnum">
            {currencyFmt(amount)}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Status</span>
          <span className="dp-metric__value mono tnum" style={{ textTransform: "capitalize" }}>
            {status}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Date</span>
          <span className="dp-metric__value mono tnum" style={{ fontSize: 13 }}>
            {refund.refundDate || "—"}
          </span>
        </div>
      </div>

      {/* Reason */}
      <div className="detail-pane__section">
        <div className="card__title" style={{ marginBottom: 10 }}>
          Reason
        </div>
        <div className="dp-kv">
          <span className="subtle">Reason for refund</span>
          <span>{refund.reason || "—"}</span>
        </div>
        <div className="dp-kv">
          <span className="subtle">Refund mode</span>
          <span className="mono tnum" style={{ textTransform: "capitalize" }}>
            {refund.refundMode || "—"}
          </span>
        </div>
        {refund.rejectionReason && (
          <div className="dp-kv">
            <span className="subtle">Rejection reason</span>
            <span className="mono tnum" style={{ color: "var(--danger)" }}>
              {refund.rejectionReason}
            </span>
          </div>
        )}
      </div>

      {/* Remarks */}
      {refund.remarks && (
        <div className="detail-pane__section">
          <div className="card__title" style={{ marginBottom: 10 }}>
            Remarks
          </div>
          <div className="subtle" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {refund.remarks}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="detail-pane__section">
        <div className="card__title" style={{ marginBottom: 10 }}>
          Details
        </div>
        <div className="dp-kv">
          <span className="subtle">Created</span>
          <span className="mono tnum">
            {refund.createdAt
              ? new Date(refund.createdAt).toLocaleDateString()
              : "—"}
          </span>
        </div>
        {refund.approvedAt && (
          <div className="dp-kv">
            <span className="subtle">Approved</span>
            <span className="mono tnum">
              {new Date(refund.approvedAt).toLocaleDateString()}
            </span>
          </div>
        )}
        {refund.processedAt && (
          <div className="dp-kv">
            <span className="subtle">Processed</span>
            <span className="mono tnum">
              {new Date(refund.processedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="detail-pane__foot">
        {isPending && (
          <>
            <Button
              variant="outline"
              size="sm"
              loading={actionLoading === refund._id}
              disabled={actionLoading === refund._id}
              onClick={() => onReject?.(refund)}
              style={{ flex: 1 }}
            >
              <XCircle size={13} aria-hidden /> Reject
            </Button>
            <Button
              size="sm"
              loading={actionLoading === refund._id}
              disabled={actionLoading === refund._id}
              onClick={() => onApprove?.(refund)}
              style={{ flex: 1 }}
            >
              <CheckCircle size={13} aria-hidden /> Approve
            </Button>
          </>
        )}
        {isApproved && (
          <Button
            size="sm"
            loading={actionLoading === refund._id}
            disabled={actionLoading === refund._id}
            onClick={() => onProcess?.(refund)}
            style={{ flex: 1 }}
          >
            <RotateCcw size={13} aria-hidden /> Process refund
          </Button>
        )}
        {(isProcessed || isRejected) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload?.(refund)}
            style={{ flex: 1 }}
          >
            <Download size={13} aria-hidden /> Download CSV
          </Button>
        )}
      </div>
    </aside>
  );
}

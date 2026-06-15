import { X } from "lucide-react";

export default function RefundsRejectModal({
  open,
  onClose,
  onConfirm,
  reason,
  onReasonChange,
  actionLoading,
  refundId,
  t,
}) {
  if (!open) return null;

  const isProcessing = actionLoading === refundId;
  const canSubmit = !isProcessing && reason.trim().length > 0;

  return (
    <div
      className="composer-overlay"
      onClick={() => {
        if (!isProcessing) onClose();
      }}
    >
      <div
        className="composer"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 480 }}
      >
        <header className="composer__head">
          <span className="composer__title">
            {t("pages.rejectRefund", "Reject Refund")}
          </span>
          <button
            type="button"
            className="iconbtn"
            onClick={onClose}
            aria-label="Close"
            disabled={isProcessing}
          >
            <X size={14} />
          </button>
        </header>
        <div className="composer__body">
          <label className="field" htmlFor="reject-reason">
            <span className="field__label">
              {t("pages.rejectionReason", "Reason for rejection")}{" "}
              <span className="req">*</span>
            </span>
            <textarea
              id="reject-reason"
              className="textarea"
              rows={3}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t(
                "pages.enterRejectionReason",
                "Enter rejection reason..."
              )}
              required
            />
          </label>
        </div>
        <footer className="composer__foot">
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={onConfirm}
            disabled={!canSubmit}
          >
            {isProcessing
              ? t("common.processing", "Processing...")
              : t("pages.confirmReject", "Reject Refund")}
          </button>
        </footer>
      </div>
    </div>
  );
}

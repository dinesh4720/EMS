import { ChevronRight } from "lucide-react";

export default function ComposerFoot({
  totalFilled,
  totalFields,
  progressPct,
  hasChanges,
  isSubmitting,
  isEdit,
  onCancel,
  onSaveDraft,
  onSubmit,
}) {
  return (
    <div className="composer__foot">
      <div className="composer__progress">
        <span className="mono tnum">
          {totalFilled} of {totalFields} fields
        </span>
        <div className="composer__progress-bar">
          <div className="composer__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        {hasChanges && <span className="subtle">· unsaved</span>}
      </div>
      <div style={{ flex: 1 }} />
      <button type="button" className="btn btn--ghost subtle" onClick={onCancel}>
        Cancel
      </button>
      <button
        type="button"
        className="btn"
        onClick={onSaveDraft}
      >
        Save draft
      </button>
      <button
        type="button"
        className="btn btn--accent"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? isEdit
            ? "Updating…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Add student"}
        {!isSubmitting && <ChevronRight size={11} aria-hidden />}
      </button>
    </div>
  );
}

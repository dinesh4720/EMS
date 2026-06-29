import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DiscardConfirmDialog({ onCancel, onConfirm }) {
  const { t } = useTranslation();
  return (
    <div className="cmp-modal-bg" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-label="Discard unsaved changes"
        className="cmp-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmp-modal__title">
          {t("pages.unsavedChanges", "Unsaved changes")}
        </div>
        <p className="cmp-modal__body">
          You have unsaved changes. Close without saving?
        </p>
        <div className="cmp-modal__foot">
          <button type="button" className="btn" onClick={onCancel}>
            Keep editing
          </button>
          <button type="button" className="btn btn--accent" onClick={onConfirm}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

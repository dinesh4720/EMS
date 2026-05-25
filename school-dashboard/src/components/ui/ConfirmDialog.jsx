import { memo, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react";
import ModalBase from "./ModalBase";

/**
 * ConfirmDialog — frosted "alertdialog" with Discard / Keep pattern.
 *
 * Mirrors AddStaffComposer's "discard unsaved changes" sheet:
 *   - 380px card on a dim backdrop, no glass blur (uses --surface)
 *   - Title + body + actions (cancel left, confirm-destructive right)
 *   - role="alertdialog" so screen readers announce immediately
 *
 * Variants colour the icon + the confirm button only; the body stays in
 * neutral surface so the message keeps its weight.
 *
 *  @param {boolean}  isOpen
 *  @param {function} onClose
 *  @param {function} onConfirm
 *  @param {string}   title
 *  @param {string|node} message
 *  @param {string}   confirmText  Default: "Confirm"
 *  @param {string}   cancelText   Default: "Cancel"
 *  @param {"danger"|"warning"|"info"} variant
 *  @param {boolean}  isLoading
 */
const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
  children = null,
}) {
  const config = useMemo(() => {
    switch (variant) {
      case "danger":
        return {
          Icon: Trash2,
          iconClass: "ds-confirm__title-icon--danger",
          confirmClass: "btn btn--accent",
          confirmStyle: {
            background: "var(--danger)",
            borderColor: "var(--danger)",
          },
        };
      case "info":
        return {
          Icon: Info,
          iconClass: "ds-confirm__title-icon--info",
          confirmClass: "btn btn--accent",
        };
      case "warning":
        return {
          Icon: AlertTriangle,
          iconClass: "ds-confirm__title-icon--warning",
          confirmClass: "btn btn--accent",
        };
      default:
        return {
          Icon: AlertCircle,
          iconClass: "",
          confirmClass: "btn btn--accent",
        };
    }
  }, [variant]);

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) return;
    try {
      await onConfirm();
    } catch {
      onClose();
    }
  }, [onConfirm, onClose]);

  if (!isOpen) return null;

  const { Icon } = config;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      portalId="ds-confirm-root"
      labelledBy="ds-confirm-title"
      describedBy="ds-confirm-message"
      role="alertdialog"
      className="ds-backdrop"
      closeOnBackdrop={!isLoading}
    >
      <div
        className="ds-confirm"
        onClick={(e) => e.stopPropagation()}
        role="document"
        data-testid="ds-confirm-dialog"
      >
        <h2 id="ds-confirm-title" className="ds-confirm__title">
          <span className={`ds-confirm__title-icon ${config.iconClass}`} aria-hidden="true">
            <Icon size={16} strokeWidth={2} />
          </span>
          {title}
        </h2>
        <p id="ds-confirm-message" className="ds-confirm__message">
          {message}
        </p>
        {children ? <div className="ds-confirm__children">{children}</div> : null}
        <div className="ds-confirm__actions">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={config.confirmClass}
            style={config.confirmStyle}
            onClick={handleConfirm}
            disabled={isLoading}
            aria-busy={isLoading || undefined}
          >
            {isLoading ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </ModalBase>
  );
});

ConfirmDialog.displayName = "ConfirmDialog";

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(["danger", "warning", "info"]),
  isLoading: PropTypes.bool,
  children: PropTypes.node,
};

export default ConfirmDialog;

import { memo } from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";

/**
 * Dialog — lightweight alert / notice built on top of Modal (REVAMP-05).
 *
 * Use when you need to tell the user something (e.g. "Invite sent",
 * "Session expired") rather than ask them to confirm a destructive action.
 * For destructive confirmations use `ConfirmDialog`.
 */
const Dialog = memo(function Dialog({
  isOpen,
  onClose,
  title,
  message,
  actionText = "OK",
  onAction,
  size = "sm",
  children,
}) {
  const handleAction = () => {
    if (onAction) onAction();
    else onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={title}
      footer={
        <button type="button" className="btn btn--accent" onClick={handleAction}>
          {actionText}
        </button>
      }
    >
      {message ? (
        <p style={{ color: "var(--fg-muted)", margin: 0, lineHeight: 1.5 }}>
          {message}
        </p>
      ) : null}
      {children}
    </Modal>
  );
});

Dialog.displayName = "Dialog";

Dialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.node,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
  children: PropTypes.node,
};

export default Dialog;

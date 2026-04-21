import { memo } from "react";
import PropTypes from "prop-types";
import { Button } from "@heroui/react";
import Modal from "./Modal";

/**
 * Dialog — lightweight alert / notice dialog built on top of Modal.
 *
 * Use when you need to tell the user something (e.g. "Invite sent", "Session
 * expired") rather than ask them to confirm a destructive action. For
 * destructive confirmations use `ConfirmDialog`.
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
        <Button color="primary" onPress={handleAction}>
          {actionText}
        </Button>
      }
    >
      {message ? (
        <p className="text-default-700 leading-relaxed">{message}</p>
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

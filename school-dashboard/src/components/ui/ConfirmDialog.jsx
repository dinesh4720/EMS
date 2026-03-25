import { memo, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react";

/**
 * Reusable confirmation dialog component
 *
 * @param {boolean} isOpen - Whether the dialog is open
 * @param {function} onClose - Function to call when dialog is closed
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - Dialog variant: "danger", "warning", "info" (default: "warning")
 * @param {boolean} isLoading - Whether the confirm action is loading
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
  children = null
}) {
  const config = useMemo(() => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 size={24} className="text-danger" />,
          confirmColor: "danger",
          headerClass: "border-b border-danger-200 bg-danger-50/50"
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} className="text-warning" />,
          confirmColor: "warning",
          headerClass: "border-b border-warning-200 bg-warning-50/50"
        };
      case "info":
        return {
          icon: <Info size={24} className="text-primary" />,
          confirmColor: "primary",
          headerClass: "border-b border-primary-200 bg-primary-50/50"
        };
      default:
        return {
          icon: <AlertCircle size={24} className="text-default-500" />,
          confirmColor: "primary",
          headerClass: "border-b border-default-200"
        };
    }
  }, [variant]);

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      await onConfirm();
    }
  }, [onConfirm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      classNames={{
        backdrop: "bg-black/50",
        base: "bg-white dark:bg-gray-900"
      }}
    >
      <ModalContent>
        <ModalHeader className={`flex items-center gap-3 ${config.headerClass}`}>
          {config.icon}
          <span className="text-lg font-semibold">{title}</span>
        </ModalHeader>
        <ModalBody className="py-6">
          <p className="text-default-700 leading-relaxed">
            {message}
          </p>
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            color={config.confirmColor}
            onPress={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning', 'info']),
  isLoading: PropTypes.bool,
  children: PropTypes.node,
};

export default ConfirmDialog;

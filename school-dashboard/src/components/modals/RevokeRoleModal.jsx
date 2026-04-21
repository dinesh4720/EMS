import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

/**
 * RevokeRoleModal — shown when the currently logged-in user is about to
 * remove the Admin role from their own account. Warns that session
 * permissions will be restricted immediately after the change takes effect.
 */
export default function RevokeRoleModal({ isOpen, onClose, onConfirm, isLoading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 border-b border-warning-200 bg-warning-50/50 dark:bg-warning-900/20">
          <AlertTriangle size={24} className="text-warning flex-shrink-0" />
          <span className="text-lg font-semibold">Remove Admin Role From Your Account?</span>
        </ModalHeader>
        <ModalBody className="py-6 space-y-3">
          <p className="text-default-700 leading-relaxed">
            You are about to remove the <strong>Admin</strong> role from your own account.
          </p>
          <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-800 dark:text-warning-200">
            <strong>Warning:</strong> You will lose access to admin-only features immediately once the page refreshes. Ensure at least one other admin account exists before proceeding, or you may be locked out of administrative functions.
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button color="warning" onPress={onConfirm} isLoading={isLoading}>
            Remove Admin Role
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

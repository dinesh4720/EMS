import { memo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Modal shown when the user tries to navigate away with unsaved form changes.
 * Pairs with the useUnsavedChanges hook.
 *
 * @param {boolean}  isOpen    - Whether the modal is visible (usually `isBlocked` from the hook)
 * @param {function} onDiscard - Called when user chooses to leave / discard changes (usually `proceed`)
 * @param {function} onCancel  - Called when user chooses to stay (usually `reset`)
 */
const UnsavedChangesModal = memo(function UnsavedChangesModal({ isOpen, onDiscard, onCancel }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      isDismissable={false}
      hideCloseButton
      role="alertdialog"
      classNames={{
        backdrop: "bg-black/50",
        base: "bg-white dark:bg-gray-900",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 border-b border-warning-200 bg-warning-50/50">
          <span aria-hidden="true">
            <AlertTriangle size={22} className="text-warning" />
          </span>
          <span className="text-lg font-semibold">
            {t('common.unsavedChangesTitle', 'Unsaved Changes')}
          </span>
        </ModalHeader>
        <ModalBody className="py-5">
          <p className="text-sm text-default-600">
            {t('common.unsavedChangesDesc', 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.')}
          </p>
        </ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button variant="light" onPress={onCancel}>
            {t('common.keepEditing', 'Keep Editing')}
          </Button>
          <Button color="danger" variant="flat" onPress={onDiscard}>
            {t('common.discardChanges', 'Discard Changes')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default UnsavedChangesModal;

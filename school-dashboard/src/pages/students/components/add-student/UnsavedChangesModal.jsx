import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useTranslation } from 'react-i18next';

/**
 * UnsavedChangesModal
 * Shown when the user tries to close the Add/Edit Student form with unsaved changes.
 *
 * @param {boolean} isOpen           - Whether the modal is visible
 * @param {Function} onStay          - Called when the user chooses to stay (cancel close)
 * @param {Function} onDiscard       - Called when the user confirms discarding changes
 */
function UnsavedChangesModal({ isOpen, onStay, onDiscard }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onStay}
      size="sm"
      isDismissable={false}
      hideCloseButton
      portalContainer={document.body}
      classNames={{
        base: "z-[999999]",
        wrapper: "z-[999999]",
        backdrop: "z-[999999]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{t('pages.unsavedChanges')}</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">
            You have unsaved changes. Are you sure you want to close? Your changes will be lost.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onStay}>
            Stay
          </Button>
          <Button color="danger" variant="flat" onPress={onDiscard}>
            Discard Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default UnsavedChangesModal;

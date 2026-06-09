import { Button, Modal } from "../../../../components/ui";
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
      className="z-[999999]"
    >
      <Modal.Header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{t('pages.unsavedChanges')}</h3>
      </Modal.Header>
      <Modal.Body>
        <p className="text-sm text-fg-subtle">
          You have unsaved changes. Are you sure you want to close? Your changes will be lost.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" size="sm" onClick={onStay}>
          Stay
        </Button>
        <Button variant="danger" size="sm" onClick={onDiscard}>
          Discard Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UnsavedChangesModal;

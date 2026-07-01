import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { RotateCcw, AlertTriangle } from "lucide-react";

/** Confirmation modal for bulk restore / permanent delete, with a preview list. */
export default function TrashBulkActionModal({
  isOpen,
  onClose,
  pendingAction,
  selectedItems,
  trashItems,
  actionInProgress,
  confirmBulkAction,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>
          {pendingAction === "restore"
            ? "Restore Selected Items"
            : "Permanently Delete Selected Items"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {pendingAction === "restore" ? (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--accent-bg)] rounded-lg mt-0.5">
                  <RotateCcw size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="font-medium text-fg">
                    Restore {selectedItems.size} item(s)
                  </p>
                  <p className="text-sm text-fg-muted mt-1">
                    These items will be restored to their original location
                    and will no longer appear in trash.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--danger-bg)] rounded-lg mt-0.5">
                  <AlertTriangle size={20} className="text-[var(--danger)]" />
                </div>
                <div>
                  <p className="font-medium text-fg">
                    Permanently delete {selectedItems.size} item(s)
                  </p>
                  <p className="text-sm text-fg-muted mt-1">
                    <strong className="text-[var(--danger)]">
                      This action cannot be undone.
                    </strong>{" "}
                    These items will be permanently removed from the system.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-xs text-fg-muted font-medium mb-2">
                Selected items:
              </p>
              <div className="space-y-1">
                {Array.from(selectedItems)
                  .slice(0, 5)
                  .map((id) => {
                    const item = trashItems.find((i) => (i._id || i.id) === id);
                    const itemName = item?.itemName || item?.name || 'Unknown';
                    return item ? (
                      <p
                        key={id}
                        className="text-xs text-fg"
                      >
                        • {itemName}
                      </p>
                    ) : null;
                  })}
                {selectedItems.size > 5 && (
                  <p className="text-xs text-fg-muted italic">
                    ... and {selectedItems.size - 5} more
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            className="transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            color={pendingAction === "restore" ? "primary" : "danger"}
            onPress={confirmBulkAction}
            isLoading={actionInProgress}
            className="transition-all duration-200"
          >
            {pendingAction === "restore" ? "Restore" : "Delete Permanently"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

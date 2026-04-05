import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox } from "@heroui/react";
import { useTranslation } from 'react-i18next';
import { AVAILABLE_COLUMNS } from '../classesListConstants';

export function EditColumnsModal({ isOpen, onClose, getVisibleColumns: visibleCols = [], toggleColumn }) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>{t('pages.editColumns')}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            {AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.key).map(col => (
              <Checkbox size="sm"
                key={col.key}
                isSelected={(Array.isArray(visibleCols) ? visibleCols : []).find(c => c?.key === col.key)?.visible ?? true}
                isDisabled={col.fixed}
                onValueChange={() => col?.key && toggleColumn(col.key)}
              >
                {col.labelKey ? t(col.labelKey, col.label || col.key) : (col.label || col.key)}
              </Checkbox>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            {t('common.done', 'Done')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

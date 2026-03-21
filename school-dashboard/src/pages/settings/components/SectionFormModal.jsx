import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function SectionFormModal({ isOpen, onClose, selectedClass, editingSection, onSave }) {
  const { t } = useTranslation();
  const [newSection, setNewSection] = useState("");

  // Reset form when modal opens/closes or editing state changes
  useEffect(() => {
    if (isOpen) {
      if (editingSection) {
        setNewSection(editingSection.section);
      } else {
        setNewSection("");
      }
    }
  }, [isOpen, editingSection]);

  const handleClose = () => {
    setNewSection("");
    onClose();
  };

  const handleSave = () => {
    onSave(newSection);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalContent>
        <ModalHeader>
          {editingSection
            ? t('settings.academics.editSectionTitle', 'Edit Section - Class {{num}}', { num: editingSection.classNum })
            : selectedClass
              ? t('settings.academics.addSectionClassTitle', 'Add Section - Class {{num}}', { num: selectedClass })
              : t('settings.academics.addSection', 'Add Section')
          }
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4 py-2">
            <Input
              label={t('common.section', 'Section')}
              placeholder={t('settings.academics.sectionPlaceholder', 'e.g., A')}
              value={newSection}
              onValueChange={(v) => setNewSection(v.toUpperCase().slice(0, 1))}
              variant="bordered"
              labelPlacement="outside"
              description={t('settings.academics.sectionDescription', 'Enter section letter (A-Z)')}
              autoFocus
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!newSection.trim()}
          >
            {editingSection ? t('common.update', 'Update') : t('common.add', 'Add')} {t('settings.academics.sections', 'Section')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

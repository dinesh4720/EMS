import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function SectionModal({
  isOpen,
  onClose,
  editingSection,
  newSection,
  setNewSection,
  sectionError,
  setSectionError,
  selectedClassNum,
  onSave,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>
          {editingSection
            ? `Edit Section - Class ${editingSection.classNum}`
            : selectedClassNum
              ? `Add Section - Class ${selectedClassNum}`
              : 'Add Section'
          }
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4 py-2">
            <Input
              label={t('pages.section1')}
              placeholder={t('settings.academics.sectionPlaceholder')}
              value={newSection}
              onValueChange={(v) => { setNewSection(v.toUpperCase().slice(0, 1)); setSectionError(''); }}
              variant="bordered"
              labelPlacement="outside"
              description="Enter section letter (A-Z)"
              autoFocus
              isInvalid={!!sectionError}
              errorMessage={sectionError}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button
            color="primary"
            onPress={onSave}
            isDisabled={!newSection.trim()}
          >
            {editingSection ? 'Update' : 'Add'} Section
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

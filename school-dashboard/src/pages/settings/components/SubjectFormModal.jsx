import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button, Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";

const ALL_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function SubjectFormModal({ isOpen, onClose, editingSubject, onSave }) {
  const { t } = useTranslation();
  const [newSubject, setNewSubject] = useState({ name: "", code: "", assignedClasses: [] });

  // Reset form when modal opens/closes or editingSubject changes
  useEffect(() => {
    if (isOpen) {
      if (editingSubject) {
        setNewSubject({
          name: editingSubject.name,
          code: editingSubject.code,
          assignedClasses: editingSubject.assignedClasses || []
        });
      } else {
        setNewSubject({ name: "", code: "", assignedClasses: [] });
      }
    }
  }, [isOpen, editingSubject]);

  const handleClose = () => {
    setNewSubject({ name: "", code: "", assignedClasses: [] });
    onClose();
  };

  const handleSave = () => {
    onSave(newSubject);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader>{editingSubject ? t('common.edit', 'Edit') + ' ' + t('settings.academics.subjectName', 'Subject') : t('settings.academics.addSubject', 'Add Subject')}</ModalHeader>
        <ModalBody>
          <div className="space-y-4 py-2">
            <Input
              label={t('settings.academics.subjectName', 'Subject Name')}
              placeholder={t('settings.academics.subjectNamePlaceholder', 'e.g., Mathematics')}
              value={newSubject.name}
              onValueChange={(v) => setNewSubject({ ...newSubject, name: v })}
              variant="bordered"
              labelPlacement="outside"
            />
            <Input
              label={t('settings.academics.subjectCode', 'Subject Code')}
              placeholder={t('settings.academics.subjectCodePlaceholder', 'e.g., MATH')}
              value={newSubject.code}
              onValueChange={(v) => setNewSubject({ ...newSubject, code: v.toUpperCase() })}
              variant="bordered"
              labelPlacement="outside"
            />

            {/* Class Assignment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-default-700">{t('settings.academics.assignToClasses', 'Assign to Classes')}</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => setNewSubject(prev => ({ ...prev, assignedClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }))}
                  >
                    {t('common.selectAll', 'Select All')}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onPress={() => setNewSubject(prev => ({ ...prev, assignedClasses: [] }))}
                  >
                    {t('common.clear', 'Clear')}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {ALL_CLASSES.map(classNum => {
                  const isSelected = newSubject.assignedClasses?.includes(classNum);
                  return (
                    <div
                      key={classNum}
                      className={`flex items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-default-200 hover:border-default-300 text-default-600'
                      }`}
                      onClick={() => {
                        const currentClasses = newSubject.assignedClasses || [];
                        const newClasses = isSelected
                          ? currentClasses.filter(c => c !== classNum)
                          : [...currentClasses, classNum];
                        setNewSubject(prev => ({ ...prev, assignedClasses: newClasses }));
                      }}
                    >
                      {classNum}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-default-400">
                {t('settings.academics.classesSelected', '{{count}} class(es) selected', { count: newSubject.assignedClasses?.length || 0 })}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!newSubject.name.trim() || !newSubject.code.trim()}
          >
            {editingSubject ? t('common.update', 'Update') + ' ' + t('settings.academics.subjectName', 'Subject') : t('settings.academics.addSubject', 'Add Subject')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

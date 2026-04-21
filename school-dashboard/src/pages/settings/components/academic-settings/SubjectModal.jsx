import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button, Chip } from "@heroui/react";
import { Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SubjectModal({
  isOpen,
  onClose,
  editingSubject,
  newSubject,
  setNewSubject,
  subjectErrors,
  setSubjectErrors,
  ALL_CLASSES,
  onSave,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4 py-2">
            <Input
              label={t('pages.subjectName1')}
              placeholder={t('settings.academics.subjectNamePlaceholder')}
              value={newSubject.name}
              onValueChange={(v) => { setNewSubject({ ...newSubject, name: v }); setSubjectErrors(prev => ({ ...prev, name: '' })); }}
              variant="bordered"
              labelPlacement="outside"
              isInvalid={!!subjectErrors.name}
              errorMessage={subjectErrors.name}
            />
            <Input
              label={t('pages.subjectCode1')}
              placeholder={t('settings.academics.subjectCodePlaceholder')}
              value={newSubject.code}
              onValueChange={(v) => { setNewSubject({ ...newSubject, code: v.toUpperCase() }); setSubjectErrors(prev => ({ ...prev, code: '' })); }}
              variant="bordered"
              labelPlacement="outside"
              isInvalid={!!subjectErrors.code}
              errorMessage={subjectErrors.code}
            />

            {/* Class Assignment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-default-700">{t('pages.assignToClasses1')}</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => setNewSubject(prev => ({ ...prev, assignedClasses: [...ALL_CLASSES] }))}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onPress={() => setNewSubject(prev => ({ ...prev, assignedClasses: [] }))}
                  >
                    Clear
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
                {newSubject.assignedClasses?.length || 0} class{(newSubject.assignedClasses?.length || 0) !== 1 ? 'es' : ''} selected
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button
            color="primary"
            onPress={onSave}
            isDisabled={!newSubject.name.trim() || !newSubject.code.trim()}
          >
            {editingSubject ? 'Update Subject' : 'Add Subject'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

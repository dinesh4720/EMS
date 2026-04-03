import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import { useApp } from "../../../context/AppContext";

export function EditClassModal({ isOpen, onClose, classData }) {
  const { t } = useTranslation();
  const { updateClass, refetch } = useApp();

  const [editFormData, setEditFormData] = useState({
    section: classData?.section || '',
    strengthLimit: String(classData?.strengthLimit?.current || classData?.strengthLimit?.default || ''),
    room: classData?.room || '',
    block: classData?.block || '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when classData changes (modal opens with new class)
  const resetForm = () => {
    setEditFormData({
      section: classData?.section || '',
      strengthLimit: String(classData?.strengthLimit?.current || classData?.strengthLimit?.default || ''),
      room: classData?.room || '',
      block: classData?.block || '',
    });
    setEditErrors({});
  };

  const handleSaveEdit = async () => {
    const newErrors = {};
    if (!editFormData.strengthLimit) newErrors.strengthLimit = t('classes.validation.capacityRequired', 'Capacity is required');
    else if (isNaN(editFormData.strengthLimit) || parseInt(editFormData.strengthLimit) <= 0) newErrors.strengthLimit = t('classes.validation.capacityPositive', 'Capacity must be a positive number');
    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return; }

    setIsEditing(true);
    try {
      const capacity = parseInt(editFormData.strengthLimit);
      await updateClass(classData.id, {
        strengthLimit: { current: capacity, default: capacity },
        ...(editFormData.room !== undefined && { room: editFormData.room }),
        ...(editFormData.block !== undefined && { block: editFormData.block }),
      });
      toast.success(t('toast.success.classUpdated', `Class ${classData.name}-${classData.section} updated`));
      onClose();
      if (refetch) await refetch(true);
    } catch (error) {
      toast.error(error.message || t('toast.error.updateClassFailed', 'Failed to update class'));
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      onOpenChange={(open) => { if (open) resetForm(); }}
    >
      <ModalContent>
        <ModalHeader>
          {t('classes.editClassTitle', 'Edit {{name}} - {{section}}', { name: classData?.name, section: classData?.section })}
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label={t('classes.section', 'Section')}
            value={editFormData.section}
            isReadOnly
            variant="bordered"
            size="sm"
            description={t('classes.sectionReadonlyDescription', 'Section cannot be changed after creation')}
          />
          <Input
            label={t('classes.classCapacity', 'Class Capacity')}
            type="number"
            value={editFormData.strengthLimit}
            onValueChange={(val) => setEditFormData(prev => ({ ...prev, strengthLimit: val }))}
            isInvalid={!!editErrors.strengthLimit}
            errorMessage={editErrors.strengthLimit}
            isRequired
            variant="bordered"
            size="sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('classes.room', 'Room')}
              value={editFormData.room}
              onValueChange={(val) => setEditFormData(prev => ({ ...prev, room: val }))}
              variant="bordered"
              size="sm"
            />
            <Input
              label={t('classes.block', 'Block')}
              value={editFormData.block}
              onValueChange={(val) => setEditFormData(prev => ({ ...prev, block: val }))}
              variant="bordered"
              size="sm"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isEditing}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button color="primary" onPress={handleSaveEdit} isLoading={isEditing}>
            {t('common.saveChanges', 'Save Changes')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

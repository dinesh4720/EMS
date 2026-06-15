import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import { useApp } from "../../../context/AppContext";
import { editClassSchema } from "../../../validators/formSchemas";
import useZodForm from "../../../hooks/useZodForm";

export function EditClassModal({ isOpen, onClose, classData }) {
  const { t } = useTranslation();
  const { updateClass, refetch } = useApp();

  const defaultValues = useMemo(
    () => ({
      section: classData?.section || '',
      strengthLimit: String(classData?.strengthLimit?.current || classData?.strengthLimit?.default || ''),
      room: classData?.room || '',
      block: classData?.block || '',
    }),
    [classData]
  );

  const {
    control,
    handleSubmit,
    reset,
    errors,
    isSubmitting,
    onInvalid,
  } = useZodForm(editClassSchema, { defaultValues });

  // Reset form when classData changes (modal opens with new class)
  const handleOpenChange = (open) => {
    if (open) reset(defaultValues);
  };

  const onSubmit = async (data) => {
    try {
      const capacity = parseInt(data.strengthLimit, 10);
      await updateClass(classData.id, {
        strengthLimit: { current: capacity, default: capacity },
        ...(data.room !== undefined && { room: data.room }),
        ...(data.block !== undefined && { block: data.block }),
      });
      toast.success(t('toast.success.classUpdated', `Class ${classData.name}-${classData.section} updated`));
      onClose();
      if (refetch) await refetch(true);
    } catch (error) {
      toast.error(error.message || t('toast.error.updateClassFailed', 'Failed to update class'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      onOpenChange={handleOpenChange}
    >
      <ModalContent>
        <ModalHeader>
          {t('classes.editClassTitle', 'Edit {{name}} - {{section}}', { name: classData?.name, section: classData?.section })}
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Controller
            control={control}
            name="section"
            render={({ field }) => (
              <Input
                label={t('classes.section', 'Section')}
                value={field.value || ''}
                isReadOnly
                variant="bordered"
                size="sm"
                description={t('classes.sectionReadonlyDescription', 'Section cannot be changed after creation')}
              />
            )}
          />
          <Controller
            control={control}
            name="strengthLimit"
            render={({ field }) => (
              <Input
                label={t('classes.classCapacity', 'Class Capacity')}
                type="number"
                value={field.value || ''}
                onValueChange={field.onChange}
                isInvalid={!!errors.strengthLimit}
                errorMessage={errors.strengthLimit?.message}
                isRequired
                variant="bordered"
                size="sm"
              />
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="room"
              render={({ field }) => (
                <Input
                  label={t('classes.room', 'Room')}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  isInvalid={!!errors.room}
                  errorMessage={errors.room?.message}
                  variant="bordered"
                  size="sm"
                />
              )}
            />
            <Controller
              control={control}
              name="block"
              render={({ field }) => (
                <Input
                  label={t('classes.block', 'Block')}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  isInvalid={!!errors.block}
                  errorMessage={errors.block?.message}
                  variant="bordered"
                  size="sm"
                />
              )}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button color="primary" onPress={handleSubmit(onSubmit, onInvalid)} isLoading={isSubmitting}>
            {t('common.saveChanges', 'Save Changes')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

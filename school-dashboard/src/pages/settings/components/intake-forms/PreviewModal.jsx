import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

const PreviewModal = ({ isOpen, onClose, previewForm, renderFieldPreview }) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader><h2 className="text-xl font-semibold">Form Preview: {previewForm?.name}</h2></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {previewForm?.fieldData?.map((field) => (
              <div key={field.id}>{renderFieldPreview(field)}</div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>{t('pages.close2')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PreviewModal;

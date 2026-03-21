import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TemplatePicker({ isOpen, onClose, templates, onSelect }) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>{t('settings.intakeForms.addForm', 'Choose a Template')}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                isPressable
                onPress={() => onSelect(template)}
                className="hover:border-primary transition-all"
              >
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>
                      {template.id !== "blank" && (
                        <Chip size="sm" variant="flat" color="primary">
                          {template.template.fields.length} {t('settings.intakeForms.fields', 'fields')}
                        </Chip>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import { FileText } from "lucide-react";

const TemplateSelectionModal = ({ isOpen, onClose, formTemplates, onSelectTemplate, t }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>{t('pages.chooseATemplate')}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formTemplates.map((template) => (
              <Card
                key={template.id}
                isPressable
                onPress={() => onSelectTemplate(template)}
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
                      <p className="text-sm text-fg-muted mb-3">
                        {template.description}
                      </p>
                      {template.id !== "blank" && (
                        <Chip size="sm" variant="flat" color="primary">
                          {template.template.fields.length} fields
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
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TemplateSelectionModal;

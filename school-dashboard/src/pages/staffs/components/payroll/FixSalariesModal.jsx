import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Spinner
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function FixSalariesModal({
  isOpen,
  onOpenChange,
  fixingSalaries,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-warning-100 rounded-lg">
            <AlertTriangle className="text-warning-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('pages.fixSalaries1')}</h3>
            <p className="text-sm text-default-500">{t('confirm.setDefaultSalary')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
            <p className="text-sm text-warning-800">
              This will set default salary values for staff members who do not have salary information configured.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onOpenChange(false)}>Cancel</Button>
          <Button color="warning" onPress={onConfirm} isDisabled={fixingSalaries}>
            {fixingSalaries ? <Spinner size="sm" color="white" /> : 'Confirm Fix Salaries'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

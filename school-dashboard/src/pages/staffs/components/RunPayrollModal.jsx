import { useTranslation } from "react-i18next";
import {
  Button, Spinner,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
} from "@heroui/react";
import { AlertCircle } from "lucide-react";

export default function RunPayrollModal({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  months,
  preparingRecords,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md" isDismissable={!preparingRecords}>
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-warning-100 rounded-lg">
            <AlertCircle className="text-warning-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('staff.payroll.prepareSalaryRecords')}</h3>
            <p className="text-sm text-default-500">{t('staff.payroll.prepareSalaryDesc')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-default-50 rounded-lg p-4">
              <p className="text-sm text-default-600 mb-2">{t('staff.payroll.aboutToGenerateFor')}</p>
              <p className="text-lg font-semibold text-default-900">{months[selectedMonth - 1]} {selectedYear}</p>
            </div>
            <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
              <p className="text-sm text-warning-800">
                <strong>{t('staff.payroll.noteLabel')}</strong> {t('staff.payroll.generateNote')}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onClose(false)}>
            {t('common.cancel')}
          </Button>
          <Button color="primary" onPress={onConfirm} isDisabled={preparingRecords}>
            {preparingRecords ? <Spinner size="sm" color="white" /> : t('staff.payroll.confirmGenerate')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

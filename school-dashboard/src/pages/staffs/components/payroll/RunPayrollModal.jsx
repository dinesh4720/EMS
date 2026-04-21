import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Spinner
} from "@heroui/react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function RunPayrollModal({
  isOpen,
  onOpenChange,
  preparingRecords,
  selectedMonth,
  selectedYear,
  months,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-warning-100 rounded-lg">
            <AlertCircle className="text-warning-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('pages.prepareSalaryRecords1')}</h3>
            <p className="text-sm text-default-500">{t('pages.thisWillGeneratePayrollRecordsForAllActiveStaff')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-default-50 rounded-lg p-4">
              <p className="text-sm text-default-600 mb-2">{t('pages.youAreAboutToGenerateRecordsFor')}</p>
              <p className="text-lg font-semibold text-default-900">{months[selectedMonth - 1]} {selectedYear}</p>
            </div>
            <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
              <p className="text-sm text-warning-800">
                <strong>{t('pages.note1')}</strong> This step only generates the salary breakdown. You will need to manually log the payment status afterwards.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="primary" onPress={onConfirm} isDisabled={preparingRecords}>
            {preparingRecords ? <Spinner size="sm" color="white" /> : 'Confirm & Generate'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

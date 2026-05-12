import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Spinner
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" className="payroll-modal">
      <ModalContent>
        <ModalHeader>
          <div className="payroll-modal__head">
            <div className="payroll-modal__icon payroll-modal__icon--warn">
              <AlertCircle size={18} aria-hidden />
            </div>
            <div>
              <h3 className="payroll-modal__title">{t('pages.prepareSalaryRecords1')}</h3>
              <p className="payroll-modal__sub">
                {t('pages.thisWillGeneratePayrollRecordsForAllActiveStaff')}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="payroll-modal__cycle">
              <span className="payroll-modal__cycle-label">
                {t('pages.youAreAboutToGenerateRecordsFor')}
              </span>
              <span className="payroll-modal__cycle-value">
                {months[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <div className="payroll-modal__note payroll-modal__note--warn">
              <AlertCircle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>{t('pages.note1')}</strong> This step only generates the salary breakdown.
                You will need to manually log the payment status afterwards.
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={onConfirm}
            disabled={preparingRecords}
          >
            {preparingRecords ? <Spinner size="sm" color="white" /> : 'Confirm & generate'}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

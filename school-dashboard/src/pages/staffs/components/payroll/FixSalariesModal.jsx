import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Spinner
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" className="payroll-modal">
      <ModalContent>
        <ModalHeader>
          <div className="payroll-modal__head">
            <div className="payroll-modal__icon payroll-modal__icon--warn">
              <AlertTriangle size={18} aria-hidden />
            </div>
            <div>
              <h3 className="payroll-modal__title">{t('pages.fixSalaries1')}</h3>
              <p className="payroll-modal__sub">{t('confirm.setDefaultSalary')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="payroll-modal__note payroll-modal__note--warn">
            <AlertTriangle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              This will set default salary values for staff members who do not have
              salary information configured. Existing salaries are not changed.
            </span>
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
            disabled={fixingSalaries}
            style={{ background: 'var(--warn)', borderColor: 'var(--warn)' }}
          >
            {fixingSalaries ? <Spinner size="sm" color="white" /> : 'Confirm fix'}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

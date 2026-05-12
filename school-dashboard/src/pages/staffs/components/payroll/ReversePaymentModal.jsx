import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Spinner, Textarea
} from "@heroui/react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function ReversePaymentModal({
  isOpen,
  onOpenChange,
  reversing,
  reverseReason,
  setReverseReason,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" className="payroll-modal">
      <ModalContent>
        <ModalHeader>
          <div className="payroll-modal__head">
            <div className="payroll-modal__icon payroll-modal__icon--danger">
              <RotateCcw size={18} aria-hidden />
            </div>
            <div>
              <h3 className="payroll-modal__title">{t('pages.reversePayment1')}</h3>
              <p className="payroll-modal__sub">
                {t('pages.unlockAndResetPaymentStatus')}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="payroll-modal__note payroll-modal__note--danger">
              <AlertTriangle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>{t('pages.warning')}</strong> This unlocks the record and resets its
                status to <span className="chip chip--info">Generated</span>. You will need
                to log the payment again. The reversal is captured in the audit trail.
              </span>
            </div>
            <Textarea
              label="Reason for reversal *"
              placeholder={t('pages.pleaseExplainWhyThisPaymentIsBeingReversed')}
              value={reverseReason}
              onValueChange={setReverseReason}
              variant="bordered"
              minRows={3}
              isRequired
            />
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
            disabled={reversing || !reverseReason.trim()}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            {reversing ? <Spinner size="sm" color="white" /> : 'Confirm reversal'}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea
} from "@heroui/react";
import { CreditCard, AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function BulkPayModal({
  isOpen,
  onOpenChange,
  pendingBulkPay,
  paymentForm,
  setPaymentForm,
  onConfirm,
}) {
  const { t } = useTranslation();
  const count = pendingBulkPay?.count || 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" className="payroll-modal">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div className="payroll-modal__head">
                <div className="payroll-modal__icon payroll-modal__icon--ok">
                  <CreditCard size={18} aria-hidden />
                </div>
                <div>
                  <h3 className="payroll-modal__title">{t('pages.logBulkPayments1')}</h3>
                  <p className="payroll-modal__sub">
                    Processing <span className="mono tnum">{count}</span> records
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="payroll-modal__note payroll-modal__note--default">
                <AlertCircle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  You're about to record payments for <strong className="mono tnum">{count}</strong>{' '}
                  staff members. Any individual failures are reported in the result toast.
                </span>
              </div>

              <Select
                label={t('pages.paymentMethod1')}
                selectedKeys={new Set([paymentForm.paymentMethod])}
                onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMethod: Array.from(keys)[0] })}
                variant="bordered"
              >
                <SelectItem key="bank_transfer" textValue="Bank Transfer">{t('pages.bankTransfer1')}</SelectItem>
                <SelectItem key="cash" textValue="Cash">{t('pages.cash1')}</SelectItem>
                <SelectItem key="cheque" textValue="Cheque">{t('pages.cheque1')}</SelectItem>
                <SelectItem key="online" textValue="Online Payment">{t('pages.onlinePayment1')}</SelectItem>
              </Select>

              <Input
                label="Payment reference / batch ID"
                placeholder={t('staff.payroll.batchIdPlaceholder')}
                value={paymentForm.paymentReference}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentReference: v })}
                variant="bordered"
                description="Applied to all selected records"
              />

              <Textarea
                label={t('pages.notesOptional1')}
                placeholder={t('pages.additionalNotesForThisBatch')}
                value={paymentForm.notes}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                variant="bordered"
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--accent"
                onClick={onConfirm}
                style={{ background: 'var(--ok)', borderColor: 'var(--ok)' }}
              >
                Log <span className="mono tnum">{count}</span> payments
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

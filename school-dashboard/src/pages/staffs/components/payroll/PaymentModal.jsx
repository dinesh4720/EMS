import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea
} from "@heroui/react";
import { CreditCard } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function PaymentModal({
  isOpen,
  onOpenChange,
  paymentForm,
  setPaymentForm,
  onConfirm,
}) {
  const { t } = useTranslation();

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
                  <h3 className="payroll-modal__title">{t('pages.logPaymentDetails1')}</h3>
                  <p className="payroll-modal__sub">Record how this payment was settled.</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
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
                label={t('pages.paymentReference1')}
                placeholder={t('staff.payroll.paymentReferencePlaceholder')}
                value={paymentForm.paymentReference}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentReference: v })}
                variant="bordered"
              />
              <Textarea
                label={t('pages.notesOptional1')}
                placeholder={t('pages.additionalNotes1')}
                value={paymentForm.notes}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                variant="bordered"
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                {t('pages.cancel2')}
              </button>
              <button
                type="button"
                className="btn btn--accent"
                onClick={onConfirm}
                style={{ background: 'var(--ok)', borderColor: 'var(--ok)' }}
              >
                Record payment
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

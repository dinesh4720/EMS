import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea
} from "@heroui/react";
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{t('pages.logPaymentDetails1')}</ModalHeader>
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
              <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
              <Button color="success" onPress={onConfirm}>
                Record Payment
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

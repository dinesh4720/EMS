import { useTranslation } from "react-i18next";
import {
  Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea
} from "@heroui/react";

export default function PaymentRecordModal({
  isOpen,
  onClose,
  paymentForm,
  setPaymentForm,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
      <ModalContent>
        {(onCloseInner) => (
          <>
            <ModalHeader>{t('staff.payroll.logPaymentDetails')}</ModalHeader>
            <ModalBody className="gap-4">
              <Select
                label={t('staff.payroll.paymentMethod')}
                selectedKeys={new Set([paymentForm.paymentMethod])}
                onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMethod: Array.from(keys)[0] })}
                variant="bordered"
              >
                <SelectItem key="bank_transfer" textValue={t('staff.payroll.bankTransfer')}>{t('staff.payroll.bankTransfer')}</SelectItem>
                <SelectItem key="cash" textValue={t('staff.payroll.cash')}>{t('staff.payroll.cash')}</SelectItem>
                <SelectItem key="cheque" textValue={t('staff.payroll.cheque')}>{t('staff.payroll.cheque')}</SelectItem>
                <SelectItem key="online" textValue={t('staff.payroll.onlinePayment')}>{t('staff.payroll.onlinePayment')}</SelectItem>
              </Select>
              <Input
                label={t('staff.payroll.paymentReference')}
                placeholder={t('staff.payroll.paymentReferencePlaceholder')}
                value={paymentForm.paymentReference}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentReference: v })}
                variant="bordered"
              />
              <Textarea
                label={t('staff.payroll.notesOptional')}
                placeholder={t('staff.payroll.additionalNotes')}
                value={paymentForm.notes}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                variant="bordered"
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCloseInner}>{t('common.cancel')}</Button>
              <Button color="success" onPress={onConfirm}>
                {t('staff.payroll.recordPayment')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

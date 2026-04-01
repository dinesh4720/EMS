import { useTranslation } from "react-i18next";
import {
  Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Textarea
} from "@heroui/react";
import { CreditCard } from "lucide-react";

export default function BulkPayModal({
  isOpen,
  onClose,
  pendingBulkPay,
  paymentForm,
  setPaymentForm,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md" isDismissable={!pendingBulkPay?.processing}>
      <ModalContent>
        {(onCloseInner) => (
          <>
            <ModalHeader className="flex gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <CreditCard className="text-success-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('staff.payroll.logBulkPayments')}</h3>
                <p className="text-sm text-default-500">{t('staff.payroll.processingRecords', { count: pendingBulkPay?.count || 0 })}</p>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
               <div className="bg-default-50 rounded-lg p-3 mb-2">
                  <p className="text-sm text-default-600">
                    {t('staff.payroll.aboutToRecordPayments', { count: pendingBulkPay?.count || 0 })}
                  </p>
               </div>

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
                label={t('staff.payroll.paymentReferenceBatchId')}
                placeholder={t('staff.payroll.batchIdPlaceholder')}
                value={paymentForm.paymentReference}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentReference: v })}
                variant="bordered"
                description={t('staff.payroll.appliedToAllRecords')}
              />

              <Textarea
                label={t('staff.payroll.notesOptional')}
                placeholder={t('staff.payroll.batchNotes')}
                value={paymentForm.notes}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                variant="bordered"
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCloseInner}>
                {t('common.cancel')}
              </Button>
              <Button color="success" onPress={onConfirm}>
                {t('staff.payroll.logPayments')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

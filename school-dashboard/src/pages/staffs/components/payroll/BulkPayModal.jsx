import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea
} from "@heroui/react";
import { CreditCard } from "lucide-react";
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

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <CreditCard className="text-success-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('pages.logBulkPayments1')}</h3>
                <p className="text-sm text-default-500">Processing {pendingBulkPay?.count || 0} records</p>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="bg-default-50 rounded-lg p-3 mb-2">
                <p className="text-sm text-default-600">
                  You are about to record payments for <strong>{pendingBulkPay?.count || 0}</strong> staff members.
                </p>
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
                label="Payment Reference / Batch ID"
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
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="success" onPress={onConfirm}>
                Log Payments
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

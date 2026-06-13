import { useTranslation } from "react-i18next";
import {
  Button, Spinner,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea
} from "@heroui/react";
import { RotateCcw } from "lucide-react";

export default function ReversePaymentModal({
  isOpen,
  onClose,
  reverseReason,
  setReverseReason,
  reversing,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md" isDismissable={!reversing}>
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-warn-bg rounded-lg">
            <RotateCcw className="text-warn" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('staff.payroll.reversePayment')}</h3>
            <p className="text-sm text-fg-muted">{t('staff.payroll.reversePaymentDesc')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-warn-bg rounded-lg p-4 border border-warn/20">
              <p className="text-sm text-warn">
                <strong>{t('staff.payroll.warningLabel')}</strong> {t('staff.payroll.reverseWarning')}
              </p>
            </div>
            <Textarea
              label={t('staff.payroll.reasonForReversal')}
              placeholder={t('staff.payroll.reversalPlaceholder')}
              value={reverseReason}
              onValueChange={setReverseReason}
              variant="bordered"
              minRows={3}
              isRequired
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onClose(false)}>
            {t('common.cancel')}
          </Button>
          <Button className="bg-warn text-surface hover:bg-warn/90" onPress={onConfirm} isDisabled={reversing || !reverseReason.trim()}>
            {reversing ? <Spinner size="sm" color="white" /> : t('staff.payroll.confirmReversal')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

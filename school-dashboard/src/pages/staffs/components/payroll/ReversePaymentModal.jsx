import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Spinner, Textarea
} from "@heroui/react";
import { RotateCcw } from "lucide-react";
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-warning-100 rounded-lg">
            <RotateCcw className="text-warning-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('pages.reversePayment1')}</h3>
            <p className="text-sm text-default-500">{t('pages.unlockAndResetPaymentStatus')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
              <p className="text-sm text-warning-800">
                <strong>{t('pages.warning')}</strong> This will unlock the record and reset its status to "Generated". You will need to log the payment again.
              </p>
            </div>
            <Textarea
              label="Reason for Reversal *"
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
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="warning" onPress={onConfirm} isDisabled={reversing || !reverseReason.trim()}>
            {reversing ? <Spinner size="sm" color="white" /> : 'Confirm Reversal'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

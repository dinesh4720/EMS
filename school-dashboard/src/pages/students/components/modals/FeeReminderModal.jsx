import { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Textarea
} from "@heroui/react";
import { MessageSquare, User, Phone, Mail, Send } from "lucide-react";
import { request } from "../../../../services/api";
import { useApp } from "../../../../context/AppContext";
import toast from "react-hot-toast";

export default function FeeReminderModal({ isOpen, onClose, student, studentFeeStructure }) {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderSending, setReminderSending] = useState(false);

  // Generate default message when modal opens
  const handleOpenChange = (open) => {
    if (open) {
      const hasOutstanding = (studentFeeStructure?.totalBalance || 0) > 0;
      const schoolName = schoolSettings?.name || schoolSettings?.schoolName || t('common.school', 'School');

      let defaultMessage = "";
      if (hasOutstanding) {
        defaultMessage = `Dear ${student?.parentName || 'Parent'}, this is a reminder that fee payment of ₹${studentFeeStructure?.totalBalance?.toLocaleString() || 0} is pending for ${student?.name}. Please pay at your earliest convenience. - ${schoolName}`;
      } else {
        defaultMessage = `Dear ${student?.parentName || 'Parent'}, thank you for the fee payment of ₹${studentFeeStructure?.totalPaid?.toLocaleString() || 0} for ${student?.name}. - ${schoolName}`;
      }

      setReminderMessage(defaultMessage);
    }
    if (!open) {
      onClose();
    }
  };

  const handleSendReminderMessage = async () => {
    if (!reminderMessage.trim()) {
      toast.error(t('students.profile.overview.enterMessage', 'Please enter a message'));
      return;
    }

    setReminderSending(true);
    try {
      await request(`/students/${student?.id}/send-reminder`, {
        method: 'POST',
        body: JSON.stringify({
          message: reminderMessage,
          parentPhone: student?.parentPhone,
          parentEmail: student?.parentEmail,
          studentName: student?.name
        })
      });

      toast.success(t('students.profile.overview.reminderSentTo', 'Reminder sent to {{name}}', { name: student?.parentName || 'parent' }));
      onClose();
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error(t('students.profile.overview.reminderSendFailed', 'Failed to send reminder') + ': ' + (error.message || t('students.profile.overview.unknownError', 'Unknown error')));
    } finally {
      setReminderSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onOpenChange={handleOpenChange}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MessageSquare size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('students.profile.overview.sendFeeReminder', 'Send Fee Reminder')}</h3>
              <p className="text-xs text-default-500">
                {(studentFeeStructure?.totalBalance || 0) > 0
                  ? t('students.profile.overview.outstandingFeeReminder', 'Outstanding fee payment reminder')
                  : t('students.profile.overview.feePaymentAcknowledgment', 'Fee payment acknowledgment')
                }
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Parent Contact Info */}
            <div className="p-4 bg-default-50 rounded-lg border border-default-200">
              <p className="text-xs font-semibold text-default-500 uppercase mb-2">{t('students.profile.overview.parentContactInformation', 'Parent Contact Information')}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-default-500" />
                  <span className="font-medium">{student?.parentName || 'N/A'}</span>
                </div>
                {student?.parentPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-default-500" />
                    <span>{student.parentPhone}</span>
                  </div>
                )}
                {student?.parentEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-default-500" />
                    <span>{student.parentEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Status */}
            <div className={`p-4 rounded-lg border ${
              (studentFeeStructure?.totalBalance || 0) > 0
                ? 'bg-warning-50 border-warning-200'
                : 'bg-success-50 border-success-200'
            }`}>
              {(studentFeeStructure?.totalBalance || 0) > 0 ? (
                <>
                  <p className="text-xs font-semibold text-warning-700 uppercase mb-1">{t('students.profile.overview.outstandingAmount', 'Outstanding Amount')}</p>
                  <p className="text-2xl font-bold text-warning-900">
                    ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-success-700 uppercase mb-1">{t('students.profile.overview.totalFeesPaidTillDate', 'Total Fees Paid Till Date')}</p>
                  <p className="text-2xl font-bold text-success-900">
                    ₹{studentFeeStructure?.totalPaid?.toLocaleString() || 0}
                  </p>
                </>
              )}
            </div>

            {/* Message Template */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-default-700">{t('students.profile.overview.message', 'Message')}</label>
              <Textarea
                value={reminderMessage}
                onValueChange={setReminderMessage}
                minRows={5}
                variant="bordered"
                placeholder={t('students.profile.overview.enterYourMessage', 'Enter your message...')}
                description={`${reminderMessage.length}/500 characters`}
                maxLength={500}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
            isDisabled={reminderSending}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            color="primary"
            onPress={handleSendReminderMessage}
            isDisabled={reminderSending || !reminderMessage.trim()}
            isLoading={reminderSending}
            startContent={!reminderSending && <Send size={18} />}
          >
            {reminderSending ? t('students.profile.overview.sending', 'Sending...') : t('students.profile.overview.sendReminderBtn', 'Send Reminder')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

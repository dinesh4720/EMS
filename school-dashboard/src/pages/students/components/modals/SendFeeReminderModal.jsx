import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, RadioGroup, Radio } from "@heroui/react";
import { Send, User, Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

// TODO: AUDIT-103 - This modal is a DUPLICATE of FeeReminderModal.jsx and ReminderModal.jsx.
// All three do the same thing (send fee reminders). Consolidate into a single component.
// FeeReminderModal and ReminderModal use real API calls; this one uses a FAKE simulated API.
// Recommendation: Keep FeeReminderModal (most complete), delete this file and ReminderModal,
// and update all imports to use the single consolidated modal.

/**
 * SendFeeReminderModal - Modal for sending fee reminder to parents
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student whose parent will receive reminder
 */
export default function SendFeeReminderModal({ isOpen, onClose, student }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState(
    `Dear Parent, this is a reminder that fee payment for ${student?.name || "your child"} is pending. Please clear the dues at the earliest.`
  );
  const [channel, setChannel] = useState("both");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t('toast.error.pleaseEnterAReminderMessage'));
      return;
    }

    setIsSending(true);
    const loadingToast = toast.loading(t('toast.loading.sendingReminder'));

    try {
      // TODO: AUDIT-103 - FAKE API: This just simulates a delay with no real backend call.
      // Replace with actual API call: request(`/students/${student.id}/send-reminder`, { method: 'POST', body: ... })
      // See FeeReminderModal.jsx for a working implementation.
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Reminder sent to ${student?.parentName || 'parent'} via ${channel}`, { id: loadingToast });
      onClose();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>{t('pages.sendFeeReminder1')}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* To: Recipient Info */}
            <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase mb-2">To</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400 dark:text-zinc-500" />
                  <span className="font-medium text-gray-900 dark:text-zinc-100">{student?.parentName || "N/A"}</span>
                </div>
                {student?.parentPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                    <Phone size={14} className="text-gray-400 dark:text-zinc-500" />
                    <span>{student.parentPhone}</span>
                  </div>
                )}
                {student?.parentEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                    <Mail size={14} className="text-gray-400 dark:text-zinc-500" />
                    <span>{student.parentEmail}</span>
                  </div>
                )}
                {!student?.parentPhone && !student?.parentEmail && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">No contact details available</p>
                )}
              </div>
            </div>

            {/* Channel Selection */}
            <div>
              <RadioGroup
                label="Send via"
                orientation="horizontal"
                value={channel}
                onValueChange={setChannel}
                size="sm"
                classNames={{ label: "text-sm font-medium text-gray-700 dark:text-zinc-300" }}
              >
                <Radio value="sms" isDisabled={!student?.parentPhone}>SMS</Radio>
                <Radio value="email" isDisabled={!student?.parentEmail}>Email</Radio>
                <Radio value="both" isDisabled={!student?.parentPhone && !student?.parentEmail}>Both</Radio>
              </RadioGroup>
            </div>

            <Textarea
              label={t('pages.reminderMessage')}
              placeholder={t('pages.enterReminderMessage')}
              minRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="bordered"
              isRequired
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" className="border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button className="bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900" startContent={<Send size={16} />} onPress={handleSend} isLoading={isSending}>{t('pages.sendReminder1')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

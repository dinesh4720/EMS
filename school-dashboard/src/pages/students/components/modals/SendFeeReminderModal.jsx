import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

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
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t('toast.error.pleaseEnterAReminderMessage'));
      return;
    }

    setIsSending(true);
    const loadingToast = toast.loading(t('toast.loading.sendingReminder'));

    try {
      // Here you would integrate with your SMS/email service
      // For now, just simulate the call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Reminder sent to ${student?.parentName || 'parent'}`, { id: loadingToast });
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
      <ModalHeader>{t('pages.sendFeeReminder1')}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-zinc-400">Parent: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student?.parentName || "N/A"}</span></p>
            <p className="text-sm text-gray-600 dark:text-zinc-400">Phone: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student?.parentPhone || "N/A"}</span></p>
            <p className="text-sm text-gray-600 dark:text-zinc-400">Email: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student?.parentEmail || "N/A"}</span></p>
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
    </Modal>
  );
}

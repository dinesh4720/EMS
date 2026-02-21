import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

/**
 * SendFeeReminderModal - Modal for sending fee reminder to parents
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student whose parent will receive reminder
 */
export default function SendFeeReminderModal({ isOpen, onClose, student }) {
  const [message, setMessage] = useState(
    `Dear Parent, this is a reminder that fee payment for ${student?.name || "your child"} is pending. Please clear the dues at the earliest.`
  );
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a reminder message");
      return;
    }

    setIsSending(true);
    const loadingToast = toast.loading("Sending reminder...");

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
      <ModalHeader>Send Fee Reminder</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Parent: <span className="font-semibold text-gray-900">{student?.parentName || "N/A"}</span></p>
            <p className="text-sm text-gray-600">Phone: <span className="font-semibold text-gray-900">{student?.parentPhone || "N/A"}</span></p>
            <p className="text-sm text-gray-600">Email: <span className="font-semibold text-gray-900">{student?.parentEmail || "N/A"}</span></p>
          </div>

          <Textarea
            label="Reminder Message"
            placeholder="Enter reminder message..."
            minRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="bordered"
            isRequired
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="bordered" className="border-gray-200 text-gray-700" onPress={onClose}>Cancel</Button>
        <Button className="bg-gray-900 hover:bg-gray-800 text-white" startContent={<Send size={16} />} onPress={handleSend} isLoading={isSending}>Send Reminder</Button>
      </ModalFooter>
    </Modal>
  );
}

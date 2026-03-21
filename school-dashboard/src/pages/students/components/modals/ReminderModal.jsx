import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { MessageSquare, User, Phone, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";

/**
 * ReminderModal - Modal for sending fee reminders to parents
 *
 * Props:
 * - isOpen: boolean - Whether the modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student whose parent will receive the reminder
 * - studentFeeStructure: object - Fee structure with totalBalance and totalPaid
 * - onSend: function - Called after successful send (optional)
 */
export default function ReminderModal({ isOpen, onClose, student, studentFeeStructure, onSend }) {
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderSending, setReminderSending] = useState(false);

  const handleClose = () => {
    setReminderMessage("");
    onClose();
  };

  const handleSendReminderMessage = async () => {
    if (!reminderMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setReminderSending(true);
    const loadingToast = toast.loading("Sending reminder...");

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messaging/send-reminder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: reminderMessage,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          studentName: student.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      toast.success("Reminder sent successfully", { id: loadingToast });
      setReminderMessage("");

      if (onSend) {
        onSend();
      }
      onClose();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder. Please try again.", { id: loadingToast });
    } finally {
      setReminderSending(false);
    }
  };

  const hasOutstandingFees = (studentFeeStructure?.totalBalance || 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
    >
      <ModalContent className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800">
        <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-zinc-100 font-medium">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MessageSquare size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Send Fee Reminder</h3>
              <p className="text-xs text-default-500">
                {hasOutstandingFees
                  ? "Outstanding fee payment reminder"
                  : "Fee payment acknowledgment"
                }
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Parent Contact Info - Gray container */}
            <div className="p-4 bg-default-50 rounded-lg border border-default-200">
              <p className="text-xs font-semibold text-default-500 uppercase mb-2">Parent Contact Information</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-default-500" />
                  <span className="font-medium">{student.parentName || 'N/A'}</span>
                </div>
                {student.parentPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-default-500" />
                    <span>{student.parentPhone}</span>
                  </div>
                )}
                {student.parentEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-default-500" />
                    <span>{student.parentEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Status - Gray container with conditional coloring */}
            <div className={`p-4 rounded-lg border ${
              hasOutstandingFees
                ? 'bg-warning-50 border-warning-200'
                : 'bg-success-50 border-success-200'
            }`}>
              {hasOutstandingFees ? (
                <>
                  <p className="text-xs font-semibold text-warning-700 uppercase mb-1">Outstanding Amount</p>
                  <p className="text-2xl font-bold text-warning-900">
                    ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-success-700 uppercase mb-1">Total Fees Paid Till Date</p>
                  <p className="text-2xl font-bold text-success-900">
                    ₹{studentFeeStructure?.totalPaid?.toLocaleString() || 0}
                  </p>
                </>
              )}
            </div>

            {/* Message Template */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-default-700">Message</label>
              <Textarea
                value={reminderMessage}
                onValueChange={setReminderMessage}
                minRows={5}
                variant="bordered"
                placeholder="Enter your message..."
                description={`${reminderMessage.length}/500 characters`}
                maxLength={500}
                classNames={{
                  input: "border border-gray-200 dark:border-zinc-800 focus:border-gray-300 dark:focus:border-zinc-600"
                }}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={reminderSending}
            className="border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSendReminderMessage}
            isDisabled={reminderSending || !reminderMessage.trim()}
            isLoading={reminderSending}
            startContent={!reminderSending && <Send size={18} />}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {reminderSending ? 'Sending...' : 'Send Reminder'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

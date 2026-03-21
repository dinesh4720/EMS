import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";
import { useApp } from "../../../../context/AppContext";

/**
 * PaymentModal - Modal for recording fee payments
 *
 * Props:
 * - isOpen: boolean - Whether the modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student being paid for
 * - studentFeeStructure: object - Fee structure with totalBalance
 * - onPaymentComplete: function - Called after successful payment
 */
export default function PaymentModal({ isOpen, onClose, student, studentFeeStructure, onPaymentComplete }) {
  const { currentAcademicYear } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "cash",
    date: new Date().toISOString().split('T')[0]
  });

  // Auto-populate with outstanding amount only when modal first opens (not on every balance change)
  useEffect(() => {
    if (isOpen) {
      setPaymentForm({
        amount: studentFeeStructure?.totalBalance ? studentFeeStructure.totalBalance.toString() : "",
        paymentMode: "cash",
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMode) {
      toast.error("Please enter amount and select payment method");
      return;
    }

    const paymentAmount = parseInt(paymentForm.amount);
    if (paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Processing payment...");

    try {
      // Import api dynamically to avoid circular dependencies
      const { api } = await import("../../../../services/api");

      const paymentData = {
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        academicYear: student?.academicYear || currentAcademicYear,
        paymentDate: paymentForm.date,
        amount: paymentAmount,
        paymentMode: paymentForm.paymentMode,
        feeHeads: [{
          period: new Date(paymentForm.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          amount: paymentAmount
        }],
        remarks: `Fee payment via ${paymentForm.paymentMode}`,
        collectedBy: null
      };

      await api.post(`/students/${student.id}/fee-payment`, paymentData);

      toast.success("Payment recorded successfully", { id: loadingToast });

      if (onPaymentComplete) {
        onPaymentComplete();
      }
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to record payment: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (!open) {
          setPaymentForm({
            amount: "",
            paymentMode: "cash",
            date: new Date().toISOString().split('T')[0]
          });
        }
      }}
    >
      <ModalContent className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800">
        <ModalHeader className="text-gray-900 dark:text-zinc-100 font-medium">Record Fee Payment</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={paymentForm.amount}
              onValueChange={(v) => setPaymentForm({ ...paymentForm, amount: v })}
              startContent="₹"
              variant="bordered"
              classNames={{
                input: "border border-gray-200 dark:border-zinc-800 focus:border-gray-300 dark:focus:border-zinc-600"
              }}
              description={`Outstanding: ₹${studentFeeStructure?.totalBalance?.toLocaleString() || 0}`}
              isRequired
            />
            <Select
              aria-label="Payment method"
              label="Payment Method"
              placeholder="Select payment method"
              selectedKeys={[paymentForm.paymentMode]}
              onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMode: Array.from(keys)[0] })}
              variant="bordered"
              isRequired
            >
              <SelectItem key="cash">Cash</SelectItem>
              <SelectItem key="online">Online/UPI</SelectItem>
              <SelectItem key="card">Card</SelectItem>
              <SelectItem key="cheque">Cheque</SelectItem>
              <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
            </Select>
            <Input
              label="Payment Date"
              type="date"
              value={paymentForm.date}
              onValueChange={(v) => setPaymentForm({ ...paymentForm, date: v })}
              variant="bordered"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
            isDisabled={isLoading}
            className="border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleRecordPayment}
            isDisabled={!paymentForm.amount || !paymentForm.paymentMode}
            isLoading={isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Record Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


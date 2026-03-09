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
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "cash",
    date: new Date().toISOString().split('T')[0]
  });

  // Auto-populate with outstanding amount when modal opens
  useEffect(() => {
    if (isOpen && studentFeeStructure?.totalBalance) {
      setPaymentForm(prev => ({
        ...prev,
        amount: studentFeeStructure.totalBalance.toString()
      }));
    }
  }, [isOpen, studentFeeStructure?.totalBalance]);

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

      // Reset form and close
      setPaymentForm({
        amount: "",
        paymentMode: "cash",
        date: new Date().toISOString().split('T')[0]
      });

      if (onPaymentComplete) {
        onPaymentComplete();
      }
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to record payment: " + (error.message || "Unknown error"), { id: loadingToast });
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
      <ModalContent className="bg-white rounded-lg border border-gray-200">
        <ModalHeader className="text-gray-900 font-medium">Record Fee Payment</ModalHeader>
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
                input: "border border-gray-200 focus:border-gray-300"
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
            onPress={() => {
              setPaymentForm({
                amount: "",
                paymentMode: "cash",
                date: new Date().toISOString().split('T')[0]
              });
              onClose();
            }}
            className="border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleRecordPayment}
            isDisabled={!paymentForm.amount || !paymentForm.paymentMode}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Record Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


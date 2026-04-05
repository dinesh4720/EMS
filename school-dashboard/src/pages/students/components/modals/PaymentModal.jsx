import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import toast from "react-hot-toast";
import { useApp } from "../../../../context/AppContext";
import { useTranslation } from 'react-i18next';
import { toTodayDateString, formatMonthYear } from '../../../../utils/dateFormatter';
import { formatCurrency } from '../../../../utils/numberFormatter';


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
export default function PaymentModal({
  isOpen, onClose, student, studentFeeStructure, onPaymentComplete }) {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "cash",
    date: toTodayDateString(),
    notes: ""
  });

  // Auto-populate with outstanding amount only when modal first opens (not on every balance change)
  useEffect(() => {
    if (isOpen) {
      setPaymentForm({
        amount: studentFeeStructure?.totalBalance ? studentFeeStructure.totalBalance.toString() : "",
        paymentMode: "cash",
        date: toTodayDateString(),
        notes: ""
      });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecordPayment = async () => {
    const paymentAmount = parseFloat(paymentForm.amount);
    if (!paymentForm.amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      setAmountError("Please enter a valid amount greater than 0");
      return;
    }
    const totalBalance = studentFeeStructure?.totalBalance;
    if (totalBalance != null && paymentAmount > totalBalance) {
      setAmountError(`Amount exceeds outstanding balance of ${formatCurrency(totalBalance)}`);
      return;
    }
    setAmountError("");

    setIsLoading(true);
    const loadingToast = toast.loading(t('toast.loading.processingPayment'));

    try {
      // Import studentFeesApi dynamically to avoid circular dependencies
      const { studentFeesApi } = await import("../../../../services/api");

      const paymentData = {
        studentId: student.id,
        studentName: student.name,
        classId: typeof student.classId === 'object' ? student.classId._id : student.classId,
        academicYear: student?.academicYear || currentAcademicYear,
        paymentDate: paymentForm.date,
        amount: paymentAmount,
        paymentMode: paymentForm.paymentMode,
        feeHeads: [{
          period: paymentForm.date ? formatMonthYear(paymentForm.date) : '—',
          amount: paymentAmount
        }],
        remarks: paymentForm.notes.trim() || `Fee payment via ${paymentForm.paymentMode}`,
        collectedBy: null
      };

      await studentFeesApi.recordPayment(student.id, paymentData);

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
      scrollBehavior="inside"
      placement="center"
      classNames={{ wrapper: "items-end sm:items-center" }}
      onOpenChange={(open) => {
        if (!open) {
          setPaymentForm({
            amount: "",
            paymentMode: "cash",
            date: toTodayDateString(),
            notes: ""
          });
        }
      }}
    >
      <ModalContent className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 max-h-[90vh] sm:max-h-[85vh]">
        <ModalHeader className="text-gray-900 dark:text-zinc-100 font-medium">{t('pages.recordFeePayment1')}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label={t('pages.amount1')}
              type="number"
              value={paymentForm.amount}
              onValueChange={(val) => { setPaymentForm({ ...paymentForm, amount: val }); if (amountError) setAmountError(""); }}
              startContent="₹"
              variant="bordered"
              classNames={{
                input: "border border-gray-200 dark:border-zinc-800 focus:border-gray-300 dark:focus:border-zinc-600"
              }}
              description={`Outstanding: ${formatCurrency(studentFeeStructure?.totalBalance || 0)}`}
              isRequired
              isInvalid={!!amountError}
              errorMessage={amountError}
            />
            <Select
              aria-label={t('aria.inputs.paymentMethod')}
              label={t('pages.paymentMethod1')}
              placeholder={t('pages.selectPaymentMethod1')}
              selectedKeys={[paymentForm.paymentMode]}
              onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMode: Array.from(keys)[0] })}
              variant="bordered"
              isRequired
            >
              <SelectItem key="cash">{t('pages.cash1')}</SelectItem>
              <SelectItem key="online">Online/UPI</SelectItem>
              <SelectItem key="card">{t('pages.card1')}</SelectItem>
              <SelectItem key="cheque">{t('pages.cheque1')}</SelectItem>
              <SelectItem key="bank_transfer">{t('pages.bankTransfer1')}</SelectItem>
            </Select>
            <Input
              label={t('pages.paymentDate1')}
              type="date"
              value={paymentForm.date}
              onValueChange={(val) => setPaymentForm({ ...paymentForm, date: val })}
              variant="bordered"
              description="Format: DD/MM/YYYY"
            />
            <Textarea
              label={t('pages.notes', 'Notes / Memo')}
              placeholder={t('pages.enterNotes', 'Add any notes about this payment...')}
              value={paymentForm.notes}
              onValueChange={(val) => setPaymentForm({ ...paymentForm, notes: val })}
              variant="bordered"
              minRows={2}
              maxLength={300}
              description={`${paymentForm.notes.length}/300`}
            />
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              {t('pages.receiptAutoGenerated', 'Receipt number will be auto-generated upon payment.')}
            </p>
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


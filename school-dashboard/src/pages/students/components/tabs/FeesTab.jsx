import StudentFeeSummary from "../StudentFeeSummary";

/**
 * FeesTab - Tab wrapper for StudentFeeSummary component
 */
export default function FeesTab({
  studentFeeStructure,
  feeHistory,
  loadingFeeStructure,
  onRecordPayment,
  onSendReminder,
  onDownloadInvoice
}) {
  return (
    <div className="animate-fade-in">
      <StudentFeeSummary
        studentFeeStructure={studentFeeStructure}
        feeHistory={feeHistory}
        loadingFeeStructure={loadingFeeStructure}
        onRecordPayment={onRecordPayment}
        onSendReminder={onSendReminder}
        onDownloadInvoice={onDownloadInvoice}
      />
    </div>
  );
}

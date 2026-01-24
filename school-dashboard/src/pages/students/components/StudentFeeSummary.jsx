import { Button, Card, CardBody, Chip, Progress, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { IndianRupee, Mail, Download, CreditCard, CheckCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function StudentFeeSummary({
  studentFeeStructure,
  feeHistory,
  loadingFeeStructure,
  onRecordPayment,
  onSendReminder,
  onDownloadInvoice
}) {
  const navigate = useNavigate();

  const handleSendReminder = () => {
    onSendReminder();
  };

  const handleDownloadInvoice = () => {
    onDownloadInvoice();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Fee Hero Section - Enhanced with Real Data from StudentFeeStructure */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden ${
        (studentFeeStructure?.totalBalance || 0) <= 0
          ? "bg-success-50 border-success-200"
          : "bg-gradient-to-br from-danger-50 to-orange-50 border-danger-200"
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-default-600 font-medium">Total Outstanding</p>
            <h2 className="text-4xl font-bold text-default-900">
              ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
            </h2>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {(studentFeeStructure?.totalBalance || 0) <= 0 ? (
                <p className="text-xs text-success-600 bg-success-100 px-3 py-1 rounded-full inline-block font-medium">
                  All fees paid
                </p>
              ) : (studentFeeStructure?.totalBalance || 0) > 0 ? (
                <p className="text-xs text-danger-600 bg-danger-100 px-3 py-1 rounded-full inline-block font-medium">
                  Payment pending
                </p>
              ) : null}
              {studentFeeStructure?.overallStatus && (
                <p className="text-xs text-default-600 bg-white px-3 py-1 rounded-full inline-block font-medium capitalize">
                  Status: {studentFeeStructure.overallStatus}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {(studentFeeStructure?.totalBalance || 0) > 0 && (
              <>
                <Button
                  color="primary"
                  className="font-semibold shadow-sm"
                  onPress={onRecordPayment}
                  startContent={<CreditCard size={18} />}
                >
                  Collect Payment
                </Button>
                <Button
                  variant="flat"
                  color="warning"
                  className="font-medium"
                  startContent={<Mail size={18} />}
                  onPress={handleSendReminder}
                >
                  Send Reminder
                </Button>
              </>
            )}
            <Button
              variant="bordered"
              className="border-default-200 text-default-700 bg-white"
              startContent={<Download size={18} />}
              onPress={handleDownloadInvoice}
            >
              Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-default-900">Payment History</h3>
          <Button size="sm" variant="light" color="primary" onPress={() => navigate('/fees')}>View All</Button>
        </div>
        <div className="space-y-0 border border-default-200 rounded-xl divide-y divide-default-100 bg-white shadow-none max-h-[400px] overflow-y-auto">
          {feeHistory.length > 0 ? feeHistory.map((payment, idx) => (
            <div key={payment.id || idx} className="flex justify-between items-center p-4 hover:bg-default-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  payment.status === 'completed' || payment.status === 'success'
                    ? 'bg-success-50 text-success'
                    : 'bg-warning-50 text-warning'
                }`}>
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-default-900">
                    {payment.paymentPeriod || payment.feeHeads?.[0]?.period || 'Fee Payment'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-default-500">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : payment.date}
                    </p>
                    {payment.receiptNumber && (
                      <span className="text-xs text-default-400">• {payment.receiptNumber}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-default-900">₹{payment.amount?.toLocaleString() || 0}</p>
                <p className="text-xs text-default-500 capitalize">{payment.paymentMode || payment.mode}</p>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center">
              <CreditCard size={32} className="mx-auto text-default-300 mb-2" />
              <p className="text-sm text-default-500">No payment history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Heads from StudentFeeStructure */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-default-900">Applicable Fee Heads</h3>
          <div className="flex items-center gap-2">
            {studentFeeStructure && (
              <Chip size="sm" variant="flat" color="primary">
                {studentFeeStructure.feeHeads?.length || 0} Fee Heads
              </Chip>
            )}
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<BookOpen size={16} />}
              onPress={() => navigate('/settings?tab=fee-heads')}
            >
              Configure Fee Heads
            </Button>
          </div>
        </div>

        {loadingFeeStructure ? (
          <div className="p-8 text-center border border-default-200 rounded-xl bg-default-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-default-600">Loading fee structure...</p>
          </div>
        ) : studentFeeStructure && studentFeeStructure.feeHeads && studentFeeStructure.feeHeads.length > 0 ? (
          <div className="border border-default-200 rounded-xl overflow-hidden bg-white">
            <Table
              aria-label="Student Fee Heads"
              removeWrapper
              classNames={{
                th: "bg-default-50 text-default-600 font-semibold text-xs uppercase",
                td: "py-4"
              }}
            >
              <TableHeader>
                <TableColumn>FEE HEAD</TableColumn>
                <TableColumn>CATEGORY</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>PAID</TableColumn>
                <TableColumn>BALANCE</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {studentFeeStructure.feeHeads.map((feeHead, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-default-900">{feeHead.name}</p>
                        <p className="text-xs text-default-500 capitalize">{feeHead.frequency}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {feeHead.category}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-default-900">
                        ₹{feeHead.amount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-success-600">
                        ₹{feeHead.paidAmount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-warning-600">
                        ₹{feeHead.balanceAmount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          feeHead.status === 'paid' ? 'success' :
                          feeHead.status === 'partial' ? 'warning' :
                          'danger'
                        }
                      >
                        {feeHead.status === 'paid' ? 'Paid' :
                         feeHead.status === 'partial' ? 'Partial' :
                         'Pending'}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Fee Structure Summary */}
            <div className="p-4 bg-default-50 border-t border-default-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-default-500 mb-1">Total Fee</p>
                  <p className="text-lg font-bold text-default-900">
                    ₹{studentFeeStructure.totalFee?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500 mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-success-600">
                    ₹{studentFeeStructure.totalPaid?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500 mb-1">Discount</p>
                  <p className="text-lg font-bold text-purple-600">
                    ₹{studentFeeStructure.discountApplied?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500 mb-1">Balance</p>
                  <p className="text-lg font-bold text-warning-600">
                    ₹{studentFeeStructure.totalBalance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {studentFeeStructure.discountReason && (
                <div className="mt-3 pt-3 border-t border-default-200">
                  <p className="text-xs text-default-500">Discount Reason:</p>
                  <p className="text-sm text-default-700">{studentFeeStructure.discountReason}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-default-200 rounded-xl bg-default-50">
            <IndianRupee size={32} className="mx-auto text-default-300 mb-2" />
            <p className="text-sm text-default-600 mb-2">No fee structure assigned yet</p>
            <p className="text-xs text-default-500">
              Fee heads will be automatically assigned based on the student's class
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

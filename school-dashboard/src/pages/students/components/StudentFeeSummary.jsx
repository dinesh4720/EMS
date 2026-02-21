import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { IndianRupee, MoreVertical, CreditCard, Download, CheckCircle, Clock, FileText, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentFeeSummary({
  studentFeeStructure,
  feeHistory,
  loadingFeeStructure,
  onRecordPayment,
  onSendReminder,
  onDownloadInvoice
}) {
  const navigate = useNavigate();

  // Calculate payment progress percentage
  const totalFee = studentFeeStructure?.totalFee || 0;
  const totalPaid = studentFeeStructure?.totalPaid || 0;
  const progressPercent = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Payment Progress Section */}
      <div className="p-5 border border-gray-200 rounded-lg bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Outstanding Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(studentFeeStructure?.totalBalance || 0) > 0 && (
              <Button
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800"
                onPress={onRecordPayment}
                startContent={<CreditCard size={16} />}
              >
                Collect
              </Button>
            )}
            <Button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              startContent={<FileText size={16} />}
              onPress={onDownloadInvoice}
            >
              Invoice
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="px-2 py-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Fee actions">
                <DropdownItem
                  key="reminder"
                  startContent={<Bell size={16} />}
                  onPress={onSendReminder}
                >
                  Send Reminder
                </DropdownItem>
                <DropdownItem
                  key="history"
                  startContent={<Clock size={16} />}
                  onPress={() => navigate('/fees')}
                >
                  View Full History
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Payment Progress</span>
            <span>{progressPercent}% paid</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-800 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Paid: <span className="font-medium text-gray-700">₹{totalPaid.toLocaleString()}</span></span>
            <span className="text-gray-500">Total: <span className="font-medium text-gray-700">₹{totalFee.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* Payment History - Timeline View */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Payment History</h3>
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/fees')}
          >
            View All
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white max-h-[300px] overflow-y-auto">
          {feeHistory.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {feeHistory.slice(0, 5).map((payment, idx) => (
                <div key={payment.id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <CheckCircle size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.paymentPeriod || payment.feeHeads?.[0]?.period || 'Fee Payment'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : payment.date}
                        {payment.receiptNumber && <span className="ml-2">• #{payment.receiptNumber}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{payment.amount?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500 capitalize">{payment.paymentMode || payment.mode}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CreditCard size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No payment history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Heads Table */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Applicable Fee Heads</h3>
          <span className="text-xs text-gray-500">
            {studentFeeStructure?.feeHeads?.length || 0} heads
          </span>
        </div>

        {loadingFeeStructure ? (
          <div className="p-6 text-center border border-gray-200 rounded-lg bg-white">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading fee structure...</p>
          </div>
        ) : studentFeeStructure?.feeHeads?.length > 0 ? (
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Fee Head</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Paid</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-2 text-center">Status</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {studentFeeStructure.feeHeads.map((feeHead, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50">
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-gray-900">{feeHead.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{feeHead.frequency} • {feeHead.category}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono text-gray-900">₹{feeHead.amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono text-gray-600">₹{feeHead.paidAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono text-gray-600">₹{feeHead.balanceAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 rounded bg-gray-50">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        feeHead.status === 'paid' ? 'bg-gray-400' :
                        feeHead.status === 'partial' ? 'bg-gray-400' :
                        'bg-gray-300'
                      }`}></span>
                      {feeHead.status === 'paid' ? 'Paid' :
                       feeHead.status === 'partial' ? 'Partial' :
                       'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div className="grid grid-cols-4 gap-4 px-4 py-4 bg-gray-50 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Fee</p>
                <p className="text-base font-bold text-gray-900">₹{studentFeeStructure.totalFee?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Paid</p>
                <p className="text-base font-bold text-gray-700">₹{studentFeeStructure.totalPaid?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Discount</p>
                <p className="text-base font-bold text-gray-700">₹{studentFeeStructure.discountApplied?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className="text-base font-bold text-gray-900">₹{studentFeeStructure.totalBalance?.toLocaleString() || 0}</p>
              </div>
            </div>

            {studentFeeStructure.discountReason && (
              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <p className="text-xs text-gray-500">Discount: <span className="text-gray-700">{studentFeeStructure.discountReason}</span></p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center border border-gray-200 rounded-lg bg-white">
            <IndianRupee size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 mb-1">No fee structure assigned</p>
            <p className="text-xs text-gray-400">Fee heads are assigned based on class</p>
          </div>
        )}
      </div>
    </div>
  );
}

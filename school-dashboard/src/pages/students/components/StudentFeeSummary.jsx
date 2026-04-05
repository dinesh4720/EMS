import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Banknote, MoreVertical, CreditCard, Download, CheckCircle, Clock, FileText, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../utils/numberFormatter';
import { formatShortDate } from '../../../utils/dateFormatter';


export default function StudentFeeSummary({
  studentId,
  studentFeeStructure,
  feeHistory,
  loadingFeeStructure,
  onRecordPayment,
  onSendReminder,
  onDownloadInvoice
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Calculate payment progress percentage
  const totalFee = studentFeeStructure?.totalFee || 0;
  const totalPaid = studentFeeStructure?.totalPaid || 0;
  const progressPercent = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;

  // Show overall empty state when no fee structure and no history
  const hasFeeData = (studentFeeStructure?.feeHeads?.length > 0) || totalFee > 0 || feeHistory?.length > 0;

  if (!loadingFeeStructure && !hasFeeData) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800">
        <div className="inline-flex p-4 bg-white dark:bg-zinc-900 rounded-full mb-4 ring-1 ring-gray-200 dark:ring-zinc-700 shadow-sm dark:shadow-zinc-900/50">
          <Banknote size={32} className="text-gray-400 dark:text-zinc-500" />
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">{t('pages.noFeeStructureAssigned', 'No fee structure assigned')}</h4>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">{t('pages.feeHeadsAssignedByClass', 'Fee heads will appear once the class fee structure is configured in Fee Settings.')}</p>
        <Button
          className="mt-4"
          size="sm"
          variant="bordered"
          onPress={() => navigate('/fees/settings')}
        >
          {t('pages.goToFeeSettings', 'Go to Fee Settings')}
        </Button>
      </div>
    );
  }

  if (loadingFeeStructure) {
    return (
      <div className="space-y-6">
        <div className="p-5 border border-gray-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-8 w-36 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              <div className="h-9 w-20 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full" />
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-8 text-center">
            <div className="h-4 w-40 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex-1"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Progress Section */}
      <div className="p-5 border border-gray-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('pages.outstandingBalance')}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
              {formatCurrency(studentFeeStructure?.totalBalance || 0)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(studentFeeStructure?.totalBalance || 0) > 0 && (
              <Button
                className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 border border-gray-900 dark:border-zinc-100 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200"
                onPress={onRecordPayment}
                startContent={<CreditCard size={16} />}
              >
                Collect
              </Button>
            )}
            <Button
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
              startContent={<FileText size={16} />}
              onPress={onDownloadInvoice}
            >
              Invoice
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="px-2 py-2 text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('aria.menus.feeActions')}>
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
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-zinc-400">
            <span>{t('pages.paymentProgress')}</span>
            <span>{progressPercent}% paid</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-800 dark:bg-zinc-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-zinc-400">Paid: <span className="font-medium text-gray-700 dark:text-zinc-300">{formatCurrency(totalPaid)}</span></span>
            <span className="text-gray-500 dark:text-zinc-400">Total: <span className="font-medium text-gray-700 dark:text-zinc-300">{formatCurrency(totalFee)}</span></span>
          </div>
        </div>
      </div>

      {/* Payment History - Timeline View */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.paymentHistory')}</h3>
          <button
            className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            onClick={() => navigate(studentId ? `/fees?studentId=${studentId}` : '/fees')}
          >
            View All
          </button>
        </div>
        <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 max-h-[300px] overflow-y-auto">
          {feeHistory.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {feeHistory.slice(0, 5).map((payment, idx) => (
                <div key={payment._id || payment.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <CheckCircle size={14} className="text-gray-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {payment.paymentPeriod || payment.feeHeads?.[0]?.period || 'Fee Payment'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {payment.paymentDate ? formatShortDate(payment.paymentDate) : payment.date}
                        {payment.receiptNumber && <span className="ml-2">• #{payment.receiptNumber}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{formatCurrency(payment.amount || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 capitalize">{payment.paymentMode || payment.mode}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="inline-flex p-3 bg-gray-50 dark:bg-zinc-800 rounded-full mb-3">
                <CreditCard size={24} className="text-gray-300 dark:text-zinc-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{t('pages.noPaymentsRecorded', 'No payments recorded')}</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noPaymentHistoryYet')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Heads Table */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">{t('pages.applicableFeeHeads')}</h3>
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            {studentFeeStructure?.feeHeads?.length || 0} heads
          </span>
        </div>

        {loadingFeeStructure ? (
          <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1"><div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /></div>
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex-1"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /></div>
                ))}
              </div>
            ))}
          </div>
        ) : studentFeeStructure?.feeHeads?.length > 0 ? (
          <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              <div className="col-span-4">{t('pages.feeHead')}</div>
              <div className="col-span-2 text-right">{t('pages.amount1')}</div>
              <div className="col-span-2 text-right">{t('pages.paid2')}</div>
              <div className="col-span-2 text-right">{t('pages.balance1')}</div>
              <div className="col-span-2 text-center">{t('pages.status2')}</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {studentFeeStructure.feeHeads.map((feeHead, idx) => (
                <div key={feeHead._id || feeHead.name} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{feeHead.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 capitalize">{feeHead.frequency} • {feeHead.category}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono text-gray-900 dark:text-zinc-100">{formatCurrency(feeHead.amount || 0)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono text-gray-600 dark:text-zinc-400">{formatCurrency(feeHead.paidAmount || 0)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono text-gray-600 dark:text-zinc-400">{formatCurrency(feeHead.balanceAmount || 0)}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 dark:border-zinc-700 rounded bg-gray-50 dark:bg-zinc-800">
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
            <div className="grid grid-cols-4 gap-4 px-4 py-4 bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t('pages.totalFee3')}</p>
                <p className="text-base font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(studentFeeStructure.totalFee || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t('pages.paid2')}</p>
                <p className="text-base font-bold text-gray-700 dark:text-zinc-300">{formatCurrency(studentFeeStructure.totalPaid || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t('pages.discount1')}</p>
                <p className="text-base font-bold text-gray-700 dark:text-zinc-300">{formatCurrency(studentFeeStructure.discountApplied || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t('pages.balance1')}</p>
                <p className="text-base font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(studentFeeStructure.totalBalance || 0)}</p>
              </div>
            </div>

            {studentFeeStructure.discountReason && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <p className="text-xs text-gray-500 dark:text-zinc-400">Discount: <span className="text-gray-700 dark:text-zinc-300">{studentFeeStructure.discountReason}</span></p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
            <Banknote size={24} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">{t('pages.noFeeStructureAssigned', 'No fee structure assigned yet')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.feeHeadsAssignedByClass', 'Fee heads will appear once the class fee structure is configured in Fee Settings.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

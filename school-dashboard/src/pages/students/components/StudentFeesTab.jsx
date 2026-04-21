import { Button } from "@heroui/react";
import { IndianRupee, Bell, Download, CheckCircle2, FileText, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatShortDate } from "../../../utils/dateFormatter";
import { useCurrency } from '../../../context/hooks/useCurrency';

// ============================================================================
// STUDENT FEES TAB
// Fee summary hero, payment history, fee heads breakdown (+ loading skeleton)
// ============================================================================

function FeesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-28 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-28 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              <div className="h-8 w-28 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 text-center space-y-2">
              <div className="h-3 w-16 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-5 w-20 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden p-8 text-center">
        <div className="h-4 w-32 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function StudentFeesTab({
  studentId,
  studentFeeStructure,
  feeHistory,
  loadingFeeStructure,
  onPaymentOpen,
  onSendReminder,
  onInvoiceOpen,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const navigate = useNavigate();

  if (loadingFeeStructure) return <FeesSkeleton />;

  return (
    <div className="space-y-5">
      {/* Fee Summary Hero */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wide">{t('pages.totalOutstanding1')}</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalBalance)}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                {(studentFeeStructure?.totalBalance || 0) <= 0 ? 'All fees cleared' : 'Payment pending'}
              </p>
            </div>
            <div className="flex gap-2">
              {(studentFeeStructure?.totalBalance || 0) > 0 && (
                <>
                  <Button size="sm" className="bg-gray-900 text-white" startContent={<IndianRupee size={14} />} onPress={onPaymentOpen}>{t('pages.collectPayment1')}</Button>
                  <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Bell size={14} />} onPress={onSendReminder}>{t('pages.sendReminder1')}</Button>
                </>
              )}
              <Button size="sm" variant="bordered" className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300" startContent={<Download size={14} />} onPress={onInvoiceOpen}>{t('pages.invoice1')}</Button>
            </div>
          </div>
        </div>

        {/* Fee Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-700">
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalFee3')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalFee)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.paid2')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalPaid)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.discount1')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.discountApplied)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.balance1')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.paymentHistory')}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{feeHistory?.length || 0} transactions</p>
          </div>
          <Button size="sm" variant="light" className="text-gray-500 dark:text-zinc-400" onPress={() => navigate(`/fees?studentId=${studentId}`)}>{t('pages.viewAll1')}</Button>
        </div>
        {feeHistory?.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800 max-h-64 overflow-y-auto">
            {feeHistory.slice(0, 5).map((payment, i) => (
              <div key={payment.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{payment.paymentPeriod || 'Fee Payment'}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{payment.paymentDate ? formatShortDate(payment.paymentDate) : payment.date} • {payment.paymentMode || payment.mode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">₹{formatCurrency(payment.amount)}</p>
                  {payment.receiptNumber && <p className="text-xs text-gray-500 dark:text-zinc-400">{payment.receiptNumber}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <IndianRupee size={24} className="mx-auto text-gray-200 dark:text-zinc-700 mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noPaymentHistory')}</p>
          </div>
        )}
      </div>

      {/* Fee Heads Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.feeBreakdown')}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{studentFeeStructure?.feeHeads?.length || 0} fee heads</p>
          </div>
          <Button size="sm" variant="light" className="text-gray-500 dark:text-zinc-400" startContent={<BookOpen size={14} />} onPress={() => navigate('/settings?tab=fee-heads')}>{t('pages.configure')}</Button>
        </div>
        {studentFeeStructure?.feeHeads?.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {studentFeeStructure.feeHeads.map((fee) => (
              <div key={fee._id || fee.feeHeadId} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{fee.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{fee.category} • {fee.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-11 sm:pl-0">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.amount1')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{formatCurrency(fee.amount)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.paid2')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{formatCurrency(fee.paidAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.balance1')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{formatCurrency(fee.balanceAmount)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    fee.status === 'paid' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' :
                    fee.status === 'partial' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' :
                    'bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400'
                  }`}>
                    {fee.status === 'paid' ? 'Paid' : fee.status === 'partial' ? 'Partial' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <IndianRupee size={24} className="mx-auto text-gray-200 dark:text-zinc-700 mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noFeeStructureAssigned')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

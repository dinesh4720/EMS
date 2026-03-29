import { CURRENT_ACADEMIC_YEAR } from "../../../utils/constants";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox } from '@heroui/react';
import { useRef, useCallback, useState } from 'react';
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';


// School configuration - prefers live school settings from API
const getSchoolConfig = (schoolSettings) => ({
  name: schoolSettings?.schoolName || schoolSettings?.name || 'School name not configured',
  address: schoolSettings?.address || schoolSettings?.schoolAddress || '',
  contact: schoolSettings?.phone || schoolSettings?.contactNumber || '',
  gstin: schoolSettings?.gstin || ''
});

// Generate invoice number
const generateInvoiceNumber = (studentId, date) => {
  const d = new Date(date);
  const year = d.getFullYear().toString().slice(-2);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const idPart = studentId?.toString().slice(-4).toUpperCase() || '0000';
  return `INV-${year}${month}-${idPart}`;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat(getDateLocale(), {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Format date
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(getDateLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function InvoicePrintModal({
  isOpen,
  onClose,
  student,
  studentFeeStructure,
  feeHistory,
  selectedPayment = null
}) {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const printRef = useRef();
  const [includePending, setIncludePending] = useState(false);
  const schoolConfig = getSchoolConfig(schoolSettings);

  const invoiceNumber = generateInvoiceNumber(student?.id || student?._id, new Date());

  // Handle print using Blob URL to avoid document.write XSS
  const handlePrint = useCallback(() => {
    if (!printRef.current) {
      console.error('Print content not ready');
      return;
    }

    // Get the content HTML (already React-rendered, safe from script injection at render time)
    const content = printRef.current.innerHTML;

    // Sanitize the invoice number to be safe inside HTML title text
    const safeTitle = `Invoice ${String(invoiceNumber).replace(/[<>"&]/g, '')}`;

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${safeTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            height: 297mm;
            width: 210mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            padding: 15mm;
            color: #1a1a1a;
            background: white;
          }
          .border-b { border-bottom: 1px solid #e5e7eb; }
          .border-t { border-top: 1px solid #e5e7eb; }
          .border { border: 1px solid #e5e7eb; }
          .rounded-lg { border-radius: 4px; }
          .overflow-hidden { overflow: hidden; }
          .flex { display: flex; }
          .grid { display: grid; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .items-start { align-items: flex-start; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .uppercase { text-transform: uppercase; }
          .capitalize { text-transform: capitalize; }
          .text-xl { font-size: 18px; line-height: 1.3; }
          .text-lg { font-size: 15px; line-height: 1.3; }
          .text-base { font-size: 13px; line-height: 1.4; }
          .text-sm { font-size: 11px; line-height: 1.4; }
          .text-xs { font-size: 10px; line-height: 1.3; }
          .tracking-tight { letter-spacing: -0.02em; }
          .tracking-wide { letter-spacing: 0.02em; }
          .tracking-wider { letter-spacing: 0.04em; }
          .text-gray-900 { color: #111827; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-400 { color: #9ca3af; }
          .bg-white { background: white; }
          .bg-gray-50 { background: #f9fafb; }
          .p-6 { padding: 16px; }
          .p-4 { padding: 12px; }
          .p-3 { padding: 10px; }
          .px-3 { padding-left: 10px; padding-right: 10px; }
          .px-4 { padding-left: 12px; padding-right: 12px; }
          .py-2 { padding-top: 6px; padding-bottom: 6px; }
          .py-3 { padding-top: 8px; padding-bottom: 8px; }
          .pt-2 { padding-top: 6px; }
          .pt-3 { padding-top: 8px; }
          .pt-4 { padding-top: 12px; }
          .pb-3 { padding-bottom: 8px; }
          .mb-2 { margin-bottom: 6px; }
          .mb-3 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 12px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 6px; }
          .mt-3 { margin-top: 8px; }
          .mt-4 { margin-top: 12px; }
          .ml-2 { margin-left: 6px; }
          .gap-8 { gap: 20px; }
          .gap-12 { gap: 32px; }
          .space-y-1 > * + * { margin-top: 3px; }
          .space-y-2 > * + * { margin-top: 6px; }
          .w-60 { width: 200px; }
          .w-full { width: 100%; }
          .h-8 { height: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { text-align: left; vertical-align: top; }
          .divide-y > * + * { border-top: 1px solid #f3f4f6; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

          /* Compact invoice layout */
          .invoice-header {
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .bill-to-section {
            margin-bottom: 10px;
          }
          .fee-table-section {
            margin-bottom: 10px;
          }
          .summary-section {
            margin-bottom: 10px;
          }
          .payment-history {
            margin-bottom: 10px;
          }
          .terms-section {
            margin-bottom: 8px;
          }
          .signature-section {
            margin-top: 10px;
          }

          @media print {
            html, body {
              height: auto;
              width: auto;
            }
            body {
              padding: 0;
              font-size: 11px;
            }
            @page {
              margin: 12mm;
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    // Use Blob URL instead of document.write to avoid script injection via template literal
    const blob = new Blob([printHtml], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open(blobUrl, '_blank', 'width=800,height=600');

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      alert('Please allow popups to print the invoice');
      return;
    }

    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      URL.revokeObjectURL(blobUrl);
      printWindow.close();
    };

    // Fallback for browsers that don't fire onload
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
        printWindow.close();
      }
    }, 800);
  }, [invoiceNumber]);

  // Early return if no student data
  if (!student) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>{t('pages.feeInvoice')}</ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-zinc-400">{t('pages.noStudentDataAvailable')}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const invoiceDate = formatDate(new Date());
  const dueDate = formatDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));

  const feeHeads = studentFeeStructure?.feeHeads || [];
  const paidHeads = feeHeads.filter(fh => (fh.paidAmount || 0) > 0);
  const pendingHeads = feeHeads.filter(fh => (fh.balanceAmount || 0) > 0);
  const totalFee = studentFeeStructure?.totalFee || 0;
  const totalPaid = studentFeeStructure?.totalPaid || 0;
  const totalBalance = studentFeeStructure?.totalBalance || 0;
  const discount = studentFeeStructure?.discountApplied || 0;
  const pendingTotal = pendingHeads.reduce((sum, fh) => sum + (fh.balanceAmount || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <span>{t('pages.feeInvoice')}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">{invoiceNumber}</span>
        </ModalHeader>
        <ModalBody>
          {/* Printable Invoice */}
          <div ref={printRef} className="print-content p-6 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
            {/* Invoice Header */}
            <div className="invoice-header border-b border-gray-200 dark:border-zinc-800 pb-3 mb-4">
              <div className="flex justify-between items-start">
                {/* School Info */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{schoolConfig.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{schoolConfig.address}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{schoolConfig.contact}</p>
                  {schoolConfig.gstin && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{schoolConfig.gstin}</p>
                  )}
                </div>

                {/* Invoice Info */}
                <div className="text-right">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wide">{t('pages.feeInvoice')}</h2>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="text-gray-500 dark:text-zinc-400">{t('pages.invoiceNo')}</span> <span className="font-mono font-medium">{invoiceNumber}</span></p>
                    <p><span className="text-gray-500 dark:text-zinc-400">{t('pages.date3')}</span> <span className="font-medium">{invoiceDate}</span></p>
                    {totalBalance > 0 && (
                      <p><span className="text-gray-500 dark:text-zinc-400">{t('pages.dueDate1')}</span> <span className="font-medium">{dueDate}</span></p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="bill-to-section grid grid-cols-2 gap-8 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('pages.billTo')}</p>
                <p className="font-semibold text-gray-900 dark:text-zinc-100">{student.name}</p>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                  {student.class}{student.section ? ` - ${student.section}` : ''}
                </p>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Roll No: {student.rollNumber || student.rollNo || 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Admission No: {student.admissionNumber || student.admissionNo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('pages.academicYear1')}</p>
                <p className="text-sm text-gray-700 dark:text-zinc-300">{studentFeeStructure?.academicYear || CURRENT_ACADEMIC_YEAR}</p>
                {student.parentName && (
                  <>
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 mt-3">Parent/Guardian</p>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">{student.parentName}</p>
                    {student.parentPhone && (
                      <p className="text-sm text-gray-600 dark:text-zinc-400">Ph: {student.parentPhone}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Paid Fee Details Table */}
            <div className="fee-table-section border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.feeHead')}</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.period2')}</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.amount1')}</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.paid2')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                  {paidHeads.length > 0 ? (
                    paidHeads.map((fee, index) => (
                      <tr key={fee._id || fee.name}>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-zinc-400">{index + 1}</td>
                        <td className="px-4 py-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{fee.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{fee.category}</p>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 capitalize">{fee.frequency || 'Annual'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(fee.amount)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(fee.paidAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                        No payments recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
                {paidHeads.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
                      <td colSpan="4" className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 text-right">{t('pages.amountPaid')}</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(totalPaid)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Summary Section */}
            <div className="summary-section flex justify-end mb-4">
              <div className="w-60">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">{t('pages.totalFee3')}</span>
                    <span className="font-mono text-gray-900 dark:text-zinc-100">{formatCurrency(totalFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">{t('pages.amountPaid')}</span>
                    <span className="font-mono text-gray-700 dark:text-zinc-300">{formatCurrency(totalPaid)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">{t('pages.discount1')}</span>
                      <span className="font-mono text-gray-600 dark:text-zinc-400">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-zinc-800 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-zinc-100">{t('pages.balanceDue')}</span>
                      <span className="font-bold text-gray-900 dark:text-zinc-100 font-mono">{formatCurrency(totalBalance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Payments Section (only shown when checkbox is checked) */}
            {includePending && pendingHeads.length > 0 && (
              <div className="fee-table-section border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-50 dark:bg-zinc-900 px-4 py-2 border-b border-gray-200 dark:border-zinc-800">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">Pending Payments</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.feeHead')}</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.period2')}</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.amount1')}</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('pages.balance1')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                    {pendingHeads.map((fee, index) => (
                      <tr key={fee._id || fee.name}>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-zinc-400">{index + 1}</td>
                        <td className="px-4 py-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{fee.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{fee.category}</p>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 capitalize">{fee.frequency || 'Annual'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(fee.amount)}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(fee.balanceAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
                      <td colSpan="4" className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 text-right">Total Pending</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(pendingTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Payment History (if any) */}
            {feeHistory && feeHistory.length > 0 && (
              <div className="payment-history border-t border-gray-200 dark:border-zinc-800 pt-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">{t('pages.paymentHistory')}</h3>
                <div className="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.date2')}</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.receiptNo')}</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.mode1')}</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.amount1')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                      {feeHistory.slice(0, 3).map((payment, index) => (
                        <tr key={payment._id || payment.receiptNumber || index}>
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400">{formatDate(payment.paymentDate || payment.date)}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 font-mono">{payment.receiptNumber || `#${index + 1}`}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 capitalize">{payment.paymentMode || payment.mode || 'Cash'}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-zinc-100 text-right font-mono">{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terms & Notes */}
            <div className="terms-section border-t border-gray-200 dark:border-zinc-800 pt-4 mb-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('pages.notes1')}</p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    {studentFeeStructure?.discountReason || 'Thank you for your payment.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('pages.termsConditions')}</p>
                  <ul className="text-xs text-gray-500 dark:text-zinc-400 space-y-1">
                    <li>- Fees once paid are non-refundable unless specified otherwise.</li>
                    <li>- Please retain this invoice for future reference.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="signature-section grid grid-cols-2 gap-12 pt-2">
              <div>
                <div className="border-b border-gray-300 dark:border-zinc-700 mb-2 h-8"></div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">{t('pages.authorizedSignatory')}</p>
              </div>
              <div>
                <div className="border-b border-gray-300 dark:border-zinc-700 mb-2 h-8"></div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">Parent/Guardian Signature</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 text-center">
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                This is a computer-generated invoice and does not require a physical signature.
              </p>
            </div>
          </div>

        </ModalBody>
        <ModalFooter className="flex-col items-stretch gap-3">
          {pendingHeads.length > 0 && (
            <div className="px-1">
              <Checkbox
                isSelected={includePending}
                onValueChange={setIncludePending}
                size="sm"
                classNames={{ label: "text-sm text-gray-700 dark:text-zinc-300" }}
              >
                Include pending payment section ({pendingHeads.length} item{pendingHeads.length > 1 ? 's' : ''} &middot; {formatCurrency(pendingTotal)})
              </Checkbox>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="light" onPress={onClose} className="text-gray-600 dark:text-zinc-400">
              Close
            </Button>
            <Button
              className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200"
              onPress={handlePrint}
              startContent={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              }
            >
              Download / Print
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

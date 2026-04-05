/**
 * StaffPayrollTab - Minimal gray styling matching StudentDashboard
 */
import { IndianRupee, Download, TrendingUp, Calendar, FileText, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';
import { escapeHtml } from "../../../utils/sanitize";


export default function StaffPayrollTab({
  payrollHistory,
  staffSalary,
  calculateTotals,
  staff,
}) {
  const { t } = useTranslation();
  const safeCalculateTotals = calculateTotals || (() => ({ totalEarnings: 0, totalDeductions: 0, netSalary: 0 }));
  const { totalEarnings, totalDeductions, netSalary } = safeCalculateTotals(staffSalary);

  const generatePayslipPDF = (record) => {
    const month = escapeHtml(record?.month || new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
    const net = record?.netSalary ?? netSalary;
    const staffName = escapeHtml(staff?.name || 'Staff Member');
    const staffCode = escapeHtml(staff?.code || '');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Payslip – ${month}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:40px;max-width:680px;margin:auto}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px}
.header h1{font-size:18px;font-weight:700}.header p{font-size:12px;color:#666;margin-top:2px}
.badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600}
.employee-row{display:flex;justify-content:space-between;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px}
.employee-row .info p{font-size:12px;color:#888;margin-bottom:2px}.employee-row .info .name{font-size:16px;font-weight:700;color:#111;margin-bottom:4px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.box{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
.box-title{background:#f3f4f6;padding:10px 16px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.5px}
.box-body{padding:12px 16px}
.row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #f5f5f5}
.row:last-child{border-bottom:none;font-weight:600;padding-top:8px;margin-top:4px;border-top:1px solid #e5e7eb}
.row .lbl{color:#6b7280}
.net-block{background:#111;color:#fff;border-radius:8px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.net-block .lbl{font-size:13px;opacity:.7}
.net-block .val{font-size:28px;font-weight:800}
.footer{text-align:center;font-size:11px;color:#aaa;margin-top:28px}
@media print{body{padding:20px}}
</style></head>
<body>
<div class="header">
  <div><h1>Salary Payslip</h1><p>${month}</p></div>
  <span class="badge">${escapeHtml(record?.status || record?.paymentStatus || 'Paid')}</span>
</div>
<div class="employee-row">
  <div class="info">
    <div class="name">${staffName}</div>
    ${staffCode ? `<p>Employee Code: <strong>${staffCode}</strong></p>` : ''}
    ${staff?.department ? `<p>Department: ${escapeHtml(staff.department)}</p>` : ''}
  </div>
  <div class="info" style="text-align:right">
    <p>Pay Period</p>
    <strong>${month}</strong>
  </div>
</div>
<div class="cols">
  <div class="box">
    <div class="box-title">Earnings</div>
    <div class="box-body">
      <div class="row"><span class="lbl">Basic Salary</span><span>${escapeHtml((staffSalary.basic||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">HRA</span><span>${escapeHtml((staffSalary.hra||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">DA</span><span>${escapeHtml((staffSalary.da||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Special Allowance</span><span>${escapeHtml((staffSalary.specialAllowance||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Total Earnings</span><span>${escapeHtml(totalEarnings.toLocaleString('en-IN'))}</span></div>
    </div>
  </div>
  <div class="box">
    <div class="box-title">Deductions</div>
    <div class="box-body">
      <div class="row"><span class="lbl">PF</span><span>${escapeHtml((staffSalary.pf||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">ESI</span><span>${escapeHtml((staffSalary.esi||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Professional Tax</span><span>${escapeHtml((staffSalary.professionalTax||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">TDS</span><span>${escapeHtml((staffSalary.tds||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Total Deductions</span><span>${escapeHtml(totalDeductions.toLocaleString('en-IN'))}</span></div>
    </div>
  </div>
</div>
<div class="net-block">
  <span class="lbl">Net Salary</span>
  <span class="val">${escapeHtml(net.toLocaleString('en-IN'))}</span>
</div>
<div class="footer">This is a system-generated payslip.</div>
</body></html>`;

    const w = window.open('', '_blank', 'width=750,height=650');
    if (!w) { toast.error('Pop-up blocked. Allow pop-ups to download payslip.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  // Current month and year
  const today = new Date();
  const currentMonth = today.toLocaleDateString(getDateLocale(), { month: 'long', year: 'numeric' });

  const summaryCards = [
    { label: "Net Salary", value: `₹${netSalary.toLocaleString()}`, icon: Wallet },
    { label: "Total Earnings", value: `₹${totalEarnings.toLocaleString()}`, icon: TrendingUp },
    { label: "Total Deductions", value: `₹${totalDeductions.toLocaleString()}`, icon: IndianRupee },
    { label: "Payment Cycle", value: "Monthly", icon: Calendar }
  ];

  return (
    <div className="space-y-5">
      {/* Salary Summary Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.salaryOverview')}</h3>
            <p className="text-xs text-gray-500 mt-0.5 dark:text-zinc-400">{currentMonth}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">₹{netSalary.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.netSalary')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-800">
          {summaryCards.map((card) => (
            <div key={card.label} className="p-4 text-center first:pt-0 sm:first:pt-4 last:pb-0 sm:last:pb-4">
              <p className="text-xs text-gray-500 dark:text-zinc-400">{card.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-1 dark:text-zinc-100">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.payrollHistory')}</h3>
            <p className="text-xs text-gray-500 mt-0.5 dark:text-zinc-400">{payrollHistory?.length || 0} transactions</p>
          </div>
          <Button size="sm" variant="bordered" className="border-gray-200 text-gray-700 dark:border-zinc-700 dark:text-zinc-300" startContent={<Download size={14} />} onPress={() => generatePayslipPDF(payrollHistory?.[0] || {})}>
            Download Payslip
          </Button>
        </div>
        {payrollHistory && payrollHistory.length > 0 ? (
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto dark:divide-zinc-800">
            {payrollHistory.map((record, i) => {
              // Support both backend shape (month/year numbers, netPay) and legacy local shape
              const monthLabel = record.year
                ? new Date(record.year, (record.month || 1) - 1).toLocaleDateString(getDateLocale(), { month: 'long', year: 'numeric' })
                : record.month;
              const dateLabel = record.paymentDate
                ? new Date(record.paymentDate).toLocaleDateString(getDateLocale())
                : record.date || (record.createdAt ? new Date(record.createdAt).toLocaleDateString(getDateLocale()) : '');
              const net = record.netPay ?? record.netSalary ?? netSalary;

              return (
                <div key={record._id || record.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors dark:hover:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                      <CheckCircle2 size={14} className="text-gray-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{monthLabel}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{dateLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">₹{net.toLocaleString()}</p>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">{record.status || 'Paid'}</span>
                    </div>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-zinc-700"
                      onClick={() => generatePayslipPDF({ ...record, month: monthLabel, netSalary: net })}
                    >
                      <Download size={14} className="text-gray-400 dark:text-zinc-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <IndianRupee size={24} className="mx-auto text-gray-200 mb-2 dark:text-zinc-600" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noPayrollRecordsFound')}</p>
          </div>
        )}
      </div>

      {/* Earnings & Deductions Breakdown */}
      {staffSalary && Object.keys(staffSalary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earnings */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
            <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800"><TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.earnings')}</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.basicSalary')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.basic || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.hRA')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.hra || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">DA</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.da || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.specialAllowance')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.specialAllowance || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{t('pages.totalEarnings')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">₹{totalEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
            <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800"><IndianRupee size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.deductions')}</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">PF</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.pf || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.eSI')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.esi || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.professionalTax')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.professionalTax || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.tDS')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{(staffSalary.tds || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{t('pages.totalDeductions')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

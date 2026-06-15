/**
 * StaffPayrollTab - Minimal gray styling matching StudentDashboard
 */
import { IndianRupee, Download, TrendingUp, Calendar, FileText, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';
import { escapeHtml } from "../../../utils/sanitize";
import { useCurrency } from '../../../context/hooks/useCurrency';
import logger from '../../../utils/logger';
import { bg, fg, border as borderColor, status as statusColor } from "../../../theme/printPalette";



export default function StaffPayrollTab({
  payrollHistory,
  staffSalary,
  calculateTotals,
  staff,
}) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const safeSalary = staffSalary || {};
  const hasSalaryStructure = Object.keys(safeSalary).length > 0;
  const safeCalculateTotals = calculateTotals || (() => ({ totalEarnings: 0, totalDeductions: 0, netSalary: 0 }));
  const { totalEarnings, totalDeductions, netSalary } = safeCalculateTotals(safeSalary);

  const generatePayslipPDF = (record) => {
    try {
    const month = escapeHtml(record?.month || new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
    const net = record?.netSalary ?? netSalary;
    const staffName = escapeHtml(staff?.name || 'Staff Member');
    const staffCode = escapeHtml(staff?.code || '');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Payslip – ${month}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:${bg.paper};color:${fg.body};padding:40px;max-width:680px;margin:auto}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${fg.body};padding-bottom:16px;margin-bottom:24px}
.header h1{font-size:18px;font-weight:700}.header p{font-size:12px;color:${fg.disabled};margin-top:2px}
.badge{background:${statusColor.okBg};border:1px solid ${statusColor.okBorder};color:${statusColor.okText};padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600}
.employee-row{display:flex;justify-content:space-between;background:${bg.base};border:1px solid ${borderColor.default};border-radius:8px;padding:16px;margin-bottom:24px}
.employee-row .info p{font-size:12px;color:${fg.disabled};margin-bottom:2px}.employee-row .info .name{font-size:16px;font-weight:700;color:${fg.body};margin-bottom:4px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.box{border:1px solid ${borderColor.default};border-radius:8px;overflow:hidden}
.box-title{background:${bg.box};padding:10px 16px;font-size:12px;font-weight:600;color:${fg.label};text-transform:uppercase;letter-spacing:.5px}
.box-body{padding:12px 16px}
.row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid ${bg.box}}
.row:last-child{border-bottom:none;font-weight:600;padding-top:8px;margin-top:4px;border-top:1px solid ${borderColor.default}}
.row .lbl{color:${fg.muted}}
.net-block{background:${fg.body};color:${bg.paper};border-radius:8px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.net-block .lbl{font-size:13px;opacity:.7}
.net-block .val{font-size:28px;font-weight:800}
.footer{text-align:center;font-size:11px;color:${fg.disabled};margin-top:28px}
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
      <div class="row"><span class="lbl">Basic Salary</span><span>${escapeHtml((safeSalary.basic||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">HRA</span><span>${escapeHtml((safeSalary.hra||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">DA</span><span>${escapeHtml((safeSalary.da||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Special Allowance</span><span>${escapeHtml((safeSalary.specialAllowance||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Total Earnings</span><span>${escapeHtml(totalEarnings.toLocaleString('en-IN'))}</span></div>
    </div>
  </div>
  <div class="box">
    <div class="box-title">Deductions</div>
    <div class="box-body">
      <div class="row"><span class="lbl">PF</span><span>${escapeHtml((safeSalary.pf||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">ESI</span><span>${escapeHtml((safeSalary.esi||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">Professional Tax</span><span>${escapeHtml((safeSalary.professionalTax||0).toLocaleString('en-IN'))}</span></div>
      <div class="row"><span class="lbl">TDS</span><span>${escapeHtml((safeSalary.tds||0).toLocaleString('en-IN'))}</span></div>
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
    } catch (err) {
      logger.error('Payslip PDF generation failed:', err);
      toast.error('Failed to generate payslip. Please try again.');
    }
  };

  // Current month and year
  const today = new Date();
  const currentMonth = today.toLocaleDateString(getDateLocale(), { month: 'long', year: 'numeric' });

  const summaryCards = [
    { label: "Net Salary", value: fmt(netSalary), icon: Wallet },
    { label: "Total Earnings", value: fmt(totalEarnings), icon: TrendingUp },
    { label: "Total Deductions", value: fmt(totalDeductions), icon: IndianRupee },
    { label: "Payment Cycle", value: "Monthly", icon: Calendar }
  ];

  return (
    <div className="space-y-5">
      {/* Salary Summary Cards */}
      <div className="bg-surface rounded-lg border border-border-token p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-fg">{t('pages.salaryOverview')}</h3>
            <p className="text-xs text-fg-muted mt-0.5">{currentMonth}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-fg">{fmt(netSalary)}</p>
            <p className="text-xs text-fg-muted">{t('pages.netSalary')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-divider">
          {summaryCards.map((card) => (
            <div key={card.label} className="p-4 text-center first:pt-0 sm:first:pt-4 last:pb-0 sm:last:pb-4">
              <p className="text-xs text-fg-muted">{card.label}</p>
              <p className="text-lg font-bold text-fg mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll History */}
      <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-fg">{t('pages.payrollHistory')}</h3>
            <p className="text-xs text-fg-muted mt-0.5">{payrollHistory?.length || 0} transactions</p>
          </div>
          <Button size="sm" variant="bordered" className="border-border-token text-fg" startContent={<Download size={14} />} onPress={() => generatePayslipPDF(payrollHistory?.[0] || {})}>
            Download Payslip
          </Button>
        </div>
        {payrollHistory && payrollHistory.length > 0 ? (
          <div className="divide-y divide-divider max-h-64 overflow-y-auto">
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
                <div key={record._id || record.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-surface-hover/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-fg-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg">{monthLabel}</p>
                      <p className="text-xs text-fg-muted">{dateLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-fg">{fmt(net)}</p>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-fg-muted">{record.status || 'Paid'}</span>
                    </div>
                    <button
                      className="p-2 hover:bg-surface-hover rounded-lg"
                      onClick={() => generatePayslipPDF({ ...record, month: monthLabel, netSalary: net })}
                    >
                      <Download size={14} className="text-fg-faint" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <IndianRupee size={24} className="mx-auto text-fg-faint mb-2" />
            <p className="text-sm text-fg-muted">{t('pages.noPayrollRecordsFound')}</p>
          </div>
        )}
      </div>

      {/* No salary structure notice */}
      {!hasSalaryStructure && (
        <div className="bg-warn-bg border border-warn rounded-lg px-5 py-4 text-sm text-warn">
          No salary structure has been assigned to this staff member. Payslip values will show as zero until a salary is configured.
        </div>
      )}

      {/* Earnings & Deductions Breakdown */}
      {hasSalaryStructure && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earnings */}
          <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
            <div className="p-5 border-b border-border-token">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><TrendingUp size={16} className="text-fg-muted" /></div>
                <h3 className="font-medium text-fg text-sm">{t('pages.earnings')}</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">{t('pages.basicSalary')}</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.basic || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">{t('pages.hRA')}</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.hra || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">DA</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.da || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">{t('pages.specialAllowance')}</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.specialAllowance || 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-divider">
                <span className="text-sm font-semibold text-fg">{t('pages.totalEarnings')}</span>
                <span className="text-sm font-bold text-fg">{fmt(totalEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
            <div className="p-5 border-b border-border-token">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><IndianRupee size={16} className="text-fg-muted" /></div>
                <h3 className="font-medium text-fg text-sm">{t('pages.deductions')}</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">PF</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.pf || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">{t('pages.eSI')}</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.esi || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">{t('pages.professionalTax')}</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.professionalTax || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">{t('pages.tDS')}</span>
                <span className="text-sm font-medium text-fg">{fmt(safeSalary.tds || 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-divider">
                <span className="text-sm font-semibold text-fg">{t('pages.totalDeductions')}</span>
                <span className="text-sm font-bold text-fg">{fmt(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

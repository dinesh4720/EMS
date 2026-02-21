/**
 * StaffPayrollTab - Minimal gray styling matching StudentDashboard
 */
import { IndianRupee, Download, TrendingUp, Calendar, FileText, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function StaffPayrollTab({
  payrollHistory,
  staffSalary,
  calculateTotals
}) {
  const { totalEarnings, totalDeductions, netSalary } = calculateTotals(staffSalary);

  // Current month and year
  const today = new Date();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const summaryCards = [
    { label: "Net Salary", value: `₹${netSalary.toLocaleString()}`, icon: Wallet },
    { label: "Total Earnings", value: `₹${totalEarnings.toLocaleString()}`, icon: TrendingUp },
    { label: "Total Deductions", value: `₹${totalDeductions.toLocaleString()}`, icon: IndianRupee },
    { label: "Payment Cycle", value: "Monthly", icon: Calendar }
  ];

  return (
    <div className="space-y-5">
      {/* Salary Summary Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Salary Overview</h3>
            <p className="text-xs text-gray-500 mt-0.5">{currentMonth}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">₹{netSalary.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Net Salary</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {summaryCards.map((card, i) => (
            <div key={i} className="p-4 text-center first:pt-0 sm:first:pt-4 last:pb-0 sm:last:pb-4">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Payroll History</h3>
            <p className="text-xs text-gray-500 mt-0.5">{payrollHistory?.length || 0} transactions</p>
          </div>
          <Button size="sm" variant="bordered" className="border-gray-200 text-gray-700" startContent={<Download size={14} />} onPress={() => toast.success('Downloading latest payslip...')}>
            Download Payslip
          </Button>
        </div>
        {payrollHistory && payrollHistory.length > 0 ? (
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {payrollHistory.map((record, i) => (
              <div key={record.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{record.month}</p>
                    <p className="text-xs text-gray-500">{record.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{netSalary.toLocaleString()}</p>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">Paid</span>
                  </div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    onPress={() => toast.success('Downloading payslip...')}
                  >
                    <Download size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <IndianRupee size={24} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-500">No payroll records found</p>
          </div>
        )}
      </div>

      {/* Earnings & Deductions Breakdown */}
      {staffSalary && Object.keys(staffSalary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earnings */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600" /></div>
                <h3 className="font-medium text-gray-900 text-sm">Earnings</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Basic Salary</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.basic || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">HRA</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.hra || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">DA</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.da || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Special Allowance</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.specialAllowance || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Total Earnings</span>
                <span className="text-sm font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><IndianRupee size={16} className="text-gray-600" /></div>
                <h3 className="font-medium text-gray-900 text-sm">Deductions</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">PF</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.pf || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">ESI</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.esi || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Professional Tax</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.professionalTax || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">TDS</span>
                <span className="text-sm font-medium text-gray-900">₹{(staffSalary.tds || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Total Deductions</span>
                <span className="text-sm font-bold text-gray-900">₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

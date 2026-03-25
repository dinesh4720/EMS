import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/react";
import { IndianRupee, TrendingUp, TrendingDown, FileText, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { reportsApi } from "../../services/api";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


export default function Overview() {
  const { t } = useTranslation();
  const [feeData, setFeeData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.feeCollection().catch(() => null),
      reportsApi.payrollSummary().catch(() => null),
    ]).then(([fee, payroll]) => {
      setFeeData(fee);
      setPayrollData(payroll);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString(getDateLocale())}` : '—';

  const stats = [
    {
      title: "Total Revenue",
      value: feeData ? fmt(feeData.totalCollected ?? feeData.totalRevenue ?? feeData.total) : '—',
      icon: IndianRupee,
      color: "bg-green-50 text-green-700",
      iconBg: "bg-green-100",
    },
    {
      title: "Pending Dues",
      value: feeData ? fmt(feeData.totalOutstanding ?? feeData.outstanding ?? feeData.pending) : '—',
      icon: FileText,
      color: "bg-amber-50 text-amber-700",
      iconBg: "bg-amber-100",
    },
    {
      title: "Payroll Due",
      value: payrollData ? fmt(payrollData.totalPayroll ?? payrollData.total ?? payrollData.pendingAmount) : '—',
      icon: Users,
      color: "bg-blue-50 text-blue-700",
      iconBg: "bg-blue-100",
    },
    {
      title: "Total Expenses",
      value: '—',
      icon: TrendingDown,
      color: "bg-rose-50 text-rose-700",
      iconBg: "bg-rose-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-gray-100 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 hover:shadow-md dark:hover:shadow-zinc-900/50 transition-shadow">
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">{stat.title}</p>
                  {loading ? (
                    <div className="h-7 w-28 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                  <stat.icon size={20} className={stat.color.split(' ')[1]} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart Placeholder */}
        <Card className="border border-gray-100 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 lg:col-span-2">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.incomeVsExpenses')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.monthlyFinancialOverview')}</p>
              </div>
            </div>

            <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-700">
              <div className="text-center">
                <TrendingUp size={48} className="text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-zinc-500 font-medium">{t('pages.financialCharts')}</p>
                <p className="text-sm text-gray-400 dark:text-zinc-500">{t('pages.chartsWillBeRenderedHere')}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-100 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.quickActions1')}</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.createInvoice')}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.generateNewInvoice')}</p>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <IndianRupee size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.recordExpense')}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.addNewExpense')}</p>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.processPayroll')}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.processStaffSalaries')}</p>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.generateReport')}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.createFinancialReport')}</p>
                </div>
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border border-gray-100 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.recentTransactions')}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.latestFinancialActivities')}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-zinc-500">
            <IndianRupee size={40} className="mb-2 opacity-40" />
            <p className="text-sm">{t('pages.noTransactionsToDisplay')}</p>
            <p className="text-xs mt-1">{t('pages.transactionHistoryWillAppearHereOnceTheModuleIsConfigured')}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

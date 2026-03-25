import { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { PieChart, Download, FileText, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { reportsApi } from "../../services/api";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


const REPORT_TYPES = [
  { name: "Financial Summary", description: "Complete financial overview" },
  { name: "Revenue Report", description: "Income and revenue analysis" },
  { name: "Expense Analysis", description: "Detailed expense breakdown" },
  { name: "Payroll Report", description: "Staff salary details" },
  { name: "Budget Report", description: "Budget vs actual comparison" },
  { name: "Cash Flow Statement", description: "Cash flow tracking" },
];

export default function Reports() {
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

  const quickStats = [
    {
      label: "Total Collection",
      value: loading ? null : fmt(feeData?.totalCollected ?? feeData?.total),
      icon: FileText,
      color: "bg-blue-100 text-blue-700"
    },
    {
      label: "Outstanding Dues",
      value: loading ? null : fmt(feeData?.totalOutstanding ?? feeData?.outstanding),
      icon: TrendingDown,
      color: "bg-rose-100 text-rose-700"
    },
    {
      label: "Payroll Paid",
      value: loading ? null : fmt(payrollData?.paidAmount ?? payrollData?.paid),
      icon: TrendingUp,
      color: "bg-green-100 text-green-700"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={t('pages.searchReports')}
            className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" startContent={<Calendar size={16} />}>
            Date Range
          </Button>
          <Button color="primary" size="sm" startContent={<FileText size={16} />}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border border-gray-100 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{stat.label}</p>
                  {loading ? (
                    <div className="h-7 w-24 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color.split(' ')[0]}`}>
                  <stat.icon size={20} className={stat.color.split(' ')[1]} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Types */}
        <Card className="border border-gray-100 dark:border-zinc-800 lg:col-span-1">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.reportTypes')}</h3>
            <div className="space-y-3">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.name}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{type.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Reports */}
        <Card className="border border-gray-100 dark:border-zinc-800 lg:col-span-2">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.recentReports')}</h3>
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-zinc-500">
              <PieChart size={40} className="mb-2 opacity-40" />
              <p className="text-sm">{t('pages.noReportsGeneratedYet')}</p>
              <p className="text-xs mt-1">Use "Generate Report" to create your first report</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <Card className="border border-gray-100 dark:border-zinc-800">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.scheduledReports')}</h3>
            <Button variant="flat" size="sm">{t('pages.addSchedule')}</Button>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-zinc-500">
            <Calendar size={36} className="mb-2 opacity-40" />
            <p className="text-sm">{t('pages.noScheduledReports')}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

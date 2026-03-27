import { useState, useEffect } from "react";
import { Card, CardBody, Button, Progress, Spinner } from "@heroui/react";
import { Users, Plus, Search, Filter, Wallet, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { payrollApi } from "../../services/api";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';


export default function Payroll() {
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dashboard, setDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      payrollApi.getDashboard(month, year).catch(() => null),
      payrollApi.getRecords({ month, year }).catch(() => []),
    ]).then(([dash, recs]) => {
      setDashboard(dash?.data || null);
      setRecords(Array.isArray(recs?.data) ? recs.data : []);
    }).finally(() => setLoading(false));
  }, [month, year]);

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString(getDateLocale())}` : '—';

  const paidAmount = dashboard?.totalPayout ?? 0;
  const pendingAmount = dashboard?.pendingAmount ?? 0;
  const totalPayroll = paidAmount + pendingAmount;
  const overdueAmount = dashboard?.overdueAmount ?? 0;
  const completedPct = totalPayroll > 0 ? Math.round((paidAmount / totalPayroll) * 100) : 0;
  const pendingPct = 100 - completedPct;

  const payrollSummary = [
    { label: "Total Payroll", value: fmt(totalPayroll), icon: Wallet, color: "bg-blue-100 text-blue-700" },
    { label: "Paid This Month", value: fmt(paidAmount), icon: CheckCircle, color: "bg-green-100 text-green-700" },
    { label: "Pending Payment", value: fmt(pendingAmount), icon: Clock, color: "bg-amber-100 text-amber-700" },
    { label: "Overdue", value: fmt(overdueAmount), icon: AlertCircle, color: "bg-rose-100 text-rose-700" },
  ];

  const pendingRecords = records.filter(r => r.status === 'generated');

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder={t('pages.searchPayrollRecords')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm bg-white dark:bg-zinc-950 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="flat" size="sm" startContent={<Filter size={16} />}>
            Filter
          </Button>
          <Button color="primary" size="sm" startContent={<Plus size={16} />}>
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {payrollSummary.map((summary) => (
          <Card key={summary.label} className="border border-gray-100 dark:border-zinc-800">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{summary.label}</p>
                  {loading ? (
                    <div className="h-7 w-24 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{summary.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${summary.color.split(' ')[0]}`}>
                  <summary.icon size={20} className={summary.color.split(' ')[1]} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Progress */}
        <Card className="border border-gray-100 dark:border-zinc-800 lg:col-span-1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.monthlyProgress')}</h3>
              <Calendar size={18} className="text-gray-400 dark:text-zinc-500" />
            </div>
            {loading ? (
              <div className="animate-pulse space-y-3 py-2">
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full mt-4" />
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded w-2/3" />
              </div>
            ) : totalPayroll > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.completed')}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{completedPct}%</span>
                  </div>
                  <Progress value={completedPct} color="success" className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{fmt(paidAmount)} of {fmt(totalPayroll)}</p>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.pending2')}</span>
                    <span className="text-sm font-semibold text-amber-600">{pendingPct}%</span>
                  </div>
                  <Progress value={pendingPct} color="warning" className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{fmt(pendingAmount)} remaining</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-zinc-500">
                <p className="text-sm">{t('pages.noPayrollDataForThisMonth')}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Upcoming Payments */}
        <Card className="border border-gray-100 dark:border-zinc-800 lg:col-span-2">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.upcomingPayments')}</h3>
            {loading ? (
              <div className="animate-pulse space-y-3 py-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
                      <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded w-1/3" />
                    </div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded" />
                  </div>
                ))}
              </div>
            ) : pendingRecords.length > 0 ? (
              <div className="space-y-3">
                {pendingRecords.slice(0, 5).map((record) => (
                  <div key={record._id || record.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Users size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{record.employeeId?.name || '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Due: {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        {fmt(record.netPay ?? record.amount ?? record.salary)}
                      </p>
                      <Button variant="flat" size="sm">{t('pages.process')}</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-zinc-500">
                <p className="text-sm">{t('pages.noUpcomingPayments')}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Payroll Records Table */}
      <Card className="border border-gray-100 dark:border-zinc-800">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.payrollRecords1')}</h3>
          {loading ? (
            <TablePageSkeleton kpiCards={0} searchBar={false} rows={5} />
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
                    <th className="pb-3">{t('pages.payrollId')}</th>
                    <th className="pb-3">{t('pages.employee')}</th>
                    <th className="pb-3">{t('pages.role1')}</th>
                    <th className="pb-3">{t('pages.amount1')}</th>
                    <th className="pb-3">{t('pages.status2')}</th>
                    <th className="pb-3">{t('pages.date2')}</th>
                    <th className="pb-3 text-right">{t('pages.actions1')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id || record.id} className="border-b border-gray-50 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Wallet size={16} className="text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                            {record.payrollId || record._id?.slice(-6).toUpperCase() || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                              {(record.employeeId?.name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-zinc-300">{record.employeeId?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600 dark:text-zinc-400">{record.employeeId?.designation || record.employeeId?.role || '—'}</td>
                      <td className="py-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        {fmt(record.netPay ?? record.amount ?? record.salary)}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : record.status === "generated"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {(record.status || 'generated').charAt(0).toUpperCase() + (record.status || 'generated').slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-600 dark:text-zinc-400">
                        {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="light" size="sm">{t('pages.view1')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 dark:text-zinc-500">
              <Wallet size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('pages.noPayrollRecordsForThisMonth')}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

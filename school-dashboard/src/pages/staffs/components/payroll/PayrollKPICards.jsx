import { Wallet, Clock, TrendingUp, Users } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function PayrollKPICards({ dashboardData, formatCurrency }) {
  const { t } = useTranslation();

  if (!dashboardData) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
      <div className="p-4 bg-success-50 rounded-lg border border-success-200">
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={18} className="text-success-600" />
          <span className="text-xs text-success-700 uppercase tracking-wider">{t('pages.totalRecorded')}</span>
        </div>
        <p className="text-2xl font-semibold text-success-700">
          {formatCurrency(dashboardData.totalPayout)}
        </p>
        <p className="text-xs text-success-600 mt-1">
          {dashboardData.paidCount} records logged
        </p>
      </div>

      <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={18} className="text-primary-600" />
          <span className="text-xs text-primary-700 uppercase tracking-wider">{t('pages.unrecorded')}</span>
        </div>
        <p className="text-2xl font-semibold text-primary-700">
          {formatCurrency(dashboardData.pendingAmount)}
        </p>
        <p className="text-xs text-primary-600 mt-1">
          {dashboardData.pendingCount} records pending
        </p>
      </div>

      <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-warning-600" />
          <span className="text-xs text-warning-700 uppercase tracking-wider">{t('pages.estimated')}</span>
        </div>
        <p className="text-2xl font-semibold text-warning-700">
          {formatCurrency(dashboardData.projectedPayout)}
        </p>
        <p className="text-xs text-warning-600 mt-1">
          Next month estimate
        </p>
      </div>

      <div className="p-4 bg-default-50 rounded-lg border border-default-200">
        <div className="flex items-center gap-2 mb-2">
          <Users size={18} className="text-default-500" />
          <span className="text-xs text-default-500 uppercase tracking-wider">{t('pages.totalStaff')}</span>
        </div>
        <p className="text-2xl font-semibold text-default-900">
          {dashboardData.totalEmployees}
        </p>
        <p className="text-xs text-default-500 mt-1">
          Active in payroll
        </p>
      </div>
    </div>
  );
}

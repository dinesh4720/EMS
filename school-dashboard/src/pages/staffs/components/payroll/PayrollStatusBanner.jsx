import { Chip } from "@heroui/react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../i18n/index';

export default function PayrollStatusBanner({
  dashboardData,
  staff,
  months,
  selectedMonth,
  selectedYear,
  getActiveStaffCount,
  formatCurrency,
}) {
  const { t } = useTranslation();

  if (!dashboardData) return null;

  return (
    <>
      {dashboardData.payrollRun && (
        <div className={`
          rounded-lg border p-4 flex items-start gap-4
          ${dashboardData.payrollRun.status === 'completed'
            ? 'bg-success-50 border-success-200'
            : dashboardData.payrollRun.status === 'processing'
            ? 'bg-warning-50 border-warning-200'
            : 'bg-default-50 border-default-200'}
        `}>
          <div className={`
            p-2 rounded-lg
            ${dashboardData.payrollRun.status === 'completed'
              ? 'bg-success-100'
              : dashboardData.payrollRun.status === 'processing'
              ? 'bg-warning-100'
              : 'bg-default-200'}
          `}>
            {dashboardData.payrollRun.status === 'completed' ? (
              <CheckCircle2 size={20} className="text-success-600" />
            ) : dashboardData.payrollRun.status === 'processing' ? (
              <Clock size={20} className="text-warning-600" />
            ) : (
              <AlertCircle size={20} className="text-default-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${
              dashboardData.payrollRun.status === 'completed'
                ? 'text-success-900'
                : dashboardData.payrollRun.status === 'processing'
                ? 'text-warning-900'
                : 'text-default-900'
            }`}>
              {dashboardData.payrollRun.status === 'completed'
                ? 'Payment Records Finalized'
                : dashboardData.payrollRun.status === 'processing'
                ? 'Generating Records...'
                : 'Payroll Status'}
            </h4>
            <p className={`text-sm mt-1 ${
              dashboardData.payrollRun.status === 'completed'
                ? 'text-success-700'
                : dashboardData.payrollRun.status === 'processing'
                ? 'text-warning-700'
                : 'text-default-600'
            }`}>
              {dashboardData.payrollRun.status === 'completed'
                ? `Records for ${months[selectedMonth - 1]} ${selectedYear} were prepared on ${dashboardData.payrollRun.completedAt ? new Date(dashboardData.payrollRun.completedAt).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}. `
                : `Payroll records for ${months[selectedMonth - 1]} ${selectedYear} are currently being generated. `
              }
              {dashboardData.payrollRun.processedEmployees} of {dashboardData.payrollRun.totalEmployees} active {dashboardData.payrollRun.totalEmployees === 1 ? 'employee' : 'employees'} processed
              {staff.length > dashboardData.payrollRun.totalEmployees && (
                <span className="text-xs ml-2 text-default-500">(Total staff in system: {staff.length})</span>
              )}
              {(() => {
                const activeCount = getActiveStaffCount();
                if (activeCount > dashboardData.payrollRun.totalEmployees) {
                  return (
                    <span className="text-xs ml-2 text-warning-600 font-medium">
                      ({activeCount - dashboardData.payrollRun.totalEmployees} more active staff not included)
                    </span>
                  );
                }
                return null;
              })()}
              {dashboardData.payrollRun.status === 'completed' && dashboardData.payrollRun.totalPaid > 0 && (
                <>. Total amount recorded: <strong>{formatCurrency(dashboardData.payrollRun.totalPaid)}</strong></>
              )}
            </p>

            {/* Staff Status Breakdown */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-default-500">{t('pages.systemStaff')}</span>
              {Object.entries(staff.reduce((acc, s) => {
                const status = s.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {})).map(([status, count]) => (
                <span key={status} className="text-xs px-2 py-1 bg-default-100 rounded-full">
                  {count} {status}
                </span>
              ))}
            </div>

            {dashboardData.payrollRun.errorLog && dashboardData.payrollRun.errorLog.length > 0 && (
              <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded">
                <p className="text-xs text-danger-700">
                  <strong>{t('pages.errors')}</strong> {dashboardData.payrollRun.errorLog.length} employees failed
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <Chip
              size="sm"
              color={dashboardData.payrollRun.status === 'completed' ? 'success' : dashboardData.payrollRun.status === 'processing' ? 'warning' : 'default'}
              variant="flat"
              className="capitalize"
            >
              {dashboardData.payrollRun.status === 'completed' && 'Finalized'}
              {dashboardData.payrollRun.status === 'processing' && 'Processing'}
              {dashboardData.payrollRun.status === 'partial' && 'Partial'}
            </Chip>
          </div>
        </div>
      )}

      {!dashboardData.payrollRun && (
        <div className="bg-info-50 border border-info-200 rounded-lg p-4 flex items-start gap-4">
          <div className="p-2 bg-info-100 rounded-lg">
            <AlertCircle size={20} className="text-info-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-info-900">{t('pages.recordsNotYetGenerated')}</h4>
            <p className="text-sm text-info-700 mt-1">
              Payroll records for <strong>{months[selectedMonth - 1]} {selectedYear}</strong> have not been generated yet.
              {(() => {
                const activeCount = getActiveStaffCount();
                const inactiveCount = staff.length - activeCount;
                return (
                  <>
                    {activeCount > 0 && (
                      <> {activeCount} active {activeCount === 1 ? 'employee' : 'employees'} available for records.</>
                    )}
                    {inactiveCount > 0 && (
                      <> {inactiveCount} inactive {inactiveCount === 1 ? 'employee' : 'employees'} will be excluded.</>
                    )}
                  </>
                );
              })()}
              Click "Run Payroll" to generate salary records for all active staff.
            </p>

            {/* Staff Status Breakdown */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-info-600">{t('pages.allStaff2')}</span>
              {Object.entries(staff.reduce((acc, s) => {
                const status = s.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {})).map(([status, count]) => (
                <span key={status} className="text-xs px-2 py-1 bg-info-100 rounded-full">
                  {count} {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../i18n/index';

/**
 * REVAMP-17: Status banner uses the .payroll-banner + chip atoms.
 * Three tones — ok (completed), warn (processing), info (not yet
 * generated). Errors render an inline chip--danger row.
 */
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

  const run = dashboardData.payrollRun;
  const period = `${months[selectedMonth - 1]} ${selectedYear}`;

  // Status breakdown chips — counts of staff in each lifecycle state
  const statusBreakdown = Object.entries(
    (staff || []).reduce((acc, s) => {
      const status = s.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  );

  if (!run) {
    const activeCount = getActiveStaffCount();
    const inactiveCount = (staff?.length || 0) - activeCount;
    return (
      <div className="payroll-banner payroll-banner--info" role="status">
        <div className="payroll-banner__icon is-info">
          <AlertCircle size={16} />
        </div>
        <div className="payroll-banner__body">
          <div className="payroll-banner__title">
            {t('pages.recordsNotYetGenerated')}
          </div>
          <div>
            Records for <strong>{period}</strong> have not been generated yet.
            {activeCount > 0 && (
              <> {activeCount} active {activeCount === 1 ? 'employee' : 'employees'} available.</>
            )}
            {inactiveCount > 0 && (
              <> {inactiveCount} inactive {inactiveCount === 1 ? 'employee' : 'employees'} will be excluded.</>
            )}
          </div>
          <div className="payroll-banner__chips">
            {statusBreakdown.map(([status, count]) => (
              <span key={status} className="chip">
                <span className="mono tnum">{count}</span> {status}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tone =
    run.status === 'completed' ? 'ok' :
    run.status === 'processing' ? 'warn' :
    run.status === 'partial' ? 'warn' :
    'info';

  const title =
    run.status === 'completed' ? 'Payment Records Finalized' :
    run.status === 'processing' ? 'Generating Records…' :
    run.status === 'partial' ? 'Partially Generated' :
    'Payroll Status';

  const completedAt = run.completedAt
    ? new Date(run.completedAt).toLocaleDateString(getDateLocale(), {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

  const activeCount = getActiveStaffCount();
  const missingCount = activeCount > run.totalEmployees
    ? activeCount - run.totalEmployees
    : 0;

  return (
    <div className={`payroll-banner payroll-banner--${tone}`} role="status">
      <div className={`payroll-banner__icon is-${tone}`}>
        {run.status === 'completed' ? <CheckCircle2 size={16} /> :
         run.status === 'processing' ? <Clock size={16} /> :
         <AlertCircle size={16} />}
      </div>
      <div className="payroll-banner__body">
        <div className="payroll-banner__title">{title}</div>
        <div>
          {run.status === 'completed'
            ? <>Records for <strong>{period}</strong> were prepared on <span className="mono tnum">{completedAt}</span>. </>
            : <>Records for <strong>{period}</strong> are currently being generated. </>
          }
          <span className="mono tnum">{run.processedEmployees}</span> of{' '}
          <span className="mono tnum">{run.totalEmployees}</span>{' '}
          {run.totalEmployees === 1 ? 'employee' : 'employees'} processed.
          {run.status === 'completed' && run.totalPaid > 0 && (
            <> Total recorded: <strong className="mono tnum">{formatCurrency(run.totalPaid)}</strong>.</>
          )}
        </div>
        <div className="payroll-banner__chips">
          {statusBreakdown.map(([status, count]) => (
            <span key={status} className="chip">
              <span className="mono tnum">{count}</span> {status}
            </span>
          ))}
          {missingCount > 0 && (
            <span className="chip chip--warn">
              <span className="mono tnum">{missingCount}</span> active not included
            </span>
          )}
          {run.errorLog && run.errorLog.length > 0 && (
            <span className="chip chip--danger">
              <span className="mono tnum">{run.errorLog.length}</span> failed
            </span>
          )}
        </div>
      </div>
      <span className={`status status--${tone}`}>
        <span className="dot" />
        {run.status}
      </span>
    </div>
  );
}

import { useState, useEffect, useMemo, useId } from 'react';
import logger from "../../utils/logger";
import { reportsApi } from '../../services/api/extensions';
import { useAppMeta } from '../../context/AppContext';
import { getAcademicYearOptions } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import ErrorState from '../../components/ui/ErrorState';
import Tabs from '../../components/ui/Tabs';
import Select from '../../components/ui/Select';
import AttendanceTab from './components/AttendanceTab';
import MarksTab from './components/MarksTab';
import FeesTab from './components/FeesTab';

const TABS = [
  { key: 'attendance', title: 'Attendance' },
  { key: 'marks', title: 'Marks' },
  { key: 'fees', title: 'Fees' },
];

export default function ReportsPage() {
  const baseId = useId();
  const tabpanelId = `${baseId}-tabpanel`;
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useAppMeta();
  const [activeTab, setActiveTab] = useState('attendance');
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 }),
    [currentAcademicYear]
  );

  const academicYear = selectedAcademicYear;

  useEffect(() => {
    if (!academicYear) return undefined;
    let cancelled = false;
    (async () => {
      setMetricsError(null);
      try {
        const data = await reportsApi.dashboardMetrics({ academicYear });
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) {
          logger.error('Failed to load dashboard metrics:', err);
          setMetricsError(err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [academicYear, reloadKey]);

  const yearSelector = (
    <Select
      label="Academic Year"
      size="sm"
      value={academicYear || ''}
      onChange={(e) =>
        setSelectedAcademicYear(
          e.target.value === currentAcademicYear ? null : e.target.value
        )
      }
      wrapperClassName="min-w-[160px]"
    >
      {academicYearOptions.map((yr) => (
        <option key={yr} value={yr}>
          {yr}
        </option>
      ))}
    </Select>
  );

  return (
    <main className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        description="View and analyze school data"
        actions={yearSelector}
        bordered={false}
        size="lg"
      />

      <Tabs
        tabs={TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="underline"
        ariaLabel="Report sections"
      />

      <div
        id={tabpanelId}
        role="tabpanel"
        aria-label="Report content"
        aria-live="polite"
      >
        {metricsError ? (
          <ErrorState
            title="Unable to load reports"
            error={metricsError}
            onRetry={() => setReloadKey((k) => k + 1)}
            size="lg"
          />
        ) : (
          <>
            {activeTab === 'attendance' && <AttendanceTab metrics={metrics} />}
            {activeTab === 'marks' && <MarksTab academicYear={academicYear} />}
            {activeTab === 'fees' && <FeesTab metrics={metrics} academicYear={academicYear} />}
          </>
        )}
      </div>
    </main>
  );
}

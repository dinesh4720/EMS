import { useState, useEffect, useMemo } from 'react';
import { reportsApi } from '../../services/api/extensions';
import { useApp } from '../../context/AppContext';
import { getAcademicYearOptions } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Select from '../../components/ui/Select';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import AttendanceTab from './components/AttendanceTab';
import MarksTab from './components/MarksTab';
import FeesTab from './components/FeesTab';

const TABS = [
  { key: 'attendance', title: 'Attendance' },
  { key: 'marks', title: 'Marks' },
  { key: 'fees', title: 'Fees' },
];

export default function ReportsPage() {
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useApp();
  const [activeTab, setActiveTab] = useState('attendance');
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 }),
    [currentAcademicYear]
  );

  const academicYear = selectedAcademicYear;

  useEffect(() => {
    if (!academicYear) return undefined;
    let cancelled = false;
    setMetricsLoading(true);
    setMetricsError(null);
    (async () => {
      try {
        const data = await reportsApi.dashboardMetrics({ academicYear });
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load dashboard metrics:', err);
          setMetricsError(err?.message || 'Failed to load dashboard metrics');
        }
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [academicYear]);

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
    <div className="p-6 space-y-6 animate-fade-in">
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
      />

      {metricsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : metricsError ? (
        <ErrorState
          title="Failed to load dashboard metrics"
          error={metricsError}
          onRetry={() => {
            setMetricsError(null);
            setMetricsLoading(true);
            reportsApi.dashboardMetrics({ academicYear })
              .then(setMetrics)
              .catch((err) => setMetricsError(err?.message || 'Failed to load dashboard metrics'))
              .finally(() => setMetricsLoading(false));
          }}
        />
      ) : (
        <div>
          {activeTab === 'attendance' && <AttendanceTab metrics={metrics} />}
          {activeTab === 'marks' && <MarksTab academicYear={academicYear} />}
          {activeTab === 'fees' && <FeesTab metrics={metrics} academicYear={academicYear} />}
        </div>
      )}
    </div>
  );
}

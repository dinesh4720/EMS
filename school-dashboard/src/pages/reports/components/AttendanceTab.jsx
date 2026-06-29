import { useState, useEffect, useMemo } from 'react';
import logger from "../../../utils/logger";
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../services/api/extensions';
import { classesApi } from '../../../services/api/classes';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import Alert from '../../../components/ui/Alert';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import SectionHeading from '../../../components/ui/SectionHeading';
import AttendanceTrendChart from './AttendanceTrendChart';
import ReportTable from './ReportTable';

function toDateInput(date) {
  return date.toISOString().split('T')[0];
}
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start: toDateInput(start), end: toDateInput(end) };
}

const THRESHOLD_OPTIONS = [60, 65, 70, 75, 80, 85];

export default function AttendanceTab({ metrics }) {
  const range = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chronicThreshold, setChronicThreshold] = useState(75);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    classesApi
      .getAll()
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch((err) => logger.error('Failed to load classes:', err));
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { startDate, endDate };
        if (classId) params.classId = classId;
        const data = await reportsApi.studentAttendance(params);
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        logger.error('Failed to load attendance report:', err);
        if (!cancelled) {
          setRows([]);
          setError(err);
          toast.error('Failed to load attendance report. Refresh to try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, startDate, endDate, reloadKey]);

  const students = metrics?.students || {};

  const chronicAbsentees = useMemo(
    () =>
      rows
        .filter((row) => row.percentage < chronicThreshold)
        .sort((rowA, rowB) => rowA.percentage - rowB.percentage),
    [rows, chronicThreshold]
  );

  const studentColumns = [
    {
      key: 'studentName',
      header: 'Student',
      render: (row) => (
        <div>
          <div className="font-medium">{row.studentName}</div>
          {row.rollNo && (
            <div className="text-xs text-[var(--color-text-muted)]">Roll: {row.rollNo}</div>
          )}
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (row) => (
        <span className="text-[var(--color-text-secondary)]">
          {row.className}
          {row.classSection ? ` ${row.classSection}` : ''}
        </span>
      ),
    },
    {
      key: 'present',
      header: 'Present',
      align: 'center',
      render: (row) => (
        <span className="font-medium text-[var(--color-success)]">{row.present}</span>
      ),
    },
    {
      key: 'absent',
      header: 'Absent',
      align: 'center',
      render: (row) => (
        <span className="font-medium text-[var(--color-error)]">{row.absent}</span>
      ),
    },
    {
      key: 'percentage',
      header: 'Attendance %',
      align: 'center',
      render: (row) => <span className="font-semibold">{row.percentage}%</span>,
    },
  ];

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={loading ? 'true' : undefined}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Active Students"
          value={students.total ?? 0}
          icon={Users}
          color="gray"
        />
        <StatCard
          label="Today Present"
          value={students.todayPresent ?? 0}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          label="Today Absent"
          value={students.todayAbsent ?? 0}
          icon={UserX}
          color="danger"
        />
        <StatCard
          label="Attendance Rate"
          value={`${students.todayAttendanceRate ?? 0}%`}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="From"
          type="date"
          size="sm"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          wrapperClassName="min-w-[140px]"
        />
        <Input
          label="To"
          type="date"
          size="sm"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          wrapperClassName="min-w-[140px]"
        />
        <Select
          label="Class"
          size="sm"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          wrapperClassName="min-w-[180px]"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
              {cls.section ? ` ${cls.section}` : ''}
            </option>
          ))}
        </Select>
      </div>

      {startDate && endDate && (
        <AttendanceTrendChart startDate={startDate} endDate={endDate} classId={classId} />
      )}

      {!loading && !error && chronicAbsentees.length > 0 && (
        <Alert
          variant="danger"
          title={`Chronic Absentees (${chronicAbsentees.length})`}
          description={`Students with attendance below ${chronicThreshold}% threshold`}
        >
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2 justify-end">
              <Select
                label="Threshold"
                size="sm"
                value={String(chronicThreshold)}
                onChange={(e) => setChronicThreshold(Number(e.target.value))}
                wrapperClassName="w-32"
              >
                {THRESHOLD_OPTIONS.map((t) => (
                  <option key={t} value={t}>{`${t}%`}</option>
                ))}
              </Select>
            </div>
            <ReportTable
              columns={studentColumns}
              rows={chronicAbsentees}
              getRowKey={(row, i) => `${row.studentName}-${i}`}
              aria-label="Chronic absentees"
            />
          </div>
        </Alert>
      )}

      <section className="space-y-3">
        <SectionHeading size="sm">All Students</SectionHeading>
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : error ? (
          <ErrorState
            size="sm"
            description="Could not load attendance records."
            error={error}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        ) : (
          <ReportTable
            columns={studentColumns}
            rows={rows}
            getRowKey={(row, i) => `${row.studentName}-${i}`}
            aria-label="All students attendance"
            emptyState={
              <EmptyState
                icon={Users}
                size="sm"
                title="No attendance records match the selected filters"
                description="Try selecting a different date range or class."
              />
            }
          />
        )}
      </section>
    </div>
  );
}

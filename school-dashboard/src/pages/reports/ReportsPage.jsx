import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Users, UserCheck, UserX, TrendingUp, AlertTriangle } from 'lucide-react';
import { reportsApi } from '../../services/api/extensions';
import { classesApi } from '../../services/api/classes';
import { examsApi } from '../../services/api/academics';
import { useApp } from '../../context/AppContext';
import { getAcademicYearOptions } from '../../utils/constants';
import toast from 'react-hot-toast';
import DSStatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import { SkeletonTable } from '../../components/ui/Skeleton';

function StatCard({ label, value, icon, color = 'gray' }) {
  return <DSStatCard label={label} value={value} icon={icon || Users} color={color} />;
}

/* ──────────────────────────────────────────────────────
   TABS
   ────────────────────────────────────────────────────── */
const TABS = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'marks', label: 'Marks' },
  { key: 'fees', label: 'Fees' },
];

/* ──────────────────────────────────────────────────────
   Helpers for default date range (last 30 days)
   ────────────────────────────────────────────────────── */
function toDateInput(date) {
  return date.toISOString().split('T')[0];
}
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start: toDateInput(start), end: toDateInput(end) };
}

/* ──────────────────────────────────────────────────────
   Attendance Trend Chart
   ────────────────────────────────────────────────────── */
function TrendChartSkeleton() {
  return (
    <div className="h-52 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
  );
}

function AttendanceTrendChart({ startDate, endDate, classId }) {
  const [groupBy, setGroupBy] = useState('day');
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate || !endDate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { startDate, endDate, groupBy };
        if (classId) params.classId = classId;
        const data = await reportsApi.attendanceTrend(params);
        if (!cancelled) setTrendData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load attendance trend:', err);
        if (!cancelled) {
          setTrendData([]);
          toast.error('Failed to load attendance trend');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [startDate, endDate, classId, groupBy]);

  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Trend</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">School-wide attendance rate over time</p>
        </div>
        <div className="flex gap-1">
          {['day', 'week', 'month'].map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              disabled={loading}
              className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                groupBy === g
                  ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TrendChartSkeleton />
      ) : trendData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm">
          No attendance data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-gray-500 dark:text-zinc-400"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              className="text-gray-500 dark:text-zinc-400"
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Attendance Rate']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            />
            <ReferenceLine y={75} stroke="#f87171" strokeDasharray="4 4" label={{ value: '75%', position: 'right', fontSize: 11, fill: '#f87171' }} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#6366f1"
              strokeWidth={2}
              dot={trendData.length <= 31}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ATTENDANCE TAB
   ══════════════════════════════════════════════════════ */
function AttendanceTab({ metrics }) {
  const range = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chronicThreshold, setChronicThreshold] = useState(75);

  useEffect(() => {
    classesApi.getAll()
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load classes:', err));
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { startDate, endDate };
        if (classId) params.classId = classId;
        const data = await reportsApi.studentAttendance(params);
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load attendance report:', err);
        if (!cancelled) {
          setRows([]);
          toast.error('Failed to load attendance report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classId, startDate, endDate]);

  const students = metrics?.students || {};

  // Chronic absentees: students below threshold, sorted by ascending attendance %
  const chronicAbsentees = useMemo(
    () => rows.filter((r) => r.percentage < chronicThreshold).sort((a, b) => a.percentage - b.percentage),
    [rows, chronicThreshold]
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Students" value={students.total ?? 0} icon={Users} color="gray" />
        <StatCard label="Today Present" value={students.todayPresent ?? 0} icon={UserCheck} color="success" />
        <StatCard label="Today Absent" value={students.todayAbsent ?? 0} icon={UserX} color="danger" />
        <StatCard label="Attendance Rate" value={`${students.todayAttendanceRate ?? 0}%`} icon={TrendingUp} color="primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}{cls.section ? ` ${cls.section}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trend Chart */}
      {startDate && endDate && (
        <AttendanceTrendChart startDate={startDate} endDate={endDate} classId={classId} />
      )}

      {/* Chronic Absentees */}
      {!loading && chronicAbsentees.length > 0 && (
        <Alert
          variant="danger"
          title={`Chronic Absentees (${chronicAbsentees.length})`}
          description="Students below attendance threshold"
        >
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2 justify-end">
              <label className="text-xs text-[var(--color-text-muted)]">Threshold</label>
              <select
                value={chronicThreshold}
                onChange={(e) => setChronicThreshold(Number(e.target.value))}
                className="border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs bg-[var(--color-bg)] text-[var(--color-text-primary)]"
              >
                <option value={60}>60%</option>
                <option value={65}>65%</option>
                <option value={70}>70%</option>
                <option value={75}>75%</option>
                <option value={80}>80%</option>
                <option value={85}>85%</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 px-3 text-[var(--color-error)] font-medium text-xs">Student</th>
                    <th className="text-left py-2 px-3 text-[var(--color-error)] font-medium text-xs">Class</th>
                    <th className="text-center py-2 px-3 text-[var(--color-error)] font-medium text-xs">Present</th>
                    <th className="text-center py-2 px-3 text-[var(--color-error)] font-medium text-xs">Absent</th>
                    <th className="text-center py-2 px-3 text-[var(--color-error)] font-medium text-xs">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {chronicAbsentees.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]/50 last:border-0">
                      <td className="py-2 px-3 text-[var(--color-text-primary)]">
                        <div>{row.studentName}</div>
                        {row.rollNo && <div className="text-xs text-[var(--color-text-muted)]">Roll: {row.rollNo}</div>}
                      </td>
                      <td className="py-2 px-3 text-[var(--color-text-secondary)]">
                        {row.className}{row.classSection ? ` ${row.classSection}` : ''}
                      </td>
                      <td className="text-center py-2 px-3 text-[var(--color-success)] font-medium">{row.present}</td>
                      <td className="text-center py-2 px-3 text-[var(--color-error)] font-medium">{row.absent}</td>
                      <td className="text-center py-2 px-3 font-semibold text-[var(--color-error)]">{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Alert>
      )}

      {/* All Students Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">All Students</h3>
        {rows.length === 0 && !loading ? (
          <EmptyState
            icon={Users}
            size="sm"
            title="No attendance records found"
            description="No data available for the selected filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Student</th>
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Class</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Present</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Absent</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                      <td className="py-3 px-4" colSpan={5}>
                        <div className="h-5 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        <div>{row.studentName}</div>
                        {row.rollNo && <div className="text-xs text-gray-400 dark:text-zinc-500">Roll: {row.rollNo}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                        {row.className}{row.classSection ? ` ${row.classSection}` : ''}
                      </td>
                      <td className="text-center py-3 px-4 text-green-600 dark:text-green-400 font-medium">{row.present}</td>
                      <td className="text-center py-3 px-4 text-red-600 dark:text-red-400 font-medium">{row.absent}</td>
                      <td className="text-center py-3 px-4 text-gray-900 dark:text-white font-medium">{row.percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MARKS TAB
   ══════════════════════════════════════════════════════ */
function MarksTab({ academicYear }) {
  const [examId, setExamId] = useState('');
  const [exams, setExams] = useState([]);
  const [classResults, setClassResults] = useState([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = academicYear ? { academicYear } : {};
    examsApi.getAll(params)
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load exams:', err));
  }, [academicYear]);

  const fetchData = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const params = { examId, academicYear };
      const [cr, sa, gd, rl] = await Promise.all([
        reportsApi.classResults(params),
        reportsApi.subjectAnalysis(params),
        reportsApi.gradeDistribution(params),
        reportsApi.rankList(params),
      ]);
      setClassResults(Array.isArray(cr) ? cr : []);
      setSubjectAnalysis(Array.isArray(sa) ? sa : []);
      setGradeDistribution(Array.isArray(gd) ? gd : []);
      setRankList(Array.isArray(rl) ? rl : []);
    } catch (err) {
      console.error('Failed to load marks report:', err);
      toast.error('Failed to load marks report');
    } finally {
      setLoading(false);
    }
  }, [examId, academicYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Exam Filter */}
      <div>
        <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Select exam</label>
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white min-w-[200px]"
        >
          <option value="">Select an exam</option>
          {exams.map((exam) => (
            <option key={exam._id} value={exam._id}>
              {exam.name}
            </option>
          ))}
        </select>
      </div>

      {!examId ? (
        <EmptyState
          icon={AlertTriangle}
          size="sm"
          title="Select an exam to view results"
          description="Choose an exam from the dropdown above."
        />
      ) : loading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : (
        <div className="space-y-8">
          {/* Class Results */}
          {classResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Class Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Class</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Students</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Pass %</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Avg %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classResults.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{r.className} {r.classSection}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.totalStudents}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.passPercentage}%</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.avgPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subject Analysis */}
          {subjectAnalysis.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Subject Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Subject</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Avg Marks</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Highest</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Pass %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectAnalysis.map((s, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{s._id}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{s.avgMarks}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{s.highestMarks}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{s.passPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grade Distribution */}
          {gradeDistribution.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Grade Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {gradeDistribution.map((g, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{g._id}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{g.count} students</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rank List */}
          {rankList.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Rank List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Student</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Marks</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">%</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankList.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">#{i + 1}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{r.studentId?.name}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.totalMarksObtained}</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.percentage}%</td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FEES TAB
   ══════════════════════════════════════════════════════ */
function FeesTab({ metrics, metricsLoading, academicYear }) {
  const [feeCollection, setFeeCollection] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [fc, od] = await Promise.all([
          reportsApi.feeCollection({ academicYear }),
          reportsApi.outstandingDues({ academicYear }),
        ]);
        setFeeCollection(Array.isArray(fc) ? fc : []);
        setOutstandingDues(Array.isArray(od) ? od : []);
      } catch (err) {
        console.error('Failed to load fee reports:', err);
        toast.error('Failed to load fee reports');
      } finally {
        setLoading(false);
      }
    })();
  }, [academicYear]);

  const fees = metrics?.fees || {};

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Monthly Collected" value={`₹${(fees.monthlyCollected ?? 0).toLocaleString()}`} />
        <StatCard label="Transactions" value={fees.monthlyTransactions ?? 0} />
        <StatCard label="Pending Amount" value={`₹${(fees.pendingAmount ?? 0).toLocaleString()}`} />
        <StatCard label="Pending Students" value={fees.pendingStudents ?? 0} />
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <div className="space-y-8">
          {/* Fee Collection */}
          {feeCollection.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Monthly Fee Collection</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Month</th>
                      <th className="text-right py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Collected</th>
                      <th className="text-center py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeCollection.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{r._id}</td>
                        <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-medium">
                          ₹{(r.totalCollected ?? 0).toLocaleString()}
                        </td>
                        <td className="text-center py-3 px-4 text-gray-700 dark:text-zinc-300">{r.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Outstanding Dues */}
          {outstandingDues.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Outstanding Dues</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Student</th>
                      <th className="text-left py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Class</th>
                      <th className="text-right py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Total Fee</th>
                      <th className="text-right py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Paid</th>
                      <th className="text-right py-3 px-4 text-gray-500 dark:text-zinc-400 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingDues.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{r.studentId?.name}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                          {r.classId?.name}{r.classId?.section ? ` ${r.classId.section}` : ''}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700 dark:text-zinc-300">₹{(r.totalFee ?? 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-green-600 dark:text-green-400">₹{(r.totalPaid ?? 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-red-600 dark:text-red-400 font-medium">₹{(r.totalBalance ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN REPORTS PAGE
   ══════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const { currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useApp();
  const [activeTab, setActiveTab] = useState('attendance');
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 1 }),
    [currentAcademicYear]
  );

  const academicYear = selectedAcademicYear;

  useEffect(() => {
    if (!academicYear) return;
    (async () => {
      try {
        setMetricsLoading(true);
        const data = await reportsApi.dashboardMetrics({ academicYear });
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setMetricsLoading(false);
      }
    })();
  }, [academicYear]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">View and analyze school data</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Academic Year</label>
          <select
            value={academicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value === currentAcademicYear ? null : e.target.value)}
            className="border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          >
            {academicYearOptions.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-800 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'attendance' && (
          <AttendanceTab metrics={metrics} metricsLoading={metricsLoading} academicYear={academicYear} />
        )}
        {activeTab === 'marks' && <MarksTab academicYear={academicYear} />}
        {activeTab === 'fees' && (
          <FeesTab metrics={metrics} metricsLoading={metricsLoading} academicYear={academicYear} />
        )}
      </div>
    </div>
  );
}

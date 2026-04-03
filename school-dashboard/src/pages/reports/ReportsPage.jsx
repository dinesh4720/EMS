import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../services/api/extensions';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────────────
   Skeleton loaders
   ────────────────────────────────────────────────────── */
function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 dark:bg-zinc-800 rounded" />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   Stat Card
   ────────────────────────────────────────────────────── */
function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   TABS
   ────────────────────────────────────────────────────── */
const TABS = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'marks', label: 'Marks' },
  { key: 'fees', label: 'Fees' },
];

/* ══════════════════════════════════════════════════════
   ATTENDANCE TAB
   ══════════════════════════════════════════════════════ */
function AttendanceTab({ metrics, metricsLoading }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (classId) params.classId = classId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await reportsApi.studentAttendance(params);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [classId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const students = metrics?.students || {};
  const isEmpty = !metricsLoading && students.total === 0 && rows.length === 0;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Students" value={students.total ?? 0} />
        <StatCard label="Today Present" value={students.todayPresent ?? 0} />
        <StatCard label="Today Absent" value={students.todayAbsent ?? 0} />
        <StatCard label="Attendance Rate" value={`${students.todayAttendanceRate ?? 0}%`} />
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
          </select>
        </div>
      </div>

      {/* Table */}
      {isEmpty ? (
        <div className="text-center py-16 text-gray-500 dark:text-zinc-400">
          <p className="text-lg font-medium">No attendance records found</p>
          <p className="text-sm mt-1">No data available for the selected filters.</p>
        </div>
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
  );
}

/* ══════════════════════════════════════════════════════
   MARKS TAB
   ══════════════════════════════════════════════════════ */
function MarksTab() {
  const [examId, setExamId] = useState('');
  const [classResults, setClassResults] = useState([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const params = { examId };
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
    } catch {
      toast.error('Failed to load marks report');
    } finally {
      setLoading(false);
    }
  }, [examId]);

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
          <option value="mid-term">Mid-Term</option>
          <option value="final">Final</option>
        </select>
      </div>

      {!examId ? (
        <div className="text-center py-16 text-gray-500 dark:text-zinc-400">
          <p className="text-lg font-medium">Select an exam to view results</p>
          <p className="text-sm mt-1">Choose an exam from the dropdown above.</p>
        </div>
      ) : loading ? (
        <TableSkeleton rows={6} />
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
function FeesTab({ metrics, metricsLoading }) {
  const [feeCollection, setFeeCollection] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [fc, od] = await Promise.all([
          reportsApi.feeCollection(),
          reportsApi.outstandingDues(),
        ]);
        setFeeCollection(Array.isArray(fc) ? fc : []);
        setOutstandingDues(Array.isArray(od) ? od : []);
      } catch {
        toast.error('Failed to load fee reports');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <TableSkeleton />
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
  const [activeTab, setActiveTab] = useState('attendance');
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setMetricsLoading(true);
        const data = await reportsApi.dashboardMetrics();
        setMetrics(data);
      } catch {
        // metrics will stay null
      } finally {
        setMetricsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">View and analyze school data</p>
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
          <AttendanceTab metrics={metrics} metricsLoading={metricsLoading} />
        )}
        {activeTab === 'marks' && <MarksTab />}
        {activeTab === 'fees' && (
          <FeesTab metrics={metrics} metricsLoading={metricsLoading} />
        )}
      </div>
    </div>
  );
}

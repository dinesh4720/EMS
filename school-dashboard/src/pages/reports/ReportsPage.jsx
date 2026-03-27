import { useState, useEffect } from 'react';
import { Select, SelectItem, Input } from '@heroui/react';
import {
  BarChart3, TrendingUp, Users, IndianRupee, GraduationCap,
  ClipboardList, UserCheck, Calendar, ChevronRight, Download,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { reportsApi, examsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const REPORT_CATEGORIES = [
  {
    key: 'academic',
    label: 'Academic Reports',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
    reports: [
      { key: 'classResults', label: 'Class Results Summary', description: 'Pass/fail rates, averages by class' },
      { key: 'subjectAnalysis', label: 'Subject Analysis', description: 'Subject-wise performance breakdown' },
      { key: 'rankList', label: 'Rank List', description: 'Student rankings by exam' },
      { key: 'gradeDistribution', label: 'Grade Distribution', description: 'Grade-wise student counts' },
    ],
  },
  {
    key: 'financial',
    label: 'Financial Reports',
    icon: IndianRupee,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    reports: [
      { key: 'feeCollection', label: 'Fee Collection Summary', description: 'Total collections by period' },
      { key: 'outstandingDues', label: 'Outstanding Dues', description: 'Pending fee balances by student' },
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance Reports',
    icon: UserCheck,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    reports: [
      { key: 'studentAttendance', label: 'Student Attendance', description: 'Individual student attendance records' },
      { key: 'classwiseAttendance', label: 'Class-wise Summary', description: 'Attendance rates by class' },
    ],
  },
  {
    key: 'staff',
    label: 'Staff Reports',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950',
    reports: [
      { key: 'staffAttendance', label: 'Staff Attendance', description: 'Staff present/absent summary' },
      { key: 'payrollSummary', label: 'Payroll Summary', description: 'Salary disbursement overview' },
    ],
  },
  {
    key: 'operational',
    label: 'Operational Reports',
    icon: ClipboardList,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950',
    reports: [
      { key: 'studentStrength', label: 'Student Strength', description: 'Class-wise enrollment counts' },
      { key: 'admissions', label: 'Admissions Report', description: 'New admissions over time' },
    ],
  },
];

// Reports that require examId parameter
const ACADEMIC_REPORTS = ['classResults', 'subjectAnalysis', 'rankList', 'gradeDistribution'];
// Reports that require startDate/endDate parameters
const DATE_RANGE_REPORTS = ['studentAttendance', 'classwiseAttendance', 'staffAttendance'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const { classesWithTeachers, currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exams, setExams] = useState([]);
  const [filters, setFilters] = useState({
    classId: '',
    academicYear: currentAcademicYear || '',
    examId: '',
    startDate: '',
    endDate: '',
  });

  // Fetch exams list for academic reports
  useEffect(() => {
    examsApi.getAll().then((res) => {
      const list = res?.exams || res || [];
      setExams(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const handleExportCSV = () => {
    const data = reportData?.data || reportData;
    if (!Array.isArray(data) || !data.length) {
      toast.error('No data to export');
      return;
    }
    const columns = Object.keys(data[0]);
    const formatCell = (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return val.name || val.title || val.label || JSON.stringify(val);
      return String(val);
    };
    const rows = [
      columns,
      ...data.map(row => columns.map(col => formatCell(row[col])))
    ];
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport || 'report'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported as CSV');
  };

  const handleRunReport = async (reportKey) => {
    // Validate required params before calling API
    if (ACADEMIC_REPORTS.includes(reportKey) && !filters.examId) {
      toast.error('Please select an exam to generate this academic report');
      return;
    }
    if (DATE_RANGE_REPORTS.includes(reportKey) && (!filters.startDate || !filters.endDate)) {
      toast.error('Please select a start date and end date for this report');
      return;
    }

    setSelectedReport(reportKey);
    setLoading(true);
    setReportData(null);
    try {
      const fn = reportsApi[reportKey];
      if (!fn) throw new Error('Report not available');
      const params = {
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.academicYear && { academicYear: filters.academicYear }),
      };
      // Pass examId for academic reports
      if (ACADEMIC_REPORTS.includes(reportKey) && filters.examId) {
        params.examId = filters.examId;
      }
      // Pass date range for attendance/date-based reports
      if (DATE_RANGE_REPORTS.includes(reportKey)) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      }
      const data = await fn(params);
      setReportData(data);
    } catch (err) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) return <TablePageSkeleton title searchBar={false} kpiCards={0} rows={8} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{t('pages.reports1')}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('pages.generateAndViewSchoolReports')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <Select
              label={t('pages.academicYear1')}
              size="sm"
              selectedKeys={filters.academicYear ? [filters.academicYear] : []}
              onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}
            >
              {[currentAcademicYear].filter(Boolean).map((y) => (
                <SelectItem key={y} textValue={y}>{y}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Select
              label={t('pages.class1')}
              size="sm"
              selectedKeys={filters.classId ? [filters.classId] : []}
              onChange={(e) => {
                const val = e.target.value;
                const cls = (classesWithTeachers || []).find(c => (c._id || c.id) === val);
                setFilters((f) => ({ ...f, classId: cls?._id || cls?.id || val }));
              }}
            >
              {(classesWithTeachers || []).filter(c => c._id || c.id).map((c) => (
                <SelectItem key={c._id || c.id} textValue={c.name}>{c.name} {c.section || ''}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Select
              label="Exam"
              size="sm"
              selectedKeys={filters.examId ? [filters.examId] : []}
              onChange={(e) => setFilters((f) => ({ ...f, examId: e.target.value }))}
            >
              {exams.filter(ex => ex._id || ex.id).map((ex) => (
                <SelectItem key={ex._id || ex.id} textValue={ex.name || ex.title}>
                  {ex.name || ex.title}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Input
              label="Start Date"
              type="date"
              size="sm"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
            />
          </div>
          <div className="w-40">
            <Input
              label="End Date"
              type="date"
              size="sm"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
            />
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORT_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 overflow-hidden"
          >
            {/* Category Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div className={`w-9 h-9 rounded-lg ${cat.bg} flex items-center justify-center`}>
                <cat.icon size={18} className={cat.color} />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{cat.label}</h2>
            </div>

            {/* Report List */}
            <div className="divide-y divide-gray-200 dark:divide-zinc-800">
              {cat.reports.map((report) => (
                <button
                  key={report.key}
                  onClick={() => handleRunReport(report.key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-zinc-100">
                      {report.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{report.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Report Results
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Generated at {new Date().toLocaleTimeString()}
              </span>
              {Array.isArray(reportData?.data || reportData) && (reportData?.data || reportData).length > 0 && (
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                  startContent={<Download size={14} />}
                  onPress={handleExportCSV}
                >
                  Export CSV
                </Button>
              )}
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            {Array.isArray(reportData?.data || reportData) ? (
              <ReportTable data={reportData?.data || reportData} />
            ) : (
              <pre className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportTable({ data }) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">{t('pages.noDataAvailableForThisReport')}</p>;
  }

  const columns = Object.keys(data[0]);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-100 dark:bg-zinc-800">
          {columns.map((col) => (
            <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
              {col.replace(/([A-Z])/g, ' $1').trim()}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
        {data.map((row, i) => (
          // BUG-41: key uses actual _id to prevent React reuse issues; rank col uses row.rank/rankInClass not i
          <tr key={row._id || row.id || `row-${i}`} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
            {columns.map((col) => {
              let displayVal;
              if ((col === 'rank' || col === 'rankInClass') && (row[col] === null || row[col] === undefined)) {
                displayVal = i + 1;
              } else if (row[col] === null || row[col] === undefined) {
                displayVal = '—';
              } else if (typeof row[col] === 'object' && row[col] !== null) {
                // Handle nested objects (e.g. populated refs) — show name/title or stringify
                displayVal = row[col].name || row[col].title || row[col].label || (row[col]._id ? String(row[col]._id).slice(-6) : JSON.stringify(row[col]));
              } else if (typeof row[col] === 'string' && /^[0-9a-f]{24}$/i.test(row[col]) && !['_id', 'id'].includes(col)) {
                // ObjectId strings in non-id columns — show last 6 chars
                displayVal = `...${row[col].slice(-6)}`;
              } else {
                displayVal = String(row[col]);
              }
              return (
                <td key={col} className="px-4 py-2.5 text-gray-700 dark:text-zinc-300">
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

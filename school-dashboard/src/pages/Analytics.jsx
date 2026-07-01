import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Users, GraduationCap, BookOpen, IndianRupee,
  CheckCircle2, Award, Activity, Target, ArrowUpRight
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";
import { reportsApi, dashboardApi } from "../services/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from "../components/StatCard";
import { ChartCard, QuickActionTile, Card } from "../components/ui";
import { useChartTheme, CHART_COLORS } from "../utils/chartTheme";
import { getDateLocale } from '../i18n/index';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Pie segment palette (sequential gray scale) — keep semantic by referencing CHART_COLORS.
const PIE_PALETTE = [
  CHART_COLORS.neutral,
  '#9ca3af',
  '#d1d5db',
  CHART_COLORS.neutralLight,
];

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function getPresetDateRange(preset, currentAcademicYear, schoolSettings) {
  const today = new Date();
  if (preset === 'academic-year') {
    return parseAcademicYearRange(currentAcademicYear, schoolSettings);
  }
  if (preset === 'last-30-days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return { startDate: formatDateISO(start), endDate: formatDateISO(today) };
  }
  if (preset === 'last-90-days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    return { startDate: formatDateISO(start), endDate: formatDateISO(today) };
  }
  return parseAcademicYearRange(currentAcademicYear, schoolSettings);
}

function parseAcademicYearRange(currentAcademicYear, schoolSettings) {
  if (schoolSettings?.academicYearStart && schoolSettings?.academicYearEnd) {
    return {
      startDate: schoolSettings.academicYearStart,
      endDate: schoolSettings.academicYearEnd,
    };
  }

  const [startYearRaw = "", endYearRaw = ""] = String(currentAcademicYear || "").split("-");
  const startYear = Number.parseInt(startYearRaw, 10);
  const endYearSuffix = Number.parseInt(endYearRaw, 10);

  if (Number.isNaN(startYear) || Number.isNaN(endYearSuffix)) {
    const currentYear = new Date().getFullYear();
    return {
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
    };
  }

  const century = Math.floor(startYear / 100) * 100;
  const normalizedEndYear = century + endYearSuffix + (endYearSuffix < startYear % 100 ? 100 : 0);

  return {
    startDate: `${startYear}-04-01`,
    endDate: `${normalizedEndYear}-03-31`,
  };
}

function normalizeAttendanceStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function isPresentStatus(status) {
  return status === "present" || status === "p";
}

function getWeekdayLabel(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.toLocaleDateString(getDateLocale(), { weekday: "short" });
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface p-3 rounded-lg border border-border-token">
        <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-fg-muted capitalize">{entry.name}:</span>
            <span className="font-medium text-fg">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ViewAllLink = ({ to }) => (
  <Link
    to={to}
    className="text-xs text-fg-muted hover:text-fg flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 rounded"
  >
    View all
    <ArrowUpRight size={12} />
  </Link>
);

const MetricTile = ({ label, value, hint }) => (
  <div className="p-3 bg-surface-2 rounded-lg">
    <div className="text-xs text-fg-muted mb-1">{label}</div>
    <div className="text-2xl font-semibold text-fg">{value}</div>
    {hint && <div className="text-xs text-fg-faint mt-1">{hint}</div>}
  </div>
);

const SummaryRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-fg-faint" />}
      <span className="text-sm text-fg-muted">{label}</span>
    </div>
    <span className="text-sm font-medium text-fg">{value}</span>
  </div>
);

const DATE_PRESETS = [
  { key: 'academic-year', label: 'Academic Year' },
  { key: 'last-30-days', label: 'Last 30 Days' },
  { key: 'last-90-days', label: 'Last 90 Days' },
];

// Scoped date-range toggle — drives ONLY the attendance-trend fetch on this page.
// The other cards (distribution, fees, staff, KPIs) read current-state snapshots
// from AppContext and have no meaningful time-window interpretation, so the
// toggle lives next to the one card it actually filters (MOCK-08).
const DatePresetToggle = ({ value, onChange, size = 'sm' }) => {
  const pad = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-label="Attendance date range presets"
    >
      {DATE_PRESETS.map((preset) => {
        const active = value === preset.key;
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.key)}
            aria-pressed={active}
            className={`${pad} rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 ${
              active
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-white dark:bg-zinc-900 text-fg-muted border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};

export default function Analytics() {
  const { t } = useTranslation();
  // [SCH-204] `staff` / `classesWithTeachers` are still hydrated by AppContext,
  // but `students` (and `feeDefaulters`) are intentionally empty since PAG-05.
  // Student-derived KPIs now come from the server via `dashboardApi` below.
  const { staff, classesWithTeachers, schoolSettings, currentAcademicYear } = useApp();
  const chart = useChartTheme();
  const [datePreset, setDatePreset] = useState('academic-year');
  const [attendanceSummary, setAttendanceSummary] = useState({
    avgAttendance: null,
    weeklyTrend: [],
    totalRecordedDays: 0,
    loading: true,
    error: null,
  });
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);
  const [summary, setSummary] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setSummary((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await dashboardApi.getAnalyticsSummary();
        if (!cancelled) setSummary({ data, loading: false, error: null });
      } catch (error) {
        logger.error("Failed to load analytics summary:", error);
        if (!cancelled) {
          setSummary({
            data: null,
            loading: false,
            error: error?.message || "Failed to load analytics summary",
          });
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [summaryReloadKey]);

  const retrySummary = useCallback(() => setSummaryReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const loadAttendanceSummary = async () => {
      setAttendanceSummary((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { startDate, endDate } = getPresetDateRange(datePreset, currentAcademicYear, schoolSettings);

        const [classSummaryResult, trendResult] = await Promise.allSettled([
          reportsApi.classwiseAttendance({ startDate, endDate }),
          reportsApi.attendanceTrend({ startDate, endDate, groupBy: 'day' }),
        ]);

        if (cancelled) return;

        const classSummaries = normalizeListResponse(
          classSummaryResult.status === 'fulfilled' ? classSummaryResult.value : null
        );
        const trendPoints = normalizeListResponse(
          trendResult.status === 'fulfilled' ? trendResult.value : null
        );

        const totalPresent = classSummaries.reduce(
          (sum, item) => sum + (Number(item.present) || 0),
          0
        );
        const totalRecords = classSummaries.reduce(
          (sum, item) => sum + (Number(item.total) || 0),
          0
        );
        const avgAttendance = totalRecords > 0
          ? Number(((totalPresent / totalRecords) * 100).toFixed(1))
          : null;

        const weekdayBuckets = WEEKDAY_LABELS.reduce((acc, day) => {
          acc[day] = { rateSum: 0, count: 0 };
          return acc;
        }, {});

        trendPoints.forEach((point) => {
          const weekday = getWeekdayLabel(point.period);
          if (!weekday || !WEEKDAY_LABELS.includes(weekday)) return;
          const rate = Number(point.rate);
          if (Number.isNaN(rate)) return;
          weekdayBuckets[weekday].rateSum += rate;
          weekdayBuckets[weekday].count += 1;
        });

        const weeklyTrend = WEEKDAY_LABELS.map((day) => ({
          day,
          students: weekdayBuckets[day].count > 0
            ? Number((weekdayBuckets[day].rateSum / weekdayBuckets[day].count).toFixed(1))
            : null,
        }));

        setAttendanceSummary({
          avgAttendance,
          weeklyTrend,
          totalRecordedDays: totalRecords,
          loading: false,
          error: null,
        });
      } catch (error) {
        logger.error("Failed to load analytics attendance summary:", error);
        if (!cancelled) {
          setAttendanceSummary({
            avgAttendance: null,
            weeklyTrend: [],
            totalRecordedDays: 0,
            loading: false,
            error: error?.message || "Failed to load attendance trends",
          });
        }
      }
    };

    loadAttendanceSummary();
    return () => {
      cancelled = true;
    };
  }, [schoolSettings, currentAcademicYear, datePreset]);

  const analytics = useMemo(() => {
    const safeStaff = staff || [];
    const safeClasses = classesWithTeachers || [];

    // Student + fee KPIs and class distribution are aggregated server-side
    // (PAG-05 removed the client roster). Fall back to zeros before the fetch
    // resolves so the shape stays stable.
    const studentStats = summary.data?.students || {};
    const feeStats = summary.data?.fees || {};
    const classDistribution = summary.data?.classDistribution || [];

    const totalStudents = studentStats.total || 0;
    const largestClass = classDistribution.length
      ? [classDistribution[0].name, classDistribution[0].count]
      : undefined;
    const smallestClass = classDistribution.length
      ? [
          classDistribution[classDistribution.length - 1].name,
          classDistribution[classDistribution.length - 1].count,
        ]
      : undefined;
    const collectionRate = (
      typeof feeStats.collectionRate === "number" ? feeStats.collectionRate : 0
    ).toFixed(1);

    const activeStaff = safeStaff.filter(s => s.status === "active").length;
    const teachers = safeStaff.filter(s => s.role === "Teacher").length;
    const admins = safeStaff.filter(s => s.role === "Admin").length;
    const accountants = safeStaff.filter(s => s.role === "Accountant").length;
    const librarians = safeStaff.filter(s => s.role === "Librarian").length;
    const labAssistants = safeStaff.filter(s => s.role === "Lab Assistant").length;

    const staffByDepartment = {};
    safeStaff.forEach(s => {
      staffByDepartment[s.department] = (staffByDepartment[s.department] || 0) + 1;
    });

    const totalClasses = safeClasses.length;
    const classesWithTeacher = safeClasses.filter(c => c.classTeacherId).length;
    const classesWithoutTeacher = totalClasses - classesWithTeacher;
    const avgClassSize = totalClasses > 0 ? (totalStudents / totalClasses).toFixed(1) : "0";

    return {
      students: {
        total: totalStudents,
        active: studentStats.active || 0,
        inactive: studentStats.inactive || 0,
        transferred: studentStats.transferred || 0,
        alumni: studentStats.alumni || 0,
        largestClass,
        smallestClass,
        avgAttendance: attendanceSummary.avgAttendance
      },
      fees: {
        paid: feeStats.paid || 0,
        pending: feeStats.pending || 0,
        overdue: feeStats.overdue || 0,
        collectionRate,
        defaulters: feeStats.defaulters || 0
      },
      staff: {
        total: safeStaff.length,
        active: activeStaff,
        teachers,
        admins,
        accountants,
        librarians,
        labAssistants,
        byDepartment: staffByDepartment
      },
      classes: {
        total: totalClasses,
        withTeacher: classesWithTeacher,
        withoutTeacher: classesWithoutTeacher,
        avgSize: avgClassSize
      }
    };
  }, [staff, classesWithTeachers, summary.data, attendanceSummary.avgAttendance]);

  // Student + fee cards depend on the server summary; staff/classes come from
  // still-hydrated context. Shimmer while loading, show "—" if the fetch failed.
  const summaryLoading = summary.loading && !summary.data;
  const summaryFailed = !!summary.error && !summary.data;

  const stats = [
    {
      label: "Total Students",
      value: summaryFailed ? "—" : analytics.students.total.toString(),
      subtext: summaryFailed ? "Unavailable" : `${analytics.students.active} active students`,
      icon: GraduationCap,
      color: "gray",
      isLoading: summaryLoading,
    },
    {
      label: "Total Staff",
      value: analytics.staff.total.toString(),
      subtext: `${analytics.staff.teachers} teachers`,
      icon: Users,
      color: "gray",
    },
    {
      label: "Total Classes",
      value: analytics.classes.total.toString(),
      subtext: `Avg ${summaryFailed ? "—" : analytics.classes.avgSize} students/class`,
      icon: BookOpen,
      color: "gray",
    },
    {
      label: "Fee Collection",
      value: summaryFailed ? "—" : `${analytics.fees.collectionRate}%`,
      subtext: summaryFailed ? "Unavailable" : `${analytics.fees.paid}/${analytics.students.total} paid`,
      icon: IndianRupee,
      color: "gray",
      isLoading: summaryLoading,
    }
  ];

  const studentDistribution = [
    { name: 'Active', value: analytics.students.active },
    { name: 'Inactive', value: analytics.students.inactive },
    { name: 'Transferred', value: analytics.students.transferred },
    { name: 'Alumni', value: analytics.students.alumni }
  ];
  const studentDistributionEmpty = studentDistribution.every((s) => !s.value);

  const feeData = [
    { name: 'Paid', value: analytics.fees.paid },
    { name: 'Pending', value: analytics.fees.pending },
    { name: 'Overdue', value: analytics.fees.overdue }
  ];
  const feeDataEmpty = feeData.every((f) => !f.value);

  const staffData = [
    { name: 'Teachers', value: analytics.staff.teachers },
    { name: 'Admins', value: analytics.staff.admins },
    { name: 'Accountants', value: analytics.staff.accountants },
    { name: 'Librarians', value: analytics.staff.librarians },
    { name: 'Lab Assistants', value: analytics.staff.labAssistants }
  ];
  const staffDataEmpty = staffData.every((s) => !s.value);

  const overallHealthScore = (() => {
    const scores = [
      analytics.students.avgAttendance,
      Number(analytics.fees.collectionRate),
      analytics.classes.total > 0 ? (analytics.classes.withTeacher / analytics.classes.total) * 100 : null,
    ].filter((v) => v != null && !Number.isNaN(v));
    return scores.length > 0
      ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
      : "—";
  })();

  return (
    <div className="min-h-screen pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-fg">
          Analytics
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          Comprehensive insights and metrics across all modules
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard
              title={t('pages.studentDistribution')}
              description={t('pages.byEnrollmentStatus')}
              actions={<ViewAllLink to="/students" />}
              height={200}
              isLoading={summaryLoading}
              error={summaryFailed ? summary.error : null}
              onRetry={retrySummary}
              isEmpty={studentDistributionEmpty}
              emptyTitle="No student data"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={studentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {studentDistribution.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t('pages.feeCollectionStatus')}
              description={t('pages.paymentDistribution')}
              actions={<ViewAllLink to="/fees" />}
              height={200}
              isLoading={summaryLoading}
              error={summaryFailed ? summary.error : null}
              onRetry={retrySummary}
              isEmpty={feeDataEmpty}
              emptyTitle="No fee data"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feeData}
                  barSize={40}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={CHART_COLORS.neutral} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t('pages.staffByRole')}
              description={t('pages.roleDistribution')}
              actions={<ViewAllLink to="/staffs" />}
              height={200}
              isEmpty={staffDataEmpty}
              emptyTitle="No staff data"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={staffData}
                  layout="vertical"
                  barSize={20}
                  margin={{ top: 5, right: 5, left: 60, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chart.tick, fontSize: 10 }}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={CHART_COLORS.neutral} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t('pages.attendanceTrends1')}
              description={t('pages.averageByWeekday')}
              actions={
                <DatePresetToggle value={datePreset} onChange={setDatePreset} />
              }
              height={200}
              isLoading={attendanceSummary.loading}
              isEmpty={!attendanceSummary.loading && attendanceSummary.totalRecordedDays === 0 && !attendanceSummary.error}
              error={attendanceSummary.error}
              emptyTitle="No attendance records"
              emptyDescription="No attendance records found for the selected date range."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={attendanceSummary.weeklyTrend}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.neutral} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.neutral} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chart.tick, fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke={CHART_COLORS.neutral}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                    name="Students %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <Card padding="md" radius="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
                <Target size={16} className="text-fg-muted" />
              </div>
              <div>
                <h3 className="font-medium text-fg text-sm">{t('pages.performanceSummary')}</h3>
                <p className="text-xs text-fg-muted">{t('pages.keyMetricsOverview')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <MetricTile
                label={t('pages.averageAttendance')}
                value={
                  attendanceSummary.loading
                    ? "..."
                    : analytics.students.avgAttendance != null
                      ? `${analytics.students.avgAttendance}%`
                      : "—"
                }
                hint={
                  attendanceSummary.totalRecordedDays > 0
                    ? `Based on ${attendanceSummary.totalRecordedDays} recorded days`
                    : "Target: 90%"
                }
              />
              <MetricTile
                label={t('pages.feeCollectionRate')}
                value={`${analytics.fees.collectionRate}%`}
                hint="Target: 95%"
              />
              <MetricTile
                label={t('pages.teacherAssignment')}
                value={`${analytics.classes.total > 0 ? ((analytics.classes.withTeacher / analytics.classes.total) * 100).toFixed(0) : "0"}%`}
                hint={`${analytics.classes.withTeacher}/${analytics.classes.total} classes`}
              />
              <MetricTile
                label={t('pages.overallHealthScore')}
                value={overallHealthScore}
                hint={t('pages.basedOnAllMetrics')}
              />
            </div>
          </Card>

          <Card padding="md" radius="lg">
            <h3 className="font-medium text-fg text-sm mb-4">
              {t('pages.quickActions1')}
            </h3>
            <div className="space-y-2">
              <QuickActionTile
                href="/students"
                icon={GraduationCap}
                label={t('pages.manageStudents')}
                description={`${analytics.students.total} total`}
              />
              <QuickActionTile
                href="/staffs"
                icon={Users}
                label={t('pages.manageStaff')}
                description={`${analytics.staff.total} total`}
              />
              <QuickActionTile
                href="/classes"
                icon={BookOpen}
                label={t('pages.manageClasses')}
                description={`${analytics.classes.total} total`}
              />
              <QuickActionTile
                href="/fees"
                icon={IndianRupee}
                label={t('pages.feeManagement')}
                description={`${analytics.fees.collectionRate}% collected`}
              />
            </div>
          </Card>

          <Card padding="md" radius="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-fg text-sm">{t('pages.studentBreakdown')}</h3>
              <ViewAllLink to="/students" />
            </div>

            <div className="space-y-3">
              <SummaryRow icon={CheckCircle2} label={t('pages.active')} value={analytics.students.active} />
              <SummaryRow icon={Award} label={t('pages.inactive')} value={analytics.students.inactive} />
              <SummaryRow icon={Activity} label={t('pages.transferred')} value={analytics.students.transferred} />
              <SummaryRow icon={Target} label={t('pages.alumni')} value={analytics.students.alumni} />
            </div>

            {analytics.students.largestClass && (
              <div className="mt-4 pt-4 border-t border-border-token">
                <div className="text-xs text-fg-muted mb-2">{t('pages.classInformation')}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-fg-muted">{t('pages.largest')}</span>
                  <span className="text-fg">{analytics.students.largestClass[0]} ({analytics.students.largestClass[1]})</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-fg-muted">{t('pages.smallest')}</span>
                  <span className="text-fg">{analytics.students.smallestClass[0]} ({analytics.students.smallestClass[1]})</span>
                </div>
              </div>
            )}
          </Card>

          <Card padding="md" radius="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-fg text-sm">{t('pages.staffByRole')}</h3>
              <ViewAllLink to="/staffs" />
            </div>

            <div className="space-y-3">
              <SummaryRow label={t('pages.teachers')} value={analytics.staff.teachers} />
              <SummaryRow label={t('pages.admins')} value={analytics.staff.admins} />
              <SummaryRow label={t('pages.accountants')} value={analytics.staff.accountants} />
              <SummaryRow label={t('pages.librarians')} value={analytics.staff.librarians} />
              <SummaryRow label={t('pages.labAssistants')} value={analytics.staff.labAssistants} />
            </div>

            {Object.entries(analytics.staff.byDepartment).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-token">
                <div className="text-xs text-fg-muted mb-2">{t('pages.topDepartments')}</div>
                {Object.entries(analytics.staff.byDepartment)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([dept, count]) => (
                    <div key={dept} className="flex justify-between text-xs mt-1">
                      <span className="text-fg-muted">{dept}</span>
                      <span className="text-fg">{count} staff</span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

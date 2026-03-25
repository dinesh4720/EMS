import { useEffect, useMemo, useState } from "react";
import { 
  Users, GraduationCap, BookOpen, IndianRupee, 
  CheckCircle2, AlertTriangle, Award, Activity, Target, ArrowUpRight
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";
import { attendanceApi } from "../services/api";
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from "../components/StatCard";
import { useChartTheme, CHART_COLORS } from "../utils/chartTheme";
import { getDateLocale } from '../i18n/index';
import { useTranslation } from 'react-i18next';


const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleDateString(getDateLocale(), { weekday: "short" });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 dark:bg-zinc-950 dark:border-zinc-800">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-zinc-400 capitalize">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { t } = useTranslation();
  const { students, staff, classesWithTeachers, feeDefaulters, schoolSettings, currentAcademicYear } = useApp();
  const chart = useChartTheme();
  const [attendanceSummary, setAttendanceSummary] = useState({
    avgAttendance: null,
    weeklyTrend: [],
    totalRecordedDays: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const loadAttendanceSummary = async () => {
      const activeStudents = (students || []).filter((student) => student?.status === "active" && student?.id);

      if (!activeStudents.length) {
        setAttendanceSummary({
          avgAttendance: null,
          weeklyTrend: [],
          totalRecordedDays: 0,
          loading: false,
        });
        return;
      }

      setAttendanceSummary((prev) => ({ ...prev, loading: true }));

      try {
        const { startDate, endDate } = parseAcademicYearRange(currentAcademicYear, schoolSettings);

        // Sample up to 50 students for analytics to avoid hundreds of API calls
        const sampleSize = Math.min(activeStudents.length, 50);
        const sampledStudents = sampleSize < activeStudents.length
          ? activeStudents.sort(() => 0.5 - Math.random()).slice(0, sampleSize)
          : activeStudents;

        const results = await Promise.allSettled(
          sampledStudents.map(async (student) => attendanceApi.getStudentAttendance(student.id, startDate, endDate))
        );

        const weekdayBuckets = WEEKDAY_LABELS.reduce((acc, day) => {
          acc[day] = { present: 0, total: 0 };
          return acc;
        }, {});

        const studentPercentages = [];
        let totalRecordedDays = 0;

        results.forEach((result) => {
          if (result.status !== "fulfilled") {
            return;
          }

          const records = Array.isArray(result.value)
            ? result.value.filter((record) => normalizeAttendanceStatus(record?.status))
            : [];

          if (records.length > 0) {
            const presentCount = records.filter((record) => isPresentStatus(normalizeAttendanceStatus(record.status))).length;
            studentPercentages.push((presentCount / records.length) * 100);
          }

          records.forEach((record) => {
            const weekday = getWeekdayLabel(record.date);

            if (!weekdayBuckets[weekday]) {
              return;
            }

            totalRecordedDays += 1;
            weekdayBuckets[weekday].total += 1;

            if (isPresentStatus(normalizeAttendanceStatus(record.status))) {
              weekdayBuckets[weekday].present += 1;
            }
          });
        });

        if (cancelled) {
          return;
        }

        setAttendanceSummary({
          avgAttendance: studentPercentages.length
            ? Number((studentPercentages.reduce((sum, value) => sum + value, 0) / studentPercentages.length).toFixed(1))
            : null,
          weeklyTrend: WEEKDAY_LABELS.map((day) => ({
            day,
            students: weekdayBuckets[day].total
              ? Number(((weekdayBuckets[day].present / weekdayBuckets[day].total) * 100).toFixed(1))
              : null,
          })),
          totalRecordedDays,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to load analytics attendance summary:", error);

        if (!cancelled) {
          setAttendanceSummary({
            avgAttendance: null,
            weeklyTrend: [],
            totalRecordedDays: 0,
            loading: false,
          });
        }
      }
    };

    loadAttendanceSummary();

    return () => {
      cancelled = true;
    };
  }, [students, schoolSettings, currentAcademicYear]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const safeStudents = students || [];
    const safeStaff = staff || [];
    const safeClasses = classesWithTeachers || [];

    // Student Analytics
    const activeStudents = safeStudents.filter(s => s.status === "active").length;
    const inactiveStudents = safeStudents.filter(s => s.status === "inactive").length;
    const transferredStudents = safeStudents.filter(s => s.status === "transferred").length;
    const alumniStudents = safeStudents.filter(s => s.status === "alumni").length;

    const studentsByClass = {};
    safeStudents.forEach(s => {
      studentsByClass[s.class] = (studentsByClass[s.class] || 0) + 1;
    });
    const largestClass = Object.entries(studentsByClass).sort((a, b) => b[1] - a[1])[0];
    const smallestClass = Object.entries(studentsByClass).sort((a, b) => a[1] - b[1])[0];

    // Fee Analytics
    const paidFees = safeStudents.filter(s => s.feeStatus === "paid").length;
    const pendingFees = safeStudents.filter(s => s.feeStatus === "pending").length;
    const overdueFees = safeStudents.filter(s => s.feeStatus === "overdue").length;
    const feeCollectionRate = safeStudents.length > 0 ? ((paidFees / safeStudents.length) * 100).toFixed(1) : "0.0";

    // Staff Analytics
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

    // Class Analytics
    const totalClasses = safeClasses.length;
    const classesWithTeacher = safeClasses.filter(c => c.classTeacherId).length;
    const classesWithoutTeacher = totalClasses - classesWithTeacher;
    const avgClassSize = totalClasses > 0 ? (safeStudents.length / totalClasses).toFixed(1) : "0";

    return {
      students: {
        total: safeStudents.length,
        active: activeStudents,
        inactive: inactiveStudents,
        transferred: transferredStudents,
        alumni: alumniStudents,
        largestClass,
        smallestClass,
        avgAttendance: attendanceSummary.avgAttendance
      },
      fees: {
        paid: paidFees,
        pending: pendingFees,
        overdue: overdueFees,
        collectionRate: feeCollectionRate,
        defaulters: feeDefaulters.length
      },
      staff: {
        total: staff.length,
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
  }, [students, staff, classesWithTeachers, feeDefaulters, attendanceSummary.avgAttendance]);

  // Stat cards data
  const stats = [
    {
      label: "Total Students",
      value: analytics.students.total.toString(),
      subtext: `${analytics.students.active} active students`,
      icon: GraduationCap,
      color: "gray",
      trend: { value: `${analytics.students.active}`, positive: true }
    },
    {
      label: "Total Staff",
      value: analytics.staff.total.toString(),
      subtext: `${analytics.staff.teachers} teachers`,
      icon: Users,
      color: "gray",
      trend: { value: `${analytics.staff.active}`, positive: true }
    },
    {
      label: "Total Classes",
      value: analytics.classes.total.toString(),
      subtext: `Avg ${analytics.classes.avgSize} students/class`,
      icon: BookOpen,
      color: "gray",
      trend: { value: analytics.classes.withTeacher, positive: true }
    },
    {
      label: "Fee Collection",
      value: `${analytics.fees.collectionRate}%`,
      subtext: `${analytics.fees.paid}/${analytics.students.total} paid`,
      icon: IndianRupee,
      color: "gray",
      trend: { value: analytics.fees.collectionRate, positive: true }
    }
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
          Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
          Comprehensive insights and metrics across all modules
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* MAIN CONTENT AREA */}
        <div className="xl:col-span-8 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Student Distribution Chart */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
              <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                      <Activity size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.studentDistribution')}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.byEnrollmentStatus')}</p>
                    </div>
                  </div>
                  <Link to="/students">
                    <span className="text-xs text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1">
                      View all
                      <ArrowUpRight size={12} />
                    </span>
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: analytics.students.active },
                          { name: 'Inactive', value: analytics.students.inactive },
                          { name: 'Transferred', value: analytics.students.transferred },
                          { name: 'Alumni', value: analytics.students.alumni }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill={CHART_COLORS.chart1}
                        dataKey="value"
                      >
                        {[
                          { color: '#6b7280' },
                          { color: '#9ca3af' },
                          { color: '#d1d5db' },
                          { color: '#e5e7eb' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Fee Collection Chart */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
              <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                      <Target size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.feeCollectionStatus')}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.paymentDistribution')}</p>
                    </div>
                  </div>
                  <Link to="/fees">
                    <span className="text-xs text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1">
                      View all
                      <ArrowUpRight size={12} />
                    </span>
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Paid', value: analytics.fees.paid },
                        { name: 'Pending', value: analytics.fees.pending },
                        { name: 'Overdue', value: analytics.fees.overdue }
                      ]}
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
                </div>
              </div>
            </div>

            {/* Staff by Role Chart */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
              <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                      <Users size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.staffByRole')}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.roleDistribution')}</p>
                    </div>
                  </div>
                  <Link to="/staffs">
                    <span className="text-xs text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1">
                      View all
                      <ArrowUpRight size={12} />
                    </span>
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Teachers', value: analytics.staff.teachers },
                        { name: 'Admins', value: analytics.staff.admins },
                        { name: 'Accountants', value: analytics.staff.accountants },
                        { name: 'Librarians', value: analytics.staff.librarians },
                        { name: 'Lab Assistants', value: analytics.staff.labAssistants }
                      ]}
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
                </div>
              </div>
            </div>

            {/* Attendance Trends Chart */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
              <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                      <Activity size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.attendanceTrends1')}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.averageByWeekday')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {attendanceSummary.loading ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
                    Loading attendance trends...
                  </div>
                ) : attendanceSummary.totalRecordedDays > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={attendanceSummary.weeklyTrend}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
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
                          stroke="#6b7280" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorStudents)" 
                          name="Students %"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-center text-sm text-gray-500">
                    No attendance records found for the current academic year.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="xl:col-span-4 space-y-4">
          {/* Performance Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                <Target size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.performanceSummary')}</h3>
                <p className="text-xs text-gray-500">{t('pages.keyMetricsOverview')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-zinc-900">
                <div className="text-xs text-gray-500 mb-1 dark:text-zinc-500">{t('pages.averageAttendance')}</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
                  {attendanceSummary.loading
                    ? "..."
                    : analytics.students.avgAttendance != null
                      ? `${analytics.students.avgAttendance}%`
                      : "—"}
                </div>
                <div className="text-xs text-gray-400 mt-1 dark:text-zinc-500">
                  {attendanceSummary.totalRecordedDays > 0
                    ? `Based on ${attendanceSummary.totalRecordedDays} recorded days`
                    : "Target: 90%"}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg dark:bg-zinc-900">
                <div className="text-xs text-gray-500 mb-1 dark:text-zinc-500">{t('pages.feeCollectionRate')}</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{analytics.fees.collectionRate}%</div>
                <div className="text-xs text-gray-400 mt-1 dark:text-zinc-500">Target: 95%</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg dark:bg-zinc-900">
                <div className="text-xs text-gray-500 mb-1 dark:text-zinc-500">{t('pages.teacherAssignment')}</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
                  {analytics.classes.total > 0 ? ((analytics.classes.withTeacher / analytics.classes.total) * 100).toFixed(0) : "0"}%
                </div>
                <div className="text-xs text-gray-400 mt-1 dark:text-zinc-500">
                  {analytics.classes.withTeacher}/{analytics.classes.total} classes
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg dark:bg-zinc-900">
                <div className="text-xs text-gray-500 mb-1 dark:text-zinc-500">{t('pages.overallHealthScore')}</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">85%</div>
                <div className="text-xs text-gray-400 mt-1 dark:text-zinc-500">{t('pages.basedOnAllMetrics')}</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 dark:bg-zinc-950 dark:border-zinc-800">
            <h3 className="font-medium text-gray-900 text-sm mb-4 dark:text-zinc-100">{t('pages.quickActions1')}</h3>
            <div className="space-y-2">
              <Link
                to="/students"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                  <GraduationCap size={14} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.manageStudents')}</div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">{analytics.students.total} total</div>
                </div>
              </Link>

              <Link
                to="/staffs"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                  <Users size={14} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.manageStaff')}</div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">{analytics.staff.total} total</div>
                </div>
              </Link>

              <Link
                to="/classes"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                  <BookOpen size={14} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.manageClasses')}</div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">{analytics.classes.total} total</div>
                </div>
              </Link>

              <Link
                to="/fees"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-zinc-800">
                  <IndianRupee size={14} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.feeManagement')}</div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">{analytics.fees.collectionRate}% collected</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Student Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.studentBreakdown')}</h3>
              <Link to="/students" className="text-xs text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.active')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.students.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.inactive')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.students.inactive}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.transferred')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.students.transferred}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.alumni')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.students.alumni}</span>
              </div>
            </div>

            {analytics.students.largestClass && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <div className="text-xs text-gray-500 mb-2 dark:text-zinc-500">{t('pages.classInformation')}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('pages.largest')}</span>
                  <span className="text-gray-900 dark:text-zinc-100">{analytics.students.largestClass[0]} ({analytics.students.largestClass[1]})</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500 dark:text-zinc-500">{t('pages.smallest')}</span>
                  <span className="text-gray-900 dark:text-zinc-100">{analytics.students.smallestClass[0]} ({analytics.students.smallestClass[1]})</span>
                </div>
              </div>
            )}
          </div>

          {/* Staff Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm dark:text-zinc-100">{t('pages.staffByRole')}</h3>
              <Link to="/staffs" className="text-xs text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.teachers')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.staff.teachers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.admins')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.staff.admins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.accountants')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.staff.accountants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.librarians')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.staff.librarians}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-zinc-400">{t('pages.labAssistants')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{analytics.staff.labAssistants}</span>
              </div>
            </div>

            {Object.entries(analytics.staff.byDepartment).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <div className="text-xs text-gray-500 mb-2 dark:text-zinc-500">{t('pages.topDepartments')}</div>
                {Object.entries(analytics.staff.byDepartment)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([dept, count]) => (
                    <div key={dept} className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">{dept}</span>
                      <span className="text-gray-900">{count} staff</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

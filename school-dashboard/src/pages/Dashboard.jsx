import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { announcementsApi, attendanceApi, feesApi } from "../services/api";
import StatCard from "../components/StatCard";
import ChartSection from "../components/ChartSection";
import ActivityFeed from "../components/ActivityFeed";
import AlertsPanel from "../components/AlertsPanel";
import QuickActions from "../components/QuickActions";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import NpsSurveyModal from "../components/NpsSurveyModal";
import GuidedTour, { useGuidedTour } from "../components/ui/GuidedTour";
import { getStoredUser } from "../utils/authSession";
import {
  GraduationCap,
  Users,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Clock,
} from "lucide-react";
import { getDateLocale } from "../i18n/index";
const getNumberFormatter = () => new Intl.NumberFormat(getDateLocale());
const getCurrencyFormatter = () => new Intl.NumberFormat(getDateLocale(), {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getMonthFormatter = () => new Intl.DateTimeFormat(getDateLocale(), { month: "short" });

const createEmptyAttendanceSnapshot = (totalClasses = 0) => ({
  studentRate: null,
  studentPresent: 0,
  studentTotal: 0,
  markedClasses: 0,
  totalClasses,
  staffRate: null,
  staffPresent: 0,
  staffMarked: 0,
  staffTotal: 0,
});

function toValidDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRecordDate(record) {
  return (
    record?.paymentDate ||
    record?.date ||
    record?.createdAt ||
    record?.updatedAt ||
    record?.sentAt ||
    record?.scheduledFor ||
    null
  );
}

function isSameDay(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function isSameMonth(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function normalizePayments(response, students) {
  const studentsById = new Map((students || []).map((student) => [String(student.id), student]));
  const records = Array.isArray(response)
    ? response
    : Array.isArray(response?.payments)
      ? response.payments
      : [];

  return records
    .map((payment) => {
      const studentId = String(payment?.studentId?._id || payment?.studentId || "");
      const studentRecord = studentsById.get(studentId);
      const recordDate = toValidDate(getRecordDate(payment));
      const amount = Number(payment?.amount || payment?.paidAmount || 0);
      const status = String(payment?.status || "paid").toLowerCase();

      return {
        id: payment?._id || payment?.id || `${studentId}-${recordDate?.toISOString() || "payment"}`,
        student: payment?.studentName || payment?.studentId?.name || studentRecord?.name || "Unknown student",
        className: payment?.className || payment?.studentId?.className || studentRecord?.class || studentRecord?.className || "—",
        amount: Number.isFinite(amount) ? amount : 0,
        status,
        date: recordDate?.toISOString() || null,
      };
    })
    .filter((payment) => payment.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function isSuccessfulPayment(payment) {
  return !["failed", "cancelled", "refunded"].includes(String(payment?.status || "").toLowerCase());
}

function normalizeAnnouncements(response) {
  const records = Array.isArray(response)
    ? response
    : Array.isArray(response?.announcements)
      ? response.announcements
      : [];

  return records
    .map((announcement) => {
      const recordDate = toValidDate(getRecordDate(announcement));

      return {
        id: announcement?._id || announcement?.id || announcement?.title || "announcement",
        title: announcement?.title || "Announcement",
        content: announcement?.content || announcement?.message || "",
        status: announcement?.status || "draft",
        date: recordDate?.toISOString() || null,
      };
    })
    .filter((announcement) => announcement.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function createFeeCollectionSeries(payments) {
  const now = new Date();
  const months = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      month: getMonthFormatter().format(monthDate),
      collected: 0,
    });
  }

  const monthIndex = new Map(months.map((month) => [month.key, month]));

  payments.forEach((payment) => {
    const paymentDate = toValidDate(payment.date);
    if (!paymentDate) {
      return;
    }

    const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
    const month = monthIndex.get(key);
    if (month) {
      month.collected += payment.amount;
    }
  });

  return months;
}

const DASHBOARD_TOUR_STEPS = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content: 'Use the sidebar to navigate between all modules — Students, Fees, Academics, Staff, and more.',
    placement: 'right',
  },
  {
    target: '[data-tour="stat-cards"]',
    title: 'Key Metrics',
    content: 'These cards show real-time stats: total students, staff, fee collection, and today\'s attendance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    content: 'Stay updated with alerts for pending attendance, overdue fees, and important announcements.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="fee-chart"]',
    title: 'Fee Collection Chart',
    content: 'Track monthly fee collection trends over the last 6 months.',
    placement: 'top',
  },
];

function Dashboard() {
  const {
    dashboardStats,
    classes,
    currentAcademicYear,
    loading,
    staff,
    staffAttendance,
    students,
  } = useApp();

  const { isOpen: isTourOpen, closeTour } = useGuidedTour('dashboard-v1', true);

  const [recentPayments, setRecentPayments] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [feeCollectionData, setFeeCollectionData] = useState([]);
  const [paymentSnapshot, setPaymentSnapshot] = useState({ today: null, month: null });
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(() => createEmptyAttendanceSnapshot());
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardFeed = async () => {
      setDashboardLoading(true);
      setPaymentsLoaded(false);

      try {
        const [paymentsResult, announcementsResult] = await Promise.allSettled([
          feesApi.getPayments({ academicYear: currentAcademicYear }),
          announcementsApi.getAll({}),
        ]);

        if (cancelled) {
          return;
        }

        const normalizedPayments = paymentsResult.status === "fulfilled"
          ? normalizePayments(paymentsResult.value, students)
          : [];
        const normalizedAnnouncements = announcementsResult.status === "fulfilled"
          ? normalizeAnnouncements(announcementsResult.value)
          : [];
        const now = new Date();
        const settledPayments = normalizedPayments.filter(isSuccessfulPayment);
        const liveAnnouncements = normalizedAnnouncements.filter((announcement) => announcement.status !== "draft");

        setRecentPayments(settledPayments.slice(0, 6));
        setRecentAnnouncements((liveAnnouncements.length > 0 ? liveAnnouncements : normalizedAnnouncements).slice(0, 6));
        setFeeCollectionData(createFeeCollectionSeries(settledPayments));
        setPaymentSnapshot({
          today: paymentsResult.status === "fulfilled" ? settledPayments.reduce((sum, payment) => {
            const paymentDate = toValidDate(payment.date);
            return paymentDate && isSameDay(paymentDate, now) ? sum + payment.amount : sum;
          }, 0) : null,
          month: paymentsResult.status === "fulfilled" ? settledPayments.reduce((sum, payment) => {
            const paymentDate = toValidDate(payment.date);
            return paymentDate && isSameMonth(paymentDate, now) ? sum + payment.amount : sum;
          }, 0) : null,
        });
        setPaymentsLoaded(paymentsResult.status === "fulfilled");
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboardFeed();

    return () => {
      cancelled = true;
    };
  }, [currentAcademicYear, students]);

  useEffect(() => {
    let cancelled = false;

    const loadStudentAttendanceSnapshot = async () => {
      const activeStudents = (students || []).filter((student) => (student.status || "active") === "active");
      const classesWithStudents = (classes || []).filter((classItem) =>
        activeStudents.some((student) => String(student.classId) === String(classItem.id))
      );

      if (!classesWithStudents.length) {
        setAttendanceSnapshot((current) => ({
          ...current,
          studentRate: null,
          studentPresent: 0,
          studentTotal: 0,
          markedClasses: 0,
          totalClasses: 0,
        }));
        return;
      }

      try {
        // Single API call replaces N per-class calls (fixes 429 rate-limit issue)
        const snapshot = await attendanceApi.getTodaySnapshot();

        if (cancelled) return;

        const classSummaries = snapshot?.classes || {};
        let totalPresent = 0;
        let totalStudentsInMarkedClasses = 0;
        let markedClassCount = 0;

        classesWithStudents.forEach((classItem) => {
          const classData = classSummaries[String(classItem.id)];
          if (classData && classData.total > 0) {
            markedClassCount += 1;
            const classStudentCount = activeStudents.filter(
              (student) => String(student.classId) === String(classItem.id)
            ).length;
            totalStudentsInMarkedClasses += classStudentCount;
            totalPresent += classData.present || 0;
          }
        });

        setAttendanceSnapshot((current) => ({
          ...current,
          studentRate: totalStudentsInMarkedClasses > 0
            ? Math.round((totalPresent / totalStudentsInMarkedClasses) * 100)
            : null,
          studentPresent: totalPresent,
          studentTotal: totalStudentsInMarkedClasses,
          markedClasses: markedClassCount,
          totalClasses: classesWithStudents.length,
        }));
      } catch {
        if (!cancelled) {
          setAttendanceSnapshot((current) => ({
            ...current,
            studentRate: null,
            studentPresent: 0,
            studentTotal: 0,
            markedClasses: 0,
            totalClasses: classesWithStudents.length,
          }));
        }
      }
    };

    loadStudentAttendanceSnapshot();

    return () => {
      cancelled = true;
    };
  }, [classes, students]);

  // Compute todayKey fresh each render so staffSnapshot stays current if
  // the component remains mounted across midnight.
  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], [
    // Re-evaluate when staffAttendance changes (most likely trigger after midnight)
    staffAttendance,
  ]);

  const staffSnapshot = useMemo(() => {
    const activeStaff = (staff || []).filter((staffMember) => (staffMember.status || "active") === "active");
    const markedStaff = activeStaff.filter((staffMember) => staffAttendance?.[staffMember.id]?.[todayKey]?.status);
    const presentStaff = markedStaff.filter((staffMember) => {
      const status = String(staffAttendance?.[staffMember.id]?.[todayKey]?.status || "").toLowerCase();
      return status === "present";
    });

    return {
      staffRate: markedStaff.length > 0 ? Math.round((presentStaff.length / markedStaff.length) * 100) : null,
      staffPresent: presentStaff.length,
      staffMarked: markedStaff.length,
      staffTotal: activeStaff.length,
    };
  }, [staff, staffAttendance, todayKey]);

  useEffect(() => {
    setAttendanceSnapshot((current) => ({
      ...current,
      ...staffSnapshot,
    }));
  }, [staffSnapshot]);

  const combinedAttendanceRate = useMemo(() => {
    const rates = [attendanceSnapshot.studentRate, attendanceSnapshot.staffRate].filter(
      (value) => typeof value === "number"
    );

    if (!rates.length) {
      return null;
    }

    return Math.round(rates.reduce((sum, value) => sum + value, 0) / rates.length);
  }, [attendanceSnapshot.staffRate, attendanceSnapshot.studentRate]);

  const attendanceRows = useMemo(() => {
    const rows = [];

    if (typeof attendanceSnapshot.studentRate === "number") {
      rows.push({
        label: "Students",
        value: attendanceSnapshot.studentRate,
        subtext: `${getNumberFormatter().format(attendanceSnapshot.studentPresent)} present across ${attendanceSnapshot.markedClasses}/${attendanceSnapshot.totalClasses} marked classes`,
      });
    }

    if (typeof attendanceSnapshot.staffRate === "number") {
      rows.push({
        label: "Staff",
        value: attendanceSnapshot.staffRate,
        subtext: `${getNumberFormatter().format(attendanceSnapshot.staffPresent)} present from ${attendanceSnapshot.staffMarked}/${attendanceSnapshot.staffTotal} marked staff records`,
      });
    }

    return rows;
  }, [attendanceSnapshot]);

  const alerts = useMemo(() => {
    const items = [];

    if (attendanceSnapshot.totalClasses > attendanceSnapshot.markedClasses) {
      items.push({
        id: "student-attendance-pending",
        type: "critical",
        title: "Student attendance pending",
        description: `${attendanceSnapshot.totalClasses - attendanceSnapshot.markedClasses} classes still do not have attendance marked for today.`,
        time: "Today",
      });
    }

    if (attendanceSnapshot.staffTotal > attendanceSnapshot.staffMarked) {
      items.push({
        id: "staff-attendance-pending",
        type: "warning",
        title: "Staff attendance pending",
        description: `${attendanceSnapshot.staffTotal - attendanceSnapshot.staffMarked} staff records are still unmarked for today.`,
        time: "Today",
      });
    }

    if (dashboardStats.feeDefaultersCount > 0) {
      items.push({
        id: "fee-defaulters",
        type: "warning",
        title: "Fee follow-up needed",
        description: `${getNumberFormatter().format(dashboardStats.feeDefaultersCount)} students currently have pending or overdue fees.`,
        time: "Live",
      });
    }

    if (dashboardStats.upcomingEvents > 0) {
      items.push({
        id: "upcoming-events",
        type: "info",
        title: "Upcoming events",
        description: `${getNumberFormatter().format(dashboardStats.upcomingEvents)} events are scheduled on the academic calendar.`,
        time: "This term",
      });
    }

    return items;
  }, [attendanceSnapshot, dashboardStats.feeDefaultersCount, dashboardStats.upcomingEvents]);

  const stats = useMemo(() => ([
    {
      label: "Total Students",
      value: loading ? "—" : getNumberFormatter().format(dashboardStats.totalStudents || 0),
      subtext: `${getNumberFormatter().format(dashboardStats.totalClasses || 0)} classes active`,
      icon: GraduationCap,
      color: "gray",
    },
    {
      label: "Teaching Staff",
      value: loading ? "—" : getNumberFormatter().format(dashboardStats.totalTeachers || 0),
      subtext: typeof attendanceSnapshot.staffRate === "number"
        ? `${getNumberFormatter().format(attendanceSnapshot.staffPresent)} present from ${getNumberFormatter().format(attendanceSnapshot.staffMarked)} marked records`
        : "Staff attendance not marked yet",
      icon: Users,
      color: "gray",
    },
    {
      label: "Fee Collection",
      value: paymentsLoaded ? getCurrencyFormatter().format(paymentSnapshot.today || 0) : "—",
      subtext: paymentsLoaded
        ? `${getCurrencyFormatter().format(paymentSnapshot.month || 0)} collected this month`
        : "Payment data unavailable",
      icon: IndianRupee,
      color: "gray",
    },
    {
      label: "Avg Attendance",
      value: typeof combinedAttendanceRate === "number" ? `${combinedAttendanceRate}%` : "—",
      subtext: [
        typeof attendanceSnapshot.studentRate === "number" ? `Students ${attendanceSnapshot.studentRate}%` : null,
        typeof attendanceSnapshot.staffRate === "number" ? `Staff ${attendanceSnapshot.staffRate}%` : null,
      ].filter(Boolean).join(" • ") || "Awaiting marked attendance",
      icon: CheckCircle2,
      color: "gray",
    },
  ]), [attendanceSnapshot, combinedAttendanceRate, dashboardStats, loading, paymentSnapshot, paymentsLoaded]);

  const quickActions = [
    { label: "Attendance", icon: CheckCircle2, href: "/classes" },
    { label: "Schedule", icon: Calendar, href: "/calendar" },
    { label: "Payments", icon: IndianRupee, href: "/fees" },
    { label: "Announce", icon: AlertCircle, href: "/messaging" },
  ];

  // ── Role Detection ──
  const storedUser = getStoredUser();
  const role = (storedUser?.role || "admin").toLowerCase();

  // ── Principal View: Academic Overview + Staff Attendance ──
  const principalStats = useMemo(() => {
    if (role !== "principal") return null;
    return [
      {
        label: "Total Students",
        value: loading ? "—" : getNumberFormatter().format(dashboardStats.totalStudents || 0),
        subtext: `${getNumberFormatter().format(dashboardStats.totalClasses || 0)} classes active`,
        icon: GraduationCap,
        color: "blue",
      },
      {
        label: "Total Staff",
        value: loading ? "—" : getNumberFormatter().format(dashboardStats.totalStaff || 0),
        subtext: `${getNumberFormatter().format(dashboardStats.activeStaff || 0)} active staff members`,
        icon: Users,
        color: "purple",
      },
    ];
  }, [role, loading, dashboardStats]);

  const principalStaffAttendance = useMemo(() => {
    if (role !== "principal") return null;
    return {
      total: attendanceSnapshot.staffTotal,
      present: attendanceSnapshot.staffPresent,
      marked: attendanceSnapshot.staffMarked,
      rate: attendanceSnapshot.staffRate,
    };
  }, [role, attendanceSnapshot]);

  // ── Accountant View: Finance Overview ──
  const accountantStats = useMemo(() => {
    if (role !== "accountant") return null;
    return [
      {
        label: "Today's Collections",
        value: paymentsLoaded ? getCurrencyFormatter().format(paymentSnapshot.today || 0) : "—",
        subtext: "Fee payments received today",
        icon: IndianRupee,
        color: "green",
      },
      {
        label: "Monthly Collections",
        value: paymentsLoaded ? getCurrencyFormatter().format(paymentSnapshot.month || 0) : "—",
        subtext: "Total collected this month",
        icon: IndianRupee,
        color: "blue",
      },
    ];
  }, [role, paymentsLoaded, paymentSnapshot]);

  // ── Teacher View: My Classes + Pending Tasks ──
  const teacherData = useMemo(() => {
    if (role !== "teacher") return null;
    const teacherId = storedUser?.id || storedUser?._id;
    const assignedClasses = (classes || []).filter(
      (c) => c.classTeacherId === teacherId
    );
    const classIds = new Set(assignedClasses.map((c) => c.id));
    const totalClassStudents = (students || []).filter((s) =>
      classIds.has(s.classId)
    ).length;

    // Check which assigned classes have attendance marked today
    const todayStr = new Date().toISOString().split("T")[0];
    const classesWithAttendance = assignedClasses.map((c) => {
      const classStudents = (students || []).filter(
        (s) => s.classId === c.id
      );
      // Check attendance snapshot from state for today
      const hasAttendance = classStudents.some((s) =>
        (attendanceSnapshot.markedClasses || 0) > 0
      );
      return {
        ...c,
        studentCount: classStudents.length,
        attendanceMarked: hasAttendance,
      };
    });

    const unmarkedCount = assignedClasses.length > 0
      ? assignedClasses.length - (attendanceSnapshot.markedClasses || 0)
      : 0;

    return {
      assignedClasses: classesWithAttendance,
      totalStudents: totalClassStudents,
      unmarkedAttendanceCount: Math.max(0, unmarkedCount),
    };
  }, [role, storedUser, classes, students, attendanceSnapshot]);

  return (
    <div className="min-h-screen pb-8">
      <GuidedTour
        tourId="dashboard-v1"
        steps={DASHBOARD_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={closeTour}
      />

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
          Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="stat-cards">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <QuickActions actions={quickActions} />

          <div data-tour="fee-chart">
            <ChartSection
              attendanceRows={attendanceRows}
              feeCollectionData={feeCollectionData}
              loading={loading || dashboardLoading}
              paymentsLoaded={paymentsLoaded}
            />
          </div>

          <ActivityFeed
            payments={recentPayments}
            announcements={recentAnnouncements}
            communications={[]}
          />

          {/* ── Principal View ── */}
          {role === "principal" && (
            <div className="space-y-4" data-testid="principal-section">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                Academic Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {principalStats?.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
              {principalStaffAttendance && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <Users size={16} className="text-purple-500" />
                    Staff Attendance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                        {getNumberFormatter().format(principalStaffAttendance.total)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Total Staff</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {getNumberFormatter().format(principalStaffAttendance.present)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Present Today</p>
                    </div>
                  </div>
                  {typeof principalStaffAttendance.rate === "number" && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                      {principalStaffAttendance.rate}% attendance rate ({principalStaffAttendance.marked} marked)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Accountant View ── */}
          {role === "accountant" && (
            <div className="space-y-4" data-testid="accountant-section">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                Finance Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accountantStats?.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
              {feeCollectionData.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <IndianRupee size={16} className="text-green-500" />
                    Monthly Collection Breakdown
                  </h3>
                  <div className="space-y-2">
                    {feeCollectionData.map((month) => (
                      <div key={month.key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">{month.month}</span>
                        <span className="font-medium text-gray-900 dark:text-zinc-100">
                          {getCurrencyFormatter().format(month.collected)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recentPayments.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">
                    Recent Transactions
                  </h3>
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-zinc-800 pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-zinc-100">
                            {payment.student}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">
                            {payment.className}
                          </p>
                        </div>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {getCurrencyFormatter().format(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Teacher View ── */}
          {role === "teacher" && teacherData && (
            <div className="space-y-4" data-testid="teacher-section">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                My Classes
              </h2>
              {teacherData.assignedClasses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teacherData.assignedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={16} className="text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-zinc-100">
                          Class {cls.name}-{cls.section}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {cls.studentCount} students
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                        Attendance: {cls.attendanceMarked ? "Marked" : "Not marked"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  No classes assigned.
                </p>
              )}
              {teacherData.unmarkedAttendanceCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="pending-tasks">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Pending Tasks
                    </h3>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {teacherData.unmarkedAttendanceCount} {teacherData.unmarkedAttendanceCount === 1 ? "class has" : "classes have"} unmarked attendance for today.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-4">
          <SubstitutionAlertPanel />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      <NpsSurveyModal />
    </div>
  );
}

export default React.memo(Dashboard);

import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { announcementsApi, attendanceApi, feesApi } from "../services/api";
import StatCard from "../components/StatCard";
import ChartSection from "../components/ChartSection";
import ActivityFeed from "../components/ActivityFeed";
import AlertsPanel from "../components/AlertsPanel";
import QuickActions from "../components/QuickActions";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import GuidedTour, { useGuidedTour } from "../components/ui/GuidedTour";
import {
  GraduationCap,
  Users,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertCircle
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

      const today = new Date().toISOString().split("T")[0];
      const classAttendance = await Promise.all(
        classesWithStudents.map(async (classItem) => {
          const classStudents = activeStudents.filter(
            (student) => String(student.classId) === String(classItem.id)
          );

          try {
            const records = await attendanceApi.getByClassDate(classItem.id, today);
            const entries = Array.isArray(records) ? records : [];
            const statusByStudent = new Map(
              entries.map((record) => [String(record?.studentId?._id || record?.studentId || ""), record?.status])
            );

            let present = 0;
            let marked = 0;

            classStudents.forEach((student) => {
              const status = String(statusByStudent.get(String(student.id)) || "").toLowerCase();

              if (!status) {
                return;
              }

              marked += 1;
              if (status === "present" || status === "p") {
                present += 1;
              }
            });

            return {
              classSize: classStudents.length,
              marked,
              present,
            };
          } catch {
            return {
              classSize: classStudents.length,
              marked: 0,
              present: 0,
            };
          }
        })
      );

      if (cancelled) {
        return;
      }

      const markedClasses = classAttendance.filter((entry) => entry.marked > 0).length;
      const studentTotal = classAttendance
        .filter((entry) => entry.marked > 0)
        .reduce((sum, entry) => sum + entry.classSize, 0);
      const studentPresent = classAttendance.reduce((sum, entry) => sum + entry.present, 0);

      setAttendanceSnapshot((current) => ({
        ...current,
        studentRate: studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : null,
        studentPresent,
        studentTotal,
        markedClasses,
        totalClasses: classesWithStudents.length,
      }));
    };

    loadStudentAttendanceSnapshot();

    return () => {
      cancelled = true;
    };
  }, [classes, students]);

  const todayKey = new Date().toISOString().split("T")[0];

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
  ]), [attendanceSnapshot, combinedAttendanceRate, dashboardStats, paymentSnapshot]);

  const quickActions = [
    { label: "Attendance", icon: CheckCircle2, href: "/classes" },
    { label: "Schedule", icon: Calendar, href: "/calendar" },
    { label: "Payments", icon: IndianRupee, href: "/fees" },
    { label: "Announce", icon: AlertCircle, href: "/messaging" },
  ];

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

          <ChartSection
            attendanceRows={attendanceRows}
            feeCollectionData={feeCollectionData}
            loading={loading || dashboardLoading}
            paymentsLoaded={paymentsLoaded}
          />

          <ActivityFeed
            payments={recentPayments}
            announcements={recentAnnouncements}
            communications={[]}
          />
        </div>

        <div className="xl:col-span-4 space-y-4">
          <SubstitutionAlertPanel />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}

export default React.memo(Dashboard);

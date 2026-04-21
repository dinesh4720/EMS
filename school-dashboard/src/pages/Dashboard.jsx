import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  GraduationCap,
  IndianRupee,
  UserX,
  Users,
} from "lucide-react";
import KpiTile from "../components/ui/KpiTile";
import QuickActionTile, { QuickActionGrid } from "../components/ui/QuickActionTile";
import PageHeader from "../components/ui/PageHeader";
import GuidedTour, { useGuidedTour } from "../components/ui/GuidedTour";
import AlertsPanel from "../components/AlertsPanel";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import NpsSurveyModal from "../components/NpsSurveyModal";
import useDashboardData from "./dashboard/useDashboardData";
import {
  getCurrencyFormatter,
  getNumberFormatter,
} from "./dashboard/dashboardHelpers";
import AttendanceSnapshot from "./dashboard/AttendanceSnapshot";
import FeeCollectionChart from "./dashboard/FeeCollectionChart";
import RecentActivityCard from "./dashboard/RecentActivityCard";
import RoleSections from "./dashboard/RoleSections";

const DASHBOARD_TOUR_STEPS = [
  {
    target: '[data-tour="sidebar"]',
    title: "Navigation Sidebar",
    content:
      "Use the sidebar to navigate between all modules — Students, Fees, Academics, Staff, and more.",
    placement: "right",
  },
  {
    target: '[data-tour="stat-cards"]',
    title: "Key Metrics",
    content:
      "These cards show real-time stats: total students, staff, fee collection, and today's attendance.",
    placement: "bottom",
  },
  {
    target: '[data-tour="notifications"]',
    title: "Notifications",
    content:
      "Stay updated with alerts for pending attendance, overdue fees, and important announcements.",
    placement: "bottom",
  },
  {
    target: '[data-tour="fee-chart"]',
    title: "Fee Collection Chart",
    content: "Track monthly fee collection trends over the last 6 months.",
    placement: "top",
  },
];

const QUICK_ACTIONS = [
  { label: "Attendance", icon: CheckCircle2, href: "/classes", tone: "primary" },
  { label: "Schedule", icon: Calendar, href: "/calendar", tone: "info" },
  { label: "Payments", icon: IndianRupee, href: "/fees", tone: "success" },
  { label: "Announce", icon: AlertCircle, href: "/messaging", tone: "warning" },
];

function Dashboard() {
  const {
    classes,
    currentAcademicYear,
    loading,
    staff,
    staffAttendance,
    students,
  } = useApp();
  const { user: authUser } = useAuth();
  const { isOpen: isTourOpen, closeTour } = useGuidedTour("dashboard-v1", true);

  const {
    recentPayments,
    recentAnnouncements,
    feeCollectionData,
    paymentSnapshot,
    attendanceSnapshot,
    feeDefaultersCount,
    dashboardLoading,
    paymentsLoaded,
  } = useDashboardData({
    classes,
    students,
    staff,
    staffAttendance,
    currentAcademicYear,
  });

  const dashboardStats = useMemo(() => {
    const activeStudents = (students || []).filter(
      (s) => (s.status || "active") === "active"
    );
    const activeStaffList = (staff || []).filter(
      (s) => (s.status || "active") === "active"
    );
    const teachers = activeStaffList.filter((s) => {
      const role = String(s.role || s.designation || "").toLowerCase();
      return role.includes("teacher") || role === "faculty";
    });
    return {
      totalStudents: activeStudents.length,
      totalClasses: (classes || []).length,
      totalTeachers: teachers.length,
      totalStaff: (staff || []).length,
      activeStaff: activeStaffList.length,
      feeDefaultersCount,
      upcomingEvents: 0,
    };
  }, [students, classes, staff, feeDefaultersCount]);

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
        link: "/classes",
      });
    }
    if (attendanceSnapshot.staffTotal > attendanceSnapshot.staffMarked) {
      items.push({
        id: "staff-attendance-pending",
        type: "warning",
        title: "Staff attendance pending",
        description: `${attendanceSnapshot.staffTotal - attendanceSnapshot.staffMarked} staff records are still unmarked for today.`,
        time: "Today",
        link: "/staffs",
      });
    }
    if (dashboardStats.feeDefaultersCount > 0) {
      items.push({
        id: "fee-defaulters",
        type: "warning",
        title: "Fee follow-up needed",
        description: `${getNumberFormatter().format(dashboardStats.feeDefaultersCount)} students currently have pending or overdue fees.`,
        time: "Live",
        link: "/fees",
      });
    }
    if (dashboardStats.upcomingEvents > 0) {
      items.push({
        id: "upcoming-events",
        type: "info",
        title: "Upcoming events",
        description: `${getNumberFormatter().format(dashboardStats.upcomingEvents)} events are scheduled on the academic calendar.`,
        time: "This term",
        link: "/calendar",
      });
    }
    return items;
  }, [attendanceSnapshot, dashboardStats.feeDefaultersCount, dashboardStats.upcomingEvents]);

  const kpiTiles = useMemo(() => {
    const absentTotal =
      attendanceSnapshot.markedClasses > 0
        ? attendanceSnapshot.studentTotal -
          attendanceSnapshot.studentPresent +
          (attendanceSnapshot.staffMarked - attendanceSnapshot.staffPresent)
        : null;

    return [
      {
        label: "Total Students",
        value: getNumberFormatter().format(dashboardStats.totalStudents || 0),
        caption: `${getNumberFormatter().format(dashboardStats.totalClasses || 0)} classes active`,
        icon: GraduationCap,
        tone: "primary",
        href: "/students",
        isLoading: loading,
      },
      {
        label: "Teaching Staff",
        value: getNumberFormatter().format(dashboardStats.totalTeachers || 0),
        caption:
          typeof attendanceSnapshot.staffRate === "number"
            ? `${getNumberFormatter().format(attendanceSnapshot.staffPresent)} present from ${getNumberFormatter().format(attendanceSnapshot.staffMarked)} marked records`
            : "Staff attendance not marked yet",
        icon: Users,
        tone: "info",
        href: "/staffs",
        isLoading: loading,
      },
      {
        label: "Pending Fees",
        value: getCurrencyFormatter().format(paymentSnapshot.totalPending || 0),
        caption:
          paymentSnapshot.today !== null
            ? `${getCurrencyFormatter().format(paymentSnapshot.today)} collected today`
            : `${getCurrencyFormatter().format(paymentSnapshot.totalCollected || 0)} collected total`,
        icon: IndianRupee,
        tone: "warning",
        href: "/fees",
        isLoading: dashboardLoading,
      },
      {
        label: "Absent Today",
        value: absentTotal !== null ? getNumberFormatter().format(absentTotal) : "—",
        caption:
          attendanceSnapshot.markedClasses > 0
            ? [
                `${getNumberFormatter().format(attendanceSnapshot.studentTotal - attendanceSnapshot.studentPresent)} students`,
                attendanceSnapshot.staffMarked > 0
                  ? `${getNumberFormatter().format(attendanceSnapshot.staffMarked - attendanceSnapshot.staffPresent)} staff`
                  : null,
              ]
                .filter(Boolean)
                .join(" • ")
            : "Awaiting marked attendance",
        icon: UserX,
        tone: "danger",
        href:
          attendanceSnapshot.markedClasses > 0 && (absentTotal ?? 0) > 0
            ? "/classes"
            : undefined,
        isLoading: loading,
      },
    ];
  }, [attendanceSnapshot, dashboardStats, dashboardLoading, loading, paymentSnapshot]);

  const rawRole = authUser?.role || "admin";
  const role = (Array.isArray(rawRole) ? rawRole[0] || "admin" : String(rawRole)).toLowerCase();

  const teacherData = useMemo(() => {
    if (role !== "teacher") return null;
    const teacherId = authUser?.id;
    const assignedClasses = (classes || []).filter(
      (c) => c.classTeacherId === teacherId
    );
    const classIds = new Set(assignedClasses.map((c) => c.id));
    const totalClassStudents = (students || []).filter((s) =>
      classIds.has(s.classId)
    ).length;

    const classesWithAttendance = assignedClasses.map((c) => {
      const classStudents = (students || []).filter((s) => s.classId === c.id);
      const hasAttendance = classStudents.some(
        () => (attendanceSnapshot.markedClasses || 0) > 0
      );
      return {
        ...c,
        studentCount: classStudents.length,
        attendanceMarked: hasAttendance,
      };
    });

    const unmarkedCount =
      assignedClasses.length > 0
        ? assignedClasses.length - (attendanceSnapshot.markedClasses || 0)
        : 0;

    return {
      assignedClasses: classesWithAttendance,
      totalStudents: totalClassStudents,
      unmarkedAttendanceCount: Math.max(0, unmarkedCount),
    };
  }, [role, authUser, classes, students, attendanceSnapshot]);

  return (
    <div className="min-h-screen pb-8">
      <GuidedTour
        tourId="dashboard-v1"
        steps={DASHBOARD_TOUR_STEPS}
        isOpen={isTourOpen}
        onClose={closeTour}
      />

      <PageHeader
        title="Overview"
        description="Welcome back! Here's what's happening today."
        bordered={false}
        className="mb-6"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            data-tour="stat-cards"
          >
            {kpiTiles.map((tile) => (
              <KpiTile key={tile.label} {...tile} />
            ))}
          </div>

          <QuickActionGrid columns={4} gap="sm">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionTile
                key={action.label}
                label={action.label}
                icon={action.icon}
                href={action.href}
                tone={action.tone}
                showChevron={false}
              />
            ))}
          </QuickActionGrid>

          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            data-tour="fee-chart"
          >
            <AttendanceSnapshot
              rows={attendanceRows}
              isLoading={loading || dashboardLoading}
            />
            <FeeCollectionChart
              data={feeCollectionData}
              isLoading={loading || dashboardLoading}
              paymentsLoaded={paymentsLoaded}
            />
          </div>

          <RecentActivityCard
            payments={recentPayments}
            announcements={recentAnnouncements}
            communications={[]}
            isLoading={dashboardLoading}
          />

          <RoleSections
            role={role}
            dashboardStats={dashboardStats}
            attendanceSnapshot={attendanceSnapshot}
            paymentSnapshot={paymentSnapshot}
            feeCollectionData={feeCollectionData}
            recentPayments={recentPayments}
            teacherData={teacherData}
            loading={loading}
          />
        </div>

        <aside className="xl:col-span-4 space-y-4" data-tour="notifications">
          <SubstitutionAlertPanel />
          <AlertsPanel alerts={alerts} />
        </aside>
      </div>

      <NpsSurveyModal />
    </div>
  );
}

export default React.memo(Dashboard);

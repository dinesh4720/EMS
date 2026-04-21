import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import {
  BookOpen,
  Clock,
  GraduationCap,
  IndianRupee,
  Users,
} from "lucide-react";
import KpiTile from "../../components/ui/KpiTile";
import MinimalCard from "../../components/ui/MinimalCard";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import SectionHeading from "../../components/ui/SectionHeading";
import {
  getCurrencyFormatter,
  getNumberFormatter,
} from "./dashboardHelpers";

function PrincipalSection({ dashboardStats, attendanceSnapshot, loading }) {
  const tiles = useMemo(
    () => [
      {
        label: "Total Students",
        value: getNumberFormatter().format(dashboardStats.totalStudents || 0),
        caption: `${getNumberFormatter().format(dashboardStats.totalClasses || 0)} classes active`,
        icon: GraduationCap,
        tone: "primary",
        href: "/students",
      },
      {
        label: "Total Staff",
        value: getNumberFormatter().format(dashboardStats.totalStaff || 0),
        caption: `${getNumberFormatter().format(dashboardStats.activeStaff || 0)} active staff members`,
        icon: Users,
        tone: "info",
        href: "/staffs",
      },
    ],
    [dashboardStats]
  );

  const total = attendanceSnapshot.staffTotal;
  const present = attendanceSnapshot.staffPresent;
  const marked = attendanceSnapshot.staffMarked;
  const rate = attendanceSnapshot.staffRate;

  return (
    <section className="space-y-4" data-testid="principal-section">
      <SectionHeading>Academic Overview</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map((tile) => (
          <KpiTile key={tile.label} {...tile} isLoading={loading} />
        ))}
      </div>
      <MinimalCard padding="sm">
        <SectionHeading as="h3" size="sm" icon={Users} className="mb-3">
          Staff Attendance
        </SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
              {getNumberFormatter().format(total)}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Total Staff
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
              {getNumberFormatter().format(present)}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Present Today
            </p>
          </div>
        </div>
        {typeof rate === "number" ? (
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-3">
            {rate}% attendance rate ({marked} marked)
          </p>
        ) : null}
      </MinimalCard>
    </section>
  );
}

PrincipalSection.propTypes = {
  dashboardStats: PropTypes.object.isRequired,
  attendanceSnapshot: PropTypes.object.isRequired,
  loading: PropTypes.bool,
};

function AccountantSection({
  paymentSnapshot,
  feeCollectionData,
  recentPayments,
  loading,
}) {
  const tiles = useMemo(
    () => [
      {
        label: "Today's Collections",
        value: getCurrencyFormatter().format(paymentSnapshot.today || 0),
        caption: "Fee payments received today",
        icon: IndianRupee,
        tone: "success",
        href: "/fees",
      },
      {
        label: "Monthly Collections",
        value: getCurrencyFormatter().format(paymentSnapshot.month || 0),
        caption: "Total collected this month",
        icon: IndianRupee,
        tone: "primary",
        href: "/fees",
      },
    ],
    [paymentSnapshot]
  );

  return (
    <section className="space-y-4" data-testid="accountant-section">
      <SectionHeading>Finance Overview</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map((tile) => (
          <KpiTile key={tile.label} {...tile} isLoading={loading} />
        ))}
      </div>
      {feeCollectionData.length > 0 ? (
        <MinimalCard padding="sm">
          <SectionHeading as="h3" size="sm" icon={IndianRupee} className="mb-3">
            Monthly Collection Breakdown
          </SectionHeading>
          <ul className="space-y-2">
            {feeCollectionData.map((month) => (
              <li
                key={month.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600 dark:text-zinc-400">
                  {month.month}
                </span>
                <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums">
                  {getCurrencyFormatter().format(month.collected)}
                </span>
              </li>
            ))}
          </ul>
        </MinimalCard>
      ) : null}
      {recentPayments.length > 0 ? (
        <MinimalCard padding="sm">
          <SectionHeading as="h3" size="sm" className="mb-3">
            Recent Transactions
          </SectionHeading>
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {recentPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-zinc-100 truncate">
                    {payment.student}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                    {payment.className}
                  </p>
                </div>
                <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums shrink-0">
                  {getCurrencyFormatter().format(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        </MinimalCard>
      ) : null}
    </section>
  );
}

AccountantSection.propTypes = {
  paymentSnapshot: PropTypes.object.isRequired,
  feeCollectionData: PropTypes.array.isRequired,
  recentPayments: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

function TeacherSection({ teacherData }) {
  if (!teacherData) return null;

  return (
    <section className="space-y-4" data-testid="teacher-section">
      <SectionHeading>My Classes</SectionHeading>
      {teacherData.assignedClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teacherData.assignedClasses.map((cls) => (
            <MinimalCard key={cls.id} padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen
                  size={16}
                  className="text-gray-500 dark:text-zinc-400"
                  aria-hidden="true"
                />
                <span className="font-medium text-gray-900 dark:text-zinc-100">
                  Class {cls.name}-{cls.section}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {cls.studentCount} students
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Attendance: {cls.attendanceMarked ? "Marked" : "Not marked"}
              </p>
            </MinimalCard>
          ))}
        </div>
      ) : (
        <EmptyState
          size="sm"
          title="No classes assigned"
          description="Classes you teach will appear here once they are assigned."
        />
      )}
      {teacherData.unmarkedAttendanceCount > 0 ? (
        <Alert
          variant="warning"
          icon={<Clock size={16} aria-hidden="true" />}
          title="Pending Tasks"
          data-testid="pending-tasks"
        >
          {teacherData.unmarkedAttendanceCount}{" "}
          {teacherData.unmarkedAttendanceCount === 1
            ? "class has"
            : "classes have"}{" "}
          unmarked attendance for today.
        </Alert>
      ) : null}
    </section>
  );
}

TeacherSection.propTypes = {
  teacherData: PropTypes.object,
};

function RoleSections({
  role,
  dashboardStats,
  attendanceSnapshot,
  paymentSnapshot,
  feeCollectionData,
  recentPayments,
  teacherData,
  loading,
}) {
  if (role === "principal") {
    return (
      <PrincipalSection
        dashboardStats={dashboardStats}
        attendanceSnapshot={attendanceSnapshot}
        loading={loading}
      />
    );
  }
  if (role === "accountant") {
    return (
      <AccountantSection
        paymentSnapshot={paymentSnapshot}
        feeCollectionData={feeCollectionData}
        recentPayments={recentPayments}
        loading={loading}
      />
    );
  }
  if (role === "teacher") {
    return <TeacherSection teacherData={teacherData} />;
  }
  return null;
}

RoleSections.propTypes = {
  role: PropTypes.string.isRequired,
  dashboardStats: PropTypes.object.isRequired,
  attendanceSnapshot: PropTypes.object.isRequired,
  paymentSnapshot: PropTypes.object.isRequired,
  feeCollectionData: PropTypes.array.isRequired,
  recentPayments: PropTypes.array.isRequired,
  teacherData: PropTypes.object,
  loading: PropTypes.bool,
};

export default memo(RoleSections);

import { CalendarDays, Megaphone, IndianRupee } from "lucide-react";
import DashboardSection from "../sections/DashboardSection";
import EmptyState from "../../../components/ui/EmptyState";
import TimelineRow from "../sections/TimelineRow";
import ActionItem from "../sections/ActionItem";
import NoticeRow from "../sections/NoticeRow";
import PaymentRow from "../sections/PaymentRow";

/* ─── Existing chart/analytics widgets (kept under components/dashboard/widgets/) ─── */
// Re-exported for ergonomic imports from the page shell.
export { default as KPIStripWidget } from "../../../components/dashboard/widgets/KPIStripWidget";
export { default as FeeTrendWidget } from "../../../components/dashboard/widgets/FeeTrendWidget";
export { default as AttendanceTrendWidget } from "../../../components/dashboard/widgets/AttendanceTrendWidget";
export { default as EnrollmentStatsWidget } from "../../../components/dashboard/widgets/EnrollmentStatsWidget";
export { default as RecentActivityWidget } from "../../../components/dashboard/widgets/RecentActivityWidget";

/* ─── Page-specific widget renderers (yourDay / actions / announcements / recentPayments) ─── */

export function renderYourDay({ schedule, nowIndex }) {
  return (
    <DashboardSection title="Your day" count={schedule.length}>
      {schedule.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events scheduled" size="sm" className="flex-1" />
      ) : (
        <div className="timeline">
          {schedule.map((row, i) => (
            <TimelineRow
              key={row.time}
              time={row.time}
              title={row.title}
              meta={row.meta}
              mine={row.mine}
              now={i === nowIndex}
              done={nowIndex >= 0 && i < nowIndex}
              status={
                i === nowIndex ? (
                  <span className="status status--warn">
                    <span className="dot" />
                    Now
                  </span>
                ) : i === nowIndex + 1 ? (
                  <span className="status status--info">Next</span>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

export function renderActions({ priorities, pendingCount, onDismiss }) {
  if (priorities.length === 0) return null;
  return (
    <DashboardSection title="Actions" count={pendingCount}>
      <div className="action-list">
        {priorities.map((priority) => (
          <ActionItem
            key={priority.id}
            kind={priority.kind}
            title={priority.title}
            body={priority.body}
            meta={priority.meta}
            primary={priority.primary}
            onPrimary={priority.onPrimary}
            onDismiss={onDismiss ? () => onDismiss(priority.id) : undefined}
          />
        ))}
      </div>
    </DashboardSection>
  );
}

export function renderAnnouncements({ announcements }) {
  const list = announcements || [];
  return (
    <DashboardSection title="Notices" count={list.length}>
      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="No recent notices" size="sm" className="flex-1" />
      ) : (
        <div className="notice-list">
          {list.map((notice) => (
            <NoticeRow
              key={notice.id}
              title={notice.title}
              content={notice.content}
              date={notice.date}
            />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

export function renderRecentPayments({ payments }) {
  const list = payments || [];
  return (
    <DashboardSection title="Payments" count={list.length}>
      {list.length === 0 ? (
        <EmptyState icon={IndianRupee} title="No recent payments" size="sm" className="flex-1" />
      ) : (
        <div className="payment-list">
          {list.map((payment) => (
            <PaymentRow
              key={payment.id}
              student={payment.student}
              className={payment.className}
              amount={payment.amount}
              date={payment.date}
            />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

import React, { useMemo } from "react";
import {
  IndianRupee,
  Megaphone,
  Users,
  BookOpen,
  ClipboardCheck,
  Bus,
  Home,
  Package,
  AlertCircle,
  Activity,
} from "lucide-react";
import { getRelativeTime } from "../../../pages/dashboard/dashboardHelpers";
import ChartCard from "../../ui/ChartCard";
import Skeleton from "../../ui/Skeleton";

const ACTIVITY_ICONS = {
  payment: IndianRupee,
  announcement: Megaphone,
  student: Users,
  staff: Users,
  exam: BookOpen,
  attendance: ClipboardCheck,
  transport: Bus,
  hostel: Home,
  inventory: Package,
  alert: AlertCircle,
};

const ACTIVITY_TONES = {
  payment: "ok",
  announcement: "info",
  student: "accent",
  staff: "accent",
  exam: "warn",
  attendance: "ok",
  transport: "info",
  hostel: "info",
  inventory: "warn",
  alert: "danger",
};

function ActivityRow({ type, title, meta, time, onClick }) {
  const Icon = ACTIVITY_ICONS[type] || Activity;
  const tone = ACTIVITY_TONES[type] || "info";
  return (
    <button type="button" className="activity" onClick={onClick}>
      <div className={`activity__icon activity__icon--${tone}`}>
        <Icon size={14} />
      </div>
      <div className="activity__main">
        <div className="activity__title">{title}</div>
        {meta && <div className="activity__meta">{meta}</div>}
      </div>
      <span className="activity__time">{time}</span>
    </button>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2 p-2" aria-busy="true" aria-live="polite">
      {[1, 2, 3, 4].map((i) => (
        <div key={`activity-skeleton-${i}`} className="flex items-center gap-3 py-2">
          <Skeleton variant="circle" className="h-6 w-6" />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="h-3 w-32" />
            <Skeleton variant="text" className="h-2.5 w-20" />
          </div>
          <Skeleton variant="text" className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  );
}

export default function RecentActivityWidget({
  recentPayments = [],
  recentAnnouncements = [],
  attendanceSnapshot = {},
  students = [],
  staff = [],
  loading = false,
  onNavigate,
}) {
  const activities = useMemo(() => {
    const items = [];

    recentPayments.slice(0, 4).forEach((p) => {
      items.push({
        type: "payment",
        title: `${p.student || "Student"} paid fee`,
        meta: p.className || null,
        time: getRelativeTime(p.date),
        sortKey: p.date ? new Date(p.date).getTime() : 0,
        onClick: () => onNavigate?.("/fees"),
      });
    });

    recentAnnouncements.slice(0, 4).forEach((a) => {
      items.push({
        type: "announcement",
        title: a.title || "New notice",
        meta: a.content ? (a.content.length > 40 ? `${a.content.slice(0, 40)}…` : a.content) : null,
        time: getRelativeTime(a.date),
        sortKey: a.date ? new Date(a.date).getTime() : 0,
        onClick: () => onNavigate?.("/messaging"),
      });
    });

    if (attendanceSnapshot.studentRate != null) {
      items.push({
        type: "attendance",
        title: `Attendance marked: ${attendanceSnapshot.studentRate}%`,
        meta: `${attendanceSnapshot.studentPresent} of ${attendanceSnapshot.studentTotal} present`,
        time: "Today",
        sortKey: Date.now(),
        onClick: () => onNavigate?.("/classes"),
      });
    }

    const recentStudents = (students || []).filter((s) => {
      const created = s.createdAt ? new Date(s.createdAt) : null;
      return created && Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
    });
    if (recentStudents.length > 0) {
      items.push({
        type: "student",
        title: `${recentStudents.length} new student${recentStudents.length === 1 ? "" : "s"} enrolled`,
        meta: null,
        time: getRelativeTime(recentStudents[0].createdAt),
        sortKey: recentStudents[0].createdAt ? new Date(recentStudents[0].createdAt).getTime() : 0,
        onClick: () => onNavigate?.("/students"),
      });
    }

    const recentStaff = (staff || []).filter((s) => {
      const created = s.createdAt ? new Date(s.createdAt) : null;
      return created && Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
    });
    if (recentStaff.length > 0) {
      items.push({
        type: "staff",
        title: `${recentStaff.length} new staff member${recentStaff.length === 1 ? "" : "s"} added`,
        meta: null,
        time: getRelativeTime(recentStaff[0].createdAt),
        sortKey: recentStaff[0].createdAt ? new Date(recentStaff[0].createdAt).getTime() : 0,
        onClick: () => onNavigate?.("/staffs"),
      });
    }

    return items.sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
  }, [recentPayments, recentAnnouncements, attendanceSnapshot, students, staff, onNavigate]);

  return (
    <ChartCard
      title="Recent activity"
      description="Latest system events"
      icon={<Activity size={16} />}
      variant="widget"
      bodyClassName="p-0"
    >
      {loading && activities.length === 0 ? (
        <ActivitySkeleton />
      ) : activities.length > 0 ? (
        <div className="activity-list" style={{ borderRadius: 0, border: "none" }}>
          {activities.map((a, i) => (
            <ActivityRow
              key={`${a.type}-${a.title}-${i}`}
              type={a.type}
              title={a.title}
              meta={a.meta}
              time={a.time}
              onClick={a.onClick}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-fg">No recent activity</p>
          <p className="mt-1 text-xs text-fg-muted">
            Events appear as staff and students use the system
          </p>
        </div>
      )}
    </ChartCard>
  );
}

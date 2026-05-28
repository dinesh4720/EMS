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
import { formatRelativeTime } from "../../../utils/dateFormatter";
import { getRelativeTime } from "../../../pages/dashboard/dashboardHelpers";

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

    // Payment activities
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

    // Announcement activities
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

    // Attendance snapshot activity
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

    // New students
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

    // New staff
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

    // Sort by most recent
    return items.sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
  }, [recentPayments, recentAnnouncements, attendanceSnapshot, students, staff, onNavigate]);

  return (
    <div className="widget-card">
      <div className="widget-card__header">
        <div className="widget-card__icon">
          <Activity size={16} className="text-fg-muted" />
        </div>
        <div>
          <h3 className="widget-card__title">Recent Activity</h3>
          <p className="widget-card__subtitle">Latest system events</p>
        </div>
      </div>
      <div className="widget-card__body widget-card__body--flush">
        {loading && activities.length === 0 ? (
          <div className="space-y-2 p-2" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-6 w-6 animate-shimmer rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-32 animate-shimmer rounded" />
                  <div className="h-2.5 w-20 animate-shimmer rounded" />
                </div>
                <div className="h-2.5 w-10 animate-shimmer rounded" />
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="activity-list" style={{ borderRadius: 0, border: "none" }}>
            {activities.map((a, i) => (
              <ActivityRow
                key={`${a.type}-${i}`}
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
      </div>
    </div>
  );
}

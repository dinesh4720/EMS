import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  AlertTriangle,
  Info,
  Megaphone,
  Users,
  SlidersHorizontal,
  Check,
  LayoutGrid,
  IndianRupee,
  X,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import useDashboardData from "./dashboard/useDashboardData";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import NpsSurveyModal from "../components/NpsSurveyModal";
import Skeleton from "../components/ui/Skeleton";
import PhotoAvatar from "../components/PhotoAvatar";
import { formatRelativeTime, toTodayDateString } from "../utils/dateFormatter";

import {
  WIDGET_CATALOG,
  DEFAULT_WIDGET_ORDER,
  getDefaultVisibility,
} from "../components/dashboard/widgetRegistry";
import WidgetCustomizer from "../components/dashboard/WidgetCustomizer";
import KPIStripWidget from "../components/dashboard/widgets/KPIStripWidget";
import FeeTrendWidget from "../components/dashboard/widgets/FeeTrendWidget";
import AttendanceTrendWidget from "../components/dashboard/widgets/AttendanceTrendWidget";
import EnrollmentStatsWidget from "../components/dashboard/widgets/EnrollmentStatsWidget";
import RecentActivityWidget from "../components/dashboard/widgets/RecentActivityWidget";

/* ─── Helpers ─── */
function fmt(n, digits) {
  return n.toFixed(digits).replace(/\.0+$/, "");
}

function compactINR(n) {
  if (n == null) return "—";
  if (n < 0) return `-${compactINR(-n)}`;
  if (n >= 1e7) return `₹${fmt(n / 1e7, n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `₹${fmt(n / 1e5, n >= 1e6 ? 0 : 1)}L`;
  if (n >= 1e3) return `₹${fmt(n / 1e3, n >= 1e4 ? 0 : 1)}K`;
  return `₹${Math.round(n)}`;
}

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,oklch(70% 0.14 30),oklch(55% 0.18 350))",
  "linear-gradient(135deg,oklch(72% 0.13 220),oklch(58% 0.17 270))",
  "linear-gradient(135deg,oklch(75% 0.14 130),oklch(60% 0.18 160))",
  "linear-gradient(135deg,oklch(80% 0.15 60),oklch(65% 0.18 30))",
  "linear-gradient(135deg,oklch(75% 0.16 320),oklch(58% 0.18 290))",
  "linear-gradient(135deg,oklch(72% 0.15 200),oklch(55% 0.18 250))",
];

function avatarFor(name, fallbackIndex = 0) {
  const seed = (name || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[(seed || fallbackIndex) % AVATAR_GRADIENTS.length];
}

function isBirthdayToday(dobStr) {
  if (!dobStr) return false;
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  let month, day;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dobStr)) {
    [, day, month] = dobStr.match(/^(\d{2})\/(\d{2})\/\d{4}$/);
  } else {
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return false;
    month = d.getMonth() + 1;
    day = d.getDate();
  }
  return parseInt(month, 10) - 1 === todayMonth && parseInt(day, 10) === todayDate;
}

/* ─── Legacy section config (for migration) ─── */
const LEGACY_SECTION_MAP = {
  yourDay: "yourDay",
  actions: "actions",
  people: "people",
  announcements: "announcements",
  recentPayments: "recentPayments",
};

const STORAGE_KEY_ORDER = "dashboard_widget_order";
const STORAGE_KEY_VISIBLE = "dashboard_widget_visible";

function readPersistedOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readPersistedVisible() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISIBLE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate legacy section visibility
    const legacy = localStorage.getItem("dashboard_sections");
    if (legacy) {
      const legacyParsed = JSON.parse(legacy);
      Object.entries(LEGACY_SECTION_MAP).forEach(([oldKey, widgetKey]) => {
        if (legacyParsed[oldKey] !== undefined) {
          parsed[widgetKey] = legacyParsed[oldKey];
        }
      });
    }
    return parsed;
  } catch {
    return null;
  }
}

/* ─── Sub-components ─── */

function DashboardSection({ title, count, children }) {
  return (
    <section className="dash-section" aria-label={title}>
      <h2 className="dash-section-title">
        {title}
        {count != null && <span className="dash-section-count">{count}</span>}
      </h2>
      <div className="dash-section-card">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="empty">
      {Icon && <Icon size={20} strokeWidth={1.5} aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
}

function PeopleSection({ staff, students, staffAttendance, classes }) {
  const [tab, setTab] = useState("staff");
  const todayStr = toTodayDateString();

  const activeStaff = useMemo(
    () => (staff || []).filter((s) => (s.status || "active") === "active"),
    [staff]
  );

  const absentStaff = useMemo(() => {
    return activeStaff.filter((s) => {
      const rec = staffAttendance?.[s.id]?.[todayStr];
      return rec && rec.status !== "present" && rec.status !== "unmarked";
    });
  }, [activeStaff, staffAttendance, todayStr]);

  const staffBirthdays = useMemo(
    () => activeStaff.filter((s) => isBirthdayToday(s.dob)),
    [activeStaff]
  );

  const presentStaff = useMemo(() => {
    return activeStaff.filter((s) => {
      const rec = staffAttendance?.[s.id]?.[todayStr];
      return rec?.status === "present";
    });
  }, [activeStaff, staffAttendance, todayStr]);

  const activeStudents = useMemo(
    () => (students || []).filter((s) => (s.status || "active") === "active"),
    [students]
  );

  const studentBirthdays = useMemo(
    () => activeStudents.filter((s) => isBirthdayToday(s.dateOfBirth || s.dob)),
    [activeStudents]
  );

  const feeDueStudents = useMemo(
    () => activeStudents.filter((s) => ["overdue", "partial", "pending"].includes(s.feeStatus)),
    [activeStudents]
  );

  const classMap = useMemo(() => {
    const map = {};
    (classes || []).forEach((c) => {
      map[c.id] = c.name || c.className || "";
    });
    return map;
  }, [classes]);

  function staffStatusBadge(s) {
    const rec = staffAttendance?.[s.id]?.[todayStr];
    if (!rec || rec.status === "unmarked") return null;
    const map = {
      present: { label: "Present", tone: "ok" },
      absent: { label: "Absent", tone: "danger" },
      leave: { label: "Leave", tone: "warn" },
      halfday: { label: "Half day", tone: "warn" },
    };
    const info = map[rec.status];
    if (!info) return null;
    return <span className={`status status--${info.tone}`}>{info.label}</span>;
  }

  function PersonRow({ name, sub, badge, photo, type }) {
    return (
      <div className="pulse" role="listitem">
        <PhotoAvatar name={name} src={photo} size="sm" type={type} className="pulse__avatar-img" />
        <div className="pulse__main">
          <div className="pulse__name">{name}</div>
          <div className="pulse__sub">{sub}</div>
        </div>
        {badge}
      </div>
    );
  }

  return (
    <div className="dash-section">
      <div className="dash-people-header">
        <h2 className="dash-section-title">People</h2>
        <div className="dash-people-tabs" role="tablist" aria-label="People filter">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "staff"}
            aria-controls="people-tabpanel"
            id="people-tab-staff"
            className={`dash-people-tab${tab === "staff" ? " is-active" : ""}`}
            onClick={() => setTab("staff")}
          >
            Staff
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "students"}
            aria-controls="people-tabpanel"
            id="people-tab-students"
            className={`dash-people-tab${tab === "students" ? " is-active" : ""}`}
            onClick={() => setTab("students")}
          >
            Students
          </button>
        </div>
      </div>
      <div className="dash-section-card" id="people-tabpanel" role="tabpanel" aria-labelledby={`people-tab-${tab}`}>
        {tab === "staff" ? (
          <div className="pulse-list" role="list">
            {absentStaff.length > 0 && (
              <>
                <div className="pulse__group">Absent today · {absentStaff.length}</div>
                {absentStaff.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.picture || s.photo}
                    type="staff"
                    sub={[s.role, s.department].filter(Boolean).join(" · ")}
                    badge={staffStatusBadge(s)}
                  />
                ))}
              </>
            )}
            {staffBirthdays.length > 0 && (
              <>
                <div className="pulse__group">Birthdays · {staffBirthdays.length}</div>
                {staffBirthdays.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.picture || s.photo}
                    type="staff"
                    sub={[s.role, s.department].filter(Boolean).join(" · ")}
                    badge={
                      <button type="button" className="btn btn--xs btn--ghost">
                        Wish
                      </button>
                    }
                  />
                ))}
              </>
            )}
            {presentStaff.length > 0 && (
              <>
                <div className="pulse__group">On campus · {presentStaff.length}</div>
                {presentStaff.slice(0, 5).map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.picture || s.photo}
                    type="staff"
                    sub={[s.role, s.department].filter(Boolean).join(" · ")}
                    badge={staffStatusBadge(s)}
                  />
                ))}
              </>
            )}
            {absentStaff.length === 0 && staffBirthdays.length === 0 && presentStaff.length === 0 && (
              <EmptyState icon={Users} message="No staff data available" />
            )}
          </div>
        ) : (
          <div className="pulse-list" role="list">
            {studentBirthdays.length > 0 && (
              <>
                <div className="pulse__group">Birthdays · {studentBirthdays.length}</div>
                {studentBirthdays.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.photo || s.picture}
                    type="student"
                    sub={classMap[s.classId] || s.className || ""}
                    badge={
                      <button type="button" className="btn btn--xs btn--ghost">
                        Wish
                      </button>
                    }
                  />
                ))}
              </>
            )}
            {feeDueStudents.length > 0 && (
              <>
                <div className="pulse__group">Fee due · {feeDueStudents.length}</div>
                {feeDueStudents.slice(0, 5).map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.photo || s.picture}
                    type="student"
                    sub={[classMap[s.classId] || s.className, s.feeStatus].filter(Boolean).join(" · ")}
                    badge={<span className="status status--danger">Due</span>}
                  />
                ))}
              </>
            )}
            {activeStudents.length > 0 && feeDueStudents.length === 0 && studentBirthdays.length === 0 && (
              <>
                <div className="pulse__group">Active · {activeStudents.length}</div>
                {activeStudents.slice(0, 6).map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.photo || s.picture}
                    type="student"
                    sub={classMap[s.classId] || s.className || ""}
                    badge={<span className="status status--ok">Active</span>}
                  />
                ))}
              </>
            )}
            {activeStudents.length === 0 && (
              <EmptyState icon={Users} message="No student data available" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineRow({ time, title, meta, status, mine, now, done }) {
  return (
    <div
      role="listitem"
      className={`trow${mine ? " trow--mine" : ""}${now ? " trow--now" : ""}${done ? " trow--done" : ""}`}
      aria-current={now ? "true" : undefined}
    >
      <div className="trow__time">{time}</div>
      <div className="trow__content">
        <div className="trow__top">
          <span className="trow__title">
            {title}
            {mine && <span className="trow__mine-tag">YOU</span>}
          </span>
          {status}
        </div>
        {meta && <div className="trow__meta">{meta}</div>}
      </div>
    </div>
  );
}

function ActionItem({ kind, title, body, meta, primary, onPrimary, onDismiss }) {
  const iconMap = {
    danger: AlertCircle,
    warn: AlertTriangle,
    info: Info,
  };
  const toneClass = {
    danger: "action-item--danger",
    warn: "action-item--warn",
    info: "action-item--info",
  }[kind];
  const Icon = iconMap[kind] || Info;

  return (
    <div className={`action-item ${toneClass}`} role="listitem">
      <div className="action-item__top">
        <div className={`action-item__icon action-item__icon--${kind}`} aria-hidden="true">
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="action-item__content">
          <div className="action-item__title">{title}</div>
          <div className="action-item__meta">
            {body}
            {meta && <span className="action-item__meta-sep" aria-hidden="true">·</span>}
            {meta}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {primary && (
            <button type="button" className="action-item__cta" onClick={onPrimary}>
              {primary}
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="iconbtn iconbtn--sm"
              onClick={onDismiss}
              aria-label={`Dismiss ${title}`}
              title={`Dismiss ${title}`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NoticeRow({ title, content, date }) {
  return (
    <div className="notice-row" role="listitem">
      <div className="notice-row__dot" aria-hidden="true" />
      <div className="notice-row__content">
        <div className="notice-row__title">{title}</div>
        {content && (
          <div className="notice-row__body">
            {content.length > 80 ? `${content.slice(0, 80)}…` : content}
          </div>
        )}
        <div className="notice-row__date">{formatRelativeTime(date)}</div>
      </div>
    </div>
  );
}

function PaymentRow({ student, className, amount, date }) {
  return (
    <div className="payment-row" role="listitem">
      <div className="payment-row__amount" aria-label={`Amount ${compactINR(amount)}`}>{compactINR(amount)}</div>
      <div className="payment-row__content">
        <div className="payment-row__student">{student}</div>
        <div className="payment-row__meta">
          {className && <span>{className}</span>}
          <span>{formatRelativeTime(date)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="page page--principal">
      <header className="dash-hero">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-64" />
          <Skeleton variant="text" className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rect" className="h-8 w-8 rounded-md" />
          <Skeleton variant="rect" className="h-8 w-8 rounded-md" />
        </div>
      </header>

      <section className="stats-row" aria-label="Key metrics">
        <div className="stat-card space-y-2">
          <div className="stat-card__row">
            <Skeleton variant="circle" className="h-9 w-9" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
          <Skeleton variant="text" className="h-8 w-28 mt-1" />
          <Skeleton variant="text" className="h-3 w-32 mt-1" />
        </div>
        <div className="stat-card space-y-2">
          <div className="stat-card__row">
            <Skeleton variant="circle" className="h-9 w-9" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
          <Skeleton variant="text" className="h-8 w-28 mt-1" />
          <Skeleton variant="text" className="h-3 w-32 mt-1" />
        </div>
      </section>

      <div className="dash-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-section">
            <Skeleton variant="text" className="h-5 w-24 mb-3" />
            <div className="dash-section-card space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton variant="text" className="h-3 w-1/2" />
                    <Skeleton variant="text" className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */

function Dashboard() {
  const navigate = useNavigate();
  const { classes, currentAcademicYear, staff, staffAttendance, students } = useApp();
  const { user: authUser } = useAuth();

  const {
    paymentSnapshot,
    attendanceSnapshot,
    feeDefaultersCount,
    recentPayments,
    recentAnnouncements,
    feeCollectionData,
    dashboardLoading,
    reload,
  } = useDashboardData({
    classes,
    students,
    staff,
    staffAttendance,
    currentAcademicYear,
  });

  const [dismissed, setDismissed] = useState(() => new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  /* Widget order & visibility with localStorage persistence */
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const persisted = readPersistedOrder();
    return persisted && Array.isArray(persisted) ? persisted : DEFAULT_WIDGET_ORDER;
  });

  const [widgetVisible, setWidgetVisible] = useState(() => {
    const persisted = readPersistedVisible();
    return persisted ? { ...getDefaultVisibility(), ...persisted } : getDefaultVisibility();
  });

  const saveOrder = useCallback((order) => {
    setWidgetOrder(order);
    localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(order));
  }, []);

  const saveVisible = useCallback((visible) => {
    setWidgetVisible(visible);
    localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visible));
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 600);
  };

  const initialLoading = dashboardLoading;

  /* Greeting */
  const firstName = (authUser?.name || "").trim().split(" ")[0] || "there";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const studentsOnCampus = attendanceSnapshot.studentPresent || 0;
  const totalActiveStudents = useMemo(
    () => (students || []).filter((student) => (student.status || "active") === "active").length,
    [students]
  );

  /* Priorities */
  const priorities = useMemo(() => {
    const items = [];
    if (feeDefaultersCount > 0) {
      const overdue =
        paymentSnapshot.totalPending != null ? compactINR(paymentSnapshot.totalPending) : null;
      items.push({
        id: "fees",
        kind: "danger",
        title: overdue ? `${overdue} unpaid fees` : `${feeDefaultersCount} fee defaulters`,
        body: `${feeDefaultersCount} student${feeDefaultersCount === 1 ? "" : "s"} past cutoff`,
        meta: "Reminder ready",
        primary: "Send reminders",
        onPrimary: () => navigate("/fees"),
      });
    }
    items.push({
      id: "coverage",
      kind: "warn",
      title: "Period 3 · 10-B unstaffed",
      body: "Substitute not assigned",
      meta: "10:30 – 11:15",
      primary: "Assign substitute",
      onPrimary: () => navigate("/staffs"),
    });
    items.push({
      id: "ptm",
      kind: "info",
      title: "PTM agenda · Dec 20",
      body: "Finalize discussion points",
      meta: "3 days left",
      primary: "Open agenda",
      onPrimary: () => navigate("/ptm"),
    });
    return items.filter((item) => !dismissed.has(item.id)).slice(0, 3);
  }, [feeDefaultersCount, paymentSnapshot.totalPending, navigate, dismissed]);

  const pendingCount = priorities.length;

  /* Schedule */
  const schedule = useMemo(
    () => [
      { time: "09:00", title: "Morning assembly", meta: "Auditorium · You're addressing Grade 9–12", mine: true },
      { time: "10:30", title: "Walk-through · Grade 6 wing", meta: "With the coordinator" },
      { time: "11:30", title: "Parent meet · 10-A", meta: "Concern: math grades · 30 min", mine: true },
      { time: "13:30", title: "Staff briefing · 7 leads", meta: "Weekly sync · Conf room A" },
      { time: "15:30", title: "Annual day rehearsal", meta: "Auditorium · Grade 9–12 · drop-in" },
    ],
    []
  );

  const nowIndex = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const starts = schedule.map((row) => {
      const [hr, min] = row.time.split(":").map(Number);
      return hr * 60 + min;
    });
    let idx = -1;
    for (let i = 0; i < starts.length; i += 1) {
      if (minutes >= starts[i]) idx = i;
    }
    if (idx < 0) return -1;
    return minutes - starts[idx] < 90 ? idx : -1;
  }, [now, schedule]);

  /* Widget renderer */
  const renderWidget = useCallback(
    (key) => {
      switch (key) {
        case "kpiStrip":
          return (
            <KPIStripWidget
              attendanceSnapshot={attendanceSnapshot}
              paymentSnapshot={paymentSnapshot}
              feeDefaultersCount={feeDefaultersCount}
              students={students}
              loading={initialLoading}
            />
          );
        case "feeTrend":
          return <FeeTrendWidget data={feeCollectionData} loading={initialLoading} />;
        case "attendanceTrend":
          return (
            <AttendanceTrendWidget
              attendanceSnapshot={attendanceSnapshot}
              loading={initialLoading}
            />
          );
        case "enrollmentStats":
          return (
            <EnrollmentStatsWidget
              students={students}
              classes={classes}
              loading={initialLoading}
            />
          );
        case "recentActivity":
          return (
            <RecentActivityWidget
              recentPayments={recentPayments}
              recentAnnouncements={recentAnnouncements}
              attendanceSnapshot={attendanceSnapshot}
              students={students}
              staff={staff}
              loading={initialLoading}
              onNavigate={navigate}
            />
          );
        case "yourDay":
          return (
            <DashboardSection title="Your day" count={schedule.length}>
              {schedule.length === 0 ? (
                <EmptyState icon={CalendarDays} message="No events scheduled" />
              ) : (
                <div className="timeline" role="list">
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
        case "actions":
          return (
            priorities.length > 0 && (
              <DashboardSection title="Actions" count={pendingCount}>
                <div className="action-list" role="list">
                  {priorities.map((priority) => (
                    <ActionItem
                      key={priority.id}
                      {...priority}
                      onDismiss={() =>
                        setDismissed((prev) => {
                          const next = new Set(prev);
                          next.add(priority.id);
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </DashboardSection>
            )
          );
        case "people":
          return (
            <PeopleSection
              staff={staff}
              students={students}
              staffAttendance={staffAttendance}
              classes={classes}
            />
          );
        case "announcements":
          return (
            <DashboardSection title="Notices" count={recentAnnouncements?.length || 0}>
              {!recentAnnouncements || recentAnnouncements.length === 0 ? (
                <EmptyState icon={Megaphone} message="No recent notices" />
              ) : (
                <div className="notice-list" role="list">
                  {recentAnnouncements.map((notice) => (
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
        case "recentPayments":
          return (
            <DashboardSection title="Payments" count={recentPayments?.length || 0}>
              {!recentPayments || recentPayments.length === 0 ? (
                <EmptyState icon={IndianRupee} message="No recent payments" />
              ) : (
                <div className="payment-list" role="list">
                  {recentPayments.map((payment) => (
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
        default:
          return null;
      }
    },
    [
      attendanceSnapshot,
      paymentSnapshot,
      feeDefaultersCount,
      students,
      classes,
      staff,
      staffAttendance,
      feeCollectionData,
      recentPayments,
      recentAnnouncements,
      initialLoading,
      schedule,
      nowIndex,
      priorities,
      pendingCount,
      navigate,
    ]
  );

  /* Build visible widgets in order */
  const visibleWidgets = useMemo(() => {
    return widgetOrder.filter((key) => widgetVisible[key]);
  }, [widgetOrder, widgetVisible]);

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page page--principal">
      {/* ─── Header ─── */}
      <header className="dash-hero">
        <div className="dash-hero__text">
          <h1 className="dash-hero__greet">
            {greeting}, {firstName}
          </h1>
          <p className="dash-hero__date">{dateLabel}</p>
        </div>
        <div className="dash-hero__actions">
          {pendingCount > 0 && (
            <span className="chip chip--warn">
              <AlertCircle size={10} />
              {pendingCount} pending
            </span>
          )}
          <button
            type="button"
            className="iconbtn iconbtn--sm"
            onClick={() => setCustomizerOpen(true)}
            aria-label="Customize dashboard"
            title="Customize dashboard"
          >
            <LayoutGrid size={12} />
          </button>
          <button
            type="button"
            className="iconbtn iconbtn--sm"
            onClick={handleRefresh}
            disabled={refreshing || dashboardLoading}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw size={12} className={refreshing || dashboardLoading ? "is-spinning" : ""} />
          </button>
        </div>
      </header>

      {/* ─── Widget Grid ─── */}
      <div className="widget-grid" role="region" aria-label="Dashboard widgets">
        {visibleWidgets.map((key) => (
          <div key={key} className={`widget-wrapper widget-wrapper--${key}`}>
            {renderWidget(key)}
          </div>
        ))}
      </div>

      {/* ─── Moments Footer ─── */}
      <div className="moments">
        <span className="moments__lab">Week</span>
        <span>
          <b>3</b> inter-school finals
        </span>
        <span className="moments__dot">·</span>
        <span>
          <b>
            {attendanceSnapshot.studentRate != null ? `${attendanceSnapshot.studentRate}%` : "—"}
          </b>{" "}
          attendance
        </span>
        <span className="moments__dot">·</span>
        <span>
          <b>{paymentSnapshot.month != null ? compactINR(paymentSnapshot.month) : "—"}</b> collected
        </span>
        {totalActiveStudents > 0 && (
          <>
            <span className="moments__dot">·</span>
            <span>
              <b>{studentsOnCampus.toLocaleString()}</b>/<b>{totalActiveStudents.toLocaleString()}</b> on campus
            </span>
          </>
        )}
      </div>

      {/* Background panels */}
      <SubstitutionAlertPanel />
      <NpsSurveyModal />

      {/* Widget Customizer */}
      <WidgetCustomizer
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        order={widgetOrder}
        visible={widgetVisible}
        onChangeOrder={saveOrder}
        onChangeVisible={saveVisible}
      />
    </div>
  );
}

export default React.memo(Dashboard);

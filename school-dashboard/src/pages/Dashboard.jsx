import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertCircle, LayoutGrid } from "lucide-react";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import useDashboardData from "./dashboard/useDashboardData";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import NpsSurveyModal from "../components/NpsSurveyModal";
import { toTodayDateString } from "../utils/dateFormatter";

import {
  DEFAULT_WIDGET_ORDER,
  getDefaultVisibility,
} from "../components/dashboard/widgetRegistry";
import WidgetCustomizer from "../components/dashboard/WidgetCustomizer";
import {
  KPIStripWidget,
  FeeTrendWidget,
  AttendanceTrendWidget,
  EnrollmentStatsWidget,
  RecentActivityWidget,
  renderYourDay,
  renderActions,
  renderAnnouncements,
  renderRecentPayments,
} from "./dashboard/widgets/Widgets";
import PeopleSection from "./dashboard/sections/PeopleSection";
import DashboardSkeleton from "./dashboard/skeleton/DashboardSkeleton";
import { compactINR } from "./dashboard/formatters";
import { formatUpcomingDayLabel } from "./dashboard/dashboardHelpers";

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

function Dashboard() {
  const navigate = useNavigate();
  const { classes, currentAcademicYear, staff, staffAttendance, students, events } = useApp();
  const { user: authUser } = useAuth();

  const {
    paymentSnapshot,
    attendanceSnapshot,
    feeDefaultersCount,
    recentPayments,
    recentAnnouncements,
    feeCollectionData,
    dashboardLoading,
    urgentSubstitution,
    upcomingPtm,
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

  const dismissPriority = useCallback((id) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const initialLoading = dashboardLoading;

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
    if (urgentSubstitution) {
      const alert = urgentSubstitution.alert;
      const classLabel = alert?.className || "a class";
      const periodLabel = alert?.periodName || (alert?.period ? `Period ${alert.period}` : "Period");
      const absentName = alert?.absentTeacherId?.name || alert?.absentTeacher?.name;
      const subName =
        typeof alert?.substituteTeacherId === "object"
          ? alert.substituteTeacherId?.name
          : null;
      if (urgentSubstitution.unassigned) {
        items.push({
          id: `coverage-${alert?._id || "current"}`,
          kind: "warn",
          title: `${periodLabel} · ${classLabel} unstaffed`,
          body: absentName ? `${absentName} absent · Substitute not assigned` : "Substitute not assigned",
          meta: alert?.timeSlot || "—",
          primary: "Assign substitute",
          onPrimary: () => navigate("/staffs"),
        });
      } else {
        items.push({
          id: `coverage-${alert?._id || "current"}`,
          kind: "info",
          title: `${periodLabel} · ${classLabel}`,
          body: absentName && subName ? `${absentName} → ${subName}` : "Substitute assigned",
          meta: alert?.timeSlot || "—",
          primary: "View substitution",
          onPrimary: () => navigate("/staffs"),
        });
      }
    }
    if (upcomingPtm) {
      const ptmDate = upcomingPtm.date || upcomingPtm.scheduledFor;
      const isOngoing = String(upcomingPtm.status || "").toLowerCase() === "ongoing";
      const classLabel = upcomingPtm.classId?.name
        ? `${upcomingPtm.classId.name}${upcomingPtm.classId.section ? `-${upcomingPtm.classId.section}` : ""}`
        : null;
      items.push({
        id: `ptm-${upcomingPtm._id || "current"}`,
        kind: isOngoing ? "warn" : "info",
        title: `PTM agenda · ${isOngoing ? "today" : formatUpcomingDayLabel(ptmDate)}`,
        body: classLabel || upcomingPtm.title || "Finalize discussion points",
        meta: isOngoing ? "Ongoing now" : formatUpcomingDayLabel(ptmDate),
        primary: "Open agenda",
        onPrimary: () => navigate("/ptm"),
      });
    }
    return items.filter((item) => !dismissed.has(item.id)).slice(0, 3);
  }, [feeDefaultersCount, paymentSnapshot.totalPending, navigate, dismissed, urgentSubstitution, upcomingPtm]);

  const pendingCount = priorities.length;

  const schedule = useMemo(() => {
    const todayKey = toTodayDateString();
    return (events || [])
      .filter((event) => event && event.date === todayKey)
      .map((event) => {
        const time = event.allDay
          ? "All day"
          : event.startTime || "—";
        const metaParts = [];
        if (!event.allDay && event.endTime) {
          metaParts.push(`${event.startTime || "—"} – ${event.endTime}`);
        }
        if (event.type) {
          metaParts.push(event.type.charAt(0).toUpperCase() + event.type.slice(1));
        }
        if (event.description) {
          metaParts.push(event.description);
        }
        return {
          time,
          title: event.title || "Untitled event",
          meta: metaParts.join(" · "),
        };
      })
      .sort((left, right) => {
        if (left.time === "All day") return -1;
        if (right.time === "All day") return 1;
        return left.time.localeCompare(right.time);
      });
  }, [events]);

  const nowIndex = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const starts = schedule.map((row) => {
      const parts = row.time.split(":");
      if (parts.length !== 2) return null;
      const hr = Number(parts[0]);
      const min = Number(parts[1]);
      if (!Number.isFinite(hr) || !Number.isFinite(min)) return null;
      return hr * 60 + min;
    });
    let idx = -1;
    for (let i = 0; i < starts.length; i += 1) {
      if (starts[i] != null && minutes >= starts[i]) idx = i;
    }
    if (idx < 0) return -1;
    if (starts[idx] == null) return -1;
    return minutes - starts[idx] < 90 ? idx : -1;
  }, [now, schedule]);

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
          return renderYourDay({ schedule, nowIndex });
        case "actions":
          return renderActions({ priorities, pendingCount, onDismiss: dismissPriority });
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
          return renderAnnouncements({ announcements: recentAnnouncements });
        case "recentPayments":
          return renderRecentPayments({ payments: recentPayments });
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
      dismissPriority,
      navigate,
    ]
  );

  const visibleWidgets = useMemo(
    () => widgetOrder.filter((key) => widgetVisible[key]),
    [widgetOrder, widgetVisible]
  );

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page page--principal">
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

      <div className="widget-grid">
        {visibleWidgets.map((key) => (
          <div key={key} className={`widget-wrapper widget-wrapper--${key}`}>
            {renderWidget(key)}
          </div>
        ))}
      </div>

      <div className="moments">
        <span className="moments__lab">Week</span>
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

      <SubstitutionAlertPanel />
      <NpsSurveyModal />

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

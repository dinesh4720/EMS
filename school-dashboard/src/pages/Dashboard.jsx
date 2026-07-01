import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  IndianRupee,
  ClipboardCheck,
  Users,
  Check,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import useDashboardData from "./dashboard/useDashboardData";
import ErrorState from "../components/ui/ErrorState";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import NpsSurveyModal from "../components/NpsSurveyModal";

import ActionShelf, {
  DEFAULT_VERBS,
} from "./dashboard/sections/ActionShelf";
import WeeklyTrendPanel from "./dashboard/sections/WeeklyTrendPanel";
import FeedRow from "./dashboard/sections/FeedRow";
import MomentsList from "./dashboard/sections/MomentsList";
import LatestNotice from "./dashboard/sections/LatestNotice";

import DashboardSkeleton from "./dashboard/skeleton/DashboardSkeleton";
import { compactINR } from "./dashboard/formatters";
import { toTodayDateString } from "../utils/dateFormatter";

/**
 * Dashboard — "Daily Briefing"
 *
 * Design philosophy:
 *  - Calm, scannable, action-first.
 *  - Real data only (no mock schedules or fake priorities).
 *  - One clear question: "What needs my attention right now?"
 *  - One clear answer zone (AttentionQueue) + supporting context (Pulse + Activity + Moments).
 *  - Minimal chrome; lots of breathing room.
 */
function Dashboard() {
  const navigate = useNavigate();
  const { classes, currentAcademicYear, staff, staffAttendance, students } = useApp();
  const { user: authUser } = useAuth();

  const {
    paymentSnapshot,
    attendanceSnapshot,
    studentStats,
    feeDefaultersCount,
    weeklyFeeSeries,
    recentPayments,
    recentAnnouncements,
    dashboardLoading,
    dashboardError,
    reload,
  } = useDashboardData({
    students,
    staff,
    staffAttendance,
    currentAcademicYear,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 600);
  }, [reload]);

  /* ─── Greeting ──────────────────────────────────────────────────────── */
  const firstName = (authUser?.name || "").trim().split(" ")[0] || "there";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  /* ─── Derived: active records ───────────────────────────────────────── */
  const activeStaff = useMemo(
    () => (staff || []).filter((s) => (s.status || "active") === "active"),
    [staff]
  );
  const activeStudents = useMemo(
    () => (students || []).filter((s) => (s.status || "active") === "active"),
    [students]
  );

  /* ─── Derived: today's date key for staff attendance lookup ─────────── */
  const todayStr = toTodayDateString();

  const absentStaffList = useMemo(
    () =>
      activeStaff.filter((s) => {
        const rec = staffAttendance?.[s.id]?.[todayStr];
        return rec && rec.status !== "present" && rec.status !== "unmarked";
      }),
    [activeStaff, staffAttendance, todayStr]
  );

  const classMap = useMemo(() => {
    const map = {};
    (classes || []).forEach((c) => {
      map[c.id] = c.name || c.className || "";
    });
    return map;
  }, [classes]);

  /* ─── Derived: birthdays today (real data) ──────────────────────────── */
  const isBirthdayToday = useCallback((dobStr) => {
    if (!dobStr) return false;
    const today = new Date();
    let month, day;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dobStr)) {
      [, day, month] = dobStr.match(/^(\d{2})\/(\d{2})\/\d{4}$/);
    } else {
      const d = new Date(dobStr);
      if (Number.isNaN(d.getTime())) return false;
      month = d.getMonth() + 1;
      day = d.getDate();
    }
    return parseInt(month, 10) - 1 === today.getMonth() && parseInt(day, 10) === today.getDate();
  }, []);

  const birthdaysToday = useMemo(() => {
    const studentBdays = activeStudents
      .filter((s) => isBirthdayToday(s.dateOfBirth || s.dob))
      .slice(0, 3)
      .map((s) => ({
        id: `s-${s.id}`,
        name: s.name,
        photo: s.photo || s.picture,
        type: "student",
        sub: classMap[s.classId] || s.className || "Student",
      }));
    const staffBdays = activeStaff
      .filter((s) => isBirthdayToday(s.dob))
      .slice(0, 2)
      .map((s) => ({
        id: `st-${s.id}`,
        name: s.name,
        photo: s.picture || s.photo,
        type: "staff",
        sub: [s.role, s.department].filter(Boolean).join(" · ") || "Staff",
      }));
    return [...studentBdays, ...staffBdays];
  }, [activeStudents, activeStaff, isBirthdayToday, classMap]);

  /* ─── Derived: attention queue (the hero — all real data) ───────────── */
  const attentionItems = useMemo(() => {
    const items = [];

    if (feeDefaultersCount > 0 && paymentSnapshot.totalPending != null) {
      items.push({
        id: "fees",
        kind: "danger",
        icon: IndianRupee,
        title: `${compactINR(paymentSnapshot.totalPending)} in unpaid fees`,
        body: `${feeDefaultersCount} student${feeDefaultersCount === 1 ? "" : "s"} past the due date`,
        action: "Send reminders",
        onAction: () => navigate("/fees"),
      });
    }

    const unmarkedClasses = Math.max(
      0,
      (attendanceSnapshot.totalClasses || 0) - (attendanceSnapshot.markedClasses || 0)
    );
    if (unmarkedClasses > 0 && attendanceSnapshot.totalClasses > 0) {
      items.push({
        id: "attendance",
        kind: "warn",
        icon: ClipboardCheck,
        title: `${unmarkedClasses} class${unmarkedClasses === 1 ? "" : "es"} need attendance`,
        body: `${attendanceSnapshot.markedClasses || 0} of ${attendanceSnapshot.totalClasses} marked today`,
        action: "Mark attendance",
        onAction: () => navigate("/classes"),
      });
    }

    if (absentStaffList.length > 0) {
      const namesPreview = absentStaffList
        .slice(0, 2)
        .map((s) => s.name)
        .join(", ");
      const moreCount = absentStaffList.length - 2;
      items.push({
        id: "staff-absent",
        kind: "info",
        icon: Users,
        title: `${absentStaffList.length} staff absent today`,
        body:
          moreCount > 0
            ? `${namesPreview} and ${moreCount} more — substitutes may be needed`
            : `${namesPreview} — consider arranging coverage`,
        action: "Review",
        onAction: () => navigate("/staffs"),
      });
    }

    return items;
  }, [
    feeDefaultersCount,
    paymentSnapshot.totalPending,
    attendanceSnapshot.totalClasses,
    attendanceSnapshot.markedClasses,
    absentStaffList,
    navigate,
  ]);

  const pendingCount = attentionItems.length;

  /* ─── Derived: recent activity feed (payments + announcements merged) ─ */
  const activityFeed = useMemo(() => {
    const fromPayments = (recentPayments || []).slice(0, 4).map((p) => ({
      id: `pay-${p.id}`,
      kind: "payment",
      amount: p.amount,
      student: p.student,
      className: p.className,
      date: p.date,
      ts: p.date ? new Date(p.date).getTime() : 0,
    }));
    const fromAnnouncements = (recentAnnouncements || []).slice(0, 3).map((a) => ({
      id: `ann-${a.id}`,
      kind: "announcement",
      title: a.title,
      body: a.content,
      date: a.date,
      ts: a.date ? new Date(a.date).getTime() : 0,
    }));
    return [...fromPayments, ...fromAnnouncements]
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, 6);
  }, [recentPayments, recentAnnouncements]);

  /* ─── Derived: latest notice ────────────────────────────────────────── */
  const latestNotice = (recentAnnouncements || [])[0] || null;

  /* ─── Loading state ─────────────────────────────────────────────────── */
  if (dashboardLoading) {
    return <DashboardSkeleton />;
  }

  // dashboardError is only set when the entire dashboard feed fails (all sources
  // rejected). Surface a retry instead of silently rendering empty/zero widgets.
  if (dashboardError) {
    return (
      <div className="briefing briefing--error">
        <ErrorState
          title="Unable to load dashboard"
          error={dashboardError}
          onRetry={reload}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="briefing">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HEADER — minimal greeting + status line
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="briefing__hero">
        <div className="briefing__hero-text">
          <h1 className="briefing__greet">
            {greeting}, <span className="briefing__name">{firstName}</span>
          </h1>
          <p className="briefing__meta">
            <span className="briefing__date">{dateLabel}</span>
            {pendingCount > 0 && (
              <>
                <span className="briefing__sep">·</span>
                <span className="briefing__status briefing__status--attention">
                  <span className="briefing__status-dot" />
                  {pendingCount} {pendingCount === 1 ? "thing" : "things"} need{pendingCount === 1 ? "s" : ""} your attention
                </span>
              </>
            )}
            {pendingCount === 0 && (
              <>
                <span className="briefing__sep">·</span>
                <span className="briefing__status briefing__status--clear">
                  <Check size={11} strokeWidth={3} />
                  All caught up
                </span>
              </>
            )}
          </p>
        </div>
        <div className="briefing__hero-actions">
          <button
            type="button"
            className="briefing__refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <RefreshCw size={14} className={refreshing ? "is-spinning" : ""} />
          </button>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. ACTION SHELF — contextual actions + always-on verbs
          (replaces old QuickActions row + separate attention queue)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ActionShelf
        items={attentionItems}
        footerActions={DEFAULT_VERBS}
        onNavigate={(to) => navigate(to)}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. THIS WEEK — trajectory panel (replaces 4-card pulse strip)
          Fee sparkline + attendance snapshot in one wide calm panel.
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <WeeklyTrendPanel
        weeklyFeeSeries={weeklyFeeSeries}
        attendanceSnapshot={attendanceSnapshot}
        totalStudents={studentStats.active}
        totalStaff={activeStaff.length}
        presentToday={attendanceSnapshot.studentPresent || 0}
        onOpenFees={() => navigate("/fees")}
        onOpenAttendance={() => navigate("/students")}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. TWO-COLUMN LOWER — activity feed + moments
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="briefing__cols">
        {/* Left: Recent activity */}
        <section className="briefing__col">
          <header className="briefing__block-head">
            <h2 className="briefing__block-title">Recent activity</h2>
          </header>
          <div className="briefing__panel">
            {activityFeed.length === 0 ? (
              <div className="briefing__empty">
                <Check size={18} strokeWidth={2} />
                <span>No recent activity</span>
              </div>
            ) : (
              <div className="feed-list">
                {activityFeed.map((event) => (
                  <FeedRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Moments + notice */}
        <section className="briefing__col">
          <header className="briefing__block-head">
            <h2 className="briefing__block-title">Today</h2>
          </header>
          <div className="briefing__panel briefing__panel--stacked">
            <MomentsList birthdays={birthdaysToday} />
            <LatestNotice
              notice={latestNotice}
              onOpen={() => navigate("/messaging")}
            />
          </div>
        </section>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Secondary panels (kept for continuity, tucked below the fold)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SubstitutionAlertPanel />
      <NpsSurveyModal />
    </div>
  );
}

export default React.memo(Dashboard);

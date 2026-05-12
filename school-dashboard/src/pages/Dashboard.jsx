import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import useDashboardData from "./dashboard/useDashboardData";
import SubstitutionAlertPanel from "../components/SubstitutionAlertPanel";
import NpsSurveyModal from "../components/NpsSurveyModal";
import Skeleton from "../components/ui/Skeleton";

// Strip trailing ".0" so "₹2.0Cr" renders as "₹2Cr"; keep "₹2.5Cr" intact.
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
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Static palette for people-pulse avatars — deterministic per index/name so
// the avatar tone stays stable across re-renders (no hue flicker).
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,oklch(70% 0.14 30),oklch(55% 0.18 350))",
  "linear-gradient(135deg,oklch(72% 0.13 220),oklch(58% 0.17 270))",
  "linear-gradient(135deg,oklch(75% 0.14 130),oklch(60% 0.18 160))",
  "linear-gradient(135deg,oklch(80% 0.15 60),oklch(65% 0.18 30))",
  "linear-gradient(135deg,oklch(75% 0.16 320),oklch(58% 0.18 290))",
  "linear-gradient(135deg,oklch(72% 0.15 200),oklch(55% 0.18 250))",
];

function avatarFor(name, fallbackIndex = 0) {
  const seed = (name || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[(seed || fallbackIndex) % AVATAR_GRADIENTS.length];
}

function MorningSun() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="9" fill="oklch(82% 0.16 70)" />
      <g
        stroke="oklch(78% 0.18 60)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="22" y1="4" x2="22" y2="9" />
        <line x1="22" y1="35" x2="22" y2="40" />
        <line x1="4" y1="22" x2="9" y2="22" />
        <line x1="35" y1="22" x2="40" y2="22" />
        <line x1="9.5" y1="9.5" x2="13" y2="13" />
        <line x1="31" y1="31" x2="34.5" y2="34.5" />
        <line x1="34.5" y1="9.5" x2="31" y2="13" />
        <line x1="13" y1="31" x2="9.5" y2="34.5" />
      </g>
    </svg>
  );
}

function ScheduleRow({ time, title, meta, status, mine, now }) {
  return (
    <div
      className={`srow${mine ? " srow--mine" : ""}${now ? " srow--now" : ""}`}
      aria-current={now ? "true" : undefined}
    >
      <div className="srow__time">{time}</div>
      <div className="srow__main">
        <div className="srow__title">
          {title}
          {mine && <span className="srow__mine-tag">YOU</span>}
        </div>
        {meta && <div className="srow__meta">{meta}</div>}
      </div>
      {status}
    </div>
  );
}

function PulseRow({ name, sub, badge, idx }) {
  return (
    <div className="pulse">
      <div className="pulse__avatar" style={{ background: avatarFor(name, idx) }}>
        {initials(name)}
      </div>
      <div className="pulse__main">
        <div className="pulse__name">{name}</div>
        <div className="pulse__sub">{sub}</div>
      </div>
      {badge}
    </div>
  );
}

function PriorityCard({ kind, pill, title, body, meta, primary, secondary, onPrimary, onSecondary, onDismiss }) {
  return (
    <div className={`pri pri--${kind}`}>
      <div className="pri__head">
        <span className="pri__pill">{pill}</span>
        {onDismiss && (
          <button
            type="button"
            className="pri__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>
      <div className="pri__title">{title}</div>
      <div className="pri__body">{body}</div>
      {meta && <div className="pri__meta">{meta}</div>}
      <div className="pri__row">
        <button type="button" className="btn btn--sm btn--accent" onClick={onPrimary}>
          {primary}
        </button>
        {secondary && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onSecondary}>
            {secondary}
          </button>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const {
    classes,
    currentAcademicYear,
    staff,
    staffAttendance,
    students,
  } = useApp();
  const { user: authUser } = useAuth();

  const {
    paymentSnapshot,
    attendanceSnapshot,
    feeDefaultersCount,
    dashboardLoading,
    paymentsLoaded,
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
  const handleRefresh = () => {
    setRefreshing(true);
    reload();
    // Hold the spinning state briefly so feedback is visible even on a warm
    // cache hit — the hook clears dashboardLoading too fast otherwise.
    setTimeout(() => setRefreshing(false), 600);
  };

  // Initial load: nothing rendered yet (no attendance, no payments).
  const initialLoading =
    dashboardLoading &&
    !paymentsLoaded &&
    attendanceSnapshot.studentRate == null;

  // Greeting
  const firstName = (authUser?.name || "").trim().split(" ")[0] || "there";
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning"
    : hour < 17 ? "Good afternoon"
    : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const studentsOnCampus = attendanceSnapshot.studentPresent || 0;
  const totalActiveStudents = useMemo(
    () =>
      (students || []).filter((s) => (s.status || "active") === "active")
        .length,
    [students]
  );

  // Action queue — derive 3 priorities from real signals where possible.
  // Fee defaulters: real. Unstaffed period + PTM agenda: static placeholders
  // until substitution-coverage and PTM workflow APIs land.
  const priorities = useMemo(() => {
    const items = [];
    if (feeDefaultersCount > 0) {
      const overdue = paymentSnapshot.totalPending != null
        ? compactINR(paymentSnapshot.totalPending)
        : null;
      items.push({
        id: "fees",
        kind: "danger",
        pill: "Overdue",
        title: overdue ? `${overdue} unpaid fees` : `${feeDefaultersCount} fee defaulters`,
        body: `${feeDefaultersCount} student${feeDefaultersCount === 1 ? "" : "s"} past cutoff. Reminder template ready.`,
        meta: null,
        primary: `Send ${feeDefaultersCount} reminder${feeDefaultersCount === 1 ? "" : "s"}`,
        secondary: "Review list",
        onPrimary: () => navigate("/fees"),
        onSecondary: () => navigate("/fees"),
      });
    }
    // STATIC placeholder — needs substitution / coverage-gap API (see Notes).
    items.push({
      id: "coverage",
      kind: "warn",
      pill: "Coverage gap",
      title: "Period 3 · 10-B unstaffed",
      body: "Sample placeholder — wire to substitution coverage API.",
      meta: "TODO · substitution API",
      primary: "Assign sub",
      secondary: "Notify class",
      onPrimary: () => navigate("/staffs"),
      onSecondary: () => navigate("/messaging"),
    });
    // STATIC placeholder — needs PTM agenda workflow API.
    items.push({
      id: "ptm",
      kind: "info",
      pill: "Awaiting you",
      title: "PTM agenda · Dec 20",
      body: "Sample placeholder — wire to PTM agenda workflow.",
      meta: "TODO · PTM API",
      primary: "Open agenda",
      secondary: "Push by a day",
      onPrimary: () => navigate("/ptm"),
      onSecondary: () => navigate("/ptm"),
    });
    return items.filter((p) => !dismissed.has(p.id)).slice(0, 3);
  }, [feeDefaultersCount, paymentSnapshot.totalPending, navigate, dismissed]);

  const greetingName = firstName;
  const pendingCount = priorities.length;

  // Static schedule rows — derive "now" by comparing local time against each
  // row's start (rows are pre-sorted ascending). The row whose start has
  // passed but whose successor's start hasn't yet is the current period.
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
    const starts = schedule.map((s) => {
      const [h, m] = s.time.split(":").map(Number);
      return h * 60 + m;
    });
    let idx = -1;
    for (let i = 0; i < starts.length; i += 1) {
      if (minutes >= starts[i]) idx = i;
    }
    if (idx < 0) return -1;
    // Treat "now" as active only inside a 90-minute window of the row start
    // so an evening view doesn't permanently flag the last morning event.
    return minutes - starts[idx] < 90 ? idx : -1;
  }, [now, schedule]);

  return (
    <div className="page page--principal">
      {/* Warm morning header */}
      <header className="hello">
        <div className="hello__sun">
          <MorningSun />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="hello__greet">
            {greeting}, {greetingName}.
          </div>
          <div className="hello__sub">
            {dateLabel}
            {pendingCount > 0 && (
              <>
                {" · "}It's a focused day — <b>{pendingCount} thing{pendingCount === 1 ? "" : "s"}</b> need you before assembly.
              </>
            )}
          </div>
        </div>
        {/* TODO: Weather is a static placeholder — needs a weather provider
            integration (e.g. OpenWeatherMap) keyed off school.address.city. */}
        <div className="hello__weather">
          <div className="weather__t">22°</div>
          <div className="weather__sub">Clear · ground dry</div>
        </div>
        <button
          type="button"
          className="hello__refresh"
          onClick={handleRefresh}
          disabled={refreshing || dashboardLoading}
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
        >
          <RefreshCw
            size={14}
            className={refreshing || dashboardLoading ? "is-spinning" : ""}
            aria-hidden
          />
        </button>
      </header>

      {/* Quiet KPI strip — 3 numbers, divider-separated, no boxes */}
      {initialLoading ? (
        <div className="tile-strip" aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div className="tile-strip__cell" key={i}>
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="text" className="h-7 w-20" />
              <Skeleton variant="text" className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="tile-strip">
          <div className="tile-strip__cell">
            <div className="tile-strip__eyebrow">Attendance today</div>
            <div className="tile-strip__num">
              {attendanceSnapshot.studentRate != null
                ? attendanceSnapshot.studentRate
                : "—"}
              {attendanceSnapshot.studentRate != null && (
                <span className="tile-strip__unit">%</span>
              )}
            </div>
            <div className="tile-strip__delta">
              {attendanceSnapshot.studentTotal > 0
                ? `${attendanceSnapshot.studentPresent.toLocaleString()} of ${attendanceSnapshot.studentTotal.toLocaleString()} present`
                : "Awaiting today's attendance"}
            </div>
          </div>

          <div className="tile-strip__cell">
            <div className="tile-strip__eyebrow">Fees collected · this month</div>
            <div className="tile-strip__num">
              {paymentSnapshot.month != null
                ? compactINR(paymentSnapshot.month)
                : "—"}
            </div>
            <div className="tile-strip__delta">
              {paymentSnapshot.totalPending != null
                ? `${compactINR(paymentSnapshot.totalPending)} outstanding`
                : "Awaiting payment data"}
            </div>
          </div>

          <div className="tile-strip__cell">
            <div className="tile-strip__eyebrow">Open priorities</div>
            <div className="tile-strip__num">{pendingCount}</div>
            <div className="tile-strip__delta">
              {pendingCount === 0 ? "Inbox zero" : "Action before assembly"}
            </div>
          </div>
        </div>
      )}

      {/* Summary — 3 priority cards */}
      <section>
        <div className="sec__head">
          <h2 className="sec__title">Summary</h2>
          <span className="sec__meta">
            {pendingCount} priorit{pendingCount === 1 ? "y" : "ies"} · 9:00am
          </span>
        </div>
        {priorities.length === 0 ? (
          <div className="dash-empty">
            <span className="chip chip--ok">All clear</span>
            <span>No open priorities — inbox zero for now.</span>
          </div>
        ) : (
          <div className="pri-grid">
            {priorities.map((p) => (
              <PriorityCard
                key={p.id}
                {...p}
                onDismiss={() =>
                  setDismissed((s) => {
                    const next = new Set(s);
                    next.add(p.id);
                    return next;
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Two-column mix: Your day + People today */}
      <div className="cols-mix">
        <section>
          <div className="sec__head">
            <h2 className="sec__title">Your day</h2>
            <span className="sec__meta">5 events</span>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => navigate("/calendar")}
            >
              Full calendar
            </button>
          </div>
          {/* TODO: schedule rows are static placeholders — needs a
              "principal events for today" calendar query (filter calendar
              events by audience containing principal/admin role). */}
          <div className="schedule">
            {schedule.map((row, i) => (
              <ScheduleRow
                key={row.time}
                time={row.time}
                title={row.title}
                meta={row.meta}
                mine={row.mine}
                now={i === nowIndex}
                status={
                  i === nowIndex ? (
                    <span className="status status--warn">
                      <span className="dot" />Now
                    </span>
                  ) : i === nowIndex + 1 ? (
                    <span className="status">Up next</span>
                  ) : null
                }
              />
            ))}
          </div>
        </section>

        <section>
          <div className="sec__head">
            <h2 className="sec__title">People today</h2>
            <span className="sec__meta">15 movements</span>
          </div>
          {/* TODO: People-today rows are static placeholders. Needs:
              · Staff-on-leave query (staffAttendance + leave-reason)
              · Student/staff birthday query
              · Late-arrival flag query (3rd lateness in current week) */}
          <div className="pulse-list">
            <div className="pulse__group">Out today</div>
            <PulseRow
              idx={0}
              name="Rajiv Khan"
              sub="Math · Sick leave · 3rd day"
              badge={<span className="status status--danger">Sub pending</span>}
            />
            <PulseRow
              idx={1}
              name="Lalita Bhat"
              sub="Science · Workshop · Dec 17–18"
              badge={<span className="status status--ok">Covered</span>}
            />
            <PulseRow
              idx={2}
              name="Surya Iyer"
              sub="PE · Personal · half day"
              badge={<span className="status status--ok">Covered</span>}
            />

            <div className="pulse__group">Celebrate</div>
            <PulseRow
              idx={3}
              name="Diya Joshi"
              sub="Class 8-B · turns 14 today"
              badge={
                <button type="button" className="btn btn--sm btn--ghost">
                  Wish
                </button>
              }
            />
            <PulseRow
              idx={4}
              name="Mr. Vasudev"
              sub="Joined the team 5 years ago"
              badge={
                <button type="button" className="btn btn--sm btn--ghost">
                  Note
                </button>
              }
            />

            <div className="pulse__group">Worth noting</div>
            <PulseRow
              idx={5}
              name="Rohan Patel"
              sub="3rd late arrival this week · 10-A"
              badge={<span className="status status--warn">Flag</span>}
            />
          </div>
        </section>
      </div>

      {/* Subtle footer line — moments of pride.
          TODO: Wire to a weekly summary API (placements, attendance high,
          fees collected vs target). Currently static placeholders. */}
      <div className="moments">
        <span className="moments__lab">This week</span>
        <span>
          <b>3</b> students placed in inter-school finals
        </span>
        <span className="moments__dot">·</span>
        <span>
          <b>{attendanceSnapshot.studentRate != null ? `${attendanceSnapshot.studentRate}%` : "—"}</b>{" "}
          attendance · highest this term
        </span>
        <span className="moments__dot">·</span>
        <span>
          <b>{paymentSnapshot.month != null ? compactINR(paymentSnapshot.month) : "—"}</b>{" "}
          collected · ahead of pace
        </span>
        {totalActiveStudents > 0 && (
          <>
            <span className="moments__dot">·</span>
            <span>
              <b>{studentsOnCampus.toLocaleString()}</b> of{" "}
              <b>{totalActiveStudents.toLocaleString()}</b> on campus
            </span>
          </>
        )}
      </div>

      {/* Background panels (don't affect main layout) */}
      <SubstitutionAlertPanel />
      <NpsSurveyModal />
    </div>
  );
}

export default React.memo(Dashboard);

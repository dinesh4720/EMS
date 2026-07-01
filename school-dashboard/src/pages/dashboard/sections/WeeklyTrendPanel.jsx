import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";
import { compactINR } from "../formatters";

/**
 * WeeklyTrendPanel — replaces the 4-card pulse strip.
 *
 * Two metric blocks, separated by a hairline:
 *  1. Fees this week — 7-day sparkline + total + WoW delta (trajectory)
 *  2. Attendance today — current rate + present count + marked-class context
 *
 * Design: one calm wide panel that answers "how's the week going?" at a glance.
 */
export default function WeeklyTrendPanel({
  weeklyFeeSeries,
  attendanceSnapshot,
  totalStudents,
  totalStaff,
  presentToday,
  onOpenFees,
  onOpenAttendance,
}) {
  const chart = useChartTheme();

  const { days, totals } = weeklyFeeSeries || {
    days: [],
    totals: { thisWeekTotal: 0, lastWeekTotal: 0 },
  };

  const sparkData = useMemo(
    () =>
      (days || []).map((d) => ({
        day: d.weekday,
        label: d.label,
        collected: d.collected,
      })),
    [days]
  );

  const hasFeeData = sparkData.some((d) => d.collected > 0);

  // Week-over-week delta
  const wowDelta = useMemo(() => {
    const thisW = totals?.thisWeekTotal || 0;
    const lastW = totals?.lastWeekTotal || 0;
    if (lastW === 0 && thisW === 0) return null;
    if (lastW === 0) return { pct: null, up: true, raw: thisW };
    const pct = Math.round(((thisW - lastW) / lastW) * 100);
    return { pct, up: pct >= 0, raw: thisW - lastW };
  }, [totals]);

  // Attendance rate + tone
  const attRate = attendanceSnapshot?.studentRate;
  const attPresent = attendanceSnapshot?.studentPresent || 0;
  const attTotal = attendanceSnapshot?.studentTotal || 0;
  const attMarked = attendanceSnapshot?.markedClasses || 0;
  const attTotalClasses = attendanceSnapshot?.totalClasses || 0;

  return (
    <section className="weekly-trend">
      {/* ── Fees this week ─────────────────────────────────────────── */}
      <button
        type="button"
        className="weekly-trend__metric weekly-trend__metric--fees"
        onClick={onOpenFees}
        disabled={!onOpenFees}
      >
        <div className="weekly-trend__metric-head">
          <span className="weekly-trend__label">
            <IndianRupee size={13} strokeWidth={2.4} />
            Collected this week
          </span>
          {wowDelta && wowDelta.pct != null && (
            <span
              className={`weekly-trend__delta ${
                wowDelta.up ? "is-up" : "is-down"
              }`}
              title={
                wowDelta.up
                  ? `Up from ${compactINR(totals.lastWeekTotal)} last week`
                  : `Down from ${compactINR(totals.lastWeekTotal)} last week`
              }
            >
              {wowDelta.up ? (
                <ArrowUpRight size={12} strokeWidth={2.6} />
              ) : (
                <ArrowDownRight size={12} strokeWidth={2.6} />
              )}
              {Math.abs(wowDelta.pct)}%
            </span>
          )}
        </div>
        <div className="weekly-trend__value-row">
          <span className="weekly-trend__value">
            {hasFeeData ? compactINR(totals?.thisWeekTotal || 0) : "—"}
          </span>
          <div className="weekly-trend__spark">
            {hasFeeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sparkData}
                  margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="weeklyFeeSpark"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.accent}
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="100%"
                        stopColor={CHART_COLORS.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2}
                    fill="url(#weeklyFeeSpark)"
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="weekly-trend__spark-empty">
                <TrendingUp size={16} />
              </div>
            )}
          </div>
        </div>
        <div className="weekly-trend__sub">
          {hasFeeData
            ? `${compactINR(totals?.lastWeekTotal || 0)} last week`
            : "No collections yet this week"}
        </div>
      </button>

      <div className="weekly-trend__divider" />

      {/* ── Attendance today ───────────────────────────────────────── */}
      <button
        type="button"
        className="weekly-trend__metric weekly-trend__metric--attendance"
        onClick={onOpenAttendance}
        disabled={!onOpenAttendance}
      >
        <div className="weekly-trend__metric-head">
          <span className="weekly-trend__label">
            <Users size={13} strokeWidth={2.4} />
            Attendance today
          </span>
          {attRate != null && (
            <span
              className={`weekly-trend__pill ${
                attRate >= 90
                  ? "is-ok"
                  : attRate >= 75
                    ? "is-warn"
                    : "is-danger"
              }`}
            >
              {attRate >= 90 ? (
                <ArrowUpRight size={12} strokeWidth={2.6} />
              ) : attRate >= 75 ? (
                <Minus size={12} strokeWidth={2.6} />
              ) : (
                <ArrowDownRight size={12} strokeWidth={2.6} />
              )}
              {attRate}%
            </span>
          )}
        </div>
        <div className="weekly-trend__value-row">
          <span className="weekly-trend__value">
            {attRate != null ? `${attRate}%` : "—"}
          </span>
          <div className="weekly-trend__ratio">
            <span className="weekly-trend__ratio-now">
              {attTotal > 0 ? attPresent : "—"}
            </span>
            <span className="weekly-trend__ratio-sep">/</span>
            <span className="weekly-trend__ratio-total">
              {attTotal > 0 ? attTotal : "—"}
            </span>
          </div>
        </div>
        <div className="weekly-trend__sub">
          {attTotalClasses > 0
            ? `${attMarked} of ${attTotalClasses} classes marked · ${(
                presentToday || 0
              ).toLocaleString()} on campus`
            : `${(presentToday || 0).toLocaleString()} people on campus`}
        </div>
      </button>
    </section>
  );
}

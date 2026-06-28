import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import AttendanceHeatmap from "../../../../components/students/AttendanceHeatmap";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import { buildMonthAttendance, formatDateShort } from "./utils";

function AttendancePanel({ studentId, attendanceData, attendanceStats, loading, error, refetch }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading attendance…</span>
      </div>
    );
  }
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }
  const rows = Array.isArray(attendanceData) ? attendanceData.slice(-60).reverse() : [];
  const monthAttendance = buildMonthAttendance(attendanceData);
  return (
    <div className="col gap-4">
      <div className="row gap-3" style={{ flexWrap: "wrap" }}>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Overall</span>
          <span className="dp-metric__value mono tnum">
            {attendanceStats?.percentage != null
              ? `${attendanceStats.percentage}%`
              : "—"}
          </span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Present</span>
          <span className="dp-metric__value mono tnum">
            {attendanceStats?.present ?? 0}
          </span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Absent</span>
          <span className="dp-metric__value mono tnum">
            {attendanceStats?.absent ?? 0}
          </span>
        </div>
      </div>

      <AttendanceHeatmap monthAttendance={monthAttendance} />

      <div className="card">
        <div className="card__head">
          <span className="card__title">Recent attendance</span>
          <Link
            to={`/students/attendance?student=${studentId}`}
            className="subtle"
            style={{ fontSize: 12, textDecoration: "none" }}
          >
            Full log →
          </Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            size="sm"
            title="No attendance recorded"
            description="Once daily attendance is marked it will appear here."
          />
        ) : (
          <div style={{ padding: 0 }}>
            {rows.map((r, i) => {
              const status = String(r.status || "").toLowerCase();
              const tone =
                status === "present"
                  ? "ok"
                  : status === "absent"
                  ? "danger"
                  : "warn";
              return (
                <div
                  key={`${r.date}-${i}`}
                  className="row gap-3"
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--divider)",
                    alignItems: "center",
                  }}
                >
                  <span className="mono tnum" style={{ minWidth: 96, fontSize: 12 }}>
                    {formatDateShort(r.date)}
                  </span>
                  <span className={`status status--${tone}`}>
                    <span className="dot" />
                    {status || "—"}
                  </span>
                  {r.classPeriod && (
                    <span className="subtle" style={{ fontSize: 12 }}>
                      {r.classPeriod}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendancePanel;

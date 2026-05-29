import React, { useMemo } from "react";
import { GraduationCap, IndianRupee, Users, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../../ui/Skeleton";

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

function KPICard({ icon: Icon, label, value, sub, tone, onClick, loading }) {
  if (loading) {
    return (
      <div className="kpi-card" aria-busy="true">
        <div className="kpi-card__top">
          <Skeleton variant="circle" className="h-9 w-9" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
        <Skeleton variant="text" className="h-8 w-28 mt-1" />
        <Skeleton variant="text" className="h-3 w-32 mt-1" />
      </div>
    );
  }
  return (
    <button type="button" className="kpi-card" onClick={onClick}>
      <div className="kpi-card__top">
        <div className={`kpi-card__icon kpi-card__icon--${tone}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <span className="kpi-card__label">{label}</span>
      </div>
      <div className="kpi-card__value">{value}</div>
      {sub && <div className="kpi-card__sub">{sub}</div>}
    </button>
  );
}

export default function KPIStripWidget({
  attendanceSnapshot = {},
  paymentSnapshot = {},
  feeDefaultersCount = 0,
  students = [],
  loading = false,
}) {
  const navigate = useNavigate();

  const totalActiveStudents = useMemo(
    () => (students || []).filter((s) => (s.status || "active") === "active").length,
    [students]
  );

  return (
    <div className="kpi-strip">
      <KPICard
        icon={GraduationCap}
        label="Attendance today"
        value={
          attendanceSnapshot.studentRate != null
            ? `${attendanceSnapshot.studentRate}%`
            : "—"
        }
        sub={
          attendanceSnapshot.studentTotal > 0
            ? `${attendanceSnapshot.studentPresent} of ${attendanceSnapshot.studentTotal} present`
            : "Awaiting attendance"
        }
        tone="accent"
        onClick={() => navigate("/students")}
        loading={loading}
      />
      <KPICard
        icon={IndianRupee}
        label="Fees this month"
        value={paymentSnapshot.month != null ? compactINR(paymentSnapshot.month) : "—"}
        sub={
          paymentSnapshot.totalPending != null
            ? `${compactINR(paymentSnapshot.totalPending)} outstanding`
            : "Awaiting payment data"
        }
        tone="ok"
        onClick={() => navigate("/fees")}
        loading={loading}
      />
      <KPICard
        icon={Users}
        label="Total students"
        value={totalActiveStudents > 0 ? totalActiveStudents.toLocaleString() : "—"}
        sub={totalActiveStudents > 0 ? "Active enrollments" : "No students yet"}
        tone="info"
        onClick={() => navigate("/students")}
        loading={loading}
      />
      <KPICard
        icon={AlertTriangle}
        label="Fee defaulters"
        value={feeDefaultersCount > 0 ? feeDefaultersCount : "—"}
        sub={
          feeDefaultersCount > 0
            ? `${feeDefaultersCount} student${feeDefaultersCount === 1 ? "" : "s"} past due`
            : "All fees up to date"
        }
        tone={feeDefaultersCount > 0 ? "warn" : "ok"}
        onClick={() => navigate("/fees")}
        loading={loading}
      />
    </div>
  );
}

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  GraduationCap, UserCheck, Wallet, AlertTriangle, Users, CalendarCheck,
  SendHorizontal, TrendingUp, FileOutput, Plus,
} from "lucide-react";

import PageShell from "../../components/ui/PageShell";
import StatCard from "../../components/ui/StatCard";
import ChartCard from "../../components/ui/ChartCard";
import Card from "../../components/ui/Card";
import QuickActionTile, { QuickActionGrid } from "../../components/ui/QuickActionTile";
import EmptyState from "../../components/ui/EmptyState";
import { CHART_COLORS, useChartTheme } from "../../utils/chartTheme";

import { useStudents } from "../../context/StudentsContext";
import { useApp } from "../../context/AppContext";

const PIE_PALETTE = [CHART_COLORS.chart1, CHART_COLORS.chart2, CHART_COLORS.chart3, CHART_COLORS.chart4, CHART_COLORS.chart5];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—");

function HubSkeleton() {
  return (
    <div className="space-y-6 animate-shimmer" aria-hidden>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-surface-2 rounded-lg" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-72 bg-surface-2 rounded-lg" />
        <div className="h-72 bg-surface-2 rounded-lg" />
      </div>
    </div>
  );
}

export default function StudentsOverview() {
  const navigate = useNavigate();
  const { students } = useStudents();
  const { loading } = useApp();

  const list = useMemo(() => (Array.isArray(students) ? students : []), [students]);

  const stats = useMemo(() => {
    const active = list.filter((s) => s.status === "active").length;
    const overdue = list.filter((s) => s.feeStatus === "overdue").length;
    const paid = list.filter((s) => s.feeStatus === "paid").length;

    const byClass = {};
    const byGender = {};
    for (const s of list) {
      const cls = s.class || "Unassigned";
      byClass[cls] = (byClass[cls] || 0) + 1;
      const g = s.gender ? s.gender[0].toUpperCase() + s.gender.slice(1) : "Unknown";
      byGender[g] = (byGender[g] || 0) + 1;
    }

    const classData = Object.entries(byClass)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const genderData = Object.entries(byGender).map(([name, value]) => ({ name, value }));

    const recent = [...list]
      .filter((s) => s.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return { active, overdue, paid, classData, genderData, recent };
  }, [list]);

  const chart = useChartTheme();
  const isEmpty = !loading && list.length === 0;

  return (
    <PageShell
      title="Students overview"
      description="A snapshot of your student body — enrolment, attendance access, fees and admissions."
      documentTitle="Students overview"
      actions={
        <button
          type="button"
          onClick={() => navigate("/students")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-fg text-bg text-sm font-medium hover:opacity-90"
        >
          <Plus size={15} /> Add student
        </button>
      }
    >
      {loading ? (
        <HubSkeleton />
      ) : isEmpty ? (
        <EmptyState
          icon={GraduationCap}
          title="No students yet"
          description="Add your first student to start seeing enrolment, attendance and fee insights here."
          actionLabel="Go to Students"
          onAction={() => navigate("/students")}
        />
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total students" value={list.length} icon={GraduationCap} color="blue" href="/students" />
            <StatCard label="Active" value={stats.active} subtext={`${list.length - stats.active} inactive`} icon={UserCheck} color="green" />
            <StatCard label="Fees paid" value={stats.paid} icon={Wallet} color="emerald" href="/fees" />
            <StatCard label="Fees overdue" value={stats.overdue} icon={AlertTriangle} color="red" href="/fees?status=overdue" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Students by class" description="Top classes by headcount" height={280} isEmpty={stats.classData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.classData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={chart.tooltipStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="count" name="Students" fill={CHART_COLORS.chart1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Gender split" description="Distribution across the school" height={280} isEmpty={stats.genderData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} isAnimationActive={false}>
                    {stats.genderData.map((entry, i) => <Cell key={entry.name} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chart.tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {stats.genderData.map((g, i) => (
                  <span key={g.name} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                    {g.name} · {g.value}
                  </span>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Recent + quick actions */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card padding="none">
              <div className="px-4 py-3 border-b border-divider">
                <h3 className="text-sm font-medium text-fg">Recently added</h3>
              </div>
              <div className="divide-y divide-divider">
                {stats.recent.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-fg-muted text-center">No recent admissions.</p>
                ) : (
                  stats.recent.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/students?focus=${s.id}`)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-fg truncate">{s.name}</p>
                        <p className="text-xs text-fg-muted truncate">{s.class || "Unassigned"} · {s.admissionNo || s.rollNo || "—"}</p>
                      </div>
                      <span className="text-xs text-fg-subtle shrink-0">{fmtDate(s.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-medium text-fg mb-3">Jump to</h3>
              <QuickActionGrid columns={2}>
                <QuickActionTile label="All students" description="Browse & manage roster" icon={Users} tone="primary" href="/students" />
                <QuickActionTile label="Attendance" description="Daily attendance" icon={CalendarCheck} tone="info" href="/students/attendance" />
                <QuickActionTile label="Form submissions" description="Review intake forms" icon={SendHorizontal} tone="warning" href="/students/submissions" />
                <QuickActionTile label="Promotion" description="Promote to next class" icon={TrendingUp} tone="emerald" href="/students/promotion" />
                <QuickActionTile label="Transfer certificate" description="Generate TCs" icon={FileOutput} tone="neutral" href="/students/transfer-certificate" />
              </QuickActionGrid>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

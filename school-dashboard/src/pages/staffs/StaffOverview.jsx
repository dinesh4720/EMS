import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Users, UserCheck, BookOpen, Plane, ContactRound, Wallet, BookMarked, Plus,
} from "lucide-react";

import PageShell from "../../components/ui/PageShell";
import StatCard from "../../components/ui/StatCard";
import ChartCard from "../../components/ui/ChartCard";
import Card from "../../components/ui/Card";
import QuickActionTile, { QuickActionGrid } from "../../components/ui/QuickActionTile";
import EmptyState from "../../components/ui/EmptyState";
import { CHART_COLORS, useChartTheme } from "../../utils/chartTheme";

import { useStaff } from "../../context/StaffContext";
import { useApp } from "../../context/AppContext";

const PIE_PALETTE = [CHART_COLORS.chart1, CHART_COLORS.chart2, CHART_COLORS.chart3, CHART_COLORS.chart4, CHART_COLORS.chart5];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
const roleList = (r) => (Array.isArray(r) ? r : r ? [r] : []);
const isTeaching = (r) => roleList(r).some((x) => /teach/i.test(x));

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

export default function StaffOverview() {
  const navigate = useNavigate();
  const { staff } = useStaff();
  const { loading } = useApp();

  const list = useMemo(() => (Array.isArray(staff) ? staff : []), [staff]);

  const stats = useMemo(() => {
    const active = list.filter((s) => s.status === "active").length;
    const onLeave = list.filter((s) => s.status === "on-leave").length;
    const teaching = list.filter((s) => isTeaching(s.role)).length;

    const byDept = {};
    for (const s of list) {
      const d = s.department || "Unassigned";
      byDept[d] = (byDept[d] || 0) + 1;
    }
    const deptData = Object.entries(byDept)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const roleData = [
      { name: "Teaching", value: teaching },
      { name: "Non-teaching", value: list.length - teaching },
    ].filter((d) => d.value > 0);

    const recent = [...list]
      .filter((s) => s.joiningDate || s.createdAt)
      .sort((a, b) => new Date(b.joiningDate || b.createdAt) - new Date(a.joiningDate || a.createdAt))
      .slice(0, 6);

    return { active, onLeave, teaching, deptData, roleData, recent };
  }, [list]);

  const chart = useChartTheme();
  const isEmpty = !loading && list.length === 0;

  return (
    <PageShell
      title="Staff overview"
      description="Your team at a glance — headcount, departments, teaching split and payroll access."
      documentTitle="Staff overview"
      actions={
        <button
          type="button"
          onClick={() => navigate("/staffs")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-fg text-bg text-sm font-medium hover:opacity-90"
        >
          <Plus size={15} /> Add staff
        </button>
      }
    >
      {loading ? (
        <HubSkeleton />
      ) : isEmpty ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Add your first staff member to see team composition and payroll insights here."
          actionLabel="Go to Staff"
          onAction={() => navigate("/staffs")}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total staff" value={list.length} icon={Users} color="blue" href="/staffs" />
            <StatCard label="Active" value={stats.active} subtext={`${list.length - stats.active} inactive`} icon={UserCheck} color="green" />
            <StatCard label="Teaching" value={stats.teaching} subtext={`${list.length - stats.teaching} non-teaching`} icon={BookOpen} color="violet" />
            <StatCard label="On leave" value={stats.onLeave} icon={Plane} color="amber" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Staff by department" description="Headcount per department" height={280} isEmpty={stats.deptData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.deptData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={chart.tooltipStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="count" name="Staff" fill={CHART_COLORS.chart2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Teaching vs non-teaching" description="Role composition" height={280} isEmpty={stats.roleData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} isAnimationActive={false}>
                    {stats.roleData.map((entry, i) => <Cell key={entry.name} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chart.tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {stats.roleData.map((g, i) => (
                  <span key={g.name} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                    {g.name} · {g.value}
                  </span>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card padding="none">
              <div className="px-4 py-3 border-b border-divider">
                <h3 className="text-sm font-medium text-fg">Recently joined</h3>
              </div>
              <div className="divide-y divide-divider">
                {stats.recent.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-fg-muted text-center">No recent joinees.</p>
                ) : (
                  stats.recent.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/staffs?focus=${s.id}`)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-fg truncate">{s.name}</p>
                        <p className="text-xs text-fg-muted truncate">{s.department || "—"} · {roleList(s.role)[0] || "Staff"}</p>
                      </div>
                      <span className="text-xs text-fg-subtle shrink-0">{fmtDate(s.joiningDate || s.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-medium text-fg mb-3">Jump to</h3>
              <QuickActionGrid columns={2}>
                <QuickActionTile label="All staff" description="Browse & manage team" icon={ContactRound} tone="primary" href="/staffs" />
                <QuickActionTile label="Payroll" description="Salary & payslips" icon={Wallet} tone="emerald" href="/staffs/payroll" />
                <QuickActionTile label="Bulk subjects" description="Assign subjects" icon={BookMarked} tone="info" href="/staffs/bulk-subjects" />
              </QuickActionGrid>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

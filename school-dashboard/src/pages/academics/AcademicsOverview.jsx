import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FilePenLine, CalendarClock, CheckCircle2, Gauge, BookOpen, ClipboardList,
  UserCheck, Wand2, Plus,
} from "lucide-react";

import PageShell from "../../components/ui/PageShell";
import StatCard from "../../components/ui/StatCard";
import ChartCard from "../../components/ui/ChartCard";
import Card from "../../components/ui/Card";
import QuickActionTile, { QuickActionGrid } from "../../components/ui/QuickActionTile";
import EmptyState from "../../components/ui/EmptyState";
import { CHART_COLORS, useChartTheme } from "../../utils/chartTheme";

import useAcademicsData from "../../hooks/useAcademicsData";

const STATUS_LABELS = {
  draft: "Draft",
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  completed: "Completed",
  results_published: "Published",
};
const UPCOMING = new Set(["scheduled", "ongoing"]);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—");
const pct = (n) => (typeof n === "number" ? `${Math.round(n)}%` : "—");

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

export default function AcademicsOverview() {
  const navigate = useNavigate();
  const { exams, isLoading } = useAcademicsData();

  const list = useMemo(() => (Array.isArray(exams) ? exams : []), [exams]);

  const stats = useMemo(() => {
    const upcoming = list.filter((e) => UPCOMING.has(e.status)).length;
    const published = list.filter((e) => e.status === "results_published" || e.isPublished).length;

    const perfVals = list.map((e) => e.avgPercentage).filter((v) => typeof v === "number");
    const avgPerf = perfVals.length ? perfVals.reduce((a, b) => a + b, 0) / perfVals.length : null;

    const byStatus = {};
    for (const e of list) {
      const label = STATUS_LABELS[e.status] || "Other";
      byStatus[label] = (byStatus[label] || 0) + 1;
    }
    const statusData = Object.entries(byStatus).map(([name, count]) => ({ name, count }));

    const perfData = list
      .filter((e) => typeof e.avgPercentage === "number")
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8)
      .map((e) => ({ name: e.name || e.subject || "Exam", avg: Math.round(e.avgPercentage) }))
      .reverse();

    const recent = [...list]
      .filter((e) => e.date || e.createdAt)
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 6);

    return { upcoming, published, avgPerf, statusData, perfData, recent };
  }, [list]);

  const chart = useChartTheme();
  const isEmpty = !isLoading && list.length === 0;

  return (
    <PageShell
      title="Academics overview"
      description="Exams, results and academic activity across your school at a glance."
      documentTitle="Academics overview"
      actions={
        <button
          type="button"
          onClick={() => navigate("/academics/exams")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-fg text-bg text-sm font-medium hover:opacity-90"
        >
          <Plus size={15} /> New exam
        </button>
      }
    >
      {isLoading ? (
        <HubSkeleton />
      ) : isEmpty ? (
        <EmptyState
          icon={FilePenLine}
          title="No exams yet"
          description="Create your first exam to start tracking results and performance here."
          actionLabel="Go to Exams"
          onAction={() => navigate("/academics/exams")}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total exams" value={list.length} icon={FilePenLine} color="blue" href="/academics/exams" />
            <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} color="amber" />
            <StatCard label="Results published" value={stats.published} icon={CheckCircle2} color="emerald" />
            <StatCard label="Avg performance" value={pct(stats.avgPerf)} icon={Gauge} color="violet" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Exams by status" description="Where exams are in their lifecycle" height={280} isEmpty={stats.statusData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.statusData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} interval={0} />
                  <YAxis stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={chart.tooltipStyle} cursor={{ fill: chart.cursorFill }} />
                  <Bar dataKey="count" name="Exams" fill={CHART_COLORS.chart1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Average performance"
              description="Recent exams with published results"
              height={280}
              isEmpty={stats.perfData.length === 0}
              emptyDescription="Publish exam results to see performance trends."
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.perfData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis stroke={chart.axis} tick={{ fill: chart.tick, fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={chart.tooltipStyle} cursor={{ fill: chart.cursorFill }} formatter={(v) => [`${v}%`, "Average"]} />
                  <Bar dataKey="avg" name="Average %" fill={CHART_COLORS.chart3} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card padding="none">
              <div className="px-4 py-3 border-b border-divider">
                <h3 className="text-sm font-medium text-fg">Recent exams</h3>
              </div>
              <div className="divide-y divide-divider">
                {stats.recent.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-fg-muted text-center">No exams to show.</p>
                ) : (
                  stats.recent.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => navigate(`/academics/exams/${e.id}`)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-fg truncate">{e.name || e.subject || "Exam"}</p>
                        <p className="text-xs text-fg-muted truncate">{e.className || "—"} · {STATUS_LABELS[e.status] || "—"}</p>
                      </div>
                      <span className="text-xs text-fg-subtle shrink-0">{fmtDate(e.date || e.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-medium text-fg mb-3">Jump to</h3>
              <QuickActionGrid columns={2}>
                <QuickActionTile label="Academics home" description="Subjects & grading" icon={BookOpen} tone="primary" href="/academics" />
                <QuickActionTile label="Exams" description="Manage exams & results" icon={FilePenLine} tone="info" href="/academics/exams" />
                <QuickActionTile label="Homework" description="Assignments" icon={ClipboardList} tone="warning" href="/homework" />
                <QuickActionTile label="PTM" description="Parent meetings" icon={UserCheck} tone="emerald" href="/ptm" />
                <QuickActionTile label="Timetable wizard" description="Auto-generate timetables" icon={Wand2} tone="violet" href="/timetable-wizard" />
              </QuickActionGrid>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

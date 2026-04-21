import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import { studentsApi } from "../../../services/api";
import { getGradeFromPercentage } from "../../../utils/grading";
import { useTranslation } from "react-i18next";

/**
 * Derives an academic year string from an exam start date.
 * Indian academic calendar: Apr–Mar, e.g. April 2024 → "2024-25"
 */
function deriveAcademicYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed; April = 3
  return m >= 3 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`;
}

const TimelineSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
      <div className="h-4 w-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
      <div className="h-3 w-32 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse mt-1.5" />
    </div>
    <div className="p-5">
      <div className="h-36 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm text-sm">
      <p className="font-medium text-gray-700 dark:text-zinc-300 mb-1">{label}</p>
      <p className="text-gray-900 dark:text-zinc-100 font-bold">{payload[0].value}%</p>
    </div>
  );
};

export default function AcademicProgressTimeline({ studentId }) {
  const { t } = useTranslation();

  const { data: allResults = [], isLoading } = useQuery({
    queryKey: ["students", "results", "all-years", studentId],
    enabled: Boolean(studentId),
    queryFn: () => studentsApi.getResults(studentId),
    staleTime: 5 * 60 * 1000,
  });

  const yearData = useMemo(() => {
    const byYear = {};

    allResults.forEach((result) => {
      if (!result.isPublished || result.percentage == null) return;

      const year =
        result.academicYear ||
        deriveAcademicYear(result.examId?.startDate);
      if (!year) return;

      if (!byYear[year]) byYear[year] = { year, scores: [], examCount: 0 };
      byYear[year].scores.push(result.percentage);
      byYear[year].examCount++;
    });

    return Object.values(byYear)
      .map(({ year, scores, examCount }) => ({
        year,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        examCount,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [allResults]);

  if (isLoading) return <TimelineSkeleton />;

  // Only render if there's data for 2+ academic years
  if (yearData.length < 2) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <History size={15} className="text-gray-500 dark:text-zinc-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {t("students.academics.progressTimeline", "Academic Progress Timeline")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {t("students.academics.progressTimelineDesc", "Year-over-year performance comparison")}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 pt-5 pb-2">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={yearData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-zinc-800" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avgScore"
              stroke="#374151"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={{ fill: "#374151", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#111827", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-year cards */}
      <div className="px-5 pb-5 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {yearData.map((yd, i) => {
          const prev = yearData[i - 1];
          const delta = prev ? yd.avgScore - prev.avgScore : null;
          const grade = getGradeFromPercentage(yd.avgScore);

          let TrendIcon = Minus;
          let trendColor = "text-gray-400 dark:text-zinc-500";
          if (delta !== null && delta > 2) {
            TrendIcon = TrendingUp;
            trendColor = "text-emerald-500";
          } else if (delta !== null && delta < -2) {
            TrendIcon = TrendingDown;
            trendColor = "text-red-400";
          }

          return (
            <div
              key={yd.year}
              className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{yd.year}</span>
                <TrendIcon size={13} className={trendColor} />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{yd.avgScore}%</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400 dark:text-zinc-500">Grade {grade}</span>
                <span className="text-xs text-gray-400 dark:text-zinc-500">{yd.examCount} exam{yd.examCount !== 1 ? "s" : ""}</span>
              </div>
              {delta !== null && (
                <p className={`text-xs mt-1 font-medium ${delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-400" : "text-gray-400 dark:text-zinc-500"}`}>
                  {delta > 0 ? `+${delta}` : delta}% vs prev
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

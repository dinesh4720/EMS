import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { TrendingUp, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CHART_COLORS } from "../../../utils/chartTheme";
import { CustomTooltip } from "./StudentDashboardHelpers";

// ============================================================================
// STUDENT OVERVIEW TAB
// KPI stat cards + Performance chart + Attendance chart
// ============================================================================

function StatCard({ stat, onNavigate }) {
  const Icon = stat.icon;
  return (
    <div
      onClick={() => onNavigate(stat)}
      className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-gray-200 dark:hover:border-zinc-700 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon size={16} className="text-gray-500 dark:text-zinc-400" />
        </div>
      </div>
      {stat.loading ? (
        <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mt-1" />
      ) : (
        <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{stat.value}</h3>
      )}
      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
      {stat.subtext && (
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
          {stat.loading ? (
            <span className="inline-block h-2.5 w-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          ) : (
            stat.subtext
          )}
        </p>
      )}
      {(stat.tab || stat.navigateTo) && stat.actionLabel && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <span className="text-xs text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors flex items-center gap-1">
            {stat.actionLabel}
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
      )}
    </div>
  );
}

export default function StudentOverviewTab({
  stats,
  results,
  attendanceData,
  attendanceLoading,
  monthlyAttendanceData,
  onStatNavigate,
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Actionable KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={`stat-${stat.label}`} stat={stat} onNavigate={onStatNavigate} />
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.performanceTrend1')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.academicPerformanceOverTime')}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          {results?.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.map((res, idx) => ({ name: res.examName || `Exam ${idx + 1}`, value: res.percentage || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Score" stroke={CHART_COLORS.neutral} strokeWidth={2} fill={CHART_COLORS.neutralLight} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noExamDataAvailable')}</div>
          )}
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Clock size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.attendanceTrend')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.monthlyAttendance')}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          {attendanceLoading ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Attendance" stroke={CHART_COLORS.neutral} strokeWidth={2} fill={CHART_COLORS.neutralLight} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm">
              No attendance data available
            </div>
          )}
        </div>
      </div>
    </>
  );
}

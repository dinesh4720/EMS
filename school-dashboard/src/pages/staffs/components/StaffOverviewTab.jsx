/**
 * StaffOverviewTab - Minimal gray styling matching StudentDashboard
 * Card-based layout with clean design
 */
import { Activity, CheckCircle, Clock, BookOpen, Users, AlertTriangle, TrendingUp, FileText, Calendar, Award, ChevronRight, XCircle, BarChart3 } from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';


// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-600 dark:text-zinc-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StaffOverviewTab({
  staff,
  monthlyStats,
  attendanceRate,
  attendance,
  classTeacherAssignments,
  staffAttendance
}) {
  const chart = useChartTheme();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const isTeacher = Array.isArray(staff?.role) ? staff.role.includes('Teacher') : staff?.role === 'Teacher';

  const todayAttendance = attendance?.[todayStr];
  const safeMonthlyStats = monthlyStats || { present: 0, absent: 0, leave: 0, halfday: 0, total: 0 };
  const isPresentToday = todayAttendance?.status === 'present' || safeMonthlyStats.present > 0;

  const safeClassTeacherAssignments = classTeacherAssignments || [];
  const totalStudents = safeClassTeacherAssignments.reduce((sum, cls) => sum + (cls.studentCount || cls.strength || 0), 0);

  const avgClassAttendance = safeClassTeacherAssignments.length > 0
    ? Math.round(safeClassTeacherAssignments.reduce((sum, cls) => sum + (cls.averageAttendance || cls.attendance || 0), 0) / safeClassTeacherAssignments.length)
    : 0;

  // Compute real attendance trend from actual attendance records
  const attendanceTrendData = (() => {
    const staffAtt = staffAttendance || {};
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Show last 6 months including current
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      let present = 0, total = 0;

      Object.entries(staffAtt).forEach(([date, data]) => {
        const dateObj = new Date(date);
        if (dateObj.getFullYear() === year && dateObj.getMonth() === month) {
          total++;
          if (data.status === 'present') present++;
        }
      });

      months.push({
        name: monthNames[month],
        attendance: total > 0 ? Math.round((present / total) * 100) : 0
      });
    }
    return months;
  })();

  const classPerformanceData = classTeacherAssignments.slice(0, 4).map(cls => ({
    name: `${cls.name}-${cls.section}`,
    attendance: cls.averageAttendance || cls.attendance || 0
  }));

  return (
    <>
      {/* Attendance Chart */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.attendanceTrend')}</h3><p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.monthlyAttendanceOverview')}</p></div>
          </div>
        </div>
        <div className="p-5">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 11 }} domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance"
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={{ fill: '#6b7280', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Class-wise Attendance for Teachers */}
      {isTeacher && classTeacherAssignments.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><BarChart3 size={16} className="text-gray-600 dark:text-zinc-400" /></div>
              <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classWiseAttendance')}</h3><p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.attendanceByAssignedClasses')}</p></div>
            </div>
          </div>
          <div className="p-5">
            {classPerformanceData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 11 }} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="attendance" name="Attendance" fill={CHART_COLORS.neutral} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm">
                No class data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classes Handling Table for Teachers */}
      {isTeacher && classTeacherAssignments.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><BookOpen size={16} className="text-gray-600 dark:text-zinc-400" /></div>
              <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classesHandling')}</h3><p className="text-xs text-gray-500 dark:text-zinc-500">{classTeacherAssignments.length} class(es) assigned</p></div>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {classTeacherAssignments.map((cls) => {
              const classAttendance = cls.averageAttendance || cls.attendance || 0;
              return (
                <div key={cls.id || cls._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-zinc-300">
                      {cls.name}-{cls.section}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{cls.name} - {cls.section}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{cls.studentCount || cls.strength || 0} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${classAttendance >= 90 ? 'bg-gray-800' :
                            classAttendance >= 75 ? 'bg-gray-600' : 'bg-gray-400'
                          }`}
                        style={{ width: `${classAttendance}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold w-12 text-right ${classAttendance >= 90 ? 'text-gray-900 dark:text-zinc-100' :
                        classAttendance >= 75 ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-500 dark:text-zinc-400'
                      }`}>
                      {classAttendance}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity (computed from attendance records) */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Activity size={16} className="text-gray-600 dark:text-zinc-400" /></div>
            <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.recentActivity1')}</h3><p className="text-xs text-gray-500 dark:text-zinc-500">{t('pages.fromAttendanceRecords')}</p></div>
          </div>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
          {(() => {
            const staffAtt = staffAttendance || {};
            const entries = Object.entries(staffAtt)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .slice(0, 5);

            if (entries.length === 0) {
              return (
                <div className="px-5 py-8 text-center text-gray-400 dark:text-zinc-500 text-sm">
                  No recent activity recorded
                </div>
              );
            }

            return entries.map(([date, data]) => {
              const statusText = data.status === 'present' ? 'Marked Present' : data.status === 'absent' ? 'Marked Absent' : data.status === 'leave' ? 'On Leave' : data.status;
              const IconComponent = data.status === 'present' ? CheckCircle : data.status === 'leave' ? Calendar : FileText;
              const dateObj = new Date(date + 'T00:00:00');
              const isToday = date === todayStr;
              const timeLabel = isToday ? 'Today' : dateObj.toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric' });
              return (
                <div key={date} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <IconComponent size={14} className="text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{statusText}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{timeLabel}{data.inTime && data.inTime !== '-' ? ` \u00b7 ${data.inTime}` : ''}</p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </>
  );
}

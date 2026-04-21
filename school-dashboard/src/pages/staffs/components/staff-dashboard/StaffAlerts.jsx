import { AlertCircle, CheckCircle2, Users } from "lucide-react";

export default function StaffAlerts({ attendanceRate, avgClassAttendance, isTeacher, t }) {
  const hasAlerts = attendanceRate < 75 || (isTeacher && avgClassAttendance < 75);

  if (hasAlerts) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800"><h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.attentionRequired1')}</h3></div>
        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
          {attendanceRate < 75 && (
            <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><AlertCircle size={16} className="text-gray-600 dark:text-zinc-400" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.lowAttendance1')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{attendanceRate}% (below 75%)</p></div>
            </div>
          )}
          {isTeacher && avgClassAttendance < 75 && (
            <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Users size={16} className="text-gray-600 dark:text-zinc-400" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.classAttendanceAlert')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">Average: {avgClassAttendance}%</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" /></div>
        <div><h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.allClear')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noIssuesDetected')}</p></div>
      </div>
      <p className="text-sm text-gray-600 dark:text-zinc-400">This staff member is performing well with good attendance and no pending actions.</p>
    </div>
  );
}

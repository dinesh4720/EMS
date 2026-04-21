import { Button } from "@heroui/react";
import { CheckCircle2, XCircle, Clock, Calendar, BookOpen, Send, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

// ============================================================================
// STUDENT ATTENDANCE TAB
// Stats overview, quick mark, subject-wise placeholder, send report
// ============================================================================

export default function StudentAttendanceTab({
  attendanceStats,
  attendanceLoading,
  todayAttendanceStatus,
  onQuickMarkAttendance,
  onSendAttendanceReport,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {/* Attendance Stats */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-5">
        {attendanceLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.attendanceOverview')}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Based on {attendanceStats.total} recorded days</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.percentage}%</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.attendanceRate')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.present}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.present2')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.absent}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.absent2')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.total}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.totalDays2')}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Mark */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.markAttendance')}</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Today, {format(new Date(), 'dd MMM yyyy')}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
            Note: Attendance is typically marked by teachers through the Staff Mobile App.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'present', label: t('pages.present2'), Icon: CheckCircle2, activeColor: 'border-green-500 bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600' },
              { key: 'absent', label: t('pages.absent2'), Icon: XCircle, activeColor: 'border-red-500 bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-600' },
              { key: 'halfday', label: t('pages.halfDay'), Icon: Clock, activeColor: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600' },
              { key: 'leave', label: t('pages.leave'), Icon: Calendar, activeColor: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-600' },
            ].map(({ key, label, Icon, activeColor, iconColor }) => {
              const isActive = todayAttendanceStatus === key;
              return (
                <button
                  key={key}
                  onClick={() => onQuickMarkAttendance(key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    isActive
                      ? `${activeColor} ring-1 ring-offset-1`
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon size={20} className={isActive ? iconColor : 'text-gray-600 dark:text-zinc-400'} />
                  <span className={`text-xs font-medium ${isActive ? iconColor : 'text-gray-700 dark:text-zinc-300'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject-wise Attendance - Not Available */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subjectWiseAttendance')}</h3>
        </div>
        <div className="p-8 text-center">
          <BookOpen size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.subjectWiseAttendanceTrackingIsNotCurrentlyAvailable')}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">This feature requires per-subject attendance tracking which will be implemented in a future update.</p>
        </div>
      </div>

      {/* Send Report */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send size={18} className="text-gray-400 dark:text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.sendReportToParent')}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.shareAttendanceSummaryViaEmailOrSms')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Mail size={14} />} onPress={() => onSendAttendanceReport('email')}>{t('pages.email1')}</Button>
            <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Phone size={14} />} onPress={() => onSendAttendanceReport('sms')}>SMS</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

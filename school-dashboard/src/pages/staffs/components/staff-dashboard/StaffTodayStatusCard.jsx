import { Activity, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function StaffTodayStatusCard({ attendance, staffId, attendanceRate, t }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayRecord = attendance?.[staffId]?.[todayStr];
  const todayStatus = todayRecord?.status || 'unmarked';
  const checkInTime = todayRecord?.inTime && todayRecord.inTime !== '-' ? todayRecord.inTime : null;
  const checkOutTime = todayRecord?.outTime && todayRecord.outTime !== '-' ? todayRecord.outTime : null;
  const isPresent = todayStatus === 'present';
  const isAbsent = todayStatus === 'absent';
  const isOnLeave = todayStatus === 'leave';

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Activity size={16} className="text-gray-600 dark:text-zinc-400" /></div>
          <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.todaySStatus')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{format(today, 'EEEE, MMMM d, yyyy')}</p></div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPresent ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-900'}`}>
              <CheckCircle2 size={24} className={isPresent ? 'text-gray-600 dark:text-zinc-400' : 'text-gray-400 dark:text-zinc-500'} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {isPresent ? 'Present Today' : isAbsent ? 'Absent Today' : isOnLeave ? 'On Leave' : 'Not Marked'}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {checkInTime ? `Check-in: ${checkInTime}` : isPresent ? 'Check-in: Marked' : 'Check-in: --:--'}
                {checkOutTime ? ` · Out: ${checkOutTime}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{attendanceRate}%</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.monthlyAttendance1')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

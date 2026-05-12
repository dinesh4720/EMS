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
    <div className="bg-surface rounded-lg border border-border-token overflow-hidden">
      <div className="p-5 border-b border-border-token">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center"><Activity size={16} className="text-fg-muted" /></div>
          <div><h3 className="font-medium text-fg text-sm">{t('pages.todaySStatus')}</h3><p className="text-xs text-fg-muted">{format(today, 'EEEE, MMMM d, yyyy')}</p></div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPresent ? 'bg-surface-2' : 'bg-surface-2'}`}>
              <CheckCircle2 size={24} className={isPresent ? 'text-fg-muted' : 'text-fg-faint'} />
            </div>
            <div>
              <p className="text-sm font-medium text-fg">
                {isPresent ? 'Present Today' : isAbsent ? 'Absent Today' : isOnLeave ? 'On Leave' : 'Not Marked'}
              </p>
              <p className="text-xs text-fg-muted">
                {checkInTime ? `Check-in: ${checkInTime}` : isPresent ? 'Check-in: Marked' : 'Check-in: --:--'}
                {checkOutTime ? ` · Out: ${checkOutTime}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-fg">{attendanceRate}%</p>
            <p className="text-xs text-fg-muted">{t('pages.monthlyAttendance1')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

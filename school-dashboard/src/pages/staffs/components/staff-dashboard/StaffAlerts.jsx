import { AlertCircle, CheckCircle2, Users } from "lucide-react";

export default function StaffAlerts({ attendanceRate, avgClassAttendance, isTeacher, t }) {
  const hasAlerts = attendanceRate < 75 || (isTeacher && avgClassAttendance < 75);

  if (hasAlerts) {
    return (
      <div className="bg-surface rounded-lg border border-divider overflow-hidden">
        <div className="p-4 border-b border-divider"><h3 className="text-sm font-medium text-fg">{t('pages.attentionRequired1')}</h3></div>
        <div className="divide-y divide-divider">
          {attendanceRate < 75 && (
            <div className="p-4 flex items-center gap-3 hover:bg-surface-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><AlertCircle size={16} className="text-fg-muted" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-fg">{t('pages.lowAttendance1')}</p><p className="text-xs text-fg-muted">{attendanceRate}% (below 75%)</p></div>
            </div>
          )}
          {isTeacher && avgClassAttendance < 75 && (
            <div className="p-4 flex items-center gap-3 hover:bg-surface-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><Users size={16} className="text-fg-muted" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-fg">{t('pages.classAttendanceAlert')}</p><p className="text-xs text-fg-muted">Average: {avgClassAttendance}%</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><CheckCircle2 size={16} className="text-fg-muted" /></div>
        <div><h3 className="text-sm font-medium text-fg">{t('pages.allClear')}</h3><p className="text-xs text-fg-muted">{t('pages.noIssuesDetected')}</p></div>
      </div>
      <p className="text-sm text-fg-muted">This staff member is performing well with good attendance and no pending actions.</p>
    </div>
  );
}

import { ChevronRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

function ScheduleSkeleton() {
  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-28 animate-shimmer rounded" />
        <div className="h-3 w-8 animate-shimmer rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={`schedule-skeleton-${i}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2">
            <div className="w-1 h-8 rounded-full animate-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 animate-shimmer rounded" />
              <div className="h-2.5 w-32 animate-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarSchedule({ todayStatus, onViewTimetable, loading }) {
  const { t } = useTranslation();

  if (loading) return <ScheduleSkeleton />;

  const periods = [];
  if (todayStatus?.currentClass) periods.push({ ...todayStatus.currentClass, isCurrent: true });
  if (todayStatus?.upcomingClass) periods.push({ ...todayStatus.upcomingClass, isCurrent: false });

  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-fg">{t('classes.todaysSchedule', "Today's Schedule")}</h3>
        <button onClick={onViewTimetable} className="text-xs text-fg-muted hover:text-fg flex items-center gap-1">
          {t('classes.full', 'Full')} <ChevronRight size={12} />
        </button>
      </div>
      {periods.length > 0 ? (
        <div className="space-y-2">
          {periods.map((p, i) => (
            <div key={p.isCurrent ? 'period-current' : 'period-upcoming'} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${p.isCurrent ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' : 'bg-surface-2'}`}>
              <div className={`w-1 h-8 rounded-full flex-shrink-0 ${p.isCurrent ? 'bg-blue-500' : 'bg-surface-2'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${p.isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-fg'}`}>
                  {p.subject || t('classes.freePeriod', 'Free Period')}
                </p>
                <p className="text-[11px] text-fg-muted truncate">
                  {p.isCurrent ? t('classes.now', 'Now') : p.time || t('classes.next', 'Next')}{p.teacher ? ` · ${p.teacher}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-fg-faint text-center py-3">{t('classes.noScheduleData', 'No schedule data available')}</p>
      )}
    </div>
  );
}

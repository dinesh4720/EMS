import { ChevronRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

function ScheduleSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div className="h-3 w-8 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900">
            <div className="w-1 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
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
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('classes.todaysSchedule', "Today's Schedule")}</h3>
        <button onClick={onViewTimetable} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 flex items-center gap-1">
          {t('classes.full', 'Full')} <ChevronRight size={12} />
        </button>
      </div>
      {periods.length > 0 ? (
        <div className="space-y-2">
          {periods.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${p.isCurrent ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-900'}`}>
              <div className={`w-1 h-8 rounded-full flex-shrink-0 ${p.isCurrent ? 'bg-blue-500' : 'bg-gray-200 dark:bg-zinc-700'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${p.isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-zinc-300'}`}>
                  {p.subject || t('classes.freePeriod', 'Free Period')}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                  {p.isCurrent ? t('classes.now', 'Now') : p.time || t('classes.next', 'Next')}{p.teacher ? ` · ${p.teacher}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-3">{t('classes.noScheduleData', 'No schedule data available')}</p>
      )}
    </div>
  );
}

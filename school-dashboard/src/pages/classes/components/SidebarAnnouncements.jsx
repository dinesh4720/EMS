import { Megaphone } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../../utils/dateFormatter';

function AnnouncementsSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div className="h-3 w-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900">
            <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mt-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarAnnouncements({ announcements, onSend, loading }) {
  const { t } = useTranslation();

  if (loading) return <AnnouncementsSkeleton />;

  if (!announcements || announcements.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">{t('classes.announcements', 'Announcements')}</h3>
        <div className="text-center py-3">
          <Megaphone size={24} className="mx-auto text-gray-200 dark:text-zinc-700 mb-2" />
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">{t('classes.noAnnouncementsYet', 'No announcements yet')}</p>
          <button onClick={onSend} className="text-xs font-medium text-blue-600 hover:text-blue-800">{t('classes.sendAnnouncement', 'Send Announcement')}</button>
        </div>
      </div>
    );
  }

  const priorityColors = { urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', normal: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400', low: 'bg-gray-50 text-gray-500 dark:bg-zinc-900 dark:text-zinc-500' };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('classes.announcements', 'Announcements')}</h3>
        <button onClick={onSend} className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300">{t('common.send', 'Send')}</button>
      </div>
      <div className="space-y-2">
        {announcements.slice(0, 3).map((a, i) => (
          <div key={a._id || i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 line-clamp-1">{a.title}</p>
              {a.priority && a.priority !== 'normal' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${priorityColors[a.priority] || priorityColors.normal}`}>
                  {a.priority}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              {a.createdAt ? formatShortDate(a.createdAt) : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

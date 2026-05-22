import { Megaphone } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../../utils/dateFormatter';

function AnnouncementsSkeleton() {
  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 animate-shimmer rounded" />
        <div className="h-3 w-10 animate-shimmer rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-2.5 rounded-lg bg-surface-2">
            <div className="h-3.5 w-3/4 animate-shimmer rounded" />
            <div className="h-2.5 w-16 animate-shimmer rounded mt-1.5" />
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
      <div className="bg-surface rounded-lg border border-divider p-5">
        <h3 className="text-sm font-medium text-fg mb-3">{t('classes.announcements', 'Announcements')}</h3>
        <div className="text-center py-3">
          <Megaphone size={24} className="mx-auto text-fg-faint mb-2" />
          <p className="text-xs text-fg-faint mb-3">{t('classes.noAnnouncementsYet', 'No announcements yet')}</p>
          <button onClick={onSend} className="text-xs font-medium text-blue-600 hover:text-blue-800">{t('classes.sendAnnouncement', 'Send Announcement')}</button>
        </div>
      </div>
    );
  }

  const priorityColors = { urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', normal: 'bg-surface-2 text-fg-muted', low: 'bg-surface-2 text-fg-muted' };

  return (
    <div className="bg-surface rounded-lg border border-divider p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-fg">{t('classes.announcements', 'Announcements')}</h3>
        <button onClick={onSend} className="text-xs text-fg-muted hover:text-fg">{t('common.send', 'Send')}</button>
      </div>
      <div className="space-y-2">
        {announcements.slice(0, 3).map((a, i) => (
          <div key={a._id || i} className="p-2.5 rounded-lg bg-surface-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-fg line-clamp-1">{a.title}</p>
              {a.priority && a.priority !== 'normal' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${priorityColors[a.priority] || priorityColors.normal}`}>
                  {a.priority}
                </span>
              )}
            </div>
            <p className="text-[11px] text-fg-faint mt-1">
              {a.createdAt ? formatShortDate(a.createdAt) : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

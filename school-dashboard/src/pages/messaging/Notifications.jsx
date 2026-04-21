import { useState, useEffect } from 'react';
import { Bell, Settings, CheckCircle } from 'lucide-react';
import NotificationCenter from './components/notifications/NotificationCenter';
import NotificationSettings from './components/notifications/NotificationSettings';
import { notificationsApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';

export default function Notifications() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('center');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsApi.getAll();
      const notifications = Array.isArray(data) ? data : data?.notifications || [];
      const count = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-950 space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 border-b border-gray-200 dark:border-zinc-800 pb-2">
          <div className="h-8 w-36 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <CardGridPageSkeleton title={false} cards={4} columns="grid-cols-1" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
          <Bell className="text-teal-600" size={24} />
          Notifications
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
          Manage your notifications and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setSelectedTab('center')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === 'center'
              ? 'text-teal-600 border-teal-600'
              : 'text-gray-500 dark:text-zinc-400 border-transparent hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          <Bell size={16} />
          <span>{t('pages.notificationCenter')}</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSelectedTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === 'settings'
              ? 'text-teal-600 border-teal-600'
              : 'text-gray-500 dark:text-zinc-400 border-transparent hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          <Settings size={16} />
          <span>{t('pages.settings2')}</span>
        </button>
      </div>

      {/* Content */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        {selectedTab === 'center' ? (
          <NotificationCenter />
        ) : (
          <NotificationSettings userRole="staff" />
        )}
      </div>
    </div>
  );
}

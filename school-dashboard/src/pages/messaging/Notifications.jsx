import { useState, useEffect } from 'react';
import { Bell, Settings } from 'lucide-react';
import NotificationCenter from './components/notifications/NotificationCenter';
import NotificationSettings from './components/notifications/NotificationSettings';
import { notificationsApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Chip,
  MinimalTabs,
  SectionHeading,
  Skeleton,
} from '../../components/ui';

export default function Notifications() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('center');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await notificationsApi.getAll();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : data?.notifications || [];
        setUnreadCount(list.filter((n) => !n.isRead && !n.read).length);
      } catch {
        if (mounted) setUnreadCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tabs = [
    {
      key: 'center',
      title: (
        <span className="flex items-center gap-2">
          <span>{t('pages.notificationCenter')}</span>
          {unreadCount > 0 && (
            <Chip size="sm" color="info">
              {unreadCount}
            </Chip>
          )}
        </span>
      ),
      icon: <Bell size={14} />,
    },
    {
      key: 'settings',
      title: t('pages.settings2'),
      icon: <Settings size={14} />,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <SectionHeading icon={Bell} description="Manage your notifications and preferences">
        Notifications
      </SectionHeading>

      <MinimalTabs
        tabs={tabs}
        activeKey={selectedTab}
        onChange={setSelectedTab}
        variant="underline"
      />

      <Card padding="md">
        {loading ? (
          <div className="space-y-3">
            <Skeleton.Row />
            <Skeleton.Row />
            <Skeleton.Row />
          </div>
        ) : selectedTab === 'center' ? (
          <NotificationCenter onUnreadCountChange={setUnreadCount} />
        ) : (
          <NotificationSettings userRole="staff" />
        )}
      </Card>
    </div>
  );
}

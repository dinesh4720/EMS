import { useState, useEffect } from 'react';
import { Card, Tabs, Tab } from '@heroui/react';
import { Bell, Settings, CheckCircle } from 'lucide-react';
import NotificationCenter from './components/notifications/NotificationCenter';
import NotificationSettings from './components/notifications/NotificationSettings';
import { notificationsApi } from '../../services/api';

export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState('center');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      // In a real app, fetch from API
      // const notifications = await notificationsApi.getAll();
      // setUnreadCount(notifications.filter(n => !n.read).length);

      // Mock data for now
      setUnreadCount(3);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="text-primary" size={28} />
          Notifications
        </h1>
        <p className="text-default-500 mt-1">
          Manage your notifications and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        className="mb-4"
      >
        <Tab
          key="center"
          title={
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <Chip size="sm" color="danger" variant="flat">
                  {unreadCount}
                </Chip>
              )}
            </div>
          }
        />
        <Tab
          key="settings"
          title={
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <span>Settings</span>
            </div>
          }
        />
      </Tabs>

      {/* Content */}
      {selectedTab === 'center' ? (
        <NotificationCenter />
      ) : (
        <Card className="border border-default-200">
          <div className="p-6">
            <NotificationSettings userRole="staff" />
          </div>
        </Card>
      )}
    </div>
  );
}

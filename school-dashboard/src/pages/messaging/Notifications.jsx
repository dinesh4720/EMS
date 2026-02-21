import { useState, useEffect } from 'react';
import { Bell, Settings, CheckCircle } from 'lucide-react';
import NotificationCenter from './components/notifications/NotificationCenter';
import NotificationSettings from './components/notifications/NotificationSettings';

export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState('center');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    // Mock data
    setUnreadCount(3);
  };

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="text-teal-600" size={24} />
          Notifications
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your notifications and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setSelectedTab('center')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === 'center'
              ? 'text-teal-600 border-teal-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Bell size={16} />
          <span>Notification Center</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSelectedTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            selectedTab === 'settings'
              ? 'text-teal-600 border-teal-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>

      {/* Content */}
      <div className="border border-gray-200 rounded-lg p-6">
        {selectedTab === 'center' ? (
          <NotificationCenter />
        ) : (
          <NotificationSettings userRole="staff" />
        )}
      </div>
    </div>
  );
}

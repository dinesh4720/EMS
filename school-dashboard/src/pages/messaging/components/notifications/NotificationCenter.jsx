import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  ScrollShadow,
  Tabs,
  Tab,
  Avatar,
  Divider,
} from '@heroui/react';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Check,
  Trash2,
  CheckCircle,
  DollarSign,
  Calendar,
  Users,
  BookOpen,
  AlertCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS = {
  fee: { icon: DollarSign, color: 'warning' },
  attendance: { icon: Users, color: 'danger' },
  announcement: { icon: Bell, color: 'primary' },
  exam: { icon: BookOpen, color: 'secondary' },
  reminder: { icon: Calendar, color: 'success' },
  alert: { icon: AlertCircle, color: 'danger' },
};

const CHANNEL_ICONS = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  whatsapp: { icon: Phone, label: 'WhatsApp' },
  in_app: { icon: Bell, label: 'In-App' },
};

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    _id: '1',
    type: 'fee',
    title: 'Fee Payment Reminder',
    message: 'Fee payment of ₹15,000 for John Doe is due on 2026-01-25',
    channel: 'email',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    actionUrl: '/fees',
  },
  {
    _id: '2',
    type: 'attendance',
    title: 'Attendance Alert',
    message: 'John Doe was absent for 3 consecutive days',
    channel: 'sms',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    actionUrl: '/attendance',
  },
  {
    _id: '3',
    type: 'announcement',
    title: 'School Closed Tomorrow',
    message: 'Due to maintenance work, school will remain closed tomorrow',
    channel: 'in_app',
    read: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    actionUrl: '/announcements',
  },
  {
    _id: '4',
    type: 'exam',
    title: 'Exam Schedule Released',
    message: 'Final exam schedule for Grade 10 has been announced',
    channel: 'email',
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    actionUrl: '/exams',
  },
  {
    _id: '5',
    type: 'reminder',
    title: 'Parent-Teacher Meeting',
    message: 'Reminder: Parent-teacher meeting tomorrow at 10:00 AM',
    channel: 'whatsapp',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    actionUrl: '/events',
  },
  {
    _id: '6',
    type: 'fee',
    title: 'Fee Overdue Notice',
    message: 'Fee payment for Jane Smith is overdue by 15 days',
    channel: 'email',
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    actionUrl: '/fees',
  },
];

export default function NotificationCenter({ onClose, isPopover = false }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Use mock data for now
      setNotifications(MOCK_NOTIFICATIONS.slice(0, isPopover ? 5 : undefined));
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all notifications?')) return;

    try {
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const groupNotificationsByDate = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifs.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);

      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={isPopover ? "w-full" : "w-full max-w-2xl mx-auto"}>
      {/* Header */}
      <div className={`flex justify-between items-center ${isPopover ? 'p-3 border-b border-default-200' : 'mb-4'}`}>
        <div>
          <h2 className={`font-semibold flex items-center gap-2 ${isPopover ? 'text-base' : 'text-xl'}`}>
            <Bell size={isPopover ? 18 : 24} className="text-primary" />
            Notifications
            {unreadCount > 0 && !isPopover && (
              <Chip size="sm" color="danger" variant="flat">
                {unreadCount} new
              </Chip>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="flat"
              onPress={handleMarkAllAsRead}
              isLoading={markingAll}
              startContent={<CheckCircle size={14} />}
            >
              {isPopover ? '' : 'Mark All Read'}
            </Button>
          )}
          {notifications.length > 0 && !isPopover && (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={handleClearAll}
              startContent={<Trash2 size={14} />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs - Hide in popover mode */}
      {!isPopover && (
        <Tabs
          selectedKey={filter}
          onSelectionChange={setFilter}
          variant="underlined"
          className="mb-4"
        >
          <Tab key="all" title={`All (${notifications.length})`} />
          <Tab key="unread" title={`Unread (${unreadCount})`} />
          <Tab key="read" title={`Read (${notifications.length - unreadCount})`} />
        </Tabs>
      )}

      {/* Notifications List */}
      <Card className="border border-default-200">
        <CardBody className="p-0">
          <ScrollShadow className={isPopover ? "max-h-[400px]" : "max-h-[600px]"}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Bell className="animate-pulse text-default-300" size={48} />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell size={48} className="text-default-300 mb-3" />
                <p className="text-default-400 font-medium">No notifications</p>
                <p className="text-sm text-default-500">
                  {filter === 'unread' ? 'No unread notifications' : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-default-100">
                {/* Today */}
                {groupedNotifications.today.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-default-50">
                      <p className="text-xs font-semibold text-default-500 uppercase">Today</p>
                    </div>
                    {groupedNotifications.today.map(notification => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        formatTime={formatTime}
                      />
                    ))}
                  </>
                )}

                {/* Yesterday */}
                {groupedNotifications.yesterday.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-default-50">
                      <p className="text-xs font-semibold text-default-500 uppercase">Yesterday</p>
                    </div>
                    {groupedNotifications.yesterday.map(notification => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        formatTime={formatTime}
                      />
                    ))}
                  </>
                )}

                {/* Older */}
                {groupedNotifications.older.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-default-50">
                      <p className="text-xs font-semibold text-default-500 uppercase">Older</p>
                    </div>
                    {groupedNotifications.older.map(notification => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        formatTime={formatTime}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollShadow>
        </CardBody>
      </Card>
    </div>
  );
}

function NotificationItem({ notification, onMarkAsRead, onDelete, formatTime }) {
  const IconComponent = NOTIFICATION_ICONS[notification.type]?.icon || Bell;
  const iconColor = NOTIFICATION_ICONS[notification.type]?.color || 'default';
  const ChannelIcon = CHANNEL_ICONS[notification.channel]?.icon || Bell;
  const channelLabel = CHANNEL_ICONS[notification.channel]?.label || notification.channel;

  return (
    <div
      className={`
        relative p-4 hover:bg-default-50 transition-colors cursor-pointer
        ${!notification.read ? 'bg-primary/5' : ''}
      `}
      onClick={() => !notification.read && onMarkAsRead(notification._id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg bg-${iconColor}/10 flex items-center justify-center flex-shrink-0`}>
          <IconComponent size={20} className={`text-${iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${!notification.read ? 'text-primary' : ''}`}>
              {notification.title}
              {!notification.read && (
                <Chip size="sm" color="primary" variant="flat" className="ml-2">
                  New
                </Chip>
              )}
            </h4>
            <p className="text-xs text-default-400 flex-shrink-0">
              {formatTime(notification.createdAt)}
            </p>
          </div>
          <p className="text-sm text-default-600 mb-2">{notification.message}</p>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" startContent={<ChannelIcon size={12} />}>
              {channelLabel}
            </Chip>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.read && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="primary"
              onPress={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
            >
              <Check size={16} />
            </Button>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={(e) => {
              e.stopPropagation();
              if (confirm('Delete this notification?')) {
                onDelete(notification._id);
              }
            }}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

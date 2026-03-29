import { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import {
  Card,
  CardBody,
  Button,
  Chip,
  ScrollShadow,
  Tabs,
  Tab,
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
  Bus,
  Briefcase,
  ClipboardList,
  Star,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../../../services/api';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../../../utils/dateFormatter';

const NOTIFICATION_ICONS = {
  // Matches backend Notification.type enum values
  payment: { icon: DollarSign, color: 'warning' },
  fee: { icon: DollarSign, color: 'warning' }, // alias
  attendance: { icon: Users, color: 'danger' },
  academic: { icon: BookOpen, color: 'secondary' },
  exam: { icon: BookOpen, color: 'secondary' }, // alias
  event: { icon: Calendar, color: 'success' },
  reminder: { icon: Calendar, color: 'success' }, // alias
  emergency: { icon: AlertCircle, color: 'danger' },
  alert: { icon: AlertCircle, color: 'danger' }, // alias
  transport: { icon: Bus, color: 'primary' },
  salary: { icon: Wallet, color: 'warning' },
  work: { icon: Briefcase, color: 'default' },
  chat: { icon: MessageSquare, color: 'primary' },
  announcement: { icon: Bell, color: 'primary' },
  remarks: { icon: Star, color: 'secondary' },
  class_teacher: { icon: ClipboardList, color: 'success' },
};

const CHANNEL_ICONS = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  whatsapp: { icon: Phone, label: 'WhatsApp' },
  in_app: { icon: Bell, label: 'In-App' },
};

export default function NotificationCenter({ onClose, isPopover = false }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getAll();
      const list = Array.isArray(data) ? data : (data?.notifications || data?.data || []);
      setNotifications(isPopover ? list.slice(0, 5) : list);
    } catch (error) {
      logger.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      logger.error('Error marking as read:', error);
      toast.error(t('toast.error.failedToMarkAsRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      toast.success(t('toast.success.allNotificationsMarkedAsRead'));
    } catch (error) {
      logger.error('Error marking all as read:', error);
      toast.error(t('toast.error.failedToMarkAllAsRead'));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success(t('toast.success.notificationDeleted'));
    } catch (error) {
      logger.error('Error deleting notification:', error);
      toast.error(t('toast.error.failedToDeleteNotification'));
    }
  };

  const handleClearAll = async () => {
    if (!confirm(t('confirm.deleteAllNotifications'))) return;

    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      toast.success(t('toast.success.allNotificationsCleared'));
    } catch (error) {
      logger.error('Error clearing notifications:', error);
      toast.error(t('toast.error.failedToClearNotifications'));
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
    return formatShortDate(date);
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
                <p className="text-default-400 font-medium">{t('pages.noNotifications')}</p>
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
                      <p className="text-xs font-semibold text-default-500 uppercase">{t('pages.today1')}</p>
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
                      <p className="text-xs font-semibold text-default-500 uppercase">{t('pages.yesterday')}</p>
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
                      <p className="text-xs font-semibold text-default-500 uppercase">{t('pages.older')}</p>
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
  // Derive delivery channel from the channels array (notification.channel doesn't exist in schema)
  const primaryChannel = notification.channels?.[0]?.type || 'in_app';
  const channelKey = primaryChannel === 'inapp' ? 'in_app' : primaryChannel;
  const ChannelIcon = CHANNEL_ICONS[channelKey]?.icon || Bell;
  const channelLabel = CHANNEL_ICONS[channelKey]?.label || primaryChannel;

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
              if (confirm(t('confirm.deleteNotification'))) {
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

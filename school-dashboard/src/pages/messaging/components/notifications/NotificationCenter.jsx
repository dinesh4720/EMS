import { useState, useEffect } from 'react';
import logger from '../../../../utils/logger';
import socketServiceEnhanced from '../../../../services/socketServiceEnhanced';
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
import {
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  MinimalButton,
  MinimalTabs,
  Skeleton,
} from '../../../../components/ui';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';
import { cn } from '../../../../utils/cn';

const ICON_COLOR_STYLES = {
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  success: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  primary: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  secondary: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const NOTIFICATION_ICONS = {
  payment: { icon: DollarSign, color: 'warning' },
  fee: { icon: DollarSign, color: 'warning' },
  attendance: { icon: Users, color: 'danger' },
  academic: { icon: BookOpen, color: 'secondary' },
  exam: { icon: BookOpen, color: 'secondary' },
  event: { icon: Calendar, color: 'success' },
  reminder: { icon: Calendar, color: 'success' },
  emergency: { icon: AlertCircle, color: 'danger' },
  alert: { icon: AlertCircle, color: 'danger' },
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

function isUnread(notification) {
  // Schema field is `isRead`; some legacy payloads use `read`. Treat unread when both falsy.
  return !(notification.isRead || notification.read);
}

export default function NotificationCenter({ onUnreadCountChange, isPopover = false }) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await notificationsApi.getAll();
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data?.notifications || data?.data || []);
        setNotifications(isPopover ? list.slice(0, 5) : list);
      } catch (err) {
        if (!isMounted) return;
        logger.error('Error loading notifications:', err);
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    const handleNewNotification = (data) => {
      if (!isMounted) return;
      setNotifications((prev) => {
        const newNotif = { ...data, isRead: false };
        const updated = [newNotif, ...prev];
        return isPopover ? updated.slice(0, 5) : updated;
      });
    };

    socketServiceEnhanced.on('notification:new', handleNewNotification);

    return () => {
      isMounted = false;
      socketServiceEnhanced.off('notification:new', handleNewNotification);
    };
  }, [isPopover, reloadKey]);

  useEffect(() => {
    if (!loading && onUnreadCountChange) {
      onUnreadCountChange(notifications.filter(isUnread).length);
    }
  }, [notifications, loading, onUnreadCountChange]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true, read: true } : n)),
      );
    } catch (err) {
      logger.error('Error marking as read:', err);
      toast.error(t('toast.error.failedToMarkAsRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      toast.success(t('toast.success.allNotificationsMarkedAsRead'));
    } catch (err) {
      logger.error('Error marking all as read:', err);
      toast.error(t('toast.error.failedToMarkAllAsRead'));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      toast.success(t('toast.success.notificationDeleted'));
    } catch (err) {
      logger.error('Error deleting notification:', err);
      toast.error(t('toast.error.failedToDeleteNotification'));
    }
  };

  const handleClearAll = () => {
    showConfirm({
      title: 'Delete All Notifications',
      message: t('confirm.deleteAllNotifications'),
      variant: 'danger',
      confirmText: 'Delete All',
      onConfirm: async () => {
        try {
          await notificationsApi.clearAll();
          setNotifications([]);
          toast.success(t('toast.success.allNotificationsCleared'));
        } catch (err) {
          logger.error('Error clearing notifications:', err);
          toast.error(t('toast.error.failedToClearNotifications'));
        }
      },
    });
  };

  const groupNotificationsByDate = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const groups = { today: [], yesterday: [], older: [] };
    notifs.forEach((notification) => {
      const date = new Date(notification.createdAt);
      if (date >= today) groups.today.push(notification);
      else if (date >= yesterday) groups.yesterday.push(notification);
      else groups.older.push(notification);
    });
    return groups;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return isUnread(n);
    if (filter === 'read') return !isUnread(n);
    return true;
  });

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const unreadCount = notifications.filter(isUnread).length;

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

  const tabs = [
    { key: 'all', title: `All (${notifications.length})` },
    { key: 'unread', title: `Unread (${unreadCount})` },
    { key: 'read', title: `Read (${notifications.length - unreadCount})` },
  ];

  return (
    <>
      <div className={isPopover ? 'w-full' : 'w-full max-w-2xl mx-auto'}>
        {/* Header */}
        <div
          className={cn(
            'flex justify-between items-center gap-2',
            isPopover
              ? 'p-3 border-b border-divider'
              : 'mb-4',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bell
              size={isPopover ? 18 : 22}
              className="text-fg-muted shrink-0"
            />
            <h2
              className={cn(
                'font-semibold text-fg truncate',
                isPopover ? 'text-base' : 'text-lg',
              )}
            >
              Notifications
            </h2>
            {unreadCount > 0 && !isPopover && (
              <Chip size="sm" color="danger">
                {unreadCount} new
              </Chip>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <MinimalButton
                size="sm"
                variant="secondary"
                icon={<CheckCircle size={14} />}
                onClick={handleMarkAllAsRead}
                loading={markingAll}
              >
                {isPopover ? '' : 'Mark all read'}
              </MinimalButton>
            )}
            {notifications.length > 0 && !isPopover && (
              <MinimalButton
                size="sm"
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={handleClearAll}
              >
                Clear all
              </MinimalButton>
            )}
          </div>
        </div>

        {/* Filter Tabs - hidden in popover */}
        {!isPopover && (
          <MinimalTabs
            tabs={tabs}
            activeKey={filter}
            onChange={setFilter}
            variant="underline"
            size="sm"
            className="mb-4"
          />
        )}

        {/* List */}
        <div
          className={cn(
            'rounded-lg border border-divider bg-surface overflow-hidden',
            isPopover ? 'max-h-[400px] overflow-y-auto' : 'max-h-[600px] overflow-y-auto',
          )}
        >
          {loading ? (
            <div className="p-3 space-y-2">
              <Skeleton.Row />
              <Skeleton.Row />
              <Skeleton.Row />
            </div>
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => setReloadKey((prev) => prev + 1)}
            />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t('pages.noNotifications')}
              description={
                filter === 'unread' ? 'No unread notifications' : "You're all caught up!"
              }
            />
          ) : (
            <div className="divide-y divide-divider">
              {groupedNotifications.today.length > 0 && (
                <NotificationGroup
                  label={t('pages.today1')}
                  items={groupedNotifications.today}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  formatTime={formatTime}
                  showConfirm={showConfirm}
                />
              )}
              {groupedNotifications.yesterday.length > 0 && (
                <NotificationGroup
                  label={t('pages.yesterday')}
                  items={groupedNotifications.yesterday}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  formatTime={formatTime}
                  showConfirm={showConfirm}
                />
              )}
              {groupedNotifications.older.length > 0 && (
                <NotificationGroup
                  label={t('pages.older')}
                  items={groupedNotifications.older}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  formatTime={formatTime}
                  showConfirm={showConfirm}
                />
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
}

function NotificationGroup({ label, items, onMarkAsRead, onDelete, formatTime, showConfirm }) {
  return (
    <>
      <div className="px-4 py-2 bg-surface-2">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
          {label}
        </p>
      </div>
      {items.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          formatTime={formatTime}
          showConfirm={showConfirm}
        />
      ))}
    </>
  );
}

function NotificationItem({ notification, onMarkAsRead, onDelete, formatTime, showConfirm }) {
  const meta = NOTIFICATION_ICONS[notification.type] || { icon: Bell, color: 'default' };
  const IconComponent = meta.icon;
  const iconClasses = ICON_COLOR_STYLES[meta.color] || ICON_COLOR_STYLES.default;

  const primaryChannel = notification.channels?.[0]?.type || 'in_app';
  const channelKey = primaryChannel === 'inapp' ? 'in_app' : primaryChannel;
  const ChannelIcon = CHANNEL_ICONS[channelKey]?.icon || Bell;
  const channelLabel = CHANNEL_ICONS[channelKey]?.label || primaryChannel;
  const unread = isUnread(notification);

  const handleClick = () => {
    if (unread) onMarkAsRead(notification._id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role={unread ? 'button' : undefined}
      tabIndex={unread ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={unread ? handleKeyDown : undefined}
      className={cn(
        'relative p-4 transition-colors',
        unread
          ? 'bg-info-bg/40 cursor-pointer hover:bg-info-bg'
          : 'hover:bg-surface-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            iconClasses,
          )}
        >
          <IconComponent size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                'font-semibold text-sm',
                unread ? 'text-fg' : 'text-fg-muted',
              )}
            >
              {notification.title}
              {unread && (
                <Chip size="sm" color="info" className="ml-2 align-middle">
                  New
                </Chip>
              )}
            </h4>
            <p className="text-xs text-fg-faint shrink-0">
              {formatTime(notification.createdAt)}
            </p>
          </div>
          <p className="text-sm text-fg-muted mb-2">{notification.message}</p>
          <Chip size="sm" startContent={<ChannelIcon size={12} aria-hidden="true" />}>
            {channelLabel}
          </Chip>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {unread && (
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Mark as read"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
            >
              <Check size={16} />
            </IconButton>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Delete notification"
            onClick={(e) => {
              e.stopPropagation();
              showConfirm({
                title: 'Delete Notification',
                message: 'Are you sure you want to delete this notification?',
                variant: 'danger',
                confirmText: 'Delete',
                onConfirm: async () => {
                  onDelete(notification._id);
                },
              });
            }}
          >
            <X size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

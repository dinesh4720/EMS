import { memo, useState } from "react";
import PropTypes from "prop-types";
import { Bell } from "lucide-react";
import Popover from "../ui/Popover";
import { useLiveNotifications } from "../../hooks/useLiveNotifications";
import NotificationCenter from "../../pages/messaging/components/notifications/NotificationCenter";
import { cn } from "../../utils/cn";

/**
 * NotificationBell — top-bar notification trigger with live unread indicator.
 *
 * Wraps the notifications popover (NotificationCenter) behind a design-system
 * IconButton trigger. The unread dot hides when the panel is open so live
 * updates don't flicker the indicator mid-read.
 */
const NotificationBell = memo(function NotificationBell({ className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useLiveNotifications({
    onCountChange: setUnreadCount,
    paused: isOpen,
  });

  const ariaLabel =
    unreadCount > 0
      ? `${unreadCount} unread notifications`
      : "Notifications";

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      offset={8}
      shouldBlockScroll={false}
      contentClassName="p-0 w-[380px]"
      trigger={
        <button
          type="button"
          data-tour="notifications"
          aria-label={ariaLabel}
          className={cn(
            "relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors",
            "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            "dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
            className
          )}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-900 dark:bg-zinc-100 rounded-full"
            />
          )}
        </button>
      }
    >
      {isOpen && (
        <NotificationCenter
          onClose={() => setIsOpen(false)}
          onUnreadCountChange={setUnreadCount}
          isPopover
        />
      )}
    </Popover>
  );
});

NotificationBell.displayName = "NotificationBell";

NotificationBell.propTypes = {
  className: PropTypes.string,
};

export default NotificationBell;

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
      contentClassName="p-0 w-[calc(100vw-2rem)] sm:w-[380px]"
      trigger={
        <button
          type="button"
          data-tour="notifications"
          aria-label={ariaLabel}
          className={cn("iconbtn", className)}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span aria-hidden="true" className="topbar__bell-chip">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
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

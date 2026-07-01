import { Megaphone } from "lucide-react";
import { formatRelativeTime } from "../../../utils/dateFormatter";
import EmptyState from "../../../components/ui/EmptyState";

/**
 * LatestNotice — single most-recent announcement, prominent.
 * Clickable to /messaging for the full list.
 */
export default function LatestNotice({ notice, onOpen }) {
  if (!notice) {
    return (
      <div className="notice-panel notice-panel--empty">
        <EmptyState icon={Megaphone} message="No recent notices" />
      </div>
    );
  }
  return (
    <button type="button" className="notice-panel" onClick={onOpen}>
      <div className="notice-panel__head">
        <Megaphone size={13} className="notice-panel__icon" />
        <span className="notice-panel__label">Latest notice</span>
        <span className="notice-panel__time">
          {formatRelativeTime(notice.date)}
        </span>
      </div>
      <div className="notice-panel__title">{notice.title}</div>
      {notice.content && (
        <div className="notice-panel__body">
          {notice.content.length > 110
            ? `${notice.content.slice(0, 110)}…`
            : notice.content}
        </div>
      )}
    </button>
  );
}

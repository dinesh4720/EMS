import { IndianRupee, Check, Megaphone, UserCheck } from "lucide-react";
import { formatRelativeTime } from "../../../utils/dateFormatter";
import { compactINR } from "../formatters";

const KIND = {
  payment: {
    icon: IndianRupee,
    iconClass: "feed-row__icon--ok",
    render: (event) => ({
      title: `${compactINR(event.amount)} received`,
      sub: `${event.student}${event.className ? ` · ${event.className}` : ""}`,
    }),
  },
  attendance: {
    icon: Check,
    iconClass: "feed-row__icon--accent",
    render: (event) => ({
      title: event.title || "Attendance marked",
      sub: event.sub || event.className || "",
    }),
  },
  announcement: {
    icon: Megaphone,
    iconClass: "feed-row__icon--info",
    render: (event) => ({
      title: event.title || "New announcement",
      sub: event.body || "",
    }),
  },
  default: {
    icon: UserCheck,
    iconClass: "feed-row__icon--muted",
    render: (event) => ({
      title: event.title || "Activity",
      sub: event.sub || "",
    }),
  },
};

/**
 * FeedRow — single line in the recent activity timeline.
 * Unified shape: icon + title + sub + relative time.
 */
export default function FeedRow({ event }) {
  const config = KIND[event.kind] || KIND.default;
  const Icon = config.icon;
  const { title, sub } = config.render(event);

  return (
    <div className="feed-row">
      <div className={`feed-row__icon ${config.iconClass}`}>
        <Icon size={13} strokeWidth={2.2} />
      </div>
      <div className="feed-row__body">
        <div className="feed-row__title">{title}</div>
        {sub && <div className="feed-row__sub">{sub}</div>}
      </div>
      <div className="feed-row__time">
        {formatRelativeTime(event.date || event.time)}
      </div>
    </div>
  );
}

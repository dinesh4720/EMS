import { formatRelativeTime } from "../../../utils/dateFormatter";

export default function NoticeRow({ title, content, date }) {
  return (
    <div className="notice-row">
      <div className="notice-row__dot" />
      <div className="notice-row__content">
        <div className="notice-row__title">{title}</div>
        {content && (
          <div className="notice-row__body">
            {content.length > 80 ? `${content.slice(0, 80)}…` : content}
          </div>
        )}
        <div className="notice-row__date">{formatRelativeTime(date)}</div>
      </div>
    </div>
  );
}

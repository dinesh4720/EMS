import { memo } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";
import Avatar from "./Avatar";

const ICON_TONE = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
};

function FeedSkeleton({ rows = 4 }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-zinc-800" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, idx) => (
        <li key={idx} className="flex items-start gap-3 py-3">
          <Skeleton variant="circle" className="h-8 w-8 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton variant="text" className="h-3 w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FeedItem({ item }) {
  const navigate = useNavigate();
  const { icon: Icon, tone = "neutral", actor, title, description, time, href, onClick } = item;
  const interactive = !!(href || onClick);

  const handleClick = () => {
    if (onClick) return onClick(item);
    if (href) navigate(href);
  };

  const content = (
    <div className="flex items-start gap-3 py-3">
      {actor ? (
        <Avatar
          name={actor.name}
          src={actor.avatar}
          size="sm"
          className="shrink-0"
        />
      ) : Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            ICON_TONE[tone] ?? ICON_TONE.neutral
          )}
        >
          <Icon size={14} strokeWidth={2} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 dark:text-zinc-100">
          {actor?.name ? (
            <span className="font-medium">{actor.name} </span>
          ) : null}
          <span className="text-gray-600 dark:text-zinc-400">{title}</span>
        </p>
        {description ? (
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
            {description}
          </p>
        ) : null}
      </div>
      {time ? (
        <time className="shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">
          {time}
        </time>
      ) : null}
    </div>
  );

  if (interactive) {
    return (
      <li>
        <button
          type="button"
          onClick={handleClick}
          className="w-full text-left px-2 -mx-2 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
        >
          {content}
        </button>
      </li>
    );
  }

  return <li>{content}</li>;
}

FeedItem.propTypes = {
  item: PropTypes.object.isRequired,
};

function ActivityFeed({
  items,
  isLoading = false,
  skeletonRows = 4,
  emptyTitle = "No activity yet",
  emptyDescription,
  footer,
  className,
  ...props
}) {
  if (isLoading) {
    return (
      <div className={cn("", className)} {...props}>
        <FeedSkeleton rows={skeletonRows} />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} size="sm" />;
  }

  return (
    <div className={className} {...props}>
      <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
        {items.map((item, idx) => (
          <FeedItem key={item.id ?? idx} item={item} />
        ))}
      </ul>
      {footer ? (
        <div className="pt-3 mt-1 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

ActivityFeed.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      actor: PropTypes.shape({
        name: PropTypes.string,
        avatar: PropTypes.string,
      }),
      icon: PropTypes.elementType,
      tone: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
      title: PropTypes.node,
      description: PropTypes.node,
      time: PropTypes.node,
      href: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
  isLoading: PropTypes.bool,
  skeletonRows: PropTypes.number,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  footer: PropTypes.node,
  className: PropTypes.string,
};

export default memo(ActivityFeed);

import { memo } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";

const DOT_TONE = {
  neutral: "bg-gray-300 dark:bg-zinc-600 ring-white dark:ring-zinc-900",
  primary: "bg-blue-500 ring-white dark:ring-zinc-900",
  success: "bg-green-500 ring-white dark:ring-zinc-900",
  warning: "bg-amber-500 ring-white dark:ring-zinc-900",
  danger: "bg-red-500 ring-white dark:ring-zinc-900",
  info: "bg-blue-500 ring-white dark:ring-zinc-900",
};

const ICON_TONE = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
};

function TimelineSkeleton({ rows = 3 }) {
  return (
    <ol className="relative space-y-6" aria-busy="true" aria-live="polite">
      <span
        aria-hidden="true"
        className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100 dark:bg-zinc-800"
      />
      {Array.from({ length: rows }).map((_, idx) => (
        <li key={idx} className="relative pl-9">
          <Skeleton variant="circle" className="absolute left-0 top-0.5 h-6 w-6" />
          <Skeleton variant="text" className="h-3 w-2/5 mb-2" />
          <Skeleton variant="text" className="h-3 w-4/5" />
        </li>
      ))}
    </ol>
  );
}

function TimelineItem({ item, isLast }) {
  const { icon: Icon, tone = "neutral", title, description, time, meta, content } = item;
  return (
    <li className="relative pl-9">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-[11px] top-6 -bottom-4 w-px bg-gray-100 dark:bg-zinc-800"
        />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4",
          Icon ? (ICON_TONE[tone] ?? ICON_TONE.neutral) : null,
          Icon ? "ring-white dark:ring-zinc-900" : null
        )}
      >
        {Icon ? (
          <Icon size={12} strokeWidth={2.25} />
        ) : (
          <span className={cn("h-2.5 w-2.5 rounded-full ring-4", DOT_TONE[tone] ?? DOT_TONE.neutral)} />
        )}
      </span>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {title ? (
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{title}</p>
          ) : null}
          {description ? (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{description}</p>
          ) : null}
          {content ? <div className="mt-2">{content}</div> : null}
          {meta ? (
            <div className="mt-1.5 text-xs text-gray-500 dark:text-zinc-400">{meta}</div>
          ) : null}
        </div>
        {time ? (
          <time className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">{time}</time>
        ) : null}
      </div>
    </li>
  );
}

TimelineItem.propTypes = {
  item: PropTypes.object.isRequired,
  isLast: PropTypes.bool,
};

function Timeline({
  items,
  isLoading = false,
  skeletonRows = 3,
  emptyTitle = "No activity yet",
  emptyDescription,
  className,
  ...props
}) {
  if (isLoading) {
    return (
      <div className={cn("relative", className)} {...props}>
        <TimelineSkeleton rows={skeletonRows} />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} size="sm" />;
  }

  return (
    <ol className={cn("relative space-y-6", className)} {...props}>
      {items.map((item, idx) => (
        <TimelineItem
          key={item.id ?? idx}
          item={item}
          isLast={idx === items.length - 1}
        />
      ))}
    </ol>
  );
}

Timeline.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.node,
      description: PropTypes.node,
      time: PropTypes.node,
      meta: PropTypes.node,
      content: PropTypes.node,
      icon: PropTypes.elementType,
      tone: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
    })
  ),
  isLoading: PropTypes.bool,
  skeletonRows: PropTypes.number,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  className: PropTypes.string,
};

export default memo(Timeline);

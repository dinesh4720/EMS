import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";

import { cn } from "../../utils/cn";
import {
  formatRelativeTime,
  formatDateTime,
  formatShortDate,
} from "../../utils/dateFormatter";
import { getDateLocale } from "../../i18n/index";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";

const ICON_TONE = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
};

const DOT_TONE = {
  neutral: "bg-gray-300 dark:bg-zinc-600",
  primary: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(timestamp) {
  const todayStart = startOfDay(new Date());
  const dayStart = startOfDay(timestamp);
  const diffDays = Math.round((todayStart - dayStart) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  try {
    return new Intl.DateTimeFormat(getDateLocale(), {
      weekday: "long",
      day: "numeric",
      month: "short",
      year:
        new Date(timestamp).getFullYear() === new Date().getFullYear()
          ? undefined
          : "numeric",
    }).format(new Date(timestamp));
  } catch {
    return formatShortDate(timestamp);
  }
}

function dedupeByKey(events, keyFn) {
  const seen = new Set();
  const out = [];
  for (const ev of events) {
    const key = keyFn(ev);
    if (key == null) {
      out.push(ev);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}

function groupByDay(events) {
  const buckets = new Map();
  for (const ev of events) {
    const ts = ev.timestamp ? new Date(ev.timestamp).getTime() : NaN;
    if (Number.isNaN(ts)) continue;
    const key = startOfDay(ts);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(ev);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([key, items]) => ({
      key,
      label: dayLabel(key),
      items: items.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      }),
    }));
}

function ActivityFeedSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton variant="text" className="h-3 w-24" />
      <ol className="relative space-y-5 pl-9">
        <span
          aria-hidden="true"
          className="absolute left-[11px] top-2 bottom-2 w-px bg-surface-2"
        />
        {Array.from({ length: rows }).map((_, idx) => (
          <li key={`activity-skeleton-${idx}`} className="relative">
            <Skeleton
              variant="circle"
              className="absolute -left-9 top-0.5 h-6 w-6"
            />
            <Skeleton variant="text" className="h-3 w-1/3 mb-2" />
            <Skeleton variant="text" className="h-3 w-3/4" />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ActivityItem({ event, defaultExpanded }) {
  const {
    icon: Icon,
    tone = "neutral",
    title,
    description,
    actor,
    timestamp,
    content,
    meta,
  } = event;

  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));
  const expandable = Boolean(content);

  const relative = useMemo(
    () => (timestamp ? formatRelativeTime(timestamp, "") : ""),
    [timestamp]
  );
  const absolute = useMemo(
    () => (timestamp ? formatDateTime(timestamp, "") : ""),
    [timestamp]
  );

  const handleToggle = useCallback(() => {
    if (!expandable) return;
    setExpanded((v) => !v);
  }, [expandable]);

  const handleKey = useCallback(
    (e) => {
      if (!expandable) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setExpanded((v) => !v);
      }
    },
    [expandable]
  );

  return (
    <li className="relative pl-9">
      <span
        aria-hidden="true"
        className="absolute left-[11px] top-6 -bottom-3 w-px bg-surface-2"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900",
          Icon ? ICON_TONE[tone] ?? ICON_TONE.neutral : null
        )}
      >
        {Icon ? (
          <Icon size={12} strokeWidth={2.25} />
        ) : (
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              DOT_TONE[tone] ?? DOT_TONE.neutral
            )}
          />
        )}
      </span>

      <div
        className={cn(
          "rounded-md",
          expandable
            ? "cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-faint -mx-1.5 px-1.5 py-1"
            : null
        )}
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? expanded : undefined}
        onClick={handleToggle}
        onKeyDown={handleKey}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <p className="text-sm font-medium text-fg break-words">{title}</p>
            ) : null}
            {description ? (
              <p className="text-xs text-fg-muted mt-0.5 break-words">
                {description}
              </p>
            ) : null}
            {actor ? (
              <p className="text-[11px] text-fg-faint mt-1">{actor}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {timestamp ? (
              <time
                dateTime={new Date(timestamp).toISOString()}
                title={absolute}
                className="mono tnum text-[11px] text-fg-faint"
              >
                {relative}
              </time>
            ) : null}
            {expandable ? (
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cn(
                  "text-fg-faint transition-transform",
                  expanded ? "rotate-180" : null
                )}
              />
            ) : null}
          </div>
        </div>

        {expandable && expanded ? (
          <div className="mt-2 text-xs text-fg-muted">{content}</div>
        ) : null}

        {meta ? (
          <div className="mt-1.5 text-[11px] text-fg-faint">{meta}</div>
        ) : null}
      </div>
    </li>
  );
}

ActivityItem.propTypes = {
  event: PropTypes.object.isRequired,
  defaultExpanded: PropTypes.bool,
};

function ActivityFeed({
  events,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  skeletonRows = 4,
  emptyTitle = "No activity yet",
  emptyDescription,
  errorState,
  groupByDay: shouldGroup = true,
  getKey,
  className,
  ...props
}) {
  const sentinelRef = useRef(null);
  const requestedRef = useRef(false);

  const safeEvents = useMemo(() => {
    const arr = Array.isArray(events) ? events : [];
    const keyFn = getKey || ((e, i) => e?.id ?? e?._id ?? i);
    return dedupeByKey(arr, keyFn);
  }, [events, getKey]);

  const groups = useMemo(
    () => (shouldGroup ? groupByDay(safeEvents) : null),
    [safeEvents, shouldGroup]
  );

  useEffect(() => {
    if (!onLoadMore || !hasMore) return undefined;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (requestedRef.current || isLoadingMore) return;
        requestedRef.current = true;
        onLoadMore();
      },
      { rootMargin: "120px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    if (!isLoadingMore) requestedRef.current = false;
  }, [isLoadingMore, safeEvents.length]);

  if (errorState) {
    return <div className={cn("", className)}>{errorState}</div>;
  }

  if (isLoading) {
    return (
      <div className={cn(className)} {...props}>
        <ActivityFeedSkeleton rows={skeletonRows} />
      </div>
    );
  }

  if (!safeEvents.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        size="sm"
      />
    );
  }

  if (shouldGroup) {
    return (
      <div className={cn("space-y-6", className)} {...props}>
        {groups.map((group) => (
          <section key={group.key} aria-label={group.label}>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
              {group.label}
            </h4>
            <ol className="relative space-y-5">
              {group.items.map((event, idx) => (
                <ActivityItem
                  key={event.id ?? event._id ?? `${group.key}-event-${idx}`}
                  event={event}
                />
              ))}
            </ol>
          </section>
        ))}
        {hasMore ? (
          <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />
        ) : null}
        {isLoadingMore ? <ActivityFeedSkeleton rows={2} /> : null}
      </div>
    );
  }

  return (
    <div className={cn(className)} {...props}>
      <ol className="relative space-y-5">
        {safeEvents.map((event, idx) => (
          <ActivityItem
            key={event.id ?? event._id ?? `event-${idx}`}
            event={event}
          />
        ))}
      </ol>
      {hasMore ? (
        <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />
      ) : null}
      {isLoadingMore ? <ActivityFeedSkeleton rows={2} /> : null}
    </div>
  );
}

ActivityFeed.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      timestamp: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date),
      ]),
      title: PropTypes.node,
      description: PropTypes.node,
      actor: PropTypes.node,
      content: PropTypes.node,
      meta: PropTypes.node,
      icon: PropTypes.elementType,
      tone: PropTypes.oneOf([
        "neutral",
        "primary",
        "success",
        "warning",
        "danger",
        "info",
      ]),
    })
  ),
  isLoading: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  skeletonRows: PropTypes.number,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  errorState: PropTypes.node,
  groupByDay: PropTypes.bool,
  getKey: PropTypes.func,
  className: PropTypes.string,
};

export default memo(ActivityFeed);

import { memo } from "react";
import { cn } from "../../utils/cn";

/**
 * Skeleton — the single source of truth for every loading placeholder.
 *
 * Design notes (why this file is the only skeleton implementation):
 *  - Calm by default. Every bone uses the shared `.animate-shimmer` sweep
 *    defined in index.css — slow and low-contrast, so a page full of them reads
 *    as quiet, not flickering.
 *  - No jitter. Line widths come from a fixed pattern (`lineWidth`), never
 *    `Math.random()`, so bones don't twitch to new widths on every re-render.
 *  - No overflow. Tables/forms are built to shrink to their container, never
 *    push past it — fixed column widths are treated as a hint that can shrink,
 *    not a hard minimum.
 *
 * Exports: Skeleton (default, with .Text/.Row/.Card/.Table/.List/.Form statics),
 * plus named Bone, SkeletonText, SkeletonRow, SkeletonCard, SkeletonTable,
 * SkeletonList, SkeletonForm.
 */

const VARIANT = {
  text: "rounded",
  circle: "rounded-full",
  rect: "rounded-md",
};

const Skeleton = memo(function Skeleton({
  variant = "text",
  width,
  height,
  className,
  style,
  ...props
}) {
  const resolvedStyle = {
    ...(width ? { width } : null),
    ...(height ? { height } : null),
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-shimmer",
        VARIANT[variant],
        !width && variant === "text" && "w-full",
        !height && variant === "text" && "h-3",
        !height && variant === "rect" && "h-20",
        !width && variant === "circle" && "w-10",
        !height && variant === "circle" && "h-10",
        className,
      )}
      style={Object.keys(resolvedStyle).length ? resolvedStyle : undefined}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

/** Bone — a bare shimmer block. Size it with className (h-/w-) or `style`. */
const Bone = memo(function Bone({ className = "", style }) {
  return (
    <div aria-hidden="true" className={cn("animate-shimmer rounded", className)} style={style} />
  );
});
Bone.displayName = "Bone";

/**
 * Deterministic line widths — varied enough to look like real text, but fixed
 * per index so a bone never changes width between renders (the old random
 * widths were the cause of the "twitching / glitched" look).
 */
const LINE_WIDTHS = ["100%", "82%", "91%", "74%", "95%", "68%"];
const lineWidth = (i) => LINE_WIDTHS[i % LINE_WIDTHS.length];

function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`skeleton-text-line-${i}`}
          variant="text"
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

function SkeletonRow({ showAvatar = true, className }) {
  return (
    <div className={cn("flex items-center gap-3 py-2", className)} aria-busy="true">
      {showAvatar && <Skeleton variant="circle" className="h-9 w-9 shrink-0" />}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton variant="text" className="h-3 w-1/3" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
      <Skeleton variant="rect" className="h-6 w-16 shrink-0" />
    </div>
  );
}

/**
 * SkeletonCard — card placeholder with an optional header and N body lines.
 * `<SkeletonCard />` alone renders a sensible default; props let pages tune it.
 */
function SkeletonCard({
  hasHeader = true,
  headerHeight = "h-6",
  bodyLines = 3,
  bodyLineHeight = "h-4",
  className,
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
      className={cn(
        "bg-surface rounded-lg border border-divider overflow-hidden",
        className,
      )}
    >
      {hasHeader && (
        <div className="px-4 py-3 border-b border-divider">
          <Bone className={cn(headerHeight, "w-1/3")} />
        </div>
      )}
      <div className="p-4 space-y-3">
        {Array.from({ length: bodyLines }).map((_, i) => (
          <Bone key={`skeleton-card-line-${i}`} className={bodyLineHeight} style={{ width: lineWidth(i) }} />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTable — table placeholder.
 *
 * `columns` may be a number (N equal columns) or an array of
 * `{ key?, label?, width? }`. Crucially, a column `width` is treated as a
 * *flex basis that is allowed to shrink* (`flex: 0 1 <width>` + `min-w-0`), not
 * a hard minimum — so even a wide column set collapses to fit the card instead
 * of overflowing it on narrow screens.
 */
function SkeletonTable({ rows = 5, columns = 4, className }) {
  const cols = Array.isArray(columns)
    ? columns
    : Array.from({ length: columns }, () => null);

  const cellClass = (col) => cn("min-w-0", !col?.width && "flex-1");
  const cellStyle = (col) => {
    if (!col?.width) return undefined;
    const basis = typeof col.width === "number" ? `${col.width}px` : col.width;
    return { flex: `0 1 ${basis}`, minWidth: 0 };
  };

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading table"
      className={cn(
        "bg-surface rounded-lg border border-divider overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3 border-b border-divider bg-surface-2">
        {cols.map((col, i) => (
          <div key={`skeleton-th-${i}`} className={cellClass(col)} style={cellStyle(col)}>
            <Bone
              className="h-3"
              style={
                col?.label
                  ? { width: `${Math.min(col.label.length * 8, 120)}px`, maxWidth: "100%" }
                  : undefined
              }
            />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`skeleton-row-${r}`}
          className="flex items-center gap-4 px-4 py-3 border-b border-divider last:border-0"
        >
          {cols.map((col, c) => (
            <div key={`skeleton-cell-${r}-${c}`} className={cellClass(col)} style={cellStyle(col)}>
              <Bone className="h-3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** SkeletonList — vertical list of avatar + two-line rows in their own cards. */
function SkeletonList({
  items = 5,
  avatar = true,
  title = true,
  subtitle = true,
  className,
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading list"
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={`skeleton-list-item-${i}`}
          className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-divider"
        >
          {avatar && <Bone className="w-10 h-10 rounded-full shrink-0" />}
          <div className="flex-1 min-w-0 space-y-2">
            {title && <Bone className="h-4 w-1/3" />}
            {subtitle && <Bone className="h-3 w-1/2" />}
          </div>
          <Bone className="w-8 h-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** SkeletonForm — labelled field rows with an optional submit button. */
function SkeletonForm({
  fields = 4,
  showSubmit = true,
  className,
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading form"
      className={cn("space-y-4 min-w-0", className)}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`skeleton-field-${i}`} className="space-y-2">
          <Bone className="h-4 w-1/4" />
          <Bone className="h-10 w-full" />
        </div>
      ))}
      {showSubmit && (
        <div className="pt-4">
          <Bone className="h-10 w-32 max-w-full" />
        </div>
      )}
    </div>
  );
}

Skeleton.Text = SkeletonText;
Skeleton.Row = SkeletonRow;
Skeleton.Card = SkeletonCard;
Skeleton.Table = SkeletonTable;
Skeleton.List = SkeletonList;
Skeleton.Form = SkeletonForm;

export {
  Bone,
  SkeletonText,
  SkeletonRow,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
};
export default Skeleton;

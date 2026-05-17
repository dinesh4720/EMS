import { memo } from "react";
import { cn } from "../../utils/cn";

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

function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
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

function SkeletonList({ rows = 4, className }) {
  return (
    <div className={cn("space-y-1", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

function SkeletonCard({ className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-divider bg-surface p-4 space-y-3",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton variant="rect" className="h-32 w-full" />
      <Skeleton variant="text" className="h-4 w-2/3" />
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-1/2" />
    </div>
  );
}

function SkeletonTable({ rows = 5, columns = 4, className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-divider overflow-hidden",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-4 px-4 py-3 border-b border-divider bg-surface-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4 py-3 border-b border-divider last:border-0"
        >
          {Array.from({ length: columns }).map((_col, colIdx) => (
            <Skeleton key={colIdx} variant="text" className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

Skeleton.Text = SkeletonText;
Skeleton.Row = SkeletonRow;
Skeleton.List = SkeletonList;
Skeleton.Card = SkeletonCard;
Skeleton.Table = SkeletonTable;

export { SkeletonText, SkeletonRow, SkeletonList, SkeletonCard, SkeletonTable };
export default Skeleton;

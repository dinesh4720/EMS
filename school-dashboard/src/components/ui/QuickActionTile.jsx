import { memo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import Badge from "./Badge";

const ICON_TONE = {
  neutral: "bg-surface-2 text-fg",
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
};

const LAYOUT = {
  horizontal: {
    root: "flex items-center gap-3 p-3",
    icon: "h-10 w-10",
    iconSize: 18,
    body: "min-w-0 flex-1",
    labelClass: "text-sm font-medium text-fg truncate",
    descClass: "text-xs text-fg-muted truncate",
  },
  stacked: {
    root: "flex flex-col items-start gap-3 p-4",
    icon: "h-10 w-10",
    iconSize: 20,
    body: "space-y-0.5",
    labelClass: "text-sm font-medium text-fg",
    descClass: "text-xs text-fg-muted",
  },
};

function QuickActionTile({
  label,
  description,
  icon: Icon,
  tone = "neutral",
  href,
  onClick,
  badge,
  layout = "horizontal",
  disabled = false,
  showChevron,
  className,
  ...props
}) {
  const styles = LAYOUT[layout] ?? LAYOUT.horizontal;
  const chevron = showChevron ?? layout === "horizontal";

  const body = (
    <>
      {Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            styles.icon,
            ICON_TONE[tone] ?? ICON_TONE.neutral
          )}
        >
          <Icon size={styles.iconSize} strokeWidth={2} />
        </span>
      ) : null}
      <div className={styles.body}>
        <div className="flex items-center gap-2">
          <span className={styles.labelClass}>{label}</span>
          {badge ? (
            typeof badge === "string" || typeof badge === "number" ? (
              <Badge size="sm" color="neutral">
                {badge}
              </Badge>
            ) : (
              badge
            )
          ) : null}
        </div>
        {description ? <p className={styles.descClass}>{description}</p> : null}
      </div>
      {chevron ? (
        <ChevronRight
          size={16}
          className="shrink-0 text-fg-faint"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  const base = cn(
    "group w-full text-left bg-surface border border-divider rounded-lg transition-colors",
    !disabled &&
      "hover:border-border-token hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
    disabled && "opacity-60 cursor-not-allowed",
    styles.root,
    className
  );

  if (href && !disabled) {
    return (
      <Link to={href} className={base} {...props}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={base}
      {...props}
    >
      {body}
    </button>
  );
}

QuickActionTile.propTypes = {
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf([
    "neutral",
    "primary",
    "success",
    "warning",
    "danger",
    "info",
    "violet",
    "emerald",
  ]),
  href: PropTypes.string,
  onClick: PropTypes.func,
  badge: PropTypes.node,
  layout: PropTypes.oneOf(["horizontal", "stacked"]),
  disabled: PropTypes.bool,
  showChevron: PropTypes.bool,
  className: PropTypes.string,
};

function QuickActionGrid({ columns = 3, gap = "md", className, children, ...props }) {
  const gridCols =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const gapClass = gap === "sm" ? "gap-2" : gap === "lg" ? "gap-4" : "gap-3";
  return (
    <div className={cn("grid", gridCols, gapClass, className)} {...props}>
      {children}
    </div>
  );
}

QuickActionGrid.propTypes = {
  columns: PropTypes.oneOf([2, 3, 4]),
  gap: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  children: PropTypes.node,
};

const Memo = memo(QuickActionTile);
Memo.Grid = QuickActionGrid;

export { QuickActionGrid };
export default Memo;

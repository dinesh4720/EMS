import { memo } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "../../utils/cn";
import Skeleton from "./Skeleton";

const ICON_TONE = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
};

const DELTA_TONE = {
  up: "text-green-700 dark:text-green-400",
  down: "text-red-700 dark:text-red-400",
  flat: "text-gray-500 dark:text-zinc-400",
};

function deltaDirection(delta) {
  if (delta == null) return null;
  if (typeof delta === "object") return delta.direction || (delta.value > 0 ? "up" : delta.value < 0 ? "down" : "flat");
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function KpiTile({
  label,
  value,
  unit,
  caption,
  icon: Icon,
  tone = "neutral",
  delta,
  comparison,
  footer,
  href,
  onClick,
  isLoading = false,
  className,
  ...props
}) {
  const navigate = useNavigate();
  const interactive = !isLoading && (!!href || !!onClick);
  const direction = deltaDirection(delta);
  const deltaLabel = delta != null
    ? typeof delta === "object"
      ? delta.label ?? (delta.value > 0 ? `+${delta.value}` : `${delta.value}`)
      : delta > 0 ? `+${delta}` : `${delta}`
    : null;

  const handleClick = () => {
    if (!interactive) return;
    if (onClick) return onClick();
    if (href) navigate(href);
  };

  const Component = interactive ? "button" : "div";

  return (
    <Component
      type={interactive ? "button" : undefined}
      onClick={interactive ? handleClick : undefined}
      className={cn(
        "group relative w-full text-left bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 transition-colors",
        interactive &&
          "hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            {label}
          </p>
          {isLoading ? (
            <Skeleton variant="text" className="h-8 w-28 mt-1" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-zinc-50 leading-none">
                {value}
              </h3>
              {unit ? (
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                  {unit}
                </span>
              ) : null}
            </div>
          )}
          {!isLoading && caption ? (
            <p className="text-xs text-gray-500 dark:text-zinc-400 pt-1">{caption}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              ICON_TONE[tone] ?? ICON_TONE.neutral
            )}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        ) : null}
      </div>

      {(direction || comparison) && !isLoading ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {direction ? (
            <span className={cn("inline-flex items-center gap-1 font-medium", DELTA_TONE[direction])}>
              {direction === "up" ? (
                <ArrowUpRight size={14} aria-hidden="true" />
              ) : direction === "down" ? (
                <ArrowDownRight size={14} aria-hidden="true" />
              ) : (
                <Minus size={14} aria-hidden="true" />
              )}
              {deltaLabel}
            </span>
          ) : null}
          {comparison ? (
            <span className="text-gray-500 dark:text-zinc-400">{comparison}</span>
          ) : null}
        </div>
      ) : null}

      {footer ? (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400">
          {footer}
        </div>
      ) : null}
    </Component>
  );
}

KpiTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  caption: PropTypes.string,
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf(["neutral", "primary", "success", "warning", "danger", "info"]),
  delta: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      direction: PropTypes.oneOf(["up", "down", "flat"]),
      label: PropTypes.string,
    }),
  ]),
  comparison: PropTypes.node,
  footer: PropTypes.node,
  href: PropTypes.string,
  onClick: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};

export default memo(KpiTile);

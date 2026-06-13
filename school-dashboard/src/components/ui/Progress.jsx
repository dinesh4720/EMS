import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

const TRACK_SIZE = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const COLOR_STYLES = {
  primary: "bg-fg",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

function clampPercent(value, max) {
  if (max <= 0 || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

const LinearProgress = forwardRef(function LinearProgress(
  {
    value = 0,
    max = 100,
    size = "md",
    color = "primary",
    indeterminate = false,
    label,
    showValue = false,
    valueFormat,
    className,
    trackClassName,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const percent = clampPercent(value, max);
  const formattedValue = valueFormat
    ? valueFormat(value, max)
    : `${Math.round(percent)}%`;

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5 text-xs">
          {label && <span className="font-medium text-fg">{label}</span>}
          {showValue && !indeterminate && (
            <span className="text-fg-muted tabular-nums">{formattedValue}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-2",
          TRACK_SIZE[size],
          trackClassName
        )}
      >
        {indeterminate ? (
          <div className={cn("h-full w-1/3 rounded-full animate-progress-indeterminate", COLOR_STYLES[color])} />
        ) : (
          <div
            className={cn("h-full rounded-full transition-[width] duration-300 ease-out", COLOR_STYLES[color])}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
});

LinearProgress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  color: PropTypes.oneOf(["primary", "success", "warning", "danger", "info"]),
  indeterminate: PropTypes.bool,
  label: PropTypes.node,
  showValue: PropTypes.bool,
  valueFormat: PropTypes.func,
  className: PropTypes.string,
  trackClassName: PropTypes.string,
  "aria-label": PropTypes.string,
};

const CIRCULAR_SIZE = {
  sm: { size: 32, stroke: 3, fontSize: "text-[10px]" },
  md: { size: 48, stroke: 4, fontSize: "text-xs" },
  lg: { size: 64, stroke: 5, fontSize: "text-sm" },
};

const CIRCULAR_COLOR = {
  primary: "stroke-fg",
  success: "stroke-green-500",
  warning: "stroke-amber-500",
  danger: "stroke-red-500",
  info: "stroke-blue-500",
};

function CircularProgress({
  value = 0,
  max = 100,
  size = "md",
  color = "primary",
  indeterminate = false,
  showValue = false,
  className,
  label,
  ...props
}) {
  const { size: dimension, stroke, fontSize } = CIRCULAR_SIZE[size];
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = clampPercent(value, max);
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
      aria-label={typeof label === "string" ? label : undefined}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: dimension, height: dimension }}
      {...props}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className={cn(indeterminate && "animate-spin")}
        aria-hidden="true"
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          className="stroke-divider"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={CIRCULAR_COLOR[color]}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
          style={{
            transition: indeterminate ? undefined : "stroke-dashoffset 300ms ease-out",
          }}
        />
      </svg>
      {showValue && !indeterminate && (
        <span className={cn("absolute font-medium text-fg tabular-nums", fontSize)}>
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

CircularProgress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  color: PropTypes.oneOf(["primary", "success", "warning", "danger", "info"]),
  indeterminate: PropTypes.bool,
  showValue: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.node,
};

LinearProgress.Circular = CircularProgress;

export { CircularProgress };
export default LinearProgress;

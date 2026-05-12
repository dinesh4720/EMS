import { useCallback, useId, useMemo } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

/**
 * Slider — single-value or dual-range slider primitive.
 *
 * Single value:
 *   <Slider value={40} onChange={setValue} min={0} max={100} />
 *
 * Dual range:
 *   <Slider value={[25000, 50000]} onChange={setRange} min={0} max={100000} step={1000} />
 *
 * Mirrors preview/slider.html from the Edumaster design system.
 */
export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  legend,
  ticks,
  ariaLabel,
  ariaLabelMin,
  ariaLabelMax,
  className,
}) {
  const isRange = Array.isArray(value);
  const id = useId();
  const span = max - min || 1;

  const pct = useCallback((v) => ((v - min) / span) * 100, [min, span]);

  const handleSingle = useCallback(
    (e) => onChange?.(Number(e.target.value)),
    [onChange]
  );
  const handleMin = useCallback(
    (e) => {
      const next = Math.min(Number(e.target.value), value[1] - step);
      onChange?.([next, value[1]]);
    },
    [onChange, step, value]
  );
  const handleMax = useCallback(
    (e) => {
      const next = Math.max(Number(e.target.value), value[0] + step);
      onChange?.([value[0], next]);
    },
    [onChange, step, value]
  );

  const fillStyle = useMemo(() => {
    if (isRange) {
      return { left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` };
    }
    return { left: 0, width: `${pct(value)}%` };
  }, [isRange, pct, value]);

  const tickMarks = useMemo(() => {
    if (!ticks || ticks < 2) return null;
    return Array.from({ length: ticks }, (_, i) => i);
  }, [ticks]);

  return (
    <div
      className={cn("flex flex-col gap-1.5", disabled && "opacity-60", className)}
      data-slider-disabled={disabled || undefined}
    >
      <div className="relative h-[18px] flex items-center">
        {/* Track + fill (visual layer) */}
        <div className="w-full h-1 bg-[var(--color-bg-secondary)] rounded-full relative">
          <div
            className="absolute top-0 bottom-0 bg-[var(--color-primary)] rounded-full"
            style={fillStyle}
          />
          {tickMarks ? (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-px pointer-events-none">
              {tickMarks.map((i) => (
                <span
                  key={i}
                  className="block w-px h-2 bg-[var(--color-border-strong)]"
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Native input(s) — the actual interactive a11y layer */}
        {isRange ? (
          <>
            <RangeInput
              id={`${id}-min`}
              min={min}
              max={max}
              step={step}
              value={value[0]}
              onChange={handleMin}
              disabled={disabled}
              ariaLabel={ariaLabelMin || "Minimum value"}
              percent={pct(value[0])}
            />
            <RangeInput
              id={`${id}-max`}
              min={min}
              max={max}
              step={step}
              value={value[1]}
              onChange={handleMax}
              disabled={disabled}
              ariaLabel={ariaLabelMax || "Maximum value"}
              percent={pct(value[1])}
            />
          </>
        ) : (
          <RangeInput
            id={id}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSingle}
            disabled={disabled}
            ariaLabel={ariaLabel}
            percent={pct(value)}
          />
        )}
      </div>

      {legend && legend.length > 0 ? (
        <div className="flex justify-between font-mono text-[10.5px] text-[var(--color-text-faint)] tabular-nums">
          {legend.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RangeInput({ id, min, max, step, value, onChange, disabled, ariaLabel, percent }) {
  // Native range input: invisible track (we draw our own), visible thumb.
  // Accessible: keyboard, screen-reader friendly, ships with focus ring on
  // the thumb via :focus-visible below.
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className="ds-slider-input"
      style={{ ["--ds-slider-percent"]: `${percent}%` }}
    />
  );
}

RangeInput.propTypes = {
  id: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  percent: PropTypes.number,
};

Slider.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]).isRequired,
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  disabled: PropTypes.bool,
  legend: PropTypes.arrayOf(PropTypes.string),
  ticks: PropTypes.number,
  ariaLabel: PropTypes.string,
  ariaLabelMin: PropTypes.string,
  ariaLabelMax: PropTypes.string,
  className: PropTypes.string,
};

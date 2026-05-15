import { useCallback, useId, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn";

/**
 * OtpInput — N-cell one-time-password input.
 *
 * Mirrors preview/auth_flows.html OTP cells: 38×44 mono cells, accent ring
 * on the active cell, paste-to-fill, auto-advance, backspace-to-prev.
 *
 *   <OtpInput length={6} value={code} onChange={setCode} />
 */
export default function OtpInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  ariaLabel = "Verification code",
  className,
}) {
  const id = useId();
  const inputs = useRef([]);

  const cells = useMemo(() => {
    const arr = Array.from({ length }, (_, i) => value[i] ?? "");
    return arr;
  }, [length, value]);

  const focusIndex = useMemo(() => {
    const filled = cells.findIndex((c) => !c);
    return filled === -1 ? length - 1 : filled;
  }, [cells, length]);

  const setCharAt = useCallback(
    (i, ch) => {
      const next = (cells.slice(0, i).join("") + ch + cells.slice(i + 1).join(""))
        .padEnd(length, "")
        .slice(0, length);
      const trimmed = next.replace(/\s+$/g, "");
      onChange?.(trimmed);
      if (trimmed.length === length && !trimmed.includes("")) onComplete?.(trimmed);
    },
    [cells, length, onChange, onComplete]
  );

  const handleChange = useCallback(
    (i) => (e) => {
      const raw = e.target.value;
      // Allow digits and letters but typically OTPs are digits
      const ch = (raw.match(/[0-9a-zA-Z]/) || [""])[0];
      setCharAt(i, ch);
      if (ch && i < length - 1) inputs.current[i + 1]?.focus();
    },
    [length, setCharAt]
  );

  const handleKeyDown = useCallback(
    (i) => (e) => {
      if (e.key === "Backspace") {
        if (cells[i]) {
          setCharAt(i, "");
        } else if (i > 0) {
          inputs.current[i - 1]?.focus();
          setCharAt(i - 1, "");
          e.preventDefault();
        }
      } else if (e.key === "ArrowLeft" && i > 0) {
        e.preventDefault();
        inputs.current[i - 1]?.focus();
      } else if (e.key === "ArrowRight" && i < length - 1) {
        e.preventDefault();
        inputs.current[i + 1]?.focus();
      }
    },
    [cells, length, setCharAt]
  );

  const handlePaste = useCallback(
    (e) => {
      const text = (e.clipboardData?.getData("text") || "")
        .replace(/[^0-9a-zA-Z]/g, "")
        .slice(0, length);
      if (!text) return;
      e.preventDefault();
      onChange?.(text);
      if (text.length === length) onComplete?.(text);
      const target = Math.min(text.length, length - 1);
      inputs.current[target]?.focus();
    },
    [length, onChange, onComplete]
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex gap-2", className)}
    >
      {cells.map((ch, i) => {
        const isActive = i === focusIndex;
        const isFilled = Boolean(ch);
        return (
          <input
            key={`${id}-${i}`}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={ch}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            onChange={handleChange(i)}
            onKeyDown={handleKeyDown(i)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={cn(
              "w-[38px] h-11 text-center font-mono text-lg font-semibold",
              "rounded-md border outline-none transition-colors",
              "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)]",
              isFilled && "bg-[var(--color-bg-secondary)]",
              isActive &&
                "border-[var(--color-primary)] shadow-[0_0_0_3px_var(--accent-bg)]",
              "focus-visible:border-[var(--color-primary)] focus-visible:shadow-[0_0_0_3px_var(--accent-bg)]",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          />
        );
      })}
    </div>
  );
}

OtpInput.propTypes = {
  length: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onComplete: PropTypes.func,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};

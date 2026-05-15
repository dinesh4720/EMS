import { useCallback, useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ImagePlus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";
import FieldError from "./FieldError";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const SHAPE_STYLES = {
  circle: "rounded-full aspect-square",
  square: "rounded-lg aspect-square",
  wide: "rounded-lg aspect-[16/9]",
};

/**
 * ImageUpload - single image uploader with live preview, replace, and remove.
 * Value types accepted: File | string (URL) | null. Emits the same shape.
 */
export default function ImageUpload({
  label,
  description,
  hint,
  error,
  required = false,
  accept = "image/*",
  maxSize,
  shape = "square",
  value,
  defaultValue = null,
  onChange,
  disabled = false,
  className,
  id,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);
  const [internal, setInternal] = useState(defaultValue);
  const [localError, setLocalError] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);

  const current = value !== undefined ? value : internal;
  const shownError = error || localError;

  useEffect(() => {
    if (current instanceof File) {
      const url = URL.createObjectURL(current);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
    return undefined;
  }, [current]);

  const previewSrc =
    current instanceof File ? objectUrl : typeof current === "string" ? current : null;

  const update = useCallback(
    (next) => {
      if (value === undefined) setInternal(next);
      onChange?.(next);
    },
    [onChange, value]
  );

  const handleFiles = useCallback(
    (incoming) => {
      setLocalError(null);
      const file = incoming?.[0];
      if (!file) return;
      if (!(file.type || "").startsWith("image/")) {
        setLocalError("Only image files are allowed");
        return;
      }
      if (maxSize && file.size > maxSize) {
        setLocalError(`Image exceeds ${formatBytes(maxSize)}`);
        return;
      }
      update(file);
    },
    [maxSize, update]
  );

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };
  const remove = () => update(null);

  const errorId = shownError ? `${inputId}-error` : undefined;
  const hintId = hint || description ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[var(--color-text-secondary)]"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[var(--color-error)]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {description && !shownError && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {description}
        </p>
      )}

      <div className="flex items-start gap-4">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          onClick={openPicker}
          onKeyDown={onKeyDown}
          className={cn(
            "relative flex w-32 shrink-0 items-center justify-center overflow-hidden border-2 border-dashed bg-[var(--color-bg-secondary)] transition-colors",
            "border-[var(--color-border-strong)]",
            "hover:border-[var(--color-primary)] hover:bg-[var(--color-bg)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
            shownError && "border-[var(--color-error)]",
            disabled && "opacity-50 cursor-not-allowed",
            SHAPE_STYLES[shape]
          )}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={typeof label === "string" ? label : "Preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 p-2 text-center">
              <ImagePlus
                className="h-5 w-5 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <span className="text-xs text-[var(--color-text-muted)]">Upload</span>
            </div>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            className="sr-only"
            accept={accept}
            disabled={disabled}
            aria-invalid={shownError ? "true" : undefined}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {previewSrc ? "Replace" : "Choose"}
            </button>
            {previewSrc && (
              <button
                type="button"
                onClick={remove}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {accept === "image/*" ? "PNG, JPG, GIF" : accept}
            {maxSize ? ` · up to ${formatBytes(maxSize)}` : ""}
          </p>
        </div>
      </div>

      {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
      {hint && !shownError && !description && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

ImageUpload.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  required: PropTypes.bool,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  shape: PropTypes.oneOf(["circle", "square", "wide"]),
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(File),
    PropTypes.string,
    PropTypes.oneOf([null]),
  ]),
  defaultValue: PropTypes.oneOfType([
    PropTypes.instanceOf(File),
    PropTypes.string,
    PropTypes.oneOf([null]),
  ]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};

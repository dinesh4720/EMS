import { useCallback, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "../../utils/cn";
import FieldError from "./FieldError";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function validateFile(file, { accept, maxSize }) {
  if (maxSize && file.size > maxSize) {
    return `File exceeds ${formatBytes(maxSize)}`;
  }
  if (accept) {
    const patterns = accept
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    const name = file.name.toLowerCase();
    const type = (file.type || "").toLowerCase();
    const ok = patterns.some((pattern) => {
      if (pattern.startsWith(".")) return name.endsWith(pattern);
      if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
      return type === pattern;
    });
    if (!ok) return "File type not allowed";
  }
  return null;
}

/**
 * FileUpload - drag-and-drop file input with a file list and remove buttons.
 * Value shape: File[] (controlled) or undefined (uncontrolled -> internal state).
 * Pair with Zod: z.array(z.instanceof(File)) client-side.
 */
export default function FileUpload({
  label,
  description,
  hint,
  error,
  required = false,
  multiple = false,
  accept,
  maxSize,
  value,
  defaultValue = [],
  onChange,
  disabled = false,
  className,
  id,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);
  const [internal, setInternal] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const files = value ?? internal;
  const shownError = error || localError;

  const update = useCallback(
    (next) => {
      if (value === undefined) setInternal(next);
      onChange?.(next);
    },
    [onChange, value]
  );

  const addFiles = useCallback(
    (incoming) => {
      setLocalError(null);
      const arr = Array.from(incoming || []);
      if (arr.length === 0) return;
      const errors = [];
      const valid = arr.filter((file) => {
        const err = validateFile(file, { accept, maxSize });
        if (err) errors.push(`${file.name}: ${err}`);
        return !err;
      });
      if (errors.length) setLocalError(errors.join("; "));
      if (!valid.length) return;
      const next = multiple ? [...files, ...valid] : valid.slice(0, 1);
      update(next);
    },
    [accept, files, maxSize, multiple, update]
  );

  const removeFile = useCallback(
    (index) => {
      const next = files.filter((_, i) => i !== index);
      update(next);
    },
    [files, update]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

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

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          "border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)]",
          "hover:border-[var(--color-primary)] hover:bg-[var(--color-bg)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2",
          isDragging && "border-[var(--color-primary)] bg-[var(--color-primary)]/5",
          shownError && "border-[var(--color-error)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <UploadCloud
          className="h-6 w-6 text-[var(--color-text-muted)]"
          aria-hidden="true"
        />
        <div className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-primary)]">Click to upload</span>{" "}
          or drag &amp; drop
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {accept ? `${accept.replace(/,/g, ", ")}` : "Any file"}
          {maxSize ? ` · up to ${formatBytes(maxSize)}` : ""}
          {multiple ? " · multiple" : ""}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-invalid={shownError ? "true" : undefined}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5" aria-label="Selected files">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                  {file.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatBytes(file.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                aria-label={`Remove ${file.name}`}
                className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
      {hint && !shownError && !description && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

FileUpload.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  value: PropTypes.arrayOf(PropTypes.instanceOf(File)),
  defaultValue: PropTypes.arrayOf(PropTypes.instanceOf(File)),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};

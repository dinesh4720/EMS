import { FileText, Upload, X } from "lucide-react";
import { useId } from "react";

export default function DocField({
  field,
  label,
  required,
  file,
  existing,
  onFile,
  onClear,
  error,
  inputRef,
  registerField,
}) {
  const baseId = useId();
  const fieldId = `docfile-${field}-${baseId}`;
  const hintId = error ? `${fieldId}-hint` : undefined;
  const hasNew = file instanceof File;
  const existingUrl =
    typeof existing === "string"
      ? existing
      : existing?.url || existing?.front?.url || existing?.back?.url;
  const displayName = hasNew ? file.name : existing?.name || (existingUrl ? "Uploaded" : "");

  return (
    <div className="field" ref={registerField ? registerField(field) : undefined}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
        {required && <span className="req">*</span>}
      </label>
      <div
        className={`row gap-2 docfield__slot ${error ? "docfield__slot--err" : ""}`}
      >
        <FileText size={12} className="docfield__icon" aria-hidden />
        <span className={`docfield__name ${displayName ? "is-filled" : ""}`}>
          {displayName || "No file"}
        </span>
        {existingUrl && !hasNew && (
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--sm btn--ghost"
          >
            View
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden-file-input"
          onChange={(e) => onFile(e.target.files?.[0])}
          id={fieldId}
          aria-describedby={hintId}
        />
        <label htmlFor={fieldId} className="btn btn--sm docfield__upload">
          <Upload size={11} aria-hidden /> {hasNew || existingUrl ? "Replace" : "Upload"}
        </label>
        {hasNew && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClear} aria-label="Clear">
            <X size={10} aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <span id={hintId} role="alert" className="field__hint field__hint--danger">
          {error}
        </span>
      )}
    </div>
  );
}

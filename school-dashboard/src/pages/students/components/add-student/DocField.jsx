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
        className="row gap-2"
        style={{
          alignItems: "center",
          padding: 8,
          border: `1px ${error ? "solid var(--danger)" : "dashed var(--border-strong)"}`,
          borderRadius: 6,
          background: "var(--surface)",
        }}
      >
        <FileText size={12} style={{ color: "var(--fg-faint)" }} aria-hidden />
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: displayName ? "var(--fg)" : "var(--fg-faint)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
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
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files?.[0])}
          id={fieldId}
          aria-describedby={hintId}
        />
        <label htmlFor={fieldId} className="btn btn--sm" style={{ cursor: "pointer" }}>
          <Upload size={11} aria-hidden /> {hasNew || existingUrl ? "Replace" : "Upload"}
        </label>
        {hasNew && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClear} aria-label="Clear">
            <X size={10} aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <span id={hintId} role="alert" className="field__hint" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

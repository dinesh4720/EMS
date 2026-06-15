import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DiscardConfirmDialog({ onCancel, onConfirm }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(15,15,20,0.42)",
        display: "grid",
        placeItems: "center",
      }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-label="Discard unsaved changes"
        style={{
          width: "min(380px, calc(100% - 32px))",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          padding: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          {t("pages.unsavedChanges", "Unsaved changes")}
        </div>
        <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: 13 }}>
          You have unsaved changes. Close without saving?
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" className="btn" onClick={onCancel}>
            Keep editing
          </button>
          <button type="button" className="btn btn--accent" onClick={onConfirm}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

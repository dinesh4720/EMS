import React from "react";
import { FileText, Download, Folder } from "lucide-react";

import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import { useStudentDocuments } from "../../hooks";
import { formatDateShort } from "./utils";

function DocumentsPanel({ studentId }) {
  const result = useStudentDocuments(studentId) || {};
  const { documents, loading, error, refetch } = result;
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading documents…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const list = Array.isArray(documents) ? documents : [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No documents uploaded"
        description="Birth certificate, Aadhaar, transfer certificate and other student documents will appear here."
      />
    );
  }
  return (
    <div className="col gap-2">
      {list.map((d) => (
        <a
          key={d._id || d.id || d.url}
          href={d.url || d.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="card row gap-3"
          style={{
            padding: 14,
            textDecoration: "none",
            color: "var(--fg)",
            alignItems: "center",
          }}
        >
          <FileText size={16} aria-hidden style={{ color: "var(--fg-muted)" }} />
          <div className="col" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 520 }}>
              {d.name || d.type || "Document"}
            </span>
            {d.uploadedAt && (
              <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                {formatDateShort(d.uploadedAt)}
              </span>
            )}
          </div>
          <Download size={14} aria-hidden style={{ color: "var(--fg-faint)" }} />
        </a>
      ))}
    </div>
  );
}

export default DocumentsPanel;

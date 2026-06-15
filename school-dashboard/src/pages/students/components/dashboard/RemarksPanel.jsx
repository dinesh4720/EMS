import React from "react";
import { MessageSquare } from "lucide-react";

import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import { useStudentRemarks } from "../../hooks";
import { formatDateShort } from "./utils";

function RemarksPanel({ studentId, onAddRemark }) {
  const { remarks, loading, error, refetch } = useStudentRemarks(studentId);
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading remarks…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  // Privacy filter: only show staff-visible remarks here, mark sentToParent
  const list = Array.isArray(remarks) ? remarks : [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No remarks yet"
        description="Add observations, notes, or commendations about this student."
        action={
          onAddRemark
            ? { label: "Add remark", onClick: onAddRemark }
            : undefined
        }
      />
    );
  }
  return (
    <div className="col gap-3">
      {list.map((r) => {
        const visible = !!r.sentToParent;
        return (
          <div key={r._id || r.id} className="card">
            <div className="card__head">
              <span className="card__title">{r.title || r.category || "Remark"}</span>
              <div className="row gap-2">
                {r.category && <span className="chip">{r.category}</span>}
                <span
                  className={`status status--${visible ? "ok" : "warn"}`}
                  title={visible ? "Visible to parents" : "Staff-only"}
                >
                  <span className="dot" />
                  {visible ? "Shared" : "Internal"}
                </span>
              </div>
            </div>
            <div style={{ padding: "10px 14px 14px" }}>
              <p style={{ fontSize: 13, margin: 0, color: "var(--fg)" }}>
                {r.description || r.note || ""}
              </p>
              {(r.createdBy?.name || r.createdAt) && (
                <div
                  className="subtle row gap-2"
                  style={{ fontSize: 11, marginTop: 8 }}
                >
                  {r.createdBy?.name && <span>{r.createdBy.name}</span>}
                  {r.createdAt && (
                    <span className="mono tnum">{formatDateShort(r.createdAt)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RemarksPanel;

import React, { useMemo, useState } from "react";

import { useStudentRemarks } from "../../../../hooks";
import { EmptyLine } from "./shared";
import { initials as toInitials, formatDateShort, DASH } from "../sdData";

// Maps an API remark into the design's card shape.
function mapRemark(r) {
  const shared = !!r.sentToParent;
  const author = r.createdBy?.name || r.author || "Staff";
  const text = r.description || r.note || r.text || "";
  const dt = r.createdAt ? new Date(r.createdAt) : null;
  return {
    id: r._id || r.id,
    author,
    authorInitials: toInitials(author),
    tag: shared ? "Shared" : "Internal",
    tagBg: shared ? "var(--ok-bg)" : "var(--panel)",
    tagColor: shared ? "var(--ok)" : "var(--muted)",
    date: dt ? dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : DASH,
    kind: shared ? "shared" : "internal",
    text,
  };
}

export default function RemarksTab({ studentId }) {
  const { remarks, loading } = useStudentRemarks(studentId);
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState("");

  const all = useMemo(() => (Array.isArray(remarks) ? remarks.map(mapRemark) : []), [remarks]);
  const filters = [
    { key: "all", label: "All", count: all.length },
    { key: "internal", label: "Internal", count: all.filter((r) => r.kind === "internal").length },
    { key: "shared", label: "Shared", count: all.filter((r) => r.kind === "shared").length },
  ];
  const list = all.filter((r) => filter === "all" || r.kind === filter);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {filters.map((f) => {
          const on = filter === f.key;
          return (
            <span
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                height: 28,
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                borderRadius: 8,
                border: `1px solid ${on ? "var(--acc)" : "var(--border)"}`,
                background: on ? "color-mix(in srgb, var(--acc) 8%, var(--surface))" : "var(--surface)",
                fontSize: 12,
                fontWeight: 500,
                color: on ? "var(--acc)" : "var(--tx-3)",
                cursor: "pointer",
              }}
            >
              {f.label}
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: "var(--muted-2)" }}>{f.count}</span>
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 18 }}>
        {loading ? (
          <EmptyLine>Loading remarks…</EmptyLine>
        ) : list.length === 0 ? (
          <EmptyLine>No remarks in this view.</EmptyLine>
        ) : (
          list.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: 13, padding: "14px 16px", background: "var(--surface)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 600, background: "var(--panel)", color: "var(--tx-3)" }}>
                  {r.authorInitials}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--tx-2)" }}>{r.author}</span>
                <span style={{ display: "inline-flex", alignItems: "center", height: 19, padding: "0 7px", borderRadius: 5, background: r.tagBg, fontSize: 10, fontWeight: 600, color: r.tagColor, textTransform: "uppercase", letterSpacing: ".03em" }}>
                  {r.tag}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: "var(--muted-2)" }}>{r.date}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--tx-3)" }}>{r.text}</p>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        <input className="sdx-ipt" placeholder="Write a remark…" style={{ flex: 1 }} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" style={{ height: 38, padding: "0 16px", border: "1px solid var(--acc)", borderRadius: 10, background: "var(--acc)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
          Post
        </button>
      </div>
    </div>
  );
}

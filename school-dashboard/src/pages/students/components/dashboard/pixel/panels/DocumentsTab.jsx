import React from "react";

import { useStudentDocuments } from "../../../../hooks";
import { buildDocuments } from "../sdData";
import { EmptyLine } from "./shared";
import { IconPlus, IconFile, IconDownload } from "../sdIcons";

export default function DocumentsTab({ studentId }) {
  const result = useStudentDocuments(studentId) || {};
  const { documents, loading } = result;
  const docs = buildDocuments(documents);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx)" }}>Documents</span>
        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "var(--muted-2)" }}>{docs.length}</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="sdx-upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 32,
            padding: "0 12px",
            border: "1px dashed var(--field-border)",
            borderRadius: 9,
            background: "var(--surface)",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--tx-3)",
            cursor: "pointer",
            transition: "border-color .12s, color .12s",
          }}
        >
          <IconPlus size={13} />
          Upload
        </button>
      </div>

      {loading ? (
        <EmptyLine>Loading documents…</EmptyLine>
      ) : docs.length === 0 ? (
        <EmptyLine>No documents uploaded yet.</EmptyLine>
      ) : (
        <div className="sd-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          {docs.map((d, i) => {
            const Wrapper = d.url ? "a" : "div";
            const linkProps = d.url ? { href: d.url, target: "_blank", rel: "noreferrer" } : {};
            return (
              <Wrapper
                key={i}
                {...linkProps}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", border: "1px solid var(--border)", borderRadius: 13, background: "var(--surface)", textDecoration: "none" }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 10, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: d.iconBg, color: d.iconColor }}>
                  <IconFile size={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--tx-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{d.meta}</span>
                </div>
                <span className="sdx-iconrow" style={{ width: 30, height: 30, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, color: "var(--muted)", cursor: "pointer", transition: "background .12s, color .12s" }}>
                  <IconDownload size={15} />
                </span>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

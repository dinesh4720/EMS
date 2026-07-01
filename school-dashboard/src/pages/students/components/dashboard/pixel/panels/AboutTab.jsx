import React, { useMemo, useState } from "react";

import { MicroLabel } from "./shared";
import { IconUser, IconCap, IconPin, IconHeart, IconUsers, IconEdit, IconDownload, IconCheck, IconPhone, IconMail } from "../sdIcons";

// Labels that map cleanly back to a student field on save. Rows not listed
// here still render an input in edit mode (to match the design) but are not
// persisted, since they have no safe single-field target.
const EDIT_KEY = {
  "id:Full name": "name",
  "id:Gender": "gender",
  "id:Blood group": "bloodGroup",
  "id:Religion": "religion",
  "id:Category": "category",
  "id:Nationality": "nationality",
  "id:Mother tongue": "motherTongue",
  "id:House": "house",
  "en:Roll number": "rollNo",
  "en:Academic year": "academicYear",
  "en:Medium": "medium",
  "en:Previous school": "previousSchool",
  "ct:Student phone": "phone",
  "ct:Email": "email",
  "ct:Address": "address",
  "ct:City": "city",
  "ct:State": "state",
  "ct:PIN": "pincode",
};

const GROUPS = [
  { key: "id", title: "Identity", Icon: IconUser, field: "identity" },
  { key: "en", title: "Enrolment", Icon: IconCap, field: "enrolment" },
  { key: "ct", title: "Contact & address", Icon: IconPin, field: "contact" },
];

export default function AboutTab({ about, parents, siblings, onSave, onExport }) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState({});

  const rowsById = useMemo(() => {
    const m = {};
    for (const g of GROUPS) for (const r of about[g.field]) m[`${g.key}:${r.label}`] = r.value;
    for (const r of about.health) m[`he:${r.label}`] = r.value;
    return m;
  }, [about]);

  const get = (id) => (vals[id] !== undefined ? vals[id] : rowsById[id]);
  const set = (id, v) => setVals((s) => ({ ...s, [id]: v }));

  const startEdit = () => {
    setVals({});
    setEditing(true);
  };
  const cancelEdit = () => {
    setVals({});
    setEditing(false);
  };
  const saveEdit = async () => {
    const updates = {};
    for (const [id, key] of Object.entries(EDIT_KEY)) {
      if (vals[id] !== undefined && vals[id] !== rowsById[id]) updates[key] = vals[id];
    }
    if (Object.keys(updates).length > 0) await onSave?.(updates);
    setEditing(false);
    setVals({});
  };

  const renderRow = (group, r) => {
    const id = `${group}:${r.label}`;
    return (
      <div
        key={id}
        style={{
          display: "grid",
          gridTemplateColumns: "128px 1fr",
          alignItems: "center",
          gap: 12,
          padding: "6px 0",
          borderBottom: "1px solid var(--divider)",
          minHeight: 34,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
        {editing ? (
          <input className="sdx-ipt" style={{ height: 32 }} value={get(id) === "—" ? "" : get(id)} onChange={(e) => set(id, e.target.value)} />
        ) : (
          <span style={{ fontSize: 12.5, color: "var(--tx-2)", fontFamily: r.mono ? "'Geist Mono',monospace" : undefined }}>
            {r.value}
          </span>
        )}
      </div>
    );
  };

  const card = (Icon, title, body, extra) => (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface-2)", overflow: "hidden", alignSelf: extra ? undefined : "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px", borderBottom: "1px solid var(--border-soft)" }}>
        <Icon size={15} color="var(--acc)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{title}</span>
      </div>
      <div style={{ padding: "4px 16px 10px" }}>{body}</div>
    </div>
  );

  return (
    <div>
      {/* Header row with edit / export actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>Student details</span>
        {editing && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: 6, background: "var(--warn-bg)", fontSize: 11, fontWeight: 500, color: "var(--warn)" }}>
            Editing
          </span>
        )}
        <div style={{ flex: 1 }} />
        {editing ? (
          <span style={{ display: "inline-flex", gap: 9 }}>
            <button type="button" onClick={cancelEdit} className="sdx-soft-btn" style={btnGhost}>
              Cancel
            </button>
            <button type="button" onClick={saveEdit} style={btnAccent}>
              <IconCheck size={13} />
              Save changes
            </button>
          </span>
        ) : (
          <span style={{ display: "inline-flex", gap: 9 }}>
            <button type="button" onClick={startEdit} style={btnAccent}>
              <IconEdit size={13} />
              Edit details
            </button>
            <button type="button" onClick={onExport} className="sdx-soft-btn" style={btnGhost}>
              <IconDownload size={13} />
              Export
            </button>
          </span>
        )}
      </div>

      <div className="sd-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {GROUPS.map((g) => card(g.Icon, g.title, about[g.field].map((r) => renderRow(g.key, r))))}

        {/* Health & safety */}
        {card(
          IconHeart,
          "Health & safety",
          <>
            {about.health.map((r) => renderRow("he", r))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 11 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Allergies</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {about.allergies.length === 0 ? (
                  <span style={{ fontSize: 12.5, color: "var(--tx-2)" }}>None</span>
                ) : (
                  about.allergies.map((a) => (
                    <span key={a} style={{ display: "inline-flex", alignItems: "center", height: 21, padding: "0 9px", borderRadius: 6, background: "var(--danger-bg)", fontSize: 11, fontWeight: 500, color: "var(--danger)" }}>
                      {a}
                    </span>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Parents & guardians (full width) */}
        <div style={{ gridColumn: "1 / -1", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface-2)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px", borderBottom: "1px solid var(--border-soft)" }}>
            <IconUsers size={15} color="var(--acc)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>Parents &amp; guardians</span>
          </div>
          <div className="sd-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {parents.length === 0 ? (
              <div style={{ padding: "15px 16px", fontSize: 12.5, color: "var(--muted)" }}>No guardian records.</div>
            ) : (
              parents.map((p, i) => (
                <div key={i} style={{ padding: "15px 16px", borderRight: "1px solid var(--divider)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                    <span style={{ width: 38, height: 38, borderRadius: 11, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: "var(--panel)", color: "var(--tx-3)" }}>
                      {p.initials}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)" }}>{p.name}</span>
                      <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {p.role} · {p.occupation}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--tx-3)" }}>
                      <IconPhone size={13} color="var(--muted-2)" />
                      <span style={{ fontFamily: "'Geist Mono',monospace" }}>{p.phone}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--tx-3)" }}>
                      <IconMail size={13} color="var(--muted-2)" />
                      {p.email}
                    </div>
                  </div>
                </div>
              ))
            )}
            {siblings.length > 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "13px 16px", borderTop: "1px solid var(--divider)" }}>
                <MicroLabel>Siblings at this school</MicroLabel>
                <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {siblings.map((s, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 12px 7px 8px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
                      <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, background: "var(--panel)", color: "var(--tx-3)" }}>
                        {s.initials}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--tx-2)" }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {s.rel} · {s.cls}
                        </span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  height: 34,
  padding: "0 14px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--surface)",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 500,
  color: "var(--tx-3)",
  cursor: "pointer",
};

const btnAccent = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  height: 34,
  padding: "0 14px",
  border: "1px solid var(--acc)",
  borderRadius: 10,
  background: "var(--acc)",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  color: "#fff",
  cursor: "pointer",
};

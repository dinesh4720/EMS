/**
 * AddSectionModal
 * Adds a single new section to an EXISTING grade. Reuses the Add Class modal's
 * section-card vocabulary (Claude Design), scoped to one grade — inherits the
 * grade's subjects + academic year, pre-fills the next free section letter.
 */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const NEXT_LETTER = (used) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((l) => !used.includes(l)) || "";

export default function AddSectionModal({ open, onClose, grade, existing = [], staff = [], addClass, onCreated, currentAcademicYear }) {
  const usedLetters = useMemo(() => existing.map((s) => String(s.section || "").toUpperCase()), [existing]);
  const inheritedSubjects = useMemo(() => {
    const withSubs = existing.find((s) => Array.isArray(s.raw?.subjects) && s.raw.subjects.length);
    return withSubs ? withSubs.raw.subjects : [];
  }, [existing]);
  const academicYear = existing[0]?.raw?.academicYear || currentAcademicYear;

  const [letter, setLetter] = useState("");
  const [teacher, setTeacher] = useState("");
  const [cap, setCap] = useState("35");
  const [room, setRoom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setLetter(NEXT_LETTER(usedLetters));
    setTeacher(""); setCap("35"); setRoom(""); setErrors({});
  }, [open, usedLetters]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCreate = async () => {
    const errs = {};
    const L = letter.trim().toUpperCase();
    if (!L) errs.letter = "Section is required";
    else if (usedLetters.includes(L)) errs.letter = `Section ${L} already exists`;
    if (!teacher) errs.teacher = "Class teacher is required";
    if (!cap || parseInt(cap, 10) <= 0) errs.cap = "Capacity must be a positive number";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const t = staff.find((x) => String(x._id || x.id) === String(teacher));
    const capN = parseInt(cap, 10);
    setSubmitting(true);
    try {
      await addClass({
        name: String(grade),
        section: L,
        academicYear,
        strengthLimit: { current: capN, default: capN },
        classTeacherId: String(teacher),
        teacher: t?.name,
        teacherPhoto: t?.picture || t?.photo,
        subjects: inheritedSubjects,
        ...(room && { room }),
      });
      toast.success(`Added Section ${L} to Class ${grade}.`);
      onCreated?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to add section");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="acm-overlay">
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="acm-dialog acm-dialog--sm">
        {/* Header */}
        <div className="acm-header">
          <span className="acm-header-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 4v16" /></svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="acm-title">Add section</span>
            <span className="acm-sub">Class {grade} · {existing.length} existing section{existing.length === 1 ? "" : "s"}</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="acm-close" onClick={onClose} aria-label="Close">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* Body — single section card */}
        <div style={{ padding: "20px 22px" }}>
          <div className="acm-seccard">
            <div className="acm-seccard-head">
              <span className="acm-seccard-badge">{letter || "?"}</span>
              <span className="acm-seccard-title">Section {letter || "—"}</span>
            </div>
            <div className="acm-seccard-body">
              <label className="acm-label-col" style={{ gap: 6 }}>
                <span className="acm-sfield-label">Section</span>
                <input className={`acx-field${errors.letter ? " is-error" : ""}`} value={letter} onChange={(e) => setLetter((e.target.value || "").toUpperCase().slice(0, 2))} style={{ textAlign: "center", fontWeight: 600, padding: "0 6px" }} />
              </label>
              <label className="acm-label-col" style={{ gap: 6 }}>
                <span className="acm-sfield-label">Class teacher <span className="req">*</span></span>
                <select className={`acx-field${errors.teacher ? " is-error" : ""}`} value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                  <option value="">Select teacher…</option>
                  {staff.map((t) => <option key={String(t._id || t.id)} value={String(t._id || t.id)}>{t.name}</option>)}
                </select>
              </label>
              <label className="acm-label-col" style={{ gap: 6 }}>
                <span className="acm-sfield-label">Capacity</span>
                <input className={`acx-field${errors.cap ? " is-error" : ""}`} value={cap} onChange={(e) => setCap(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ fontFamily: "'Geist Mono',monospace" }} />
              </label>
              <label className="acm-label-col" style={{ gap: 6 }}>
                <span className="acm-sfield-label">Room</span>
                <input className="acx-field" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 204" />
              </label>
            </div>
          </div>
          {errors.letter && <p className="acm-err" style={{ margin: "10px 2px 0" }}>{errors.letter}</p>}
          <p className="acm-sec-desc" style={{ margin: "12px 2px 0" }}>
            Inherits this grade’s {inheritedSubjects.length || 0} subject{inheritedSubjects.length === 1 ? "" : "s"} and academic year ({academicYear}).
          </p>
        </div>

        {/* Footer */}
        <div className="acm-footer">
          <div style={{ flex: 1 }} />
          <button className="acm-btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="acm-btn-create" onClick={handleCreate} disabled={submitting}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> {submitting ? "Adding…" : "Add section"}
          </button>
        </div>
      </div>
    </div>
  );
}

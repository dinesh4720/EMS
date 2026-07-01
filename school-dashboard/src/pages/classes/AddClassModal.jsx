/**
 * AddClassModal
 * Pixel-faithful port of the Claude Design "Add Class" modal (within the
 * Classes List reference). Creates a grade + its sections — each section is
 * POSTed as one class document via the real `addClass` API.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const DEFAULT_SUBJECTS = [
  "Mathematics", "English", "Science", "Social Studies", "Hindi",
  "Computer Science", "Physical Education", "Art & Craft", "Music", "General Knowledge",
];
const STAGES = ["Primary", "Middle", "Secondary", "Senior"];
const NEXT_LETTER = (used) => "ABCDEFGHIJ".split("").find((l) => !used.includes(l)) || "X";

function yearOptions(current) {
  const m = String(current || "").match(/(\d{4})/);
  const y = m ? parseInt(m[1], 10) : new Date().getFullYear();
  return [`${y}-${y + 1}`, `${y - 1}-${y}`, `${y - 2}-${y - 1}`];
}

const Check = () => (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.2 4.8-5.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const SubCheck = () => (<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.2 4.8-5.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);

const NAV = [
  { id: "details", label: "Class details" },
  { id: "sections", label: "Sections" },
  { id: "subjects", label: "Subjects" },
  { id: "resources", label: "Resources" },
];

export default function AddClassModal({ open, onClose, staff = [], subjectOptions = [], addClass, onCreated, currentAcademicYear }) {
  const years = useMemo(() => yearOptions(currentAcademicYear), [currentAcademicYear]);
  const subjectNames = useMemo(
    () => (subjectOptions.length ? subjectOptions.map((s) => (typeof s === "string" ? s : s.name)).filter(Boolean) : DEFAULT_SUBJECTS),
    [subjectOptions]
  );

  const [className, setClassName] = useState("");
  const [year, setYear] = useState(years[0]);
  const [medium, setMedium] = useState("English");
  const [stage, setStage] = useState("Senior");
  const [sections, setSections] = useState([{ id: 1, letter: "A", teacher: "", cap: "35", room: "" }]);
  const [nextId, setNextId] = useState(2);
  const [subjects, setSubjects] = useState(() => Object.fromEntries(subjectNames.map((n, i) => [n, i < 5])));
  const [block, setBlock] = useState("");
  const [floor, setFloor] = useState("Ground");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState("details");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const scrollRef = useRef(null);

  // reset on (re)open
  useEffect(() => {
    if (!open) return;
    setClassName(""); setYear(years[0]); setMedium("English"); setStage("Senior");
    setSections([{ id: 1, letter: "A", teacher: "", cap: "35", room: "" }]); setNextId(2);
    setSubjects(Object.fromEntries(subjectNames.map((n, i) => [n, i < 5])));
    setBlock(""); setFloor("Ground"); setNotes(""); setActive("details"); setErrors({});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const subjectCount = subjectNames.filter((n) => subjects[n]).length;
  const sectionsDone = sections.every((s) => s.letter && s.teacher && s.cap);

  const navMeta = {
    details: { sub: `Grade ${className || "—"} · ${year}`, done: !!className },
    sections: { sub: `${sections.length} section${sections.length === 1 ? "" : "s"}`, done: sectionsDone },
    subjects: { sub: `${subjectCount} selected`, done: subjectCount > 0 },
    resources: { sub: "Optional", done: false },
  };

  const onScroll = (e) => {
    const top = e.target.scrollTop;
    let act = NAV[0].id;
    for (const n of NAV) {
      const el = document.getElementById(`acsec-${n.id}`);
      if (el && el.offsetTop - 80 <= top) act = n.id;
    }
    if (act !== active) setActive(act);
  };
  const scrollTo = (id) => {
    const el = document.getElementById(`acsec-${id}`);
    const body = scrollRef.current;
    if (el && body) body.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: "smooth" });
    setActive(id);
  };

  const updateSection = (id, key, v) => setSections((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: v } : x)));
  const addSection = () => setSections((prev) => { const next = NEXT_LETTER(prev.map((x) => x.letter)); setNextId((n) => n + 1); return [...prev, { id: nextId, letter: next, teacher: "", cap: "35", room: "" }]; });
  const removeSection = (id) => setSections((prev) => prev.filter((x) => x.id !== id));
  const toggleSubject = (name) => setSubjects((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleCreate = async () => {
    const errs = {};
    if (!className.trim()) errs.className = "Grade is required";
    sections.forEach((s) => {
      if (!s.letter.trim()) errs[`sec-${s.id}-letter`] = true;
      if (!s.teacher) errs[`sec-${s.id}-teacher`] = true;
      if (!s.cap || parseInt(s.cap, 10) <= 0) errs[`sec-${s.id}-cap`] = true;
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Fill grade, and each section's teacher & capacity.");
      if (errs.className) scrollTo("details"); else scrollTo("sections");
      return;
    }

    const selectedSubjects = subjectNames.filter((n) => subjects[n]);
    setSubmitting(true);
    let ok = 0;
    const failures = [];
    for (const s of sections) {
      const teacher = staff.find((t) => String(t._id || t.id) === String(s.teacher));
      const cap = parseInt(s.cap, 10);
      try {
        await addClass({
          name: className.trim(),
          section: s.letter.trim().toUpperCase(),
          academicYear: year,
          strengthLimit: { current: cap, default: cap },
          classTeacherId: String(s.teacher),
          teacher: teacher?.name,
          teacherPhoto: teacher?.picture || teacher?.photo,
          subjects: selectedSubjects,
          ...(s.room && { room: s.room }),
          ...(block && { block }),
          ...(notes && { classTag: notes }),
        });
        ok++;
      } catch (err) {
        failures.push(`${className}-${s.letter}: ${err?.message || "failed"}`);
      }
    }
    setSubmitting(false);

    if (ok > 0) {
      toast.success(`Created ${ok} section${ok > 1 ? "s" : ""} for Class ${className}.`);
      onCreated?.();
    }
    if (failures.length) toast.error(failures.join(" · "));
    if (failures.length === 0) onClose?.();
  };

  return (
    <div className="acm-overlay">
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="acm-dialog">
        {/* Header */}
        <div className="acm-header">
          <span className="acm-header-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 4v16" /></svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="acm-title">Add class</span>
            <span className="acm-sub">Create a grade and its sections — assign teachers, capacity and subjects.</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="acm-close" onClick={onClose} aria-label="Close">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="acm-body">
          {/* Left rail */}
          <div className="acm-rail">
            <span className="acm-rail-title">New class</span>
            {NAV.map((n, i) => {
              const meta = navMeta[n.id];
              const isActive = active === n.id;
              return (
                <button key={n.id} className={`acm-nav${isActive ? " is-active" : ""}`} onClick={() => scrollTo(n.id)}>
                  <span className={`acm-nav-dot${meta.done ? " is-done" : ""}`}>
                    {meta.done ? <Check /> : i + 1}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span className="acm-nav-label">{n.label}</span>
                    <span className="acm-nav-sub">{meta.sub}</span>
                  </span>
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <div className="acm-tip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9499a3" strokeWidth="2" style={{ flex: "none", marginTop: 1 }}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
              <span>A class can hold several sections. Add one per division (A, B, C…).</span>
            </div>
          </div>

          {/* Right form */}
          <div className="acm-form" ref={scrollRef} onScroll={onScroll}>
            {/* Class details */}
            <div id="acsec-details" className="acm-section">
              <div className="acm-sec-head"><span className="acm-sec-title">Class details</span><span className="acm-sec-rule" /></div>
              <div className="acm-grid2">
                <label className="acm-label-col">
                  <span className="acm-field-label">Grade / Class <span className="req">*</span></span>
                  <input className="acx-field" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. 10" />
                  {errors.className && <span className="acm-err">{errors.className}</span>}
                </label>
                <label className="acm-label-col">
                  <span className="acm-field-label">Display name</span>
                  <input className="acx-field acx-field--readonly" value={`Class ${className || ""}`} readOnly />
                </label>
                <label className="acm-label-col">
                  <span className="acm-field-label">Academic year <span className="req">*</span></span>
                  <select className="acx-field" value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select>
                </label>
                <label className="acm-label-col">
                  <span className="acm-field-label">Medium of instruction</span>
                  <select className="acx-field" value={medium} onChange={(e) => setMedium(e.target.value)}><option>English</option><option>Hindi</option><option>Bilingual</option></select>
                </label>
              </div>
              <div style={{ marginTop: 18 }}>
                <span className="acm-field-label" style={{ display: "block", marginBottom: 9 }}>Stage</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STAGES.map((st) => {
                    const on = stage === st;
                    return <button key={st} className={`acm-stage${on ? " is-on" : ""}`} onClick={() => setStage(st)}>{st}</button>;
                  })}
                </div>
              </div>
            </div>

            {/* Sections */}
            <div id="acsec-sections" className="acm-section">
              <div className="acm-sec-head" style={{ marginBottom: 6 }}>
                <span className="acm-sec-title">Sections</span>
                <span className="acm-count">{sections.length}</span>
                <span className="acm-sec-rule" />
              </div>
              <p className="acm-sec-desc">Each section is a division of this grade with its own teacher, room and capacity.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sections.map((s) => (
                  <div key={s.id} className="acm-seccard">
                    <div className="acm-seccard-head">
                      <span className="acm-seccard-badge">{s.letter}</span>
                      <span className="acm-seccard-title">Section {s.letter}</span>
                      <div style={{ flex: 1 }} />
                      {sections.length > 1 && (
                        <button className="acm-remove" onClick={() => removeSection(s.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13" /></svg> Remove
                        </button>
                      )}
                    </div>
                    <div className="acm-seccard-body">
                      <label className="acm-label-col" style={{ gap: 6 }}>
                        <span className="acm-sfield-label">Section</span>
                        <input className={`acx-field${errors[`sec-${s.id}-letter`] ? " is-error" : ""}`} value={s.letter} onChange={(e) => updateSection(s.id, "letter", (e.target.value || "").toUpperCase().slice(0, 2))} style={{ textAlign: "center", fontWeight: 600, padding: "0 6px" }} />
                      </label>
                      <label className="acm-label-col" style={{ gap: 6 }}>
                        <span className="acm-sfield-label">Class teacher <span className="req">*</span></span>
                        <select className={`acx-field${errors[`sec-${s.id}-teacher`] ? " is-error" : ""}`} value={s.teacher} onChange={(e) => updateSection(s.id, "teacher", e.target.value)}>
                          <option value="">Select teacher…</option>
                          {staff.map((t) => <option key={String(t._id || t.id)} value={String(t._id || t.id)}>{t.name}</option>)}
                        </select>
                      </label>
                      <label className="acm-label-col" style={{ gap: 6 }}>
                        <span className="acm-sfield-label">Capacity</span>
                        <input className={`acx-field${errors[`sec-${s.id}-cap`] ? " is-error" : ""}`} value={s.cap} onChange={(e) => updateSection(s.id, "cap", e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ fontFamily: "'Geist Mono',monospace" }} />
                      </label>
                      <label className="acm-label-col" style={{ gap: 6 }}>
                        <span className="acm-sfield-label">Room</span>
                        <input className="acx-field" value={s.room} onChange={(e) => updateSection(s.id, "room", e.target.value)} placeholder="e.g. 204" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button className="acm-addsection" onClick={addSection}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add section
              </button>
            </div>

            {/* Subjects */}
            <div id="acsec-subjects" className="acm-section">
              <div className="acm-sec-head" style={{ marginBottom: 6 }}>
                <span className="acm-sec-title">Subjects</span>
                <span className="acm-count">{subjectCount}</span>
                <span className="acm-sec-rule" />
              </div>
              <p className="acm-sec-desc">Applied to all sections. You can fine-tune per section later.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {subjectNames.map((name) => {
                  const on = subjects[name];
                  return (
                    <button key={name} className={`acm-subchip${on ? " is-on" : ""}`} onClick={() => toggleSubject(name)}>
                      <span className={`acm-subbox${on ? " is-on" : ""}`}>{on && <SubCheck />}</span>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resources */}
            <div id="acsec-resources" className="acm-section">
              <div className="acm-sec-head" style={{ marginBottom: 6 }}>
                <span className="acm-sec-title">Resources</span>
                <span className="acm-optional">Optional</span>
                <span className="acm-sec-rule" />
              </div>
              <p className="acm-sec-desc">Where this class is located and any setup notes.</p>
              <div className="acm-grid2">
                <label className="acm-label-col"><span className="acm-field-label">Block / Wing</span><input className="acx-field" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. North" /></label>
                <label className="acm-label-col"><span className="acm-field-label">Floor</span><select className="acx-field" value={floor} onChange={(e) => setFloor(e.target.value)}><option>Ground</option><option>First</option><option>Second</option></select></label>
                <label className="acm-label-col" style={{ gridColumn: "1 / -1" }}><span className="acm-field-label">Notes</span><input className="acx-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any setup notes for this class…" /></label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="acm-footer">
          <span className="acm-foot-note"><span className="req">*</span> Required · <span className="acm-foot-mono">{sections.length}</span> section{sections.length === 1 ? "" : "s"}, <span className="acm-foot-mono">{subjectCount}</span> subjects</span>
          <div style={{ flex: 1 }} />
          <button className="acm-btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="acm-btn-create" onClick={handleCreate} disabled={submitting}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg> {submitting ? "Creating…" : "Create class"}
          </button>
        </div>
      </div>
    </div>
  );
}

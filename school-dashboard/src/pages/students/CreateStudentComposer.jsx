/**
 * CreateStudentComposer — "New student" create UI (Claude Design "Students List
 * - Data Grid" composer). Rail scroll-spy modal: Identity, Class & roll, Parents
 * & guardians, Contact, Documents. Wired to the real `addStudent` API.
 */
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ComposerShell, { ComposerSection } from "../../components/dataGrid/ComposerShell";
import { initialsOf } from "./utils/studentsGridHelpers";

const UserIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
);
const PersonSm = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
);
const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4M12 4l-4 4M12 4l4 4M5 20h14" /></svg>
);
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
);
const TrashSm = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13" /></svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
);

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];
const RELATIONS = ["Father", "Mother", "Guardian"];
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CreateStudentComposer({ open, onClose, onCreated, addStudent, classes = [], currentAcademicYear }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [blood, setBlood] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [admissionDate, setAdmissionDate] = useState(todayISO());
  const [parents, setParents] = useState([{ id: 1, rel: "Father", name: "", phone: "", email: "" }]);
  const [nextPid, setNextPid] = useState(2);
  const [prevSchool, setPrevSchool] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Class / section options derived from the real class list.
  const classOptions = useMemo(
    () => [...new Set(classes.map((c) => c.name || c.className).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
    [classes]
  );
  const sectionOptions = useMemo(() => {
    const secs = classes.filter((c) => (c.name || c.className) === className).map((c) => c.section).filter(Boolean);
    return secs.length ? [...new Set(secs)].sort() : ["A", "B", "C", "D"];
  }, [classes, className]);

  const fullName = `${first} ${last}`.trim();
  const nav = [
    { id: "identity", label: "Identity", sub: fullName || "Name, DOB, gender", done: !!(first && last) },
    { id: "classroll", label: "Class & roll", sub: className ? `Class ${className}${section ? ` · ${section}` : ""}` : "Class & section", done: !!(className && section) },
    { id: "parents", label: "Parents & guardians", sub: `${parents.length} contact${parents.length === 1 ? "" : "s"}`, done: parents.some((p) => p.name.trim()) },
    { id: "contact", label: "Contact", sub: city || "Address & PIN", done: !!(address || city) },
    { id: "documents", label: "Documents", sub: "Optional", done: false },
  ];

  if (!open) return null;

  const setParent = (id, key, v) => setParents((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: v } : p)));
  const addParent = () => setParents((prev) => { const rel = RELATIONS.find((r) => !prev.some((p) => p.rel === r)) || "Guardian"; setNextPid((n) => n + 1); return [...prev, { id: nextPid, rel, name: "", phone: "", email: "" }]; });
  const removeParent = (id) => setParents((prev) => prev.filter((p) => p.id !== id));

  const handleSubmit = async () => {
    const errs = {};
    if (!first.trim()) errs.first = true;
    if (!last.trim()) errs.last = true;
    if (!className) errs.className = true;
    if (!section) errs.section = true;
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error("Fill name, class and section."); return; }

    const cls = classes.find((c) => (c.name || c.className) === className && c.section === section);
    const cleanParents = parents.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), relationship: p.rel, phone: p.phone.trim(), email: p.email.trim() }));
    const father = cleanParents.find((p) => p.relationship === "Father");
    const mother = cleanParents.find((p) => p.relationship === "Mother");
    const primary = cleanParents[0];

    setSubmitting(true);
    try {
      await addStudent({
        name: fullName,
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        bloodGroup: blood || undefined,
        aadhaarNumber: aadhaar.trim() || undefined,
        class: className,
        className,
        ...(cls ? { classId: String(cls._id || cls.id) } : {}),
        section,
        rollNo: rollNo.trim() || undefined,
        rollNumber: rollNo.trim() || undefined,
        admissionDate: admissionDate || undefined,
        academicYear: currentAcademicYear,
        previousSchool: prevSchool.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: pin.trim() || undefined,
        parents: cleanParents,
        ...(father ? { fatherName: father.name, fatherPhone: father.phone } : {}),
        ...(mother ? { motherName: mother.name, motherPhone: mother.phone } : {}),
        ...(primary ? { parentPhone: primary.phone, parentEmail: primary.email } : {}),
      });
      toast.success(`${fullName} admitted.`);
      onCreated?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to admit student");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls = (k) => `cmp-field${errors[k] ? " is-error" : ""}`;

  return (
    <ComposerShell
      open={open}
      onClose={onClose}
      icon={<UserIcon />}
      title="New student"
      subtitle="Admit a student — identity, class, parents and documents."
      railTitle="New student"
      tip="Admission ID is generated automatically once the student is saved."
      nav={nav}
      footer={
        <>
          <span className="cmp-foot-note"><span className="cmp-req">*</span> Required</span>
          <div style={{ flex: 1 }} />
          <button className="cmp-btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="cmp-btn-primary" onClick={handleSubmit} disabled={submitting}>
            <CheckIcon /> {submitting ? "Admitting…" : "Admit student"}
          </button>
        </>
      }
    >
      {/* Identity */}
      <ComposerSection id="identity" title="Identity">
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "none" }}>
            <span className="cmp-photo">{initialsOf(fullName) || "?"}</span>
            <button type="button" className="cmp-photo-link">Upload photo</button>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cmp-grid2">
              <label className="cmp-label"><span className="cmp-field-label">First name <span className="cmp-req">*</span></span>
                <input className={fieldCls("first")} value={first} onChange={(e) => setFirst(e.target.value)} placeholder="e.g. Aarav" /></label>
              <label className="cmp-label"><span className="cmp-field-label">Last name <span className="cmp-req">*</span></span>
                <input className={fieldCls("last")} value={last} onChange={(e) => setLast(e.target.value)} placeholder="e.g. Sharma" /></label>
              <label className="cmp-label"><span className="cmp-field-label">Date of birth</span>
                <input type="date" className="cmp-field" value={dob} onChange={(e) => setDob(e.target.value)} /></label>
              <label className="cmp-label"><span className="cmp-field-label">Gender</span>
                <select className="cmp-field" value={gender} onChange={(e) => setGender(e.target.value)}><option value="">Select…</option>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></label>
              <label className="cmp-label"><span className="cmp-field-label">Blood group</span>
                <select className="cmp-field" value={blood} onChange={(e) => setBlood(e.target.value)}><option value="">Select…</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="cmp-label"><span className="cmp-field-label">Aadhaar</span>
                <input className="cmp-field" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))} inputMode="numeric" placeholder="12-digit number" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
            </div>
          </div>
        </div>
      </ComposerSection>

      {/* Class & roll */}
      <ComposerSection id="classroll" title="Class & roll">
        <div className="cmp-grid4">
          <label className="cmp-label"><span className="cmp-field-label">Class <span className="cmp-req">*</span></span>
            <select className={fieldCls("className")} value={className} onChange={(e) => { setClassName(e.target.value); setSection(""); }}>
              <option value="">Select…</option>{classOptions.map((c) => <option key={c}>{c}</option>)}
            </select></label>
          <label className="cmp-label"><span className="cmp-field-label">Section <span className="cmp-req">*</span></span>
            <select className={fieldCls("section")} value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Select…</option>{sectionOptions.map((s) => <option key={s}>{s}</option>)}
            </select></label>
          <label className="cmp-label"><span className="cmp-field-label">Roll no.</span>
            <input className="cmp-field" value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="e.g. 12" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
          <label className="cmp-label"><span className="cmp-field-label">Admission date</span>
            <input type="date" className="cmp-field" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} /></label>
        </div>
      </ComposerSection>

      {/* Parents & guardians */}
      <ComposerSection id="parents" title="Parents & guardians">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {parents.map((p) => (
            <div key={p.id} className="cmp-card">
              <div className="cmp-card-head">
                <PersonSm />
                <span className="cmp-card-title">{p.rel}</span>
                <div style={{ flex: 1 }} />
                {parents.length > 1 && <button type="button" className="cmp-remove" onClick={() => removeParent(p.id)}><TrashSm /> Remove</button>}
              </div>
              <div className="cmp-card-body">
                <label className="cmp-label" style={{ gap: 6 }}><span className="cmp-sfield-label">Relationship</span>
                  <select className="cmp-field" value={p.rel} onChange={(e) => setParent(p.id, "rel", e.target.value)}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
                <label className="cmp-label" style={{ gap: 6 }}><span className="cmp-sfield-label">Full name</span>
                  <input className="cmp-field" value={p.name} onChange={(e) => setParent(p.id, "name", e.target.value)} placeholder="e.g. Sunita Sharma" /></label>
                <label className="cmp-label" style={{ gap: 6 }}><span className="cmp-sfield-label">Phone</span>
                  <input className="cmp-field" value={p.phone} onChange={(e) => setParent(p.id, "phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} inputMode="numeric" placeholder="10-digit" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
                <label className="cmp-label" style={{ gap: 6 }}><span className="cmp-sfield-label">Email</span>
                  <input className="cmp-field" type="email" value={p.email} onChange={(e) => setParent(p.id, "email", e.target.value)} placeholder="name@email.com" /></label>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="cmp-add" onClick={addParent}><PlusIcon /> Add parent / guardian</button>
      </ComposerSection>

      {/* Contact */}
      <ComposerSection id="contact" title="Contact">
        <div className="cmp-grid2">
          <label className="cmp-label" style={{ gridColumn: "1 / -1" }}><span className="cmp-field-label">Previous school</span>
            <input className="cmp-field" value={prevSchool} onChange={(e) => setPrevSchool(e.target.value)} placeholder="e.g. Little Flowers School" /></label>
          <label className="cmp-label" style={{ gridColumn: "1 / -1" }}><span className="cmp-field-label">Address</span>
            <input className="cmp-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, street, area" /></label>
          <label className="cmp-label"><span className="cmp-field-label">City</span>
            <input className="cmp-field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" /></label>
          <label className="cmp-label"><span className="cmp-field-label">State</span>
            <input className="cmp-field" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Maharashtra" /></label>
          <label className="cmp-label"><span className="cmp-field-label">PIN</span>
            <input className="cmp-field" value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} inputMode="numeric" placeholder="6-digit" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
        </div>
      </ComposerSection>

      {/* Documents */}
      <ComposerSection id="documents" title="Documents" optional desc="Upload now or add them later from the student's profile.">
        <div className="cmp-grid2">
          {["Birth certificate", "Aadhaar card", "Previous report card", "Photo ID"].map((d) => (
            <button type="button" key={d} className="cmp-doc">
              <span className="cmp-doc-icon"><UploadIcon /></span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="cmp-doc-title">{d}</span>
                <span className="cmp-doc-sub">Click to upload</span>
              </span>
            </button>
          ))}
        </div>
      </ComposerSection>
    </ComposerShell>
  );
}

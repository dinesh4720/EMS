/**
 * CreateStaffComposer — "Add staff" create UI (Claude Design "Staff List - Data
 * Grid" composer). Rail scroll-spy modal: Identity, Role, Contact, Employment,
 * Documents. Wired to the real `addStaff` API.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import ComposerShell, { ComposerSection } from "../../components/dataGrid/ComposerShell";
import { initialsOf } from "../students/utils/studentsGridHelpers";

const UserIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
);
const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4M12 4l-4 4M12 4l4 4M5 20h14" /></svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
);

const ROLES = ["Teacher", "Principal", "Vice Principal", "Accountant", "Librarian", "Lab Assistant", "Counselor", "Admin", "Receptionist"];
const GENDERS = ["Male", "Female", "Other"];
const EMP_TYPES = ["Full-time", "Part-time", "Contract"];
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CreateStaffComposer({ open, onClose, onCreated, addStaff }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("Teacher");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emergency, setEmergency] = useState("");
  const [address, setAddress] = useState("");
  const [joinDate, setJoinDate] = useState(todayISO());
  const [empType, setEmpType] = useState("Full-time");
  const [salary, setSalary] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fullName = `${first} ${last}`.trim();
  const nav = [
    { id: "identity", label: "Identity", sub: fullName || "Name, DOB, gender", done: !!(first && last) },
    { id: "role", label: "Role", sub: role || "Role & department", done: !!role },
    { id: "contact", label: "Contact", sub: phone || email || "Phone & email", done: !!(phone || email) },
    { id: "employment", label: "Employment", sub: empType, done: !!empType },
    { id: "documents", label: "Documents", sub: "Optional", done: false },
  ];

  if (!open) return null;

  const handleSubmit = async () => {
    const errs = {};
    if (!first.trim()) errs.first = true;
    if (!last.trim()) errs.last = true;
    if (!role) errs.role = true;
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error("Fill name and role."); return; }

    setSubmitting(true);
    try {
      await addStaff({
        name: fullName,
        dob: dob || undefined,
        gender: gender || undefined,
        role: [role],
        designation: role,
        department: department.trim() || undefined,
        ...(subject.trim() ? { assignedSubjects: [subject.trim()] } : {}),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        ...(emergency.trim() ? { emergencyContacts: [{ name: "", relationship: "", phone: emergency.trim() }] } : {}),
        address: address.trim() || undefined,
        joinDate: joinDate || undefined,
        employmentType: empType || undefined,
        salary: salary ? Number(salary) : 0,
        status: "active",
      });
      toast.success(`${fullName} added to staff.`);
      onCreated?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to add staff");
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
      title="Add staff"
      subtitle="Onboard a staff member — identity, role, contact and employment."
      railTitle="New staff"
      tip="Staff ID and login are generated automatically once the member is saved."
      nav={nav}
      footer={
        <>
          <span className="cmp-foot-note"><span className="cmp-req">*</span> Required</span>
          <div style={{ flex: 1 }} />
          <button className="cmp-btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="cmp-btn-primary" onClick={handleSubmit} disabled={submitting}>
            <CheckIcon /> {submitting ? "Adding…" : "Add staff"}
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
                <input className={fieldCls("first")} value={first} onChange={(e) => setFirst(e.target.value)} placeholder="e.g. Rajesh" /></label>
              <label className="cmp-label"><span className="cmp-field-label">Last name <span className="cmp-req">*</span></span>
                <input className={fieldCls("last")} value={last} onChange={(e) => setLast(e.target.value)} placeholder="e.g. Menon" /></label>
              <label className="cmp-label"><span className="cmp-field-label">Date of birth</span>
                <input type="date" className="cmp-field" value={dob} onChange={(e) => setDob(e.target.value)} /></label>
              <label className="cmp-label"><span className="cmp-field-label">Gender</span>
                <select className="cmp-field" value={gender} onChange={(e) => setGender(e.target.value)}><option value="">Select…</option>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></label>
            </div>
          </div>
        </div>
      </ComposerSection>

      {/* Role */}
      <ComposerSection id="role" title="Role">
        <div className="cmp-grid2">
          <label className="cmp-label"><span className="cmp-field-label">Role <span className="cmp-req">*</span></span>
            <select className={fieldCls("role")} value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="cmp-label"><span className="cmp-field-label">Department</span>
            <input className="cmp-field" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Mathematics" /></label>
          <label className="cmp-label" style={{ gridColumn: "1 / -1" }}><span className="cmp-field-label">Primary subject</span>
            <input className="cmp-field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Algebra" /></label>
        </div>
      </ComposerSection>

      {/* Contact */}
      <ComposerSection id="contact" title="Contact">
        <div className="cmp-grid2">
          <label className="cmp-label"><span className="cmp-field-label">Phone</span>
            <input className="cmp-field" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} inputMode="numeric" placeholder="10-digit" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
          <label className="cmp-label"><span className="cmp-field-label">Email</span>
            <input className="cmp-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.edu" /></label>
          <label className="cmp-label"><span className="cmp-field-label">Emergency contact</span>
            <input className="cmp-field" value={emergency} onChange={(e) => setEmergency(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} inputMode="numeric" placeholder="10-digit" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
          <label className="cmp-label"><span className="cmp-field-label">Address</span>
            <input className="cmp-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, street, area" /></label>
        </div>
      </ComposerSection>

      {/* Employment */}
      <ComposerSection id="employment" title="Employment">
        <div className="cmp-grid2">
          <label className="cmp-label"><span className="cmp-field-label">Joining date</span>
            <input type="date" className="cmp-field" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} /></label>
          <label className="cmp-label"><span className="cmp-field-label">Employment type</span>
            <select className="cmp-field" value={empType} onChange={(e) => setEmpType(e.target.value)}>{EMP_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="cmp-label"><span className="cmp-field-label">Monthly salary</span>
            <input className="cmp-field" value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="e.g. 45000" style={{ fontFamily: "'Geist Mono',monospace" }} /></label>
        </div>
      </ComposerSection>

      {/* Documents */}
      <ComposerSection id="documents" title="Documents" optional desc="Upload now or add them later from the staff profile.">
        <div className="cmp-grid2">
          {["Aadhaar card", "PAN card", "Qualification certificate", "Photo ID"].map((d) => (
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

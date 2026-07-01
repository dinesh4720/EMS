/**
 * AssignTeacherModal
 * Pixel-faithful port of the Claude Design "Assign class teacher" modal (Classes
 * List reference). Pick a class teacher for one section — searchable roster with
 * availability (a teacher can lead more than one class). Light + dark.
 */
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { avatarPalette, initialsOf } from "../students/utils/studentsGridHelpers";

const sid = (s) => String(s._id || s.id);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a7b0" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const WarnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "none", marginTop: 1 }}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
);

export default function AssignTeacherModal({ open, onClose, target, staff = [], busyByTeacherId = new Map(), onAssign }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [search, setSearch] = useState("");
  const [pick, setPick] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPick(target?.currentTeacherId ? String(target.currentTeacherId) : "");
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const roster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((t) => {
        if (!q) return true;
        return (t.name || "").toLowerCase().includes(q) || (t.department || "").toLowerCase().includes(q);
      })
      .map((t, i) => {
        const id = sid(t);
        const pal = avatarPalette(i, isDark);
        const busyLabel = busyByTeacherId.get(id);
        return {
          id,
          name: t.name || "—",
          dept: t.department || "—",
          initials: initialsOf(t.name),
          avBg: pal[0], avFg: pal[1],
          busy: !!busyLabel,
          curLabel: busyLabel ? `Class teacher of ${busyLabel}` : "Available",
          picked: id === pick,
        };
      });
  }, [staff, search, pick, busyByTeacherId, isDark]);

  if (!open || !target) return null;

  // A teacher can be class teacher of only ONE section. Picking someone who
  // already leads a *different* section warns + flips the button to "Reassign".
  const pickedTeacher = staff.find((s) => sid(s) === pick);
  const pickedBusyLabel = pick && String(pick) !== String(target.currentTeacherId || "")
    ? busyByTeacherId.get(String(pick))
    : null;
  const warn = !!pickedBusyLabel;
  const btnLabel = warn ? "Reassign" : "Assign";
  const warnText = warn
    ? `${pickedTeacher?.name || "This teacher"} is currently class teacher of ${pickedBusyLabel} — assigning here will leave that section unassigned.`
    : "";

  const handleAssign = async () => {
    if (!pick) return;
    setSubmitting(true);
    try {
      await onAssign?.(pick);
      toast.success(`${warn ? "Reassigned" : "Assigned"} ${pickedTeacher?.name || "teacher"} to Class ${target.grade} · ${target.section}.`);
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to assign teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="acm-overlay">
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="atm-dialog">
        {/* Header */}
        <div className="acm-header">
          <span className="acm-header-icon"><UserIcon /></span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="acm-title">Assign class teacher</span>
            <span className="acm-sub">Class {target.grade} · Section {target.section}</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="acm-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        {/* Search */}
        <div className="atm-searchwrap">
          <label className="atm-search">
            <SearchIcon />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers…" />
          </label>
        </div>

        {/* Roster */}
        <div className="atm-roster sdg-scroll">
          {roster.length === 0 ? (
            <div className="atm-empty">No teachers match “{search}”.</div>
          ) : roster.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`atm-card${t.picked ? " is-picked" : ""}`}
              onClick={() => setPick(t.id)}
            >
              <span className="atm-av" style={{ background: t.avBg, color: t.avFg }}>{t.initials}</span>
              <span className="atm-meta">
                <span className="atm-name">{t.name}</span>
                <span className="atm-dept">{t.dept}</span>
              </span>
              {t.busy ? (
                <span className="atm-busy"><span className="atm-busy-dot" />{t.curLabel}</span>
              ) : (
                <span className="atm-free">Available</span>
              )}
              <span className={`atm-radio${t.picked ? " is-picked" : ""}`}>{t.picked && <span className="atm-radio-dot" />}</span>
            </button>
          ))}
        </div>

        {/* Warning — reassigning a teacher who already leads another section */}
        {warn && (
          <div className="atm-warn">
            <WarnIcon />
            <span>{warnText}</span>
          </div>
        )}

        {/* Footer */}
        <div className="acm-footer">
          <span className="acm-foot-note" style={{ flex: "none" }}>A teacher can be class teacher of only one section.</span>
          <div style={{ flex: 1 }} />
          <button className="acm-btn-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className={`atm-assign${pick ? " is-on" : ""}`} onClick={handleAssign} disabled={!pick || submitting}>
            <CheckIcon /> {submitting ? `${btnLabel}ing…` : btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

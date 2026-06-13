import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronRight,
  Check,
  Download,
  Sparkles,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  IndianRupee,
  GraduationCap,
  Building2,
  Users,
  Plus,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import RevokeRoleModal from "../../components/modals/RevokeRoleModal";
import ClassSubjectManagementModal from "./components/ClassSubjectManagementModal";
import FormErrorSummary from "../../components/ui/FormErrorSummary";
import useFormErrors from "../../hooks/useFormErrors";

import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { classesApi } from "../../services/api";
import { getStoredUser } from "../../utils/authSession";
import logger from "../../utils/logger";

import {
  DEFAULT_DEPARTMENTS,
  fallbackClassOptions,
  emptyForm,
} from "./components/add-staff/constants";
import { buildEditFormData } from "./components/add-staff/populateEditForm";
import { submitStaffForm } from "./components/add-staff/submitStaff";

/**
 * Composer-style staff create flow (Variant A — frosted overlay).
 *
 * Faithful to design-handoff/scripts/create-staff-a.jsx:
 *   - 220px section nav on the left, dense form on the right
 *   - .field/.input/.select/.optgrid/.taginput/.avatar-up bare markup
 *   - frosted glass card centered over the underlying staff list
 *
 * The form uses a compact field set (the bundle's intent: "fill what you
 * have, the rest can wait"). On submit we transform the flat composer
 * state into the legacy `emptyForm` shape and call the existing
 * `submitStaffForm` pipeline — so create flows still go through the same
 * validation and persistence path as the legacy AddStaff drawer.
 */

const ROLE_OPTIONS = [
  { value: "Teaching", icon: GraduationCap, label: "Teaching", sub: "Has classes" },
  { value: "Admin", icon: Building2, label: "Admin", sub: "Office staff" },
  { value: "Support", icon: Users, label: "Support", sub: "Lab, library" },
  { value: "Leadership", icon: Sparkles, label: "Leadership", sub: "HoD, principal" },
];

const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Physics", "Chemistry", "Biology",
  "Hindi", "Sanskrit", "Computer Science", "History", "Geography",
  "Economics", "Civics", "Art", "Music", "Physical Education",
];

const EMPLOYMENT_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
];

const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  subject: "Subject",
  email: "Email",
  phone: "Phone",
};
const FIELD_TO_SECTION = {
  firstName: "identity",
  lastName: "identity",
  subject: "role",
  email: "contact",
  phone: "contact",
};

function emptyComposerForm(seed = {}) {
  return {
    firstName: "",
    lastName: "",
    code: "",
    displayName: "",
    role: "Teaching",
    subject: "",
    dept: "Teaching",
    classes: [],
    email: "",
    phone: "",
    emergencyContact: "",
    address: "",
    joinDate: "",
    employmentType: "Full-time",
    salary: "",
    picture: null,
    ...seed,
  };
}

function fromEditingStaff(staff) {
  if (!staff) return emptyComposerForm();
  // Use buildEditFormData to leverage existing normalizers, then unpack
  // the few fields the composer surfaces.
  const legacy = buildEditFormData(staff);
  const [first = "", ...rest] = (legacy.name || "").split(" ");
  return emptyComposerForm({
    firstName: first,
    lastName: rest.join(" "),
    code: legacy.staffNumber || "",
    role: Array.isArray(legacy.staffType) ? legacy.staffType[0] || "Teaching" : "Teaching",
    dept: legacy.department || "Teaching",
    classes: legacy.assignedClasses || [],
    email: legacy.email || "",
    phone: legacy.phone || "",
    address: legacy.address || "",
    joinDate: legacy.joinDate || "",
    employmentType: legacy.employmentType || "Full-time",
    picture: legacy.picture || null,
  });
}

const AddStaffComposer = forwardRef(function AddStaffComposer(
  { onClose, onSave, editingStaff },
  ref
) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { staff: allStaff } = useApp();
  const isCreate = !editingStaff;
  const canEdit = isCreate
    ? hasPermission("staff", "create")
    : hasPermission("staff", "edit");

  const departments = useMemo(() => {
    const staffDepts = (allStaff || []).map((s) => s.department).filter(Boolean);
    return [...new Set([...DEFAULT_DEPARTMENTS, ...staffDepts])].sort();
  }, [allStaff]);

  const [form, setForm] = useState(() => fromEditingStaff(editingStaff));
  const {
    errors,
    setErrors,
    clearFieldError,
    registerField,
    focusFirstError,
    mapServerErrors,
    runSubmit,
  } = useFormErrors();
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");
  // Help banner is dismissable — sticks across sessions via localStorage so
  // returning users don't keep re-dismissing the same tip.
  const [helpDismissed, setHelpDismissed] = useState(() => {
    try {
      return localStorage.getItem("composer-help-dismissed") === "1";
    } catch {
      return false;
    }
  });
  const dismissHelp = useCallback(() => {
    setHelpDismissed(true);
    try {
      localStorage.setItem("composer-help-dismissed", "1");
    } catch {
      /* localStorage unavailable — fine, the in-memory state still hides it */
    }
  }, []);
  const [availableClasses, setAvailableClasses] = useState([]);
  const fileInputRef = useRef(null);

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const selfRevokeConfirmed = useRef(false);
  const [showClassSubjectModal, setShowClassSubjectModal] = useState(false);
  const [createdStaffId, setCreatedStaffId] = useState(null);
  const [createdStaffName, setCreatedStaffName] = useState("");

  // Picture preview URL — same lifecycle pattern as the legacy AddStaff
  const picturePreviewUrl = useMemo(() => {
    if (!form.picture || !(form.picture instanceof File)) return null;
    return URL.createObjectURL(form.picture);
  }, [form.picture]);
  useEffect(() => {
    return () => {
      if (picturePreviewUrl) URL.revokeObjectURL(picturePreviewUrl);
    };
  }, [picturePreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    classesApi
      .getAll()
      .then((cls) => {
        if (cancelled) return;
        setAvailableClasses(cls || []);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableClasses(
          fallbackClassOptions.map((c) => ({ id: c, displayName: c }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setHasChanges(true);
    clearFieldError(key);
  }, [clearFieldError]);


  // ---- Close ---------------------------------------------------------
  const handleClose = () => {
    if (hasChanges) setShowConfirmClose(true);
    else onClose();
  };
  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };
  const cancelClose = () => setShowConfirmClose(false);
  useImperativeHandle(ref, () => ({
    attemptClose: handleClose,
    hasUnsavedChanges: () => hasChanges,
  }));

  // Esc closes
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !showConfirmClose) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirmClose, hasChanges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // ---- Submit --------------------------------------------------------
  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (form.role === "Teaching" && !form.subject) next.subject = "Required";
    if (!form.email.trim()) next.email = "Required";
    if (!form.phone.trim()) next.phone = "Required";
    setErrors(next);
    return { ok: Object.keys(next).length === 0, errors: next };
  };

  const focusFirstErrorWithSection = useCallback(
    (errorMap) => {
      const ordered = ["firstName", "lastName", "subject", "email", "phone"];
      const firstName = ordered.find((n) => errorMap[n]);
      if (firstName) {
        const section = FIELD_TO_SECTION[firstName];
        if (section) goToSection(section);
        // Defer to allow the section scroll to start before focusing field.
        setTimeout(() => focusFirstError(errorMap), 80);
      } else {
        focusFirstError(errorMap);
      }
    },
    [focusFirstError]
  );

  const handleSubmit = async () => {
    const { ok, errors: nextErrors } = validate();
    if (!ok) {
      toast.error("Fix the highlighted fields before continuing.");
      focusFirstErrorWithSection(nextErrors);
      return;
    }

    // Self-revoke admin guard (mirrors legacy AddStaff)
    if (!selfRevokeConfirmed.current && editingStaff) {
      const stored = getStoredUser();
      if (stored?.id && editingStaff.id === stored.id) {
        const originalRoles = Array.isArray(editingStaff.role)
          ? editingStaff.role
          : [editingStaff.role].filter(Boolean);
        if (originalRoles.includes("Admin") && form.role !== "Admin") {
          setShowRevokeModal(true);
          return;
        }
      }
    }
    selfRevokeConfirmed.current = false;

    // Build legacy form payload that submitStaffForm expects.
    const legacyPayload = {
      ...emptyForm,
      ...(editingStaff ? buildEditFormData(editingStaff) : {}),
      name: `${form.firstName} ${form.lastName}`.trim(),
      staffNumber: form.code,
      staffType: [form.role],
      department: form.dept,
      assignedClasses: form.classes,
      email: form.email,
      phone: form.phone,
      address: form.address,
      joinDate: form.joinDate,
      employmentType: form.employmentType,
      picture: form.picture,
      emergencyContacts: form.emergencyContact
        ? [{ _key: 1, name: form.emergencyContact, relationship: "", phone: "" }]
        : [{ _key: 1, name: "", relationship: "", phone: "" }],
    };

    setIsSubmitting(true);
    try {
      const result = await runSubmit(() =>
        submitStaffForm({ formData: legacyPayload, onSave })
      );
      if (!result) return;
      const { savedStaff, staffData } = result;
      if (isCreate && savedStaff?.id) {
        setCreatedStaffId(savedStaff.id);
        setCreatedStaffName(staffData?.name || legacyPayload.name);
        setShowClassSubjectModal(true);
      } else {
        onClose();
      }
    } catch (e) {
      logger.error("Composer submit failed:", e);
      // Map any field-level server errors back onto the form so they appear
      // inline + in the summary banner instead of only as a toast.
      const { fields, message } = mapServerErrors(e);
      toast.error(message || "Failed to save staff");
      if (Object.keys(fields).length) {
        focusFirstErrorWithSection(fields);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Section status (drives the left nav) -------------------------
  const sectionStatus = useMemo(() => {
    const fills = {
      identity: [form.firstName, form.lastName, form.code, form.displayName],
      role: [form.role, form.subject || (form.role !== "Teaching" ? "x" : ""), form.classes.length ? "x" : ""],
      contact: [form.email, form.phone, form.emergencyContact, form.address],
      employment: [form.joinDate, form.employmentType, form.salary, "", ""],
      access: [],
      review: [],
    };
    const totals = { identity: 4, role: 3, contact: 4, employment: 5, access: 0, review: 0 };
    return SECTIONS.map((s) => {
      const filled = (fills[s.id] || []).filter(Boolean).length;
      const total = totals[s.id] ?? 0;
      let countLabel;
      if (s.id === "review") countLabel = "";
      else if (s.id === "access") countLabel = "Optional";
      else countLabel = `${filled} of ${total}`;
      return {
        ...s,
        filled,
        total,
        done: total > 0 && filled >= total,
        countLabel,
      };
    });
  }, [form]);

  // Footer total counts only the fields actually visible in the form
  // body (matches the design's "9 of 14 fields" — Employment shows
  // "0 of 5" in the section nav because that 5 includes the
  // disclosure-revealed bank/PAN/PF inputs, but only 3 are visible
  // up front, so the footer treats Employment as 3 here).
  const FOOTER_TOTALS = { identity: 4, role: 3, contact: 4, employment: 3 };
  const totalFilled = sectionStatus.reduce((acc, s) => {
    if (!(s.id in FOOTER_TOTALS)) return acc;
    return acc + Math.min(s.filled, FOOTER_TOTALS[s.id]);
  }, 0);
  const totalFields = Object.values(FOOTER_TOTALS).reduce((a, b) => a + b, 0);
  const progressPct = totalFields ? Math.round((totalFilled / totalFields) * 100) : 0;

  // Scroll-spy
  const mainRef = useRef(null);
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const targets = SECTIONS.map((s) =>
      document.getElementById(`composer-section-${s.id}`)
    ).filter(Boolean);
    if (!targets.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace("composer-section-", "");
          setActiveSection(id);
        }
      },
      { root, rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.1, 0.5] }
    );
    targets.forEach((tgt) => obs.observe(tgt));
    return () => obs.disconnect();
  }, []);

  const goToSection = (id) => {
    setActiveSection(id);
    document
      .getElementById(`composer-section-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---- Class taginput helpers ---------------------------------------
  const [classDraft, setClassDraft] = useState("");
  const addClass = (label) => {
    const v = label.trim();
    if (!v) return;
    if (form.classes.includes(v)) return;
    set("classes", [...form.classes, v]);
    setClassDraft("");
  };
  const removeClass = (label) =>
    set("classes", form.classes.filter((c) => c !== label));

  // ---- Picture handlers ---------------------------------------------
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("picture", file);
  };

  const initials = `${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`.toUpperCase();

  return createPortal(
    <div
      className="composer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Add a staff member" : "Edit staff"}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="composer">
          {/* Head */}
          <div className="composer__head">
            <button
              type="button"
              className="iconbtn"
              style={{ width: 24, height: 24 }}
              onClick={handleClose}
              aria-label="Close"
            >
              <X size={13} />
            </button>
            <div className="composer__crumbs">
              <span>Staff</span>
              <ChevronRight size={11} style={{ color: "var(--fg-faint)" }} aria-hidden />
              <span className="here">{isCreate ? "New staff member" : "Edit staff"}</span>
            </div>
            <div style={{ flex: 1 }} />
            <span className="kbd">esc</span>
            <span style={{ width: 4 }} />
            <button type="button" className="btn btn--sm">
              <Download size={11} />
              Import CSV
            </button>
          </div>

          {/* Body */}
          <div className="composer__body">
            {/* Section nav */}
            <nav className="composer__nav" aria-label="Sections">
              <div className="composer__nav-title">Sections</div>
              {sectionStatus.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSection(s.id)}
                  className={`cnav ${activeSection === s.id ? "is-active" : ""} ${s.done ? "is-done" : ""}`}
                  aria-current={activeSection === s.id ? "true" : undefined}
                >
                  <span className="cnav__num" aria-hidden>
                    {s.done ? <Check size={10} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span style={{ flex: 1, textAlign: "left" }}>{s.label}</span>
                  {s.countLabel && <span className="cnav__count">{s.countLabel}</span>}
                </button>
              ))}

              <div style={{ marginTop: "auto", paddingTop: 16 }} />
              {!helpDismissed && (
                <div
                  className="help-banner"
                  style={{ margin: "8px 4px 0", fontSize: 11.5 }}
                >
                  <Sparkles
                    size={12}
                    style={{ marginTop: 1, flexShrink: 0 }}
                    aria-hidden
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    Fill what you have — the rest can wait. Staff can complete their
                    own profile after invite.
                  </span>
                  <button
                    type="button"
                    onClick={dismissHelp}
                    aria-label="Dismiss tip"
                    className="help-banner__close"
                  >
                    <X size={11} aria-hidden />
                  </button>
                </div>
              )}
            </nav>

            {/* Form */}
            <div className="composer__main" ref={mainRef}>
              <h2 className="composer__title">
                {isCreate ? "Add a staff member" : "Edit staff"}
              </h2>
              <p className="composer__sub">
                {isCreate
                  ? "They'll get an invite link to finish setup, choose a password, and confirm details."
                  : "Update profile, role, contact, and employment details."}
              </p>

              <FormErrorSummary
                errors={errors}
                labels={FIELD_LABELS}
                onFocusField={(name) => focusFirstErrorWithSection({ [name]: errors[name] })}
                className="mb-4"
              />

              {!canEdit && (
                <div
                  className="help-banner"
                  style={{
                    marginBottom: 18,
                    color: "var(--warn)",
                    background: "var(--warn-bg)",
                    borderColor: "var(--warn-bg)",
                  }}
                >
                  <AlertTriangle
                    size={12}
                    style={{ marginTop: 1, flexShrink: 0 }}
                    aria-hidden
                  />
                  <span>
                    {editingStaff
                      ? "You don't have permission to edit staff members."
                      : "You don't have permission to create staff members."}
                  </span>
                </div>
              )}

              {/* Identity */}
              <section id="composer-section-identity" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Identity</div>
                    <div className="section__hint">
                      How they show up across rosters and chat.
                    </div>
                  </div>
                  {sectionStatus[0].done && (
                    <span className="chip chip--ok">
                      <Check size={9} strokeWidth={2.5} aria-hidden /> Looks good
                    </span>
                  )}
                </div>

                <div className="avatar-up" style={{ marginBottom: 14 }}>
                  <ComposerAvatar
                    previewUrl={picturePreviewUrl}
                    initials={initials || "?"}
                    name={`${form.firstName} ${form.lastName}`.trim()}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontWeight: 520 }}>Profile photo</span>
                    <span className="subtle" style={{ fontSize: 12 }}>
                      JPG or PNG · square · max 2 MB. Initials are used if none.
                    </span>
                    <div className="row gap-2" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost subtle"
                        onClick={() => set("picture", null)}
                      >
                        Use initials
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={onPickFile}
                    />
                  </div>
                </div>

                <div className="fgrid">
                  <ComposerField
                    label="First name"
                    required
                    name="firstName"
                    error={errors.firstName}
                    registerField={registerField}
                  >
                    <input
                      className={`input ${errors.firstName ? "input--err" : ""}`}
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      aria-invalid={errors.firstName ? "true" : undefined}
                    />
                  </ComposerField>
                  <ComposerField
                    label="Last name"
                    required
                    name="lastName"
                    error={errors.lastName}
                    registerField={registerField}
                  >
                    <input
                      className={`input ${errors.lastName ? "input--err" : ""}`}
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      aria-invalid={errors.lastName ? "true" : undefined}
                    />
                  </ComposerField>
                  <ComposerField
                    label="Staff code"
                    hint="Auto-suggested · next free in series"
                  >
                    <div className="field__icon-wrap">
                      <Users size={12} className="field__icon" aria-hidden />
                      <input
                        className="input input--with-icon input--with-suffix mono tnum"
                        value={form.code}
                        onChange={(e) => set("code", e.target.value)}
                        placeholder="EMP016"
                      />
                      <span className="field__suffix">EMP</span>
                    </div>
                  </ComposerField>
                  <ComposerField label="Display name" hint="Shown to parents · optional">
                    <input
                      className="input"
                      value={form.displayName}
                      onChange={(e) => set("displayName", e.target.value)}
                      placeholder={`${form.firstName} ${form.lastName}`.trim() || "Anika Rao"}
                    />
                  </ComposerField>
                </div>
              </section>

              {/* Role & teaching */}
              <section id="composer-section-role" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Role &amp; teaching</div>
                    <div className="section__hint">
                      Choose role first — fields below adjust to match.
                    </div>
                  </div>
                </div>

                <div className="optgrid" style={{ marginBottom: 14 }}>
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      className={`opt ${form.role === r.value ? "is-active" : ""}`}
                      onClick={() => set("role", r.value)}
                    >
                      <span className="opt__icon">
                        <r.icon size={12} strokeWidth={2} />
                      </span>
                      <span
                        className="col"
                        style={{ gap: 1, minWidth: 0, alignItems: "flex-start" }}
                      >
                        <span style={{ fontWeight: 520 }}>{r.label}</span>
                        <span className="subtle" style={{ fontSize: 11 }}>{r.sub}</span>
                      </span>
                      <span className="opt__check">
                        <Check size={8} strokeWidth={3} />
                      </span>
                    </button>
                  ))}
                </div>

                <div className="fgrid">
                  <ComposerField
                    label="Subject"
                    required={form.role === "Teaching"}
                    name="subject"
                    error={errors.subject}
                    registerField={registerField}
                  >
                    <select
                      className={`select ${errors.subject ? "input--err" : ""}`}
                      value={form.subject}
                      onChange={(e) => set("subject", e.target.value)}
                      disabled={form.role !== "Teaching"}
                      aria-invalid={errors.subject ? "true" : undefined}
                    >
                      <option value="">
                        {form.role === "Teaching"
                          ? "Select a subject…"
                          : "—"}
                      </option>
                      {SUBJECT_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </ComposerField>
                  <ComposerField label="Department">
                    <select
                      className="select"
                      value={form.dept}
                      onChange={(e) => set("dept", e.target.value)}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </ComposerField>
                  <ComposerField
                    label="Assigned classes"
                    hint="They can take attendance and post grades for these"
                    className="span-2"
                  >
                    <div className="taginput">
                      {form.classes.map((c) => (
                        <span key={c} className="tagchip">
                          {c}
                          <button
                            type="button"
                            onClick={() => removeClass(c)}
                            aria-label={`Remove ${c}`}
                          >
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={classDraft}
                        list="staff-composer-class-options"
                        onChange={(e) => setClassDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addClass(classDraft);
                          } else if (
                            e.key === "Backspace" &&
                            !classDraft &&
                            form.classes.length
                          ) {
                            removeClass(form.classes[form.classes.length - 1]);
                          }
                        }}
                        onBlur={() => addClass(classDraft)}
                        placeholder={
                          form.classes.length
                            ? "Add another · type 10-C…"
                            : "Add class · type 10-C…"
                        }
                      />
                      <datalist id="staff-composer-class-options">
                        {availableClasses.map((c) => (
                          <option
                            key={c.id || c.displayName}
                            value={c.displayName || c.id}
                          />
                        ))}
                      </datalist>
                    </div>
                  </ComposerField>
                </div>
              </section>

              {/* Contact */}
              <section id="composer-section-contact" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Contact</div>
                    <div className="section__hint">
                      Used for the invite email and SMS confirmations.
                    </div>
                  </div>
                  {sectionStatus[2].done ? (
                    <span className="chip chip--ok">
                      <Check size={9} strokeWidth={2.5} aria-hidden /> Looks good
                    </span>
                  ) : sectionStatus[2].filled < sectionStatus[2].total ? (
                    <span className="chip chip--warn">
                      {sectionStatus[2].total - sectionStatus[2].filled} missing
                    </span>
                  ) : null}
                </div>

                <div className="fgrid">
                  <ComposerField
                    label="Email"
                    required
                    hint="Invite goes here"
                    name="email"
                    error={errors.email}
                    registerField={registerField}
                  >
                    <div className="field__icon-wrap">
                      <Mail size={12} className="field__icon" aria-hidden />
                      <input
                        className={`input input--with-icon ${errors.email ? "input--err" : ""}`}
                        value={form.email}
                        type="email"
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="anika.rao@school.edu"
                        aria-invalid={errors.email ? "true" : undefined}
                      />
                    </div>
                  </ComposerField>
                  <ComposerField
                    label="Phone"
                    required
                    name="phone"
                    error={errors.phone}
                    registerField={registerField}
                  >
                    <div className="field__icon-wrap">
                      <Phone size={12} className="field__icon" aria-hidden />
                      <input
                        className={`input input--with-icon mono tnum ${errors.phone ? "input--err" : ""}`}
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+91 98765 12345"
                        aria-invalid={errors.phone ? "true" : undefined}
                      />
                    </div>
                  </ComposerField>
                  <ComposerField label="Emergency contact" hint="Name and phone">
                    <input
                      className="input"
                      value={form.emergencyContact}
                      onChange={(e) => set("emergencyContact", e.target.value)}
                      placeholder="—"
                    />
                  </ComposerField>
                  <ComposerField label="Address" className="span-2">
                    <textarea
                      className="textarea"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Optional · used on official letters"
                    />
                  </ComposerField>
                </div>
              </section>

              {/* Employment */}
              <section id="composer-section-employment" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Employment</div>
                    <div className="section__hint">
                      Payroll uses these. You can edit later.
                    </div>
                  </div>
                </div>

                <div className="fgrid fgrid--3">
                  <ComposerField label="Joining date" required>
                    <div className="field__icon-wrap">
                      <CalendarIcon size={12} className="field__icon" aria-hidden />
                      <input
                        type="date"
                        className="input input--with-icon mono tnum"
                        value={form.joinDate}
                        onChange={(e) => set("joinDate", e.target.value)}
                      />
                    </div>
                  </ComposerField>
                  <ComposerField label="Employment type">
                    <select
                      className="select"
                      value={form.employmentType}
                      onChange={(e) => set("employmentType", e.target.value)}
                    >
                      {EMPLOYMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </ComposerField>
                  <ComposerField label="Monthly salary" hint="Gross · INR">
                    <div className="field__icon-wrap">
                      <IndianRupee size={12} className="field__icon" aria-hidden />
                      <input
                        className="input input--with-icon input--with-suffix mono tnum"
                        value={form.salary}
                        onChange={(e) => set("salary", e.target.value)}
                        placeholder="58000"
                      />
                      <span className="field__suffix">/ month</span>
                    </div>
                  </ComposerField>
                </div>

                <div className="row gap-2" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="disclosure"
                    onClick={() =>
                      toast(
                        "Bank, PAN, and PF details — open the Edit drawer after invite."
                      )
                    }
                  >
                    <Plus size={11} />
                    Add bank, PAN, and PF details
                  </button>
                </div>
              </section>

            </div>
          </div>

          {/* Foot */}
          <div className="composer__foot">
            <div className="composer__progress">
              <span className="mono tnum">
                {totalFilled} of {totalFields} fields
              </span>
              <div className="composer__progress-bar">
                <div
                  className="composer__progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {hasChanges && <span className="subtle">· unsaved</span>}
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="btn btn--ghost subtle"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => toast.success("Draft saved locally")}
              disabled={!canEdit}
            >
              Save draft
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleSubmit}
              disabled={isSubmitting || !canEdit}
            >
              {isSubmitting
                ? (editingStaff ? "Updating…" : "Creating…")
                : (editingStaff ? "Save changes" : "Continue to invite")}
              {!isSubmitting && <ChevronRight size={11} />}
            </button>
          </div>
        </div>

      {/* Discard-confirm */}
      {showConfirmClose && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15,15,20,0.42)",
            display: "grid",
            placeItems: "center",
          }}
          onClick={cancelClose}
        >
          <div
            role="alertdialog"
            aria-label="Discard unsaved changes"
            style={{
              width: "min(380px, calc(100% - 32px))",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {t("pages.unsavedChanges", "Unsaved changes")}
            </div>
            <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: 13 }}>
              You have unsaved changes. Close without saving?
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <button type="button" className="btn" onClick={cancelClose}>
                Keep editing
              </button>
              <button
                type="button"
                className="btn btn--accent"
                onClick={confirmClose}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reused side modals */}
      {showRevokeModal && (
        <RevokeRoleModal
          isOpen={showRevokeModal}
          onClose={() => setShowRevokeModal(false)}
          onConfirm={() => {
            selfRevokeConfirmed.current = true;
            setShowRevokeModal(false);
            handleSubmit();
          }}
        />
      )}
      {showClassSubjectModal && createdStaffId && (
        <ClassSubjectManagementModal
          isOpen={showClassSubjectModal}
          onClose={() => {
            setShowClassSubjectModal(false);
            onClose();
          }}
          staffId={createdStaffId}
          staffName={createdStaffName}
        />
      )}
    </div>,
    document.body
  );
});

function ComposerField({
  label,
  required,
  hint,
  error,
  className = "",
  name,
  registerField,
  children,
}) {
  const hintId = name ? `${name}-hint` : undefined;
  const errorId = name && error ? `${name}-error` : undefined;
  return (
    <div
      className={`field ${className}`}
      ref={name && registerField ? registerField(name) : undefined}
    >
      <label className="field__label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? (
        <span
          id={errorId}
          role="alert"
          className="field__hint"
          style={{ color: "var(--danger)" }}
        >
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

function ComposerAvatar({ previewUrl, initials, name }) {
  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt="Profile"
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  // Same oklch two-hue formula as PhotoAvatar / the design system —
  // every name gets a unique gradient. Empty/"?" placeholder still
  // gets a subtle neutral surface so it reads as "awaiting input"
  // instead of an arbitrarily-coloured disc.
  const trimmed = (name || "").trim();
  const showGradient = trimmed.length > 0 && initials !== "?";
  const code1 = trimmed.charCodeAt(0) || 63;
  const code2 = trimmed.charCodeAt(1 % Math.max(trimmed.length, 1)) || 63;
  const hue1 = (code1 * 7) % 360;
  const hue2 = (code2 * 11) % 360;
  const background = showGradient
    ? `linear-gradient(135deg, oklch(70% 0.14 ${hue1}), oklch(55% 0.16 ${hue2}))`
    : "var(--surface-2)";
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        background,
        border: showGradient ? "none" : "1px solid var(--border)",
        display: "grid",
        placeItems: "center",
        color: showGradient ? "var(--surface)" : "var(--fg-muted)",
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "role", label: "Role & teaching" },
  { id: "contact", label: "Contact" },
  { id: "employment", label: "Employment" },
  { id: "access", label: "System access" },
  { id: "review", label: "Review & invite" },
];

export default AddStaffComposer;

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
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import RevokeRoleModal from "../../components/modals/RevokeRoleModal";
import ClassSubjectManagementModal from "./components/ClassSubjectManagementModal";
import FormErrorSummary from "../../components/ui/FormErrorSummary";
import useFormErrors from "../../hooks/useFormErrors";
import { addStaffSchema, parseFormSchema } from "../../validators/formSchemas";

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
import {
  FIELD_LABELS,
  FIELD_TO_SECTION,
  SECTIONS,
} from "./components/add-staff/composerConstants";
import PersonalInfoSection from "./components/add-staff/sections/PersonalInfoSection";
import SubjectsSection from "./components/add-staff/sections/SubjectsSection";
import EmploymentSection from "./components/add-staff/sections/EmploymentSection";
import ReviewSection from "./components/add-staff/sections/ReviewSection";

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
 *
 * The shell owns wizard orchestration only — section bodies live in
 * ./sections/{PersonalInfo,Subjects,Employment,Review}Section.jsx.
 */

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
  // Zod schema (validators/formSchemas → addStaffSchema) covers every
  // required field across all four composer sections plus format checks
  // (email format, 10-digit phone) — replaces the old presence-only
  // checks. parseFormSchema maps Zod issues onto the { field: msg }
  // shape that useFormErrors already understands.
  const validate = () => {
    const { success, errors: zodErrors } = parseFormSchema(addStaffSchema, form);
    setErrors(zodErrors);
    return { ok: success, errors: zodErrors };
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

  const initials = `${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`.toUpperCase();

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="composer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Add a staff member" : "Edit staff"}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          handleClose();
        }
      }}
    >
      <button
        type="button"
        className="composer-backdrop"
        aria-label="Close"
        onClick={handleClose}
      />
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

              <PersonalInfoSection
                form={form}
                set={set}
                errors={errors}
                registerField={registerField}
                picturePreviewUrl={picturePreviewUrl}
                initials={initials}
                sectionStatusIndex={sectionStatus[0]}
              />

              <SubjectsSection
                form={form}
                set={set}
                errors={errors}
                registerField={registerField}
                departments={departments}
                classDraft={classDraft}
                setClassDraft={setClassDraft}
                addClass={addClass}
                removeClass={removeClass}
                availableClasses={availableClasses}
              />

              <EmploymentSection
                form={form}
                set={set}
                errors={errors}
                registerField={registerField}
                sectionStatusIndex={sectionStatus[2]}
              />

              <ReviewSection />
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
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Discard unsaved changes"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancelClose();
            }
          }}
        >
          <button
            type="button"
            aria-label="Cancel close"
            onClick={cancelClose}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: "rgba(15,15,20,0.42)",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
            }}
          />
          <div
            role="alertdialog"
            aria-label="Discard unsaved changes"
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(380px, calc(100% - 32px))",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              padding: 18,
            }}
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

export default AddStaffComposer;

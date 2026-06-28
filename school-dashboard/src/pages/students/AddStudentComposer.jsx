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
  FileText,
  User,
  GraduationCap,
  Phone,
  Users,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";

import FormErrorSummary from "../../components/ui/FormErrorSummary";
import useFormErrors from "../../hooks/useFormErrors";
import useDOBValidation from "./hooks/useDOBValidation";
import useStudentSubmit from "./hooks/useStudentSubmit";
import useStudentFormState from "./hooks/useStudentFormState";
import useStudentSectionStatus from "./hooks/useStudentSectionStatus";
import useDocumentConfigs from "./hooks/useDocumentConfigs";
import {
  validateStep as validateStepExtracted,
  isoToDdmmyy,
} from "./utils/studentFormValidation";
import { FIELD_LABELS, FIELD_TO_SECTION } from "./utils/studentComposerFields";
import { validateFileType } from "../../utils/fileValidation";
import logger from "../../utils/logger";

import IdentitySection from "./components/add-student/sections/IdentitySection";
import ClassSection from "./components/add-student/sections/ClassSection";
import ContactSection from "./components/add-student/sections/ContactSection";
import ParentsSection from "./components/add-student/sections/ParentsSection";
import HealthSection from "./components/add-student/sections/HealthSection";
import DocumentsSection from "./components/add-student/sections/DocumentsSection";
import ComposerNav from "./components/add-student/ComposerNav";
import ComposerFoot from "./components/add-student/ComposerFoot";
import DiscardConfirmDialog from "./components/add-student/DiscardConfirmDialog";

/**
 * AddStudentComposer — composer-style student create/edit flow
 * (mirrors AddStaffComposer / REVAMP-11).
 *
 * Six sections in a frosted overlay:
 *   identity → class → contact → parents → health → documents
 *
 * Each section lives in its own file under
 * `pages/students/components/add-student/sections/`. This file owns the
 * wizard shell, step orchestration, validation, and the forwardRef API.
 * Form state, the empty form, and per-section array CRUD are owned by
 * `useStudentFormState`.
 *
 * DOB is stored in ISO (YYYY-MM-DD) to avoid the timezone bug that the
 * legacy DD/MM/YYYY string flow had — Date() parses YYYY-MM-DD as UTC.
 * Validation is delegated to the existing Zod-backed `validateStep`
 * helper after converting DOB into the DD/MM/YYYY form it expects.
 */

const SECTIONS = [
  { id: "identity", label: "Identity", icon: User },
  { id: "class", label: "Class & roll", icon: GraduationCap },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "parents", label: "Parents & siblings", icon: Users },
  { id: "health", label: "Health & safety", icon: Heart },
  { id: "documents", label: "Documents", icon: FileText },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const AddStudentComposer = forwardRef(function AddStudentComposer(
  { onClose, onSave, classesWithTeachers = [], initialData = null },
  ref
) {
  const isCreate = !initialData;

  const {
    errors,
    setErrors,
    clearFieldError,
    registerField,
    focusFirstError,
    mapServerErrors,
  } = useFormErrors();
  const { dobValidation, validateDOBInRealTime: validateDOBHook } = useDOBValidation();
  const { isSubmitting, handleSubmit: submitHandler } = useStudentSubmit();

  const {
    form,
    set,
    updateParent,
    addParent,
    removeParent,
    updateSibling,
    addSibling,
    removeSibling,
    updateHealthInfoItem,
    addHealthInfoItem,
    removeHealthInfoItem,
    uniqueClassNames,
    availableSections,
    picturePreviewUrl,
  } = useStudentFormState({ initialData, classesWithTeachers, clearFieldError });

  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");
  const initialFormSnapshot = useRef(null);
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
      /* no-op */
    }
  }, []);

  const pictureInputRef = useRef(null);
  const mainRef = useRef(null);
  const fileRefs = useRef({});

  const { isDocRequired } = useDocumentConfigs();

  // Snapshot for unsaved detection (after settle so async hydration doesn't dirty it)
  useEffect(() => {
    const timer = setTimeout(() => {
      initialFormSnapshot.current = JSON.stringify(form);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track unsaved + persist draft
  useEffect(() => {
    if (!initialFormSnapshot.current) return;
    const current = JSON.stringify(form);
    setHasChanges(current !== initialFormSnapshot.current);
    if (isCreate && current !== initialFormSnapshot.current) {
      try {
        sessionStorage.setItem("student-form-draft", current);
      } catch {
        /* storage full */
      }
    }
  }, [form, isCreate]);

  // Restore draft for new students
  useEffect(() => {
    if (!isCreate) return;
    try {
      const draft = sessionStorage.getItem("student-form-draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        // Hydration is fine — useStudentFormState builds initial from initialData,
        // and we merge any draft on top.
        Object.entries(parsed).forEach(([k, v]) => set(k, v));
      }
    } catch {
      /* corrupt — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- File handlers -----------------------------------------------------
  const handleFile = (field, file) => {
    if (!file) return;
    const mimeError = validateFileType(file);
    if (mimeError) {
      toast.error(mimeError);
      return;
    }
    const maxSize = file.type?.startsWith("image/") ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
    if (file.size > maxSize) {
      toast.error(
        `File size must be less than ${file.type?.startsWith("image/") ? "5MB" : "10MB"}`
      );
      return;
    }
    set(field, file);
  };

  const handleMultiFile = (field, files) => {
    if (!files?.length) return;
    const valid = Array.from(files).filter((f) => {
      const err = validateFileType(f);
      if (err) {
        toast.error(err);
        return false;
      }
      const maxSize = f.type?.startsWith("image/") ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
      if (f.size > maxSize) {
        toast.error(`${f.name} exceeds the size limit`);
        return false;
      }
      return true;
    });
    if (valid.length) set(field, [...(form[field] || []), ...valid]);
  };

  // ---- Photo preview lifecycle -----------------------------------------
  useEffect(() => {
    return () => {
      if (form.picture instanceof File && picturePreviewUrl)
        URL.revokeObjectURL(picturePreviewUrl);
    };
  }, [form.picture, picturePreviewUrl]);

  // ---- Section status ----------------------------------------------------
  const { sectionStatus, totalFilled, totalFields, progressPct } = useStudentSectionStatus(
    form,
    initialData,
    SECTIONS
  );

  // ---- Scroll-spy --------------------------------------------------------
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const targets = SECTIONS.map((s) =>
      document.getElementById(`student-section-${s.id}`)
    ).filter(Boolean);
    if (!targets.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace("student-section-", "");
          setActiveSection(id);
        }
      },
      { root, rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.1, 0.5] }
    );
    targets.forEach((tgt) => obs.observe(tgt));
    return () => obs.disconnect();
  }, []);

  const goToSection = useCallback((id) => {
    setActiveSection(id);
    document
      .getElementById(`student-section-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ---- Close handling ----------------------------------------------------
  const handleClose = () => {
    if (hasChanges) setShowConfirmClose(true);
    else onClose();
  };
  const confirmClose = () => {
    setShowConfirmClose(false);
    try {
      sessionStorage.removeItem("student-form-draft");
    } catch {
      /* no-op */
    }
    onClose();
  };
  useImperativeHandle(ref, () => ({
    attemptClose: handleClose,
    hasUnsavedChanges: () => hasChanges,
  }));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !showConfirmClose) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirmClose, hasChanges]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ---- Validation adapter -----------------------------------------------
  // useStudentSubmit calls validateStep(1|2|3); convert ISO DOB to DD/MM/YYYY
  // first so the Zod schema (which expects DD/MM/YYYY) accepts it.
  const validateStepAdapter = useCallback(
    (stepNum) => {
      const dataForValidator = {
        ...form,
        dateOfBirth: form.dateOfBirth ? isoToDdmmyy(form.dateOfBirth) : "",
      };

      if (stepNum === 3) {
        const newErrors = {};
        const existingDocs = initialData?.documents || [];
        const hasExisting = (category) => existingDocs.some((d) => d.category === category);
        if (isDocRequired("birthCertificate") && !form.birthCertificate && !hasExisting("birthCertificate"))
          newErrors.birthCertificate = "Birth certificate is required";
        if (isDocRequired("transferCertificate") && !form.transferCertificate && !hasExisting("transferCertificate"))
          newErrors.transferCertificate = "Transfer certificate is required";
        if (isDocRequired("aadhaarFront") && !form.aadhaarFront && !hasExisting("aadhaarCard"))
          newErrors.aadhaarFront = "Aadhaar front is required";
        if (isDocRequired("aadhaarBack") && !form.aadhaarBack && !hasExisting("aadhaarCard"))
          newErrors.aadhaarBack = "Aadhaar back is required";
        setErrors(newErrors);
        return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
      }

      const result = validateStepExtracted(stepNum, dataForValidator);
      setErrors(result.errors);
      return result;
    },
    [form, initialData, isDocRequired, setErrors]
  );

  // ---- DOB real-time check (age sanity) ----------------------------------
  useEffect(() => {
    if (!form.dateOfBirth) return;
    const ddmmyy = isoToDdmmyy(form.dateOfBirth);
    if (ddmmyy) validateDOBHook(ddmmyy, setErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dateOfBirth]);

  // ---- Submit ------------------------------------------------------------
  const focusFirstErrorWithSection = useCallback(
    (errorMap) => {
      const firstKey = Object.keys(errorMap)[0];
      if (firstKey && FIELD_TO_SECTION[firstKey]) {
        goToSection(FIELD_TO_SECTION[firstKey]);
        setTimeout(() => focusFirstError(errorMap), 80);
      } else {
        focusFirstError(errorMap);
      }
    },
    [focusFirstError, goToSection]
  );

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      await submitHandler(e, form, {
        classesWithTeachers,
        initialData,
        validateStep: validateStepAdapter,
        setStep: (stepNum) => {
          const map = { 1: "identity", 2: "parents", 3: "documents" };
          goToSection(map[stepNum] || "identity");
        },
        scrollContainerRef: mainRef,
        scrollToError: (_stepNum, errorObj) => {
          focusFirstErrorWithSection(errorObj || {});
        },
        onSave: async (payload) => {
          try {
            const result = await onSave(payload);
            try {
              sessionStorage.removeItem("student-form-draft");
            } catch {
              /* no-op */
            }
            return result;
          } catch (err) {
            const { fields, message } = mapServerErrors(err);
            if (Object.keys(fields).length) {
              setErrors(fields);
              focusFirstErrorWithSection(fields);
              err._toastShown = true;
              toast.error(message || "Please fix the highlighted fields.");
            } else if (
              err?.message?.toLowerCase?.().includes("admission")
            ) {
              setErrors({ admissionId: err.message });
            }
            throw err;
          }
        },
        setHasUnsavedChanges: setHasChanges,
      });
    } catch (err) {
      logger.error("Composer submit failed:", err);
    }
  };

  const fullName = form.fullName || "";
  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
  }, [fullName]);

  return createPortal(
    <div
      className="composer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Add a student" : "Edit student"}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="composer">
        {/* Head */}
        <div className="composer__head">
          <button
            type="button"
            className="iconbtn iconbtn--24"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={13} aria-hidden />
          </button>
          <div className="composer__crumbs">
            <span>Students</span>
            <ChevronRight size={11} className="composer__crumb-sep" aria-hidden />
            <span className="here">{isCreate ? "New student" : "Edit student"}</span>
          </div>
          <div className="cmp-spacer" />
          <span className="kbd">esc</span>
        </div>

        {/* Body */}
        <div className="composer__body">
          <ComposerNav
            sectionStatus={sectionStatus}
            activeSection={activeSection}
            onGoToSection={goToSection}
            helpDismissed={helpDismissed}
            onDismissHelp={dismissHelp}
          />

          <div className="composer__main" ref={mainRef}>
            <h2 className="composer__title">
              {isCreate ? "Add a student" : "Edit student"}
            </h2>
            <p className="composer__sub">
              {isCreate
                ? "Capture admission essentials now — health, documents, and siblings can be filled in over the next few days."
                : "Update personal info, class, contact, parents, health, or documents."}
            </p>

            <FormErrorSummary
              errors={errors}
              labels={FIELD_LABELS}
              onFocusField={(name) =>
                focusFirstErrorWithSection({ [name]: errors[name] })
              }
              className="mb-4"
            />

            <IdentitySection
              form={form}
              set={set}
              errors={errors}
              dobValidation={dobValidation}
              registerField={registerField}
              pictureInputRef={pictureInputRef}
              picturePreviewUrl={picturePreviewUrl}
              initials={initials}
              fullName={fullName}
              done={sectionStatus[0].done}
              handleFile={handleFile}
            />

            <ClassSection
              form={form}
              set={set}
              errors={errors}
              registerField={registerField}
              uniqueClassNames={uniqueClassNames}
              availableSections={availableSections}
              done={sectionStatus[1].done}
            />

            <ContactSection
              form={form}
              set={set}
              errors={errors}
              registerField={registerField}
              done={sectionStatus[2].done}
            />

            <ParentsSection
              form={form}
              errors={errors}
              registerField={registerField}
              classesWithTeachers={classesWithTeachers}
              updateParent={updateParent}
              addParent={addParent}
              removeParent={removeParent}
              updateSibling={updateSibling}
              addSibling={addSibling}
              removeSibling={removeSibling}
              done={sectionStatus[3].done}
            />

            <HealthSection
              form={form}
              set={set}
              updateHealthInfoItem={updateHealthInfoItem}
              addHealthInfoItem={addHealthInfoItem}
              removeHealthInfoItem={removeHealthInfoItem}
              done={sectionStatus[4].done}
            />

            <DocumentsSection
              form={form}
              set={set}
              errors={errors}
              initialData={initialData}
              isDocRequired={isDocRequired}
              handleFile={handleFile}
              handleMultiFile={handleMultiFile}
              fileRefs={fileRefs}
              registerField={registerField}
              done={sectionStatus[5].done}
            />
          </div>
        </div>

        <ComposerFoot
          totalFilled={totalFilled}
          totalFields={totalFields}
          progressPct={progressPct}
          hasChanges={hasChanges}
          isSubmitting={isSubmitting}
          isEdit={Boolean(initialData)}
          onCancel={handleClose}
          onSaveDraft={() => {
            try {
              sessionStorage.setItem("student-form-draft", JSON.stringify(form));
              toast.success("Draft saved locally");
            } catch {
              toast.error("Couldn't save draft");
            }
          }}
          onSubmit={handleSubmit}
        />
      </div>

      {showConfirmClose && (
        <DiscardConfirmDialog
          onCancel={() => setShowConfirmClose(false)}
          onConfirm={confirmClose}
        />
      )}
    </div>,
    document.body
  );
});

export default AddStudentComposer;

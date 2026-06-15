import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useId,
  Children,
  isValidElement,
  cloneElement,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Hash,
  GraduationCap,
  User,
  Users,
  Heart,
  FileText,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import FormErrorSummary from "../../components/ui/FormErrorSummary";
import useFormErrors from "../../hooks/useFormErrors";
import useDOBValidation from "./hooks/useDOBValidation";
import useStudentSubmit from "./hooks/useStudentSubmit";
import {
  validateStep as validateStepExtracted,
  isoToDdmmyy,
  ddmmyyToIso,
} from "../../validators/studentFormValidation";
import {
  GENDERS,
  BLOOD_GROUPS,
  PARENT_RELATIONSHIPS,
  GUARDIAN_RELATIONSHIPS,
  RELIGIONS,
  CATEGORIES,
} from "../../constants/studentConstants";
import { settingsApi } from "../../services/api";
import { validateFileType } from "../../utils/fileValidation";
import logger from "../../utils/logger";

/**
 * AddStudentComposer — composer-style student create/edit flow
 * (mirrors AddStaffComposer / REVAMP-11).
 *
 * Six sections in a frosted overlay:
 *   identity → class → contact → parents → health → documents
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

const FIELD_LABELS = {
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  classGrade: "Class",
  section: "Section",
  mobile: "Mobile",
  email: "Email",
  zipCode: "PIN code",
  aadhaarNumber: "Aadhaar",
  parentName: "Parent name",
  parentPhone: "Parent phone",
  parentEmail: "Parent email",
  birthCertificate: "Birth certificate",
  transferCertificate: "Transfer certificate",
  aadhaarFront: "Aadhaar front",
  aadhaarBack: "Aadhaar back",
};

const FIELD_TO_SECTION = {
  fullName: "identity",
  dateOfBirth: "identity",
  gender: "identity",
  aadhaarNumber: "identity",
  classGrade: "class",
  section: "class",
  rollNumber: "class",
  mobile: "contact",
  email: "contact",
  zipCode: "contact",
  parentName: "parents",
  parentPhone: "parents",
  parentEmail: "parents",
  birthCertificate: "documents",
  transferCertificate: "documents",
  aadhaarFront: "documents",
  aadhaarBack: "documents",
};

const emptyForm = {
  fullName: "",
  dateOfBirth: "", // ISO YYYY-MM-DD
  gender: "Male",
  picture: null,
  aadhaarNumber: "",
  bloodGroup: "",
  nationality: "",
  religion: "",
  category: "",
  motherTongue: "",
  previousSchool: "",
  tcNumber: "",
  mediumOfInstruction: "",
  house: "",
  classGrade: "",
  section: "",
  rollNumber: "",
  mobile: "",
  isWhatsapp: true,
  whatsappNumber: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  parents: [
    {
      _key: 1,
      name: "",
      relationship: "Father",
      phone: "",
      email: "",
      occupation: "",
      isWhatsapp: true,
      isParent: true,
    },
  ],
  alternatePhone: "",
  siblings: [],
  medicalConditions: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  healthInfo: {
    allergies: [],
    medications: [],
    emergencyContacts: [],
  },
  transportRequired: false,
  hostelRequired: false,
  birthCertificate: null,
  transferCertificate: null,
  aadhaarFront: null,
  aadhaarBack: null,
  otherDocuments: [],
};

function buildInitial(initialData, classesWithTeachers) {
  if (!initialData) return emptyForm;
  let classGrade = "";
  let section = "";
  if (initialData.class) {
    const parts = String(initialData.class).split("-");
    if (parts.length === 2) {
      classGrade = parts[0];
      section = parts[1];
    } else {
      const match = classesWithTeachers.find(
        (cls) => String(cls.id) === String(initialData.classId)
      );
      if (match) {
        classGrade = match.name;
        section = match.section;
      }
    }
  }

  let normalizedReligion = initialData.religion || "";
  if (normalizedReligion && !RELIGIONS.includes(normalizedReligion)) {
    const match = RELIGIONS.find((r) =>
      r.toLowerCase().startsWith(normalizedReligion.toLowerCase())
    );
    if (match) normalizedReligion = match;
  }

  // DOB to ISO. initialData.dateOfBirth may be ISO-like with time component.
  let dob = initialData.dateOfBirth || "";
  if (dob) {
    if (/^\d{4}-\d{2}-\d{2}/.test(dob)) {
      dob = dob.slice(0, 10); // strip any time component
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
      dob = ddmmyyToIso(dob);
    }
  }

  const parents =
    initialData.parents?.length > 0
      ? initialData.parents.map((p, i) => ({
          _key: i + 1,
          name: p.name || "",
          relationship: p.relationship || "Father",
          phone: p.phone || "",
          email: p.email || "",
          occupation: p.occupation || "",
          isWhatsapp: p.isWhatsapp ?? true,
          isParent:
            p.isParent != null
              ? p.isParent
              : ["Father", "Mother"].includes(p.relationship),
        }))
      : [
          {
            _key: 1,
            name: initialData.parentName || "",
            relationship: initialData.parentRelationship || "Father",
            phone: initialData.parentPhone || "",
            email: initialData.parentEmail || "",
            occupation: initialData.parentOccupation || "",
            isWhatsapp: true,
            isParent: true,
          },
        ];

  return {
    ...emptyForm,
    ...initialData,
    fullName: initialData.name || "",
    mobile: initialData.phone || "",
    picture: initialData.photo || null,
    rollNumber: initialData.rollNo != null ? String(initialData.rollNo) : "",
    religion: normalizedReligion,
    dateOfBirth: dob,
    classGrade,
    section,
    parents,
    siblings: (initialData.siblings || []).map((s, i) => ({
      _key: i + 1,
      name: s.name || "",
      inSameSchool: s.inSameSchool ?? true,
      classId: s.classId || "",
    })),
    healthInfo: initialData.healthInfo
      ? {
          allergies: (initialData.healthInfo.allergies || []).map((a, i) => ({
            _key: i + 1,
            name: a.name || "",
            type: a.type || "",
            severity: a.severity || "",
            reaction: a.reaction || "",
            notes: a.notes || "",
          })),
          medications: (initialData.healthInfo.medications || []).map((m, i) => ({
            _key: i + 1,
            name: m.name || "",
            dosage: m.dosage || "",
            frequency: m.frequency || "",
            startDate: m.startDate || "",
            endDate: m.endDate || "",
            prescribedBy: m.prescribedBy || "",
            notes: m.notes || "",
          })),
          emergencyContacts: (initialData.healthInfo.emergencyContacts || []).map((c, i) => ({
            _key: i + 1,
            name: c.name || "",
            relationship: c.relationship || "",
            phone: c.phone || "",
            alternatePhone: c.alternatePhone || "",
            email: c.email || "",
            priority: c.priority ?? null,
          })),
        }
      : emptyForm.healthInfo,
    // Reset file inputs — existing docs come from initialData.documents
    birthCertificate: null,
    transferCertificate: null,
    aadhaarFront: null,
    aadhaarBack: null,
    otherDocuments: [],
  };
}

const AddStudentComposer = forwardRef(function AddStudentComposer(
  { onClose, onSave, classesWithTeachers = [], initialData = null },
  ref
) {
  const { t } = useTranslation();
  const isCreate = !initialData;

  const [form, setForm] = useState(() => buildInitial(initialData, classesWithTeachers));
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");
  const [documentConfigs, setDocumentConfigs] = useState([]);
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

  const pictureInputRef = useRef(null);
  const mainRef = useRef(null);
  const fileRefs = useRef({});

  // Load document config
  useEffect(() => {
    let cancelled = false;
    settingsApi
      .getDocumentConfig()
      .then((cfgs) => {
        if (!cancelled) setDocumentConfigs(cfgs || []);
      })
      .catch(() => {
        if (!cancelled) setDocumentConfigs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* corrupt — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const docConfigMap = useMemo(() => {
    const map = {};
    for (const cfg of Array.isArray(documentConfigs) ? documentConfigs : []) {
      const name = (cfg.documentName || "").toLowerCase().trim();
      if (name.includes("birth")) map.birthCertificate = cfg;
      else if (name.includes("transfer") || name.includes("tc"))
        map.transferCertificate = cfg;
      else if (name.includes("aadhaar") || name.includes("aadhar"))
        map.aadhaar = cfg;
    }
    return map;
  }, [documentConfigs]);

  const isDocRequired = useCallback(
    (key) => {
      if (key === "aadhaarFront" || key === "aadhaarBack")
        return docConfigMap.aadhaar?.isRequired || false;
      return docConfigMap[key]?.isRequired || false;
    },
    [docConfigMap]
  );

  const set = useCallback(
    (key, value) => {
      setForm((f) => ({ ...f, [key]: value }));
      clearFieldError(key);
    },
    [clearFieldError]
  );

  const uniqueClassNames = useMemo(() => {
    return Array.from(new Set(classesWithTeachers.map((c) => c.name))).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
  }, [classesWithTeachers]);

  const availableSections = useMemo(() => {
    if (!form.classGrade) return [];
    return Array.from(
      new Set(
        classesWithTeachers
          .filter((c) => c.name === form.classGrade)
          .map((c) => c.section)
      )
    ).sort();
  }, [classesWithTeachers, form.classGrade]);

  // ---- Parents helpers ---------------------------------------------------
  const updateParent = (idx, field, value) => {
    const next = form.parents.map((p, i) =>
      i === idx
        ? {
            ...p,
            [field]: value,
            // keep isParent in sync with relationship for the "I'm a parent" flag
            ...(field === "relationship"
              ? { isParent: ["Father", "Mother"].includes(value) }
              : {}),
          }
        : p
    );
    set("parents", next);
  };
  const addParent = () => {
    const nextKey = (form.parents[form.parents.length - 1]?._key || form.parents.length) + 1;
    set("parents", [
      ...form.parents,
      {
        _key: nextKey,
        name: "",
        relationship: "Guardian",
        phone: "",
        email: "",
        occupation: "",
        isWhatsapp: true,
        isParent: false,
      },
    ]);
  };
  const removeParent = (idx) => {
    if (form.parents.length <= 1) return;
    set(
      "parents",
      form.parents.filter((_, i) => i !== idx)
    );
  };

  // ---- Siblings helpers --------------------------------------------------
  const updateSibling = (idx, field, value) => {
    const next = form.siblings.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    set("siblings", next);
  };
  const addSibling = () => {
    const nextKey =
      (form.siblings[form.siblings.length - 1]?._key || form.siblings.length) + 1;
    set("siblings", [
      ...form.siblings,
      { _key: nextKey, name: "", inSameSchool: true, classId: "" },
    ]);
  };
  const removeSibling = (idx) => {
    set(
      "siblings",
      form.siblings.filter((_, i) => i !== idx)
    );
  };

  // ---- Health info helpers -----------------------------------------------
  const updateHealthInfoItem = (arrayName, idx, field, value) => {
    const next = (form.healthInfo?.[arrayName] || []).map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    set("healthInfo", { ...form.healthInfo, [arrayName]: next });
  };
  const addHealthInfoItem = (arrayName, defaultItem) => {
    const arr = form.healthInfo?.[arrayName] || [];
    const nextKey = (arr[arr.length - 1]?._key || arr.length) + 1;
    set("healthInfo", {
      ...form.healthInfo,
      [arrayName]: [...arr, { _key: nextKey, ...defaultItem }],
    });
  };
  const removeHealthInfoItem = (arrayName, idx) => {
    set("healthInfo", {
      ...form.healthInfo,
      [arrayName]: (form.healthInfo?.[arrayName] || []).filter((_, i) => i !== idx),
    });
  };

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

  // ---- Photo preview -----------------------------------------------------
  const picturePreviewUrl = useMemo(() => {
    if (form.picture instanceof File) return URL.createObjectURL(form.picture);
    return typeof form.picture === "string" && form.picture ? form.picture : null;
  }, [form.picture]);
  useEffect(() => {
    return () => {
      if (form.picture instanceof File && picturePreviewUrl)
        URL.revokeObjectURL(picturePreviewUrl);
    };
  }, [form.picture, picturePreviewUrl]);

  // ---- Section status ----------------------------------------------------
  const sectionStatus = useMemo(() => {
    const fills = {
      identity: [form.fullName, form.dateOfBirth, form.gender, form.aadhaarNumber],
      class: [form.classGrade, form.section, form.rollNumber],
      contact: [form.mobile, form.email, form.address, form.city, form.state, form.zipCode],
      parents: [form.parents?.[0]?.name, form.parents?.[0]?.phone],
      health: [
        form.bloodGroup,
        form.emergencyContactName,
        form.emergencyContactPhone,
        form.healthInfo?.allergies?.some((a) => a.name?.trim()),
        form.healthInfo?.medications?.some((m) => m.name?.trim()),
        form.healthInfo?.emergencyContacts?.some((c) => c.name?.trim() && c.phone?.trim()),
      ],
      documents: [
        form.birthCertificate || initialData?.documents?.some((d) => d.category === "birthCertificate"),
        form.transferCertificate ||
          initialData?.documents?.some((d) => d.category === "transferCertificate"),
        form.aadhaarFront ||
          form.aadhaarBack ||
          initialData?.documents?.some((d) => d.category === "aadhaarCard"),
      ],
    };
    const totals = {
      identity: 4,
      class: 3,
      contact: 6,
      parents: 2,
      health: 3,
      documents: 3,
    };
    return SECTIONS.map((s, i) => {
      const filled = (fills[s.id] || []).filter(Boolean).length;
      const total = totals[s.id] || 0;
      return {
        ...s,
        index: i,
        filled,
        total,
        done: total > 0 && filled >= total,
        countLabel: total ? `${filled} of ${total}` : "",
      };
    });
  }, [form, initialData]);

  const totalFilled = sectionStatus.reduce((acc, s) => acc + s.filled, 0);
  const totalFields = sectionStatus.reduce((acc, s) => acc + s.total, 0);
  const progressPct = totalFields
    ? Math.round((totalFilled / totalFields) * 100)
    : 0;

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
    // useStudentSubmit handles validation + upload + payload + capacity check.
    // Pass a form snapshot with DOB still in ISO — buildPayload accepts both
    // ISO and DD/MM/YYYY, and avoids TZ shifts by handling strings directly.
    try {
      await submitHandler(e, form, {
        classesWithTeachers,
        initialData,
        validateStep: validateStepAdapter,
        // When validation fails, the submit hook calls setStep + scrollToError
        // — we route that into our section navigator instead.
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
            // Map server-side validation errors back to fields
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
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={13} aria-hidden />
          </button>
          <div className="composer__crumbs">
            <span>Students</span>
            <ChevronRight size={11} style={{ color: "var(--fg-faint)" }} aria-hidden />
            <span className="here">{isCreate ? "New student" : "Edit student"}</span>
          </div>
          <div style={{ flex: 1 }} />
          <span className="kbd">esc</span>
        </div>

        {/* Body */}
        <div className="composer__body">
          {/* Section nav */}
          <nav className="composer__nav" aria-label="Sections">
            <div className="composer__nav-title">Sections</div>
            {sectionStatus.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSection(s.id)}
                className={`cnav ${activeSection === s.id ? "is-active" : ""} ${s.done ? "is-done" : ""}`}
                aria-current={activeSection === s.id ? "true" : undefined}
              >
                <span className="cnav__num" aria-hidden>
                  {s.done ? <Check size={10} strokeWidth={2.5} aria-hidden /> : s.index + 1}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>{s.label}</span>
                {s.countLabel && <span className="cnav__count">{s.countLabel}</span>}
              </button>
            ))}

            <div style={{ marginTop: "auto", paddingTop: 16 }} />
            {!helpDismissed && (
              <div className="help-banner" style={{ margin: "8px 4px 0", fontSize: 11.5 }}>
                <Sparkles size={12} style={{ marginTop: 1, flexShrink: 0 }} aria-hidden />
                <span style={{ flex: 1, minWidth: 0 }}>
                  Fill what you have — most fields can be edited later from the
                  student profile.
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

          {/* Main */}
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

            {/* Identity */}
            <section id="student-section-identity" className="section">
              <SectionHead title="Identity" hint="How they appear on the roster" done={sectionStatus[0].done} />

              <div className="avatar-up" style={{ marginBottom: 14 }}>
                <ComposerAvatar previewUrl={picturePreviewUrl} initials={initials} name={fullName} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <span style={{ fontWeight: 520 }}>Profile photo</span>
                  <span className="subtle" style={{ fontSize: 12 }}>
                    JPG or PNG · square · max 5 MB. Initials are used if none.
                  </span>
                  <div className="row gap-2" style={{ marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => pictureInputRef.current?.click()}
                    >
                      <Upload size={11} aria-hidden /> Upload
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
                    ref={pictureInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile("picture", e.target.files?.[0])}
                  />
                </div>
              </div>

              <div className="fgrid">
                <ComposerField
                  label="Full name"
                  required
                  name="fullName"
                  error={errors.fullName}
                  registerField={registerField}
                  className="span-2"
                >
                  <input
                    className={`input ${errors.fullName ? "input--err" : ""}`}
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="As on records"
                    aria-invalid={errors.fullName ? "true" : undefined}
                  />
                </ComposerField>

                <ComposerField
                  label="Date of birth"
                  required
                  name="dateOfBirth"
                  error={errors.dateOfBirth || dobValidation?.error}
                  hint={dobValidation?.warning}
                  registerField={registerField}
                >
                  <div className="field__icon-wrap">
                    <CalendarIcon size={12} className="field__icon" aria-hidden />
                    <input
                      type="date"
                      className={`input input--with-icon mono tnum ${errors.dateOfBirth ? "input--err" : ""}`}
                      value={form.dateOfBirth || ""}
                      max={new Date().toISOString().slice(0, 10)}
                      min="1900-01-01"
                      onChange={(e) => set("dateOfBirth", e.target.value)}
                    />
                  </div>
                </ComposerField>

                <ComposerField
                  label="Gender"
                  required
                  name="gender"
                  error={errors.gender}
                  registerField={registerField}
                >
                  <select
                    className={`select ${errors.gender ? "input--err" : ""}`}
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </ComposerField>

                <ComposerField
                  label="Aadhaar"
                  name="aadhaarNumber"
                  error={errors.aadhaarNumber}
                  hint="12 digits · optional"
                  registerField={registerField}
                >
                  <div className="field__icon-wrap">
                    <Hash size={12} className="field__icon" aria-hidden />
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`input input--with-icon mono tnum ${errors.aadhaarNumber ? "input--err" : ""}`}
                      value={form.aadhaarNumber}
                      onChange={(e) =>
                        set("aadhaarNumber", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="0000 0000 0000"
                    />
                  </div>
                </ComposerField>

                <ComposerField label="Blood group">
                  <select
                    className="select"
                    value={form.bloodGroup}
                    onChange={(e) => set("bloodGroup", e.target.value)}
                  >
                    <option value="">—</option>
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </ComposerField>
              </div>

              <details className="disclosure-block" style={{ marginTop: 12 }}>
                <summary className="disclosure">
                  <Plus size={11} aria-hidden />
                  Religion, category, nationality &amp; more
                </summary>
                <div className="fgrid" style={{ marginTop: 12 }}>
                  <ComposerField label="Religion">
                    <select
                      className="select"
                      value={form.religion}
                      onChange={(e) => set("religion", e.target.value)}
                    >
                      <option value="">—</option>
                      {RELIGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </ComposerField>
                  <ComposerField label="Category">
                    <select
                      className="select"
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                    >
                      <option value="">—</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </ComposerField>
                  <ComposerField label="Nationality">
                    <input
                      className="input"
                      value={form.nationality}
                      onChange={(e) => set("nationality", e.target.value)}
                      placeholder="Indian"
                    />
                  </ComposerField>
                  <ComposerField label="Mother tongue">
                    <input
                      className="input"
                      value={form.motherTongue}
                      onChange={(e) => set("motherTongue", e.target.value)}
                    />
                  </ComposerField>
                  <ComposerField label="House">
                    <input
                      className="input"
                      value={form.house}
                      onChange={(e) => set("house", e.target.value)}
                      placeholder="Red / Green / Blue…"
                    />
                  </ComposerField>
                  <ComposerField label="Medium of instruction">
                    <input
                      className="input"
                      value={form.mediumOfInstruction}
                      onChange={(e) => set("mediumOfInstruction", e.target.value)}
                      placeholder="English"
                    />
                  </ComposerField>
                </div>
              </details>
            </section>

            {/* Class */}
            <section id="student-section-class" className="section">
              <SectionHead
                title="Class & roll"
                hint="Roll number auto-suggests once class is picked."
                done={sectionStatus[1].done}
              />
              <div className="fgrid fgrid--3">
                <ComposerField
                  label="Class"
                  required
                  name="classGrade"
                  error={errors.classGrade}
                  registerField={registerField}
                >
                  <select
                    className={`select ${errors.classGrade ? "input--err" : ""}`}
                    value={form.classGrade}
                    onChange={(e) => {
                      set("classGrade", e.target.value);
                      set("section", "");
                    }}
                  >
                    <option value="">Select class</option>
                    {uniqueClassNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </ComposerField>
                <ComposerField
                  label="Section"
                  required
                  name="section"
                  error={errors.section}
                  registerField={registerField}
                >
                  <select
                    className={`select ${errors.section ? "input--err" : ""}`}
                    value={form.section}
                    onChange={(e) => set("section", e.target.value)}
                    disabled={!form.classGrade}
                  >
                    <option value="">Select section</option>
                    {availableSections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </ComposerField>
                <ComposerField label="Roll number" hint="Auto-suggested · editable">
                  <input
                    className="input mono tnum"
                    value={form.rollNumber}
                    onChange={(e) =>
                      set("rollNumber", e.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                  />
                </ComposerField>
              </div>

              <div className="fgrid" style={{ marginTop: 12 }}>
                <ComposerField label="Previous school" hint="If transferring in">
                  <input
                    className="input"
                    value={form.previousSchool}
                    onChange={(e) => set("previousSchool", e.target.value)}
                  />
                </ComposerField>
                <ComposerField label="TC number" hint="From the previous school">
                  <input
                    className="input mono"
                    value={form.tcNumber}
                    onChange={(e) => set("tcNumber", e.target.value)}
                  />
                </ComposerField>
              </div>
            </section>

            {/* Contact */}
            <section id="student-section-contact" className="section">
              <SectionHead
                title="Contact"
                hint="Used for the parent portal invite & emergency calls."
                done={sectionStatus[2].done}
              />
              <div className="fgrid">
                <ComposerField
                  label="Student mobile"
                  name="mobile"
                  error={errors.mobile}
                  registerField={registerField}
                  hint="Optional · for older students"
                >
                  <div className="field__icon-wrap">
                    <Phone size={12} className="field__icon" aria-hidden />
                    <input
                      className={`input input--with-icon mono tnum ${errors.mobile ? "input--err" : ""}`}
                      value={form.mobile}
                      onChange={(e) =>
                        set("mobile", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="10-digit"
                    />
                  </div>
                </ComposerField>
                <ComposerField
                  label="Email"
                  name="email"
                  error={errors.email}
                  registerField={registerField}
                >
                  <div className="field__icon-wrap">
                    <Mail size={12} className="field__icon" aria-hidden />
                    <input
                      type="email"
                      className={`input input--with-icon ${errors.email ? "input--err" : ""}`}
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="optional@school.edu"
                    />
                  </div>
                </ComposerField>
                <ComposerField label="Address" className="span-2">
                  <textarea
                    className="textarea"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street, area"
                  />
                </ComposerField>
                <ComposerField label="City">
                  <input
                    className="input"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </ComposerField>
                <ComposerField label="State">
                  <input
                    className="input"
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  />
                </ComposerField>
                <ComposerField
                  label="PIN code"
                  name="zipCode"
                  error={errors.zipCode}
                  registerField={registerField}
                >
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    className={`input mono tnum ${errors.zipCode ? "input--err" : ""}`}
                    value={form.zipCode}
                    onChange={(e) =>
                      set("zipCode", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="6 digits"
                  />
                </ComposerField>
                <ComposerField label="Alternate phone">
                  <input
                    className="input mono tnum"
                    value={form.alternatePhone}
                    onChange={(e) =>
                      set("alternatePhone", e.target.value.replace(/\D/g, ""))
                    }
                  />
                </ComposerField>
              </div>
            </section>

            {/* Parents */}
            <section id="student-section-parents" className="section">
              <SectionHead
                title="Parents & siblings"
                hint="At least one parent or guardian is required."
                done={sectionStatus[3].done}
              />

              {form.parents.map((p, idx) => {
                const isFirst = idx === 0;
                const relationOptions = [...PARENT_RELATIONSHIPS, ...GUARDIAN_RELATIONSHIPS, "Guardian"];
                return (
                  <div
                    key={p._key}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontWeight: 520, fontSize: 12.5 }}>
                        {isFirst ? "Primary parent / guardian" : `Contact ${idx + 1}`}
                      </span>
                      {!isFirst && (
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={() => removeParent(idx)}
                          aria-label="Remove contact"
                        >
                          <Trash2 size={11} aria-hidden /> Remove
                        </button>
                      )}
                    </div>
                    <div className="fgrid">
                      <ComposerField
                        label="Name"
                        required={isFirst}
                        name={isFirst ? "parentName" : undefined}
                        error={isFirst ? errors.parentName : errors[`additionalParentName_${idx}`]}
                        registerField={isFirst ? registerField : undefined}
                      >
                        <input
                          className={`input ${isFirst && errors.parentName ? "input--err" : ""}`}
                          value={p.name}
                          onChange={(e) => updateParent(idx, "name", e.target.value)}
                        />
                      </ComposerField>
                      <ComposerField label="Relationship">
                        <select
                          className="select"
                          value={p.relationship}
                          onChange={(e) => updateParent(idx, "relationship", e.target.value)}
                        >
                          {relationOptions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </ComposerField>
                      <ComposerField
                        label="Phone"
                        required={isFirst}
                        name={isFirst ? "parentPhone" : undefined}
                        error={isFirst ? errors.parentPhone : errors[`additionalParentPhone_${idx}`]}
                        registerField={isFirst ? registerField : undefined}
                      >
                        <div className="field__icon-wrap">
                          <Phone size={12} className="field__icon" aria-hidden />
                          <input
                            className={`input input--with-icon mono tnum ${isFirst && errors.parentPhone ? "input--err" : ""}`}
                            value={p.phone}
                            onChange={(e) =>
                              updateParent(idx, "phone", e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="10-digit"
                          />
                        </div>
                      </ComposerField>
                      <ComposerField
                        label="Email"
                        name={isFirst ? "parentEmail" : undefined}
                        error={isFirst ? errors.parentEmail : errors[`additionalParentEmail_${idx}`]}
                        registerField={isFirst ? registerField : undefined}
                      >
                        <input
                          type="email"
                          className="input"
                          value={p.email}
                          onChange={(e) => updateParent(idx, "email", e.target.value)}
                        />
                      </ComposerField>
                      <ComposerField label="Occupation">
                        <input
                          className="input"
                          value={p.occupation}
                          onChange={(e) => updateParent(idx, "occupation", e.target.value)}
                        />
                      </ComposerField>
                      <ComposerField label="WhatsApp on this phone">
                        <label className="row gap-2" style={{ alignItems: "center", height: 32 }}>
                          <input
                            type="checkbox"
                            checked={!!p.isWhatsapp}
                            onChange={(e) => updateParent(idx, "isWhatsapp", e.target.checked)}
                          />
                          <span className="subtle" style={{ fontSize: 12 }}>
                            Send updates via WhatsApp
                          </span>
                        </label>
                      </ComposerField>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="disclosure"
                onClick={addParent}
                style={{ marginTop: 4 }}
              >
                <Plus size={11} aria-hidden />
                Add another parent or guardian
              </button>

              {/* Siblings */}
              <div style={{ marginTop: 18 }}>
                <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  Siblings
                </div>
                {form.siblings.length === 0 && (
                  <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
                    Add siblings to keep family records linked.
                  </p>
                )}
                {form.siblings.map((s, idx) => (
                  <div
                    key={s._key}
                    className="fgrid fgrid--3"
                    style={{
                      marginBottom: 8,
                      padding: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                    }}
                  >
                    <ComposerField label="Name">
                      <input
                        className="input"
                        value={s.name}
                        onChange={(e) => updateSibling(idx, "name", e.target.value)}
                      />
                    </ComposerField>
                    <ComposerField label="Class (if same school)">
                      <select
                        className="select"
                        value={s.classId}
                        onChange={(e) => updateSibling(idx, "classId", e.target.value)}
                        disabled={!s.inSameSchool}
                      >
                        <option value="">—</option>
                        {classesWithTeachers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}-{c.section}
                          </option>
                        ))}
                      </select>
                    </ComposerField>
                    <ComposerField label="In this school">
                      <div className="row gap-2" style={{ alignItems: "center", height: 32 }}>
                        <label className="row gap-2" style={{ alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={!!s.inSameSchool}
                            onChange={(e) =>
                              updateSibling(idx, "inSameSchool", e.target.checked)
                            }
                          />
                          <span className="subtle" style={{ fontSize: 12 }}>
                            Yes
                          </span>
                        </label>
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={() => removeSibling(idx)}
                          aria-label="Remove sibling"
                          style={{ marginLeft: "auto" }}
                        >
                          <Trash2 size={11} aria-hidden />
                        </button>
                      </div>
                    </ComposerField>
                  </div>
                ))}
                <button
                  type="button"
                  className="disclosure"
                  onClick={addSibling}
                  style={{ marginTop: 4 }}
                >
                  <Plus size={11} aria-hidden />
                  Add sibling
                </button>
              </div>
            </section>

            {/* Health */}
            <section id="student-section-health" className="section">
              <SectionHead
                title="Health & safety"
                hint="Used for emergency dispatch and medical alerts."
                done={sectionStatus[4].done}
              />
              <div className="fgrid">
                <ComposerField label="Medical conditions / allergies" className="span-2">
                  <textarea
                    className="textarea"
                    value={form.medicalConditions}
                    onChange={(e) => set("medicalConditions", e.target.value)}
                    placeholder="None — or list allergies, conditions, medications…"
                  />
                </ComposerField>
                <ComposerField label="Emergency contact name">
                  <input
                    className="input"
                    value={form.emergencyContactName}
                    onChange={(e) => set("emergencyContactName", e.target.value)}
                  />
                </ComposerField>
                <ComposerField label="Emergency contact phone">
                  <div className="field__icon-wrap">
                    <Phone size={12} className="field__icon" aria-hidden />
                    <input
                      className="input input--with-icon mono tnum"
                      value={form.emergencyContactPhone}
                      onChange={(e) =>
                        set(
                          "emergencyContactPhone",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      placeholder="10-digit"
                    />
                  </div>
                </ComposerField>
              </div>

              {/* Allergies */}
              <div style={{ marginTop: 18 }}>
                <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  Allergies
                </div>
                {form.healthInfo?.allergies?.length === 0 && (
                  <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
                    Add allergies for medical alerts.
                  </p>
                )}
                {form.healthInfo?.allergies?.map((a, idx) => (
                  <div
                    key={a._key}
                    className="fgrid fgrid--2"
                    style={{
                      marginBottom: 8,
                      padding: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                    }}
                  >
                    <ComposerField label={`Allergy ${idx + 1} name`}>
                      <input
                        className="input"
                        value={a.name}
                        onChange={(e) =>
                          updateHealthInfoItem("allergies", idx, "name", e.target.value)
                        }
                        placeholder="e.g. Peanuts"
                      />
                    </ComposerField>
                    <ComposerField label="Type">
                      <select
                        className="select"
                        value={a.type}
                        onChange={(e) =>
                          updateHealthInfoItem("allergies", idx, "type", e.target.value)
                        }
                      >
                        <option value="">—</option>
                        <option value="food">Food</option>
                        <option value="medication">Medication</option>
                        <option value="environmental">Environmental</option>
                        <option value="insect">Insect</option>
                        <option value="latex">Latex</option>
                        <option value="other">Other</option>
                      </select>
                    </ComposerField>
                    <ComposerField label="Severity">
                      <select
                        className="select"
                        value={a.severity}
                        onChange={(e) =>
                          updateHealthInfoItem("allergies", idx, "severity", e.target.value)
                        }
                      >
                        <option value="">—</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                        <option value="life-threatening">Life-threatening</option>
                      </select>
                    </ComposerField>
                    <ComposerField label="Reaction">
                      <input
                        className="input"
                        value={a.reaction}
                        onChange={(e) =>
                          updateHealthInfoItem("allergies", idx, "reaction", e.target.value)
                        }
                        placeholder="e.g. Skin rash"
                      />
                    </ComposerField>
                    <ComposerField label="Notes" className="span-2">
                      <input
                        className="input"
                        value={a.notes}
                        onChange={(e) =>
                          updateHealthInfoItem("allergies", idx, "notes", e.target.value)
                        }
                        placeholder="Additional notes"
                      />
                    </ComposerField>
                    <div className="span-2" style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => removeHealthInfoItem("allergies", idx)}
                        aria-label={`Remove allergy ${idx + 1}`}
                      >
                        <Trash2 size={11} aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="disclosure"
                  onClick={() =>
                    addHealthInfoItem("allergies", {
                      name: "",
                      type: "",
                      severity: "",
                      reaction: "",
                      notes: "",
                    })
                  }
                  style={{ marginTop: 4 }}
                >
                  <Plus size={11} aria-hidden />
                  Add allergy
                </button>
              </div>

              {/* Medications */}
              <div style={{ marginTop: 18 }}>
                <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  Medications
                </div>
                {form.healthInfo?.medications?.length === 0 && (
                  <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
                    Add ongoing medications.
                  </p>
                )}
                {form.healthInfo?.medications?.map((m, idx) => (
                  <div
                    key={m._key}
                    className="fgrid fgrid--2"
                    style={{
                      marginBottom: 8,
                      padding: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                    }}
                  >
                    <ComposerField label={`Medication ${idx + 1} name`}>
                      <input
                        className="input"
                        value={m.name}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "name", e.target.value)
                        }
                        placeholder="e.g. Paracetamol"
                      />
                    </ComposerField>
                    <ComposerField label="Dosage">
                      <input
                        className="input"
                        value={m.dosage}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "dosage", e.target.value)
                        }
                        placeholder="e.g. 500mg"
                      />
                    </ComposerField>
                    <ComposerField label="Frequency">
                      <input
                        className="input"
                        value={m.frequency}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "frequency", e.target.value)
                        }
                        placeholder="e.g. Twice daily"
                      />
                    </ComposerField>
                    <ComposerField label="Prescribed by">
                      <input
                        className="input"
                        value={m.prescribedBy}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "prescribedBy", e.target.value)
                        }
                        placeholder="Doctor name"
                      />
                    </ComposerField>
                    <ComposerField label="Start date">
                      <input
                        className="input"
                        value={m.startDate}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "startDate", e.target.value)
                        }
                        placeholder="DD/MM/YYYY"
                      />
                    </ComposerField>
                    <ComposerField label="End date">
                      <input
                        className="input"
                        value={m.endDate}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "endDate", e.target.value)
                        }
                        placeholder="DD/MM/YYYY"
                      />
                    </ComposerField>
                    <ComposerField label="Notes" className="span-2">
                      <input
                        className="input"
                        value={m.notes}
                        onChange={(e) =>
                          updateHealthInfoItem("medications", idx, "notes", e.target.value)
                        }
                        placeholder="Additional notes"
                      />
                    </ComposerField>
                    <div className="span-2" style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => removeHealthInfoItem("medications", idx)}
                        aria-label={`Remove medication ${idx + 1}`}
                      >
                        <Trash2 size={11} aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="disclosure"
                  onClick={() =>
                    addHealthInfoItem("medications", {
                      name: "",
                      dosage: "",
                      frequency: "",
                      startDate: "",
                      endDate: "",
                      prescribedBy: "",
                      notes: "",
                    })
                  }
                  style={{ marginTop: 4 }}
                >
                  <Plus size={11} aria-hidden />
                  Add medication
                </button>
              </div>

              {/* Health Emergency Contacts */}
              <div style={{ marginTop: 18 }}>
                <div className="section__title" style={{ fontSize: 12.5, marginBottom: 6 }}>
                  Health emergency contacts
                </div>
                {form.healthInfo?.emergencyContacts?.length === 0 && (
                  <p className="subtle" style={{ fontSize: 12, marginBottom: 8 }}>
                    Add contacts for medical emergencies.
                  </p>
                )}
                {form.healthInfo?.emergencyContacts?.map((c, idx) => (
                  <div
                    key={c._key}
                    className="fgrid fgrid--2"
                    style={{
                      marginBottom: 8,
                      padding: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                    }}
                  >
                    <ComposerField label={`Contact ${idx + 1} name`}>
                      <input
                        className="input"
                        value={c.name}
                        onChange={(e) =>
                          updateHealthInfoItem("emergencyContacts", idx, "name", e.target.value)
                        }
                        placeholder="Contact name"
                      />
                    </ComposerField>
                    <ComposerField label="Relationship">
                      <input
                        className="input"
                        value={c.relationship}
                        onChange={(e) =>
                          updateHealthInfoItem("emergencyContacts", idx, "relationship", e.target.value)
                        }
                        placeholder="e.g. Uncle"
                      />
                    </ComposerField>
                    <ComposerField label="Phone">
                      <div className="field__icon-wrap">
                        <Phone size={12} className="field__icon" aria-hidden />
                        <input
                          className="input input--with-icon mono tnum"
                          value={c.phone}
                          onChange={(e) =>
                            updateHealthInfoItem(
                              "emergencyContacts",
                              idx,
                              "phone",
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="10-digit"
                        />
                      </div>
                    </ComposerField>
                    <ComposerField label="Alternate phone">
                      <div className="field__icon-wrap">
                        <Phone size={12} className="field__icon" aria-hidden />
                        <input
                          className="input input--with-icon mono tnum"
                          value={c.alternatePhone}
                          onChange={(e) =>
                            updateHealthInfoItem(
                              "emergencyContacts",
                              idx,
                              "alternatePhone",
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="10-digit"
                        />
                      </div>
                    </ComposerField>
                    <ComposerField label="Email">
                      <input
                        className="input"
                        value={c.email}
                        onChange={(e) =>
                          updateHealthInfoItem("emergencyContacts", idx, "email", e.target.value)
                        }
                        placeholder="Email address"
                      />
                    </ComposerField>
                    <ComposerField label="Priority">
                      <input
                        className="input"
                        type="number"
                        value={c.priority ?? ""}
                        onChange={(e) =>
                          updateHealthInfoItem(
                            "emergencyContacts",
                            idx,
                            "priority",
                            e.target.value ? parseInt(e.target.value) : ""
                          )
                        }
                        placeholder="e.g. 1"
                      />
                    </ComposerField>
                    <div className="span-2" style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => removeHealthInfoItem("emergencyContacts", idx)}
                        aria-label={`Remove emergency contact ${idx + 1}`}
                      >
                        <Trash2 size={11} aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="disclosure"
                  onClick={() =>
                    addHealthInfoItem("emergencyContacts", {
                      name: "",
                      relationship: "",
                      phone: "",
                      alternatePhone: "",
                      email: "",
                      priority: 1,
                    })
                  }
                  style={{ marginTop: 4 }}
                >
                  <Plus size={11} aria-hidden />
                  Add emergency contact
                </button>
              </div>

              <div className="fgrid" style={{ marginTop: 12 }}>
                <ComposerField label="Services">
                  <div className="row gap-2" style={{ alignItems: "center", height: 32 }}>
                    <label className="row gap-2" style={{ alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!form.transportRequired}
                        onChange={(e) => set("transportRequired", e.target.checked)}
                      />
                      <span className="subtle" style={{ fontSize: 12 }}>
                        Transport
                      </span>
                    </label>
                    <label className="row gap-2" style={{ alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!form.hostelRequired}
                        onChange={(e) => set("hostelRequired", e.target.checked)}
                      />
                      <span className="subtle" style={{ fontSize: 12 }}>
                        Hostel
                      </span>
                    </label>
                  </div>
                </ComposerField>
              </div>
            </section>

            {/* Documents */}
            <section id="student-section-documents" className="section">
              <SectionHead
                title="Documents"
                hint="PDF, JPG, or PNG · max 10 MB each."
                done={sectionStatus[5].done}
              />
              <div className="fgrid">
                <DocField
                  field="birthCertificate"
                  label="Birth certificate"
                  required={isDocRequired("birthCertificate")}
                  file={form.birthCertificate}
                  existing={initialData?.documents?.find((d) => d.category === "birthCertificate")}
                  onFile={(f) => handleFile("birthCertificate", f)}
                  onClear={() => set("birthCertificate", null)}
                  error={errors.birthCertificate}
                  inputRef={(el) => (fileRefs.current.birthCertificate = el)}
                  registerField={registerField}
                />
                <DocField
                  field="transferCertificate"
                  label="Transfer certificate"
                  required={isDocRequired("transferCertificate")}
                  file={form.transferCertificate}
                  existing={initialData?.documents?.find((d) => d.category === "transferCertificate")}
                  onFile={(f) => handleFile("transferCertificate", f)}
                  onClear={() => set("transferCertificate", null)}
                  error={errors.transferCertificate}
                  inputRef={(el) => (fileRefs.current.transferCertificate = el)}
                  registerField={registerField}
                />
                <DocField
                  field="aadhaarFront"
                  label="Aadhaar (front)"
                  required={isDocRequired("aadhaarFront")}
                  file={form.aadhaarFront}
                  existing={
                    initialData?.documents?.find((d) => d.category === "aadhaarCard")?.front
                  }
                  onFile={(f) => handleFile("aadhaarFront", f)}
                  onClear={() => set("aadhaarFront", null)}
                  error={errors.aadhaarFront}
                  inputRef={(el) => (fileRefs.current.aadhaarFront = el)}
                  registerField={registerField}
                />
                <DocField
                  field="aadhaarBack"
                  label="Aadhaar (back)"
                  required={isDocRequired("aadhaarBack")}
                  file={form.aadhaarBack}
                  existing={
                    initialData?.documents?.find((d) => d.category === "aadhaarCard")?.back
                  }
                  onFile={(f) => handleFile("aadhaarBack", f)}
                  onClear={() => set("aadhaarBack", null)}
                  error={errors.aadhaarBack}
                  inputRef={(el) => (fileRefs.current.aadhaarBack = el)}
                  registerField={registerField}
                />

                <ComposerField label="Other documents" className="span-2" hint="Add transcripts, certificates, etc.">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleMultiFile("otherDocuments", e.target.files)}
                    className="input"
                    style={{ padding: 6 }}
                  />
                  {form.otherDocuments?.length > 0 && (
                    <ul style={{ marginTop: 6, fontSize: 12, color: "var(--fg-muted)" }}>
                      {form.otherDocuments.map((f, i) => (
                        <li key={`${f.name}-${f.size}-${i}`} className="row gap-2" style={{ alignItems: "center" }}>
                          <FileText size={11} aria-hidden />
                          <span style={{ flex: 1 }}>{f.name}</span>
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            onClick={() =>
                              set(
                                "otherDocuments",
                                form.otherDocuments.filter((_, j) => j !== i)
                              )
                            }
                            aria-label={`Remove ${f.name}`}
                          >
                            <X size={10} aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </ComposerField>
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
              <div className="composer__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            {hasChanges && <span className="subtle">· unsaved</span>}
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn--ghost subtle" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              try {
                sessionStorage.setItem("student-form-draft", JSON.stringify(form));
                toast.success("Draft saved locally");
              } catch {
                toast.error("Couldn't save draft");
              }
            }}
          >
            Save draft
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? initialData
                ? "Updating…"
                : "Creating…"
              : initialData
                ? "Save changes"
                : "Add student"}
            {!isSubmitting && <ChevronRight size={11} aria-hidden />}
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
          onClick={() => setShowConfirmClose(false)}
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
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowConfirmClose(false)}
              >
                Keep editing
              </button>
              <button type="button" className="btn btn--accent" onClick={confirmClose}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
});

function SectionHead({ title, hint, done }) {
  return (
    <div className="section__head">
      <div>
        <div className="section__title">{title}</div>
        {hint && <div className="section__hint">{hint}</div>}
      </div>
      {done && (
        <span className="chip chip--ok">
          <Check size={9} strokeWidth={2.5} aria-hidden /> Looks good
        </span>
      )}
    </div>
  );
}

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
  const baseId = useId();
  const fieldId = name ? `field-${name}-${baseId}` : baseId;
  const hintId = hint || error ? `${fieldId}-hint` : undefined;

  // Recursively clone children to attach id / aria-describedby to the first
  // input, select, or textarea so the label is programmatically associated.
  const attachIds = (child) => {
    if (!isValidElement(child)) return child;
    const type = child.type;
    const isFormControl =
      type === "input" || type === "select" || type === "textarea";
    if (isFormControl) {
      return cloneElement(child, {
        id: fieldId,
        "aria-describedby": hintId || child.props?.["aria-describedby"],
      });
    }
    const childChildren = child.props?.children;
    if (childChildren) {
      return cloneElement(child, {
        children: Children.map(childChildren, attachIds),
      });
    }
    return child;
  };

  return (
    <div
      className={`field ${className}`}
      ref={name && registerField ? registerField(name) : undefined}
    >
      <label className="field__label" htmlFor={fieldId}>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {Children.map(children, attachIds)}
      {error ? (
        <span id={hintId} role="alert" className="field__hint" style={{ color: "var(--danger)" }}>
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
        color: showGradient ? "white" : "var(--fg-muted)",
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

function DocField({
  field,
  label,
  required,
  file,
  existing,
  onFile,
  onClear,
  error,
  inputRef,
  registerField,
}) {
  const baseId = useId();
  const fieldId = `docfile-${field}-${baseId}`;
  const hintId = error ? `${fieldId}-hint` : undefined;
  const hasNew = file instanceof File;
  const existingUrl =
    typeof existing === "string"
      ? existing
      : existing?.url || existing?.front?.url || existing?.back?.url;
  const displayName = hasNew ? file.name : existing?.name || (existingUrl ? "Uploaded" : "");

  return (
    <div className="field" ref={registerField ? registerField(field) : undefined}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
        {required && <span className="req">*</span>}
      </label>
      <div
        className="row gap-2"
        style={{
          alignItems: "center",
          padding: 8,
          border: `1px ${error ? "solid var(--danger)" : "dashed var(--border-strong)"}`,
          borderRadius: 6,
          background: "var(--surface)",
        }}
      >
        <FileText size={12} style={{ color: "var(--fg-faint)" }} aria-hidden />
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: displayName ? "var(--fg)" : "var(--fg-faint)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName || "No file"}
        </span>
        {existingUrl && !hasNew && (
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--sm btn--ghost"
          >
            View
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files?.[0])}
          id={fieldId}
          aria-describedby={hintId}
        />
        <label htmlFor={fieldId} className="btn btn--sm" style={{ cursor: "pointer" }}>
          <Upload size={11} aria-hidden /> {hasNew || existingUrl ? "Replace" : "Upload"}
        </label>
        {hasNew && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClear} aria-label="Clear">
            <X size={10} aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <span id={hintId} role="alert" className="field__hint" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default AddStudentComposer;

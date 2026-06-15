import { useCallback, useMemo, useState } from "react";
import { RELIGIONS } from "../../../constants/studentConstants";
import { ddmmyyToIso } from "../utils/studentFormValidation";

const emptyForm = {
  fullName: "",
  dateOfBirth: "",
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

  let dob = initialData.dateOfBirth || "";
  if (dob) {
    if (/^\d{4}-\d{2}-\d{2}/.test(dob)) {
      dob = dob.slice(0, 10);
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
    birthCertificate: null,
    transferCertificate: null,
    aadhaarFront: null,
    aadhaarBack: null,
    otherDocuments: [],
  };
}

/**
 * Owns the composer form state plus the per-section array CRUD
 * (parents, siblings, healthInfo.{allergies,medications,emergencyContacts}).
 * Returns the form, the typed `set(key, value)` updater, all section
 * array helpers, and the derived class/section lists. The shape of the
 * returned object is consumed by AddStudentComposer and forwarded as
 * props to the section files.
 */
export default function useStudentFormState({ initialData, classesWithTeachers, clearFieldError }) {
  const [form, setForm] = useState(() => buildInitial(initialData, classesWithTeachers));

  const set = useCallback(
    (key, value) => {
      setForm((f) => ({ ...f, [key]: value }));
      clearFieldError(key);
    },
    [clearFieldError]
  );

  // ---- Parents -----------------------------------------------------------
  const updateParent = (idx, field, value) => {
    const next = form.parents.map((p, i) =>
      i === idx
        ? {
            ...p,
            [field]: value,
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

  // ---- Siblings ----------------------------------------------------------
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

  // ---- Health info -------------------------------------------------------
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

  // ---- Derived class lists ----------------------------------------------
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

  // ---- Photo preview -----------------------------------------------------
  const picturePreviewUrl = useMemo(() => {
    if (form.picture instanceof File) return URL.createObjectURL(form.picture);
    return typeof form.picture === "string" && form.picture ? form.picture : null;
  }, [form.picture]);

  return {
    form,
    setForm,
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
  };
}

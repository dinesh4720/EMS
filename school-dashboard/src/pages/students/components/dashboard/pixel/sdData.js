// Maps real student / API data into the exact view shapes the pixel-perfect
// Student Dashboard design expects. Pure data — no JSX. Where the backend has
// no value yet, fields resolve to "—" so the layout never collapses.

import { formatCurrency, formatDateShort } from "../utils";

export { formatCurrency, formatDateShort };

// Fixed Indigo accent (the design's default preview accent).
export const ACCENT = {
  acc: "#4f46e5",
  ring: "rgba(79,70,229,.13)",
  band: "color-mix(in srgb, #4f46e5 9%, var(--surface))",
  avBg: "#ece9fb",
  avFg: "#4f46e5",
};

export const DASH = "—";

// First defined, non-empty value among the candidates.
export function val(...cands) {
  for (const c of cands) {
    if (c !== undefined && c !== null && String(c).trim() !== "") return c;
  }
  return DASH;
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Grade tone / badge background / letter for a 0–100 score (design's gradeOf).
export function gradeOf(sc) {
  const n = Number(sc);
  const tone = n >= 90 ? "var(--ok)" : n >= 75 ? "var(--warn)" : "var(--danger)";
  const gradeBg = n >= 90 ? "var(--ok-bg)" : n >= 75 ? "var(--warn-bg)" : "var(--danger-bg)";
  const grade = n >= 95 ? "A+" : n >= 90 ? "A" : n >= 80 ? "B+" : n >= 70 ? "B" : "C";
  return { tone, gradeBg, grade };
}

// Subjects → design rows (name, score, avg, grade, tone, gradeBg, barW).
export function buildSubjectRows(subjects) {
  return (Array.isArray(subjects) ? subjects : []).map((s) => {
    const score = Number(s.grade ?? s.score ?? 0);
    const g = gradeOf(score);
    const avg = s.classAvg ?? s.avg ?? null;
    return {
      name: s.name || DASH,
      score: Number.isFinite(score) ? String(score) : DASH,
      scoreNum: Number.isFinite(score) ? score : 0,
      avg: avg != null ? String(avg) : DASH,
      barW: `${Math.max(0, Math.min(100, score))}%`,
      ...g,
    };
  });
}

// 35-cell (5-week) attendance heatmap from the raw attendance log.
// 0 holiday/none · 1 present · 2 absent · 3 leave  → design colour map.
const HEAT_BG = {
  0: "var(--panel)",
  1: "var(--ok)",
  2: "var(--danger)",
  3: "var(--warn)",
};
export function buildHeat35(attendanceData) {
  const byDate = new Map();
  for (const r of Array.isArray(attendanceData) ? attendanceData : []) {
    if (!r?.date) continue;
    const key = String(r.date).slice(0, 10);
    const st = String(r.status || "").toLowerCase();
    if (st === "present" || st === "p") byDate.set(key, 1);
    else if (st === "absent" || st === "a") byDate.set(key, 2);
    else if (st === "leave" || st === "l") byDate.set(key, 3);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const code = byDate.get(key) ?? 0;
    cells.push({ bg: HEAT_BG[code] });
  }
  return cells;
}

// Sidebar KPI stack.
export function buildKpis({ attendancePct, gpa, rank, classSize, feeStatus, feeBalance }) {
  const rankVal = rank != null ? String(rank) : DASH;
  const feePaid = String(feeStatus || "").toLowerCase() === "paid" || (feeBalance != null && Number(feeBalance) <= 0);
  return [
    {
      label: "Attendance",
      value: attendancePct != null ? String(attendancePct) : DASH,
      suffix: attendancePct != null ? "%" : "",
      tone: "var(--ok)",
    },
    {
      label: "GPA",
      value: gpa != null ? String(gpa) : DASH,
      suffix: gpa != null ? "/10" : "",
      tone: "var(--tx)",
    },
    {
      label: "Class rank",
      value: rankVal,
      suffix: rankVal !== DASH && classSize ? `/${classSize}` : "",
      tone: "var(--tx)",
    },
    {
      label: "Fees",
      value: feePaid ? "Paid" : feeBalance != null ? formatCurrency(feeBalance) : DASH,
      suffix: "",
      tone: feePaid ? "var(--ok)" : feeBalance > 0 ? "var(--danger)" : "var(--tx)",
    },
  ];
}

// Sidebar "Personal" rows.
export function buildPersonal(student) {
  return [
    { label: "Date of birth", value: student?.dob ? formatDateShort(student.dob) : DASH },
    { label: "Age", value: student?.age != null ? `${student.age} yrs` : DASH },
    { label: "Gender", value: val(student?.gender) },
    { label: "Blood group", value: val(student?.bloodGroup) },
    { label: "Admitted", value: student?.admissionDate ? formatDateShort(student.admissionDate) : DASH },
  ];
}

// About-tab field groups.
export function buildAbout(student, { className, classSize } = {}) {
  const identity = [
    { label: "Full name", value: val(student?.name) },
    { label: "Admission ID", value: val(student?.admissionId, student?.studentId), mono: true },
    { label: "Date of birth", value: student?.dob ? formatDateShort(student.dob) : DASH },
    { label: "Age", value: student?.age != null ? `${student.age} years` : DASH },
    { label: "Gender", value: val(student?.gender) },
    { label: "Blood group", value: val(student?.bloodGroup) },
    { label: "Aadhaar", value: val(student?.aadhaar, student?.aadhaarNumber), mono: true },
    { label: "Religion", value: val(student?.religion) },
    { label: "Category", value: val(student?.category) },
    { label: "Nationality", value: val(student?.nationality) },
    { label: "Mother tongue", value: val(student?.motherTongue) },
    { label: "House", value: val(student?.house) },
  ];
  const enrolment = [
    { label: "Class & section", value: val(className, student?.className) },
    { label: "Roll number", value: val(student?.rollNo, student?.rollNumber), mono: true },
    { label: "Admission date", value: student?.admissionDate ? formatDateShort(student.admissionDate) : DASH },
    { label: "Academic year", value: val(student?.academicYear) },
    { label: "Medium", value: val(student?.medium) },
    { label: "Previous school", value: val(student?.previousSchool) },
  ];
  const contact = [
    { label: "Student phone", value: val(student?.phone, student?.studentPhone) },
    { label: "Email", value: val(student?.email) },
    { label: "Address", value: val(student?.address), full: true },
    { label: "City", value: val(student?.city) },
    { label: "State", value: val(student?.state) },
    { label: "PIN", value: val(student?.pincode, student?.pin), mono: true },
  ];
  const health = [
    { label: "Medical conditions", value: val(student?.medicalConditions) },
    { label: "Emergency contact", value: val(student?.emergencyContact, student?.emergencyContactName) },
    { label: "Transport", value: val(student?.transport, student?.transportRoute) },
    { label: "Hostel", value: val(student?.hostel, student?.hostelStatus) },
  ];
  const allergies = Array.isArray(student?.allergies)
    ? student.allergies.filter(Boolean)
    : typeof student?.allergies === "string" && student.allergies.trim()
    ? student.allergies.split(",").map((a) => a.trim()).filter(Boolean)
    : [];
  return { identity, enrolment, contact, health, allergies };
}

// Parents & guardians cards for the About tab.
export function buildParents(student) {
  if (Array.isArray(student?.parents) && student.parents.length > 0) {
    return student.parents.map((p) => ({
      role: val(p.relationship, p.role),
      name: val(p.name),
      initials: initials(p.name),
      phone: val(p.phone),
      email: val(p.email),
      occupation: val(p.occupation),
    }));
  }
  if (student?.parentName || student?.parentPhone || student?.parentEmail) {
    return [
      {
        role: val(student.parentRelationship, "Guardian"),
        name: val(student.parentName),
        initials: initials(student.parentName),
        phone: val(student.parentPhone),
        email: val(student.parentEmail),
        occupation: val(student.parentOccupation),
      },
    ];
  }
  return [];
}

export function buildSiblings(student) {
  const sibs = student?.siblings;
  if (!Array.isArray(sibs)) return [];
  return sibs.filter(Boolean).map((s) => ({
    name: val(s.name),
    initials: initials(s.name),
    rel: val(s.relationship, s.rel),
    cls: val(s.className, s.cls),
  }));
}

// Fee stat cards + breakdown rows for the Fees tab.
export function buildFees(feeStructure) {
  const total = feeStructure?.totalFee ?? feeStructure?.totalAmount ?? null;
  const paid = feeStructure?.paidAmount ?? 0;
  const balance = feeStructure?.balanceAmount ?? (total != null ? total - paid : null);
  const stats = [
    { label: "Total billed", value: total != null ? formatCurrency(total) : DASH, tone: "var(--tx)" },
    { label: "Paid", value: formatCurrency(paid), tone: "var(--ok)" },
    {
      label: "Balance",
      value: balance != null ? formatCurrency(balance) : DASH,
      tone: balance > 0 ? "var(--danger)" : "var(--tx)",
    },
  ];
  const rawItems = feeStructure?.items || feeStructure?.feeHeads || feeStructure?.breakdown || [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((it) => {
    const itPaid = String(it.status || it.feeStatus || "").toLowerCase() === "paid" || (it.balance != null && Number(it.balance) <= 0);
    return {
      name: val(it.name, it.head, it.feeHead, it.title),
      due: val(it.due, it.dueLabel, it.dueDate && formatDateShort(it.dueDate)),
      amount: it.amount != null ? formatCurrency(it.amount) : it.total != null ? formatCurrency(it.total) : DASH,
      statusLabel: itPaid ? "Paid" : val(it.status, "Due"),
      tone: itPaid ? "var(--ok)" : "var(--warn)",
      bg: itPaid ? "var(--ok-bg)" : "var(--warn-bg)",
    };
  });
  return { stats, items };
}

// Document cards (icon colours rotate as in the design).
const DOC_THEMES = [
  { iconBg: "var(--danger-bg)", iconColor: "var(--danger)" },
  { iconBg: "var(--ok-bg)", iconColor: "var(--ok)" },
  { iconBg: "var(--warn-bg)", iconColor: "var(--warn)" },
  { iconBg: "color-mix(in srgb, var(--acc) 12%, var(--surface))", iconColor: "var(--acc)" },
];
export function buildDocuments(documents) {
  return (Array.isArray(documents) ? documents : []).map((d, i) => {
    const sizeKb = d.size != null ? `${Math.round(Number(d.size) / 1024)} KB` : null;
    const when = d.uploadedAt ? formatDateShort(d.uploadedAt) : null;
    const meta = [String(d.type || d.mimeType || "FILE").toUpperCase().replace("APPLICATION/", ""), sizeKb, when]
      .filter(Boolean)
      .join(" · ");
    return {
      name: val(d.name, d.title, d.type, "Document"),
      meta: meta || DASH,
      url: d.url || d.fileUrl,
      ...DOC_THEMES[i % DOC_THEMES.length],
    };
  });
}

// Recent-activity timeline rows from the dashboard's timelineDays shape.
const DOT = { att: "var(--ok)", result: "var(--acc)", fee: "var(--ok)", remark: "var(--warn)" };
export function buildActivity(timelineDays) {
  const out = [];
  for (const day of Array.isArray(timelineDays) ? timelineDays : []) {
    for (const it of day.items || []) {
      out.push({
        text: it.text || DASH,
        time: it.time || day.day || "",
        meta: it.meta || "",
        dot: DOT[it.kind] || "var(--muted-2)",
      });
    }
  }
  return out;
}

// Upcoming events (right rail / banner layout only, but mapped for completeness).
export function buildUpcoming(upcoming) {
  return (Array.isArray(upcoming) ? upcoming : []).map((u) => {
    const d = u.date ? new Date(u.date) : null;
    return {
      day: u.day || (d ? String(d.getDate()).padStart(2, "0") : DASH),
      mon: u.mon || (d ? d.toLocaleDateString("en-IN", { month: "short" }) : ""),
      title: val(u.title),
      sub: val(u.sub, u.subtitle),
    };
  });
}

export const RATING_DIMENSIONS = [
  { key: "behaviour", label: "Behaviour", desc: "Conduct & cooperation" },
  { key: "academics", label: "Academics", desc: "Coursework & exams" },
  { key: "extraCurricular", label: "Extra-curricular", desc: "Sports, arts, clubs" },
  { key: "attendance", label: "Attendance", desc: "Punctuality & presence" },
  { key: "discipline", label: "Discipline", desc: "Rules & responsibility" },
];

// Local helpers shared by the dashboard tab panels.
// Pure functions; no React or component imports.

export const TAB_KEYS = [
  "overview",
  "attendance",
  "results",
  "fees",
  "remarks",
  "documents",
  "ratings",
];

// Pull the parent record from either the modern `parents[]` array or the
// legacy flat `parentName/parentPhone/parentEmail/parentRelationship` fields.
export function pickParent(student) {
  if (!student) return null;
  if (Array.isArray(student.parents) && student.parents.length > 0) {
    const primary =
      student.parents.find((p) => p.isParent) || student.parents[0];
    return {
      name: primary.name,
      relation: primary.relationship,
      phone: primary.phone,
      email: primary.email,
    };
  }
  if (student.parentName || student.parentPhone || student.parentEmail) {
    return {
      name: student.parentName,
      relation: student.parentRelationship,
      phone: student.parentPhone,
      email: student.parentEmail,
    };
  }
  return null;
}

// Convert the API attendance log into the 30-day heatmap shape (1/2/0).
// Today is index 29; older days fill earlier indices.
export function buildMonthAttendance(attendanceData) {
  if (!Array.isArray(attendanceData) || attendanceData.length === 0) return [];
  const cells = new Array(30).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDate = new Map();
  for (const r of attendanceData) {
    if (!r?.date) continue;
    const key = String(r.date).slice(0, 10);
    const status = String(r.status || "").toLowerCase();
    if (status === "present" || status === "p") byDate.set(key, 1);
    else if (status === "absent" || status === "a") byDate.set(key, 2);
  }

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    cells[i] = byDate.get(key) ?? 0;
  }
  return cells;
}

export function buildSubjects(results) {
  if (!Array.isArray(results) || results.length === 0) return [];
  const latestBySubject = new Map();
  for (const r of results) {
    const key = r.subject || r.subjectName || r.name;
    if (!key) continue;
    const grade = Number(r.percentage ?? r.marks ?? r.score ?? r.grade ?? NaN);
    if (!Number.isFinite(grade)) continue;
    const existing = latestBySubject.get(key);
    if (
      !existing ||
      new Date(r.examDate || 0) > new Date(existing.examDate || 0)
    ) {
      latestBySubject.set(key, { ...r, _grade: grade });
    }
  }
  return Array.from(latestBySubject.values()).map((r) => ({
    name: r.subject || r.subjectName || r.name,
    teacher: r.teacher || r.teacherName || "",
    grade: Math.round(r._grade),
    trend: 0,
  }));
}

export function deriveGpa(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;
  const grades = subjects.map((s) => Number(s.grade)).filter(Number.isFinite);
  if (grades.length === 0) return null;
  const avgPct = grades.reduce((a, b) => a + b, 0) / grades.length;
  return Number((avgPct / 10).toFixed(1));
}

export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  try {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  } catch {
    return `₹${value}`;
  }
}

export function formatDateShort(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

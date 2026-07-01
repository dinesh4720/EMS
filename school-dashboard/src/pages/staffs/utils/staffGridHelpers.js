/**
 * staffGridHelpers.js
 * Staff-specific tone maps for the Linear-style Staff data grid.
 * Mirrors the Claude Design "Staff List - Data Grid" reference exactly.
 * Generic helpers (accent, avatar palette, attendance tones, paging) are
 * shared from the students grid helpers.
 */

import { isDarkTheme } from "../../students/utils/studentsGridHelpers";

// Role → tinted chip (teaching = accent-ish, ops/admin = neutral tones)
const ROLE_TONE = {
  Teacher: { roleBg: "#eef0fe", roleFg: "#4844c7" },
  Principal: { roleBg: "#f3ecfe", roleFg: "#6d28d9" },
  "Vice Principal": { roleBg: "#f3ecfe", roleFg: "#7a52c0" },
  Accountant: { roleBg: "#e4f5f1", roleFg: "#0f766e" },
  Librarian: { roleBg: "#f7efe0", roleFg: "#9a7430" },
  "Lab Assistant": { roleBg: "#e6f0f8", roleFg: "#2f74a8" },
  Counselor: { roleBg: "#fbeef3", roleFg: "#b8456b" },
  Admin: { roleBg: "#eef0f3", roleFg: "#565a63" },
  "Super Admin": { roleBg: "#eef0f3", roleFg: "#565a63" },
  Receptionist: { roleBg: "#eef0f3", roleFg: "#565a63" },
  Teaching: { roleBg: "#eef0fe", roleFg: "#4844c7" },
  Administrative: { roleBg: "#eef0f3", roleFg: "#565a63" },
};
const ROLE_FALLBACK = { roleBg: "#eef0f3", roleFg: "#565a63" };

// Dark variants: deep tint background + bright label.
const ROLE_TONE_DARK = {
  Teacher: { roleBg: "#23213c", roleFg: "#a9a3f5" },
  Principal: { roleBg: "#271d3a", roleFg: "#b491ea" },
  "Vice Principal": { roleBg: "#271d3a", roleFg: "#b491ea" },
  Accountant: { roleBg: "#15271f", roleFg: "#4cbfa5" },
  Librarian: { roleBg: "#2c2415", roleFg: "#dcb160" },
  "Lab Assistant": { roleBg: "#172c3c", roleFg: "#6fb4e4" },
  Counselor: { roleBg: "#331f29", roleFg: "#e58aa9" },
  Admin: { roleBg: "#26282c", roleFg: "#aab0ba" },
  "Super Admin": { roleBg: "#26282c", roleFg: "#aab0ba" },
  Receptionist: { roleBg: "#26282c", roleFg: "#aab0ba" },
  Teaching: { roleBg: "#23213c", roleFg: "#a9a3f5" },
  Administrative: { roleBg: "#26282c", roleFg: "#aab0ba" },
};
const ROLE_FALLBACK_DARK = { roleBg: "#26282c", roleFg: "#aab0ba" };

export function roleLabel(role) {
  if (Array.isArray(role)) return role[0] || "—";
  return role || "—";
}
export function roleTone(role, dark = isDarkTheme()) {
  if (dark) return ROLE_TONE_DARK[role] || ROLE_FALLBACK_DARK;
  return ROLE_TONE[role] || ROLE_FALLBACK;
}

// Today's attendance chip
export function todayOf(todayStatus, dark = isDarkTheme()) {
  const t = String(todayStatus || "").toLowerCase();
  if (dark) {
    if (t === "present") return { label: "Present", todayBg: "#15271d", todayFg: "#5fc98c", todayDot: "#3fb074" };
    if (t === "absent") return { label: "Absent", todayBg: "#311a21", todayFg: "#f2768c", todayDot: "#e0506c" };
    if (t === "leave" || t === "halfday") return { label: t === "halfday" ? "Half day" : "Leave", todayBg: "#2c2415", todayFg: "#dcb160", todayDot: "#e0a948" };
    return { label: "Not marked", todayBg: "#23252a", todayFg: "#8b9099", todayDot: "#565b63" };
  }
  if (t === "present") return { label: "Present", todayBg: "#e9f5ee", todayFg: "#2f8f57", todayDot: "#37985f" };
  if (t === "absent") return { label: "Absent", todayBg: "#fbe9ed", todayFg: "#be1f44", todayDot: "#cf3b57" };
  if (t === "leave" || t === "halfday") return { label: t === "halfday" ? "Half day" : "Leave", todayBg: "#f8efdd", todayFg: "#9a7430", todayDot: "#d6952e" };
  return { label: "Not marked", todayBg: "#f1f2f4", todayFg: "#9499a3", todayDot: "#c4c8cf" };
}

// Active / Inactive status dot + text
export function staffStatusOf(status, dark = isDarkTheme()) {
  const s = String(status || "active").toLowerCase().trim();
  if (dark) {
    if (s === "active" || !status) return { label: "Active", statusDot: "#3fb074", statusTextTone: "#9097a0" };
    if (s === "on-leave") return { label: "On leave", statusDot: "#e0a948", statusTextTone: "#9097a0" };
    if (s === "suspended") return { label: "Suspended", statusDot: "#e0506c", statusTextTone: "#8b9099" };
    if (s === "terminated") return { label: "Terminated", statusDot: "#6b7079", statusTextTone: "#8b9099" };
    return { label: "Inactive", statusDot: "#6b7079", statusTextTone: "#8b9099" };
  }
  if (s === "active" || !status) return { label: "Active", statusDot: "#37985f", statusTextTone: "#74787f" };
  if (s === "on-leave") return { label: "On leave", statusDot: "#d6952e", statusTextTone: "#74787f" };
  if (s === "suspended") return { label: "Suspended", statusDot: "#cf3b57", statusTextTone: "#9499a3" };
  if (s === "terminated") return { label: "Terminated", statusDot: "#b3b7bf", statusTextTone: "#9499a3" };
  return { label: "Inactive", statusDot: "#b3b7bf", statusTextTone: "#9499a3" };
}

export function classesCount(assignedClasses) {
  return Array.isArray(assignedClasses) ? assignedClasses.length : 0;
}

// Generic sort by accessor key (no pin concept for staff)
export const STAFF_SORT_ACCESSORS = {
  name: (o) => String(o.name || "").toLowerCase(),
  role: (o) => roleLabel(o.role).toLowerCase(),
  att: (o) => Number(o.attendancePct ?? o.attendancePercentage ?? -1),
  classes: (o) => classesCount(o.assignedClasses),
};

export function sortStaff(list, key, dir) {
  const accessor = STAFF_SORT_ACCESSORS[key] || STAFF_SORT_ACCESSORS.name;
  const cmp = (a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  };
  return [...list].sort(cmp);
}

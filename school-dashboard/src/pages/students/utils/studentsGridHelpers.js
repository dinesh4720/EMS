/**
 * studentsGridHelpers.js
 * Pure mapping / tone helpers for the Linear-style Students data grid.
 * All visual constants mirror the Claude Design "Students List - Data Grid"
 * reference exactly (Indigo accent, fee/attendance/status tones, avatar palette).
 */

// ── Accent palette (Indigo — design default) ────────────────────────────────
export const ACCENT = {
  accent: "#4f46e5",
  accentHover: "#4338ca",
  accentBg: "#eef0fe",
  accentSoft: "#f7f7fe",
  accentLine: "#dcdefb",
};

// ── Dark-theme detection (next-themes toggles `.dark` on <html>) ─────────────
// The grids style chips/avatars with inline colors, so CSS `.dark` overrides
// can't reach them — these helpers pick a light/dark tone set instead. Callers
// pass an explicit `dark` flag (so the row useMemo recomputes on theme change);
// the default DOM read is just a safety net.
export function isDarkTheme() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

// ── Avatar background / foreground pairs (cycled by row index) ───────────────
export const AVATAR_PALETTE = [
  ["#eaecfb", "#5b54c9"],
  ["#e3f4ef", "#18897a"],
  ["#f7efe0", "#a9772a"],
  ["#f8eaef", "#b8456b"],
  ["#e6f0f8", "#2f74a8"],
  ["#f0eafa", "#7a52c0"],
];
// Dark variants: deep desaturated hue background + bright foreground.
export const AVATAR_PALETTE_DARK = [
  ["#262445", "#aaa4f7"],
  ["#16302a", "#54c9b4"],
  ["#322a17", "#dcb05f"],
  ["#371f2a", "#e98bab"],
  ["#172c3c", "#6fb4e4"],
  ["#281d3d", "#b491ea"],
];
export const avatarPalette = (i, dark = isDarkTheme()) =>
  (dark ? AVATAR_PALETTE_DARK : AVATAR_PALETTE)[i % AVATAR_PALETTE.length];

// Shared neutral tones for muted text / empty tracks (theme-aware).
export const mutedTone = (dark = isDarkTheme()) => (dark ? "#6f747d" : "#b3b7bf");
export const trackEmpty = (dark = isDarkTheme()) => (dark ? "#2c2e33" : "#edeff2");

// ── Number / currency formatting (en-IN, matches design) ────────────────────
export const fmtIN = (n) => Number(n || 0).toLocaleString("en-IN");
export const rupees = (n) => "₹" + fmtIN(n);

// ── Initials from a full name ───────────────────────────────────────────────
export function initialsOf(name) {
  const p = String(name || "").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1]?.[0] || "" : "")).toUpperCase() || "?";
}

// ── Gender → single-letter (M / F / O) ──────────────────────────────────────
export function genderShort(g) {
  if (!g) return "—";
  const s = String(g).trim().toLowerCase();
  if (s.startsWith("m")) return "M";
  if (s.startsWith("f")) return "F";
  if (s.startsWith("o")) return "O";
  return String(g).charAt(0).toUpperCase();
}

// ── Date of birth → "12 May 2010" ───────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDob(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Guardian (name + relation) from a student record ────────────────────────
export function pickGuardian(student) {
  const father = student.fatherName?.trim();
  const mother = student.motherName?.trim();
  const guardian = student.guardian || {};
  const fromParents = Array.isArray(student.parents) ? student.parents.find((p) => p?.name) : null;
  if (father) return { name: father, relation: "Father" };
  if (mother) return { name: mother, relation: "Mother" };
  if (guardian?.name) return { name: guardian.name, relation: guardian.relation || "Guardian" };
  if (fromParents) return { name: fromParents.name, relation: fromParents.relationship || fromParents.relation || "Guardian" };
  return { name: "—", relation: "" };
}

// ── Attendance tones (calm: number flags only the actionable low case) ──────
export function attNumTone(a, dark = isDarkTheme()) {
  if (dark) return a < 75 ? "#e0617e" : "#c4c8cf";
  return a < 75 ? "#c0392b" : "#3f424a";
}
export function attBarTone(a, dark = isDarkTheme()) {
  if (dark) return a >= 90 ? "#4cb583" : a >= 75 ? "#e0a948" : "#e0617e";
  return a >= 90 ? "#57b07e" : a >= 75 ? "#d6a23e" : "#d3686b";
}

// ── Fee chip mapping from feeStatus + balance ───────────────────────────────
// Tone sets keyed by semantic type; dark = bright fg/dot on a deep tint.
const FEE_TONES = {
  light: {
    paid: { feeDot: "#37985f", feeBg: "#e9f5ee", feeLabelTone: "#2f8f57" },
    overdue: { feeDot: "#cf3b57", feeBg: "#fbe9ed", feeLabelTone: "#be1f44" },
    due: { feeDot: "#d6952e", feeBg: "#f8efdd", feeLabelTone: "#9a7430" },
  },
  dark: {
    paid: { feeDot: "#3fb074", feeBg: "#15271d", feeLabelTone: "#5fc98c" },
    overdue: { feeDot: "#e0506c", feeBg: "#311a21", feeLabelTone: "#f2768c" },
    due: { feeDot: "#e0a948", feeBg: "#2c2415", feeLabelTone: "#dcb160" },
  },
};
export function feeOf(student, dark = isDarkTheme()) {
  const balance = Number(student.balanceAmount ?? student.balance ?? 0);
  const type = String(student.feeStatus || (balance > 0 ? "pending" : "paid")).toLowerCase();
  const t = dark ? FEE_TONES.dark : FEE_TONES.light;
  const muted = mutedTone(dark);
  if (type === "paid" || type === "collected") {
    return { slabel: "Paid", ...t.paid, balDisp: "—", balTone: muted };
  }
  if (type === "overdue") {
    return { slabel: "Overdue", ...t.overdue, balDisp: rupees(balance), balTone: t.overdue.feeLabelTone };
  }
  if (type === "partial") {
    return { slabel: "Partial", ...t.due, balDisp: rupees(balance), balTone: t.due.feeLabelTone };
  }
  // pending / due / anything else with a balance
  return { slabel: "Due", ...t.due, balDisp: balance > 0 ? rupees(balance) : "—", balTone: balance > 0 ? t.due.feeLabelTone : muted };
}

// ── Status dot + text tone ──────────────────────────────────────────────────
const STATUS_TONES = {
  light: { green: "#37985f", grey: "#b3b7bf", cyan: "#2a9bb5", txt: "#74787f", txtMuted: "#9499a3" },
  dark: { green: "#3fb074", grey: "#6b7079", cyan: "#3aa6c0", txt: "#9097a0", txtMuted: "#8b9099" },
};
export function statusOf(rawStatus, dark = isDarkTheme()) {
  const status = String(rawStatus || "active").toLowerCase();
  const c = dark ? STATUS_TONES.dark : STATUS_TONES.light;
  if (status === "active") return { label: "Active", statusDot: c.green, statusTextTone: c.txt };
  if (status === "inactive" || status === "suspended") return { label: status === "suspended" ? "Suspended" : "Inactive", statusDot: c.grey, statusTextTone: c.txtMuted };
  if (status === "alumni" || status === "graduated") return { label: status === "graduated" ? "Graduated" : "Alumni", statusDot: c.cyan, statusTextTone: c.txt };
  if (status === "transferred") return { label: "Transferred", statusDot: c.cyan, statusTextTone: c.txt };
  return { label: rawStatus || "Active", statusDot: c.grey, statusTextTone: c.txtMuted };
}

// ── Sort accessors for the client-side grid sort ────────────────────────────
export const SORT_ACCESSORS = {
  name: (o) => String(o.name || "").toLowerCase(),
  cls: (o) => {
    const c = parseInt(String(o.class || o.className || "0"), 10) || 0;
    const sec = String(o.section || "A").charCodeAt(0) - 64;
    return c * 100 + (Number.isFinite(sec) ? sec : 0);
  },
  att: (o) => Number(o.attendancePercentage ?? -1),
  bal: (o) => Number(o.balanceAmount ?? o.balance ?? 0),
};

/**
 * Sort a list by key/dir while keeping pinned students floated to the top.
 */
export function sortStudents(list, key, dir) {
  const accessor = SORT_ACCESSORS[key] || SORT_ACCESSORS.name;
  const pinned = list.filter((s) => s.isPinned);
  const rest = list.filter((s) => !s.isPinned);
  const cmp = (a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  };
  return [...pinned.sort(cmp), ...rest.sort(cmp)];
}

/**
 * Build a compact page-number range with ellipsis sentinels ("…").
 * e.g. (3, 50) -> [1, "…", 2, 3, 4, "…", 50]
 */
export function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push(`gap-${p}`);
    out.push(p);
    prev = p;
  }
  return out;
}

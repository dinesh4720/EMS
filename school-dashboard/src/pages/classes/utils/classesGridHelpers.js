/**
 * classesGridHelpers.js
 * Grouping + tone helpers for the Linear-style grade-grouped Classes data grid.
 * Mirrors the Claude Design "Classes List - Data Grid" reference exactly.
 */
import { ACCENT, AVATAR_PALETTE, AVATAR_PALETTE_DARK, isDarkTheme, initialsOf, attNumTone, attBarTone, mutedTone, trackEmpty } from "../../students/utils/studentsGridHelpers";

export { ACCENT };

// Grade → badge bg/fg (design palette; neutral fallback)
const BADGE_PAL = {
  "10": ["#eef0fe", "#4844c7"],
  "9": ["#e4f5f1", "#0f766e"],
  "8": ["#f7efe0", "#9a7430"],
  "7": ["#e6f0f8", "#2f74a8"],
  "6": ["#f8eaef", "#b8456b"],
  "5": ["#f0eafa", "#7a52c0"],
};
const BADGE_PAL_DARK = {
  "10": ["#23213c", "#a9a3f5"],
  "9": ["#15271f", "#4cbfa5"],
  "8": ["#2c2415", "#dcb160"],
  "7": ["#172c3c", "#6fb4e4"],
  "6": ["#331f29", "#e58aa9"],
  "5": ["#271d3a", "#b491ea"],
};
export const badgeFor = (grade, dark = isDarkTheme()) =>
  dark
    ? BADGE_PAL_DARK[String(grade)] || ["#26282c", "#aab0ba"]
    : BADGE_PAL[String(grade)] || ["#eef0f3", "#565a63"];

// Capacity fill tone: over → red, near-full → amber, else accent
export function fillTone(ratio, dark = isDarkTheme()) {
  if (ratio >= 1) return dark ? "#e0506c" : "#cf3b57";
  if (ratio >= 0.85) return dark ? "#e0a948" : "#d6a23e";
  return dark ? "#6d63f0" : ACCENT.accent;
}

// Section status chip
export function statusOf(status, dark = isDarkTheme()) {
  if (dark) {
    if (status === "active") return { statusLabel: "Active", statusBg: "#15271d", statusFg: "#5fc98c", statusDot: "#3fb074" };
    if (status === "full") return { statusLabel: "Over capacity", statusBg: "#311a21", statusFg: "#f2768c", statusDot: "#e0506c" };
    return { statusLabel: "Needs teacher", statusBg: "#2c2415", statusFg: "#dcb160", statusDot: "#e0a948" };
  }
  if (status === "active") return { statusLabel: "Active", statusBg: "#e9f5ee", statusFg: "#2f8f57", statusDot: "#37985f" };
  if (status === "full") return { statusLabel: "Over capacity", statusBg: "#fbe9ed", statusFg: "#be1f44", statusDot: "#cf3b57" };
  return { statusLabel: "Needs teacher", statusBg: "#fdf6e7", statusFg: "#b07d22", statusDot: "#e0a92e" };
}

/** Derive a normalized section record from a raw class document. */
export function enrichSection(cls, staffById) {
  const id = String(cls.id || cls._id);
  const grade = String(cls.name ?? "").replace(/^Class\s+/i, "").trim() || "—";
  const section = cls.section || "—";
  const teacherFromStaff = cls.classTeacherId ? staffById.get(String(cls.classTeacherId))?.name : null;
  const teacher = teacherFromStaff || cls.classTeacherName || cls.teacher || "";
  const strength = Number(cls.studentCount ?? cls.strength ?? 0);
  const cap = Number(cls.strengthLimit?.current ?? cls.strengthLimit?.default ?? cls.capacity ?? cls.strength ?? 0);
  const subjects = Array.isArray(cls.subjects) ? cls.subjects.length : Number(cls.subjects ?? 0);
  const att = Number(cls.averageAttendance ?? cls.attendance ?? 0);
  const status = !teacher ? "needs" : (cap > 0 && strength > cap ? "full" : "active");
  return { id, raw: cls, grade, section, teacher, strength, cap, subjects, room: cls.room || "—", att, status };
}

/**
 * Group enriched sections by grade and compute display fields.
 * @param sections enriched section records
 * @param state { collapsed:Set, allCollapsed:bool, selected:Set, dark:bool }
 */
export function buildGroups(sections, { collapsed, allCollapsed, selected, dark = isDarkTheme() }) {
  const byGrade = new Map();
  for (const sec of sections) {
    if (!byGrade.has(sec.grade)) byGrade.set(sec.grade, []);
    byGrade.get(sec.grade).push(sec);
  }
  // grade order: numeric descending (10, 9, …), non-numeric last alphabetical
  const grades = [...byGrade.keys()].sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
    if (Number.isFinite(na)) return -1;
    if (Number.isFinite(nb)) return 1;
    return String(a).localeCompare(String(b));
  });

  const collapsedFor = (grade) => (allCollapsed ? !collapsed.has(grade) : collapsed.has(grade));

  const palette = dark ? AVATAR_PALETTE_DARK : AVATAR_PALETTE;

  return grades.map((grade) => {
    const bp = badgeFor(grade, dark);
    const secs = byGrade.get(grade).slice().sort((a, b) => String(a.section).localeCompare(String(b.section)));
    const open = !collapsedFor(grade);
    let gStud = 0, gCap = 0, gSub = 0, gAttSum = 0, gUnassigned = 0;

    const builtSections = secs.map((sec, i) => {
      const selectedRow = selected.has(sec.id);
      const ratio = sec.cap > 0 ? sec.strength / sec.cap : 0;
      const hasTeacher = !!sec.teacher;
      const st = statusOf(sec.status, dark);
      const pal = palette[(String(grade).charCodeAt(0) + i) % palette.length];
      gStud += sec.strength; gCap += sec.cap; gSub += sec.subjects; gAttSum += sec.att;
      if (!hasTeacher) gUnassigned++;
      return {
        ...sec,
        selected: selectedRow,
        secBg: bp[0], secFg: bp[1],
        hasTeacher,
        teacherInitials: hasTeacher ? initialsOf(sec.teacher) : "",
        avBg: pal[0], avFg: pal[1],
        fillW: `${Math.min(100, Math.round(ratio * 100))}%`,
        fillTone: fillTone(ratio, dark),
        attTxt: `${sec.att}%`, attW: `${Math.max(0, Math.min(100, sec.att))}%`,
        attNumTone: sec.att > 0 ? attNumTone(sec.att, dark) : mutedTone(dark),
        attBarTone: sec.att > 0 ? attBarTone(sec.att, dark) : trackEmpty(dark),
        capTxt: sec.cap > 0 ? sec.cap : "—",
        ...st,
      };
    });

    return {
      grade,
      title: `Class ${grade}`,
      sections: builtSections,
      open,
      badgeBg: bp[0], badgeFg: bp[1],
      sectionCount: secs.length,
      hasWarning: gUnassigned > 0,
      warning: gUnassigned > 0 ? `${gUnassigned} unassigned` : "",
      teacherSummary: `${secs.length} ${secs.length === 1 ? "section" : "sections"}`,
      students: gStud,
      capacity: gCap,
      subjects: gSub,
      avgAtt: secs.length ? `${Math.round(gAttSum / secs.length)}%` : "—",
    };
  });
}

// Attendance-board status chip (Marked / Pending)
function boardStatus(marked, dark) {
  if (marked) {
    return dark
      ? { statusLabel: "Marked", statusBg: "#15271d", statusFg: "#5fc98c", statusDot: "#3fb074" }
      : { statusLabel: "Marked", statusBg: "#e9f5ee", statusFg: "#2f8f57", statusDot: "#37985f" };
  }
  return dark
    ? { statusLabel: "Pending", statusBg: "#2c2415", statusFg: "#dcb160", statusDot: "#e0a948" }
    : { statusLabel: "Pending", statusBg: "#fdf6e7", statusFg: "#b07d22", statusDot: "#e0a92e" };
}

/**
 * Build the read-only "Attendance board" rollup from raw class documents.
 * Marked = the class has attendance data (averageAttendance > 0); since the app
 * has no per-day snapshot yet, this reflects whether attendance exists at all.
 */
export function buildAttendanceBoard(rawClasses = [], staffById = new Map(), dark = isDarkTheme()) {
  const rows = rawClasses
    .map((c) => {
      const grade = String(c.name ?? "").replace(/^Class\s+/i, "").trim() || "—";
      const section = c.section || "";
      const teacher = (c.classTeacherId && staffById.get(String(c.classTeacherId))?.name) || c.classTeacherName || c.teacher || "—";
      const strength = Number(c.studentCount ?? c.strength ?? 0);
      const att = Number(c.averageAttendance ?? c.attendance ?? 0);
      return { id: String(c.id || c._id), cls: section ? `${grade} ${section}` : grade, teacher, strength, att, marked: att > 0 };
    })
    .sort((a, b) => a.cls.localeCompare(b.cls, undefined, { numeric: true }));

  let presentRoll = 0, markedRoll = 0, markedCount = 0;
  for (const r of rows) {
    if (r.marked) { markedCount++; markedRoll += r.strength; presentRoll += Math.round((r.strength * r.att) / 100); }
  }
  const pct = markedRoll ? Math.round((presentRoll / markedRoll) * 100) : null;

  const classes = rows.map((r) => ({
    ...r,
    pct: r.marked ? `${r.att}%` : "—",
    pctW: `${Math.max(0, Math.min(100, r.att))}%`,
    barTone: r.marked ? attBarTone(r.att, dark) : (dark ? "#2c2e33" : "#edeff2"),
    rowAccent: r.marked ? "transparent" : (dark ? "#241f12" : "#fbf4e3"),
    ...boardStatus(r.marked, dark),
  }));

  return {
    presentTodayPct: pct == null ? "—" : `${pct}%`,
    presentTodayNum: pct,
    presentRollLabel: `${presentRoll} / ${markedRoll}`,
    markedCount,
    pendingCount: rows.length - markedCount,
    classes,
  };
}

/** Footer + tab aggregates over the full (unfiltered-by-tab) section list. */
export function classesSummary(sections) {
  const grades = new Set();
  let students = 0, unassigned = 0, attSum = 0, attN = 0, over = 0, needs = 0;
  for (const s of sections) {
    grades.add(s.grade);
    students += s.strength;
    if (!s.teacher) { unassigned++; needs++; }
    if (s.cap > 0 && s.strength > s.cap) over++;
    if (s.att > 0) { attSum += s.att; attN++; }
  }
  return {
    classes: grades.size,
    sections: sections.length,
    students,
    unassigned,
    needs,
    over,
    avgAtt: attN ? `${Math.round(attSum / attN)}%` : "—",
  };
}

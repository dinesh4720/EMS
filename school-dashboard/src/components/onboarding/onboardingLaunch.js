import { settingsApi, classesApi } from "../../services/api";
import { CLASS_ORDER } from "./useOnboardingState";

/**
 * Normalise a session display string ("2025–26", "2025-2026", "2025-26") to the
 * backend's required academicYear format `YYYY-YY` (e.g. "2025-26").
 */
export function normalizeAcademicYear(value, sessionStart) {
  const v = String(value || "").trim();
  const m = v.match(/(\d{4})\D+(\d{2,4})/);
  if (m) {
    const start = m[1];
    const end = m[2].length === 4 ? m[2].slice(-2) : m[2];
    return `${start}-${end}`;
  }
  if (sessionStart) {
    const y = new Date(sessionStart).getFullYear();
    if (!isNaN(y)) return `${y}-${String(y + 1).slice(-2)}`;
  }
  return v;
}

const SECTIONS = ["A", "B"];

/**
 * Persist the onboarding draft to the real backend, best-effort. Each area is
 * isolated so one failure doesn't abort the rest; the caller surfaces the
 * summary. Classes & subjects are de-duplicated against what already exists so
 * re-running the wizard is safe.
 *
 * @returns {Promise<{ done: string[], failed: {area:string,error:string}[], created:{classes:number,subjects:number}, importPrev:boolean }>}
 */
const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function sectionsFor(data, grade) {
  const list = Array.isArray(data.sections?.[grade]) && data.sections[grade].length ? data.sections[grade] : SECTIONS;
  return list;
}

export async function launchOnboarding(data, { existingClasses = [], existingSubjects = [] } = {}) {
  const done = [];
  const failed = [];
  const created = { classes: 0, subjects: 0 };

  const academicYear = normalizeAcademicYear(data.sessionName, data.sessionStart);
  const workingDays = DAY_ORDER.filter((d) => data.days?.[d]);

  // 1 ─ School profile + timings + working week (one settings document).
  try {
    const address = [data.street, data.city, data.state, data.pin].filter(Boolean).join(", ");
    await settingsApi.updateSchoolSettings({
      name: data.schoolName,
      boardOfEducation: data.board,
      udiseNo: data.udise,
      affiliationNo: data.affiliation,
      email: data.email,
      phone: data.phone,
      address,
      // Only persist a real hosted URL — a local base64 preview from the
      // onboarding logo picker is not pushed (it'd bloat the settings doc).
      ...(data.logo && /^https?:\/\//.test(data.logo) ? { logo: data.logo } : {}),
      schoolStartTime: data.schoolStart,
      schoolEndTime: data.schoolEnd,
      periodsPerDay: Number(data.periodsPerDay) || undefined,
      periodDuration: Number(data.periodLength) || undefined,
      breaksPerDay: Number(data.breaksPerDay) || 0,
      secondFourthSaturdayOff: !!data.satHoliday,
      ...(workingDays.length ? { workingDays } : {}),
    });
    done.push("profile");
  } catch (e) {
    failed.push({ area: "School profile", error: e?.message || "Failed to save" });
  }

  // 2 ─ Academic year / session. The PUT /academic-year endpoint sets the year
  // as the *active* session (currentSession), so we only call it when the
  // admin left "Set this as the active session" on. The computed academicYear
  // is still used below to tag classes either way.
  if (academicYear && data.setActive) {
    try {
      await settingsApi.updateAcademicYear({
        academicYear,
        ...(data.sessionStart ? { academicYearStart: data.sessionStart } : {}),
        ...(data.sessionEnd ? { academicYearEnd: data.sessionEnd } : {}),
        // Setting the active session pivots every attendance/fee/exam query, so
        // the endpoint requires an explicit confirm flag. The admin chose this
        // session in the wizard, so we confirm on their behalf.
        confirm: true,
      });
      done.push("session");
    } catch (e) {
      failed.push({ area: "Academic session", error: e?.message || "Failed to save" });
    }
  }

  // 3 ─ Subjects (create only the new ones).
  const haveSub = new Set(existingSubjects.map((s) => String(s?.name ?? s).toLowerCase()));
  for (const name of data.subjects) {
    if (haveSub.has(name.toLowerCase())) continue;
    try {
      await settingsApi.createSubject({ name });
      created.subjects += 1;
      haveSub.add(name.toLowerCase());
    } catch {
      /* best-effort — a single subject failure shouldn't block launch */
    }
  }
  if (created.subjects > 0) done.push("subjects");

  // 4 ─ Classes (one per enabled grade × its sections, skipping existing).
  const haveCls = new Set(
    existingClasses.map((c) => `${String(c?.name ?? "").trim()}|${String(c?.section ?? "").trim()}`.toLowerCase())
  );
  let clsFailed = 0;
  for (const grade of CLASS_ORDER) {
    if (!data.classes[grade]) continue;
    for (const section of sectionsFor(data, grade)) {
      const key = `${grade}|${section}`.toLowerCase();
      if (haveCls.has(key)) continue;
      try {
        await classesApi.create({
          name: grade,
          section,
          academicYear,
          strengthLimit: { current: 40, default: 40 },
        });
        created.classes += 1;
        haveCls.add(key);
      } catch {
        clsFailed += 1;
      }
    }
  }
  if (created.classes > 0) done.push("classes");
  if (clsFailed > 0) failed.push({ area: "Classes", error: `${clsFailed} section(s) could not be created` });

  return { done, failed, created, importPrev: !!data.importPrev };
}

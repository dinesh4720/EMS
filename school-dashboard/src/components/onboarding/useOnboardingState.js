import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../../utils/safeStorage";

/**
 * useOnboardingState
 * Single source of truth for the School Onboarding wizard (pixel-perfect port of
 * the Claude Design "School Onboarding" reference). Owns the full form draft,
 * the current step (0 = welcome, 1–6 = steps), and resume persistence.
 *
 * Resume model: the entire draft + the furthest-reached step are written to
 * localStorage on every change, so the Welcome screen can offer "Resume" and the
 * wizard restores exactly where the user left off — even across sessions.
 */

export const DRAFT_KEY = "ems.onboarding.draft.v1";
export const DONE_KEY = "hasCompletedOnboarding"; // read by App.jsx

// Grade order — matches the design's class picker.
export const CLASS_ORDER = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// Step metadata (drives the topbar dots + welcome resume checklist).
export const STEP_META = [
  { title: "School profile", desc: "Identity, board & contact" },
  { title: "Academic session", desc: "Set your current year" },
  { title: "Timings & week", desc: "Hours, periods & days" },
  { title: "Classes & sections", desc: "Grades you run" },
  { title: "Subjects", desc: "What you teach" },
  { title: "Review & launch", desc: "Confirm and go live" },
];

const DEFAULT_SUBJECTS = ["English", "Hindi", "Mathematics", "EVS", "Science", "Social Science", "Computer Science"];
const DEFAULT_SECTIONS = ["A", "B"]; // every enabled grade starts with A + B
const SEATS_PER_SECTION = 40;
const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function nextSectionLetter(used = []) {
  return SECTION_LETTERS.find((l) => !used.includes(l)) || "";
}

function defaultClasses() {
  const c = {};
  CLASS_ORDER.forEach((k) => (c[k] = k !== "11" && k !== "12"));
  return c;
}

function defaultSections() {
  const s = {};
  CLASS_ORDER.forEach((k) => (s[k] = [...DEFAULT_SECTIONS]));
  return s;
}

function defaultData(schoolSettings, currentAcademicYear) {
  const s = schoolSettings || {};
  return {
    // ── Step 1 · profile ──
    schoolName: s.name || "",
    board: s.boardOfEducation || "CBSE",
    udise: s.udiseNo || "",
    affiliation: s.affiliationNo || "",
    email: s.email || "",
    phone: s.phone || "",
    street: s.address || "",
    city: "",
    state: "Karnataka",
    pin: "",
    logo: s.logo || "",
    // ── Step 2 · session ──
    sessionName: currentAcademicYear || "",
    sessionStart: "",
    sessionEnd: "",
    setActive: true,
    importPrev: false,
    // ── Step 3 · timings ──
    schoolStart: s.schoolStartTime || "08:00",
    schoolEnd: s.schoolEndTime || "14:30",
    periodsPerDay: s.periodsPerDay || 8,
    periodLength: s.periodDuration || 45,
    breaksPerDay: 2,
    days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false },
    satHoliday: true,
    // ── Step 4 · classes ──
    classes: defaultClasses(),
    sections: defaultSections(),
    // ── Step 5 · subjects ──
    subjects: [...DEFAULT_SUBJECTS],
    subjectDraft: "",
  };
}

function loadDraft() {
  try {
    const raw = safeGetItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return parsed; // { step, maxStep, data }
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  safeRemoveItem(DRAFT_KEY);
}

export function hasOnboardingDraft() {
  const d = loadDraft();
  return !!(d && d.maxStep > 0);
}

export function useOnboardingState(schoolSettings, currentAcademicYear) {
  const saved = useRef(loadDraft());
  const [data, setData] = useState(() => ({
    ...defaultData(schoolSettings, currentAcademicYear),
    ...(saved.current?.data || {}),
  }));
  // Always open on the Welcome screen so a returning user sees the resume card
  // (with restored progress) and chooses to resume or start over — matching the
  // design's "Resume where you left off" intent.
  const [step, setStepRaw] = useState(0);
  const [maxStep, setMaxStep] = useState(() => saved.current?.maxStep ?? 0);

  // Persist draft on every meaningful change (debounced via microtask batching).
  useEffect(() => {
    safeSetItem(DRAFT_KEY, JSON.stringify({ step, maxStep, data }));
  }, [step, maxStep, data]);

  const setStep = useCallback((n) => {
    const next = Math.max(0, Math.min(6, n));
    setStepRaw(next);
    setMaxStep((m) => Math.max(m, next));
    // Scroll the wizard body back to the top on every step change.
    requestAnimationFrame(() => {
      const main = document.querySelector(".obx .ob-main");
      if (main?.parentElement) main.parentElement.scrollTop = 0;
      const root = document.querySelector(".obx");
      if (root) root.scrollTop = 0;
    });
  }, []);

  const update = useCallback((patch) => {
    setData((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
  }, []);
  const setField = useCallback((key, value) => update({ [key]: value }), [update]);

  const toggleClass = useCallback((k) => update((d) => {
    const on = !d.classes[k];
    const sections = { ...d.sections };
    // Re-enabling a grade with no sections left restores the A/B default.
    if (on && (!Array.isArray(sections[k]) || sections[k].length === 0)) sections[k] = [...DEFAULT_SECTIONS];
    return { classes: { ...d.classes, [k]: on }, sections };
  }), [update]);
  const toggleDay = useCallback((k) => update((d) => ({ days: { ...d.days, [k]: !d.days[k] } })), [update]);
  const setClasses = useCallback((map) => update((d) => {
    // When a preset enables a grade that has no sections, give it the default.
    const sections = { ...d.sections };
    CLASS_ORDER.forEach((k) => { if (map[k] && (!sections[k] || !sections[k].length)) sections[k] = [...DEFAULT_SECTIONS]; });
    return { classes: map, sections };
  }), [update]);

  const addSection = useCallback((grade) => update((d) => {
    const cur = d.sections[grade] || [];
    const letter = nextSectionLetter(cur);
    if (!letter || cur.length >= 12) return {};
    return { sections: { ...d.sections, [grade]: [...cur, letter] } };
  }), [update]);
  const removeSection = useCallback((grade, letter) => update((d) => {
    const cur = d.sections[grade] || [];
    if (cur.length <= 1) return {}; // keep at least one section while enabled
    return { sections: { ...d.sections, [grade]: cur.filter((x) => x !== letter) } };
  }), [update]);

  const addSubject = useCallback((name) => {
    const v = String(name || "").trim();
    if (!v) return;
    update((d) => (d.subjects.some((x) => x.toLowerCase() === v.toLowerCase()) ? { subjectDraft: "" } : { subjects: [...d.subjects, v], subjectDraft: "" }));
  }, [update]);
  const removeSubject = useCallback((name) => update((d) => ({ subjects: d.subjects.filter((x) => x !== name) })), [update]);

  // ── Derived values ──
  const derived = useMemo(() => {
    const enabled = CLASS_ORDER.filter((k) => data.classes[k]);
    const classCount = enabled.length;
    const sectionCount = enabled.reduce((sum, k) => sum + (data.sections?.[k]?.length || 0), 0);
    const capacity = sectionCount * SEATS_PER_SECTION;
    const dayCount = Object.values(data.days).filter(Boolean).length;

    // Session length / working-day estimate.
    let months = 0, workingDays = 0;
    if (data.sessionStart && data.sessionEnd) {
      const a = new Date(data.sessionStart), b = new Date(data.sessionEnd);
      if (!isNaN(a) && !isNaN(b) && b > a) {
        months = Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.44));
        const weeks = (b - a) / (1000 * 60 * 60 * 24 * 7);
        workingDays = Math.round(weeks * dayCount * 0.92); // ~8% holidays
      }
    }
    return { classCount, sectionCount, capacity, dayCount, months, workingDays };
  }, [data]);

  return {
    data, step, maxStep,
    setStep, setField, update,
    toggleClass, toggleDay, setClasses, addSection, removeSection, addSubject, removeSubject,
    derived,
  };
}

/**
 * Utility functions for the Timetable module.
 *
 * Maps subjects → one of five hue families used by the bundle's
 * preview/calendar_timetable.html design (math / sci / eng / pe / art).
 * Returns { kind, swatchKind } for use with the .tt-ev--<kind> and
 * .tt-legend-sw--<kind> CSS classes in styles/classes.css.
 */

export const SUBJECT_KINDS = ["math", "sci", "eng", "pe", "art", "default"];

const SUBJECT_KIND_MAP = {
  // Math family — indigo
  Math: "math",
  Maths: "math",
  Mathematics: "math",

  // Sciences — teal/blue
  Science: "sci",
  Physics: "sci",
  Chemistry: "sci",
  Biology: "sci",
  Bio: "sci",
  "Computer Science": "sci",
  Computer: "sci",
  IT: "sci",

  // Languages / English — peach
  English: "eng",
  Hindi: "eng",
  Sanskrit: "eng",
  Tamil: "eng",
  Telugu: "eng",
  Kannada: "eng",
  Malayalam: "eng",
  Marathi: "eng",
  Bengali: "eng",
  Urdu: "eng",
  French: "eng",
  Spanish: "eng",
  German: "eng",

  // PE / Sports — green
  PE: "pe",
  PT: "pe",
  "Physical Education": "pe",
  Sports: "pe",
  Yoga: "pe",
  Games: "pe",

  // Art / Music / Humanities — magenta
  Art: "art",
  Music: "art",
  Drama: "art",
  Dance: "art",
  Library: "art",
  History: "art",
  Geography: "art",
  Civics: "art",
  "Social Studies": "art",
  "Social Science": "art",
  Sociology: "art",
  Economics: "art",
};

export const getSubjectKind = (subject) => {
  if (!subject) return "default";
  return SUBJECT_KIND_MAP[subject] || "default";
};

/**
 * Returns the CSS class for a subject's event card.
 * Use directly on the slot element: <div className={getSubjectClass(slot.subject)}>
 */
export const getSubjectClass = (subject) => `tt-ev tt-ev--${getSubjectKind(subject)}`;

/**
 * Legacy helper kept for any callers still expecting Tailwind class objects.
 * Returns minimal shape so existing JSX doesn't break — text/pill default to
 * inheriting the parent .tt-ev color.
 */
export const getSubjectClasses = (subject) => {
  const kind = getSubjectKind(subject);
  return {
    card: `tt-ev tt-ev--${kind}`,
    text: "",
    pill: "bg-[var(--surface-2)]/40",
  };
};

/**
 * Legacy helper — returns the HeroUI semantic color name for a subject.
 * Some callsites may still consume this for Chip/Avatar tinting.
 */
export const getSubjectColor = (subject) => {
  const kind = getSubjectKind(subject);
  return (
    {
      math: "primary",
      sci: "success",
      eng: "warning",
      pe: "success",
      art: "secondary",
      default: "default",
    }[kind] || "default"
  );
};

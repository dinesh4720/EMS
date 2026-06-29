/**
 * Session-scoped persistence for the in-progress "Add student" draft (SEC-07).
 *
 * The new-student composer autosaves the full draft (name, DOB, parent
 * contact, address, ID numbers) to sessionStorage on every change so an
 * accidental reload doesn't lose work. That draft is PII, so we bound how
 * long an abandoned draft may survive on a shared front-office machine:
 * every write stamps `savedAt`, and a read older than DRAFT_TTL_MS (or a
 * legacy un-stamped / corrupt value) is discarded **and purged** instead of
 * restored, so stale PII does not linger past the window.
 *
 * `storage` and `now` are injectable so the logic is unit-testable without
 * jsdom; callers in the app use the defaults.
 */

export const STUDENT_DRAFT_KEY = "student-form-draft";

// How long an untouched draft may live before it is treated as stale. Each
// save refreshes the timestamp, so this is measured from the last edit — an
// actively-typed form never expires; only an abandoned one does.
export const STUDENT_DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function saveStudentDraft(form, storage = sessionStorage, now = Date.now()) {
  try {
    storage.setItem(
      STUDENT_DRAFT_KEY,
      JSON.stringify({ savedAt: now, data: form })
    );
    return true;
  } catch {
    return false; // storage full / unavailable
  }
}

export function clearStudentDraft(storage = sessionStorage) {
  try {
    storage.removeItem(STUDENT_DRAFT_KEY);
  } catch {
    /* no-op */
  }
}

/**
 * Returns the draft form object if a fresh draft exists, otherwise null.
 * A missing, corrupt, legacy-shaped, or expired draft returns null and is
 * purged from storage so abandoned PII has a bounded lifetime.
 */
export function readStudentDraft(storage = sessionStorage, now = Date.now()) {
  let raw;
  try {
    raw = storage.getItem(STUDENT_DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearStudentDraft(storage); // corrupt — drop it
    return null;
  }

  const isEnvelope =
    parsed &&
    typeof parsed === "object" &&
    typeof parsed.savedAt === "number" &&
    parsed.data &&
    typeof parsed.data === "object";

  // Legacy un-stamped drafts (pre-TTL) and anything past the TTL are purged
  // rather than restored, so abandoned PII has a bounded lifetime.
  if (!isEnvelope || now - parsed.savedAt > STUDENT_DRAFT_TTL_MS) {
    clearStudentDraft(storage);
    return null;
  }

  return parsed.data;
}

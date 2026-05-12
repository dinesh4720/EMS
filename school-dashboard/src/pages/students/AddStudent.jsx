/**
 * AddStudent — thin re-export of AddStudentComposer (REVAMP-11).
 *
 * The legacy 3-step drawer flow has been replaced by a composer-style
 * frosted overlay (mirrors AddStaffComposer). This shim preserves the
 * existing imports + forwardRef API (`attemptClose`, `hasUnsavedChanges`)
 * so callers don't need to update.
 */
export { default } from "./AddStudentComposer";

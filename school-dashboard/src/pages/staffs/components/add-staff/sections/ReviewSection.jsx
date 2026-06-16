/**
 * ReviewSection — placeholder for the composer wizard.
 *
 * The current composer shell only renders Identity / Role / Contact /
 * Employment sections in the form body. The left-nav `SECTIONS` array
 * still lists "System access" and "Review & invite" as scroll targets,
 * but the design intentionally defers those — they are populated by
 * downstream flows (class-subject management modal after save, and the
 * existing Edit drawer for system access).
 *
 * This component exists as a stable import point for the shell. It
 * renders nothing today; if a future design needs a review screen it
 * can be wired in here without touching the shell.
 */
export default function ReviewSection() {
  return null;
}

/* ──────────────────────────────────────────────────────────────────
 * TwoPaneDemo fixtures — the canonical list shape from staffs revamp,
 * reused by the standalone detail-pane mount in PatternsSection. Lives
 * in its own module so TwoPaneDemo.jsx only exports the component
 * (keeps react-refresh happy).
 * ────────────────────────────────────────────────────────────────── */
export const TWO_PANE_STAFF = [
  { id: "s1", name: "Asha Sharma", role: "Class teacher · 3-A", status: "ok", initials: "AS" },
  { id: "s2", name: "Vikram Singh", role: "Maths · 4-B", status: "warn", initials: "VS" },
  { id: "s3", name: "Deepak Mehta", role: "Science · 5-A", status: "ok", initials: "DM" },
  { id: "s4", name: "Riya Kapoor", role: "Library", status: "danger", initials: "RK" },
];

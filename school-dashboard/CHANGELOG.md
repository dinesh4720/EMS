# Changelog

All notable changes to the EMS School Dashboard.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
project follows semantic versioning.

## [2.0.0] — 2026-05-12 — Revamp v2 (SHIP)

The full Superhuman/Linear-style design migration. Every screen, primitive,
and cross-cutting concern in the dashboard now composes from the canonical
token + class library introduced in REVAMP-01 and proved out on the Staffs
module (`StaffList`, `AddStaffComposer`, `StaffDetailPane`).

See [`docs/release-notes/2026-05-revamp-v2.md`](docs/release-notes/2026-05-revamp-v2.md)
for the full release notes, smoke-test matrix, and ship sign-off.

### Added
- New token + class library: `src/styles/tokens.css`, `staff.css`,
  `create.css`, `shell.css`, `frosted-overlay.css` — single source for
  surface, density, spacing, motion, and frosted-overlay treatments.
- Two-pane dense list pattern (toolbar + segmented controls + bulk actions
  + frosted detail pane) applied across Students, Staffs, Classes,
  Academics, Fees, Front Desk, Messaging, Settings, Super Admin.
- Composer-modal pattern (section nav + scroll-spy + progress) for every
  multi-step create flow.
- Density / theme / locale toggles in the topbar (REVAMP-84/85).
- i18n coverage for `en` + `hi` (REVAMP-85), with RTL pass on Arabic
  surfaces (REVAMP-91).
- Print stylesheets for receipts, ID cards, report cards, and admit cards
  (REVAMP-86).
- Recharts theme (REVAMP-87), map theme (REVAMP-88), and server-side PDF
  templates (REVAMP-89) aligned with the revamp tokens.
- Visual regression baseline at `tests/visual/revamp.spec.ts`
  (Playwright snapshots × 3 breakpoints).
- QA matrix at `docs/QA_MATRIX.md` (theme × breakpoint × locale per
  screen).
- Onboarding (REVAMP-80), Billing (REVAMP-81), Error pages (REVAMP-82),
  Shortcuts dialog (REVAMP-83).
- Activity feed, notification preferences, print preview, export menu,
  coach marks, inline editing primitives (REVAMP-103..109).

### Changed
- Sidebar, Topbar, Command palette, and global feedback primitives
  rebuilt on the revamp shell (REVAMP-02..05).
- Every page rebuilt to render the four states (skeleton, empty, error,
  success) via `PageShell`. No blank screens, no spinners.
- All buttons, inputs, comboboxes, checkboxes/radios/switches, data
  tables, pagination, avatars, pills, tabs, cards, empty states,
  skeletons, alerts/banners, progress, markdown/file-preview/RTE, file
  upload, and date pickers consolidated to a single primitive each
  (REVAMP-63..79).
- Mobile patterns, touch targets, tooltips, error boundaries, toasts,
  loading buttons, search UX, bulk UX, and filter bars audited and
  unified (REVAMP-94..102).
- Motion language standardised on the tokens.css cubic-beziers.

### Removed
- Legacy HeroUI imports, ad-hoc hex colours, arbitrary Tailwind values
  (`w-[173px]` etc.), dead CSS, unused primitives (REVAMP-60).

### Fixed
- Cross-page bug-fix license: incidental bugs on every revamped surface
  were fixed in the same pass (per REVAMP task acceptance criteria).
- Pixel-perfect consistency audit (REVAMP-62, REVAMP-113) reconciled
  drift between modules.

### Performance
- Lighthouse pass (REVAMP-111) on Dashboard, Students, Staffs, Classes,
  Fees with mobile + desktop budgets.
- Largest chunks (`StyleGuide`, `index-CQQYuxHl`, `ui-vendor`) flagged
  for follow-up code-split — non-blocking for ship.

### Migration
- No data migration required. CSS-only + component-only changes.
- Plan-based feature gates and multi-tenant `schoolId` scoping
  unchanged.

---

## [1.x] — pre-2026-05

See git history. This file starts at the revamp v2 ship gate.

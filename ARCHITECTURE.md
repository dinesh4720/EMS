# EMS School Dashboard — Architecture & Design System Compliance

## Module Map

The school-dashboard is organised into the following modules (pages under `src/pages/`):

| # | Module | Dir | Design Audit | Accessibility | Responsive | Tests |
|---|--------|-----|--------------|-------------|------------|-------|
| 1 | Dashboard | `dashboard/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | Analytics | `Analytics.jsx` | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | Staffs | `staffs/` | ✅ | ✅ | ✅ | ⬜ |
| 4 | Students | `students/` | ✅ | ✅ | ✅ | ⬜ |
| 5 | Classes | `classes/` | ✅ | ⬜ | ⬜ | ⬜ |
| 6 | Academics | `academics/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | Calendar | `calendar/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 8 | Fees | `fees/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 9 | Front Desk | `front-desk/` | 🔄 IN PROGRESS | ⬜ | ⬜ | ⬜ |
| 10 | Homework | `homework/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 11 | Hostel | `hostel/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 12 | Intake Forms | `intake-forms/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 13 | Inventory | `inventory/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 14 | Library | `library/` | ✅ | ⬜ | ⬜ | ⬜ |
| 15 | Messaging | `messaging/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 16 | PTM | `ptm/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 17 | Reports | `reports/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 18 | Settings | `settings/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 19 | Super Admin | `super-admin/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 20 | Transport | `transport/` | ⬜ | ⬜ | ⬜ | ⬜ |
| 21 | Data Tools | `data-tools/` | ⬜ | ⬜ | ⬜ | ⬜ |

Legend: ✅ Done | 🔄 In Progress | ⬜ Not started

## Design System Compliance

### Reference Implementation
- **Tokens:** `src/styles/tokens.css`
- **Primitives:** `src/styles/shell.css`, `src/styles/staff.css`, `src/styles/create.css`
- **Canonical list view:** `src/pages/staffs/StaffList.jsx`
- **Canonical detail pane:** `src/pages/staffs/StaffDetailPane.jsx`
- **Canonical composer:** `src/pages/staffs/AddStaffComposer.jsx`

### Rules
1. Never inline a hex colour — always use a token (`var(--accent)`, `var(--fg-muted)`, etc.).
2. Never import from `@heroui/react` in new or refactored screens — use design-system primitives from `src/components/ui` or bare CSS classes.
3. Every fetching screen must render four states: **skeleton**, **empty**, **error**, **success**.
4. List views must reuse the two-pane shell, toolbar + segmented filter, and density table patterns from Staff/Student List.
5. Forms must use Zod validation and `.field`/`.input`/`.select`/`.textarea` atoms.
6. Modals/drawers must use the `.composer` or `.drawer` patterns instead of HeroUI `<Modal>`.

### Audit History

| Date | Module | Issue | Key Findings | Status |
|------|--------|-------|--------------|--------|
| 2026-05-22 | Front Desk | — | HeroUI usage in AppointmentsList, CallLogsList, FeedbacksList, FrontDeskDashboard, GatePassPrint; inconsistent with VisitorLog/GatePassLog which use DataTable | 🔄 Awaiting approval |

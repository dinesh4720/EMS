# EMS School Dashboard — Architecture

## Overview

The EMS School Dashboard is a React-based single-page application built with Vite, Tailwind CSS v4, and a custom design system. The canonical UI reference is the **Staffs revamp** (REVAMP-01..114).

## Design System Compliance

### Audit Status by Module

| Module | Status | Issue | Notes |
|--------|--------|-------|-------|
| Dashboard / Auth / Shell | ⬜ Pending | — | |
| Students | ⬜ Pending | — | Token violations being fixed in DK-690 |
| Classes | ⬜ Pending | — | |
| Staffs | ✅ Canonical | — | Reference implementation |
| Academics | ✅ Audited | DK-608 | Fixes merged |
| Fees | ✅ Audited | DK-598 / DK-512 | Fixes merged |
| Messaging | ⬜ Pending | — | |
| **Front Desk** | ❌ Audited — NON-COMPLIANT | **DK-750** | 18 findings (4 blockers, 6 high, 5 medium, 3 low). Waiting for workspace owner thumbs-up approval. |
| Homework / PTM / Calendar | ⬜ Partial | DK-664 / DK-679 | Calendar fixes merged |
| Reports / Analytics / Data Tools | ⬜ Pending | — | |
| Transport | ✅ Audited | DK-671 | Fixes merged |
| Hostel | ⬜ Pending | — | |
| Library | ⬜ Pending | — | |
| Inventory | ✅ Audited | DK-598 | Fixes merged |
| Settings | ⬜ Pending | — | |
| Super-Admin | ⬜ Pending | — | |
| Audit Logs | ⬜ Pending | — | New page — needs audit |
| Expenses | ⬜ Partial | DK-598 | 6 token violations fixed |
| Intake Forms | ⬜ Pending | — | |

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Canonical reference or fully audited and compliant |
| ⬜ | Pending audit |
| ⬜ Partial | Some fixes applied, full audit pending |
| ❌ | Audited and non-compliant — fixes waiting for approval |

### Blocking Issues (Front Desk — DK-750)

1. **B1:** `GatePassPrint.jsx` uses 30+ hardcoded Tailwind color classes
2. **B2:** Shared `Chip.jsx` component uses hardcoded Tailwind palettes
3. **B3:** Shared `ErrorState.jsx` component uses hardcoded Tailwind palettes
4. **B4:** `AdmissionsList.jsx` missing canonical four data states (skeleton, empty, error, success)

### Design System Files

| Layer | File |
|-------|------|
| Tokens | `src/styles/tokens.css` |
| App shell + buttons + tables + status pills | `src/styles/shell.css` |
| Staff list — two-pane + frosted detail pane | `src/styles/staff.css` |
| Composer overlay + drawer + form atoms | `src/styles/create.css` |
| Frosted overlay base | `src/styles/frosted-overlay.css` |
| Front desk specific | `src/styles/front-desk.css` |
| Reference pages | `src/pages/staffs/StaffList.jsx`, `StaffListRow.jsx`, `StaffDetailPane.jsx`, `AddStaffComposer.jsx` |
| Style Guide | `src/pages/StyleGuide.jsx` |
| IA & Checklist | `src/pages/IA.jsx` |

## Rules

- Never inline a hex color — always use a token (`var(--accent)`, `var(--fg-muted)`, `var(--surface-2)`)
- Never duplicate primitive CSS — use `.btn`, `.chip`, `.status`, `.input`, `.field`, `.seg`, `.composer`
- Every fetching screen must render four data states: skeleton, empty, error, success
- All new screens must compose from the design system — never style ad-hoc

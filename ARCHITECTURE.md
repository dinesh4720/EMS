# EMS School Dashboard — Architecture & Design System Compliance

## Overview
This document tracks the design system compliance status of every module in the school-dashboard.
The canonical reference implementation lives in:
- `src/pages/staffs/StaffList.jsx`, `StaffListRow.jsx`, `StaffDetailPane.jsx`, `AddStaffComposer.jsx`
- `src/pages/students/StudentsList.jsx`, `StudentListRow.jsx`, `StudentDetailPane.jsx`

## Module Checklist

| Module | Design Audit | Accessibility | Responsive | Tests |
|--------|-------------|---------------|------------|-------|
| Dashboard | ⏳ | ⏳ | ⏳ | ⏳ |
| Staff | ✅ List/Add | ⏳ | ✅ List | ⏳ |
| Students | ✅ List/Add | ⏳ | ✅ List | ⏳ |
| Classes | ⏳ | ⏳ | ⏳ | ⏳ |
| Calendar | ⏳ | ⏳ | ⏳ | ⏳ |
| Messaging | ⏳ | ⏳ | ⏳ | ⏳ |
| Fees | ⏳ | ⏳ | ⏳ | ⏳ |
| Academics | ⏳ | ⏳ | ⏳ | ⏳ |
| Homework | ⏳ | ⏳ | ⏳ | ⏳ |
| PTM | ⏳ | ⏳ | ⏳ | ⏳ |
| **Front Desk** | ❌ **ISSUES FOUND** | ⏳ | ⏳ | ⏳ |
| Inventory | ⏳ | ⏳ | ⏳ | ⏳ |
| Hostel | ⏳ | ⏳ | ⏳ | ⏳ |
| Transport | ⏳ | ⏳ | ⏳ | ⏳ |
| Library | ⏳ | ⏳ | ⏳ | ⏳ |
| Reports | ⏳ | ⏳ | ⏳ | ⏳ |
| Data Tools | ⏳ | ⏳ | ⏳ | ⏳ |
| Intake Forms | ⏳ | ⏳ | ⏳ | ⏳ |
| Settings | ⏳ | ⏳ | ⏳ | ⏳ |
| Super Admin | ⏳ | ⏳ | ⏳ | ⏳ |
| Architecture (Style Guide + IA) | ✅ | ✅ | ✅ | ⏳ |

Legend: ✅ Done | ⏳ Pending | 🔍 In Progress | ❌ Blocked

## Design System Compliance

### Token Usage
- ✅ Staff/Student lists use design tokens exclusively
- ❌ Front Desk lists have hardcoded colors and spacing (audit findings posted, waiting for owner approval)
- ⏳ All other modules need audit

### Component Patterns
- **Two-pane list** (grid layout, left scrolls, right detail pane): Staff List, Student List
- **Toolbar + segmented filter + search**: Staff List, Student List
- **Filter pills bar**: Staff List, Student List
- **Bulk action bar**: Staff List, Student List
- **Detail pane** (frosted, sticky head/foot): Staff Detail Pane, Student Detail Pane
- **Composer overlay**: Add Staff Composer

### Front Desk Audit Findings (2026-05-18)
See issue `[Design System Audit] Front Desk - 2026-05-18` for full details.
1. AppointmentsList, CallLogsList, FeedbacksList use HeroUI Table/Button/Input/Modal/Select/Chip/Tabs — should use design system primitives
2. VisitorLog, GatePassLog use custom DataTable — should use two-pane list pattern
3. No two-pane layout with URL-driven selection on ANY list
4. No keyboard navigation (↑/↓, /, Esc) on ANY list
5. Missing skeleton states on AppointmentsList, CallLogsList, FeedbacksList
6. Hardcoded Tailwind color classes (default-500, warning-50, etc.) in Appointments, CallLogs, Feedbacks
7. Status pills used for non-status data (source in AdmissionsList)
8. FrontDeskDashboard.jsx (legacy tabbed shell) still active and uses HeroUI

**Status:** Findings posted. Waiting for owner thumbs-up approval on which items to fix.

### Pages that need alignment
Modules with list views must reuse the same patterns as Staff/Student List:
1. Two-pane layout with URL-driven selection
2. Toolbar with segmented filters + search + bulk actions
3. Filter pills bar for advanced filtering
4. Keyboard navigation (↑/↓, Enter, Esc, /)
5. Mobile drawer for detail pane below 1100px
6. Skeleton, empty, error, success states

## Audit Workflow
1. Open the IA page (`/ia`) or read this ARCHITECTURE.md to see the checklist
2. Pick ONE module that has unchecked items
3. Read only that module's pages and components
4. Update the IA page source code (`src/pages/IA.jsx`) or this file with findings
5. Move to the next module

## Style Guide
Interactive style guide at `/style-guide`.

## IA & Checklist
Module tracker at `/ia`.

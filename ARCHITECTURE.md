# EMS School Dashboard — Information Architecture

> Last updated: 2026-05-17 by @ui-ux-lead
> This document is the single source of truth for all pages, features, and flows.
> **Rule:** Any approved UI/UX change MUST update this file before implementation.

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Page Directory](#page-directory)
3. [Feature Matrix](#feature-matrix)
4. [Navigation Structure](#navigation-structure)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Design System Compliance](#design-system-compliance)
7. [Pending Changes (Awaiting Approval)](#pending-changes)

---

## Module Overview

| Module | Code Path | Pages | Status |
|--------|-----------|-------|--------|
| Students | `src/pages/students/` | 8+ | Active |
| Staff | `src/pages/staffs/` | 6+ | Active |
| Academics | `src/pages/academics/` | 4+ | Active |
| Classes | `src/pages/classes/` | 4+ | Active |
| Fees | `src/pages/fees/` | 6+ | Active |
| Attendance | `src/pages/staffs/` (shared) + components | 3+ | Active |
| Timetable | `src/pages/classes/` + wizard | 3+ | Active |
| Exams | `src/pages/academics/` | 4+ | Active |
| Messaging | `src/pages/messaging/` | 5+ | Active |
| Front Desk | `src/pages/front-desk/` | 4+ | Active |
| Hostel | `src/pages/hostel/` | 3+ | Active |
| Transport | `src/pages/transport/` | 3+ | Active |
| Library | `src/pages/library/` | 3+ | Active |
| Inventory | `src/pages/inventory/` | 3+ | Active |
| Settings | `src/pages/settings/` | 27+ sub-pages | Active |
| Super Admin | `src/pages/super-admin/` | 4+ | Active |
| Data Tools | `src/pages/data-tools/` | 3+ | Active |
| Calendar | `src/pages/calendar/` | 2+ | Active |
| PTM | `src/pages/ptm/` | 3+ | Active |
| Reports | `src/pages/reports/` | 4+ | Active |
| Homework | `src/pages/homework/` | 3+ | Active |
| Intake Forms | `src/pages/intake-forms/` | 3+ | Active |

---

## Page Directory

### Authentication
| Page | Route | File | Notes |
|------|-------|------|-------|
| Login | `/login` | `src/pages/auth/Login.jsx` | 3 animation variants in progress |
| Signup | `/signup` | `src/pages/auth/Signup.jsx` | Invite-based |
| Forgot Password | `/forgot-password` | `src/pages/auth/ForgotPassword.jsx` | |

### Dashboard
| Page | Route | File | Notes |
|------|-------|------|-------|
| Main Dashboard | `/dashboard` | `src/pages/Dashboard.jsx` | Role-based widgets |
| Staff Dashboard | `/staff-dashboard` | `src/pages/staffs/Dashboard.jsx` | |

### Students Module
| Feature | Page | Route | File |
|---------|------|-------|------|
| Student List | List view | `/students` | `src/pages/students/index.jsx` |
| Add Student | Form (multi-step) | `/students/add` | `src/pages/students/StudentForm/AddStudent.jsx` |
| Edit Student | Form | `/students/edit/:id` | `src/pages/students/StudentForm/EditStudent.jsx` |
| Student Profile | Detail view | `/students/:id` | `src/pages/students/StudentDetail.jsx` |
| Documents | Document manager | `/students/:id/documents` | `src/pages/students/components/StudentDocuments.jsx` |
| Bulk Import | CSV import | `/students/import` | `src/pages/students/BulkImport.jsx` |
| Promotion | Class promotion | `/students/promotion` | `src/pages/students/promotion/` |
| Health Info | Health section (new) | Part of Add/Edit form | `src/pages/students/StudentForm/` |

### Staff Module
| Feature | Page | Route | File |
|---------|------|-------|------|
| Staff List | List view | `/staffs` | `src/pages/staffs/index.jsx` |
| Add Staff | Form | `/staffs/add` | `src/pages/staffs/AddStaff.jsx` |
| Edit Staff | Form | `/staffs/edit/:id` | `src/pages/staffs/EditStaff.jsx` |
| Profile | Detail view | `/staffs/:id` | `src/pages/staffs/StaffDetail.jsx` |
| Attendance | Marking & history | `/staffs/attendance` | `src/pages/staffs/Attendance.jsx` |
| Payroll | Salary & payslips | `/staffs/payroll` | `src/pages/staffs/Payroll.jsx` |

### Fees Module
| Feature | Page | Route | File |
|---------|------|-------|------|
| Fee Collection | Payment workflow | `/fees/collection` | `src/pages/fees/Collection.jsx` |
| Fee Structure | Templates & rules | `/fees/structure` | `src/pages/fees/Structure.jsx` |
| Fee Reports | Analytics | `/fees/reports` | `src/pages/fees/Reports.jsx` |
| Defaulters | Overdue list | `/fees/defaulters` | `src/pages/fees/Defaulters.jsx` |
| Refunds | Refund workflow | `/fees/refunds` | `src/pages/fees/Refunds.jsx` |
| Templates | Fee template mgmt | `/fees/templates` | `src/pages/fees/Templates.jsx` |

### Settings Module
| Category | Sub-Pages | Route Pattern |
|----------|-----------|---------------|
| Institution | School info, branding | `/settings/institution` |
| Academic | Years, terms, grading | `/settings/academic` |
| Users & Roles | User mgmt, permissions | `/settings/users`, `/settings/roles` |
| Fees | Heads, templates, rules | `/settings/fees` |
| Staff | Departments, designations | `/settings/staff` |
| Students | Categories, documents | `/settings/students` |
| Communication | Email, SMS, campaigns | `/settings/communication` |
| Data Management | Trash, seed, cleanup | `/settings/trash`, `/settings/seed-data` |
| Integrations | Webhooks, SCIM, API | `/settings/integrations` |
| Security | Auth, sessions, 2FA | `/settings/security` |
| Payroll | Salary components, templates | `/settings/payroll` |
| Theme | Colors, fonts, layout | `/settings/theme` |
| Front Desk | Visitor types, gate pass | `/settings/front-desk` |
| Homework | Categories, settings | `/settings/homework` |
| Calendar | Holidays, events | `/settings/calendar` |
| Notifications | Channels, templates | `/settings/notifications` |
| Billing | Subscription, invoices | `/settings/billing` |

---

## Feature Matrix

### Core Features by Module

```
Students
├── Profile Management
│   ├── Basic Info (name, DOB, gender, photo)
│   ├── Contact Info (address, phone, email)
│   ├── Guardians (multiple, with relations)
│   ├── Documents (upload, view, delete)
│   └── Health Info [NEW] (allergies, medications, emergency contacts)
├── Academic
│   ├── Class & Section assignment
│   ├── Roll Number & Admission ID
│   ├── Marks & Grades
│   └── Report Cards
├── Fees
│   ├── Fee Status (paid/partial/unpaid)
│   ├── Installment tracking
│   └── Fee receipts
└── Operations
    ├── Bulk Import (CSV)
    ├── Bulk Export
    ├── Promotion (class-to-class)
    ├── TC (Transfer Certificate)
    └── Status Changes (active/inactive/alumni)

Staff
├── Profile Management
│   ├── Basic Info
│   ├── Contact & Address
│   ├── Designation & Department
│   ├── Qualifications
│   └── Documents
├── Roles & Permissions
├── Attendance
│   ├── Daily marking
│   ├── Monthly reports
│   └── Leave management
└── Payroll
    ├── Salary components
    ├── Monthly payroll run
    ├── Payslip generation
    └── Reversal workflow

Academics
├── Exams
│   ├── Exam creation
│   ├── Marks entry
│   ├── Result publishing
│   └── Analysis (subject-wise, rank, toppers)
├── Grading
│   ├── CBSE report cards
│   ├── CCE grading
│   └── Custom grading scales
└── Performance
    ├── Class performance dashboard
    ├── Student performance trends
    └── Comparative analysis

Settings
├── School Setup
├── User Management
├── Fee Configuration
├── Staff Configuration
├── Academic Configuration
├── Communication Setup
├── Data Tools
└── Theme & Branding
```

---

## Navigation Structure

```
Sidebar Navigation
├── Dashboard
├── Students
│   ├── All Students
│   ├── Add Student
│   ├── Bulk Import
│   ├── Promotion
│   └── Alumni
├── Staff
│   ├── All Staff
│   ├── Add Staff
│   ├── Attendance
│   └── Payroll
├── Academics
│   ├── Exams
│   ├── Marks Entry
│   ├── Results
│   └── Performance
├── Classes
│   ├── All Classes
│   ├── Timetable
│   └── Subjects
├── Fees
│   ├── Collection
│   ├── Structure
│   ├── Reports
│   └── Defaulters
├── Attendance
│   ├── Student Attendance
│   └── Staff Attendance
├── Messaging
│   ├── Chat
│   ├── Announcements
│   ├── Campaigns
│   └── Reminders
├── Front Desk
│   ├── Visitors
│   ├── Appointments
│   ├── Gate Pass
│   └── Call Logs
├── Hostel
├── Transport
├── Library
├── Inventory
├── Homework
├── Calendar
├── PTM
├── Reports
├── Analytics
├── Data Tools
├── Settings
│   └── [27+ sub-pages]
└── Super Admin
    ├── Schools
    ├── Jobs
    └── Subscriptions
```

---

## User Roles & Permissions

| Role | Modules | Special Access |
|------|---------|---------------|
| Super Admin | All | Multi-school, billing, system config |
| Principal | All (read) + most (write) | Analytics, reports, approvals |
| Admin | All except Super Admin | User mgmt, settings |
| Teacher | Academics, Attendance, Homework, Messaging | Own class/subjects only |
| Accountant | Fees, Staff (payroll), Reports | Financial data only |
| Front Desk | Front Desk, Students (view), Visitors | Limited edit |
| Parent (Portal) | Own child's data, Messaging, Fees | Read-only mostly |
| Student (Portal) | Own data, Homework, Results | Read-only |

---

## Design System Compliance

| Area | Status | Checked By | Last Check |
|------|--------|-----------|------------|
| Color Tokens | ✅ Compliant | @design-system | 2026-05-17 |
| Typography | ⚠️ Partial | @design-system | 2026-05-17 |
| Spacing Scale | ✅ Compliant | @design-system | 2026-05-17 |
| Component Library | ⚠️ Partial | @design-system | 2026-05-17 |
| Iconography | ✅ Compliant | @design-system | 2026-05-17 |
| Form Patterns | ⚠️ Inconsistent | @design-system | 2026-05-17 |
| Mobile Responsive | ⚠️ Partial | @design-system | 2026-05-17 |
| Accessibility | ❌ Needs Work | @design-system | 2026-05-17 |

---

## Pending Changes (Awaiting Approval)

> This section tracks UI/UX changes proposed by @ui-ux-lead that are awaiting your thumbs-up.
> Format: `[Issue #] — Description — Status`

| Issue | Change | Status | Approved |
|-------|--------|--------|----------|
| — | — | — | — |

---

## Change Log

| Date | Issue | Change | Approved By |
|------|-------|--------|-------------|
| 2026-05-17 | — | Initial architecture document created | @tech-lead |

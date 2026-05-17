# EMS School Dashboard — Information Architecture

> Last updated: 2026-05-18  
> Maintained by: @ui-ux-lead

---

## 1. Application Shell

```
App
├── AuthProvider
├── AppProvider
├── PermissionProvider
├── ChatNotificationProvider
├── AiAssistantProvider
│   └── AiAssistantLayout
│       ├── Sidebar (collapsible, responsive)
│       ├── Topbar
│       ├── TrialBanner
│       ├── StaleDataBanner
│       ├── OfflineBanner
│       ├── BeforeSchoolAlert
│       └── main#content
│           └── Routes (see §2)
├── PayrollReminder
├── SessionTimeoutWarning
└── CookieConsentBanner
```

### Layout behaviours
- Sidebar auto-collapses below `1024 px` viewport width.
- Settings pages and `/timetable-wizard` render full-width (`p-0`, no max-width constraint).
- All other pages are constrained to `max-w-[1600px]` with `p-2 md:p-3`.
- Skip-to-content link available for keyboard users (WCAG 2.4.1).

---

## 2. Route Map

### 2.1 Public routes (no auth)
| Route | Page | Notes |
|-------|------|-------|
| `/form/:token` | `PublicFormSubmission` | External intake-form submissions |
| `/privacy` | `PrivacyPolicy` | Static legal page |
| `/login` | `Login` | Redirects authenticated users to `/` or `/super-admin` |
| `/signup` | `Signup` | Redirects authenticated users |

### 2.2 Super-admin route
| Route | Page | Guard |
|-------|------|-------|
| `/super-admin` | `SuperAdminDashboard` | `isSuperAdminRole` only |

### 2.3 Authenticated module routes
All wrapped in `PermissionGuard(module="...")` + `ErrorBoundary`.

| Route | Module | Lazy-loaded page | Sub-routes / tabs |
|-------|--------|------------------|-------------------|
| `/` | `dashboard` | `Dashboard` | — |
| `/analytics` | `analytics` | `Analytics` | — |
| `/front-desk/*` | `front-desk` | `FrontDeskPage` → `FrontDeskDashboard` | Overview, Visitors, Gate Passes, Appointments, Feedbacks, Call Logs |
| `/staffs/*` | `staff` | `StaffsPage` | StaffList, AddStaff, StaffDashboard, StaffAttendance, StaffPayroll, BulkSubjectAssignment, StaffAssignmentPanel, TeacherTimetableEditor |
| `/students/promotion` | `students` | `StudentPromotionPage` | — |
| `/students/transfer-certificate` | `students` | `TransferCertificatePage` | — |
| `/students/*` | `students` | `StudentsPage` | StudentsList, StudentDashboard, StudentAttendance, StudentFormSubmissions, AddStudent |
| `/classes/*` | `classes` | `ClassesPage` | ClassesList, ClassDashboard, Attendance, Subjects, Timetable, Substitution, BulkClassTeacherAssignment, TimetableValidationDashboard |
| `/calendar` | `timetable` | `CalendarPage` | — |
| `/messaging/*` | `messaging` | `MessagingPage` | ChatFull, Announcements, Notifications, Reminders, CommunicationLogs, EmailCampaignsPage (commented out) |
| `/fees/*` | `fees` | `FeesPage` | FeeDefaulters, FeeStructureAssignment, FeeTemplatesManagement, Payments, Refunds |
| `/inventory/*` | `inventory` | `InventoryPage` | InventoryDashboard, Assets, Audits, Maintenance, Procurement, Vendors, Reports |
| `/hostel/*` | `hostel` | `HostelPage` | HostelDashboard, HostelList, RoomsList, AllocationsList |
| `/transport/*` | `transport` | `TransportPage` | RoutesTab, VehiclesTab |
| `/library/*` | `library` | `LibraryPage` | LibraryDashboard, BooksList, IssuedBooksList, LibraryReports |
| `/reports/*` | `reports` | `ReportsPage` | ReportsPage, ExportCenter |
| `/academics/*` | `academics` | `AcademicLayout` | ExamManagement, ExamDetail, ResultsEntry, ClassPerformance, CBSEReportCardPage, CCEGradingPage, PerformanceDashboard |
| `/ptm` | `academics` | `PTMPage` | — |
| `/settings/*` | `settings` | `SettingsPage` | InstitutionSettings, UserManagement, RolesAccess, AcademicSettings, PeriodSettings, HolidaySettings, AttendanceRules, LeaveSettings, PayrollSettings, SalaryTemplates, FeeHeadsUnified, FeeManagementSettings, FeeRulesSettings, PromotionRulesSettings, SubscriptionSettings, SCIMSettings, WebhooksPage, NPSAnalyticsPage, ActiveSessions, PermissionRequests, ParentManagement, DataCleanupSettings, SeedDataSettings, StaffIdSettings, IntakeFormsSettings, AdmissionFormSettings, CommunicationSettings, TrashSettings, HierarchySettings |
| `/intake-forms/assignments` | `intake-forms` | `FormAssignments` | — |
| `/intake-forms/submissions` | `intake-forms` | `FormSubmissions` | — |
| `/intake-forms/funnel` | `intake-forms` | `EnrollmentFunnel` | — |
| `/ai-assistant` | `aiAssistant` | `AiAssistantPage` | Feature-gated (`aiAssistant` capability) |
| `/timetable-wizard` | `timetable` | `TimetableWizardPage` | — |
| `/data-tools/*` | `dataTools` | `DataToolsPage` | BulkImport, GovtExport, BackgroundJobs |
| `/accounts/*` | — | Redirects to `/fees` | Legacy alias |
| `/style-guide` | — | `StyleGuide` | Dev-only (`import.meta.env.DEV`) |
| `*` | — | 404 page | — |

---

## 3. Page Inventory (`src/pages/`)

### Top-level pages
- `AiAssistantPage.jsx`
- `Analytics.jsx`
- `Dashboard.jsx`
- `Login.jsx`
- `PrivacyPolicy.jsx`
- `PublicFormSubmission.jsx`
- `Signup.jsx`
- `StyleGuide.jsx`

### Module directories
| Directory | Page count (jsx) | Key entry |
|-----------|-----------------|-----------|
| `academics/` | 10 | `index.jsx` (AcademicLayout) |
| `calendar/` | 1 + 5 components | `index.jsx` |
| `classes/` | 9 + 19 components | `index.jsx` |
| `data-tools/` | 4 | `index.jsx` |
| `fees/` | 6 | `index.jsx` |
| `front-desk/` | 9 | `index.jsx` → `FrontDeskDashboard` |
| `homework/` | 3 | `index.jsx` |
| `hostel/` | 5 | `index.jsx` |
| `intake-forms/` | 4 | — (flat routes in App.jsx) |
| `inventory/` | 8 | `index.jsx` |
| `library/` | 7 | `index.jsx` |
| `messaging/` | 7 + 24 components/hooks | `index.jsx` |
| `ptm/` | 1 | `index.jsx` |
| `reports/` | 3 | `index.jsx` |
| `settings/` | 28 | `index.jsx` |
| `staffs/` | 10 + 17 components/hooks | `index.jsx` |
| `students/` | 17 + 50+ components/hooks | `index.jsx` |
| `super-admin/` | 5 | `index.jsx` |
| `transport/` | 5 | `index.jsx` |

---

## 4. Navigation Structure

### Sidebar (primary nav)
The Sidebar component drives the main navigation. Items map 1:1 with the route modules above.

### In-module navigation patterns
| Pattern | Used by |
|---------|---------|
| **Tab bar** (horizontal, sticky) | FrontDeskDashboard, AcademicLayout, several Settings pages |
| **Sub-routes with `<Routes>`** | Students, Staffs, Classes, Messaging, Fees, Inventory, Hostel, Transport, Library, Reports, Settings, Data-tools |
| **Drawer / Modal overlays** | AddStudent, StudentDetailDrawers, ExamDetailModal, CreateExamModal, various bulk-action modals |
| **Wizard steps** | StudentPromotionPage, TimetableWizardPage |

---

## 5. Permission Model

Every authenticated route is wrapped in `PermissionGuard(module="<name>")`. The module name must match an entry in the backend permissions matrix.

| Module key | Routes |
|------------|--------|
| `dashboard` | `/` |
| `analytics` | `/analytics` |
| `front-desk` | `/front-desk/*` |
| `staff` | `/staffs/*` |
| `students` | `/students/*`, `/students/promotion`, `/students/transfer-certificate` |
| `classes` | `/classes/*` |
| `timetable` | `/calendar`, `/timetable-wizard` |
| `messaging` | `/messaging/*` |
| `fees` | `/fees/*`, `/accounts/*` |
| `inventory` | `/inventory/*` |
| `hostel` | `/hostel/*` |
| `transport` | `/transport/*` |
| `library` | `/library/*` |
| `reports` | `/reports/*` |
| `academics` | `/academics/*`, `/ptm` |
| `settings` | `/settings/*` |
| `intake-forms` | `/intake-forms/*` |
| `dataTools` | `/data-tools/*` |
| `aiAssistant` | `/ai-assistant` (additionally gated by `FeatureGate`) |

---

## 6. Audit History

| Date | Module | Issue | Status |
|------|--------|-------|--------|
| *—none yet—* | — | — | — |

---

*End of document*

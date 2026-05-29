# EMS School Dashboard — Architecture & Design System Compliance

## Module Map

| # | Module | Pages | Design Audit | Accessibility | Responsive | Tests |
|---|--------|-------|-------------|---------------|------------|-------|
| 1 | Academics | AcademicsPage, ExamManagement, ResultsEntry, ClassPerformance, etc. | ✅ 2026-05-29 | ⬜ | ⬜ | ⬜ |
| 2 | Calendar | CalendarPage | 🔄 2026-05-29 | ⬜ | ⬜ | ⬜ |
| 3 | Classes | ClassesPage, ClassDashboard, Subjects, Timetable, etc. | ✅ 2026-05-20 | ⬜ | ⬜ | ⬜ |
| 4 | Dashboard | DashboardPage | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | Data Tools | BackgroundJobs, BulkImport, GovtExport | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | Fees | FeesPage, Refunds, FeeStructureAssignment | ✅ 2026-05-22 | ⬜ | ⬜ | ⬜ |
| 7 | Front Desk | FrontDeskPage, Appointments, VisitorLog, etc. | ✅ 2026-05-18 | ⬜ | ⬜ | ⬜ |
| 8 | Homework | HomeworkList, CreateHomeworkModal | ⬜ | ⬜ | ⬜ | ⬜ |
| 9 | Hostel | HostelDashboard, HostelList, RoomsList, AllocationsList | ✅ 2026-05-23 | ⬜ | ⬜ | ⬜ |
| 10 | Intake Forms | EnrollmentFunnel, FormAssignments, FormSubmissions | ⬜ | ⬜ | ⬜ | ⬜ |
| 11 | Inventory | InventoryDashboard, Assets, Vendors, Maintenance, etc. | ✅ 2026-05-21 | ⬜ | ⬜ | ⬜ |
| 12 | Library | LibraryDashboard, BooksList, IssuedBooksList, Reports | ✅ 2026-05-21 | ⬜ | ⬜ | ⬜ |
| 13 | Messaging | Announcements, Chat, EmailCampaigns, Notifications | ⬜ | ⬜ | ⬜ | ⬜ |
| 14 | PTM | PTMSessions, CreatePTMSessionModal | ⬜ | ⬜ | ⬜ | ⬜ |
| 15 | Reports | ReportsPage, ExportCenter | ⬜ | ⬜ | ⬜ | ⬜ |
| 16 | Settings | InstitutionSettings, AcademicSettings, FeeRulesSettings, etc. | ⬜ | ⬜ | ⬜ | ⬜ |
| 17 | Staffs | StaffList, StaffDashboard, LeaveManagement, Payroll | ⬜ | ⬜ | ⬜ | ⬜ |
| 18 | Students | StudentsList, StudentDashboard, Attendance, Promotion, TC | ⬜ | ⬜ | ⬜ | ⬜ |
| 19 | Style Guide | StyleGuidePage | N/A | N/A | N/A | N/A |
| 20 | Super Admin | SchoolsPanel, FeatureFlags, GrowthAnalytics | ⬜ | ⬜ | ⬜ | ⬜ |
| 21 | Transport | RoutesTab, VehiclesTab, RouteModal, VehicleModal | 🔄 2026-05-30 | ⬜ | ⬜ | ⬜ |

Legend:
- ⬜ = Not audited / not started
- 🔄 = Audit in progress / findings posted, awaiting approval
- ✅ = Audit complete (findings posted, may have approved fixes pending)

## Design System Compliance

### Completed Audits

#### Front Desk — 2026-05-18 (DK-204)
- Status: Complete
- Key findings: HeroUI imports, hardcoded colors, missing canonical list patterns

#### Classes — 2026-05-20 (DK-325)
- Status: Complete, child issues created
- Key findings: HeroUI imports in Subjects/ClassSettingsPanel/Substitution/BulkClassTeacherAssignment, hardcoded semantic colors in OverviewTab/StudentsTab/AcademicsTab, accessibility gaps, responsive sidebar collapse
- Child issues: DK-417 (HeroUI migration), DK-418 (token colors), DK-419 (a11y), DK-420 (responsive)

#### Library — 2026-05-21 (DK-446)
- Status: Complete, fixes implemented and QA passed
- Key findings: Hardcoded colors in BooksList/IssuedBooksList/LibraryDashboard/LibraryReports, HeroUI Breadcrumbs, missing canonical list patterns
- Fixes merged: Token swaps in 6 files, Breadcrumbs migration, a11y attributes added

#### Inventory — 2026-05-21 (DK-461)
- Status: Complete, approved token fixes implemented 2026-05-29
- Key findings: HeroUI imports, hardcoded colors, missing canonical list patterns, toolbar misalignment, accessibility gaps, StatCard hardcoded color map
- Fixes merged: Token swaps in InventoryDashboard/Assets/Procurement, StatCard colorMap migrated to design tokens (ok/warn/danger/info/success/warning/primary)

#### Fees — 2026-05-22 (DK-512)
- Status: Complete, fixes merged 2026-05-23
- Key findings: FeesPage plain text loading + missing ErrorState, Refunds HeroUI imports, hardcoded colors in status badges/modal/search, window.prompt usage, missing canonical list patterns, accessibility gaps
- Fixes: design-system/approved-fixes-2026-05-18 branch merged

#### Hostel — 2026-05-23 (DK-561)
- Status: Complete, fixes merged 2026-05-23
- Key findings: HeroUI imports, hardcoded colors, missing canonical list patterns
- Fixes merged: DK-583 (token violations), DK-584 (HeroUI migration), DK-586 (AllocationsList tokens)

#### Academics — 2026-05-29 (DK-608)
- Status: Complete, fixes merged 2026-05-30
- Key findings: Hardcoded colors in ClassPerformance, inline styles in AcademicsPage, missing layout primitives on all pages, inconsistent HeroUI adoption, bespoke components instead of shared DataTable/StatCard
- Fixes merged: Token swaps in ClassPerformance/AcademicsPage/PerformanceDashboard, PageShell wrappers added to all 5 pages, EmptyState adoption, inline styles removed
- Child issues: DK-611 (HeroUI standardization squad decision), DK-612 (PageShell migration plan)

#### Transport — 2026-05-30 (DK-671)
- Status: Audit complete, fixes in PR #124 awaiting merge
- Key findings: HeroUI Breadcrumbs, hardcoded Tailwind colors (text-gray-400, text-red-600, text-amber-600), missing aria-labels on action buttons, missing scope=col on print preview tables
- Fixes: design-system/DK-671-transport-audit-fixes branch — token swaps, Breadcrumbs migration, a11y attributes added, translation keys added

#### Calendar — 2026-05-29 (DK-656)
- Status: Audit in progress, findings posted, awaiting approval
- Key findings: Missing layout primitives (PageShell), HeroUI imports across all 8 components, HeroUI semantic colors instead of design tokens, critical keyboard accessibility gaps in ScheduleView/StaffSidebar, missing EmptyState usage, undefined CSS class (`writing-mode-vertical`), no responsive sidebar collapse
- Blocking: Token violations, a11y gaps, missing canonical patterns

### Canonical Reference
- **Staff List:** `src/pages/staffs/StaffList.jsx`, `StaffListRow.jsx`, `StaffDetailPane.jsx`
- **Student List:** `src/pages/students/StudentsList.jsx`, `StudentListRow.jsx`, `StudentDetailPane.jsx`
- **Tokens:** `src/styles/tokens.css`
- **Primitives:** `src/styles/shell.css`, `src/styles/staff.css`, `src/styles/create.css`
- **Style Guide:** `src/pages/StyleGuide.jsx`

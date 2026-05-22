# EMS School Dashboard — UI/UX Architecture

> Single source of truth for the school-dashboard UI/UX audit checklist.
> Updated by: @ux-ui-lead

## Module Map (21 Modules)

| # | Module | Pages | Status |
|---|--------|-------|--------|
| 1 | Dashboard | Dashboard, Analytics | 🔲 |
| 2 | Students | StudentsList, StudentDashboard, AddStudent, StudentAttendance, StudentPromotionPage, TransferCertificatePage, StudentFormSubmissions | 🔲 |
| 3 | Staffs | StaffList, StaffDashboard, AddStaffComposer, StaffPayroll, LeaveManagement, StaffAttendanceRegularize, BulkSubjectAssignment | 🔲 |
| 4 | Classes | ClassesPage, ClassDashboard, Attendance, Timetable, Substitution, Subjects, BulkClassTeacherAssignment | 🔲 |
| 5 | Academics | ExamManagement, ExamScheduleConflict, ExamDetail, ResultsEntry, ClassPerformance, CBSEReportCardPage, CCEGradingPage | 🔲 |
| 6 | Fees | FeesPage, Refunds, FeeStructureAssignment | 🔲 |
| 7 | Front Desk | FrontDeskPage, FrontDeskDashboard, AdmissionsList, AdmissionTracker, AppointmentsList, CallLogsList, FeedbacksList, VisitorLog, GatePassLog | 🔄 |
| 8 | Homework | Homework index, CreateHomeworkModal, HomeworkDetailModal | 🔲 |
| 9 | Hostel | HostelDashboard, HostelList, RoomsList, AllocationsList | 🔲 |
| 10 | Transport | VehiclesTab, RoutesTab, VehicleModal, RouteModal, StudentAssignModal | 🔲 |
| 11 | Library | LibraryDashboard, BooksList, IssuedBooksList, LibraryReports, AddBookModal, IssueBookModal, ReturnBookModal | 🔲 |
| 12 | Calendar | Calendar index (MonthView, WeekView, DayView, ScheduleView) | 🔲 |
| 13 | Messaging | Messaging index, ChatFull, Announcements, Notifications, Reminders, CommunicationLogs, EmailCampaignsPage | 🔲 |
| 14 | Reports | ReportsPage, ExportCenter | 🔲 |
| 15 | Settings | Settings index (~30 sub-pages) | 🔲 |
| 16 | Data Tools | BulkImport, BulkImportHistory, BackgroundJobs, GovtExport | 🔲 |
| 17 | Intake Forms | FormAssignments, FormSubmissions, EnrollmentFunnel | 🔲 |
| 18 | PTM | PTM index, CreatePTMSessionModal, PTMSessionDetailModal | 🔲 |
| 19 | Inventory | InventoryDashboard, Assets, Vendors, Maintenance, Procurement, Audits, Reports, InventoryTransaction | 🔲 |
| 20 | Super Admin | SuperAdminDashboard, SchoolsPanel, FeatureFlagsPanel, GrowthAnalyticsPanel, ChangelogPanel, JobsDashboardPanel, SchoolHealthPanel | 🔲 |
| 21 | Style Guide / IA | StyleGuide, IA & Checklist | 🔲 |

**Status Legend:**
- 🔲 = Not started
- 🔄 = In review (audit issue open)
- ✅ = Audited & approved
- 🛠️ = Approved changes being implemented

## Page Checklist Format

Each page is checked for:
1. **Design Audit** — Visual consistency, component patterns, styling alignment with Staff/Student List reference
2. **Accessibility** — ARIA roles, keyboard nav, focus states, color contrast, screen reader support
3. **Responsive** — Mobile viewport behavior, drawer/collapse patterns, touch targets
4. **Tests** — Visual regression, interaction tests, loading/error/empty states

## Design Reference

The **Staff List** and **Student List** views are the canonical reference patterns:
- Toolbar with ToolbarSearch synced to URL params
- Filter pills/segments with counts
- Skeleton loading states matching layout exactly
- Bulk action bar with checkbox selection
- Detail pane/drawer (desktop) / Drawer (mobile < 1100px)
- Row-based virtualized lists
- Empty states with illustrations/messaging
- URL state management for filters, search, selection
- Keyboard navigation (↑/↓/Enter/Escape)
- Mobile viewport detection with `MOBILE_MAX = 1099`

## Current Audit Focus

**Module: Front Desk (Module #7)**
- FrontDeskPage / Dashboard — KPI strip, activity stream, quick actions
- AdmissionsList — Admission inquiry list with stage filters
- AppointmentsList — Visitor appointment list
- CallLogsList — Phone call log list
- FeedbacksList — Feedback entry list with category badges
- VisitorLog — Visitor check-in/check-out log
- GatePassLog — Gate pass approval log

**Audit Issue:** [DK-516](mention://issue/382408d0-e0dc-44af-be82-62b8943a80a8)
**Status:** 🔄 In review

## Audit History

| Date | Module | Issue | Status |
|------|--------|-------|--------|
| 2026-05-20 | Fees | DK-254 | 🔲 No approvals — reverted |
| 2026-05-22 | Front Desk | DK-516 | 🔄 In review |

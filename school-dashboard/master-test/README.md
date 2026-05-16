# EMS Master Test Suite

**1,450 automated E2E tests** across **158 Playwright spec files** (~55,000 lines of test code) covering the complete EMS school dashboard.

All tests use mocked APIs via `installMockApi()` -- no real backend needed. Tests run fully autonomously in headless browsers.

## How to Run

```bash
# From school-dashboard root:

# Run ALL master tests
npx playwright test --config=playwright.config.ts master-test/

# Run a specific test file
npx playwright test master-test/TC001-school-setup-login.spec.ts

# Run a group by number range
npx playwright test master-test/TC07*.spec.ts

# Run by keyword (e.g., all fee tests)
npx playwright test master-test/ --grep "fee"

# Run headed (see the browser clicking)
npx playwright test master-test/ --headed

# Run with UI mode (interactive debugging)
npx playwright test master-test/ --ui

# Run with trace on failure
npx playwright test master-test/ --trace on

# Run on specific browser
npx playwright test master-test/ --project=chromium
```

---

## Test Organization

### Group 1: School Setup & Configuration (TC001-TC010)
| # | Use Case |
|---|----------|
| TC001 | Admin login and dashboard verification |
| TC002 | Institution settings (name, UDISE, board, contact) |
| TC003 | Academic settings (year, timings, classes, subjects) |
| TC004 | Period settings (timings, breaks per class) |
| TC005 | Class management (list, dashboard, student counts) |
| TC006 | Fee heads setup (CRUD, categories, amounts) |
| TC007 | Fee templates (create, calculate annual, duplicate) |
| TC008 | Attendance rules (thresholds, lock, notifications) |
| TC009 | Holiday management (CRUD, types, statistics) |
| TC010 | Admission settings (ID format, roll numbers, docs) |

### Group 2: Staff Management (TC011-TC018)
| # | Use Case |
|---|----------|
| TC011 | Create staff (5-step wizard: personal, role, quals, docs, salary) |
| TC012 | Staff list, search, and filter by role/status |
| TC013 | Assign/change class teacher |
| TC014 | Assign subjects to teachers (bulk) |
| TC015 | Staff profile dashboard (all tabs) |
| TC016 | Payroll setup (salary components, templates) |
| TC017 | Run monthly payroll (validate, pay, export) |
| TC018 | Staff attendance marking (present/absent/leave) |

### Group 3: Student Management (TC019-TC027)
| # | Use Case |
|---|----------|
| TC019 | Create student (multi-step registration form) |
| TC020 | Bulk import students via CSV |
| TC021 | Student list with filters (class, fee, gender, sort) |
| TC022 | Student profile dashboard (all tabs) |
| TC023 | Student fee management (payment, receipt) |
| TC024 | Student documents (upload, view, delete) |
| TC025 | Move student between classes |
| TC026 | Student remarks (write, view by category) |
| TC027 | Student status changes (deactivate, alumni) |

### Group 4: Timetable & Exams (TC028-TC036)
| # | Use Case |
|---|----------|
| TC028 | Timetable creation (assign subjects to periods) |
| TC029 | Timetable conflict detection (teacher double-booking) |
| TC030 | Teacher timetable view (cross-class schedule) |
| TC031 | Create exam (all config options) |
| TC032 | Enter marks (grades, pass/fail, statistics) |
| TC033 | Publish results (confirmation, status change) |
| TC034 | Performance dashboard (charts, filters) |
| TC035 | Results reflected in student dashboard |
| TC036 | Results reflected in class dashboard |

### Group 5: Attendance & Fees (TC037-TC044)
| # | Use Case |
|---|----------|
| TC037 | Mark student attendance (present/absent/late) |
| TC038 | Attendance reflects in student & class dashboards |
| TC039 | Student attendance portal (cross-class marking) |
| TC040 | Mark staff attendance (with reason modal) |
| TC041 | Fee collection workflow (select, pay, receipt) |
| TC042 | Fee defaulters (list, reminders, export CSV) |
| TC043 | Fee structure assignment (templates to classes) |
| TC044 | Fee reports (filters, date range, export) |

### Group 6: Promotion & Cross-Module (TC045-TC053)
| # | Use Case |
|---|----------|
| TC045 | Bulk promotion (5-step wizard) |
| TC046 | Promotion rollback (with reason) |
| TC047 | Role-based access: Teacher (restricted modules) |
| TC048 | Role-based access: Accountant (finance only) |
| TC049 | Role-based access: Principal (full access) |
| TC050 | Dashboard widgets data reflection |
| TC051 | Cross-module student data consistency |
| TC052 | Cross-module class data consistency |
| TC053 | End-to-end school year (all modules smoke test) |

### Group 7: Communication & Settings (TC054-TC064)
| # | Use Case |
|---|----------|
| TC054 | Announcements (create, send, manage) |
| TC055 | Notifications (view, mark read, filter) |
| TC056 | Messaging/chat (conversations, send messages) |
| TC057 | User management (CRUD, roles, activate) |
| TC058 | Roles & permissions (view, toggle, save) |
| TC059 | Communication settings (SMS, email, templates) |
| TC060 | Leave settings (create types, quotas, approval) |
| TC061 | Promotion rules (attendance, fee requirements) |
| TC062 | Global search (Ctrl+K, search all entities) |
| TC063 | Calendar events (create, edit, delete) |
| TC064 | Homework management (create, assign, manage) |

### Group 8: Front Desk (TC065-TC070)
| # | Use Case |
|---|----------|
| TC065 | Front desk dashboard (all widgets, quick actions) |
| TC066 | Visitor management (check-in, check-out, search) |
| TC067 | Gate pass (issue, approve, mark used, print) |
| TC068 | Call logs (create, callback tracking, search) |
| TC069 | Feedback management (CRUD, status workflow) |
| TC070 | Admissions tracker (pipeline stages, filtering) |

### Group 9: Deep Student Workflows (TC071-TC079)
| # | Use Case |
|---|----------|
| TC071 | Edit every field on student record |
| TC072 | Admission ID auto-generation & roll number assignment |
| TC073 | Fee installment payments (3 installments, balance tracking) |
| TC074 | Attendance regularization (correct wrong marking) |
| TC075 | Multiple guardians (father, mother, grandparent) |
| TC076 | Search edge cases (special chars, partial match, case-insensitive) |
| TC077 | CSV import validation (missing fields, duplicates, bad data) |
| TC078 | Fee status transitions (pending/partial/paid/overdue) |
| TC079 | Student dashboard every tab deep-dive (all fields verified) |

### Group 10: Deep Staff & Payroll (TC080-TC088)
| # | Use Case |
|---|----------|
| TC080 | Edit all staff fields |
| TC081 | Staff with multiple roles (Teacher + Admin) |
| TC082 | Staff attendance history (30-day calendar, stats) |
| TC083 | Payroll reversal workflow (paid → reversed) |
| TC084 | Salary templates (create, auto-fill, recalculate) |
| TC085 | Payslip generation (all components, print) |
| TC086 | Staff credentials update (email, password) |
| TC087 | Staff department filters (combined criteria) |
| TC088 | Staff leave management (apply, approve, reject, balance) |

### Group 11: Deep Exams & Attendance (TC089-TC098)
| # | Use Case |
|---|----------|
| TC089 | Exam type comparison (Unit Test vs Midterm vs Final) |
| TC090 | Marks entry with different grading types (numerical/grades/CGPA) |
| TC091 | Marks validation edge cases (>max, negative, boundary, partial) |
| TC092 | Subject-wise performance analysis |
| TC093 | Student ranking and topper identification |
| TC094 | Multi-day attendance sequence (3+ days, trends) |
| TC095 | Attendance lock timing mechanism |
| TC096 | Notify parents of absent students |
| TC097 | Attendance percentage accuracy (halfday=0.5, exact math) |
| TC098 | Attendance defaulter identification (below threshold) |

### Group 12: Deep Fees & Classes (TC099-TC108)
| # | Use Case |
|---|----------|
| TC099 | All payment modes (Cash, UPI, Card, Cheque, Bank Transfer) |
| TC100 | Partial payments with balance tracking (3 payments) |
| TC101 | Fee concession/discount (sibling, merit scholarship) |
| TC102 | Fee receipt verification (every field, print) |
| TC103 | Multi-student sequential fee collection |
| TC104 | Class dashboard deep-dive (every widget) |
| TC105 | Class subject CRUD (add, rename, delete, teacher assign) |
| TC106 | Multi-section management (10-A, 10-B, 10-C isolation) |
| TC107 | Class capacity management (limits, warnings, overflow) |
| TC108 | Class attendance history (5-day trend, overall rate) |

### Group 13: Deep Integration & Settings (TC109-TC118)
| # | Use Case |
|---|----------|
| TC109 | Academic year propagation across all modules |
| TC110 | Settings save and persist on reload |
| TC111 | Multi-class exam creation and result comparison |
| TC112 | Teacher complete workflow (login → attendance → marks) |
| TC113 | Principal complete workflow (review all modules) |
| TC114 | Data consistency after create/update/delete/move operations |
| TC115 | Concurrent data display (all dashboard widgets load correctly) |
| TC116 | Filter persistence across navigation |
| TC117 | Empty states for all modules (no data scenarios) |
| TC118 | Large dataset performance (100 students, 20 exams) |

### Group 14: Advanced Settings (TC119-TC128)
| # | Use Case |
|---|----------|
| TC119 | Webhook settings (CRUD, events, test, logs) |
| TC120 | SCIM provisioning (toggle, token, endpoint) |
| TC121 | NPS analytics (score, breakdown, trends) |
| TC122 | Trash & restore (soft delete, restore, permanent delete) |
| TC123 | Parent management (accounts, linking, password reset) |
| TC124 | Staff ID settings (prefix, padding, preview) |
| TC125 | Hierarchy settings (reporters, chains, circular detection) |
| TC126 | Permission requests (approve, reject, workflow) |
| TC127 | Fee rules settings (late fees, concessions, discounts) |
| TC128 | Subscription & billing (plans, invoices, features) |

### Group 15: Advanced Academics (TC129-TC138)
| # | Use Case |
|---|----------|
| TC129 | CBSE report card generation and printing |
| TC130 | CCE grading system (formative/summative) |
| TC131 | Class performance analytics (comparison, charts) |
| TC132 | Transfer certificate generation |
| TC133 | Class settings panel (capacity, sections) |
| TC134 | Substitution management (create, approve, conflicts) |
| TC135 | Timetable wizard (full-page, auto-assign) |
| TC136 | Timetable validation dashboard (conflicts, gaps) |
| TC137 | PTM management (sessions, slots, booking) |
| TC138 | Intake forms (assignments, submissions, funnel) |

### Group 16: UX, Edge Cases & Advanced Features (TC139-TC158)
| # | Use Case |
|---|----------|
| TC139 | Onboarding wizard (5-step new school setup) |
| TC140 | Dark mode toggle (persist, colors, navigation) |
| TC141 | Session timeout (warning, extend, auto-logout) |
| TC142 | Offline banner (detection, recovery) |
| TC143 | Error boundary (malformed data, 500s, recovery) |
| TC144 | Print/export student data (CSV, print dialog) |
| TC145 | Print/export fee data (receipts, reports) |
| TC146 | Data tools (import, export, backup, GDPR) |
| TC147 | Form validation edge cases (invalid data, boundaries) |
| TC148 | Responsive mobile layout (375px, hamburger, scroll) |
| TC149 | Keyboard navigation (Ctrl+K, Tab, Escape, Enter) |
| TC150 | AI assistant (chat, responses, suggestions) |
| TC151 | Super admin panel (health, flags, analytics, changelog) |
| TC152 | Email campaigns (create, send, analytics) |
| TC153 | Communication logs (filter, search, pagination) |
| TC154 | Reminders management (CRUD, templates) |
| TC155 | Student pin/unpin (favorites, quick access) |
| TC156 | Student bulk operations (deactivate, delete, remind) |
| TC157 | Fee refunds (request, approve, reject) |
| TC158 | Analytics dashboard (attendance, fees, academics, trends) |

---

## Architecture

- All tests import from `../tests/test-utils` (shared mock API infrastructure)
- `installMockApi(page, state)` intercepts all `/api/**` calls with stateful responses
- `createMockState()` provides a full mock state (users, staff, classes, students, etc.)
- Seed functions (`seedStudent`, `seedExam`, `seedResult`, etc.) add data to mock state
- Tests use Playwright locators: `getByRole()`, `getByText()`, `getByLabel()`, `locator()`
- Custom route overrides via `page.route()` for module-specific behavior
- `state.requestLog` tracks all API calls for assertion verification
- Role-specific tests use `createTeacherUser()`, `createAccountantUser()`, `createPrincipalUser()`

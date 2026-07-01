# School Dashboard — Comprehensive Audit Report

**Date:** 2026-06-10
**Scope:** `EMS/school-dashboard` frontend (837 source files: 450 pages across 22 modules, 242 components, 27 services, 21 contexts, 20 hooks, 50 utils) — plus backend (`EMS-backend`) cross-checks wherever a frontend call, param, or response shape had to be verified against the real route.
**Method:** Six parallel deep audits (security · mock data & incomplete features · memory leaks & performance · pagination & data fetching · broken pages & API mismatches · code quality & design system), each verifying findings by reading the actual code — plus a production build, an ESLint pass, and manual spot-verification of every CRITICAL finding.
**Build:** ✅ `vite build` passes (5.47s). **Lint:** ✅ `eslint --quiet` passes with 0 errors (90 `react-hooks/exhaustive-deps` warnings at default level).

> Some findings may overlap with earlier Notion task batches (bug-hunt, round-3, dashboard-audit). This is a fresh point-in-time audit of the code as of today — everything listed here was verified to still exist in the current tree.

---

## Summary

**154 issues** — **15 CRITICAL · 48 HIGH · 54 MEDIUM · 37 LOW**

| # | Category | Critical | High | Medium | Low | Total |
|---|----------|----------|------|--------|-----|-------|
| 1 | App-breaking bugs — dead endpoints (BRK) | 3 | 7 | 1 | 2 | 13 |
| 2 | Broken navigation & dead routes (NAV) | 0 | 6 | 4 | 1 | 11 |
| 3 | Mock / fabricated data shown as real (MOCK) | 5 | 2 | 3 | 2 | 12 |
| 4 | Incomplete features, stubs & dead buttons (STUB) | 3 | 7 | 4 | 0 | 14 |
| 5 | Security (SEC) | 0 | 1 | 1 | 7 | 9 |
| 6 | Memory leaks & long-session stability (MEM) | 0 | 5 | 5 | 7 | 17 |
| 7 | Performance & re-renders (PERF) | 1 | 3 | 5 | 2 | 11 |
| 8 | Pagination & data fetching at scale (PAG) | 3 | 10 | 14 | 6 | 33 |
| 9 | Coding practices & architecture (CODE) | 0 | 3 | 7 | 4 | 14 |
| 10 | Design system & UI states (DS) | 0 | 3 | 8 | 4 | 15 |
| 11 | Accessibility (A11Y) | 0 | 0 | 2 | 2 | 4 |
| 12 | Internationalization (I18N) | 0 | 1 | 0 | 0 | 1 |
| | **Total** | **15** | **48** | **54** | **37** | **154** |

**Severity meaning:** CRITICAL = security hole / data loss / feature totally broken / fabricated business data · HIGH = partially broken, real leak, breaks at realistic scale · MEDIUM = inconsistent behavior, UX/perf concern · LOW = hygiene / edge case.

### Fix-first priority list

1. **BRK-01** — Inventory module is 100% dead (backend mount commented out) — a one-line fix restores 8 pages.
2. **PAG-01** — Fees page silently shows only the first 50 payments and computes all its money KPIs from them — every number on the page is wrong at real volume.
3. **MOCK-01/02** — The main admin Dashboard shows a fabricated daily schedule and fabricated "unstaffed period / PTM" alerts to every school, every day.
4. **MOCK-05/06** — The entire Classes "Today" board is synthesized (hash-based fake timetable, attendance never shows as marked, fake sparklines).
5. **STUB-01** — Bulk refund Approve/Reject shows a success toast and does nothing — a financial workflow that lies.
6. **STUB-02 / STUB-03** — Staff "Mark attendance" fakes success; staff composer "Save draft" saves nothing (data loss).
7. **BRK-02/03** — Settings → Data Tools and Data Cleanup pages are 100% broken (every endpoint 404s).
8. **PAG-02/03** — The student pickers in "New refund" and library "Issue book" are permanently empty (response-shape bug) — both flows unusable.
9. **SEC-01** — Parent-submitted file URLs render as unsanitized `href` in the admin review UI (stored-XSS vector via the public intake form).
10. **PERF-01** — App-wide context accumulates every fee-payment socket event forever; each one re-renders ~94 consumers (all-day sessions degrade).
11. **BRK-10** — Student document delete reports success but never deletes (frontend sends array index, backend expects id).
12. **BRK-08** — "Clear all notifications" always 500s (Express route-order bug).

### What's healthy (verified — no action needed)

- **Auth/token handling is strong:** JWTs only in httpOnly cookies, nothing token-like in local/sessionStorage, sessionStorage user whitelist strips tokens and blocks role-tampering (`_roleVerified` server-confirmed), logout clears state, socket auth via cookie (no token in query string).
- All 24 direct `fetch()` sites include `getAuthHeaders()` + `credentials:'include'` — the CLAUDE.md "missing auth headers" bug class is currently clean.
- Zero `dangerouslySetInnerHTML`; all print/export HTML escapes via `escapeHtml()`; markdown renderer enforces a protocol allowlist; redacting logger.
- Every route in `App.jsx` is wrapped in `PermissionGuard`; all 44 lazy imports resolve; global + per-route ErrorBoundaries; `lazyWithRetry` handles failed chunk loads correctly (no reload loop).
- All `URL.createObjectURL` calls are paired with revokes; all 11 Resize/Intersection/MutationObservers disconnect; `SessionTimeoutWarning` timer hygiene is exemplary.
- 0 `<img>` without `alt`, only 3 unlabeled icon buttons app-wide, `ModalBase` has a real focus trap — accessibility baseline is genuinely good.
- Production build and ESLint both pass.

---

## 1. App-Breaking Bugs — Dead Endpoints (BRK)

#### BRK-01 · CRITICAL · Entire Inventory module is dead — backend mount commented out
- **Where:** `EMS-backend/server.js:606` · nav: `src/components/layout/nav/navConfig.jsx:100` · pages: `src/pages/inventory/*`
- **What:** `// v1Router.use('/inventory', inventoryRoutes)` is disabled, but the dashboard ships a full inventory module in the sidebar with 8 pages all calling `/inventory/*` via `src/services/api/extensions.js`. Every request 404s — dashboard, assets, vendors, maintenance, procurement, audits, reports, transactions all render error states.
- **Fix:** Un-comment the mount (`routes/inventory.js` exists and matches all frontend paths) or remove the module from the nav.

#### BRK-02 · CRITICAL · Settings → Data Tools page 100% broken
- **Where:** `src/pages/settings/DataToolsSettings.jsx:98,118,143,156`
- **What:** Calls `POST /data-tools/import`, `GET /data-tools/export/:entity`, `GET /data-tools/backup`, `GET /data-tools/gdpr` — no `/data-tools` mount exists anywhere on the backend. Every action 404s.
- **Fix:** Point at the real mounts (`/bulk-import`, `/export/*`, `/backup`, `/gdpr`) or add a backend router.

#### BRK-03 · CRITICAL · Settings → Data Cleanup page 100% broken
- **Where:** `src/pages/settings/DataCleanupSettings.jsx:50,110` · backend: `EMS-backend/routes/dataCleanup.js:265,310`
- **What:** Frontend calls `GET /settings/data-counts` and `POST /settings/data-cleanup`; the real routes are `GET /data-cleanup/preview` and `POST /data-cleanup/execute`. Counts never load; cleanup always fails.
- **Fix:** Switch the two endpoint strings.

#### BRK-04 · HIGH · Seed-data generation always 404s
- **Where:** `src/pages/settings/SeedDataSettings.jsx:93` · backend: `EMS-backend/routes/seedDummyData.js:1012`, mounted at `/seed-data` (`server.js:621`)
- **What:** Frontend posts to `/seed/generate`; backend route is `/seed-data/generate`. (See also STUB-13 — this tool shouldn't ship in production settings at all.)
- **Fix:** Correct the path — or better, remove/gate the tool per STUB-13.

#### BRK-05 · HIGH · Email Campaigns page fully broken (and orphaned)
- **Where:** `src/pages/messaging/EmailCampaignsPage.jsx:63-152` · route: `src/App.jsx:322` · backend: `EMS-backend/server.js:560` (mount commented out)
- **What:** The page calls `/email-campaigns*`, whose backend mount is disabled — every call 404s. The page is also unreachable from any nav (orphan route).
- **Fix:** Enable the mount or remove the route + page.

#### BRK-06 · HIGH · Students bulk "Send Reminders" always fails
- **Where:** `src/pages/students/hooks/useStudentsListData.js:549`
- **What:** Posts to `/messages/bulk-reminder`, which doesn't exist in any backend route file. Selecting students → Send reminders → error toast, always.
- **Fix:** Use the existing `POST /students/send-reminders-bulk` (`EMS-backend/routes/students/fees.js:169`).

#### BRK-07 · HIGH · Student attendance regularization always 404s
- **Where:** `src/pages/students/components/drawers/RegularizeAttendanceDrawer.jsx:88`
- **What:** Posts `POST /attendance/student/:id/regularize`; no such backend route exists (only staff attendance has a regularize endpoint).
- **Fix:** Add the backend route or remove the drawer action.

#### BRK-08 · HIGH · "Clear all notifications" always 500s (route shadowing)
- **Where:** `EMS-backend/routes/notifications.js:409` (`DELETE /:id`) vs `:429` (`DELETE /clear-all`) · called from `src/services/api/fees.js:73`
- **What:** `/:id` is declared first, so `clear-all` is parsed as an id → Mongoose CastError → 500 every time.
- **Fix:** Move the `/clear-all` route above `/:id`.

#### BRK-09 · HIGH · "Fee Defaulters" export always 404s
- **Where:** `src/pages/reports/ExportCenter.jsx:25`
- **What:** Frontend calls `/export/defaulters`; backend route is `/export/fee-defaulters`.
- **Fix:** Rename the frontend path.

#### BRK-10 · HIGH · Student document delete reports success but never deletes
- **Where:** `src/pages/students/hooks/useStudentDocuments.js:133-149` · backend: `EMS-backend/routes/students/documents.js:88-91`
- **What:** Frontend sends the document's **array index**; backend `$pull`s by the document's ObjectId-string `id`. Index never matches an id → backend returns `success: true` with the array unchanged → UI toasts "deleted" and the document remains. (STUDENT_MODULE_REMAINING_ISSUES #2 — still open.)
- **Fix:** Send `doc.id` instead of the index.

- **BRK-11 · MEDIUM** — `src/pages/settings/FeeHeadsUnified.jsx:195` — Fee-head delete dependency check calls `GET /fee-heads/:id/dependencies`, which doesn't exist; the `.catch(() => null)` swallows the 404, so deletes proceed **without** the safety check the UI was designed around. **Fix:** add the endpoint or drop the dead check.
- **BRK-12 · LOW** — `src/services/api/extensions.js:261-263` — Dead `bulkImportApi.upload/preview/confirm` methods point at endpoints that don't exist (live page uses valid paths). A trap for future callers. **Fix:** delete or align.
- **BRK-13 · LOW** — `src/services/api/extensions.js` (libraryApi) — Library calls `/v1/library/*` while every other module uses the legacy `/api/*` mount (which already gets deprecation/sunset headers). When the legacy mount is removed, everything except library breaks at once. **Fix:** move `API_URL` to `/api/v1` globally.

---

## 2. Broken Navigation & Dead Routes (NAV)

#### NAV-01 · HIGH · "View results" on published exams silently bounces back
- **Where:** `src/components/academics/ExamsTable.jsx:80`
- **What:** Links to `/academics/exam-detail/${id}` (unregistered); the academics catch-all redirects to `/academics`, so the click just reloads the list.
- **Fix:** Link to `/academics/exams/${id}`.

#### NAV-02 · HIGH · Class → Fees tab "Collect" button lands on a blank page
- **Where:** `src/pages/classes/components/FeesTab.jsx:88`
- **What:** Navigates to `/fees/collect?student=…`, but the fees router has no such route and no catch-all — nothing renders.
- **Fix:** Navigate to `/fees?student=${id}` and add a `*` catch-all to the fees router.

#### NAV-03 · HIGH · Staff intake-submission link 404s
- **Where:** `src/pages/intake-forms/FormSubmissions.jsx:263`
- **What:** `navigate(\`/staff/${staffId}\`)` uses singular `/staff/`; the registered route is `/staffs/*` — reviewers hit the 404 page.
- **Fix:** `/staffs/${id}`.

#### NAV-04 · HIGH · Student "Full log →" attendance link shows the students list
- **Where:** `src/pages/students/StudentDashboard.jsx:290`
- **What:** Links to `/students/${id}/attendance`; the students router doesn't recognize 3-segment paths, falling through to `StudentsList`.
- **Fix:** Route to `/students/attendance?student=${id}` or register the nested route.

#### NAV-05 · HIGH · Student report-card action shows the students list
- **Where:** `src/pages/students/StudentDashboard.jsx:848`
- **What:** `navigate(\`/students/${id}/report-card\`)` matches no route (same fallthrough as NAV-04).
- **Fix:** Navigate to an existing report-card surface (e.g. `/academics/cbse-report-card?student=${id}`) or register the route.

#### NAV-06 · HIGH · "Transfer certificate →" lands on the students list
- **Where:** `src/components/students/StudentOverlayBody.jsx:259`
- **What:** Navigates to `/students/${id}/transfer-certificate`; the registered page is the static `/students/transfer-certificate`.
- **Fix:** `navigate(\`/students/transfer-certificate?student=${id}\`)`.

- **NAV-07 · MEDIUM** — `src/components/layout/CommandPalette.jsx:67-71` — 4 of 6 palette Settings entries (`/settings/school|academic|billing|notifications`) land on the "under development" placeholder; real paths are `workspace`, `academics`, `subscription`, `communication`. **Fix:** update the four targets.
- **NAV-08 · MEDIUM** — `src/components/layout/CommandPalette.jsx:189-231` — Palette results for books/assets/rooms/routes navigate to detail routes (`/library/books/:id` etc.) that no module registers → blank pages. **Fix:** point at list routes until detail pages exist.
- **NAV-09 · MEDIUM** — `src/components/SubjectAssignment.jsx:493` — "Timetable" quick action navigates to `/timetable`, which doesn't exist (registered: `/classes/timetable`). **Fix:** correct the target.
- **NAV-10 · MEDIUM** — `src/App.jsx:322,452,459` — Orphan routes unreachable from any nav: `/messaging/email-campaigns`, `/intake-forms/submissions`, `/intake-forms/funnel`. **Fix:** add nav entries or remove routes.
- **NAV-11 · LOW** — `src/components/layout/UserMenu.jsx:90` — "Switch school" targets unregistered `/super-admin/schools` (currently unreachable dead code). **Fix:** navigate to `/super-admin` or remove.

---

## 3. Mock / Fabricated Data Shown as Real (MOCK)

#### MOCK-01 · CRITICAL · Dashboard "Your day" widget is a hardcoded fake schedule
- **Where:** `src/pages/Dashboard.jsx:639-648` (widget `defaultVisible: true` in `src/components/dashboard/widgetRegistry.js`)
- **What:** The daily timeline (09:00 Morning assembly, 10:30 Grade 6 walk-through, 11:30 Parent meet 10-A, 13:30 Staff briefing, 15:30 Annual day rehearsal) is a static array, with live "Now/Next/Done" markers computed against the fake times. Every admin in every school sees this identical fictional agenda presented as their real day.
- **Fix:** Fetch from calendar/timetable APIs, or hide the widget until wired.

#### MOCK-02 · CRITICAL · 2 of 3 Dashboard "Actions" alerts are fabricated
- **Where:** `src/pages/Dashboard.jsx:615-632`
- **What:** "Period 3 · 10-B unstaffed — Substitute not assigned — 10:30–11:15" (danger) and "PTM agenda · Dec 20 — 3 days left" (info) are pushed unconditionally for every school — including schools with no class 10-B and no PTM. Admins are urged to act on non-existent emergencies. Only the fee-defaulters item is real.
- **Fix:** Derive from the substitution-alerts and PTM APIs (both exist).

#### MOCK-03 · CRITICAL · Weekly attendance trend chart is synthesized
- **Where:** `src/components/dashboard/widgets/AttendanceTrendWidget.jsx:40-57` (Dashboard never passes `historicalData`, `Dashboard.jsx:680-686`)
- **What:** The Mon–Sat series is fabricated from today's single attendance rate: `studentRate + (i - todayIdx) * 2`, clamped 70–99 — a made-up week rendered as a real trend line.
- **Fix:** Fetch real per-day history, or render a single-day state.

#### MOCK-04 · HIGH · "3 inter-school finals" footer stat is hardcoded
- **Where:** `src/pages/Dashboard.jsx:893-895`
- **What:** The Moments footer mixes real attendance/collection numbers with a literal `<b>3</b> inter-school finals` for all tenants.
- **Fix:** Remove or wire to the events API.

#### MOCK-05 · CRITICAL · The entire Classes "Today" board is synthesized
- **Where:** `src/pages/classes/hooks/useTodayPeriods.js:69-96,118-121` → feeds `TodayView.jsx`, `ByClassView.jsx`, and the ClassesPage header (`src/pages/classes/ClassesPage.jsx:62-73`)
- **What:** `synthSlotsForPeriod` assigns classes to periods by **hashing their id**, inventing subject/teacher/room per slot; `markedSet` is hardcoded `new Set()` so **no class ever shows as marked** — every slot escalates Live → Urgent → Overdue with red "Mark now →" CTAs even when attendance was actually recorded. Holiday detection is Sundays-only. The page header ("N sessions today", "Period X of Y active") is derived from the same fiction.
- **Fix:** Consume the real timetable + `attendanceApi.getTodaySnapshot()` (the file's own TODO proposes `GET /api/classes/today/periods`).

#### MOCK-06 · CRITICAL · Class tile 7-day attendance sparkline is deterministic noise
- **Where:** `src/components/classes/ClassTile.jsx:20-24,72-80`
- **What:** `buildSpark` returns `cur + (((i*13) % 9) - 4)` around today's percentage (defaulting to 80 when null), rendered as a week of history on every class tile.
- **Fix:** Hide the sparkline until a history endpoint exists.

#### MOCK-07 · HIGH · "This week" mini-calendar paints past days green unconditionally
- **Where:** `src/components/classes/ClassesRail.jsx:176-186`
- **What:** `isPast && !isWeekend → ok` claims full attendance coverage for past days with zero data (the TODO at line 180 admits it).
- **Fix:** Neutral bars until a per-day summary endpoint lands.

- **MOCK-08 · MEDIUM** — `src/pages/Analytics.jsx:455-471,165-267` — The page-level date-range presets (Academic Year / Last 30 / Last 90 days) feed **only** the attendance-trend fetch; the other six cards (distribution, fee status, staff, KPIs, health score) ignore it while appearing filtered. **Fix:** scope the toggle to the one card or apply it everywhere.
- **MOCK-09 · MEDIUM** — `src/pages/students/StudentDashboard.jsx:834` — "Upcoming" card is permanently empty: `const upcoming = useMemo(() => [], [])` renders "Nothing scheduled." regardless of real exams/events. **Fix:** feed exams/calendar data or remove the card.
- **MOCK-10 · MEDIUM** — `src/pages/staffs/StaffList.jsx:768,815` → `src/pages/staffs/StaffDetailPane.jsx:44,179-190` — Staff "Recent activity" is hardcoded `[]`; the section can only ever show its empty state. **Fix:** wire to audit/attendance events or drop the section.
- **MOCK-11 · LOW** — `src/components/charts/DashboardCharts.jsx:1-25` — Deprecated dead component with hardcoded fake chart data, still re-exported by two barrels (tree-shaken today). **Fix:** delete component + barrels.
- **MOCK-12 · LOW** — `src/components/students/StudentMetricStrip.jsx:67-85` — Hardcoded fake deltas ("↑ 1.4 vs last term", "↑ 2 places") render whenever real values are present. Currently styleguide-only, but the first real adoption fabricates trend data. **Fix:** null the deltas until history endpoints exist.

---

## 4. Incomplete Features, Stubs & Dead Buttons (STUB)

#### STUB-01 · CRITICAL · Bulk refund Approve/Reject is a no-op with a success toast
- **Where:** `src/pages/fees/Refunds.jsx:565-589`
- **What:** Selecting refunds and clicking Approve/Reject shows `toast.success("Approved N refunds (queued — endpoint not wired yet)")` and clears the selection — **no API call is made**. A financial approval workflow that reports success and does nothing. (Single-row approve/reject at lines 133/158 are wired.)
- **Fix:** Loop `feesApi.approveRefund/rejectRefund` over the selection, or remove the bulk bar.

#### STUB-02 · CRITICAL · Staff "Mark attendance" fakes success
- **Where:** `src/pages/staffs/StaffList.jsx:482-486` (wired into desktop + mobile detail panes at 773/812)
- **What:** Handler is a stub: `toast.success("Marked {name} present (endpoint not wired yet).")` — no attendance record is created, but the user sees confirmation.
- **Fix:** Open the real status picker and call the staff-attendance API.

#### STUB-03 · CRITICAL · Staff composer "Save draft" saves nothing
- **Where:** `src/pages/staffs/AddStaffComposer.jsx:995-1003`
- **What:** The button toasts "Draft saved locally" with no storage write of any kind; closing the composer loses all entered data. (The student composer does this correctly via sessionStorage.)
- **Fix:** Replicate the student composer's draft persistence.

#### STUB-04 · HIGH · Dashboard birthday "Wish" buttons do nothing
- **Where:** `src/pages/Dashboard.jsx:289-291,329-332`
- **What:** Both staff and student birthday rows render a `Wish` button with no `onClick` at all.
- **Fix:** Wire to messaging or remove.

#### STUB-05 · HIGH · "View tomorrow's schedule →" buttons are dead (2 places)
- **Where:** `src/pages/classes/views/TodayView.jsx:66-69` · `src/components/classes/EmptyDayBanner.jsx:21-22,66-67`
- **What:** `onViewTomorrow` is an empty function with a TODO; the banner renders the button in two places.
- **Fix:** Implement date-param navigation or remove the buttons.

#### STUB-06 · HIGH · Communication template Add/Edit are "coming soon" toasts
- **Where:** `src/pages/settings/CommunicationSettings.jsx:448,539`
- **What:** The primary "Add Template" button and every row's edit icon toast "coming soon" — while templates themselves load from the real API.
- **Fix:** Wire to the email/SMS template CRUD endpoints (they exist server-side) or hide the buttons.

#### STUB-07 · HIGH · "Send test SMS/Email" buttons are stubs
- **Where:** `src/pages/settings/CommunicationSettings.jsx:313,420`
- **What:** Both toast-error "not yet implemented".
- **Fix:** Implement test-send endpoints or remove.

#### STUB-08 · HIGH · Payroll payment-method & reminder settings can never persist
- **Where:** `src/pages/settings/PayrollSettings.jsx:409-444` · `src/pages/settings/components/GeneralPayrollSettings.jsx:114-145` · backend: `EMS-backend/routes/settings/payroll.js:14-26`
- **What:** Handlers PUT `{paymentMethod}` / `{autoReminder, reminderDays}` to `/settings/payroll`, but the backend Zod schema is `.strict()` and only accepts `disburseDate`/`payrollCycle` — every save of those sections is rejected.
- **Fix:** Add the fields to the backend schema + persistence.

#### STUB-09 · HIGH · Video calling is half-wired — calls can never be received or show media
- **Where:** `src/pages/messaging/components/VideoCallModal.jsx:17-18,170-188` · `src/pages/messaging/hooks/useChatVideoCall.js` · `src/services/videoCallService.js`
- **What:** The PeerJS service emits `remoteStream`/`incomingCall`/`callAccepted` events but **nothing subscribes**. Remote video is permanently black; the caller's status stays `'initiated'` (a state the modal doesn't render); incoming calls never open the modal. Yet the call buttons create real backend call records and toast "Video call initiated".
- **Fix:** Subscribe the modal to service events, or hide the call buttons until done. (See also MEM-01/02 — the same flow leaks camera/mic.)

#### STUB-10 · HIGH · Add-student "Add Photo" button is an empty stub
- **Where:** `src/pages/students/StudentForm/steps/PersonalInfoStep.jsx:208`
- **What:** `onClick={() => {/* Open camera modal */}}` — clicking does nothing; photos can't be set during creation. (STUDENT_MODULE_REMAINING_ISSUES #7 — still open.)
- **Fix:** Wire to `PhotoEditorModal`/`CameraCaptureModal` and `updateField("picture", …)`.

- **STUB-11 · MEDIUM** — `src/pages/Dashboard.jsx:398-434,744-757` — Action alerts can't be dismissed: `ActionItem` accepts `onDismiss` but renders no dismiss control, so the fabricated "10-B unstaffed" alert (MOCK-02) is permanent. **Fix:** render the dismiss button or drop the dead state.
- **STUB-12 · MEDIUM** — `src/pages/staffs/components/RoleQualificationsStep.jsx:215-218` — "Extract Info" (certificate OCR) is permanently disabled with a "Coming soon" tooltip after a document upload. **Fix:** remove until implemented.
- **STUB-13 · MEDIUM** — `src/pages/settings/SeedDataSettings.jsx` (registered `src/pages/settings/index.jsx:169,384`) — A "Generate Dummy Data" tool ships in every tenant's production settings nav (flagged "New"); it would write fake staff/classes/students/attendance into the live tenant DB, indistinguishable from real records. Its endpoint is currently broken anyway (BRK-04). **Fix:** gate behind super-admin/dev flag or remove.
- **STUB-14 · MEDIUM** — `src/components/layout/nav/navConfig.jsx:118-119` · `src/App.jsx:489-498` — Internal dev pages ship in the production nav for all users: "IA & Checklist" (`/ia`, an internal design-audit tracker full of issue IDs) and "Style Guide" (`/style-guide` — CLAUDE.md calls it dev-only; it's also a **792 KB** lazy chunk in the prod bundle). **Fix:** register both only when `import.meta.env.DEV`.

---

## 5. Security (SEC)

#### SEC-01 · HIGH · Parent-submitted file URL rendered as unsanitized `href` in admin review UI (stored XSS vector)
- **Where:** `src/pages/intake-forms/FormSubmissions.jsx:138` · `src/pages/students/StudentFormSubmissions.jsx:221`
- **What:** For `field.type === "file"` the review UI renders `<Button as="a" href={value} target="_blank">` where `value` comes from `submissionData` supplied by a parent through the **unauthenticated** public endpoint (`POST /public/form-submission/:token`, body typed `z.record(z.string(), z.unknown())`). The backend's only guard is `value.replace(/javascript:/gi,'')`, which is bypassable (e.g. `java\nscript:` — browsers strip the newline when evaluating the URL). On click, script executes in the authenticated admin's session and can drive the app's API as that admin. Both links also lack `rel="noopener noreferrer"`.
- **Fix:** Run the URL through a protocol allowlist before assigning `href` (the repo already has `sanitizeUrl()` in `MarkdownRenderer.jsx`) and add `rel="noopener noreferrer"`.

- **SEC-02 · MEDIUM** — `vercel.json` + `index.html` — **No Content-Security-Policy anywhere.** X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy are set, but no CSP — meaningful defense-in-depth given user-supplied content rendering (and it would blunt SEC-01). **Fix:** add `Content-Security-Policy` (`script-src 'self'; object-src 'none'; frame-ancestors 'none'`) to the header block.
- **SEC-03 · LOW** — `vercel.json:11` — Deprecated `X-XSS-Protection: 1; mode=block`; modern guidance is `0` + CSP. **Fix:** change value.
- **SEC-04 · LOW** — `.env`, `.env.production`, `.env.test` are tracked in git. Current contents are only public `VITE_*` URLs and placeholder test secrets — no live secret exposed today — but a real key added later would commit silently. **Fix:** `git rm --cached` + tighten `.gitignore`.
- **SEC-05 · LOW** — `debug-classes.html:63-71` (repo root) — Committed debug page using an outdated auth pattern (`localStorage` user + Bearer token against hardcoded `localhost:3001`). Not shipped to `dist/`, but stale and misleading. **Fix:** delete (see CODE-11).
- **SEC-06 · LOW** — `src/services/socketService.js:15-40` — Dead duplicate socket client that emits a JWT in the `authenticate` payload and has a real double-connection bug (`connect()` doesn't tear down a still-reconnecting socket; `disconnect()` never clears listeners). Imported nowhere — but a trap if re-adopted. **Fix:** delete the file.
- **SEC-07 · LOW** — `src/pages/students/AddStudentComposer.jsx:374` — Full new-student draft (name, DOB, parent contact, address, ID numbers) is written to `sessionStorage` on every keystroke. Per-tab and cleared on submit, but minor PII exposure on shared front-office machines. **Fix:** add TTL/clear-on-unmount.
- **SEC-08 · LOW** — `src/pages/data-tools/BulkImportForm.jsx:137,181`, `GovtExport.jsx:51`, `BulkImportHistory.jsx:24,55`, `src/pages/reports/ExportCenter.jsx:112,164` — Direct fetches include auth correctly but don't attempt token refresh on 401 (they log the user out instead, unlike central `request()`). Premature logout, not a hole. **Fix:** route through `request()` or call `attemptTokenRefresh()`.
- **SEC-09 · LOW** — `src/components/ui/FilePreview.jsx:23` — HEAD pre-check omits `credentials:'include'`, so cookie-protected files show an error state even when the iframe could load them. **Fix:** add credentials.

---

## 6. Memory Leaks & Long-Session Stability (MEM)

#### MEM-01 · HIGH · Camera + mic stay live after the video-call modal closes
- **Where:** `src/pages/messaging/components/VideoCallModal.jsx:57-70` · `src/pages/messaging/hooks/useChatVideoCall.js:85-88`
- **What:** Tracks are stopped only by the End button. Closing via Esc/backdrop or unmount just flips state — the MediaStream keeps recording with no UI left to stop it. No unmount cleanup exists.
- **Fix:** Stop all tracks in an unmount cleanup and in `closeVideoCall`.

#### MEM-02 · HIGH · Video-call service error paths leak the acquired media stream
- **Where:** `src/services/videoCallService.js:92-130,152-179`
- **What:** In `startCall`/`acceptCall`, failures after `getUserMedia` emit `callError` and rethrow without stopping `this.localStream` tracks — camera light stays on with no call.
- **Fix:** Stop `localStream` tracks in both catch blocks.

#### MEM-03 · HIGH · CameraView's stale-closure cleanup never stops the camera
- **Where:** `src/components/photo/CameraView.jsx:93-104` (+ `:106-111`) — used by student photo capture (`CameraCaptureModal.jsx:184`)
- **What:** The mount effect (`[]` deps) captures the first-render `stopCamera`, whose closure has `stream === null` — on unmount it no-ops and live tracks are never stopped. Camera-switching (`facingMode` effect) can orphan the previous stream (two live cameras).
- **Fix:** Keep the stream in a ref and stop tracks from the ref in cleanup; fix the facingMode effect deps.

#### MEM-04 · HIGH · Voice recording survives navigation: hot mic + 2 intervals + AudioContext
- **Where:** `src/pages/messaging/hooks/useVoiceMessageHandler.js:79-175` · `src/pages/messaging/hooks/useVoiceRecording.js`
- **What:** Starting a recording creates a mic stream, an AudioContext+analyser, a 1s duration interval, and a 100ms RMS sampling interval. `useVoiceRecording` has **no unmount cleanup**, and ChatFull's unmount handles only socket+video. Navigating away mid-recording leaves the mic hot and both intervals ticking forever; AudioContexts accumulate (browser caps ~6).
- **Fix:** Add an unmount effect stopping recorder/stream/intervals/context from refs.

#### MEM-05 · MEDIUM — AI assistant mic stays on if the user leaves while recording
- **Where:** `src/pages/AiAssistantPage.jsx:76-123`
- **What:** Tracks are stopped only in `onstop` (fired by the stop button); no unmount cleanup stops the recorder.
- **Fix:** Unmount effect calling `mediaRecorderRef.current.stop()` when active.

#### MEM-06 · HIGH · Chat tears itself down and re-initializes on every app-wide data tick
- **Where:** `src/pages/messaging/ChatFull.jsx:279` (effect deps), cleanup at `:271-277`
- **What:** The init/cleanup effect depends on `staff` and `students` from `useApp()` — arrays that get a new identity on every socket-driven update and every window-refocus refetch. Each tick re-registers all 10 chat socket listeners, re-runs `initializeChat()` (full contacts+conversations refetch), and the cleanup **ends any active video call and destroys the peer**. On a busy day the messaging page constantly re-inits and can drop live calls.
- **Fix:** Depend on `user?.id` only; read staff/students via refs.

- **MEM-07 · MEDIUM** — `src/services/socketServiceEnhanced.js:29-39` — `connect()` on a disconnected socket attaches a new `once('authenticated')` + 5s reject-timeout per call; the timeout rejects but never removes the `once` listener. With MEM-06 calling `connect()` per tick, a down server accrues listeners (MaxListenersExceeded, retained closures). **Fix:** `socket.off('authenticated', handler)` in the timeout path.
- **MEM-08 · LOW** — `src/context/hooks/useSocketSync.js:144-161` — Unmount race with the dynamic import: cleanup can run before the import resolves, then the callback registers 8 listeners that are never removed (fast logout→login / StrictMode). **Fix:** check an `active` flag inside `.then` before registering.
- **MEM-09 · LOW** — `src/pages/settings/PermissionRequests.jsx:83,97` — `isConnected()` early-return means the `permission_request_created` listener is never registered if the socket isn't up when the effect runs (same anti-pattern AUDIT-785 fixed elsewhere); unstable `isAdmin` dep churns the effect. **Fix:** register unconditionally; stabilize `isAdmin` (PERF-06).
- **MEM-10 · LOW** — `src/pages/messaging/components/VoiceMessageRecorder.jsx:22-89` — Dead component (no importers) whose cleanup misses the MediaStream and AudioContext, with a 60fps setState rAF loop. **Fix:** delete (or fix before reuse).
- **MEM-11 · LOW** — `src/pages/messaging/hooks/useVoiceMessageHandler.js:70` — No `isRecording` guard: a double-trigger orphans the first recorder's stream/intervals/AudioContext. **Fix:** guard on state.
- **MEM-12 · MEDIUM** — `src/hooks/useLiveNotifications.js:18-35` (mounted app-wide via `NotificationBell.jsx:20`) — 60s unread-count poll never pauses for hidden tabs; in-flight request not aborted on unmount. **Fix:** skip ticks when `document.hidden` or use a query with `refetchIntervalInBackground: false`.
- **MEM-13 · MEDIUM** — `src/components/dashboard/SubstitutionAlertPanel.jsx:69-112` — 2-minute polling continues while the tab is hidden; `fetchAlerts` unaborted. **Fix:** same visibility-pause approach.
- **MEM-14 · LOW** — `src/components/layout/nav/useNavHover.js:44-47,98-115` — Hover open/close/aim timeouts have no unmount cleanup (stray ≤260ms timers; setStates are post-unmount no-ops). **Fix:** clear in cleanup.
- **MEM-15 · LOW** — `src/hooks/useEntityFetch.js:50-66` — 300ms load-more timeout not cleared on unmount; bigger functional issue: the IntersectionObserver attaches once on mount, so a conditionally-rendered sentinel never engages infinite scroll. **Fix:** re-observe when the sentinel mounts.
- **MEM-16 · LOW** — `src/components/ui/CoachMark.jsx:193-194` — While a coach mark is open, a MutationObserver watches the whole `document.body` subtree (every DOM mutation anywhere schedules a re-measure). Disconnect is correct; perf-only. **Fix:** narrow the observed root.
- **MEM-17 · MEDIUM** — Systemic — ~130 of 180 page files fetch in effects without a cancellation guard (`AbortController`/`ignore` flag). React 18+ makes post-unmount setState harmless, so the real cost is wasted requests and **stale-response races on rapid filter/year switches**. Worst verified: `src/pages/academics/PerformanceDashboard.jsx:98-126`, `SubstitutionAlertPanel.jsx:48-67`, `PayrollReminder.jsx:27-54`, `PermissionContext.jsx:162-182`, `ChatNotificationContext.jsx:152-160`. Good in-repo patterns to standardize: `Analytics.jsx:166-265`, `classes/Attendance.jsx:210-239`, `ClassDashboard.jsx:170-192`.

---

## 7. Performance & Re-renders (PERF)

#### PERF-01 · CRITICAL · App-wide context accumulates every fee payment forever — and re-renders everything on each one
- **Where:** `src/context/SettingsContext.jsx:348-350` (`syncFeePaymentLocal`) · wired app-wide via `src/context/hooks/useSocketSync.js:119-128`
- **What:** Every school-wide `fee_payment_created` socket event appends to the `feePayments` array; nothing prunes or resets it. In an all-day session at a school collecting hundreds of payments the array grows without bound, and **every append re-renders every `useSettings`/`useSchool`/`useApp` consumer (94+ call sites)**.
- **Fix:** Cap the array (keep last N) or replace local accumulation with TanStack Query invalidation.

#### PERF-02 · HIGH · Four domain providers rebuild their context value on every render
- **Where:** `src/context/StudentsContext.jsx:106-120` · `src/context/StaffContext.jsx:132-161` · `src/context/ClassesContext.jsx:106-122` · `src/context/AttendanceContext.jsx:279-297`
- **What:** No `useMemo` on the `value`, no `useCallback` on actions — any parent re-render produces a new context value, re-rendering all consumers even when data is unchanged, and unstable functions invalidate downstream effect deps.
- **Fix:** Memoize values and actions (SettingsContext/AppContext already do this correctly).

#### PERF-03 · HIGH · `useApp()` subscribes 94 call sites to all six domain contexts
- **Where:** `src/context/AppContext.jsx:383-399`
- **What:** It spreads students+staff+classes+attendance+settings+app into one object, so a component needing only `selectedAcademicYear` re-renders on every socket tick, fee payment, attendance mark, and window-refocus refetch. This is the app's dominant re-render amplifier over a long session.
- **Fix:** Migrate consumers to the focused per-domain hooks (only 3 files use them today).

#### PERF-04 · HIGH · `classesWithTeachers` join recomputed on every students/staff identity change
- **Where:** `src/context/ClassesContext.jsx:80-104` · `src/context/AppContext.jsx:348-359`
- **What:** O(classes × (2·staff + students)) — ~110k+ ops for 50 classes / 100 staff / 2000 students — re-run on every socket update/refetch, then (unmemoized value) re-renders all class consumers.
- **Fix:** Memoize the value; index staff by id once; single-pass studentCount map.

- **PERF-05 · MEDIUM** — `src/context/AuthContext.jsx:22,180-189` — AuthProvider calls `useLocation()` and provides an inline value, so every navigation re-renders all 20 `useAuth` consumers and re-registers effects depending on `logout` (e.g. `SessionTimeoutWarning`). **Fix:** memoize value, useCallback login/logout, read location from a ref.
- **PERF-06 · MEDIUM** — `src/context/PermissionContext.jsx:301-313` — Inline value; `hasPermission`/`isAdmin` get new identities every render → `PermissionGuard` on every route + 12 consumer files re-render per navigation; unstable `isAdmin` churns effects (MEM-09). **Fix:** memoize.
- **PERF-07 · MEDIUM** — `src/lib/queryClient.js:31` + `src/context/AppContext.jsx:112-129` — Global `refetchOnWindowFocus: true` with 30s staleTime re-fetches the entire app dataset (staff + classes + sometimes all students) on every tab refocus, replacing all domain arrays → full context-cascade re-render. **Fix:** longer staleTime for app-context queries or per-query focus-refetch opt-out. (Compounds PAG-05.)
- **PERF-08 · MEDIUM** — `src/components/common/VirtualizedTable.jsx` — Only the students list is virtualized (`useStudentsListData.js:272-277`); the `VirtualizedTable` primitive has zero importers, while fee payments, ResultsEntry marks, audit logs, and refunds render full arrays. **Fix:** adopt the existing virtualizer for big tables or delete the dead primitive.
- **PERF-09 · LOW** — `src/context/ChatNotificationContext.jsx:291`, `src/context/AcademicYearContext.jsx:50`, `src/components/AiAssistant/AiAssistantPanel.jsx:65-76` — Inline/unmemoized provider values (small blast radius). **Fix:** memoize.
- **PERF-10 · LOW** — `src/pages/Dashboard.jsx:165-204,594-660` — Dashboard memos all depend on `useApp()` identities, so they recompute on every tick anyway; resolves once PERF-02/03 land.
- **PERF-11 · MEDIUM** — Build output — Main `index` chunk is **651 KB** minified (185 KB gzip, over Vite's 500 KB warning); `ui-vendor` 545 KB; `charts-vendor` 432 KB; `StyleGuide` **792 KB** ships in the prod bundle (see STUB-14). **Fix:** split the main chunk, gate the styleguide to dev, audit ui-vendor imports.

---

## 8. Pagination & Data Fetching at Scale (PAG)

#### PAG-01 · CRITICAL · Fees page silently shows only the first 50 payments — and computes its KPIs from them
- **Where:** `src/hooks/useFeesData.js:197,216` · `src/pages/fees/FeesPage.jsx:285` · backend: `EMS-backend/routes/fees.js:170-171`
- **What:** `getPayments({ academicYear })` sends no page/limit; the backend defaults to `limit=50` and returns `{payments, pagination}` — the hook discards `pagination` and treats page 1 as the whole dataset. The table has no pagination UI, and "Collected today / Outstanding / Overdue students" are derived from those 50 rows. At ~10k payments/yr every number on the page is wrong within a month, and client-side search can never match older payments.
- **Fix:** Server-paginate the table; move KPIs to a backend aggregate endpoint.

#### PAG-02 · CRITICAL · "New refund" student search never returns results
- **Where:** `src/pages/fees/Refunds.jsx:263`
- **What:** `studentsApi.getAll({search, limit: 20})` returns a plain **array** (`src/services/api/staff.js:74`), but the code reads `data.students || []` → always `[]`. The picker is permanently empty; refunds can't be created via search.
- **Fix:** Use `studentsApi.list(...)` and read `.data` (cf. `useHostelLookups.js:58`).

#### PAG-03 · CRITICAL · Library "Issue Book" student picker has the identical bug
- **Where:** `src/pages/library/IssueBookModal.jsx:48-49`
- **What:** Same `data.students`-on-array mistake → issuing a book to a student via search is broken.
- **Fix:** Same as PAG-02.

#### PAG-04 · HIGH · Students list fetches the entire student collection
- **Where:** `src/pages/students/hooks/useStudentsListData.js:216` · backend: `EMS-backend/routes/students/crud.js:46-48`
- **What:** Sends `limit: 0`, which the backend treats as "no pagination" — every student with populated class, PII decryption, and fee-status batch. Rendering is virtualized so the DOM survives, but at 3–5k students every load, filter change, and search keystroke re-transfers a multi-MB payload.
- **Fix:** Real server pagination (backend already caps paginated requests at 100/page) or an infinite query.

#### PAG-05 · HIGH · App shell page-loops the whole student body into React context — re-run after every single edit
- **Where:** `src/context/appContextHelpers.js:306` → `studentsApi.getAll` (`src/services/api/staff.js:59-74`) · invalidation: `src/context/StudentsContext.jsx:18-20`
- **What:** `getAll` fetches page 1 then sequentially loops `totalPages` at 100/page (30 round-trips for 3k students) on any "student-heavy" page; every student create/update/delete invalidates `app-context-data`, re-running the loop plus all staff + classes.
- **Fix:** Kill global student hydration; fetch per-screen with server pagination/search.

#### PAG-06 · HIGH · Chat history is hard-capped at the latest 50 messages with no way to load older
- **Where:** `src/pages/messaging/hooks/useConversationManager.js:61` · `src/services/chatService.js:35` · backend: `EMS-backend/routes/messages.js:176-204`
- **What:** The backend implements a `before` cursor, but no caller passes it and there's no scroll-back UI — older messages are unreachable.
- **Fix:** Wire infinite scroll using the existing cursor.

#### PAG-07 · HIGH · Announcements page shows only the newest 20; stats computed from page 1
- **Where:** `src/pages/messaging/Announcements.jsx:37,41-47` · `…/announcements/AnnouncementsList.jsx:100` · backend: `EMS-backend/routes/announcements.js:554`
- **What:** No params sent → backend default `page=1, limit=20`; no pagination UI; search/filter and the Sent/Delivered/Scheduled cards operate on those 20.
- **Fix:** Pass page/limit + render pagination; use `getStats()` exclusively for stats.

#### PAG-08 · HIGH · Homework list capped at 100; stats wrong beyond it
- **Where:** `src/pages/homework/index.jsx:100,152-173` · backend: `EMS-backend/routes/homework.js:13`
- **What:** Single `{limit: 100}` fetch, pagination metadata ignored, stat cards and filters see only the first 100 — exceeded in ~2 weeks at 20 classes.
- **Fix:** Server pagination + server-computed counts.

#### PAG-09 · HIGH · Results entry can only pick from the latest 50 exams (across all years)
- **Where:** `src/pages/academics/ResultsEntry.jsx:219` · backend: `EMS-backend/routes/academics.js:382`
- **What:** `examsApi.getAll()` with no params → default `limit=50`. Older exams disappear from the picker, blocking mark entry.
- **Fix:** Pass `academicYear` + paginate or search server-side.

#### PAG-10 · HIGH · Academics overview + Performance dashboard see only the first 50 exams
- **Where:** `src/hooks/useAcademicsData.js:84` · `src/pages/academics/PerformanceDashboard.jsx:121` · backend: `EMS-backend/routes/academics.js:428-430`
- **What:** Same default-50 cap; KPIs and trend analytics silently exclude older exams. The backend sends pagination via `X-Total-Count`/`X-Has-More` **headers the client can never read** (`request()` returns parsed JSON only). `ExamManagement.jsx:63-69` does it correctly — reuse that pattern.
- **Fix:** Return `{data, pagination}` in the body like other routes; consume it.

#### PAG-11 · HIGH · Audit-log search only filters the 25 rows of the current page
- **Where:** `src/pages/audit-logs/index.jsx:137-155` · backend: `EMS-backend/routes/auditLogs.js:24-35`
- **What:** Client-side search over the current page only (the comment admits it); backend accepts no free-text param. A user/IP/path search silently misses other pages while the pager shows the unfiltered total.
- **Fix:** Add a server-side `search` filter and send it.

#### PAG-12 · HIGH · Issued-books search filters only the current 25-row page
- **Where:** `src/pages/library/IssuedBooksList.jsx:100-108` · backend: `EMS-backend/routes/library.js:312`
- **What:** Same current-page-only search; backend supports status/student/book filters but no `search`.
- **Fix:** Add server search by book title/student.

#### PAG-13 · HIGH · Expenses search does nothing
- **Where:** `src/pages/expenses/ExpensesPage.jsx:97` · backend: `EMS-backend/routes/expenses.js:14`
- **What:** Frontend sends `q`; backend destructures only `{category, status, academicYear, from, to, page, limit}` — `q` is silently ignored and there's no client-side fallback, so typing in the search box visibly changes nothing.
- **Fix:** Add a `q` regex filter (title/vendor) to the route or rename to a supported param.

- **PAG-14 · MEDIUM** — `src/pages/expenses/ExpensesPage.jsx:104-107` — Summary cards ignore the active status/category filters (backend `/expenses/summary` only reads year/from/to) — numbers don't match the filtered table. **Fix:** support the params server-side.
- **PAG-15 · MEDIUM** — `src/pages/front-desk/AdmissionsList.jsx:93` · backend `frontDesk.js:41-55` — Admissions fetch-all with no limit; admission season (1000s of enquiries) all renders client-side. **Fix:** paginate.
- **PAG-16 · MEDIUM** — `src/pages/intake-forms/FormSubmissions.jsx:65` · backend `intakeForms.js:679-693` — Form submissions fetch-all, unbounded on both sides. **Fix:** paginate.
- **PAG-17 · MEDIUM** — `src/pages/fees/Refunds.jsx:119` · backend `fees.js:788-801` — Refunds fetch-all; frontend infinite-scrolls the full array (client slicing only). **Fix:** paginate the route.
- **PAG-18 · MEDIUM** — `src/pages/messaging/Notifications.jsx:25,27` + `NotificationCenter.jsx:98` · backend `notifications.js:191-205` — Notifications capped at 50 with no skip support and no load-more; unread counts computed from those 50. **Fix:** cursor/skip + load-more.
- **PAG-19 · MEDIUM** — `src/pages/inventory/Assets.jsx:78-84` — Condition/location filters applied client-side to the current 25-row page even though the backend supports `condition` (`inventory.js:90-96`); matching rows on other pages hidden, pager total unfiltered. **Fix:** send `condition`; add `location` to the route.
- **PAG-20 · MEDIUM** — `src/pages/hostel/AllocationsList.jsx:148-151` — Room filter client-side over the current 20-row page although backend accepts `roomId` (`hostel.js:459-468`). **Fix:** send `roomId`.
- **PAG-21 · MEDIUM** — `src/pages/library/IssuedBooksList.jsx:71-80` — Page not reset when the status filter changes → page 5 of "all" + switch to "returned" requests page 5 of 2 → empty list with a working pager. **Fix:** `setPage(1)` on status change.
- **PAG-22 · MEDIUM** — `src/pages/messaging/CommunicationLogs.jsx:91,108-138` — Page not reset on search/channel/date changes (strands users past `totalPages`), compounded by a hard 200-record cap (`{limit: 200}`) — older logs unsearchable. **Fix:** reset page on filter deps; server pagination (backend already paginates).
- **PAG-23 · MEDIUM** — `src/pages/inventory/Assets.jsx:90-93,108-120` — Search fires per keystroke with no debounce, no abort, no stale-response guard (slow "l" response can overwrite "laptop" results); each keystroke also re-fetches all vendors + full staff list in the same `Promise.all`. **Fix:** debounce 300ms, abort prior, hoist static fetches.
- **PAG-24 · MEDIUM** — `src/pages/students/components/list/StudentsFiltersBar.jsx:237` + `useStudentsListData.js:84` — Students search uses `useDeferredValue` (a render deferral, not a debounce) — each settled keystroke issues a new `limit: 0` full-collection request. **Fix:** use the canonical `ToolbarSearch` (200ms debounce) + server pagination.
- **PAG-25 · MEDIUM** — `src/pages/settings/ParentManagement.jsx:47-74` — Search refetches per keystroke (aborts prior correctly, but no debounce). **Fix:** debounce.
- **PAG-26 · MEDIUM** — `src/pages/students/hooks/useStudentPayment.js:105` — Recording a fee payment never invalidates the `["fees-payments"]` query — the Fees page shows pre-payment data for up to 30s (or until refocus if already mounted). **Fix:** `invalidateQueries` after payment mutations.
- **PAG-27 · MEDIUM** — `src/pages/fees/Refunds.jsx:229-247` — Refund-cap validation sums only the student's first 50 payments (backend default limit) — long-tenured students' refundable totals are understated, wrongly blocking legitimate refunds. **Fix:** server-side total endpoint.
- **PAG-28 · LOW** — `src/pages/staffs/StaffList.jsx:366-377` — Staff fetch-all + client slice "pagination" (backend unpaginated branch, `staff/core.js:41`). Tolerable ≤300 staff; page-reset/clamp logic is correct. **Fix:** opt into server pagination eventually.
- **PAG-29 · LOW** — `EMS-backend/routes/messages.js:84-91` — Conversations list unpaginated; degrades for admins messaging hundreds of parents. **Fix:** add limit/cursor.
- **PAG-30 · LOW** — PTM (`ptm/index.jsx:48`), transport vehicles, super-admin schools (`superAdmin.js:111`), calendar events — fetch-all over naturally bounded collections; fine today. **Fix:** default caps server-side.
- **PAG-31 · LOW** — `src/pages/staffs/StaffPayroll.jsx:115` — `limit: 1000` magic number (month-scoped so bounded). **Fix:** paginate or document the bound.
- **PAG-32 · LOW** — `src/components/layout/CommandPalette.jsx:144-151` — Palette indexes only the first 50 payments/exams/books/assets/rooms/routes/announcements; older entities unfindable from it. **Fix:** server-backed palette search.
- **PAG-33 · LOW** — Chat keeps conversations/messages in bare `useState` with socket patching — messages missed during a disconnect are never back-filled on reconnect. **Fix:** refetch conversation on reconnect.

---

## 9. Coding Practices & Architecture (CODE)

#### CODE-01 · HIGH · 59 files exceed the 500-line refactor threshold (owner's standing rule)
- **Where:** across `src/` — top 10 below (exact counts)
- **Fix:** Schedule splits, starting with the top 10. (2nd-largest is dead code — see CODE-02.)

| Lines | File | What it is | Natural split |
|---|---|---|---|
| 2323 | `src/pages/students/AddStudentComposer.jsx` | Student create/edit composer, all sections inline | One file per section + submit-mapping hook (sibling `components/add-student/` steps already exist) |
| 1332 | `src/pages/classes/components/TimetableWizardModal.jsx` | **Dead code** — delete, don't refactor | — |
| 1266 | `src/pages/students/StudentDashboard.jsx` | Student 360° dashboard | Per-tab components + modal-launcher hook |
| 1215 | `src/pages/styleguide/PrimitivesSection.jsx` | Styleguide docs (dev-only) | Story file per primitive group |
| 1199 | `src/pages/staffs/AddStaffComposer.jsx` | Staff composer | Per-section files + validation to `validators/` |
| 1088 | `src/pages/fees/Refunds.jsx` | Refunds list + detail + create sheet | Split create-sheet from page shell |
| 1067 | `src/pages/styleguide/PatternsSection.jsx` | Styleguide patterns | Per-pattern files |
| 1032 | `src/pages/settings/PayrollSettings.jsx` | Payroll settings | One file per settings card |
| 934 | `src/pages/Dashboard.jsx` | Main dashboard incl. local skeleton/empty-state | Extract widgets to `components/dashboard/` |
| 859 | `src/pages/staffs/StaffList.jsx` | Staff two-pane list | Extract filter bar, bulk bar, keyboard-nav hook |

#### CODE-02 · HIGH · 1,332-line dead modal + wildcard barrels that undermine code-splitting
- **Where:** `src/pages/classes/components/TimetableWizardModal.jsx` · `src/components/modals/index.js:15-20` · `src/components/modals/classes.js:5`
- **What:** The wizard modal is unreachable (live feature is `components/timetable/TimetableWizardPage.jsx`). Worse, `modals/index.js` does `export * from` every domain barrel, so a single `import { UnsavedChangesModal } from '../../components/modals'` statically links the entire modal graph into that chunk.
- **Fix:** Delete the dead modal; kill the wildcard barrels (import from specific files).

#### CODE-04 · HIGH · Flagship staff form uses presence-only validation; its Zod schema exists but is orphaned
- **Where:** `src/pages/staffs/AddStaffComposer.jsx:270-279` · `src/validators/formSchemas.js:335`
- **What:** `validate()` only checks `.trim()` non-empty — no email format, no phone format — while `addStaffStep1Schema` is imported by nothing. Violates the project's shared-Zod-schema rule.
- **Fix:** Wire the schema in and extend it to all steps.

- **CODE-03 · MEDIUM** — Systemic — Only 7 files use TanStack Query while ~250 data-fetching pages hand-roll `useState`+`useEffect`+abort plumbing. This is the root cause of the staleness bugs (PAG-26), races (MEM-17), and four-state inconsistency (DS-*). **Fix direction:** a shared `usePaginatedQuery` wrapper + `PageShell` adoption, module by module.
- **CODE-05 · MEDIUM** — No client-side validation (no Zod import) on major forms: `src/pages/expenses/ExpenseModal.jsx:41-49`, `src/pages/classes/components/EditClassModal.jsx`, `src/pages/messaging/components/announcements/AnnouncementForm.jsx`, `src/pages/settings/UserManagement.jsx:116-121` — the latter enforces a **5-character minimum password** for user resets. **Fix:** schemas in `validators/` + raise password policy.
- **CODE-06 · MEDIUM** — `src/pages/academics/CBSEReportCardPage.jsx:95-132` — Index-as-key on a removable, editable subject-marks list with `removeSubject(i)` — deleting a middle row corrupts identity/focus of rows below. **Fix:** stable per-row id. (Most other `key={i}` hits are static skeleton loops.)
- **CODE-07 · MEDIUM** — `src/pages/settings/CommunicationSettings.jsx:159` · `src/pages/settings/AttendanceRules.jsx:132` — Components defined inside a component body (`const SectionHeader = …`) — the subtree unmounts/remounts on every parent state change. **Fix:** hoist to module scope.
- **CODE-08 · MEDIUM** — ESLint (default level): **90 `react-hooks/exhaustive-deps`** warnings (e.g. `ChatNotificationContext.jsx:146`, `useNavHover.js:53,59,148`, CommandPalette `:265-267`), **315 `no-unused-vars`**, **51 `no-shadow`**. **Fix:** burn down deps warnings first (several are real staleness bugs).
- **CODE-10 · MEDIUM** — 15 root-level shim files in `src/components/` (`ConfirmDialog.jsx`, `StatCard.jsx`, `CameraView.jsx`, `FormInput.jsx`, `ErrorBoundary.jsx`, …) are one-line re-exports with zero importers (migration leftovers); `ReportCardTemplate.jsx` + `ui/GuidedTour.jsx` are styleguide-only. **Fix:** delete shims; decide ship-or-cut for the other two.
- **CODE-11 · MEDIUM** — **196 test/debug artifacts tracked in git at the app root:** `master-test/` (162 files), `playwright-report-master/` (32 files, ~30 MB), `test-results-master/`, `AI_PANEL_EXAMPLES.jsx`, `package.test.json`, `debug-classes.html`, `test-student-dashboard.js`, `test-section-validation.js`, `fix-vite-cache.{sh,bat}`, `test-console-errors.{sh,bat}`. `.gitignore` misses the `-master` variants. **Fix:** gitignore + `git rm --cached`.
- **CODE-09 · LOW** — 8 raw `console.*` calls in `src/pages/reports/` bypass the central redacting logger (everything else is clean), and `vite.config.js:98` has no `drop`/`pure` config so console calls ship in production builds. **Fix:** swap to `logger.error`; add esbuild `drop: ['console','debugger']`.
- **CODE-12 · LOW** — Stale planning docs at app root (`STAFF_MODULE_REMAINING_ISSUES.md`, `STUDENT_MODULE_REMAINING_ISSUES.md`, `TEST_AUDIT_REPORT.md`) — most items fixed; the open ones are BRK-10, STUB-10, and the PIN-lookup race (`PersonalInfoStep.jsx:50-66`, unaborted in-flight lookup can overwrite city/state). **Fix:** archive docs; track the 3 open items here.
- **CODE-13 · LOW** — Student Zod validation lives in `src/pages/students/utils/studentFormValidation.js` instead of `src/validators/`. **Fix:** move for discoverability.
- **CODE-14 · LOW** — `src/i18n/locales/en.json:3645-3646,3749,3971` — Orphaned "coming soon" strings referenced by no component. **Fix:** prune.

---

## 10. Design System & UI States (DS)

#### DS-01 · HIGH · ParentManagement: text-only loading, missing error state — failures masquerade as "no data"
- **Where:** `src/pages/settings/ParentManagement.jsx:233-236` (loading) · `:60-62` (error swallowed)
- **What:** Loading renders a text cell; a failed fetch only logs, then the UI shows "No parent accounts found" — telling admins their parent accounts vanished when the API merely failed.
- **Fix:** `SkeletonTable` + `ErrorState` with retry.

#### DS-02 · HIGH · PayrollSettings has no loading or error UI on initial fetch
- **Where:** `src/pages/settings/PayrollSettings.jsx:317-355` (fetch) · `:501` (initialLoad only disables one button)
- **What:** Defaults render while fetching; a failed fetch is silently swallowed, leaving stale defaults the admin may re-save.
- **Fix:** Skeleton on `initialLoad`, ErrorState on failure.

#### DS-07 · HIGH · 463 raw Tailwind palette classes in 66 files bypass the status tokens
- **Where:** systemic — worst: `src/pages/staffs/components/StaffDocumentsTab.jsx` (28, e.g. `:208`), `src/pages/messaging/CommunicationLogs.jsx` (22), `src/pages/academics/ExamDetail.jsx` (22)
- **What:** `bg-green-50`, `text-red-500`, hand-rolled `dark:` variants — the semantic tokens (`--ok/--warn/--danger`, `src/styles/tokens.css:88-96`) already solve this.
- **Fix:** Codemod to token utilities.

- **DS-03 · MEDIUM** — `src/pages/settings/DataToolsSettings.jsx:165-168` — No loading skeleton or error state for backups/GDPR tables. **Fix:** wrap tab bodies in skeleton/error states.
- **DS-04 · MEDIUM** — Spinner-as-loading (explicit "no spinners" violation): `src/pages/intake-forms/FormSubmissions.jsx:205`, `FormAssignments.jsx:259`, `src/pages/students/StudentFormSubmissions.jsx:320`, `src/pages/settings/CommunicationSettings.jsx:510` — all pass `loadingContent={<Spinner/>}` to HeroUI Table. **Fix:** `SkeletonTable` as `loadingContent`.
- **DS-05 · MEDIUM** — `src/pages/calendar/index.jsx:47-48,309-310` — Loading flags wired only to the sidebar; Month/Week/Day views render "no events" while events are still loading (zero skeleton in all view components). **Fix:** pass loading down and shimmer grid cells.
- **DS-08 · MEDIUM** — 224 arbitrary Tailwind values (excl. styleguide): `w-[260px]`, `h-[50vh]`, `translate-x-[18px]` (`src/pages/settings/index.jsx:202,284,297,411`); even ui primitives (`src/components/ui/ActivityFeed.jsx:105,211`). Dominant pattern is `text-[10px]/text-[11px]` — adding a `text-2xs` token would eliminate ~half. **Fix:** add the type token + sweep.
- **DS-09 · MEDIUM** — 1,212 inline `style={{}}` occurrences (excl. styleguide); two composers use style objects as their primary stylesheet: `src/pages/students/components/modals/StudentImportModals.jsx` (105) and `src/pages/students/AddStudentComposer.jsx` (76). **Fix:** utilities / CSS atoms.
- **DS-10 · MEDIUM** — `src/components/ui/HelpIcon.jsx:66-67,102-121,147,162` — A design-system primitive hardcodes 11 hex colors and applies hover by mutating `e.currentTarget.style` — breaks dark theme; keyboard focus gets no equivalent affordance. **Fix:** tokens + CSS `:hover`/`:focus-visible`.
- **DS-11 · MEDIUM** — `src/pages/settings/ParentManagement.jsx:327-376` — Hand-rolled modal AND drawer (`fixed inset-0` divs): no focus trap, no ESC, no `role="dialog"`, no scroll lock; plus a hand-rolled table (`:218-300`) instead of `DataTable`. Single worst design-system offender. **Fix:** rebuild on Modal/Drawer/DataTable.
- **DS-12 · MEDIUM** — `src/pages/audit-logs/index.jsx:347-360` — Hand-rolled mobile slide-over (has dialog role but no focus trap/ESC; inline rgba background). **Fix:** use the `Drawer` primitive.
- **DS-06 · LOW** — Inline spinners inside otherwise-compliant pages: `src/pages/classes/Attendance.jsx:501-502`, `src/pages/fees/Refunds.jsx:644-645,1035`, `src/pages/settings/UserManagement.jsx:426`, `src/pages/messaging/EmailCampaignsPage.jsx:429`, "Loading…" header descriptions in audit-logs/StaffList/StudentsList. **Fix:** skeleton variants.
- **DS-13 · LOW** — Local re-implementations of existing primitives: `Dashboard.jsx:152` (EmptyState), `CommunicationLogs.jsx:33` (StatCard), `IA.jsx:221` (StatusBadge), `ClassesPage.jsx:361-376` (Field). **Fix:** consolidate.
- **DS-14 · LOW** — Hand-rolled `animate-pulse` skeleton stacks in ~10 pages (e.g. `ActiveSessions.jsx:97-109`, `ExamDetailModal.jsx:78-86`, `StaffSidebar.jsx:132`) instead of the `Skeleton` primitive. **Fix:** swap in primitive.
- **DS-15 · LOW** — Remaining hex usage (70 occurrences/16 files) is almost all print/export HTML templates + the pre-React error page — defensible, but centralize a print palette. **Fix:** shared print-palette constants.

---

## 11. Accessibility (A11Y)

- **A11Y-01 · MEDIUM** — `src/pages/academics/ResultsEntryModal.jsx:340-348,378` — Per-student marks `<input type="number">` has only a placeholder — no label association, repeated per row; screen-reader users can't tell whose marks they're editing. **Fix:** `aria-label={\`Marks for ${student.name}\`}` (CCEGradingPage `:256-262` already does this — copy it).
- **A11Y-02 · MEDIUM** — Overlays that bypass the Modal/Drawer primitives lose the focus trap entirely: `ParentManagement.jsx:327,354` (no role/trap/ESC), `audit-logs/index.jsx:347` (role, no trap). Same fix as DS-11/12.
- **A11Y-03 · LOW** — The only 3 unlabeled icon-only buttons app-wide: `ChatSearch.jsx:97`, `ReplyPreview.jsx:44`, `CameraView.jsx:337` (all `<X/>` close buttons) + the `×` text-glyph remove button at `CBSEReportCardPage.jsx:128-132` (announced as "multiplication sign"). **Fix:** `aria-label`.
- **A11Y-04 · LOW** — `src/components/ui/HelpIcon.jsx:114-121` — Hover affordance is JS-mouse-only; keyboard focus gets nothing (see DS-10; same fix).

---

## 12. Internationalization (I18N)

#### I18N-01 · HIGH · i18n is real but stops at ~68% of pages — 104 files are hardcoded English
- **Where:** systemic — whole modules untranslated: data-tools (all 7 files), expenses (`ExpensesPage.jsx:233-299`), audit-logs (4 files), `DataToolsSettings.jsx:174-192`, `Dashboard.jsx:586` (greeting); mixed files like `CBSEReportCardPage.jsx:84`
- **What:** The setup is production-grade (6 languages, lazy locales, RTL Urdu, real Hindi translations — verified not copies), but 104 of 390 page files never call `useTranslation`. A Hindi-language school gets a mixed-language UI on every one of those screens — the 5 non-English locales are false advertising until finished.
- **Fix:** Finish the 104 files module-by-module (data-tools, expenses, audit-logs first).

---

## Cross-cutting recommendations

These seven moves resolve dozens of the issues above at once:

1. **Wire or remove the four dead backend surfaces** — inventory mount, email-campaigns mount, data-tools paths, data-cleanup paths (BRK-01..05). One short backend PR turns three "100% broken" modules back on.
2. **Stop showing fiction** — replace or hide the fabricated Dashboard widgets and the synthesized Classes Today board (MOCK-01..07); remove every "success toast, no API call" stub (STUB-01..03). These are the issues that destroy user trust fastest in a paid product.
3. **Adopt one data-fetching standard** — a shared TanStack-Query-based `usePaginatedQuery` + `PageShell` per module (CODE-03) fixes the stale-list bugs, the keystroke-fetch races, the four-state violations, and most of MEM-17 as a side effect.
4. **Make pagination server-side on the big six** — fees payments, students, announcements, homework, exams, chat history (PAG-01, 04..10) — and return pagination in response bodies, not headers.
5. **Memoize the context layer** — `useMemo`/`useCallback` on the six providers + split `useApp()` consumers onto focused hooks + cap `feePayments` (PERF-01..07). This is the difference between the app staying snappy at 4 PM vs. degrading all day.
6. **Media-stream cleanup discipline** — one shared `useMediaStream` hook that guarantees track-stop on unmount would fix MEM-01..05 and prevent recurrence.
7. **Repo hygiene pass** — delete dead files (TimetableWizardModal, socketService, shims, VoiceMessageRecorder), un-track the 196 test artifacts and `.env*`, gate `/ia` + `/style-guide` to dev, strip consoles in build (CODE-02,09,10,11; STUB-14; SEC-04..06).

---

## Appendix — method & coverage

- **Agents:** 6 parallel deep-audit agents (security / mock-data / memory / pagination / broken-pages / code-quality), each instructed to verify findings by reading full code context, never grep alone. ~650 tool invocations total across the agents; all 22 page modules covered by each relevant agent.
- **Cross-checks:** ~320 unique frontend endpoint strings checked against 1,027 backend route definitions in ~85 route files + all `server.js` mounts; ~110 frontend routes and all 44 lazy imports verified; Express route-order audited on 10 files with `/:id` shadowing risk (1 real bug: BRK-08).
- **Manual verification:** every CRITICAL finding spot-checked by reading the cited lines directly (all confirmed accurate).
- **Build/lint evidence:** `vite build` ✅ (5.47s, chunk-size warning on the 651 KB main chunk); `eslint --quiet` ✅ 0 errors; 90 hook-deps + 315 unused-vars + 51 shadow warnings at default level.
- **Out of scope:** backend-only logic audit (only touched where the frontend depends on it), mobile apps, owlin-server, E2E test health.
